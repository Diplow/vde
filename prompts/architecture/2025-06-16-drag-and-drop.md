# Drag and Drop Architecture

*Note: This document was created by Claude AI working with @Diplow*

## Overview

This document outlines the complete architecture for implementing drag and drop functionality in Hexframe, allowing users to reorganize their tile layouts by moving tiles to empty sibling positions.

## Prerequisites

Before implementing this feature, the following issues must be resolved:
1. **Issue #31**: Fix E2E test configuration for drag and drop testing
2. **Issue #32**: Add transaction support to mapping repository for atomic operations

## Scope and Constraints

### Phase 1 Scope
- **Allowed Operations**: Move tiles to empty sibling positions only
- **No Swapping**: Initial implementation won't support swapping tiles
- **Owner Only**: Users can only drag tiles they own
- **No UserTile Moves**: Tiles with empty path (root tiles) cannot be moved
- **Children Move With Parent**: Moving a tile automatically moves all descendants

### Future Phases
- Tile swapping
- Moving between different parents
- Multi-select drag
- Touch device support

## Architecture Design

### 1. State Management

The drag state will be managed at the Canvas level to minimize re-renders:

```typescript
// Canvas-level drag state (ephemeral)
interface DragState {
  isDragging: boolean;
  draggedTileId: string | null;
  draggedTileData: TileData | null;
  dropTargetId: string | null;
  dragOffset: { x: number; y: number };
}

// Remove isDragged/isDragOver from cache (TileData)
// These should not be persisted
```

### 2. File Structure

```
/src/app/map/
├── Canvas/
│   ├── index.tsx                    # DynamicMapCanvas with drag state
│   ├── hooks/
│   │   └── useDragAndDrop.ts       # Core drag logic
│   └── components/
│       └── DragPreview.tsx         # Visual drag feedback
└── Tiles/
    ├── Item/
    │   └── DynamicItemTile.tsx     # Receives drag handlers
    └── Empty/
        └── DynamicEmptyTile.tsx    # Drop zone behavior
```

### 3. API Modifications

The `moveMapItem` endpoint will be modified to return all affected items:

```typescript
// Before: Returns only the moved item
MapItem

// After: Returns all modified items
interface MoveMapItemResult {
  modifiedItems: MapItem[];    // All items with updated coordinates
  movedItemId: string;        // The explicitly moved item
  affectedCount: number;      // Total items modified
}
```

**Implementation locations:**
- `/src/lib/domains/mapping/actions/MapItemActions.ts`
- `/src/lib/domains/mapping/services/ItemQueryService.ts`
- `/src/server/api/routers/map-items.ts`

### 4. The useDragAndDrop Hook

Core drag logic centralized in one hook:

```typescript
// /src/app/map/Canvas/hooks/useDragAndDrop.ts
export function useDragAndDrop({
  mapCache,
  currentUserId,
  moveMapItem // tRPC mutation
}) {
  const [dragState, setDragState] = useState<DragState>(initialState);
  
  // Validation
  const canDragTile = (tileId: string): boolean => {
    const tile = mapCache.getItem(tileId);
    return tile?.ownerId === currentUserId && tile.coords.path.length > 0;
  };
  
  // Find empty sibling positions
  const getValidDropTargets = (draggedTileId: string): Coord[] => {
    const tile = mapCache.getItem(draggedTileId);
    if (!tile) return [];
    
    const parent = getParentCoords(tile.coords);
    return DIRECTIONS
      .map(dir => appendToPath(parent, dir))
      .filter(coords => !mapCache.getItemByCoords(coords));
  };
  
  // Event handlers
  const handleDragStart = (tileId: string, event: DragEvent) => {
    if (!canDragTile(tileId)) return;
    
    const tile = mapCache.getItem(tileId);
    setDragState({
      isDragging: true,
      draggedTileId: tileId,
      draggedTileData: tile,
      dropTargetId: null,
      dragOffset: { x: event.offsetX, y: event.offsetY }
    });
    
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('tileId', tileId);
  };
  
  const handleDrop = async (targetCoords: Coord, event: DragEvent) => {
    event.preventDefault();
    
    if (!isValidDropTarget(targetCoords)) return;
    
    // Hybrid optimistic update
    await performOptimisticMove(
      dragState.draggedTileData,
      targetCoords
    );
  };
  
  return {
    dragState,
    dragHandlers: {
      onDragStart: handleDragStart,
      onDragOver: handleDragOver,
      onDrop: handleDrop,
      onDragEnd: handleDragEnd
    },
    canDragTile,
    isValidDropTarget
  };
}
```

### 5. Optimistic Update Strategy (Hybrid Approach)

We'll use a hybrid approach that balances UX and reliability:

```typescript
async function performOptimisticMove(
  tile: TileData,
  newCoords: Coord
) {
  // 1. Capture current state for rollback
  const rollbackState = mapCache.captureState();
  
  // 2. Optimistically update parent tile
  mapCache.updateTile(tile.id, { coords: newCoords });
  
  // 3. Calculate and update immediate children
  const immediateChildren = getImmediateChildren(tile.id);
  immediateChildren.forEach(child => {
    const newChildCoords = appendToPath(
      newCoords,
      getLastDirection(child.coords)
    );
    mapCache.updateTile(child.id, { coords: newChildCoords });
  });
  
  // 4. Mark deeper descendants as loading
  const deepDescendants = getDescendantsAtDepth(tile.id, 2);
  deepDescendants.forEach(d => mapCache.setLoading(d.id));
  
  try {
    // 5. Call API
    const result = await moveMapItem.mutateAsync({
      oldCoords: tile.coords,
      newCoords: newCoords
    });
    
    // 6. Update cache with server response
    mapCache.updateTiles(result.modifiedItems);
    
  } catch (error) {
    // 7. Rollback on failure
    mapCache.restoreState(rollbackState);
    showError('Failed to move tile');
  }
}
```

### 6. Integration with Components

The Canvas provides drag handlers through context:

```typescript
// In DynamicMapCanvas
const dragAndDrop = useDragAndDrop({
  mapCache,
  currentUserId,
  moveMapItem: api.mapItems.moveMapItem
});

const tileActions = {
  ...existingActions,
  dragHandlers: dragAndDrop.dragHandlers,
  canDragTile: dragAndDrop.canDragTile,
  isDraggingTile: (id) => dragAndDrop.dragState.draggedTileId === id
};

// In DynamicItemTile
const { dragHandlers, canDragTile, isDraggingTile } = useTileActions();

return (
  <div
    draggable={canDragTile(tileId)}
    onDragStart={(e) => dragHandlers.onDragStart(tileId, e)}
    onDragEnd={dragHandlers.onDragEnd}
    className={cn(
      'tile-base',
      isDraggingTile(tileId) && 'opacity-50'
    )}
  >
    {/* tile content */}
  </div>
);

// In DynamicEmptyTile (drop zones)
const { dragHandlers, isValidDropTarget } = useTileActions();

return (
  <div
    onDragOver={(e) => {
      if (isValidDropTarget(coords)) {
        e.preventDefault();
        dragHandlers.onDragOver(coords, e);
      }
    }}
    onDrop={(e) => dragHandlers.onDrop(coords, e)}
    className={cn(
      'empty-tile',
      isDropTarget && 'drop-highlight'
    )}
  />
);
```

### 7. Visual Feedback

```typescript
// DragPreview component
function DragPreview({ dragState }: { dragState: DragState }) {
  if (!dragState.isDragging) return null;
  
  return (
    <div
      className="fixed pointer-events-none z-50"
      style={{
        left: cursorPosition.x - dragState.dragOffset.x,
        top: cursorPosition.y - dragState.dragOffset.y
      }}
    >
      <TilePreview tile={dragState.draggedTileData} />
    </div>
  );
}
```

## Testing Strategy

### Unit Tests
```typescript
describe('useDragAndDrop', () => {
  it('should prevent dragging non-owned tiles');
  it('should prevent dragging userTiles');
  it('should identify valid empty sibling drop targets');
  it('should calculate new coordinates correctly');
});
```

### Integration Tests
```typescript
describe('Drag and Drop Integration', () => {
  it('should optimistically update parent and immediate children');
  it('should rollback on API failure');
  it('should show loading state for deep descendants');
  it('should prevent invalid drops');
});
```

### E2E Tests (after #31 is resolved)
```typescript
test('can drag tile to empty sibling position', async ({ page }) => {
  await page.goto('/map/user/group');
  await dragTile(page, 'tile-1', 'empty-west');
  await expect(getTile(page, 'tile-1')).toHavePosition('west');
});
```

## Implementation Order

1. **Modify moveMapItem API** to return all modified items
2. **Create useDragAndDrop hook** with basic drag state
3. **Update DynamicMapCanvas** to use the hook
4. **Add drag handlers to DynamicItemTile**
5. **Implement drop zones in DynamicEmptyTile**
6. **Add optimistic updates** with rollback
7. **Create DragPreview component**
8. **Write tests** (unit and integration)

## Success Criteria

- [ ] Tiles can be dragged to empty sibling positions
- [ ] Visual feedback shows during drag operation
- [ ] Optimistic updates provide instant feedback
- [ ] Descendants move with their parent
- [ ] Failed moves rollback gracefully
- [ ] Only tile owners can drag their tiles
- [ ] UserTiles (root) cannot be dragged

## Security Considerations

1. **Ownership Validation**: Double-check ownership on both client and server
2. **Path Validation**: Ensure moves don't create invalid hierarchies
3. **Rate Limiting**: Prevent rapid move operations
4. **Audit Trail**: Log all move operations for debugging

## Performance Considerations

1. **Render Optimization**: Drag state changes don't re-render all tiles
2. **Batch Updates**: Update multiple tiles in single cache operation
3. **Debounced Drag Over**: Limit drop target calculations during drag
4. **Lazy Loading**: Only load descendant data when needed

## Future Enhancements

1. **Tile Swapping**: Exchange positions between two tiles
2. **Cross-Parent Moves**: Move tiles between different parents
3. **Multi-Select**: Drag multiple tiles at once
4. **Touch Support**: Handle touch events for mobile
5. **Undo/Redo**: Action history with rollback
6. **Keyboard Navigation**: Arrow keys for tile movement
7. **Animation**: Smooth transitions during moves

## Related Issues

- #29: Feature: Drag and Drop Tiles for Spatial Reorganization
- #30: Architecture: Drag and Drop Implementation Design
- #31: Fix E2E Test Configuration
- #32: Add Transaction Support for Atomic Operations