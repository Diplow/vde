# Map Page (`src/app/map/[id]/`)

This directory contains all the code related to displaying and interacting with a specific hexagonal map, identified by `[id]`. It uses Next.js App Router conventions for dynamic routing.

## Core Page Files

- **`page.tsx`**: The main entry point for the map page. It fetches map data (center item and all other items for the map) using tRPC, initializes map parameters from URL search params (like scale, expanded items, focus), and renders the `StaticMapCanvas`. It also handles redirection for initial focus settings.
- **`layout.tsx`**: Provides the basic layout structure for the map page, typically ensuring it takes up the full screen and sets a background color.
- **`loading.tsx`**: A simple component displayed while the map data is being fetched.
- **`error.tsx`**: A client-side component that handles and displays errors that occur during data fetching or rendering of the map. It provides a "Retry" option.
- **`not-found.tsx`**: A component displayed if the requested map ID does not correspond to an existing map.
- **`constants.ts`**: Contains shared constants used across the map page, including `DEFAULT_HEXMAP_COLORS` for hexagon direction color mapping and hierarchy tile constants like `HIERARCHY_TILE_BASE_HEXSIZE` and `HIERARCHY_TILE_SCALE`.

## Subdirectories

### `Canvas/`

This subdirectory holds components responsible for rendering the visual canvas of the map.

- **`index.static.tsx`**: Exports `StaticMapCanvas`, which is the primary component orchestrating the rendering of the entire static map view. It takes the center coordinate, all map items, scale, expanded item IDs, and current path/search params to render the map.
- **`hex-region.static.tsx`**: Renders a "region" of the map. If the central item of this region is expanded, it recursively renders its children as smaller `StaticHexRegion` or `StaticItemTile` components. It's crucial for the hierarchical display of the map.
- **`mini-map.static.tsx`**: Renders the static version of the minimap. It displays a scaled-down version of the map, highlighting the current viewport and allowing navigation.
- **`*.stories.tsx`**: Storybook files for visually testing the canvas components in isolation.

### `Controls/`

Contains React components that provide user interaction controls for the map.

- **`index.tsx`**: Barrel file exporting all control components.
- **`ActionPanel.tsx`**: A UI panel allowing users to switch between different interaction modes (e.g., select, expand, edit, delete, lock). It manages its own state (collapsed, shortcuts, full) and updates the global interaction mode.
- **`mini-map.controller.tsx`**: Manages the behavior and state of the minimap. It tracks the main map's scroll position to update the minimap's viewport, handles toggling minimap visibility, and facilitates navigation by clicking on the minimap.
- **`scale.controller.tsx`**: A UI component that allows users to change the zoom level (scale) of the map. It updates the `scale` search parameter in the URL.

### `Dialogs/`

Houses components for displaying dialogs or modals to the user.

- **`confirmation.tsx`**: A generic confirmation dialog component used to ask the user for confirmation before performing an action (e.g., deleting an item).

### `State/`

Manages the client-side state for the interactive map canvas. This is primarily for the dynamic version of the map, but some types and utilities might be shared.

- **`index.ts`**: Exports the main hook `useMapCanvasState`, which consolidates various aspects of the map's state, including item data, selection, mutations, and interaction modes.
- **`init.ts`**: Contains the `useInit` hook, responsible for initializing and managing the `itemsById` state (a record of all map items).
- **`interactionMode.ts`**: Defines and manages the current `ActionMode` (e.g., `select`, `edit`, `delete`). It handles user clicks on tiles based on the active mode and persists the mode to `localStorage`.
- **`items.reducer.ts`**: A reducer function (`itemsReducer`) used to manage the state of map items (adding, updating, deleting, and changing expansion state).
- **`mutations.ts`**: Contains the `useMutations` hook, which handles client-side logic for creating, updating, deleting, and moving map items. It uses tRPC mutations to interact with the backend and includes optimistic updates.
- **`dragandrop.ts`**: Provides functions and configuration for handling drag-and-drop operations of map items, including creating custom drag images.
- **`types.ts`**: Defines core TypeScript types used across the map state, notably `HexTileData`, and includes an `adapt` function to transform API data into the client-side `HexTileData` format.

### `Tile/`

Components related to rendering individual hexagonal tiles on the map.

- **`base.static.tsx`**: `StaticBaseTileLayout` is a fundamental component that renders the basic hexagonal shape. It handles scaling, color, stroke, and can contain child content.
- **`content.static.tsx`**: `StaticTileContent` is responsible for rendering the actual content (title, description, URL) inside a tile. It adjusts the visibility and truncation of content based on the tile's scale.
- **`item.static.tsx`**: `StaticItemTile` combines `StaticBaseTileLayout` and `StaticTileContent` to render a complete map item. It also includes logic for an expand/collapse button that modifies URL search parameters to trigger re-renders.
- **`item-minimap.static.tsx`**: `StaticMiniMapItemTile` is a simplified version of a tile, specifically designed for display within the minimap. Clicking it updates the `focus` search parameter to scroll the main map.
- **`*.stories.tsx`**: Storybook files for visually testing the tile components.

## Overall Flow (Static Rendering)

1.  User navigates to `/map/[id]`.
2.  `page.tsx` fetches map data (center and items).
3.  URL search parameters (`scale`, `expandedItems`, `focus`) are parsed.
4.  `StaticMapCanvas` is rendered with the initial data and parameters.
5.  `StaticMapCanvas` renders a `StaticHexRegion` for the central focused item.
6.  `StaticHexRegion` renders the central `StaticItemTile` or, if expanded, recursively renders child `StaticHexRegion`s or `StaticItemTile`s.
7.  `StaticItemTile` displays item data and provides an expand/collapse button. Clicking this button updates the `expandedItems` and `focus` search parameters in the URL, leading to a re-render with the new state.
8.  Controls like `ScaleController` and `MiniMapController` also interact by modifying URL search parameters.
