# /project:commit — Conventional Commit for React Native

## Usage
```
/project:commit
/project:commit feat(onboarding) add biometric login screen
```

## What This Does

1. `git status` + `git diff --staged`
2. Pre-commit checks:
   ```bash
   npm run lint && npm test -- --passWithNoTests
   ```
3. Determine type:

| Type | React Native use case |
|------|----------------------|
| `feat` | New screen, component, feature |
| `fix` | Bug fix in component, navigation, service |
| `perf` | FlatList optimization, memo, lazy loading |
| `refactor` | Component restructure, hook extraction |
| `test` | Add/update Jest or Detox tests |
| `style` | StyleSheet changes, design token update |
| `chore` | Package updates, build config, EAS config |
| `ci` | GitHub Actions, EAS workflows |

4. Scope: affected area (`auth`, `home`, `navigation`, `components`, `services`, `store`)

5. Create commit

## Examples
```
feat(profile): add avatar upload with image cropping
fix(navigation): resolve deep link handling on Android
perf(feed): migrate article list from ScrollView to FlashList
test(auth): add Detox tests for login and biometric flows
```

$ARGUMENTS
