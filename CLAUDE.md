# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Project VDE (Visual Deliberation Environment) is a knowledge platform that enables users to create, organize, and share ideas through interactive hexagonal maps. It's like Wikipedia where each person maintains their own perspective, and trust emerges through references rather than centralized collaboration.

## Development Commands

### Core Development
```bash
pnpm dev          # Start development server (port 3000)
pnpm build        # Build production bundle
pnpm lint         # Run ESLint
pnpm typecheck    # TypeScript type checking
```

### Testing
```bash
./run-tests.sh    # Run all tests (uses Vitest, not Jest)
./run-tests.sh -w # Watch mode
./run-tests.sh --ui # UI mode
pnpm test:unit    # Unit tests only
pnpm test:integration # Integration tests only
pnpm storybook    # Component development with Storybook
```

### Database Management
```bash
pnpm db:generate  # Generate Drizzle migrations
pnpm db:migrate   # Apply migrations
pnpm db:push      # Push schema changes (development)
pnpm db:studio    # Open Drizzle Studio UI
pnpm db:populate  # Populate with test data
./start-database.sh # Start local PostgreSQL
./setup-test-db.sh  # Setup test database
```

### Code Quality
```bash
pnpm format:check # Check Prettier formatting
pnpm format:write # Apply Prettier formatting
```

## Architecture & Patterns

### Progressive Enhancement Architecture
The application has three distinct layers:

1. **Static Layer** (`*.static.tsx`): Pure server-side components, URL-based state
2. **Progressive Layer** (`*.progressive.tsx`): Bridge components adding client-side enhancements
3. **Dynamic Layer** (`*.dynamic.tsx`): Full client-side interactivity with optimistic updates

### Key Architectural Decisions

- **URL-First State**: Most application state lives in URL parameters for shareability
- **Progressive Enhancement**: Works without JavaScript, progressively adds features
- **Region-Based Data Loading**: Efficient hexagonal map data loading with caching
- **Domain-Driven Design**: Clear separation of domains (mapping, IAM) with repositories and services
- **Type Safety**: End-to-end type safety with TypeScript, tRPC, and Drizzle ORM

### Component Patterns

```typescript
// Static components (server-side only)
export default function ItemStatic({ item }: { item: MapItem }) { }

// Dynamic components (client-side enhanced)
'use client'
export default function ItemDynamic({ item }: { item: MapItem }) { }

// Progressive components (enhancement bridge)
export default function ItemProgressive({ children }: { children: React.ReactNode }) { }
```

### File Structure

```
/src/app/map/[id]/         # Main map application
  /Cache/                  # Map cache system (State, Handlers, Services, Sync)
  /Canvas/                 # Map rendering components
  /Controls/               # UI controls and navigation
  /Dialogs/               # Modal dialogs
  /Tile/                  # Tile components (Auth, Base, Empty, Item, Hierarchy)
  /State/                 # Application state management
  
/src/lib/domains/         # Domain logic
  /mapping/               # Map domain (entities, services, repositories)
  /IAM/                   # Identity and Access Management
  
/src/server/              # Backend
  /api/                   # tRPC routers and services
  /db/                    # Database schema and relations
```

### Testing Strategy

- **Test Database**: Separate PostgreSQL instance for tests
- **Sequential Execution**: Tests run sequentially to avoid database conflicts
- **Integration Tests**: `*.integration.test.ts` files test full workflows
- **Component Tests**: Use React Testing Library with Vitest
- **Path Aliases**: Use `~/` for `./src/` in imports

### Map Cache Architecture

The map cache system (`/src/app/map/[id]/Cache/`) follows a clean architecture:

1. **State**: Pure reducer-based state management with actions and selectors
2. **Handlers**: Business logic for data fetching, mutations, and navigation
3. **Services**: Infrastructure services for server communication and storage
4. **Sync**: Synchronization engine for optimistic updates and conflict resolution

### Important Notes

- **Authentication**: Uses Better-Auth library with database sessions
- **API Layer**: tRPC provides type-safe API calls between client and server
- **Database**: PostgreSQL with Drizzle ORM, migrations in `/drizzle/migrations/`
- **Environment Variables**: Required `.env` file (see `scripts/example.env`)
- **Hexagonal Maps**: Core feature where ideas are represented as expandable hex tiles
- **No Test Database Teardown**: Test database persists between runs for debugging

## Documentation Files

Important README files throughout the codebase that provide additional context:

### Core Documentation
- `/README.md` - Main project overview and getting started guide
- `/THESIS.md` - Project thesis and philosophical foundation
- `/src/app/map/[id]/ARCHITECTURE.md` - Detailed progressive enhancement architecture

### Domain & Feature Documentation
- `/src/lib/domains/README.md` - Domain-driven design overview
- `/src/lib/domains/mapping/README.md` - Comprehensive mapping domain documentation
- `/src/lib/domains/mapping/services/README.md` - Mapping services implementation details
- `/src/app/map/[id]/README.md` - Map page component structure
- `/src/app/map/[id]/Cache/README.md` - Map cache system architecture
- `/src/app/map/[id]/Cache/Services/README.md` - Cache services documentation

### Infrastructure Documentation
- `/src/server/README.md` - Server architecture with tRPC and Drizzle
- `/src/server/api/routers/README.md` - API router patterns and conventions
- `/src/server/api/CACHING.md` - Server-side caching strategies
- `/src/lib/auth/README.md` - Authentication system documentation
- `/scripts/README.md` - Development and utility scripts

### Implementation Plans
- `/prompts/features/phase-*.md` - Phased implementation plans
- `/prompts/features/2025-05-30-refactoring-map-cache*.md` - Cache refactoring documentation
- Various feature files in `/prompts/features/` documenting specific implementations