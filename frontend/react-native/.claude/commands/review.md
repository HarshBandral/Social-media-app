# /project:review — React Native Code Review

## Usage
```
/project:review                        # Review staged changes
/project:review src/screens/HomeScreen # Review specific screen
```

## What This Does

1. Identify files: `$ARGUMENTS` or `git diff --name-only HEAD`
2. Read each `.tsx`/`.ts` file and evaluate:

   **React Native Specifics**
   - `FlatList`/`FlashList` for lists (not `ScrollView + map`)
   - `StyleSheet.create()` — no inline styles
   - `Pressable` over `TouchableOpacity`
   - `SafeAreaView` as screen root

   **Performance**
   - `React.memo` on list items
   - No new object/array literals in `renderItem`
   - `keyExtractor` returns stable unique string

   **Navigation**
   - Typed param lists and screen props
   - No inline string screen names

   **Security & Storage**
   - Tokens in `expo-secure-store` not `AsyncStorage`
   - No hardcoded URLs — `EXPO_PUBLIC_*` env vars

   **Accessibility**
   - `accessibilityRole`, `accessibilityLabel`, `accessibilityState`

   **TypeScript**
   - No `any` types; explicit return types

3. Output:

### Critical (must fix)
`file:line` — issue — fix

### Warnings (should fix)
`file:line` — issue — fix

### Suggestions
`file:line` — improvement

### Summary

$ARGUMENTS
