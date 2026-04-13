# React Native Project — Claude Code Instructions

## Build & Dev Commands

- **Install**: `npm install`
- **Start Metro**: `npx expo start` or `npx react-native start`
- **iOS**: `npx expo run:ios` or `npx react-native run-ios`
- **Android**: `npx expo run:android` or `npx react-native run-android`
- **Type check**: `npx tsc --noEmit`
- **Lint**: `npm run lint`
- **Format**: `npm run format`
- **Test**: `npm test`
- **Test (coverage)**: `npm test -- --coverage`
- **E2E (Detox)**: `npx detox test`
- **Build iOS (EAS)**: `eas build --platform ios`
- **Build Android (EAS)**: `eas build --platform android`

## Project Structure

```
src/
├── components/             # Reusable UI components
│   └── Button/
│       ├── index.tsx
│       └── Button.test.tsx
├── screens/                # Full-screen components (one per route)
│   └── HomeScreen/
│       ├── index.tsx
│       └── HomeScreen.test.tsx
├── navigation/             # React Navigation config
│   ├── RootNavigator.tsx
│   ├── AppNavigator.tsx    # Authenticated stack
│   ├── AuthNavigator.tsx   # Unauthenticated stack
│   └── types.ts            # Navigation param list types
├── hooks/                  # Custom React hooks
├── services/               # API clients and external service wrappers
├── store/                  # Global state (Redux Toolkit or Zustand)
├── utils/                  # Pure helper functions
├── types/                  # Shared TypeScript types
├── constants/              # Colors, spacing, fonts, routes
│   ├── colors.ts
│   ├── spacing.ts
│   └── typography.ts
└── assets/                 # Images, fonts, icons
```

## React Native Standards

- **TypeScript everywhere** — no `any` without explicit justification
- **Functional components only** — no class components
- Props typed with `interface`, not `PropTypes`
- Use `React.memo()` for list item components and pure display components
- Extract heavy computations with `useMemo`, callbacks with `useCallback`
- **No inline styles** — use `StyleSheet.create()` or a design-token system
- Use `KeyboardAvoidingView` for forms

## Navigation (React Navigation)

- Typed navigation with `RootStackParamList` in `src/navigation/types.ts`
- Screen components receive `navigation` and `route` props typed via `NativeStackScreenProps`
- Navigate with `navigation.navigate('ScreenName', { params })` — never with string literals inline
- Group related screens in nested navigators
- See @.claude/rules/navigation.md

## Styling

- **`StyleSheet.create()`** for all styles — enables optimization and type checking
- Design tokens (colors, spacing, typography) centralized in `src/constants/`
- Responsive sizing: use `Dimensions` API or `react-native-responsive-screen` — no hardcoded pixel values
- Platform-specific styles: `Platform.select({ ios: {...}, android: {...} })`
- Platform-specific files: `Component.ios.tsx` / `Component.android.tsx` for significant divergence
- Dark mode: use `useColorScheme()` hook + conditional token lookup

## State Management

- Local UI state: `useState` / `useReducer`
- Global app state: Redux Toolkit or Zustand (match existing setup)
- Server/async data: React Query (`@tanstack/react-query`)
- Persist state: `redux-persist` or `zustand/middleware/persist` with `AsyncStorage`
- Never store sensitive data (tokens, PII) in AsyncStorage unencrypted — use `expo-secure-store`

## API & Services

- All network calls via `src/services/` — never `fetch` directly in components
- Return typed `Result<T>` — never throw from services
- Offline awareness: check connectivity before requests (`@react-native-community/netinfo`)
- See @.claude/rules/api-integration.md

## Native Modules & Permissions

- Declare all required permissions in `app.json` (Expo) or `Info.plist` / `AndroidManifest.xml`
- Request permissions at the moment they're needed — not on app start
- Handle denied/restricted states gracefully with user-facing messages
- Use Expo SDK modules over bare native modules where available

## Performance

- **FlatList / FlashList** for any list > 20 items — never `ScrollView` + `map()`
- `keyExtractor` must return a stable, unique string
- `getItemLayout` for fixed-height lists
- `removeClippedSubviews={true}` for long lists
- Avoid arrow functions and object literals in JSX props for list items (breaks memo)
- Use `InteractionManager.runAfterInteractions()` for non-critical work after navigation
- Profile with Flipper or React Native DevTools before optimizing

## Testing

- **Jest + React Native Testing Library** for component and hook tests
- `@testing-library/react-native` queries (`getByText`, `getByRole`, `getByTestId`)
- Mock native modules in `__mocks__/` or via `jest.mock()`
- Mock `@react-navigation/native` for screen tests
- E2E with **Detox** for critical user flows (login, checkout, onboarding)
- See @.claude/rules/testing.md

## Error Handling

- Wrap root component in an `ErrorBoundary` for unexpected JS errors
- Network errors: surface in UI with retry affordance — never silently swallow
- Crash reporting: Sentry or Bugsnag integrated and initialized before any other setup
- Never show raw error messages to users — map to friendly strings

## Git Workflow

- Branch naming: `feat/description`, `fix/description`, `chore/description`
- Commit format: `type(scope): description` (Conventional Commits)
- Run `npm run lint && npm test` before every commit
- PR required before merging to main
- Tag releases that trigger EAS builds: `v1.2.3`

## What NOT to Do

- Do not use `ScrollView` for long lists — use `FlatList` or `FlashList`
- Do not store tokens in `AsyncStorage` unencrypted — use `expo-secure-store`
- Do not use inline styles — use `StyleSheet.create()`
- Do not use `any` — define the type
- Do not hardcode pixel values — use design tokens or `Dimensions`
- Do not use `console.log` in production — guard with `__DEV__` or use a logger
- Do not mutate navigation params — treat them as read-only

## Rules References

- Component patterns: @.claude/rules/components.md
- Navigation: @.claude/rules/navigation.md
- API integration: @.claude/rules/api-integration.md
- Testing: @.claude/rules/testing.md
