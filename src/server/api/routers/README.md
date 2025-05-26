# API Routers

This folder contains the tRPC router definitions that expose the backend API endpoints for the mapping application. The routers follow a domain-driven design approach, organizing endpoints by functional areas and responsibilities.

## Architecture Overview

The API is structured around two main domains:

- **Authentication**: User authentication, registration, and session management
- **Mapping**: User maps and map items management with hexagonal coordinate system

## Files Overview

### Core Routers

- **`auth.ts`** - Authentication router handling user login, logout, registration, and session management using better-auth
- **`map.ts`** - Main mapping router that combines user and items sub-routers with legacy flat endpoint support
- **`map-user.ts`** - User map management router for creating, updating, and managing user's root maps
- **`map-items.ts`** - Map items router for CRUD operations on individual items within maps

### Supporting Files

- **`map-schemas.ts`** - Zod validation schemas for all map-related data structures and operations
- **`_map-auth-helpers.ts`** - Private helper functions for authentication checks and response formatting

## Domain Structure

### Authentication Domain (`auth.ts`)

- `register` - User registration (delegates to client-side better-auth)
- `login` - Email/password authentication
- `logout` - User session termination
- `getSession` - Current session retrieval

### Mapping Domain

#### User Maps (`map-user.ts`)

- `getMyRootItems` - Get all user's maps with pagination
- `createUserMap` - Create new map for user
- `updateUserMapInfo` - Update map metadata
- `removeUserMap` - Delete map and all descendants
- `createDefaultMapForCurrentUser` - Bootstrap default map
- `getUserMap` - Get user's primary map

#### Map Items (`map-items.ts`)

- `getRootItemById` - Get map by ID
- `getItemByCoords` - Get item at specific hexagonal coordinates
- `getItemsForRootItem` - Get all items in a map
- `addItem` - Add new item to map
- `removeItem` - Delete item from map
- `updateItem` - Modify item properties
- `moveMapItem` - Move item to new coordinates
- `getDescendants` - Get all child items

## Coordinate System

The mapping system uses hexagonal coordinates represented by:

```typescript
{
  userId: number,
  groupId: number,
  path: number[]
}
```

## Authentication & Authorization

- **Public endpoints**: Authentication routes and some read operations
- **Protected endpoints**: User map management requires authentication
- **Middleware**: `mappingServiceMiddleware` injects domain services into context

## Usage Patterns

### Creating a Map

```typescript
// Create user map
const map = await trpc.map.user.createUserMap.mutate({
  groupId: 0,
  title: "My Map",
  descr: "Map description",
});

// Add items to map
const item = await trpc.map.items.addItem.mutate({
  parentId: map.id,
  coords: { userId: 1, groupId: 0, path: [0] },
  title: "Item Title",
});
```

### Querying Items

```typescript
// Get all user maps
const maps = await trpc.map.user.getMyRootItems.query({
  limit: 10,
  offset: 0,
});

// Get specific item
const item = await trpc.map.items.getItemByCoords.query({
  coords: { userId: 1, groupId: 0, path: [0] },
});
```

## Legacy Support

The main `map.ts` router provides flat endpoints for backward compatibility, allowing both nested (`map.user.createUserMap`) and flat (`map.createUserMap`) access patterns.

## Error Handling

All routers use tRPC's built-in error handling with appropriate HTTP status codes:

- `UNAUTHORIZED` for authentication failures
- `NOT_FOUND` for missing resources
- `INTERNAL_SERVER_ERROR` for unexpected errors
- `NOT_IMPLEMENTED` for placeholder endpoints

## Dependencies

- **tRPC**: API framework and type safety
- **Zod**: Runtime validation and TypeScript integration
- **better-auth**: Authentication provider
- **Domain Services**: Injected via middleware for business logic
