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
├── hooks/
│   ├── useDragAndDrop.ts     # Main drag and drop orchestration hook
│   ├── useDragAndDropWithMutation.ts  # Wrapper with tRPC mutation
│   ├── types.ts              # TypeScript interfaces
│   ├── _validators/          # Permission and validation logic
│   │   └── drag-permission.ts
│   ├── _calculators/         # Drop target calculations
│   │   └── drop-targets.ts
│   ├── _orchestrators/       # Complex operation orchestration
│   │   └── optimistic-move.ts
│   └── _coordinators/        # Event handling coordination
│       └── drag-events.ts
└── types.ts                  # Canvas-specific types
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
5. **Modular Architecture**: Separated concerns into focused modules following the Rule of 6

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

### Module Responsibilities

#### Validators (`_validators/`)
- **drag-permission.ts**: Checks if a tile can be dragged based on:
  - User ownership (currentUserId must match tile's ownerId)
  - Tile type (root tiles cannot be dragged)
  - Tile existence

#### Calculators (`_calculators/`)
- **drop-targets.ts**: Determines valid drop locations:
  - Finds empty sibling positions
  - Validates drop target compatibility
  - Returns array of valid coordinate IDs

#### Orchestrators (`_orchestrators/`)
- **optimistic-move.ts**: Manages the entire move operation:
  - Captures rollback state before changes
  - Updates parent tile coordinates and color
  - Updates all child tiles recursively
  - Handles API calls and rollback on failure
  - Confirms server updates after success

#### Coordinators (`_coordinators/`)
- **drag-events.ts**: Thin wrappers for browser events:
  - Sets data transfer properties
  - Prevents default behaviors
  - Creates and updates drag state

### Event Flow

1. **Drag Start** (`handleDragStart`)
   - Calls `canDragTile` validator to check permissions
   - Creates drag state with `createDragState`
   - Sets up data transfer with `setupDragStart`

2. **Drag Over** (`handleDragOver`)
   - Calls `isValidDropTarget` to check if drop is allowed
   - Updates visual feedback with `setupDragOver`
   - Updates drop target in state

3. **Drop** (`handleDrop`)
   - Validates drop target one final time
   - Calls `performOptimisticMove` to execute the move
   - Resets drag state after operation

4. **Drag End** (`handleDragEnd`)
   - Resets drag state to initial values

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

### Hook API

The `useDragAndDrop` hook returns:

```typescript
interface UseDragAndDropReturn {
  dragState: DragState;                          // Current drag state
  dragHandlers: {
    onDragStart: (coordId, event) => void;      // Start dragging
    onDragOver: (targetId, event) => void;      // Drag over target
    onDragLeave: () => void;                    // Leave drop target
    onDrop: (targetId, event) => void;          // Drop on target
    onDragEnd: () => void;                      // End drag operation
  };
  canDragTile: (id: string) => boolean;         // Check if draggable
  isValidDropTarget: (id: string) => boolean;   // Check if valid target
  isDraggingTile: (id: string) => boolean;      // Check if tile is being dragged
  isDropTarget: (id: string) => boolean;        // Check if tile is drop target
  isDragging: boolean;                          // Global dragging state
}
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

### Unit Tests (`hooks/__tests__/useDragAndDrop.test.ts`)
- Drag state management and transitions
- Permission validation (ownership, tile type)
- Drop target calculations
- Event handler behavior
- State updates and resets

### Module Tests
- **Validators**: Test permission logic in isolation
- **Calculators**: Test drop target algorithms
- **Orchestrators**: Test optimistic update logic
- **Coordinators**: Test event handling

### Integration Tests
- API interaction with mocked tRPC
- Optimistic update and rollback scenarios
- Multi-tile move operations (parent + children)
- Error handling and recovery

### E2E Tests
- Full drag and drop user flows
- Multi-user permission scenarios
- Edge cases (network failures, race conditions)

## Future Enhancements

1. **Touch Support** - Mobile and tablet drag interactions
2. **Multi-select** - Drag multiple tiles at once
3. **Keyboard Navigation** - Arrow key movement
4. **Undo/Redo** - Action history management
5. **Animation** - Smooth transitions during moves

## Code Organization

### Following the Rule of 6

The drag and drop implementation follows Hexframe's Rule of 6 principle:

- **Main Hook**: 122 lines (high-level orchestration)
- **Validators**: ~23 lines per file (single responsibility)
- **Calculators**: ~47 lines per file (focused algorithms)
- **Orchestrators**: ~167 lines (acceptable for low-level implementation)
- **Coordinators**: ~44 lines per file (thin wrappers)

Each module maintains a single level of abstraction and clear responsibility boundaries.

## Domain Concepts

### Optimistic UI Patterns

#### OptimisticUpdateRollback
A reusable pattern for handling optimistic UI updates with automatic rollback capability:
- **Purpose**: Capture state before changes and provide rollback on failure
- **Usage**: Wrap any async operation that needs optimistic updates
- **Location**: `hooks/_orchestrators/optimistic-swap/rollback-handler.ts`
- **Key Methods**:
  - `captureState()`: Saves current state before changes
  - `rollback(previousState)`: Restores state on error
  - `withRollback()`: Higher-order function for automatic rollback
  - `executeOptimisticUpdate()`: Complete optimistic update flow

#### TileSwapOperation
Encapsulates the logic of swapping two tiles' positions:
- **Responsibilities**: Coordinate swapping, color updates, parent reassignment
- **Location**: `hooks/_orchestrators/optimistic-swap/swap-operation.ts`
- **Key Operations**:
  - Swaps coordinates between tiles
  - Updates colors based on new positions
  - Maintains data consistency

#### ChildrenRelocationStrategy
Manages how child tiles follow their parent during swaps:
- **Purpose**: Preserve hierarchical relationships during tile movements
- **Location**: `hooks/_orchestrators/optimistic-swap/children-relocation.ts`
- **Process**:
  - Calculates relative paths from old parent
  - Applies paths to new parent location
  - Updates all child metadata and colors

#### ServerSynchronizer
Confirms optimistic updates with server responses:
- **Purpose**: Ensure eventual consistency between optimistic and server state
- **Location**: `hooks/_orchestrators/optimistic-swap/server-sync.ts`
- **Features**:
  - Maps server response to cache updates
  - Handles partial update scenarios
  - Only updates fields that changed on server

### Move Operation Patterns

#### MoveOperation
Distinguishes between simple moves and swap operations:
- **Purpose**: Determine appropriate update strategy based on target occupancy
- **Location**: `hooks/_orchestrators/optimistic-move/move-detector.ts`
- **Types**:
  - `move`: Target position is empty
  - `swap`: Target position is occupied

#### ChildrenMigrationStrategy
Manages child tile migration during parent moves:
- **Purpose**: Preserve hierarchical relationships during any move operation
- **Location**: `hooks/_orchestrators/optimistic-move/children-migration.ts`
- **Features**:
  - Calculates new positions for all children
  - Preserves relative positions
  - Updates colors based on new locations
  - Shared utility for both moves and swaps

#### SwapHandler
Adapter for delegating swap operations:
- **Purpose**: Reuse optimistic-swap logic within move operations
- **Location**: `hooks/_orchestrators/optimistic-move/swap-handler.ts`
- **Features**:
  - Adapts move mutation interface to swap interface
  - Delegates to performOptimisticSwap
  - Ensures consistency between move and swap behaviors

#### ServerSynchronizer (Move)
Specialized server sync for move operations:
- **Purpose**: Confirm move updates with server response
- **Location**: `hooks/_orchestrators/optimistic-move/server-sync.ts`
- **Features**:
  - Handles both moved parent and children
  - Parses flexible parentId formats
  - Replaces optimistic state with server truth

## Related Documentation

- [Tiles Documentation](../Tile/README.md)
- [Cache Documentation](../Cache/README.md)
- [Mapping Domain](../../../lib/domains/mapping/README.md)
- [Refactoring Session](../../../../prompts/refactors/2025-01-17-drag-drop-hook-clarity.md)