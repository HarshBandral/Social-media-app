---
name: generate-screen
description: Scaffold a new React Native screen with typed navigation props, StyleSheet, and a co-located RNTL test file. Use when adding a new screen to a React Native + Expo app.
license: MIT
---

Scaffold a new React Native screen for `<ScreenName>`.

## Step 1 — Add to navigation types (`src/navigation/types.ts`)

```ts
export type RootStackParamList = {
  // existing screens…
  <ScreenName>: { id?: string } // adjust params as needed
}
```

## Screen file (`src/screens/<ScreenName>Screen.tsx`)

```tsx
import { StyleSheet, Text, View, FlatList, ActivityIndicator } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '@/navigation/types'

type Props = NativeStackScreenProps<RootStackParamList, '<ScreenName>'>

export default function <ScreenName>Screen({ navigation, route }: Props) {
  // const { id } = route.params  ← access typed params

  return (
    <View style={styles.container}>
      <Text style={styles.title}><ScreenName></Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
})
```

### Rules for screen components
- Always `StyleSheet.create()` — no inline style objects `style={{ }}`
- Use `FlatList` for any list — never `ScrollView` + `map`
- `Pressable` for tap targets — not `TouchableOpacity`
- Every interactive element has `accessible` + `accessibilityLabel`
- Data fetching: use React Query `useQuery` hook — no `useEffect` + `fetch`
- Never navigate with `navigation.navigate` inside `useEffect` — use event handlers

## Data fetching (if screen loads data)

```tsx
import { useQuery } from '@tanstack/react-query'
import { get<Resource> } from '@/services/<resource>.service'

const { data, isLoading, error } = useQuery({
  queryKey: ['<resource>', route.params.id],
  queryFn: () => get<Resource>(route.params.id!),
  enabled: !!route.params.id,
})

if (isLoading) return <ActivityIndicator style={styles.loader} />
if (error) return <Text>Something went wrong</Text>
```

## Test file (`src/screens/__tests__/<ScreenName>Screen.test.tsx`)

```tsx
import { render, screen } from '@testing-library/react-native'
import { NavigationContainer } from '@react-navigation/native'
import <ScreenName>Screen from '../<ScreenName>Screen'

const mockNavigate = jest.fn()
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate }),
}))

describe('<ScreenName>Screen', () => {
  const renderScreen = () =>
    render(
      <NavigationContainer>
        <<ScreenName>Screen
          navigation={{ navigate: mockNavigate } as any}
          route={{ params: {} } as any}
        />
      </NavigationContainer>,
    )

  it('renders the title', () => {
    renderScreen()
    expect(screen.getByText('<ScreenName>')).toBeTruthy()
  })
})
```

After generating, list which navigator the screen should be registered in and any params the caller must provide.
