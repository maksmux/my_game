# Architecture

## Technology Stack

- HTML, CSS, and JavaScript ES modules.
- No frontend framework and no runtime dependencies.
- Node.js built-in `assert` module for tests.
- GitLab CI/CD and GitLab Pages for optional hosted play.

## Architecture Overview

The project is intentionally static and buildless. This keeps the game easy to run locally, easy to review, and suitable for GitLab Pages without a bundling step.

```text
index.html
  -> src/app.js       Browser UI, animation timing, event handling
  -> src/game.js      Game state, deck creation, turn rules
  -> src/styles.css   Layout, cards, highlights, reveal animations

tests/game.test.mjs   Rule-engine tests executed with Node.js
```

## Major Design Decisions

### Separate Rule Engine

The core rules live in `src/game.js` and do not depend on the DOM. This makes turn chains, discards, wins, and deck setup testable without a browser.

### Buildless Static App

The challenge asks for a playable game and suggests one-click access from GitLab. A static app is the smallest deployment surface: GitLab Pages only needs to copy the source files into the `public` artifact.

### Step-Based Turn Resolution

The engine exposes small operations:

- `beginTurn`
- `resolveIncomingCard`
- `endTurn`
- `playTurn`

The UI uses the step-based operations for animation. Tests use `playTurn` for concise full-turn validation.

### Deterministic Test Seeds

The engine includes a tiny seeded random generator so setup and shuffle behavior can be reproduced during tests.

### AI as Automation

AI players do not evaluate strategy because there are no choices. The UI schedules the same turn-resolution function used for human players.

## AI Tooling Used

- OpenAI Codex desktop as the coding agent.
- AI-assisted planning, implementation, validation, and documentation drafting.
- Human-provided challenge rules and repository target.

## Agent Workflow

1. Parse the assignment and convert it into implementation requirements.
2. Choose a buildless browser architecture for direct GitLab Pages compatibility.
3. Implement the game engine separately from the UI.
4. Add browser interactions and animations.
5. Add automated tests for the riskiest rule paths.
6. Write required challenge documentation.
7. Add GitLab Pages CI configuration.
8. Validate with `npm test` and local static serving.
