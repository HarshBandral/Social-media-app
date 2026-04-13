# /project:generate-screen — Scaffold a New Screen

## Usage
```
/project:generate-screen Profile
/project:generate-screen OrderDetail --with-list
/project:generate-screen Settings --tab
```

## What This Does

1. **Read existing screens** to match project conventions
2. **Generate files**:

### `src/screens/ScreenName/index.tsx`
- Typed `NativeStackScreenProps` or `BottomTabScreenProps`
- Loading / error / success state handling
- `SafeAreaView` root with `ScrollView` or `FlatList`
- `StyleSheet.create()` at bottom

### `src/screens/ScreenName/ScreenName.test.tsx`
- Navigation mock setup
- Render test
- Interaction tests for primary actions

3. **Add to navigation** — prompts where to register the new screen:
   - Which navigator: App tabs, auth stack, nested stack?
   - Param list update in `src/navigation/types.ts`
   - Route registration in appropriate navigator file

### Flags
- `--with-list`: FlatList template with `keyExtractor` and `renderItem`
- `--tab`: Bottom tab screen (no back button header)

$ARGUMENTS
