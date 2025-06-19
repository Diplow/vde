# Issue #49 Log: Update mapping domain to use new terminology

This file documents the complete history and evolution of issue #49.

## 2025-06-20 00:09 - Issue Created

*Created by @Diplow via /issue command*

### Initial Problem Statement
The mapping domain uses outdated terminology that doesn't align with the current conceptual model of the application. This inconsistency makes the codebase harder to understand and maintain.

### Initial Tags
#refactor #architecture #tech #mapping #medium

### GitHub Issue
Created issue #49: https://github.com/Diplow/hexframe/issues/49

---

## 2025-06-20 00:17 - User Feedback on Language Consistency

*Comment by @Diplow*

Clarified that this is not just a mismatch between "front" code and domain code, but rather a lack of clarity compared to what is conceptualized. Consistent language has proven track records of better results for both humans and AI.

### Changes to Issue File
- Updated problem statement to emphasize conceptual clarity
- Added impact on AI understanding and DDD principles

---

## 2025-06-20 00:37 - Context Analysis

*Added by @Diplow via /context command*

### Investigation Process
- Read `/src/lib/domains/mapping/README.md`
- Analyzed directory structure of mapping domain
- Counted terminology occurrences across codebase
- Compared frontend vs backend terminology usage

### Detailed Findings

#### Terminology Count Analysis
- Backend (`/src/lib/domains/mapping/`): 2,774 occurrences of "item/mapItem"
- Frontend (`/src/app/map/`): 1,077 occurrences of "tile"
- Database migrations: 14 references to "item"
- "descendants": 58 occurrences in backend
- No occurrences of "relocate" or "reorder" found

#### Architecture Discoveries
- Recent refactoring eliminated separate "Map" entities
- Maps now represented by root USER-type MapItem
- Clear DDD structure with domain objects, repositories, services, and infrastructure layers
- Two types of MapItems: USER (root) and BASE (with parents)

#### Key Components Identified
- `MapItem` domain object
- `BaseItem` domain object
- `MappingService` - main coordinating service
- `ItemManagementService` - handles item-level operations
- `MapManagementService` - handles map-level operations

### Changes Made to Issue File
- Added comprehensive Context section
- Documented architecture overview
- Listed all affected areas
- Identified technical constraints and risks

---

## 2025-06-20 00:41 - Scope Restrictions Added

*Comments by @Diplow*

### Scope Clarification
User specified that the refactor will initially focus on:
- Domain objects
- Repositories  
- Actions

Will NOT change (in this phase):
- Domain services
- Database tables

### Approach Guidance
During solution planning, should:
- List all current objects, actions, repositories, and service methods
- Discuss which terms to update, keep, or remove
- Understand current implementations before proposing changes

### Changes to Issue File
- Added "Scope Restrictions" section
- Updated affected areas to reflect limited scope
- Noted phased approach to refactoring

---