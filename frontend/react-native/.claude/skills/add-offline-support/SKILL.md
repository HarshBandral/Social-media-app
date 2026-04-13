---
name: add-offline-support
description: Add offline support to a React Native screen — network state detection, React Query persistence with AsyncStorage, optimistic updates, and offline-aware UI. Use when users need the app to work without an internet connection.
license: MIT
---

Add offline support for the target feature.

## Install

```bash
npx expo install @react-native-community/netinfo @tanstack/react-query-persist-client @tanstack/async-storage-persister @react-native-async-storage/async-storage
```

## Step 1 — Network state hook (`src/hooks/useNetworkStatus.ts`)

```ts
import { useEffect, useState } from 'react'
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo'

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(null)

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsOnline(state.isConnected ?? false)
      setIsInternetReachable(state.isInternetReachable)
    })
    return unsubscribe
  }, [])

  return { isOnline, isInternetReachable }
}
```

## Step 2 — Persist React Query cache (`src/lib/queryClient.ts`)

```ts
import { QueryClient } from '@tanstack/react-query'
import { createAsyncStoragePersister } from '@tanstack/async-storage-persister'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,   // 5 min
      gcTime: 1000 * 60 * 60 * 24, // persist for 24h
      networkMode: 'offlineFirst', // serve cache even when offline
      retry: (failureCount, error: any) => {
        if (error?.status === 404 || error?.status === 401) return false
        return failureCount < 3
      },
    },
    mutations: {
      networkMode: 'offlineFirst',
    },
  },
})

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'react-query-cache',
  throttleTime: 1000,
})
```

## Step 3 — Wrap app with PersistQueryClientProvider (`App.tsx` or `_layout.tsx`)

```tsx
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { queryClient, asyncStoragePersister } from '@/lib/queryClient'

export default function RootLayout() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister }}
    >
      <Stack />
    </PersistQueryClientProvider>
  )
}
```

## Step 4 — Offline-aware screen

```tsx
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { useItems } from '@/hooks/useItems'

export default function ItemsScreen() {
  const { isOnline } = useNetworkStatus()
  const { data, isLoading, isFetching } = useItems()

  return (
    <View style={styles.container}>
      {!isOnline && (
        <View style={styles.offlineBanner} accessibilityRole="alert">
          <Text style={styles.offlineText}>You're offline — showing cached data</Text>
        </View>
      )}
      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ItemRow item={item} />}
        />
      )}
    </View>
  )
}
```

## Step 5 — Optimistic mutation

```ts
export function useCreateItem() {
  return useMutation({
    mutationFn: createItem,
    onMutate: async (newItem) => {
      await queryClient.cancelQueries({ queryKey: itemKeys.lists() })
      const snapshot = queryClient.getQueryData(itemKeys.lists())

      // Optimistically add to cache
      queryClient.setQueryData(itemKeys.lists(), (old: Item[] = []) => [
        { ...newItem, id: `temp-${Date.now()}`, createdAt: new Date().toISOString() },
        ...old,
      ])

      return { snapshot } // for rollback
    },
    onError: (_err, _newItem, context) => {
      // Rollback on failure
      queryClient.setQueryData(itemKeys.lists(), context?.snapshot)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() })
    },
  })
}
```

## Rules
- `networkMode: 'offlineFirst'` serves cached data without triggering network errors
- Always show an **offline banner** — users need to know their data may be stale
- Optimistic updates need **rollback** in `onError` — always save a snapshot in `onMutate`
- Cache `gcTime` of **24h** ensures data persists across app restarts while offline
- `retry` skips retrying 404/401 responses — only network failures should retry
- Never block the UI waiting for a network response — always render cached data immediately
