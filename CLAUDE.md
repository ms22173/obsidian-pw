# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Proletarian Wizard is an Obsidian plugin for task management that scans markdown files for todo items and displays them in an organized planning board. It supports rich todo syntax with attributes, subtasks, and bidirectional updates between notes and the task board.

## Development Commands

### Build and Development
```bash
yarn install          # Install dependencies
yarn dev             # Development mode with hot reload
yarn build           # Production build (TypeScript + esbuild)
yarn deploy          # Deploy to local Obsidian vault (requires $OBSIDIAN_PATH)
```

### Testing
```bash
yarn test            # Run all tests
yarn test:watch      # Run tests in watch mode
yarn test:coverage   # Run tests with coverage report
```

Single test file:
```bash
yarn test LineOperations.test.ts
```

## Architecture

### Core Domain Model

The plugin follows a layered architecture with domain logic separated from infrastructure:

**TodoIndex** (`src/domain/TodoIndex.ts`)
- Central todo management system
- Tracks todos across all markdown files in the vault
- Listens to file events (create, update, delete, rename)
- Delegates parsing to FileTodoParser and FolderTodoParser
- Provides aggregated view of all todos
- Handles file filtering (ignored folders, archived todos)

**FileTodoParser** (`src/domain/FileTodoParser.ts`)
- Parses individual markdown files for todos
- Creates hierarchical todo structures (subtasks)
- Uses LineOperations for line-level parsing
- Returns TodoItem arrays with file references

**LineOperations** (`src/domain/LineOperations.ts`)
- Low-level todo line parsing and manipulation
- Handles both classic `@attribute(value)` and dataview `[attribute:: value]` syntax
- Parses line structure: indentation, list markers, checkboxes, dates, text
- Converts between checkbox markers and TodoStatus enum
- Provides toggle, complete, and attribute manipulation functions

**TodoItem** (`src/domain/TodoItem.ts`)
- Core data structure representing a todo
- Status: AttentionRequired, Todo, InProgress, Delegated, Complete, Canceled
- Contains text, file reference, attributes, line number, and optional subtasks
- Generic over file type to support testing

### Data Flow

1. **File Changes** → TodoIndex receives event
2. **TodoIndex** → Calls FileTodoParser for affected file
3. **FileTodoParser** → Uses LineOperations to parse each line
4. **LineOperations** → Extracts todos with attributes and status
5. **TodoIndex** → Updates internal state and triggers UI refresh
6. **UI Components** → Display updated todos in planning board

### Key Settings

`ProletarianWizardSettings.ts` defines configuration:
- `dueDateAttribute`: Attribute name for due dates (default: "due")
- `completedDateAttribute`: Attribute name for completion dates (default: "completed")
- `startedAttribute`: Attribute name for start dates (default: "started")
- `selectedAttribute`: Boolean attribute for selected todos (default: "selected")
- `useDataviewSyntax`: Enable dataview syntax `[attr:: value]` vs classic `@attr(value)`
- `ignoredFolders`: Array of folder paths to exclude from scanning
- `ignoreArchivedTodos`: Whether to ignore todos in archived folders

### UI Architecture

React components in `src/ui/`:
- **PlanningComponent.tsx**: Main planning board view
- **TodoListComponent.tsx**: Renders lists of todos
- **TodoItemComponent.tsx**: Individual todo display/interaction
- **PlanningTodoColumn.tsx**: Columns for different todo categories
- **TodoReportComponent.tsx**: Report generation interface

Views in `src/Views/`:
- **PlanningView.ts**: Obsidian custom view for planning board
- **TodoReportView.ts**: Report generation view
- **ProletarianWizardSettingsTab.ts**: Plugin settings interface

## Todo Syntax Parsing

The plugin recognizes todos with this structure:
```
<indentation><list-marker> <checkbox> <date>: <text with attributes>
```

Examples:
```markdown
- [ ] Basic todo
- [ ] Todo with due date @due(2025-01-15)
- [x] Completed todo @completed(2025-01-10)
- [>] In progress todo @selected @priority(high)
  - [ ] Subtask (indented under parent)
```

Checkbox status mapping:
- `[ ]` → Todo
- `[x]` → Complete
- `[-]` → Canceled
- `[>]` → InProgress
- `[!]` → AttentionRequired
- `[d]` → Delegated

Attributes can use:
- Classic syntax: `@attribute(value)` or `@attribute` (boolean)
- Dataview syntax: `[attribute:: value]` (when enabled in settings)

## Testing

Tests use Jest with ts-jest preset. Key patterns:

**MockFile** (`tests/mocks/MockFile.ts`): In-memory IFile implementation for testing
```typescript
const mockFile = new MockFile("test.md", "- [ ] Test todo");
```

**Test Coverage**:
- LineOperations: 61% (complex parsing logic)
- FileTodoParser: 97% (file parsing)
- TodoIndex: 80% (todo management)

When writing tests:
- Use MockFile for IFile dependencies
- Test both classic and dataview syntax variants
- Include subtask hierarchy tests
- Test edge cases (empty files, malformed todos)

## Build Process

1. TypeScript compilation (`tsc -p tsconfig.build.json`)
2. esbuild bundling for production (`esbuild.config.mjs`)
3. Outputs: `main.js`, `manifest.json`, `styles.css`

The plugin uses:
- **React 18** for UI components
- **chrono-node** for natural language date parsing
- **luxon** for date manipulation
- **evergreen-ui** for UI components

## File Operations

Todo updates trigger file modifications:
- Changes in planning board update the source markdown files
- File operations go through ObsidianFile adapter (`src/infrastructure/ObsidianFile.ts`)
- Bidirectional sync: board ↔ markdown files

## Common Patterns

**Adding a new command**:
1. Create command class in `src/Commands/` implementing Obsidian Command interface
2. Register in `main.ts` onload() using `this.addCommand()`
3. Command receives LineOperations, settings, and app dependencies

**Adding a new attribute**:
1. Update ProletarianWizardSettings interface
2. Add to DEFAULT_SETTINGS
3. Update LineOperations to handle attribute if special parsing needed
4. Update UI components to display/edit attribute

**Debugging todo parsing**:
- Check LineOperations.toTodo() for line-level parsing
- Use LineOperations.parseLine() to see line structure breakdown
- Check FileTodoParser.parseMdFileAsync() for file-level parsing
- Enable debug logging by setting ConsoleLogger level in main.ts
