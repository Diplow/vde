# Commands to run the project

> pnpm run build

> pnpm run start

> pnpm run dev

> pnpm run migrate

# How to develop a new feature

## Documentation: Using AI to Create New Backend APIs

This guide will walk you through how to effectively use AI to develop new backend APIs for your application. The approach follows a hybrid two-phase methodology to ensure well-structured and properly implemented features.

## Overview of the Process

When creating a new API endpoint, you'll need to work through these components:

1. Database Schema
2. Domain Entities
3. Repository Interface
4. Domain Actions
5. Service Layer
6. tRPC Router
7. Repository Implementation

## Hybrid Two-Phase Approach

### Phase 1: Architecture-First

The first phase focuses on establishing clear interfaces, contracts, and relationships with minimal implementation details. This helps developers understand the architecture before diving into implementation details.

#### Step 1: Define the Database Schema

**Example Prompt:**

```
I need to add a new table called "events" to our database schema. Events should have an ID, title, a start date and an end date, a creation date, an author ID that references the users table. Show me the schema definition to add to schema.ts.
```

This will give you a clean schema definition:

```typescript
export const events = createTable("events", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  title: text("title").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  authorId: integer("author_id")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
```

#### Step 2: Define the Entity

**Example Prompt:**

```
Create an entity interface in the domain "politics" and class for the "events" feature based on our database schema. The entity should match the structure of our database table but serve as our domain model. The entity should have all the validators functions to define business constraints on the entity. Focus only on the structure, not implementation details.
```

This should produce a clean entity definition:

#### Step 3: Define the Repository Interface

**Example Prompt:**

```
Create a repository interface for events that will define the data access methods we need. We'll need methods to get one event, get multiple events, create a event, update a event, and delete a event.
```

#### Step 4: Define Actions Interface

**Example Prompt:**

```
Create an actions file for events that will define our business logic operations. Define only the method signatures and return types, not the implementations.
```

#### Step 5: Create the Service Layer Interface

**Example Prompt:**

```
Create a service layer interface for events that will adapt the domain entities to the contract expected by our API. Define only the method signatures and return types, not the implementations.
```

#### Step 6: Create the tRPC Router Structure

**Example Prompt:**

```
Create a tRPC router structure for events that defines endpoints to create, get, update, and delete events. Define only the endpoint signatures with their input types, not the implementations. Also implements the service middleware if necessary.
```

### Phase 2: Implementation

The second phase focuses on implementing the business logic and database interactions based on the interfaces defined in Phase 1.

#### Step 1: Implement the Repository

**Example Prompt:**

```
Now that we have defined our interfaces, please implement the EventDrizzlePostgresRepository that fulfills our EventRepository interface. Include proper database queries and error handling. Errors in the repository implementation should be about accessing data and matching the db expectations.
```

The AI will implement the repository with proper database queries.

#### Step 2: Implement the Actions

**Example Prompt:**

```
Please implement the EventActions we defined earlier. Add proper validation, error handling, and business logic. Errors in the action layer should be about business logic.
```

#### Step 3: Implement the Services

**Example Prompt:**

```
Please implement the EventService methods we defined earlier. Include proper error handling and the adaptation logic between entities and contracts. Errors in the service should be about fail adaptations from API models to domain models.
```

The AI will implement the service methods with proper error handling.

#### Step 4: Implement the Router Endpoints

**Example Prompt:**

```
Please implement the methods in our eventRouter. Include proper error handling and permission checks. Errors should be about rights and service composition failures.
```

The AI will implement the router methods with proper error handling and permission checks.

## Benefits of This Approach

1. **Mental clarity**: Defining interfaces first helps developers understand the architecture before getting lost in implementation details.

2. **Learning opportunity**: The interface-first approach helps developers learn about system design and architecture.

3. **AI context building**: The first phase provides the AI with a clearer understanding of your architectural intentions before implementation.

4. **Separation of concerns**: Clearly separates the "what" from the "how" in your codebase.

## Testing Your New API

After completing both phases, you should test your new API endpoints:

**Example Prompt:**

```
Can you help me write a test case for the new event API endpoints we just created? I'd like to test the create, get, update, and delete operations.
```

## Frontend

### Pages

### Components

#### Stateful

#### Stateless

## Deployement
