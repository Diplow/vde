# Issue: Toolbox Menu UI Improvement for Tile Interactions

**Date**: 2025-06-20
**Status**: Open
**Tags**: #enhancement #design #tiles #product
**GitHub Issue**: #pending
**Branch**: issue-1-toolbox-menu-ui-improvement

## Problem Statement
Tile buttons appearing on hover makes the general UI feel clunky. Users need a more intuitive and persistent way to interact with tiles using different tools/modes, with keyboard shortcuts for efficiency.

## User Impact
- Who is affected? All users interacting with the hexagonal map interface
- What can't they do? Cannot efficiently switch between different interaction modes without hover-based UI elements
- How critical is this to their workflow? Medium - affects core interaction patterns but doesn't block functionality
- Workarounds: Currently must hover over tiles to see action buttons

## Expected Behavior
- Persistent toolbox menu on the left side of the screen
- Click behavior changes based on selected tool
- Keyboard shortcuts for quick tool switching
- Three toggle states for the toolbox:
  1. Closed (minimized)
  2. Icons only with shortcuts and labels on hover
  3. Icons + labels + shortcuts displayed

## Context

*I am an AI assistant acting on behalf of @ulysse*

### Existing Documentation
The project has comprehensive documentation for the map interface:
- **Architecture Docs**: `/src/app/map/ARCHITECTURE.md` - Explains dual-route architecture, component hierarchy, state management, and centralized tile action management ✅
- **Canvas README**: `/src/app/map/Canvas/README.md` - Documents Canvas component as main container for hex visualization, interaction handlers via TileActionsContext ✅
- **Tile README**: `/src/app/map/Tile/README.md` - Describes tile types (Item, Empty, User), modular structure, and performance considerations ✅
- **Domain Docs**: `/src/lib/domains/mapping/README.md` - Domain-driven design with clear separation of concerns ✅
- **Drag & Drop**: Recent feature implementation with optimistic updates and visual feedback ✅

### Domain Overview
The map interface follows a hierarchical component structure:
- **Page Layer**: Handles routing and URL state
- **Canvas Layer**: Main visualization container, manages interactions through TileActionsContext
- **Frame Layer**: Groups of tiles for efficient rendering
- **Tile Layer**: Individual hexagonal units with different types (Item, Empty, User)

The architecture emphasizes:
- URL-first state management for shareable views
- Region-based caching for performance
- Centralized action management for consistent interactions
- Progressive enhancement from static to dynamic

### Key Components
**TileActionsContext** (`/src/app/map/Canvas/index.tsx`):
- Central hub for tile interactions
- Provides callbacks for clicks, hovers, drag & drop
- Currently has empty implementations for click and hover handlers (marked as TODO)

**Tile Buttons** (`/src/app/map/Tile/Item/item.buttons.tsx`):
- Edit (amber), Delete (rose), URL (blue), Expand/Collapse (slate), Navigate (slate)
- Positioned absolutely with scale-responsive sizing
- Use CSS `opacity-0` and `group-hover:opacity-100` for hover visibility

**Empty Tiles** (`/src/app/map/Tile/Empty/empty.tsx`):
- Show create button on hover for owned spaces
- Track hover state locally with React hooks
- Use semi-transparent overlay for visual feedback

### Implementation Details
**Current Hover Pattern**:
- **CSS-based**: Buttons use `opacity-0 group-hover:opacity-100` for visibility
- **Local State**: Components track `isHovered` with useState
- **Button Positioning**: Absolute positioning at `top-[10%]` centered horizontally
- **Scale-based Sizing**: Buttons scale from 6x6 (12px icons) to 20x20 (40px icons)

**Interaction Flow**:
1. User hovers over tile → CSS group-hover activates
2. Buttons fade in with opacity transition
3. Click handlers prevent event bubbling
4. Actions trigger through TileActionsContext or direct handlers

**No Existing Patterns For**:
- Toolbar/toolbox components (no matches for toolbar, toolbox, side-panel patterns)
- Keyboard shortcuts (no existing hotkey or keybind implementations)
- Persistent UI panels for tool selection

### Dependencies and Integration
- **React Context**: TileActionsContext provides interaction callbacks to all tiles
- **URL State**: Navigation and expansion states sync with URL parameters
- **Cache Layer**: Map cache handles optimistic updates and data synchronization
- **tRPC**: Backend API for persistent operations

The current architecture is well-prepared for adding a toolbox:
- TileActionsContext can be extended for tool-based click handling
- Empty click/hover handlers are ready for implementation
- Component hierarchy supports adding new UI layers

## Solution

*I am an AI assistant acting on behalf of @ulysse*

### Prerequisites
- TileActionsContext must be extended to support tool state management
- Decision needed on whether toolbox state should persist in localStorage
- Keyboard event handling infrastructure needs to be established
- Icon library selection for tool icons (currently using Lucide React)

### Possible Solutions

#### Solution 1: Context-Based Tool System with Floating Panel (Preferred)
Extend TileActionsContext to manage tool state globally with a floating toolbox panel.

**Changes Required**:
- **TileActionsContext**: Add tool state, selection methods, and keyboard handling
- **New Toolbox Component**: Floating panel with three display modes
- **Tile Components**: Update click handlers to check active tool
- **Keyboard Hook**: Global keyboard shortcut management

**Implementation Approach**:
1. Extend TileActionsContext with `activeTool`, `setActiveTool`, and tool-specific handlers
2. Create Toolbox component with Radix UI primitives for consistent styling
3. Implement keyboard shortcuts using a custom useKeyboardShortcuts hook
4. Update tile click handlers to dispatch based on active tool
5. Add visual feedback for active tool (cursor changes, tile highlights)

**Tradeoffs**:
- ✅ **Pros**: Leverages existing context infrastructure, centralized state, easy to extend
- ✅ **Pros**: Consistent with current architecture patterns
- ✅ **Pros**: Minimal performance impact, tools loaded on demand
- ❌ **Cons**: Requires updating all tile interaction points
- ❌ **Cons**: Initial complexity in coordinating tool states
- 🎯 **Best for**: Long-term maintainability and extensibility

#### Solution 2: Standalone Tool Manager with Event Bus
Create a separate tool management system with event-based communication.

**Changes Required**:
- **New ToolManager**: Singleton service managing tool state
- **Event Bus**: Custom event system for tool changes
- **Toolbox Component**: Independent UI component
- **Event Listeners**: Added to each tile component

**Implementation Approach**:
1. Create ToolManager service with event emitter
2. Build Toolbox UI that communicates via events
3. Add event listeners to tiles for tool-specific actions
4. Implement keyboard shortcuts at document level
5. Use CSS classes for visual tool states

**Tradeoffs**:
- ✅ **Pros**: Decoupled from existing systems, easier to test in isolation
- ✅ **Pros**: Can be implemented without touching TileActionsContext
- ✅ **Pros**: More flexible for future tool additions
- ❌ **Cons**: Introduces new patterns not used elsewhere
- ❌ **Cons**: Event coordination can become complex
- ❌ **Cons**: Potential memory leaks from event listeners
- 🎯 **Best for**: Rapid prototyping and experimentation

#### Solution 3: URL-State Driven Tools
Integrate tool selection into the URL state management system.

**Changes Required**:
- **URL Params**: Add `tool` parameter to URL state
- **Page Component**: Parse and propagate tool state
- **Toolbox Component**: Syncs with URL parameters
- **Router Integration**: Update navigation to preserve tool state

**Implementation Approach**:
1. Extend URL parsing to include tool parameter
2. Pass tool state through component hierarchy
3. Create Toolbox that updates URL on tool change
4. Implement keyboard shortcuts that update URL
5. Ensure tool state persists across navigation

**Tradeoffs**:
- ✅ **Pros**: Shareable tool states via URL
- ✅ **Pros**: Consistent with URL-first architecture
- ✅ **Pros**: Built-in persistence and history
- ❌ **Cons**: URL updates can cause re-renders
- ❌ **Cons**: Tool changes pollute browser history
- ❌ **Cons**: Slower tool switching due to URL updates
- 🎯 **Best for**: Collaborative workflows where tool state matters

### Recommendation
**Recommended: Solution 1 - Context-Based Tool System**

This approach best aligns with Hexframe's existing architecture while providing the flexibility needed for future enhancements. The use of TileActionsContext maintains consistency with current patterns, while the floating panel design allows for the three display modes requested. The centralized state management will make it easier to add new tools and maintain consistent behavior across all tile types.

Key advantages:
- Builds on existing infrastructure (TileActionsContext)
- Maintains architectural consistency
- Supports all requested features (keyboard shortcuts, display modes)
- Performant with minimal re-renders
- Easy to extend with new tools in the future

## Tests

*I am an AI assistant acting on behalf of @ulysse*

### Test Strategy
Comprehensive testing of the Context-Based Tool System, covering the Toolbox component, TileActionsContext extensions, keyboard shortcuts, and user workflows. Tests will use Vitest for unit/integration and Playwright for E2E.

### Unit Tests

#### Component: Toolbox
**File**: `src/app/map/Toolbox/Toolbox.test.tsx`

- **Test**: Renders with default closed state
  - Verify component mounts without errors
  - Check no tools visible when closed
  - Verify toggle button is accessible

- **Test**: Transitions between display modes
  - Simulate click on toggle button
  - Verify transitions: closed → icons → full → closed
  - Check CSS classes update correctly
  - Verify ARIA states update

- **Test**: Tool selection updates active state
  - Mock setActiveTool from context
  - Click each tool button
  - Verify active tool visually highlighted
  - Verify setActiveTool called with correct tool

- **Test**: Keyboard shortcuts displayed correctly
  - In icons mode: shortcuts visible on hover
  - In full mode: shortcuts always visible
  - Verify correct shortcuts for each tool

#### Component: TileActionsContext Extensions
**File**: `src/app/map/Canvas/TileActionsContext.test.tsx`

- **Test**: Context provides tool state
  - Render provider with test children
  - Verify activeTool accessible
  - Verify setActiveTool function available
  - Check default tool is 'select'

- **Test**: Tool state updates propagate to consumers
  - Multiple components consuming context
  - Update tool in one component
  - Verify all components receive update
  - Check no unnecessary re-renders

#### Hook: useKeyboardShortcuts
**File**: `src/app/map/hooks/useKeyboardShortcuts.test.tsx`

- **Test**: Registers keyboard event listeners
  - Render hook in test component
  - Verify addEventListener called on mount
  - Verify removeEventListener on unmount
  - Check prevents memory leaks

- **Test**: Keyboard shortcuts trigger tool changes
  - Simulate keyboard events (N, C, E, D, Escape)
  - Verify correct tool activated
  - Check modifier keys don't interfere
  - Verify shortcuts work globally

- **Test**: Prevents conflicts with input fields
  - Focus on input/textarea
  - Press tool shortcuts
  - Verify tools don't change
  - Check normal typing works

### Integration Tests

#### Test Suite: Tool System Integration
**File**: `src/app/map/__tests__/tool-integration.test.tsx`

- **Test**: Toolbox integrates with TileActionsContext
  - Render Canvas with Toolbox and tiles
  - Select tool in Toolbox
  - Verify context updates
  - Check tile click behavior changes

- **Test**: Tool-specific tile interactions
  - Set navigate tool → click tile → verify navigation
  - Set create tool → click empty → verify create modal
  - Set edit tool → click item → verify edit mode
  - Set delete tool → click item → verify delete confirmation

- **Test**: Visual feedback coordination
  - Select different tools
  - Verify cursor changes
  - Check tile hover states update
  - Verify button visibility adjusts

- **Test**: Keyboard shortcuts work with toolbox
  - Press keyboard shortcut
  - Verify toolbox UI updates
  - Check context state synced
  - Verify tile behavior updated

### E2E Tests

#### Test Suite: Toolbox User Workflows
**File**: `e2e/toolbox-workflows.spec.ts`

- **Test**: Toggle toolbox display modes
  ```typescript
  test('toolbox display mode transitions', async ({ page }) => {
    await page.goto('/map');
    
    // Initially closed
    await expect(page.locator('[data-testid="toolbox"]')).toHaveAttribute('data-display', 'closed');
    
    // Click toggle → icons mode
    await page.click('[data-testid="toolbox-toggle"]');
    await expect(page.locator('[data-testid="toolbox"]')).toHaveAttribute('data-display', 'icons');
    await expect(page.locator('[data-testid="tool-navigate"]')).toBeVisible();
    await expect(page.locator('[data-testid="tool-label-navigate"]')).not.toBeVisible();
    
    // Click toggle → full mode
    await page.click('[data-testid="toolbox-toggle"]');
    await expect(page.locator('[data-testid="toolbox"]')).toHaveAttribute('data-display', 'full');
    await expect(page.locator('[data-testid="tool-label-navigate"]')).toBeVisible();
    
    // Click toggle → closed
    await page.click('[data-testid="toolbox-toggle"]');
    await expect(page.locator('[data-testid="toolbox"]')).toHaveAttribute('data-display', 'closed');
  });
  ```

- **Test**: Tool selection changes tile behavior
  ```typescript
  test('tool selection affects tile clicks', async ({ page }) => {
    await page.goto('/map');
    await page.click('[data-testid="toolbox-toggle"]'); // Open toolbox
    
    // Select navigate tool
    await page.click('[data-testid="tool-navigate"]');
    await page.click('[data-testid="tile-1-2-3"]');
    await expect(page).toHaveURL(/center=1-2-3/);
    
    // Select create tool
    await page.click('[data-testid="tool-create"]');
    await page.click('[data-testid="empty-tile-1-2-4"]');
    await expect(page.locator('[data-testid="create-modal"]')).toBeVisible();
  });
  ```

- **Test**: Keyboard shortcuts work globally
  ```typescript
  test('keyboard shortcuts activate tools', async ({ page }) => {
    await page.goto('/map');
    
    // Press N for navigate
    await page.keyboard.press('n');
    await expect(page.locator('[data-testid="toolbox"]')).toHaveAttribute('data-active-tool', 'navigate');
    
    // Press C for create
    await page.keyboard.press('c');
    await expect(page.locator('[data-testid="toolbox"]')).toHaveAttribute('data-active-tool', 'create');
    
    // Press Escape for select
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="toolbox"]')).toHaveAttribute('data-active-tool', 'select');
  });
  ```

- **Test**: Toolbox state persists across navigation
  ```typescript
  test('toolbox remembers display state', async ({ page }) => {
    await page.goto('/map');
    
    // Open to full mode
    await page.click('[data-testid="toolbox-toggle"]'); // icons
    await page.click('[data-testid="toolbox-toggle"]'); // full
    
    // Navigate to different tile
    await page.click('[data-testid="tile-navigate"]');
    
    // Verify toolbox still in full mode
    await expect(page.locator('[data-testid="toolbox"]')).toHaveAttribute('data-display', 'full');
  });
  ```

### Accessibility Tests

- **Keyboard Navigation**: 
  - Tab through all toolbox controls
  - Enter/Space activate buttons
  - Escape closes expanded states
  - Focus trap when modal tools active

- **Screen Reader Support**:
  - Tool names announced on focus
  - Active tool state announced
  - Display mode changes announced
  - Keyboard shortcuts read correctly

- **ARIA Attributes**:
  - role="toolbar" on container
  - aria-label for all buttons
  - aria-pressed for active tool
  - aria-expanded for display toggle

### Performance Considerations

- **Re-render Optimization**:
  - Tool changes don't re-render entire map
  - Use React.memo for tile components
  - Context split to minimize consumers

- **Event Handler Efficiency**:
  - Keyboard listeners use debouncing
  - Single global listener vs per-component
  - Cleanup on unmount prevents leaks

- **CSS Transitions**:
  - Use transform/opacity for GPU acceleration
  - Avoid layout-triggering properties
  - Test smooth 60fps transitions