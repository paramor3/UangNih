---
name: ui-or-style-update
description: Workflow command scaffold for ui-or-style-update in UangNih.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /ui-or-style-update

Use this workflow when working on **ui-or-style-update** in `UangNih`.

## Goal

Makes changes to the UI or styling, often involving index.html and style.css, sometimes with image assets.

## Common Files

- `index.html`
- `style.css`
- `uangnih.png`
- `uangnih-transparent.png`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Edit index.html and/or style.css
- Optionally add or remove image files (e.g., uangnih.png, uangnih-transparent.png)
- Commit UI/style and asset changes together

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.