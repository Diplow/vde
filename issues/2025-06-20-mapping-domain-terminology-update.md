# Issue: Update mapping domain to use new terminology

**Date**: 2025-06-20
**Status**: Open
**Tags**: #refactor #architecture #tech #mapping #medium
**GitHub Issue**: #49
**Branch**: mapping-terminology-update

## Problem Statement
The mapping domain uses outdated terminology that doesn't align with the current conceptual model of the application. This is not just a mismatch between front-end code and domain code, but rather a lack of clarity compared to what is conceptualized. Consistent language has proven track records of better results when it comes to both humans and AI.

## User Impact
- Developers are confused by mismatched terminology between UI and domain code
- New contributors need extra time to understand the mapping between old and new terms
- Code maintainability is reduced due to conceptual misalignment
- AI assistants have difficulty understanding and working with inconsistent terminology
- Domain-driven design principles are violated by unclear language

## Steps to Reproduce
1. Navigate to `/src/lib/domains/mapping/`
2. Review the domain models and terminology used
3. Compare with the UI terminology in `/src/app/map/`
4. Notice the mismatch between domain terms and UI terms

## Environment
- Codebase-wide issue
- Affects all developers working on mapping features
- Frequency: Constant friction during development

## Related Issues
- Previous refactoring efforts may have updated UI but not domain layer
- Documentation may need updates after terminology change

## Terminology Mapping Required
Old terms → New terms:
- item/mapItem → tile
- expanded view → frame
- canvas/board → map
- reorder → swap
- relocate → move
- version → generation
- descendants → children
- focus/center → centerTile

## Additional Context
This is a technical debt issue that affects code clarity and developer experience. The domain layer should use the same conceptual model as the UI to maintain consistency throughout the application.

## Context

*I am an AI assistant acting on behalf of @Diplow*

### Architecture Overview
The mapping domain (`/src/lib/domains/mapping/`) implements the core logic for tile management and hierarchical structures following Domain-Driven Design principles. It's structured with clear separation between domain objects, repositories, services, and infrastructure layers.

Key architectural decisions:
- Recent refactoring eliminated separate "Map" entities - now a "map" is represented by a root USER-type MapItem
- Hierarchical structure uses coordinate system with userId, groupId, and path (array of directions)
- Two types of MapItems: USER (root items) and BASE (all other items with parents)

### Current Implementation
- **Key Components**: 
  - `MapItem` domain object - 2,774 occurrences of "item" terminology
  - `BaseItem` domain object - reference items containing content
  - `MappingService` - main coordinating service
  - `ItemManagementService` - handles item-level operations
  - `MapManagementService` - handles map-level operations
  
- **Current Patterns**: 
  - Repository pattern with domain objects in `_objects/`
  - Service layer for business logic
  - Infrastructure layer for database access
  - Actions layer for complex operations

- **Dependencies**: 
  - Used by tRPC routers in `/src/server/routers/`
  - Consumed by React components via hooks in `/src/app/_hooks/`
  - Database tables: `vde_map_items`, `vde_base_items`

### Affected Areas
- **Primary Changes**: 
  - `/src/lib/domains/mapping/` - 2,774 occurrences of "item" terminology
  - `/src/lib/domains/mapping/` - 58 occurrences of "descendants"
  - Database schema with tables and columns using "item" naming
  - All type definitions in `/src/lib/domains/mapping/types/`

- **Secondary Impact**: 
  - tRPC routers that expose the domain operations
  - React hooks that consume the API
  - Cache keys throughout the application
  - Database migrations (14 references to "item" in existing migrations)

- **Cross-Domain Effects**: 
  - IAM domain may reference mapping domain types
  - Any external integrations using the API

### Technical Considerations
- **Constraints**: 
  - Database column and table names require migration
  - Breaking changes to API contracts
  - Existing data must be preserved during migration
  
- **Risks**: 
  - Large-scale refactoring (2,774+ changes needed)
  - Potential for introducing bugs during mass renaming
  - Database migration complexity
  - API versioning may be needed for external consumers

- **Performance**: 
  - No performance impact expected from renaming
  - Migration must be carefully planned to avoid downtime

### Documentation Status
- **Current Docs**: 
  - `/src/lib/domains/mapping/README.md` exists and uses "item" terminology
  - Service-level README documents the architecture
  - Infrastructure README explains database patterns

- **Terminology Disconnect**: 
  - Frontend already uses "tile" (1,077 occurrences)
  - Backend uses "item/mapItem" throughout
  - Creates confusion when developers work across layers

### Related Code References
- `/src/lib/domains/mapping/_objects/map-item.ts` - Core domain object definition
- `/src/lib/domains/mapping/types/contracts.ts` - API contract definitions
- `/src/server/db/schema/map.ts` - Database schema definitions
- `/src/app/map/Tile/` - UI components using "tile" terminology

### Scope Restrictions (Updated)

**Initial refactoring will focus on:**
- Domain objects in `_objects/`
- Repositories in `_repositories/`
- Actions in `_actions/`

**Will NOT change (in this phase):**
- Domain services
- Database tables and schema
- API endpoints

**Approach:**
During solution planning, we should:
- List all current objects, actions, repositories, and service methods
- Discuss which terms to update, keep, or remove
- Focus on aligning the domain language first before propagating changes outward