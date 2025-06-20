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

## Steps to Reproduce
1. Open the hexagonal map interface
2. Hover over any tile
3. Notice buttons appear on hover
4. Try to quickly perform actions on multiple tiles
5. Experience UI feeling clunky due to hover-based interactions

## Expected Behavior
- Persistent toolbox menu on the left side of the screen
- Click behavior changes based on selected tool
- Keyboard shortcuts for quick tool switching
- Three toggle states for the toolbox:
  1. Closed (minimized)
  2. Icons only with shortcuts and labels on hover
  3. Icons + labels + shortcuts displayed

## Environment
- Browser/OS: All browsers
- User role: All users
- Frequency: Always - core interaction pattern

## Related Issues
- None identified yet

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