# Claude Commands

This directory contains custom commands for Claude Code to enhance development workflows.

## Available Commands

### /refactor
Refactors a file for clarity according to the principles in `prompts/claude/REFACTOR_CLARITY.md`.

**Usage:**
```
/refactor <file_path>
```

**Example:**
```
/refactor src/app/map/create/create-item.tsx
```

**What it does:**
1. Creates a refactor session document
2. Analyzes the code for clarity issues and Rule of 6 violations
3. Identifies existing domain concepts to reuse
4. Proposes new concepts that need definition
5. Presents findings for validation
6. Executes the complete refactoring after approval
7. Documents the results

## Adding New Commands

To add a new command:
1. Create a `.js` file in this directory (e.g., `mycommand.js`)
2. Make it executable: `chmod +x mycommand.js`
3. Create a corresponding `.md` file documenting the command
4. Update this README with the new command

## Command Structure

Commands should:
- Parse arguments from `process.argv`
- Validate inputs
- Generate clear instructions for Claude
- Output to console for Claude to read