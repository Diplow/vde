# /debug Command

This command instructs Claude to apply the systematic debugging workflow and principles from `@prompts/claude/DEBUG.md` to investigate and resolve issues.

## Usage
```
/debug "bug description"
```

## Prerequisites
- The file `prompts/claude/DEBUG.md` must exist (the command will check for it)
- Git repository must be initialized
- Development environment should be set up

## What it does
The command directs Claude to follow the complete debugging workflow from `@prompts/claude/DEBUG.md`:

1. Creates a debug session document in `prompts/bugs/YYYY-MM-DD-<bug-title>.md`
2. Makes a working assumption about the issue (rather than asking for clarification)
3. Identifies architectural context based on README.md
4. Creates a fix branch from develop (or current feature branch)
5. Performs systematic investigation:
   - Reproduces the issue
   - Cleans the investigation area (lint, typecheck)
   - Forms and tests hypotheses
   - Creates reproduction tests
   - Applies minimal fixes
   - Adds regression tests
6. Updates the debug session document with findings and resolution
7. Prepares for PR creation with proper commit messages

## Example
```
/debug "edit button not showing for owned tiles"
```

This will:
- Create `prompts/bugs/2025-01-19-edit-button-not-showing-for-owned-tiles.md`
- Create branch `fix/edit-button-not-showing-for-owned-tiles`
- Follow the systematic debugging process
- Add tests to prevent regression
- Document the entire investigation and resolution

## Key Principles Applied
- **Understand Before Acting**: Architecture review before code diving
- **Make Working Assumptions**: Proceed with reasonable guesses rather than blocking
- **Clean Baseline**: Fix linter/type errors in investigated files immediately
- **Minimal Changes**: One fix at a time, avoid unrelated refactoring
- **Test Everything**: Create reproduction tests and regression tests
- **Consider Clarity**: If bug hides in complex code, suggest refactoring

## Error Handling
The command will exit with an error if:
- `prompts/claude/DEBUG.md` is not found
- No bug description is provided
- Not in a git repository

## Reference
All debugging principles, workflow steps, and techniques are documented in `@prompts/claude/DEBUG.md`. The command explicitly references this guide rather than duplicating its content.