# E2E Test Logging

This document explains the logging system available for E2E tests.

## Overview

The E2E test logging system helps debug test failures by providing visibility into what components are rendering and what interactions are happening. Logs are only output when running E2E tests, not in production.

## How It Works

1. **Environment Detection**: Logs are only output when:
   - `NODE_ENV=test` (server-side)
   - `E2E_TEST=true` (server-side)
   - `window.__E2E_TEST__ === true` (client-side)

2. **Log Levels**:
   - `info`: General information (always shown in tests)
   - `debug`: Detailed debugging (only shown when `DEBUG=true`)
   - `error`: Error information
   - `component`: Component render logs
   - `interaction`: User interaction logs

## Usage

### In Components

```typescript
import { testLogger } from "~/lib/test-logger";

// Log component renders
testLogger.component('MyComponent', { prop1: value1, prop2: value2 });

// Log information
testLogger.info('Something happened', { details: 'here' });

// Log interactions
testLogger.interaction('click', 'expand-button', { tileId: '123' });
```

### In E2E Tests

```typescript
// Capture logs from the page
page.on('console', msg => {
  const text = msg.text();
  if (text.includes('[TEST]')) {
    console.log(`PAGE LOG: ${text}`);
  }
});
```

## Current Logging

The following components have logging:

1. **StaticItemTile** - Logs when tiles render with their properties
2. **TileButtons** - Logs button rendering and URL generation
3. **StaticMapPage** - Logs page load, data fetching, and parameter initialization

## Log Format

All logs are prefixed with tags:
- `[TEST]` - General test logs
- `[TEST-COMPONENT]` - Component render logs
- `[TEST-INTERACTION]` - User interaction logs
- `[TEST-ERROR]` - Error logs
- `[TEST-DEBUG]` - Debug logs (only with DEBUG=true)

## Example Output

```
[TEST] StaticMapPage: Root item loaded { rootItemId: '1', rootCoordinates: '0:0:', rootName: 'Root', urlInfo: {...} }
[TEST-COMPONENT] StaticItemTile rendered { testId: 'tile-0-0-', name: 'Root', dbId: 1, ... }
[TEST-COMPONENT] TileButtons rendered { tileId: '0-0-', itemName: 'Root', shouldRenderExpandButton: true, ... }
```

## Debugging Tips

1. Run tests with logging output visible:
   ```bash
   pnpm test:e2e:ui
   ```

2. For more verbose logging, set DEBUG=true:
   ```bash
   DEBUG=true pnpm test:e2e
   ```

3. Check test results for captured logs in the HTML report

4. Use `page.screenshot()` in tests to capture visual state when logs show unexpected behavior