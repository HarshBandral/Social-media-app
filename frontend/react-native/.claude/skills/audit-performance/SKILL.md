---
name: audit-performance
description: Audit a React Native screen or component for performance issues — FlatList misuse, unnecessary re-renders, heavy computations on the JS thread, and image loading problems. Use before releasing or when jank/slowness is reported.
license: MIT
---

Audit the target React Native component(s) for performance issues.

## Checklist

### FlatList & lists
- [ ] Lists use `FlatList` — not `ScrollView` + `.map()`
- [ ] `keyExtractor` returns a stable string ID — not array index
- [ ] `getItemLayout` provided when all items have fixed height (eliminates measure passes)
- [ ] `initialNumToRender` set to the number of items visible on screen (default 10 is often too high)
- [ ] `maxToRenderPerBatch` and `windowSize` tuned for your list density
- [ ] `removeClippedSubviews={true}` enabled on long lists (Android especially)
- [ ] `renderItem` is a stable reference (defined outside render or wrapped in `useCallback`)

### Re-renders
- [ ] `React.memo` wrapping list item components
- [ ] No inline object/array/function creation in JSX (`style={{ }}`, `onPress={() => ...}`)
- [ ] `useCallback` on event handlers passed to memoised children
- [ ] `useMemo` on expensive derived values (sort, filter, transform of large arrays)
- [ ] Context value objects stabilised with `useMemo`

### Images
- [ ] Remote images use `<Image>` with explicit `width` + `height` — no layout thrash
- [ ] Large images resized server-side or use `resizeMode="cover"`
- [ ] Consider `expo-image` or `react-native-fast-image` for aggressive caching

### JS thread
- [ ] Heavy computations (sort, parse, transform) moved to `useMemo` or a web worker
- [ ] Animations use `Animated.Value` with `useNativeDriver: true` — never state updates
- [ ] `InteractionManager.runAfterInteractions` for heavy work triggered by navigation

### Navigation
- [ ] Screens not mounted until navigated to (`lazy: true` in navigator config)
- [ ] Heavy data fetching deferred until screen is focused (`useFocusEffect`)

## Common fixes

```tsx
// Bad — new function every render
<FlatList renderItem={({ item }) => <Row item={item} />} />

// Good — stable reference
const renderItem = useCallback(({ item }: { item: Item }) => <Row item={item} />, [])
<FlatList renderItem={renderItem} />
```

```tsx
// Bad — layout recalculates on every render
<View style={{ padding: 16, backgroundColor: theme.bg }}>

// Good
const styles = StyleSheet.create({ container: { padding: 16, backgroundColor: '#fff' } })
<View style={styles.container}>
```

## Report format
List issues by screen/component, severity (High / Medium / Low), and specific line where applicable. End with the top 3 changes most likely to improve perceived performance.
