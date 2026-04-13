---
name: setup-secure-storage
description: Set up expo-secure-store for storing sensitive data (tokens, keys) in a React Native + Expo app with a typed, async-safe wrapper. Use when implementing auth token storage or any sensitive key-value persistence.
license: MIT
---

Set up `expo-secure-store` for secure key-value storage.

## Install

```bash
npx expo install expo-secure-store
```

## Typed wrapper (`src/lib/secureStorage.ts`)

```ts
import * as SecureStore from 'expo-secure-store'

const KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_ID: 'user_id',
} as const

type StorageKey = typeof KEYS[keyof typeof KEYS]

export const secureStorage = {
  async get(key: StorageKey): Promise<string | null> {
    return SecureStore.getItemAsync(key)
  },

  async set(key: StorageKey, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    })
  },

  async remove(key: StorageKey): Promise<void> {
    await SecureStore.deleteItemAsync(key)
  },

  async clear(): Promise<void> {
    await Promise.all(Object.values(KEYS).map(key => SecureStore.deleteItemAsync(key)))
  },
}

export { KEYS as StorageKeys }
```

## Auth token helpers (`src/lib/authTokens.ts`)

```ts
import { secureStorage, StorageKeys } from './secureStorage'

export async function saveTokens(access: string, refresh: string): Promise<void> {
  await Promise.all([
    secureStorage.set(StorageKeys.ACCESS_TOKEN, access),
    secureStorage.set(StorageKeys.REFRESH_TOKEN, refresh),
  ])
}

export async function getAccessToken(): Promise<string | null> {
  return secureStorage.get(StorageKeys.ACCESS_TOKEN)
}

export async function getRefreshToken(): Promise<string | null> {
  return secureStorage.get(StorageKeys.REFRESH_TOKEN)
}

export async function clearTokens(): Promise<void> {
  await secureStorage.clear()
}
```

## HTTP client integration (`src/lib/apiClient.ts`)

```ts
import axios from 'axios'
import { getAccessToken, saveTokens, clearTokens, getRefreshToken } from './authTokens'

export const apiClient = axios.create({ baseURL: process.env.EXPO_PUBLIC_API_URL })

// Attach token to every request
apiClient.interceptors.request.use(async config => {
  const token = await getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh on 401
apiClient.interceptors.response.use(
  res => res,
  async error => {
    if (error.response?.status !== 401) return Promise.reject(error)
    try {
      const refresh = await getRefreshToken()
      const { data } = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/auth/refresh`, { refresh })
      await saveTokens(data.accessToken, data.refreshToken)
      error.config.headers.Authorization = `Bearer ${data.accessToken}`
      return apiClient(error.config)
    } catch {
      await clearTokens()
      // Navigate to login — use a navigation ref or state management
      return Promise.reject(error)
    }
  },
)
```

## Rules
- **Never** store tokens in `AsyncStorage` — it is unencrypted
- **Never** store tokens in memory-only state — lost on app restart
- `WHEN_UNLOCKED_THIS_DEVICE_ONLY` — tokens not backed up to iCloud/Google, not accessible on locked device
- All SecureStore calls are async — always `await`, never fire-and-forget
- On logout, `clearTokens()` before navigating away
