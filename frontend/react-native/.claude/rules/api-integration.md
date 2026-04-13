---
paths:
  - "src/services/**/*.ts"
  - "src/hooks/use*Query*.ts"
  - "src/hooks/use*Mutation*.ts"
---

# React Native API Integration Rules

## Service Layer Pattern

```typescript
// src/services/client.ts
import axios from 'axios';
import { getSecureValue } from '@/utils/secureStorage';

export const client = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use(async (config) => {
  const token = await getSecureValue('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  res => res,
  async (err) => {
    if (axios.isAxiosError(err) && err.response?.status === 401) {
      await deleteSecureValue('auth_token');
      // Signal auth store to log out
    }
    return Promise.reject(err);
  }
);
```

## Secure Storage (Tokens)

```typescript
// src/utils/secureStorage.ts
import * as SecureStore from 'expo-secure-store';

export async function getSecureValue(key: string): Promise<string | null> {
  return SecureStore.getItemAsync(key);
}

export async function setSecureValue(key: string, value: string): Promise<void> {
  return SecureStore.setItemAsync(key, value, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED,
  });
}

export async function deleteSecureValue(key: string): Promise<void> {
  return SecureStore.deleteItemAsync(key);
}
```

## Result Type

```typescript
// src/types/result.ts
export type Result<T, E = ApiError> =
  | { ok: true; data: T }
  | { ok: false; error: E };

export interface ApiError {
  message: string;
  code: string;
  status: number;
}
```

## Service Template

```typescript
// src/services/userService.ts
import { client } from './client';
import type { Result } from '@/types/result';
import type { User } from '@/types';

export async function fetchCurrentUser(): Promise<Result<User>> {
  try {
    const { data } = await client.get<User>('/me');
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: normalizeAxiosError(err) };
  }
}
```

## React Query Hook

```typescript
// src/hooks/useCurrentUser.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCurrentUser, updateUser } from '@/services/userService';

export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const result = await fetchCurrentUser();
      if (!result.ok) throw result.error;
      return result.data;
    },
    staleTime: 10 * 60 * 1000,
    retry: (failureCount, error: ApiError) =>
      error.status !== 401 && failureCount < 2,
  });
}
```

## Offline Awareness

```typescript
import NetInfo from '@react-native-community/netinfo';

export async function checkConnectivity(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return state.isConnected === true && state.isInternetReachable === true;
}

// In service function
export async function syncData(): Promise<Result<void>> {
  const online = await checkConnectivity();
  if (!online) return { ok: false, error: { message: 'No internet connection', code: 'OFFLINE', status: 0 } };
  // proceed with request
}
```

## Rules

1. **`expo-secure-store`** for tokens and sensitive data — never `AsyncStorage` unencrypted
2. **`EXPO_PUBLIC_*`** env vars for API URLs — never hardcoded
3. **Result<T>** pattern — never throw from service functions
4. **React Query** for server state — never store API responses in component state
5. **Offline check** before requests that can't be queued — surface error to user
6. **Retry logic**: don't retry 401s; retry network errors max 2x
7. **Centralize auth token** management in client interceptor — not per-request
