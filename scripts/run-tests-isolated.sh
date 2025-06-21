#!/bin/bash

# Run tests with proper isolation for React component tests
# This follows the same pattern as run-all-tests.sh but adds React component isolation

echo "🧪 Running tests with React component isolation..."

# Check if we're running in CI environment
if [ "$CI" = "true" ]; then
  echo "🚀 Running in CI environment - excluding problematic Storybook tests due to Vitest 3.0 compatibility issue"
  STORYBOOK_EXCLUDE="--exclude '**/not-found.stories.tsx' --exclude '**/loading-states.stories.tsx'"
else
  echo "💻 Running in local environment - all tests included"
  STORYBOOK_EXCLUDE=""
fi

# First, run all tests except the problematic ones
echo "📦 Running main test suite (excluding React component and drag-and-drop tests)..."
pnpm vitest run --config vitest.config.ts \
  --exclude "**/base.test.tsx" \
  --exclude "**/auth-tile.test.tsx" \
  --exclude "**/auth.test.tsx" \
  --exclude "**/page.test.tsx" \
  --exclude "**/useDragAndDrop.test.ts" \
  --exclude "**/enhanced-drag-drop.test.ts" \
  --exclude "**/TileActionsContext.test.tsx" \
  --exclude "**/Toolbox.integration.test.tsx" \
  --exclude "**/useKeyboardShortcuts.test.tsx" \
  --exclude "**/ToolStateManager.test.tsx" \
  --exclude "**/Toolbox.test.tsx" \
  --exclude "**/item-tile-content.test.tsx" \
  $STORYBOOK_EXCLUDE

MAIN_EXIT_CODE=$?

# Then run the React component tests in isolation with single thread
echo "⚛️ Running React component tests in isolation (single thread)..."
pnpm vitest run --config vitest.config.ts --pool=forks --poolOptions.forks.singleThread \
  src/app/static/map/Tile/Base/base.test.tsx \
  src/app/map/Tile/Auth/__tests__/auth-tile.test.tsx \
  src/app/map/Tile/Auth/__tests__/auth.test.tsx \
  src/app/auth/logout/__tests__/page.test.tsx \
  src/app/map/Canvas/TileActionsContext.test.tsx \
  src/app/map/Controls/Toolbox/Toolbox.integration.test.tsx \
  src/app/map/hooks/useKeyboardShortcuts.test.tsx \
  src/app/map/Controls/Toolbox/ToolStateManager.test.tsx \
  src/app/map/Controls/Toolbox/Toolbox.test.tsx \
  src/app/map/Tile/Item/_components/__tests__/item-tile-content.test.tsx

REACT_EXIT_CODE=$?

# Then run the drag-and-drop tests in isolation
echo "🎯 Running drag-and-drop tests in isolation..."
pnpm vitest run --config vitest.config.ts \
  src/app/map/Canvas/hooks/__tests__/useDragAndDrop.test.ts \
  src/app/map/Canvas/hooks/__tests__/enhanced-drag-drop.test.ts

DRAG_EXIT_CODE=$?

# Calculate final exit code
if [ $MAIN_EXIT_CODE -ne 0 ] || [ $REACT_EXIT_CODE -ne 0 ] || [ $DRAG_EXIT_CODE -ne 0 ]; then
  echo "❌ Some tests failed"
  echo "Main suite: $MAIN_EXIT_CODE, React tests: $REACT_EXIT_CODE, Drag tests: $DRAG_EXIT_CODE"
  exit 1
else
  echo "✅ All tests passed"
  exit 0
fi