---
name: feature-or-bugfix-with-build-output
description: Workflow command scaffold for feature-or-bugfix-with-build-output in UangNih.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /feature-or-bugfix-with-build-output

Use this workflow when working on **feature-or-bugfix-with-build-output** in `UangNih`.

## Goal

Implements a new feature or fixes a bug, updating both source files and corresponding built/output files in dist/.

## Common Files

- `app.js`
- `parser.js`
- `index.html`
- `src/app.js`
- `dist/app.js`
- `dist/index.html`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Edit source files (e.g., app.js, parser.js, index.html, src/app.js)
- Run build process to update dist/ files (e.g., dist/app.js, dist/index.html, dist/parser.js)
- Commit both source and dist/ files together

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.