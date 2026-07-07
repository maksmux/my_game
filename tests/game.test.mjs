import assert from "node:assert/strict";
import {
  beginTurn,
  createGame,
  createUnoNumberDeck,
  playTurn
} from "../src/game.js";

const tests = [
  ["creates the numbered UNO deck", testDeck],
  ["sets up 2-4 players with hidden boards", testSetup],
  ["resolves a replacement chain until a revealed slot repeats", testReplacementChain],
  ["discards immediately when the drawn card targets a revealed slot", testImmediateDiscard],
  ["wins immediately after the final position is revealed", testWinCondition],
  ["reshuffles the discard pile when the draw pile is empty", testDiscardReshuffle]
];

for (const [name, test] of tests) {
  test();
  console.log(`ok - ${name}`);
}

function testDeck() {
  const deck = createUnoNumberDeck();
  assert.equal(deck.length, 76);

  const counts = new Map();

  for (const card of deck) {
    counts.set(card.value, (counts.get(card.value) ?? 0) + 1);
  }

  assert.equal(counts.get(0), 4);

  for (let value = 1; value <= 9; value += 1) {
    assert.equal(counts.get(value), 8);
  }
}

function testSetup() {
  const game = createGame({ playerCount: 4, humanCount: 2, seed: "setup-test" });

  assert.equal(game.players.length, 4);
  assert.equal(game.drawPile.length, 36);
  assert.equal(game.players[0].type, "human");
  assert.equal(game.players[1].type, "human");
  assert.equal(game.players[2].type, "ai");

  for (const player of game.players) {
    assert.equal(player.board.length, 10);
    assert.equal(player.board.every((position) => position.revealed === false), true);
  }
}

function testReplacementChain() {
  const game = customGame();
  const board = game.players[0].board;
  board[1].card = card(2, "hidden-two");
  board[2].card = card(1, "hidden-one");
  game.drawPile = [card(1, "drawn-one")];

  const actions = playTurn(game);

  assert.deepEqual(actions.map((action) => action.type), [
    "draw",
    "place",
    "place",
    "discard",
    "advance"
  ]);
  assert.equal(board[1].revealed, true);
  assert.equal(board[2].revealed, true);
  assert.equal(game.discardPile[0].id, "hidden-one");
  assert.equal(game.currentPlayerIndex, 1);
}

function testImmediateDiscard() {
  const game = customGame();
  game.players[0].board[5].revealed = true;
  game.drawPile = [card(5, "drawn-five")];

  const actions = playTurn(game);

  assert.deepEqual(actions.map((action) => action.type), ["draw", "discard", "advance"]);
  assert.equal(game.discardPile[0].id, "drawn-five");
  assert.equal(game.currentPlayerIndex, 1);
}

function testWinCondition() {
  const game = customGame();
  const board = game.players[0].board;

  for (const position of board) {
    position.revealed = true;
  }

  board[3].revealed = false;
  board[3].card = card(0, "last-hidden-card");
  game.drawPile = [card(3, "winning-three")];

  const actions = playTurn(game);

  assert.deepEqual(actions.map((action) => action.type), ["draw", "place", "win"]);
  assert.equal(game.status, "won");
  assert.equal(game.winnerIndex, 0);
  assert.equal(board[3].revealed, true);
  assert.equal(game.discardPile.length, 0);
}

function testDiscardReshuffle() {
  const game = customGame();
  game.drawPile = [];
  game.discardPile = [card(4, "discard-four"), card(5, "discard-five")];

  const actions = beginTurn(game);

  assert.equal(actions[0].type, "reshuffle");
  assert.equal(actions[0].count, 2);
  assert.equal(actions[1].type, "draw");
  assert.equal(game.discardPile.length, 0);
  assert.equal(game.drawPile.length, 1);
}

function customGame() {
  return {
    players: [
      {
        id: "player-1",
        name: "Player 1",
        type: "human",
        board: Array.from({ length: 10 }, (_, slot) => ({
          slot,
          card: card(slot, `p1-${slot}`),
          revealed: false
        }))
      },
      {
        id: "player-2",
        name: "Player 2",
        type: "human",
        board: Array.from({ length: 10 }, (_, slot) => ({
          slot,
          card: card(slot, `p2-${slot}`),
          revealed: false
        }))
      }
    ],
    drawPile: [],
    discardPile: [],
    currentPlayerIndex: 0,
    status: "playing",
    winnerIndex: null,
    turnNumber: 1,
    rng: () => 0.4
  };
}

function card(value, id, color = "red") {
  return { id, value, color };
}
