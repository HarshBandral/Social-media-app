# /project:audit-performance — React Native Performance Audit

## Usage
```
/project:audit-performance
/project:audit-performance src/screens/FeedScreen
```

## What This Does

Scans `$ARGUMENTS` (or entire `src/`) for performance anti-patterns:

1. **List rendering issues**:
   - `ScrollView + map` instead of `FlatList`/`FlashList`
   - Missing `keyExtractor`
   - `renderItem` without `React.memo`
   - Arrow functions as props in `renderItem`

2. **Re-render causes**:
   - Inline object/array literals as component props
   - Context value not memoized
   - Missing `useCallback` on handlers passed as props
   - Missing `useMemo` on expensive computations

3. **Image performance**:
   - Plain `Image` instead of `expo-image`/`FastImage`
   - Images without explicit dimensions
   - Large uncompressed assets

4. **Startup impact**:
   - Heavy synchronous imports at root
   - Data fetching before navigation completes
   - Missing `InteractionManager.runAfterInteractions()`

5. **Memory leaks**:
   - `useEffect` without cleanup return
   - Event listeners not removed

Report:

### Critical Performance Issues
`file:line` — issue — fix — impact

### Warnings
`file:line` — issue — fix

### Quick Wins
Small changes with measurable impact.

### Priority Order
Top 5 changes ranked by expected improvement.

$ARGUMENTS
