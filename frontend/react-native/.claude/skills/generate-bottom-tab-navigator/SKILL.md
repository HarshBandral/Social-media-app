---
name: generate-bottom-tab-navigator
description: Scaffold a typed React Navigation bottom tab navigator with icons, badge support, and typed screen params. Use when adding or restructuring bottom tab navigation in a React Native + Expo app.
license: MIT
---

Scaffold the bottom tab navigator.

## Install

```bash
npx expo install @react-navigation/bottom-tabs @react-navigation/native react-native-screens react-native-safe-area-context @expo/vector-icons
```

## Navigation types (`src/navigation/types.ts`)

```ts
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import type { CompositeScreenProps } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'

// Root stack wraps everything (allows modals over tabs)
export type RootStackParamList = {
  Tabs: undefined
  Modal: { title: string; content: string }
}

// Tab navigator screens
export type TabParamList = {
  Home: undefined
  Search: { initialQuery?: string }
  Notifications: undefined
  Profile: undefined
}

// Helper types for screen props
export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>

export type TabScreenProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  RootStackScreenProps<'Tabs'>
>

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
```

## Tab navigator (`src/navigation/TabNavigator.tsx`)

```tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import type { ComponentProps } from 'react'
import type { TabParamList } from './types'
import HomeScreen from '@/screens/HomeScreen'
import SearchScreen from '@/screens/SearchScreen'
import NotificationsScreen from '@/screens/NotificationsScreen'
import ProfileScreen from '@/screens/ProfileScreen'
import { useNotificationCount } from '@/hooks/useNotificationCount'

const Tab = createBottomTabNavigator<TabParamList>()

type IoniconName = ComponentProps<typeof Ionicons>['name']

const TAB_ICONS: Record<keyof TabParamList, { focused: IoniconName; unfocused: IoniconName }> = {
  Home:          { focused: 'home',          unfocused: 'home-outline' },
  Search:        { focused: 'search',        unfocused: 'search-outline' },
  Notifications: { focused: 'notifications', unfocused: 'notifications-outline' },
  Profile:       { focused: 'person',        unfocused: 'person-outline' },
}

export function TabNavigator() {
  const unreadCount = useNotificationCount()

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name as keyof TabParamList]
          return (
            <Ionicons
              name={focused ? icons.focused : icons.unfocused}
              size={size}
              color={color}
            />
          )
        },
        tabBarActiveTintColor: '#0070f3',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: { borderTopWidth: 1, borderTopColor: '#e5e7eb' },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ tabBarBadge: unreadCount > 0 ? unreadCount : undefined }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}
```

## Root navigator (`src/navigation/RootNavigator.tsx`)

```tsx
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import type { RootStackParamList } from './types'
import { TabNavigator } from './TabNavigator'
import ModalScreen from '@/screens/ModalScreen'

const Stack = createNativeStackNavigator<RootStackParamList>()

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
        <Stack.Screen
          name="Modal"
          component={ModalScreen}
          options={{ presentation: 'modal' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
```

## Using typed screen props in a tab screen

```tsx
import type { TabScreenProps } from '@/navigation/types'

type Props = TabScreenProps<'Search'>

export default function SearchScreen({ route, navigation }: Props) {
  const { initialQuery } = route.params ?? {}
  // ...
}
```

## Rules
- Always type `TabParamList` — never use `any` for route params
- `headerShown: false` on the tab navigator — the root stack handles headers for modal flows
- Tab badge: `tabBarBadge` accepts `number | string | undefined` — pass `undefined` to hide
- **Lazy loading** is the default in React Navigation — screens mount only when first visited
- Keep navigator files in `src/navigation/` — screens in `src/screens/`
- Modals presented over tabs go in the root stack, not the tab navigator
