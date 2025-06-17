# Transaction Support for Atomic Operations

## Issue Description
The mapping repository lacks transaction support, creating a critical data integrity issue during complex operations like tile swapping. If a server crash occurs mid-operation, tiles can be permanently lost due to partial updates.

## Working Assumption
Based on the issue description, I assume:
- The current implementation performs multiple database operations sequentially without transaction boundaries
- Each operation commits immediately, making rollback impossible
- We need to implement a transaction wrapper that ensures all-or-nothing execution
- The solution should be transparent to existing code while providing atomic guarantees

## Architectural Context
Based on the codebase architecture:
- **Domain Layer** (`/src/lib/domains/mapping/`): Contains business logic and actions
- **Repository Layer** (`/src/lib/domains/mapping/repositories/`): Handles data persistence
- **Database Layer**: Uses Drizzle ORM with PostgreSQL

Key components involved:
- `MapItemRepository`: Performs database operations for map items
- `MapItemActions`: Contains business logic like `swapMapItems`
- Database transaction support via Drizzle ORM

The repository should wrap multiple operations in transactions to ensure atomicity.

## Investigation Log

### Step 1: Understanding Current Implementation
- Found the `moveMapItem` operation in `MapItemActions` that performs multiple database operations
- The operation involves:
  1. Moving target item to temporary location (if exists)
  2. Moving source item to new location  
  3. Updating all descendant coordinates
  4. Restoring displaced item from temporary location
- Each operation is performed independently without transaction boundaries

### Step 2: Identifying Transaction Points
- Drizzle ORM already supports transactions via `db.transaction()`
- Found existing transaction usage in `user-mapping.service.ts`
- The repository pattern makes it challenging to pass transaction context through all layers

### Step 3: Implementation Strategy
After analyzing the architecture, I will implement a "transaction-by-default" pattern:
1. Create a transaction context that can be passed through repository methods
2. Modify repository interfaces to accept optional transaction parameter
3. Update the database repository implementation to use transactions
4. Wrap complex operations in transactions at the action level

## Resolution

The solution involves:
1. Adding transaction support to the repository layer
2. Creating a transaction-aware base repository class
3. Modifying the `moveMapItem` action to use transactions
4. Ensuring backward compatibility for non-transactional operations

Key changes:
- Repository methods will accept an optional `tx` parameter
- Complex operations will be wrapped in transactions at the action level
- All database operations within a transaction will use the same connection

## Tests Added

### Unit Tests
- **`map-item-transactions.test.ts`**: Unit tests verifying transaction usage in MapItemActions
  - Tests that transactions are used when repositories support them
  - Tests that transactions are rolled back on failure
  - Tests backward compatibility when repositories don't support transactions

### Integration Tests  
- **`item-movement-transaction.integration.test.ts`**: Integration tests demonstrating atomic operations
  - Tests atomic move of items with descendants
  - Tests atomic swap of two items with their descendants
  - Tests rollback behavior when operations fail

These tests ensure:
1. All operations within moveMapItem are atomic
2. Failures result in complete rollback with no partial updates
3. The solution is backward compatible with existing code