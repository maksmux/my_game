# UNO Numbers Chain

A small browser card game built for the AI-Native Development Challenge. It uses only numbered UNO-style cards and turns each move into a deterministic replacement chain.

## Play

- GitLab Pages: https://maksmux.github.io/my_game/ after the Pages pipeline runs.
- Local file: open `index.html` in a browser.
- Local server:

```bash
npm run start
```

Then open `http://localhost:8000`.

## GitLab Pages Deployment

The game is deployed as a static GitLab Pages site. The `pages` CI job copies `index.html`, `src/`, and project documentation into the `public/` artifact, so the game can be played from GitLab without cloning the repository or running a local server.

To publish or update the hosted version:

1. Push changes to the default branch.
2. Keep a GitLab Runner online for the project.
3. Wait for the `test` and `pages` jobs to pass.
4. Open [link](https://maksmux.github.io/my_game/).

## Game Description

Each player has a hidden board with ten positions: `0` through `9`. On a turn, the player draws one card and places it into the board position matching that card value. The card that was already in that position is picked up and must be placed next. The chain continues until the next card points to an already revealed position, then that card is discarded and the turn passes.

The first player to reveal all ten positions wins immediately.

## Features

- 2-4 players.
- Single-player mode against automatic AI players.
- Local multiplayer by setting all players as humans.
- Numbered UNO-style deck only: no action cards and no wild cards.
- Click-by-click human turns: draw from the pile, click the matching board position, and click discard when a repeated position appears.
- Animated board reveals, active-position highlighting, draw pile, discard pile, turn log, and winner state.
- Buildless static deployment for GitLab Pages.

## Setup

No runtime dependencies are required for the game itself. Node.js is only used for the validation test script.

```bash
npm test
```

## Project Files

- `src/game.js` contains the rule engine.
- `src/app.js` connects the engine to the browser UI.
- `src/styles.css` contains the visual design and animations.
- `tests/game.test.mjs` validates deck setup, turn chains, discards, reshuffling, and winning.
- `.gitlab-ci.yml` runs tests and publishes the static site through GitLab Pages.

## Documentation

- [SPEC.md](SPEC.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [RETROSPECTIVE.md](RETROSPECTIVE.md)
