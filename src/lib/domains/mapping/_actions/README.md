# Mapping Domain Actions

This folder contains the **Actions layer** for the mapping domain, implementing the application-level business use cases that orchestrate domain objects and repositories to fulfill specific user scenarios.

## Overview

The Actions layer serves as the primary interface for all mapping operations, providing a clean API that encapsulates complex business logic while maintaining domain integrity. It follows Domain-Driven Design (DDD) principles and acts as an orchestration layer between the presentation layer and the domain/infrastructure layers.

## Architecture

```
MapItemActions (Main Orchestrator)
├── MapItemCreationHelpers
├── MapItemQueryHelpers
├── MapItemMovementHelpers
└── Domain Objects & Repositories
```

## Core Responsibilities

### 🏗️ **Map Item Creation**

- Create new map items with proper validation
- Handle reference creation and linking
- Enforce parent-child relationship constraints
- Validate item type-specific business rules

### 🔄 **Map Item Movement**

- Move items between hex coordinates
- Handle complex displacement scenarios (swapping items)
- Update all descendant coordinates automatically
- Validate movement constraints and business rules

### 🔍 **Map Item Querying**

- Find items by coordinates or ID
- Retrieve parent-child relationships
- Get descendant trees efficiently
- Query items for specific user/group spaces

### 🗑️ **Map Item Removal**

- Remove items and all their descendants
- Handle cascade deletion properly
- Maintain data integrity during removal

### 📝 **Reference Management**

- Update base item references (title, description, URLs)
- Maintain referential integrity between map items and base items

## Key Components

### `MapItemActions` (Main Class)

The primary public interface that coordinates all mapping operations. It delegates specific responsibilities to helper classes while maintaining a cohesive API.

**Key Methods:**

- `createMapItem()` - Create new map items
- `moveMapItem()` - Move items with displacement handling
- `removeItem()` - Remove items and descendants
- `getMapItem()` - Query single items
- `updateRef()` - Update item references

### Helper Classes

#### `MapItemCreationHelpers`

Encapsulates item creation logic including:

- Parent validation and retrieval
- Item type constraint validation
- Reference creation and linking
- Map item construction

#### `MapItemMovementHelpers`

Handles complex movement scenarios including:

- Coordinate validation for moves
- Temporary location management for displacement
- Descendant coordinate updates
- Movement constraint validation

#### `MapItemQueryHelpers`

Provides querying capabilities including:

- Parent coordinate resolution
- Descendant tree retrieval
- Owner/group space queries
- Coordinate-based item lookup

## Business Rules Enforced

### Item Type Constraints

- **USER items**: Must be root items (no parent), cannot be moved to become children
- **BASE items**: Must have a parent, inherit user/group space from parent

### Coordinate Constraints

- Items cannot move across different user/group spaces
- Parent-child relationships must maintain coordinate hierarchy
- Movement validation ensures data integrity

### Reference Integrity

- All map items must have valid base item references
- Reference updates maintain consistency across the system

## Usage Patterns

```typescript
// Initialize with repositories
const actions = new MapItemActions({
  mapItem: mapItemRepository,
  baseItem: baseItemRepository,
});

// Create a new map item
const newItem = await actions.createMapItem({
  itemType: MapItemType.BASE,
  coords: hexCoord,
  title: "New Item",
  parentId: parentItem.id,
});

// Move an item (with automatic displacement)
await actions.moveMapItem({
  oldCoords: sourceCoords,
  newCoords: targetCoords,
});

// Remove an item and all descendants
await actions.removeItem({ idr: { id: itemId } });
```

## Error Handling

The actions layer provides comprehensive error handling for:

- Invalid coordinates or missing parents
- Item type constraint violations
- Movement rule violations
- Missing items or references
- Data integrity issues

## Dependencies

- **Domain Objects**: `MapItem`, `BaseItem`, `MapItemType`
- **Repositories**: `MapItemRepository`, `BaseItemRepository`
- **Utilities**: `HexCoord`, `CoordSystem`
- **Types**: Various domain types and error definitions

## Testing

Each helper class is designed to be independently testable with clear responsibilities and minimal coupling. The main actions class can be tested through its public interface with mocked repositories.
