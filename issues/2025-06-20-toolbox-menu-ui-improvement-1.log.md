# Issue #1 Log: Toolbox Menu UI Improvement for Tile Interactions

This file documents the complete history and evolution of issue #1.

## 2025-06-20 14:35 - Issue Created

*Created by @ulysse via /issue command*

### Initial Problem Statement
Tile buttons appearing on hover makes the general UI feels clunky. We should setup a "toolbox" menu on the left of the screen that would change the click behavior depending on what "tool" is selected. Keyboard shortcut should also be bound to this toolbox. The toolbox should have a toggle that switch behind 3 states: closed, icons only with shortcut and label on hover, and icons + label + shortcut displayed.

### Initial Tags
#enhancement #design #tiles #product

---

## 2025-06-20 19:52 - Context Analysis

*Added by @ulysse via /context command*

### Investigation Process
- Read issue documentation from `/issues/2025-06-20-toolbox-menu-ui-improvement-1.md`
- Reviewed architecture documentation:
  - `/src/app/map/ARCHITECTURE.md` - Overall map architecture
  - `/src/app/map/Canvas/README.md` - Canvas component documentation
  - `/src/app/map/Tile/README.md` - Tile system documentation
  - `/src/lib/domains/mapping/README.md` - Domain layer documentation
- Analyzed tile interaction implementation:
  - `/src/app/map/Canvas/index.tsx` - TileActionsContext definition
  - `/src/app/map/Tile/Item/item.buttons.tsx` - Current button implementation
  - `/src/app/map/Tile/Empty/empty.tsx` - Empty tile hover interactions
- Searched for existing patterns:
  - No toolbar/toolbox components found
  - No keyboard shortcut implementations found
  - No side panel UI patterns found

### Detailed Findings

**Architecture Analysis**:
The map interface uses a well-structured hierarchical component system with clear separation of concerns. The Canvas layer manages all interactions through TileActionsContext, which currently has empty implementations for click and hover handlers (marked as TODO).

**Current Implementation**:
- Buttons appear on hover using CSS transitions (`opacity-0 group-hover:opacity-100`)
- Five button types: Edit, Delete, URL, Expand/Collapse, Navigate
- Button visibility depends on tile state and user permissions
- Empty tiles show a create button on hover for owned spaces
- All interactions use local state management for hover tracking

**Technical Details**:
- Button positioning: Absolute at `top-[10%]`, centered horizontally
- Scale-responsive sizing from 6x6 to 20x20 based on tile scale
- Event handlers prevent bubbling with stopPropagation
- No global interaction mode or tool selection system exists

**Missing Infrastructure**:
- No toolbar or toolbox components in the codebase
- No keyboard shortcut handling system
- No persistent UI panels for mode/tool selection
- TileActionsContext has placeholder methods ready for implementation

### Synthesis
The investigation revealed that the current hover-based interaction system is implemented entirely through CSS and local component state. The architecture is well-prepared for adding a toolbox system - TileActionsContext already exists as the central interaction hub with empty handlers ready for implementation. No existing toolbar patterns were found, so this would be a new UI pattern for the project.

### Changes Made to Issue File
- Added comprehensive Context section with 4 subsections
- Key insights:
  - Current implementation uses CSS-based hover with opacity transitions
  - TileActionsContext exists with empty handlers ready for toolbox integration
  - No existing toolbar/keyboard shortcut patterns in codebase
  - Architecture supports adding toolbox as new UI layer

---