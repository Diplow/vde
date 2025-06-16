# Canvas Component

The Canvas is the core interactive surface for the Hexframe map, managing tile rendering, user interactions, and drag-and-drop functionality.

## Overview

The Canvas component serves as the main container for the hexagonal map visualization. It handles all user interactions, manages the rendering of tiles, and coordinates state updates between the UI and the data cache.

## Responsibilities

### 1. **Tile Rendering**
- Orchestrates the rendering of all visible tiles based on viewport
- Manages tile visibility and lazy loading
- Handles different tile states (empty, item, user tiles)

### 2. **Interaction Management**
- Provides interaction handlers through `TileActionsContext`
- Manages click, hover, and drag events
- Enforces permission-based interactions (owner-only actions)

### 3. **Drag and Drop**
- Owns and manages drag state to prevent unnecessary re-renders
- Coordinates tile movement and position swapping
- Handles optimistic updates for smooth UX
- Validates drop targets and provides visual feedback

### 4. **State Synchronization**
- Bridges between ephemeral UI state and persistent cache state
- Manages optimistic updates and rollbacks
- Coordinates with tRPC mutations for server synchronization

### 5. **Viewport Management**
- Controls zoom levels and pan positioning
- Optimizes rendering for visible tiles only
- Handles responsive layout adjustments

## Architecture

### Component Structure

```
Canvas/
├── index.tsx                  # Main DynamicMapCanvas component
├── StaticMapCanvas.tsx        # Read-only version for performance
├── hooks/
│   └── useDragAndDrop.ts     # Drag and drop logic
├── components/
│   └── DragPreview.tsx       # Visual feedback during drag
└── TileActionsContext.tsx    # Interaction handlers provider
```

### Component Hierarchy

```
DynamicMapCanvas
├── TileActionsContext.Provider
├── DragPreview (when dragging)
└── MapViewport
    └── Tiles (Item/Empty/User)
```

### State Management

The Canvas maintains two types of state:

1. **UI State** (ephemeral, local)
   - Current drag state
   - Hover states
   - Selection state
   - Viewport position

2. **Data State** (persistent, in cache)
   - Tile positions and content
   - Ownership information
   - Hierarchical relationships

## Drag and Drop Architecture

### Design Principles

1. **Centralized State**: All drag state lives in the Canvas to minimize re-renders
2. **Context Distribution**: Tiles receive handlers via context, not props
3. **Optimistic Updates**: Immediate visual feedback with API synchronization
4. **Progressive Enhancement**: Basic functionality first, advanced features later

### Drag State Structure

```typescript
interface DragState {
  isDragging: boolean;
  draggedTileId: string | null;
  draggedTileData: TileData | null;
  dropTargetId: string | null;
  dragOffset: { x: number; y: number };
}
```

### Event Flow

1. **Drag Start**
   - Validate ownership and draggability
   - Capture tile data and position
   - Show drag preview

2. **Drag Over**
   - Calculate valid drop targets
   - Highlight drop zones
   - Update cursor feedback

3. **Drop**
   - Validate drop target
   - Trigger optimistic update
   - Call moveMapItem API
   - Handle success/failure

## Usage

### Basic Usage

```tsx
import { DynamicMapCanvas } from '@/app/map/Canvas';

function MapPage() {
  return (
    <DynamicMapCanvas 
      userId={123}
      groupId={456}
      selectedTileId="tile-789"
    />
  );
}
```

### With Custom Handlers

```tsx
<DynamicMapCanvas 
  userId={userId}
  groupId={groupId}
  onTileSelect={(tileId) => console.log('Selected:', tileId)}
  onTileMove={(from, to) => console.log('Moved:', from, to)}
/>
```

## API Integration

The Canvas integrates with the following tRPC endpoints:

- `mapItems.moveMapItem` - Move or swap tile positions
- `mapItems.getDescendants` - Fetch updated descendants after move
- `mapItems.create` - Create new tiles in empty positions
- `mapItems.update` - Update tile content

## Performance Considerations

1. **Render Optimization**
   - Only visible tiles are rendered
   - Static tiles use memoization
   - Drag state changes don't trigger full re-renders

2. **State Updates**
   - Optimistic updates for immediate feedback
   - Batch updates when possible
   - Debounced viewport updates

3. **Memory Management**
   - Cleanup drag state on unmount
   - Remove event listeners properly
   - Clear preview elements after drag

## Testing

### Unit Tests
- Drag state management
- Permission validation
- Coordinate calculations

### Integration Tests
- API interaction mocking
- Optimistic update scenarios
- Error handling and rollback

### E2E Tests
- Full drag and drop flows
- Multi-user scenarios
- Edge cases and error states

## Future Enhancements

1. **Touch Support** - Mobile and tablet drag interactions
2. **Multi-select** - Drag multiple tiles at once
3. **Keyboard Navigation** - Arrow key movement
4. **Undo/Redo** - Action history management
5. **Animation** - Smooth transitions during moves

## Related Documentation

- [Tiles Documentation](../Tiles/README.md)
- [Cache Documentation](../Cache/README.md)
- [Mapping Domain](../../../lib/domains/mapping/README.md)