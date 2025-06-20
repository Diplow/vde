# Refactor plan: Removing the Map and using MapItem instead.

## Problem

Maps do not hold any valuable information that the center Item does not have. Having both objects makes it more complicated that it needs to be.

## Context

Read those files for a global understanding of the project architecture:

- README.md : a high level presentation of the project
- src/app/map/[id]/README.md : a presentation of the main page of the application and its structure
- src/server/README.md : a presentation of the backend server of the application and its structure
- src/lib/domains/mapping/README.md : a presentation of the mapping domain
- src/lib/auth/README.md : a presentation of the authentication solution used in this project

## High Level Goal

1. Remove the map concept, making each user's "map" a tree of `MapItem`s originating from a special root `MapItem` associated with the user. The root item's coordinates will incorporate the user's ID.

## Implementation Details

1. **Phase 1**: Refactoring the map domain
   - **Step 1.1**: Define new Coordinate System and Update Utilities.
     - Redefine `HexCoord` in `src/lib/domains/mapping/utils/hex-coordinates.ts`: `{ userId: number; groupId: number; path: HexDirection[]; }`.
     - Rename `HexCoordSystem` to `CoordSystem` in `src/lib/domains/mapping/utils/hex-coordinates.ts`.
     - Modify all methods within `CoordSystem` (`getCenterCoord`, `parseId`, `createId`, etc.) to use `HexCoord`.
       - `createId` format: e.g., `"userId,groupId:pathString"` (e.g., `"123,0:1,2,3"`).
       - `getCenterCoord(userId: number, groupId: number = 0)`: returns `{ userId, groupId, path: [] }`.
   - **Step 1.2**: Modify `MapItem` domain object.
     - In `src/lib/domains/mapping/_objects/map-item.ts`:
       - Remove `mapId?: number | null` from `Attrs`.
       - Update `coords: HexCoord` to `coords: HexCoord`.
       - Modify `MapItemType` enum: Keep only `USER = "user"` and `BASE = "base"`. Remove other types.
       - Constructor and validation updates:
         - If `itemType` is `USER`, then `parentId` _must_ be `null`.
         - If `parentId` is `null`, then `itemType` _must_ be `USER`.
         - `coords.userId` and `coords.groupId` for child items should match their parent's `coords.userId` and `coords.groupId`.
       - The title/description of what was a "map" now comes from the `BaseItem` referenced by the root (`USER` type) `MapItem`.
   - **Step 1.3**: Remove `HexMap` domain object.
     - Delete the file `src/lib/domains/mapping/_objects/hex-map.ts`.
     - Update `src/lib/domains/mapping/_objects/index.ts` to remove all exports related to `HexMap` (`MapAttrs`, `MapRelatedItems`, `MapRelatedLists`, `HexMapIdr`, `MapWithId`).
   - **Step 1.4**: Modify `MapItemRepository` interface.
     - In `src/lib/domains/mapping/_repositories/map-item.ts`:
       - Define `getRootItem(userId: number, groupId: number): Promise<MapItemWithId | null>` (fetches the `USER` type item).
       - Define `getRootItemsForUser(userId: number, limit?: number, offset?: number): Promise<MapItemWithId[]>` (fetches all `USER` type items for a user, across all their groupIds).
       - Update `getDescendantsByParent({ parentPath: HexCoord['path'], parentUserId: number, parentGroupId: number, limit, offset })`: No longer needs `mapId`.
       - Update `MapItemIdr`: Remove `mapId`. `coords` part becomes `coords: HexCoord`.
       - `getOneByIdr` will use `HexCoord` for identification.
   - **Step 1.5**: Remove `MapRepository` interface.
     - Delete the file `src/lib/domains/mapping/_repositories/hex-map.ts`.
     - Update `src/lib/domains/mapping/_repositories/index.ts` to remove the export of `MapRepository`.
   - **Step 1.6**: Refactor `MapActions` (rename to `MapItemActions`).
     - Rename `src/lib/domains/mapping/_actions/hex-map.ts` to `map-item.actions.ts`.
     - Update `src/lib/domains/mapping/_actions/index.ts`.
     - In `map-item.actions.ts`:
       - Remove `MapRepository` usage.
       - Update `createMapItem`:
         - Params: `itemType: MapItemType`, `coords: HexCoord`, `ref: BaseItemWithId`, `parentId?: number`.
         - If `itemType === USER`, ensure `parentId` is `null`.
       - Remove old `HexMap`-specific methods.
       - `removeItem({ idr })`: Use new `MapItemIdr`.
       - `getItemsForMap({ userId: number, groupId: number })`: Fetches root and its descendants.
       - `getMapItem({ coords: HexCoord })`.
       - `moveMapItem({ oldCoords: HexCoord, newCoords: HexCoord })`.
       - `getDescendants(parentId: number)`: Will need parent's `coords` to pass to repository.
   - **Step 1.7**: Update `MapService` (rename to `MappingService`).
     - Rename `src/lib/domains/mapping/services/hex-map.ts` to `mapping.service.ts`.
     - Update `src/lib/domains/mapping/services/index.ts`.
     - In `mapping.service.ts`:
       - `getMapData({ userId: number, groupId: number })`: Fetches root `USER` `MapItem` and its tree.
       - `getManyUserMaps(userId: number, limit?, offset?)`: Fetches all root `USER` items for a user.
       - `createMap({ userId: number, groupId?: number, title?, descr? })`: Creates a root `USER` `MapItem`. `groupId` defaults to `0`. `coords` are `{ userId, groupId, path: [] }`.
       - `updateMapInfo({ userId: number, groupId: number, title?, descr? })`: Updates `BaseItem` of the root `USER` `MapItem`.
       - `removeMap({ userId: number, groupId: number })`: Deletes root `USER` `MapItem` and descendants.
       - `addItemToMap({ parentId: number, itemType: MapItemType, coords: HexCoord, title?, descr?, url? })`: Adds child.
       - Revise `MapContract` and `MapItemContract` in `src/lib/domains/mapping/types/contracts.ts`. `MapContract` represents a root `USER` `MapItem`'s view. Adapters use `HexCoord`.
   - **Step 1.8**: Update Database Schema and Create Migrations.
     - Generate a new Drizzle migration file.
     - Modify `src/server/db/schema/_tables/map-item.ts` (or the main schema file where `mapItems` is defined):
       - Remove `map_id` column.
       - Rename `row` to `coord_user_id: integer('coord_user_id').notNull()`.
       - Rename `col` to `coord_group_id: integer('coord_group_id').notNull().default(0)`.
       - `path` column (string for `HexDirection[]`) remains.
       - `parent_id: integer('parent_id')` (can be `NULL`.
       - `item_type: varchar('item_type', { length: 50 }).notNull()` (values: 'USER', 'BASE').
       - DB Constraints:
         - `CHECK ((item_type = 'USER' AND parent_id IS NULL) OR item_type != 'USER')`
         - `CHECK ((parent_id IS NULL AND item_type = 'USER') OR parent_id IS NOT NULL)`
         - (Effectively: `USER` type items must have `parent_id IS NULL`. Items with `parent_id IS NULL` must be `USER` type.)
       - Indexes: on `(coord_user_id, coord_group_id)` (for fetching user maps), unique on `(coord_user_id, coord_group_id, path)`, on `item_type`.
     - Remove the `hexMaps` table definition from the schema.
     - Update schema `index.ts` files in `src/server/db/schema/` if necessary.
   - **Step 1.9**: Update Infrastructure - Repository Implementations.
     - Delete the entire `src/lib/domains/mapping/infrastructure/hex-map/` directory.
     - Update `DbMapItemRepository` in `src/lib/domains/mapping/infrastructure/map-item/db.ts`:
       - Reflect schema changes (`coord_user_id`, `coord_group_id`, `item_type`).
       - Implement `getRootItem(userId, groupId)` and `getRootItemsForUser(userId)`.
       - Adapt data access methods for new schema and `HexCoord`.
       - When mapping DB to domain (`mapJoinedDbToDomain`), `MapItem.attrs.coords.userId` will be populated from `coord_user_id` for `USER` type items. For children, it's derived from the parent or root.
     - Update `src/lib/domains/mapping/infrastructure/index.ts` or similar barrel files.
   - **Step 1.10**: Update Domain Tests.
     - Rename `src/lib/domains/mapping/services/__tests__/hex-map.integration.test.ts` (e.g., to `mapping.integration.test.ts`).
     - Update test setup, especially `cleanupDatabase`, to align with the new schema (no `hexMaps` table, `mapItems` has no `mapId`).
     - Rewrite tests to focus on `MapItem` hierarchies. Test cases should cover:
       - Creation of root `MapItems` (assert `null` `parentId`).
       - Creation of child `MapItems` (assert `parentId`).
       - Fetching root items by `userId` and `groupId`.
       - Fetching descendants.
       - Operations like move, update, remove within the context of `MapItem` trees.
2. **Phase 2**: Refactoring the map router
   - **Step 2.1**: Update tRPC Context Service Dependencies.
     - In `src/server/api/trpc.ts`:
       - Remove `DbHexMapRepository` import and instantiation.
       - Update `mappingServiceMiddleware` to only use `mapItem` and `baseItem` repositories.
       - Replace `MapService` import with `MappingService`.
   - **Step 2.2**: Refactor Map Router to MapItem Router.
     - In `src/server/api/routers/map.ts`:
       - Update imports: `MappingService` instead of `MapService`.
       - **Remove map-centric endpoints**:
         - `getOne` (maps no longer exist as entities)
         - `getMany` (replaced by user-specific root items)
         - `create` (replaced by user-specific root creation)
         - `update` (replaced by root item base data update)
         - `delete` (replaced by root item deletion)
       - **Update existing endpoints**:
         - `getMyMaps` → `getMyRootItems`: Fetch all root `USER` type items for current user using `getManyUserMaps(userId)`.
         - `addItem`: Update to use new `HexCoord` structure, remove `mapId` param, use `parentId` and validate parent's `coords`.
         - `getItems` → `getItemsForRootItem`: Change input to `{ rootItemId: number }`, use `getMapData()`.
         - `removeItem`: Update to use new `MapItemIdr` structure with `HexCoord`.
         - `updateItem`: Update to use new identifier structure.
         - `moveMapItem`: Update input to use `HexCoord` for old/new positions.
         - `getDescendants`: Update to use `parentId` and parent's `coords`.
       - **Add new endpoints**:
         - `createUserMap`: Create root `USER` MapItem for user. Input: `{ groupId?: number, title?: string, descr?: string }`. Use `createMap()`.
         - `updateUserMapInfo`: Update root item's BaseItem. Input: `{ userId: number, groupId: number, title?: string, descr?: string }`. Use `updateMapInfo()`.
         - `removeUserMap`: Delete root item and descendants. Input: `{ userId: number, groupId: number }`. Use `removeMap()`.
         - `getItemByCoords`: Get specific item by coordinates. Input: `{ coords: HexCoord }`. Use `getMapItem()`.
         - `getRootItemById`: Get root MapItem by ID. Input: `{ mapItemId: number }`. Use service to fetch the root item.
         - `getItemsForRootItem`: Get all descendants of a root MapItem. Input: `{ rootItemId: number }`. Use service to get all items in the tree.
       - **Update auth-protected endpoints**:
         - `createDefaultMapForCurrentUser`: Update to use `createMap({ userId: ctx.user.id, groupId: 0, title: defaultTitle })`.
         - `getUserMap`: Update to use `getManyUserMaps(ctx.user.id, 1, 0)` and return first root item.
   - **Step 2.3**: Update API Contract Adapters.
     - In `src/server/api/types/contracts.ts`:
       - Remove `mapContractToApiAdapter` and `MapAPIContract` (maps no longer exist).
       - Update `mapItemContractToApiAdapter`:
         - Remove `mapId` field.
         - Update `coordinates` field to handle new `HexCoord` structure.
         - Ensure `parentId` is correctly mapped.
       - Add new adapter `mapRootItemContractToApiAdapter` for root `USER` items:
         - Maps root item + its BaseItem to represent what was formerly a "map".
         - Fields: `id`, `userId`, `groupId`, `title`, `descr`, `itemCount` (descendant count).
       - Update `contractToApiAdapters` exports.
   - **Step 2.4**: Update Root Router and Exports.
     - In `src/server/api/root.ts`:
       - Consider renaming `mapRouter` to `mappingRouter` for clarity.
       - Update all imports if service names changed.
3. **Phase 3**: Refactoring the map page
   - **Step 3.1**: Update Map Page Data Fetching.
     - In `src/app/map/[id]/page.tsx`:
       - Update `getMapData()` function:
         - Remove call to `api.map.getOne()`.
         - Use `id` param as `mapItemId` (ID of the root `USER` type MapItem).
         - Call new endpoint to get root item data: `api.map.getRootItemById({ mapItemId: id })`.
       - Update `getMapItems()` function:
         - Change from `api.map.getItems({ mapId })` to `api.map.getItemsForRootItem({ rootItemId: id })`.
       - URL structure remains `/map/[id]` where `id` is now the root MapItem ID:
         - No parsing needed - direct MapItem ID lookup.
         - Update `focus` parameter handling to use new `HexCoord` format.
       - Update component props:
         - Pass `rootItemId` instead of `mapId` to canvas components.
         - Extract `userId` and `groupId` from the root item's coordinates for any components that need them.
   - **Step 3.2**: Update State Management.
     - In `src/app/map/[id]/State/` directory:
       - **`types.ts`**: Update `HexTileData` type:
         - Remove `mapId` references.
         - Update `coords` to use new `HexCoord` structure.
         - Update `adapt()` function for new API contract.
       - **`mutations.ts`**: Update all tRPC mutation calls:
         - `createMapItem`: Use new endpoint parameters.
         - `updateMapItem`: Use new identifier structure.
         - `moveMapItem`: Use new `HexCoord` parameters.
         - `removeMapItem`: Use new endpoint.
       - **Update any remaining state files** to remove `mapId` dependencies.
   - **Step 3.3**: Update Canvas Components.
     - In `src/app/map/[id]/Canvas/` directory:
       - **`index.static.tsx`**: Update `StaticMapCanvas`:
         - Accept `userId` and `groupId` props instead of `mapId`.
         - Update coordinate system usage throughout.
         - Update any hardcoded map-related logic.
       - **`hex-region.static.tsx`**: Update `StaticHexRegion`:
         - Update coordinate calculations for new `HexCoord` system.
         - Ensure proper parent-child relationship handling.
       - **`mini-map.static.tsx`**: Update minimap:
         - Update coordinate system for navigation.
         - Update focus parameter generation.
   - **Step 3.4**: Update Tile Components.
     - In `src/app/map/[id]/Tile/` directory:
       - **`item.static.tsx`**: Update `StaticItemTile`:
         - Remove any `mapId` references.
         - Update expand/collapse URL parameter handling.
         - Update coordinate system usage.
       - **`item-minimap.static.tsx`**: Update for new coordinate system.
       - **Other tile components**: Remove `mapId` dependencies.
   - **Step 3.5**: Update Controls and Dialogs.
     - In `src/app/map/[id]/Controls/` and `src/app/map/[id]/Dialogs/`:
       - Update any components that reference `mapId`.
       - Update form submissions and API calls.
       - Update URL parameter handling for new coordinate system.
   - **Step 3.6**: Update Route Structure.
     - **Keep existing `/map/[id]` route structure**:
       - `id` parameter now represents the root MapItem ID instead of the old Map ID.
       - No directory structure changes needed.
       - Update parsing logic in `page.tsx` to treat `id` as `mapItemId`.
     - **Update homepage and auth flows**:
       - In `src/app/page.tsx`: Update redirect logic to use root MapItem ID.
       - In `src/app/login/page.tsx`: Update redirect logic to use root MapItem ID.
       - In `src/app/signup/page.tsx`: Update redirect logic to use root MapItem ID returned from creation.
   - **Step 3.7**: Update Navigation and UI Components.
     - In `src/components/ui/navbar.tsx`:
       - Update "Maps" link to show user's root items.
       - Consider renaming to "My Maps" or "Workspaces".
     - Update any other navigation components that reference maps.
   - **Step 3.8**: Update Error and Loading States.
     - In `src/app/map/[id]/error.tsx`: Update error messages for new structure.
     - In `src/app/map/[id]/not-found.tsx`: Update for user/group not found.
     - Update loading states throughout components.
   - **Step 3.9**: Create Maps List Page (Optional Enhancement).
     - In `src/app/maps/page.tsx`:
       - Show all user's root items (their "maps").
       - Allow navigation to different `groupId` maps.
       - Provide UI to create new root items.
       - This gives users access to multiple "maps" if needed in the future.
