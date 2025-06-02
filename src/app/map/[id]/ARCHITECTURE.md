# Map Application Architecture

## Overview

The map application follows a **progressive enhancement architecture** that starts with server-side rendered static components and progressively adds client-side interactivity. This approach ensures excellent performance, SEO, and accessibility while providing rich interactive features when needed.

## Core Architectural Principles

### 1. Progressive Enhancement Philosophy

The application is built on three foundational layers:

- **Static Layer**: Pure server-side rendering with URL-based state management
- **Pseudo-Static Layer**: Client-side enhancements using localStorage and URL parameters
- **Dynamic Layer**: Full client-side interactivity with optimistic updates and real-time features

### 2. Component Interaction Patterns

**Static ↔ Dynamic Composition**: Static components remain unchanged and are wrapped or enhanced by dynamic components, ensuring backward compatibility and reusability.

**Data Source Abstraction**: Static components work with any data source, while dynamic components provide cached or real-time data.

**Selective Enhancement**: Only features that truly benefit from dynamic behavior are enhanced, keeping the core functionality robust and accessible.

## State Management Strategy

### URL-First State Management

The application prioritizes URL parameters for shareable and bookmarkable state:

- **Expansion state**: Which tiles are expanded/collapsed
- **Focus state**: Current viewport center
- **Scale state**: Zoom level
- **Filter state**: Applied filters and search parameters

### Hierarchical State Layers

1. **URL State** (highest priority): Shareable, SEO-friendly, persistent across sessions
2. **localStorage State**: User preferences and interaction modes
3. **Component State**: Temporary UI state (drag operations, dialogs, loading states)
4. **Cache State**: Server data with background synchronization

## Component Architecture Layers

### 1. Page Layer (`page.tsx`)

**Responsibility**: Server-side data fetching, URL parameter parsing, initial data formatting

- Fetches map data via tRPC
- Validates and processes URL parameters
- Renders appropriate canvas component based on requirements
- Handles initial focus and redirection logic

### 2. Canvas Layer

#### StaticMapCanvas (`Canvas/index.static.tsx`)

**Type**: Static (Pure Rendering)

- Orchestrates layout of hex regions, controls, and overlays
- Works with any data source
- No state management or side effects
- Reusable in both SSR and client contexts

#### DynamicMapCanvas (`Canvas/index.dynamic.tsx`)

**Type**: Dynamic (Client-Side)

- Hydration bridge between server and client
- Manages cache synchronization and background updates
- Provides centralized tile action management
- Wraps StaticMapCanvas with dynamic data and behaviors

### 3. Region Layer

#### StaticHexRegion (`Canvas/hex-region.static.tsx`)

**Type**: Static (Pure Rendering)

- Recursive hexagonal layout rendering
- Handles expansion logic based on URL parameters
- No client-side state or interactions
- Renders tile components in hexagonal patterns

### 4. Tile Layer

#### StaticBaseTileLayout (`Tile/Base/base.static.tsx`)

**Type**: Static (Pure Rendering)

- Fundamental hexagon shape rendering
- Handles scaling, colors, and basic layout
- No interactivity or state

#### StaticItemTile (`Tile/Item/item.static.tsx`)

**Type**: Pseudo-Static (URL State)

- Renders item content and basic buttons
- Uses URL parameters for expand/collapse state
- Navigation through Next.js Link components
- No client-side state management

#### DraggableItemTile (`Tile/Item/draggable-item.tsx`)

**Type**: Dynamic (Client-Side) - _Planned_

- Wraps StaticItemTile with drag-and-drop functionality
- Manages drag state and visual feedback
- Integrates with centralized action management

### 5. Controls Layer

#### ActionPanel (`Controls/ActionPanel.tsx`)

**Type**: Pseudo-Static (localStorage + URL)

- Manages interaction modes (select, edit, delete, etc.)
- Persists state to localStorage
- Updates document cursor based on mode
- No server-side state dependencies

#### ScaleController (`Controls/scale.controller.tsx`)

**Type**: Pseudo-Static (URL State)

- Manages zoom level through URL parameters
- Uses Next.js router for navigation
- Loading states during transitions

## Data Flow Architecture

### Region-Based Caching Strategy

#### Region Concept

A **region** represents a complete map dataset identified by `userId-groupId` pairs.

**Design Rationale**:

- **Data Locality**: Items within the same user-group context are frequently accessed together
- **Permission Boundaries**: User-group combinations align with data access permissions
- **Cache Efficiency**: Bulk loading reduces API calls and improves performance
- **Predictable Invalidation**: Changes can be efficiently invalidated at the region level

#### Hierarchical Loading Strategy

**Problem**: Large maps with thousands of items don't scale with region-based loading.

**Solution**: Depth-based incremental loading with practical limits.

**Core Principle**: Load items progressively based on their depth in the hierarchy:

- **Initial Load**: Center + immediate children + grandchildren (max ~43 items)
- **On-Demand Expansion**: Load additional depth levels when navigating/expanding
- **Background Prefetching**: Intelligently prefetch likely-to-be-accessed items

#### Item-Based Cache Key Structure

Cache individual items by their coordinates rather than by regions to avoid duplication and enable efficient updates:

```typescript
// Cache individual items by coordinates
interface ItemCacheKey {
  coordId: string; // "userId,groupId:path" - unique coordinate
  loadedAt: timestamp; // For cache invalidation
}

// Track which regions have been loaded
interface RegionMetadata {
  centerCoordId: string; // Focal point that was loaded
  maxDepth: number; // Maximum depth loaded from this center
  loadedAt: timestamp; // When this region was loaded
  itemCoordIds: string[]; // Which items were loaded
}
```

**Benefits**:

- **No Duplication**: Each item exists once in cache
- **Efficient Updates**: Updating an item updates it everywhere
- **Simple Invalidation**: Invalidate by coordId affects all regions
- **Memory Efficient**: No redundant storage
- **Consistent State**: Single source of truth per item

## Centralized Tile Action Management

### Problem: Hook Proliferation

With hundreds of tiles rendered simultaneously, individual hooks in each tile would create performance issues and memory overhead.

### Solution: Centralized Action Coordination

The DynamicMapCanvas acts as a **centralized action coordinator**:

1. **Provides Context**: Uses React Context to provide action handlers to all descendant tiles
2. **Coordinates by Coordinates**: Tiles identify themselves by coordinate ID for action routing
3. **Manages Interaction State**: Centralizes interaction mode logic (select, edit, delete, etc.)
4. **Optimizes Performance**: Single set of handlers shared across all tiles

**Benefits**:

- **Performance**: Single set of handlers instead of N×handlers for N tiles
- **Consistency**: All tiles use the same interaction logic
- **Maintainability**: Action logic centralized in one place
- **Flexibility**: Easy to add new interaction modes
- **Memory Efficiency**: Reduced memory footprint for large maps

## Dynamic Requirements Analysis

### Confirmed Dynamic Requirements

**1. Map Edition (CRUD + Move Operations)**

- **Why Dynamic**: Immediate feedback, optimistic updates, complex state management
- **Implementation**: Dynamic mutations with cache updates

**2. Authentication State Management**

- **Why Dynamic**: Session changes, permission updates, real-time auth status
- **Implementation**: Auth context with dynamic components

### Features That Work Well Pseudo-Static

**3. Tile Navigation**

- **Current Approach**: URL-based navigation (instant, SEO-friendly, shareable)
- **Recommendation**: Keep pseudo-static - URL navigation is more robust

**4. Tile Expansion/Collapse**

- **Current Approach**: URL expandedItems parameter
- **Why Superior**: Shareable state, SEO benefits, simple implementation

**5. Scale Changes**

- **Current Approach**: URL parameter with page re-render
- **Recommendation**: Keep pseudo-static - scale changes are infrequent

### Decision Framework

**Make Dynamic If**:

- Requires immediate user feedback
- Involves complex state management
- Benefits from optimistic updates
- Needs real-time data synchronization

**Keep Pseudo-Static If**:

- State should be shareable via URL
- Feature is used infrequently
- SEO/accessibility is important
- Implementation complexity is high relative to benefit

## Dynamic-to-Static Fallback Strategy

### Selective Fallback Implementation

**Tier 1: Core Features - Full Fallback**

- Essential features that MUST work without JS
- Examples: View map, navigate tiles, expand tiles, basic auth

**Tier 2: Enhanced Features - Graceful Degradation**

- Features that enhance UX but aren't critical
- Examples: Create/edit tiles (fallback to dedicated pages), delete tiles (fallback to confirmation pages)

**Tier 3: Dynamic-Only Features - Clear Limitations**

- Features that only work with JS, but clearly communicate this
- Examples: Drag-and-drop, real-time sync, optimistic updates

## Performance Implications

### Current Benefits

- **Instant Initial Loads**: Full SSR with no hydration delay
- **SEO Optimized**: All content available to crawlers
- **Shareable URLs**: All state encoded in URL
- **No JavaScript Required**: Basic functionality works without JS

### Dynamic Enhancements

- **Smooth Interactions**: Client-side state updates
- **Background Sync**: Fresh data without page reloads
- **Optimistic Updates**: Immediate feedback for user actions
- **Intelligent Caching**: Reduced server load and faster navigation

## Development Guidelines

### When to Use Static Components

- Pure rendering logic
- Server-side rendering requirements
- Shareable/bookmarkable state
- SEO-critical content

### When to Use Dynamic Components

- Real-time interactions
- Optimistic updates
- Complex state management
- Background data synchronization

### Component Naming Convention

- `Static*`: Pure rendering components
- `Dynamic*`: Client-side enhanced components
- `*Controller`: Pseudo-static components with URL/localStorage state
- `use*Manager`: Hooks for complex state management

## Migration Strategy

### Phase 1: Foundation (Current)

- ✅ Static components with URL state
- ✅ Pseudo-static interactions via navigation
- ✅ Server-side rendering and data fetching

### Phase 2: Cache System

- 🔄 MapCacheProvider and useMapCache hook
- 🔄 DynamicMapCanvas as bridge component
- 🔄 Background synchronization

### Phase 3-6: Feature Enhancement

- 📋 Create/Update/Delete flows with dynamic dialogs
- 📋 Drag-and-drop with DraggableItemTile
- 📋 Real-time collaboration features
- 📋 Advanced caching strategies

---

## Implementation Examples

### Static ↔ Dynamic Composition

**Pattern 1: Wrapper Enhancement**

```typescript
// Static component remains unchanged
export const StaticItemTile = ({ item, urlInfo }) => { /* pure rendering */ };

// Dynamic wrapper adds functionality
export function DynamicItemTile({ item, urlInfo }) {
  const [dragState, setDragState] = useState();
  const { updateItem } = useMutations();

  return (
    <div onDragStart={handleDrag}>
      <StaticItemTile item={item} urlInfo={urlInfo} />
      <EditDialog onSubmit={updateItem} />
    </div>
  );
}
```

**Pattern 2: Data Source Abstraction**

```typescript
// Static component works with any data source
export const StaticMapCanvas = ({ items, centerInfo }) => { /* rendering */ };

// Dynamic component provides cached data
export function DynamicMapCanvas({ centerInfo }) {
  const { state } = useMapCache();
  return <StaticMapCanvas items={state.itemsById} centerInfo={centerInfo} />;
}
```

**Pattern 3: Progressive Enhancement**

```typescript
// Page decides which version to render
export default async function HexMapPage({ searchParams }) {
  const isDynamic = searchParams.dynamic === 'true';
  const data = await fetchData();

  if (isDynamic) {
    return (
      <MapCacheProvider initialItems={data}>
        <DynamicMapCanvas />
      </MapCacheProvider>
    );
  }

  return <StaticMapCanvas items={data} />;
}
```

### Centralized Tile Actions

```typescript
// Centralized tile actions hook
function useTileActions() {
  const { interactionMode } = useInteractionMode();
  const { mutations } = useMutations();

  const handleTileClick = useCallback((coordId: string, event: MouseEvent) => {
    switch (interactionMode) {
      case 'edit':
        mutations.setTileToMutate(coordId);
        break;
      case 'delete':
        // Show confirmation dialog
        break;
      case 'expand':
        // Handle expansion logic
        break;
    }
  }, [interactionMode, mutations]);

  return { handleTileClick, handleTileDrag, handleTileHover };
}

// Tiles consume actions via context
function DynamicItemTile({ item }) {
  const { onTileClick } = useTileActionsContext();

  return (
    <div onClick={(e) => onTileClick(item.metadata.coordId, e)}>
      <StaticItemTile item={item} />
    </div>
  );
}
```

### Hierarchical Loading Implementation

```typescript
interface HierarchicalMapCache {
  // Cache structure: items by coordId + region metadata
  itemsById: Record<string, HexTileData>; // Key: "userId,groupId:path"
  regionMetadata: Record<string, RegionMetadata>; // Key: "userId,groupId:centerPath"

  // Initial load for a map center
  loadMapRegion(
    centerCoordId: string, // "userId,groupId:path"
    maxDepth: number = 3,
  ): Promise<MapItem[]>;

  // Expansion load for a specific item
  loadItemChildren(
    itemCoordId: string, // "userId,groupId:path"
    maxDepth: number = 2,
  ): Promise<MapItem[]>;

  // Check if we have sufficient data for rendering
  hasRequiredDepth(centerCoordId: string, requiredDepth: number): boolean;

  // Check if a specific item is cached
  hasItem(coordId: string): boolean;

  // Get items for a specific region (from cache)
  getRegionItems(centerCoordId: string, maxDepth: number): HexTileData[];
}
```

### Feature Detection Pattern

```typescript
function useFeatureDetection() {
  const [capabilities, setCapabilities] = useState({
    hasJS: false,
    hasLocalStorage: false,
    hasWebSockets: false,
  });

  useEffect(() => {
    setCapabilities({
      hasJS: true,
      hasLocalStorage: typeof localStorage !== "undefined",
      hasWebSockets: typeof WebSocket !== "undefined",
    });
  }, []);

  return capabilities;
}

function AdaptiveFeature({ children, fallback, requiresJS = true }) {
  const { hasJS } = useFeatureDetection();

  if (requiresJS && !hasJS) {
    return fallback;
  }

  return children;
}
```
