---
name: setup-push-notifications
description: Set up Expo push notifications — permission request, token registration, foreground/background handlers, and sending via Expo Push API. Use when adding push notifications to a React Native + Expo app.
license: MIT
---

Set up Expo push notifications.

## Install

```bash
npx expo install expo-notifications expo-device expo-constants
```

## Notification service (`src/lib/notifications.ts`)

```ts
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { Platform } from 'react-native'

// How notifications appear when app is in the FOREGROUND
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device')
    return null
  }

  // Android: create notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    })
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    return null // user denied — handle gracefully in UI
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId
  const token = await Notifications.getExpoPushTokenAsync({ projectId })
  return token.data
}

export function addNotificationReceivedListener(
  handler: (notification: Notifications.Notification) => void,
) {
  return Notifications.addNotificationReceivedListener(handler)
}

export function addNotificationResponseListener(
  handler: (response: Notifications.NotificationResponse) => void,
) {
  return Notifications.addNotificationResponseReceivedListener(handler)
}
```

## Hook (`src/hooks/usePushNotifications.ts`)

```ts
import { useEffect, useRef, useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import * as Notifications from 'expo-notifications'
import {
  registerForPushNotifications,
  addNotificationReceivedListener,
  addNotificationResponseListener,
} from '@/lib/notifications'
import { useAuth } from './useAuth'
import { apiClient } from '@/lib/apiClient'

export function usePushNotifications() {
  const [token, setToken] = useState<string | null>(null)
  const navigation = useNavigation()
  const { isAuthenticated } = useAuth()
  const receivedSub = useRef<Notifications.Subscription>()
  const responseSub = useRef<Notifications.Subscription>()

  useEffect(() => {
    if (!isAuthenticated) return

    registerForPushNotifications().then(async (expoPushToken) => {
      if (!expoPushToken) return
      setToken(expoPushToken)
      // Register token with your backend
      await apiClient.post('/devices/push-token', { token: expoPushToken })
    })

    // Foreground notification received
    receivedSub.current = addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification)
    })

    // User tapped a notification
    responseSub.current = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data
      // Navigate to relevant screen based on data
      if (data?.screen) {
        navigation.navigate(data.screen as never, data.params as never)
      }
    })

    return () => {
      receivedSub.current?.remove()
      responseSub.current?.remove()
    }
  }, [isAuthenticated])

  return { token }
}
```

## Mount in root layout

```tsx
// app/_layout.tsx or App.tsx
export default function RootLayout() {
  usePushNotifications() // Register once at app root
  return <Stack />
}
```

## Sending via Expo Push API (backend)

```ts
// Node.js backend example
const message = {
  to: expoPushToken,
  sound: 'default',
  title: 'New message',
  body: 'You have a new message from Alice',
  data: { screen: 'Chat', params: { conversationId: '123' } },
}
await fetch('https://exp.host/--/api/v2/push/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(message),
})
```

## Rules
- Always check `Device.isDevice` — simulators cannot receive push notifications
- Handle **permission denied** gracefully — never assume permission is granted
- Store and send the Expo push token to your backend **after** the user authenticates
- Background notifications handled by the OS — no JS code needed
- Deep-link navigation from notification tap via `addNotificationResponseReceivedListener`
- **Never** store push tokens without associating them to a user — prevents orphaned tokens
