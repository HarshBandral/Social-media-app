---
name: write-tests
description: Write React Native Testing Library (RNTL) tests for screens and components, including navigation mocks and native module stubs. Use when adding test coverage to a React Native + Expo project.
license: MIT
---

Write RNTL tests for the target React Native component or screen.

## Setup — `src/__mocks__/setup.ts` (run once, already in jest config)

```ts
// Mock Expo modules that aren't available in Jest
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}))

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
  useRoute: () => ({ params: {} }),
}))
```

## Component test

```tsx
import { render, screen, fireEvent } from '@testing-library/react-native'
import MyComponent from '../MyComponent'

describe('MyComponent', () => {
  it('renders the title', () => {
    render(<MyComponent title="Hello" />)
    expect(screen.getByText('Hello')).toBeTruthy()
  })

  it('calls onPress when button tapped', () => {
    const onPress = jest.fn()
    render(<MyComponent onPress={onPress} />)
    fireEvent.press(screen.getByRole('button'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })
})
```

## Screen test (with NavigationContainer)

```tsx
import { render, screen, waitFor } from '@testing-library/react-native'
import { NavigationContainer } from '@react-navigation/native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import MyScreen from '../MyScreen'

const mockNavigate = jest.fn()
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate }),
}))

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <QueryClientProvider client={qc}>
      <NavigationContainer>{children}</NavigationContainer>
    </QueryClientProvider>
  )
}

describe('MyScreen', () => {
  it('shows loading indicator initially', () => {
    render(<MyScreen />, { wrapper })
    expect(screen.getByTestId('loading-indicator')).toBeTruthy()
  })

  it('shows items after loading', async () => {
    render(<MyScreen />, { wrapper })
    await waitFor(() =>
      expect(screen.getByText('Item A')).toBeTruthy()
    )
  })
})
```

## Async hook test (React Query)

```ts
import { renderHook, waitFor } from '@testing-library/react-native'
import { useItems } from '../useItems'

jest.mock('@/services/items.service', () => ({
  getItems: jest.fn().mockResolvedValue([{ id: '1', name: 'Item A' }]),
}))

it('returns items after fetching', async () => {
  const { result } = renderHook(() => useItems(), { wrapper })
  await waitFor(() => expect(result.current.isSuccess).toBe(true))
  expect(result.current.data).toEqual([{ id: '1', name: 'Item A' }])
})
```

## Rules
- Use `screen.getByText` / `getByRole` — prefer over `getByTestId`
- `fireEvent.press` for tap — not simulated touch events
- Wrap async assertions in `waitFor` — never rely on timing
- Mock native modules in `__mocks__` — never skip them (they crash Jest)
- Each test file cleans up with `jest.clearAllMocks()` in `beforeEach`
