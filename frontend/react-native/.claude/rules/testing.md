---
paths:
  - "src/**/*.test.tsx"
  - "src/**/*.test.ts"
  - "e2e/**/*.ts"
---

# React Native Testing Rules

## Component Test Template

```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import Button from './index';

describe('Button', () => {
  it('renders label', () => {
    render(<Button label="Submit" onPress={jest.fn()} />);
    expect(screen.getByText('Submit')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const handlePress = jest.fn();
    render(<Button label="Submit" onPress={handlePress} />);
    fireEvent.press(screen.getByText('Submit'));
    expect(handlePress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const handlePress = jest.fn();
    render(<Button label="Submit" onPress={handlePress} disabled />);
    fireEvent.press(screen.getByText('Submit'));
    expect(handlePress).not.toHaveBeenCalled();
  });

  it('shows loading text when loading', () => {
    render(<Button label="Submit" onPress={jest.fn()} loading />);
    expect(screen.getByText('Loading...')).toBeTruthy();
  });
});
```

## Screen Test with Navigation Mock

```tsx
import { render, screen } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import ProfileScreen from './index';

const mockNavigation = {
  navigate: jest.fn(),
  setOptions: jest.fn(),
  goBack: jest.fn(),
};

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => mockNavigation,
}));

describe('ProfileScreen', () => {
  it('renders user name when loaded', async () => {
    // mock useUser hook
    jest.mock('@/hooks/useUser', () => ({
      useUser: () => ({ data: { name: 'Alice' }, isLoading: false, error: null }),
    }));

    render(
      <NavigationContainer>
        <ProfileScreen route={{ params: { userId: '1' } } as any} navigation={mockNavigation as any} />
      </NavigationContainer>
    );

    expect(await screen.findByText('Alice')).toBeTruthy();
  });
});
```

## Mocking Native Modules

```typescript
// __mocks__/expo-secure-store.ts
export const getItemAsync = jest.fn().mockResolvedValue(null);
export const setItemAsync = jest.fn().mockResolvedValue(undefined);
export const deleteItemAsync = jest.fn().mockResolvedValue(undefined);
```

```typescript
// jest.setup.ts
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn().mockResolvedValue({ isConnected: true, isInternetReachable: true }),
}));

jest.mock('expo-secure-store');
jest.mock('expo-font');
jest.mock('expo-asset');
```

## Detox E2E Test Template

```typescript
// e2e/login.test.ts
describe('Login flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should log in with valid credentials', async () => {
    await element(by.id('email-input')).typeText('alice@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();
    await expect(element(by.id('home-screen'))).toBeVisible();
  });

  it('should show error with invalid credentials', async () => {
    await element(by.id('email-input')).typeText('wrong@example.com');
    await element(by.id('password-input')).typeText('wrongpassword');
    await element(by.id('login-button')).tap();
    await expect(element(by.text('Invalid credentials'))).toBeVisible();
  });
});
```

## Rules

1. **Mock all native modules** — `jest.mock()` for `expo-*`, `@react-native-*` modules
2. **`testID` props** for Detox selectors — use `data-testid` convention: `testID="login-button"`
3. **`NavigationContainer` wrapper** for screen tests that use navigation hooks
4. **Mock hooks at module level** — not inline per test
5. **Detox for critical flows** — login, checkout, onboarding; Jest for component behavior
6. **`fireEvent.press`** for taps in RTL — not `fireEvent.click`
7. **Snapshot tests only for design system primitives** — not for logic-heavy screens
