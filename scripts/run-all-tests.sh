#!/bin/bash

# Run all tests with proper isolation for problematic tests

echo "🧪 Running all tests with proper isolation..."

# First, run all tests except the problematic ones
echo "📦 Running main test suite (excluding drag-and-drop tests)..."
pnpm vitest run --exclude "**/useDragAndDrop.test.ts" --exclude "**/enhanced-drag-drop.test.ts"

MAIN_EXIT_CODE=$?

# Then run the problematic tests in isolation
echo "🎯 Running drag-and-drop tests in isolation..."
pnpm vitest run src/app/map/Canvas/hooks/__tests__/useDragAndDrop.test.ts src/app/map/Canvas/hooks/__tests__/enhanced-drag-drop.test.ts

DRAG_EXIT_CODE=$?

# Run storybook tests separately if needed
if [ -f "vitest.config.storybook.ts" ]; then
  echo "📚 Running Storybook tests separately..."
  pnpm test:storybook
  STORYBOOK_EXIT_CODE=$?
else
  STORYBOOK_EXIT_CODE=0
fi

# Calculate final exit code
if [ $MAIN_EXIT_CODE -ne 0 ] || [ $DRAG_EXIT_CODE -ne 0 ] || [ $STORYBOOK_EXIT_CODE -ne 0 ]; then
  echo "❌ Some tests failed"
  exit 1
else
  echo "✅ All tests passed"
  exit 0
fi