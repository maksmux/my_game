# Specification

## Objective

Build a playable browser card game based on UNO numbered cards while documenting the full AI-native development lifecycle.

## Scope

In scope:

- Browser-playable game for 2-4 players.
- Numbered cards only, values `0-9`.
- Hidden ten-position board for each player.
- Automatic replacement-chain turn resolution.
- Single-player mode against AI.
- Local multiplayer on one device.
- Static GitLab Pages deployment support.
- Automated rule tests.

Out of scope:

- Official UNO action cards, wild cards, colors as gameplay mechanics, scoring, accounts, saved games, network multiplayer, and matchmaking.

## Deck Rules

The deck uses the numbered-card distribution from a standard UNO deck:

- Four `0` cards, one per color.
- Eight cards for each value from `1` through `9`, two per color.
- Total numbered cards: `76`.

Colors are visual only. The card value determines every game action.

## Board Layout

Each player owns ten board positions. Positions are permanently mapped to card values.

Top row:

```text
0 1 2 3 4
```

Bottom row:

```text
5 6 7 8 9
```

All positions start face down. Revealed positions stay visible for the rest of the game.

## Setup Rules

1. Shuffle all numbered cards.
2. Deal ten cards to each player into positions `0-9`.
3. Keep all dealt cards face down.
4. Place the remaining cards into the draw pile.
5. Start with Player 1.

## Turn Rules

1. Draw the top card from the draw pile.
2. Reveal its value.
3. If that value points to an already revealed position, discard the card and end the turn.
4. Otherwise, place the card into the matching board position.
5. Reveal that position permanently.
6. Pick up the card that was previously in that position.
7. Repeat the process with the picked-up card.
8. End the turn when the next card points to an already revealed position.

Implementation clarification: if the draw pile is empty, the discard pile is shuffled back into the draw pile. If both piles are empty, the game enters a stalled state.

## Win Condition

A player wins immediately when all ten board positions have been revealed.

## AI Behavior

The game contains no player choices during a turn. AI players automatically run the same mandatory turn sequence as human players.

## Functional Requirements

- The game must allow 2, 3, or 4 players.
- The game must allow 1 through `playerCount` human players.
- The game must show the current player.
- The game must show each board in the required two-row layout.
- Hidden cards must not expose their values.
- Revealed cards must remain visible.
- The game must animate each replacement step.
- The game must highlight the destination position for the active card.
- The game must show draw and discard pile counts.
- Human players must be able to resolve a turn step by step by clicking the draw pile, matching board positions, and the discard pile.
- The game must stop immediately when a player wins.

## Acceptance Criteria

- A new game deals ten hidden positions per player.
- A turn can reveal one or more positions through a replacement chain.
- A turn discards the active card when its matching position is already revealed.
- Human turn chains can be completed through individual clicks instead of automatic resolution.
- A player with all ten revealed positions is declared the winner.
- AI players complete turns automatically.
- `npm test` passes.
- The project can run from a static file server and can be published by GitLab Pages.
