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