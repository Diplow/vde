# Drag and Drop Tests

## Known Issues

### jsdom Environment Conflict

**Status**: The drag and drop tests fail when run with other tests but pass when run in isolation. This is not specific to storybook tests - it happens with any concurrent test execution.

The drag and drop tests fail when run as part of any test suite due to jsdom DOM initialization timing issues with `renderHook` from `@testing-library/react`.

**Symptoms:**
- Error: `Cannot read properties of undefined (reading 'appendChild')`
- Tests pass when run in isolation but fail in the full suite

**Solutions:**

1. **Run tests in isolation:**
   ```bash
   pnpm test src/app/map/Canvas/hooks/__tests__/useDragAndDrop.test.ts
   ```

2. **Run browser tests separately:**
   ```bash
   pnpm test:browser
   ```

3. **Use the test script for this specific file:**
   ```bash
   ./scripts/run-tests.sh src/app/map/Canvas/hooks/__tests__/useDragAndDrop.test.ts
   ```

4. **Use the all-tests script that isolates problematic tests:**
   ```bash
   pnpm test:all
   ```

## Root Cause

The issue is not specific to storybook tests. It's caused by:
- **DOM State Conflicts**: Multiple tests running in parallel or sequence can leave the DOM in an inconsistent state
- **renderHook Timing**: The `@testing-library/react` renderHook expects `document.body` to exist, but it may not be initialized when tests run concurrently
- **Test Runner Optimization**: Vitest optimizes test execution which can cause environment state issues

Separating storybook tests doesn't fix the issue because the problem is with jsdom state management, not with the specific test runner.

## Test Coverage

The useDragAndDrop hook tests cover:
- Ownership validation (only owners can drag their tiles)
- Root tile protection (UserTiles cannot be dragged)
- Valid drop target identification (empty sibling positions)
- Coordinate calculation for moves
- Drag event handling (start, over, end, drop)
- Drop target validation during active drag
- Occupied position prevention

All tests pass when run correctly, confirming the drag and drop functionality works as specified.