```markdown
# UangNih Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill introduces the core development patterns and workflows used in the UangNih JavaScript codebase. UangNih is a JavaScript project with no detected framework, focusing on clear file organization, consistent coding conventions, and streamlined workflows for feature development, UI updates, and hotfixes. This guide will help you quickly get up to speed with the project's practices, from file naming to build and commit processes.

## Coding Conventions

### File Naming
- **PascalCase** is used for file names.
  - Example: `Parser.js`, `App.js`

### Import Style
- **Relative imports** are used throughout the codebase.
  - Example:
    ```javascript
    import { parseData } from './Parser.js';
    ```

### Export Style
- **Named exports** are preferred.
  - Example:
    ```javascript
    // In Parser.js
    export function parseData(input) { ... }
    ```

### Commit Messages
- **Freeform** messages, typically short (average 14 characters).
- No strict prefixing or ticket referencing.

## Workflows

### Feature or Bugfix with Build Output
**Trigger:** When you want to add a new feature or fix a bug and ensure the build/output files are updated.
**Command:** `/feature-with-build`

1. Edit the relevant source files (e.g., `app.js`, `parser.js`, `index.html`, or `src/app.js`).
2. Run the build process to regenerate files in the `dist/` directory (such as `dist/app.js`, `dist/index.html`, `dist/parser.js`).
3. Commit both the updated source files and the corresponding `dist/` files together.

**Example:**
```sh
# Edit source files
vim src/app.js

# Run build (example command, adjust as needed)
npm run build

# Stage and commit changes
git add src/app.js dist/app.js
git commit -m "Add new calculation feature"
```

---

### UI or Style Update
**Trigger:** When you want to update the look and feel of the app or modify image assets.
**Command:** `/ui-update`

1. Edit `index.html` and/or `style.css` to change UI or styling.
2. Optionally, add or remove image files (e.g., `uangnih.png`, `uangnih-transparent.png`).
3. Commit all UI, style, and asset changes together.

**Example:**
```sh
# Edit UI files
vim index.html style.css

# Add or remove images
git add uangnih.png
git rm uangnih-transparent.png

# Commit changes
git commit -m "Update homepage layout and logo"
```

---

### Single File Hotfix
**Trigger:** When you need to make a quick fix or minor tweak to a single file.
**Command:** `/hotfix`

1. Edit the single file needing a fix (e.g., `index.html` or `parser.js`).
2. Commit the change.

**Example:**
```sh
# Edit the file
vim parser.js

# Commit the fix
git add parser.js
git commit -m "Fix parsing bug"
```

## Testing Patterns

- **Test Framework:** Unknown (not detected).
- **Test File Pattern:** Test files are named with the `.test.js` suffix.
  - Example: `Parser.test.js`
- **Typical Test Structure:**
  ```javascript
  // Parser.test.js
  import { parseData } from './Parser.js';

  test('parses valid input', () => {
    expect(parseData('123')).toBe(123);
  });
  ```

## Commands

| Command               | Purpose                                                   |
|-----------------------|-----------------------------------------------------------|
| /feature-with-build   | Add a feature or fix a bug and update build/output files  |
| /ui-update            | Make UI or style changes, including image assets          |
| /hotfix               | Apply a quick fix to a single file                        |
```
