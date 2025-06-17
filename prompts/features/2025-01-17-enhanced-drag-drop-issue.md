# GitHub Issue: Enhanced Drag and Drop

## Title
Feature: Enhanced Drag and Drop - Move to Any Empty Tile & Swap Between Tiles

## Description

## Summary

Enhance the drag and drop functionality to support:
1. Moving tiles to any empty position in the user space (not just siblings)
2. Swapping between any two existing tiles in the user space

Currently, users can only rearrange tiles within the same parent frame, which limits the flexibility of spatial organization - a core principle of Hexframe's "context architecture" philosophy.

## Problem Being Solved

Users need more flexibility in organizing their hexagonal maps. The current sibling-only restriction prevents efficient reorganization of tile hierarchies and limits the visual composition capabilities that are central to Hexframe's value proposition.

## Proposed Solution

### Strategy
Extend the existing modular drag and drop architecture while maintaining its clean separation of concerns.

### Key Changes

1. **Simplified Drop Validation** 
   - Remove complex sibling-only calculation logic
   - Every user-owned tile (except root) becomes a valid drop target
   - Validate on hover rather than pre-calculating

2. **Automatic Operation Detection**
   - Dropping on empty tile → Move operation
   - Dropping on occupied tile → Swap operation
   - No need for explicit operation modes

3. **Enhanced Visual Feedback**
   - Empty tiles: Green highlight when hovered during drag
   - Occupied tiles: Blue highlight when hovered during drag  
   - Invalid targets: No highlight (root tile, other users' tiles)

### Implementation Plan

**Phase 1: Simplify Drop Validation**
- Remove sibling-only restriction from `getValidDropTargets`
- Update validation to check: user owns tile, not root, not self
- Remove pre-calculation logic

**Phase 2: Add Operation Detection**
- Update drop handlers to detect empty vs occupied targets
- Add differentiated visual feedback during hover
- Ensure consistent validation for both operations

**Phase 3: Implement Swap Operation**
- Create `optimisticSwap` orchestrator for atomic swaps
- Handle coordinate updates for both tiles
- Update API to support swap operation

**Phase 4: Visual Polish**
- Green highlight for empty tiles on hover
- Blue highlight for occupied tiles on hover
- Smooth transitions and clear feedback

**Phase 5: Testing & Edge Cases**
- Update tests for new universal drop behavior
- Add cross-hierarchy move and swap tests
- Handle edge cases (self-drop, root drop)
- Performance verification

## Technical Details

The current limitation is in `/src/app/map/Canvas/hooks/_calculators/drop-targets.ts` which only searches siblings:
```typescript
const siblingCoords = CoordSystem.getChildCoords(parentCoords);
```

This will be extended to traverse the entire user tile space while maintaining performance through smart caching.

## Alternatives Considered

1. **Unified Drop Target System** - Simpler but harder to differentiate operations visually
2. **Mode-Based System** - Clear intent but adds UI complexity

## Success Criteria

- Users can drag any tile they own to any empty position in their tile space
- Users can swap any two tiles they own regardless of hierarchy
- Operations feel smooth and responsive even with 100+ tiles
- Visual feedback clearly indicates the operation type
- All changes are optimistically updated with proper rollback on failure

@Diplow - This proposal maintains the clean architecture you've established while significantly enhancing the drag and drop capabilities. The phased approach allows for incremental development and testing. Would you like me to proceed with implementation or would you prefer to discuss any aspects of this design first?