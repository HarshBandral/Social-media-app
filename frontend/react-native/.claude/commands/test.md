# /project:test — Run React Native Tests

## Usage
```
/project:test                          # All tests with coverage
/project:test src/components/          # Specific directory
/project:test --e2e                    # Run Detox E2E tests
```

## What This Does

For unit/component tests:
```bash
npm test -- --coverage --passWithNoTests $ARGUMENTS
```

For E2E (if `--e2e`):
```bash
npx detox test
```

Report:

### Test Results
Passed / Failed / Skipped

### Coverage
| Area | Lines | Branches |
|------|-------|----------|
| Components | % | % |
| Screens | % | % |
| Hooks | % | % |
| Services | % | % |

### Failing Tests
For each failure:
- **Test**: name
- **File**: `path.test.tsx:line`
- **Error**: message
- **Diagnosis**: native module mock missing, navigation wrapper needed, async issue?
- **Fix**: code change

### Missing Mocks
Native modules that need mocking.

### E2E Results (if run)
Critical flow pass/fail status.

$ARGUMENTS
