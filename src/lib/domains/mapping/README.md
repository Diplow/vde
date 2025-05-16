# Mapping Domain (`src/lib/domains/mapping`)

This directory encapsulates all domain-specific logic related to the mapping features of the application. It follows a structured approach to separate concerns, making the codebase more maintainable and scalable.

## Directory Structure and Key Components:

### 1. `_objects/`

- **Purpose**: Defines the core domain entities or aggregates for the mapping functionality. These are typically Plain Old JavaScript Objects (POJOs) or classes that represent the fundamental data structures and their intrinsic rules.
- **Key Files**:
  - `base-item.ts`: Defines the `BaseItem` entity, representing a generic referenceable item.
  - `hex-map.ts`: Defines the `HexMap` aggregate, representing the overall map structure, its properties (like colors, radius), and its relationship with its constituent items, particularly its center.
  - `map-item.ts`: Defines the `MapItem` entity, representing individual items placed on a `HexMap`, including their coordinates, appearance, and references.
  - `index.ts`: Exports all domain objects for easy consumption.

### 2. `_repositories/`

- **Purpose**: Contains interfaces for the repositories. These interfaces define the contract for data access operations (CRUD - Create, Read, Update, Delete) related to the domain objects. They abstract the underlying data storage mechanism.
- **Key Files**:
  - `base-item.ts`: Interface `BaseItemRepository`.
  - `hex-map.ts`: Interface `MapRepository`.
  - `map-item.ts`: Interface `MapItemRepository`.
  - `index.ts`: Exports all repository interfaces.

### 3. `_actions/`

- **Purpose**: Holds classes and methods that implement specific business logic or use cases (domain actions) involving the domain objects. These actions often orchestrate operations on one or more aggregates and utilize repositories for persistence.
- **Key Files**:
  - `hex-map.ts`: Contains `MapActions`, a class that bundles various operations related to `HexMap` and `MapItem` management (e.g., creating maps, adding/removing items, moving items).
  - `index.ts`: Exports the action classes.

### 4. `services/`

- **Purpose**: Contains service layer components. Services typically orchestrate calls to domain actions and repositories, handle data transformation between the domain layer and the application/API layer (using contracts/DTOs), and encapsulate higher-level business workflows.
- **Key Files**:
  - `hex-map.ts`: Implements `MapService`, which provides a public API for map-related operations, often consumed by tRPC routers or other application services. It uses `MapActions` and adapts domain objects to `MapContract` and `MapItemContract`.
  - `__tests__/`: Contains integration tests for the services, ensuring they behave correctly with their dependencies (e.g., actual database repositories).
  - `index.ts`: Exports the service classes.

### 5. `infrastructure/`

- **Purpose**: Provides concrete implementations of the repository interfaces defined in `_repositories/`. This directory allows for different data storage strategies (e.g., database, in-memory). It also includes adapters that might be needed for these implementations.
- **Subdirectories**:
  - `base-item/`: Contains implementations for `BaseItemRepository` (e.g., `db.ts` for Drizzle ORM, `memory.ts` for in-memory).
  - `hex-map/`: Contains implementations for `MapRepository`.
  - `map-item/`: Contains implementations for `MapItemRepository`.
- **Key Files**:
  - `memory.ts`: Sets up and exports in-memory repository instances, useful for testing or development.
  - Each subdirectory (e.g., `hex-map/db.ts`) contains the database-specific implementation for its corresponding repository.

### 6. `types/`

- **Purpose**: Houses all domain-specific type definitions, constants, data transfer objects (DTOs) or "contracts" used for communication (especially with the API layer), and error definitions.
- **Key Files**:
  - `constants.ts`: Defines constants used within the mapping domain (e.g., `HEX_SIZE`, `HEXMAP_RADIUS`).
  - `contracts.ts`: Defines `MapContract` and `MapItemContract`, which are DTOs representing the structure of map and map item data exposed by the `MapService`. Includes adapter functions (`mapDomainToContractAdapter`, `mapItemDomainToContractAdapter`) to convert domain objects to these contracts.
  - `errors.ts`: Defines a collection of mapping-specific error messages (`MAPPING_ERRORS`).
  - `index.ts`: Exports key types and contracts.

### 7. `utils/`

- **Purpose**: Contains utility functions and classes that provide common helper functionalities specific to the mapping domain.
- **Key Files**:
  - `hex-coordinates.ts`: Implements `HexCoordSystem`, a class for managing and manipulating hexagonal coordinates, including parsing and creating coordinate IDs, and calculating relative positions.

## Overall Architecture:

The `mapping` domain is designed to be a self-contained module with clear boundaries.

- **Domain Objects (`_objects/`)** are the core.
- **Repositories (`_repositories/` and `infrastructure/`)** handle persistence.
- **Actions (`_actions/`)** encapsulate business logic operating on these objects.
- **Services (`services/`)** provide a higher-level API for these actions and manage data transformation for external consumers (like the tRPC API layer).
- **Types (`types/`)** ensure strong typing and define data contracts.
- **Utils (`utils/`)** provide supporting functionalities.

This separation of concerns aims for a clean, testable, and maintainable domain layer for all mapping-related features.
