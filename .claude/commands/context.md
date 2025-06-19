# /context Command

## Purpose
Gather and document relevant codebase context for an issue without proposing solutions. Focus on understanding the current state, architecture, and implications.

## Command Syntax
```
/context #<issue-number>
```

## Context Gathering Process

### 1. Read Issue Documentation
- Load the issue file from `/issues/YYYY-MM-DD-*.md`
- Understand the problem statement and user impact
- Identify the domains and components mentioned

### 2. Architecture Analysis
- **Understand the Architecture**: 
  - Check README.md files in relevant directories
  - Read architecture documentation (e.g., `/src/app/map/ARCHITECTURE.md`, `/src/server/README.md`, `/src/lib/domains/README.md`)
  - Identify which layers and components are involved
  - Map the conceptual model to the implementation

### 3. Current State Analysis
- **Code Investigation**:
  - Examine current implementations in affected areas
  - Identify existing patterns and conventions
  - Note current terminology usage
  - Document actual vs expected behavior

- **Dependency Mapping**:
  - What depends on the affected code?
  - What does the affected code depend on?
  - Cross-domain interactions

### 4. Impact Assessment
- **Technical Impact**:
  - Which files/components will need changes
  - Potential breaking changes
  - Performance implications
  - Testing requirements

- **Product Impact**:
  - User-facing changes
  - Workflow modifications
  - Documentation needs

### 5. Document Findings

Updates both files:

#### Issue File Update
Replaces or adds the Context section with synthetic findings:

```markdown
## Context

*I am an AI assistant acting on behalf of @<username>*

### Architecture Overview
[Brief explanation of the relevant architecture]

### Current Implementation
- **Key Components**: [List of main components involved]
- **Current Patterns**: [Existing patterns and conventions]
- **Dependencies**: [Key dependencies and interactions]

### Affected Areas
- **Primary Changes**: [Core files/components that need modification]
- **Secondary Impact**: [Files that depend on primary changes]
- **Cross-Domain Effects**: [Impact on other domains]

### Technical Considerations
- **Constraints**: [Technical limitations or requirements]
- **Risks**: [Potential issues or breaking changes]
- **Performance**: [Performance implications if any]

### Documentation Status
- **Outdated Docs**: [Any incorrect documentation found]
- **Missing Docs**: [Areas lacking documentation]
- **Updates Needed**: [Documentation that will need updates]

### Related Code References
- `path/to/file.ts:123` - [Brief description]
- `path/to/another.ts:45` - [Brief description]
```

#### Log File Update
Appends detailed investigation to the log file:

```markdown
## YYYY-MM-DD HH:MM - Context Analysis

*Added by @<username> via /context command*

### Investigation Process
- [List of files examined]
- [Documentation reviewed]
- [Patterns discovered]

### Detailed Findings
[Complete analysis with all details]

### Architecture Deep Dive
[Extensive architecture notes]

### Terminology Analysis
[Detailed counts and occurrences]

### Changes Made to Issue File
- Updated Context section
- Added scope restrictions
- Identified X affected areas

---
```

## Best Practices

1. **No Solutions**: Focus on understanding, not fixing
2. **Be Thorough**: Check all relevant documentation
3. **Verify Claims**: Don't trust docs blindly - check actual code
4. **Use References**: Include file paths and line numbers
5. **Stay Objective**: Document what IS, not what SHOULD BE

## Example Output

For issue #49 (terminology update):

```markdown
## Context

*I am an AI assistant acting on behalf of @Diplow*

### Architecture Overview
The mapping domain (`/src/lib/domains/mapping/`) implements the core logic for tile management and hierarchical structures. It's separate from the UI layer (`/src/app/map/`) following domain-driven design principles.

### Current Implementation
- **Key Components**: 
  - `MapItemRepository` - handles data persistence using "item" terminology
  - `MapItemService` - business logic using "mapItem" throughout
  - UI components in `/src/app/map/Tile/` - use "tile" terminology

- **Current Patterns**: Repository pattern with service layer
- **Dependencies**: Used by tRPC routers, consumed by React components

### Affected Areas
- **Primary Changes**: 
  - `/src/lib/domains/mapping/map-item.repository.ts` - 15 occurrences of "item"
  - `/src/lib/domains/mapping/map-item.service.ts` - 23 occurrences of "mapItem"
  - `/src/server/routers/map.ts` - API endpoints using old terminology

- **Secondary Impact**: 
  - All tRPC hooks in `/src/app/_hooks/`
  - Cache keys in `/src/app/map/Cache/`

### Technical Considerations
- **Constraints**: Database column names may need migration
- **Risks**: Breaking API changes for any external consumers
- **Performance**: Renaming should have no performance impact

### Documentation Status
- **Outdated Docs**: `/src/lib/domains/README.md` uses old terminology
- **Missing Docs**: No terminology glossary exists
- **Updates Needed**: All domain READMEs after refactoring
```

## Integration with Workflow

After `/context`, the workflow continues with:
- `/solution #<issue>` - Propose solutions based on context
- `/archi #<issue>` - Document architecture decisions
- See `.claude/commands/README.md` for complete workflow