export const COLORS = [
  { id: "red", name: "Red", hex: "#ef4444" },
  { id: "yellow", name: "Yellow", hex: "#facc15" },
  { id: "green", name: "Green", hex: "#22c55e" },
  { id: "blue", name: "Blue", hex: "#3b82f6" }
];

export function createUnoNumberDeck() {
  const cards = [];

  for (const color of COLORS) {
    cards.push(createCard(0, color.id, `${color.id}-0-1`));

    for (let value = 1; value <= 9; value += 1) {
      cards.push(createCard(value, color.id, `${color.id}-${value}-1`));
      cards.push(createCard(value, color.id, `${color.id}-${value}-2`));
    }
  }

  return cards;
}

export function createCard(value, color = "red", id = `${color}-${value}-${cryptoId()}`) {
  return { id, value, color };
}

export function createSeededRandom(seed = String(Date.now())) {
  let state = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    state ^= seed.charCodeAt(index);
    state = Math.imul(state, 16777619);
  }

  return function random() {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(cards, rng = Math.random) {
  const shuffled = [...cards];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

export function createGame({ playerCount = 2, humanCount = 1, seed = String(Date.now()) } = {}) {
  if (playerCount < 2 || playerCount > 4) {
    throw new Error("Player count must be between 2 and 4.");
  }

  const normalizedHumanCount = Math.max(1, Math.min(humanCount, playerCount));
  const rng = typeof seed === "function" ? seed : createSeededRandom(String(seed));
  const deck = shuffle(createUnoNumberDeck(), rng);
  const players = [];

  for (let playerIndex = 0; playerIndex < playerCount; playerIndex += 1) {
    const board = [];

    for (let slot = 0; slot <= 9; slot += 1) {
      board.push({
        slot,
        card: deck.pop(),
        revealed: false
      });
    }

    players.push({
      id: `player-${playerIndex + 1}`,
      name: playerIndex < normalizedHumanCount ? `Player ${playerIndex + 1}` : `AI ${playerIndex + 1}`,
      type: playerIndex < normalizedHumanCount ? "human" : "ai",
      board
    });
  }

  return {
    players,
    drawPile: deck,
    discardPile: [],
    currentPlayerIndex: 0,
    status: "playing",
    winnerIndex: null,
    turnNumber: 1,
    rng
  };
}

export function beginTurn(state) {
  if (state.status !== "playing") {
    return [{ type: "ignored", status: state.status }];
  }

  const actions = [];

  if (state.drawPile.length === 0 && state.discardPile.length > 0) {
    const recycledCount = state.discardPile.length;
    state.drawPile = shuffle(state.discardPile, state.rng);
    state.discardPile = [];
    actions.push({ type: "reshuffle", count: recycledCount });
  }

  if (state.drawPile.length === 0) {
    state.status = "stalled";
    actions.push({ type: "stalled" });
    return actions;
  }

  const card = state.drawPile.pop();
  actions.push({
    type: "draw",
    playerIndex: state.currentPlayerIndex,
    card
  });

  return actions;
}

export function resolveIncomingCard(state, card) {
  if (!card) {
    throw new Error("A card is required to continue the turn.");
  }

  if (state.status !== "playing") {
    return { type: "ignored", status: state.status };
  }

  const playerIndex = state.currentPlayerIndex;
  const player = state.players[playerIndex];
  const slot = card.value;
  const position = player.board[slot];

  if (position.revealed) {
    state.discardPile.push(card);
    return {
      type: "discard",
      playerIndex,
      slot,
      card,
      reason: "revealed-position"
    };
  }

  const pickedCard = position.card;
  position.card = card;
  position.revealed = true;

  const action = {
    type: "place",
    playerIndex,
    slot,
    card,
    pickedCard
  };

  if (hasWon(player)) {
    state.status = "won";
    state.winnerIndex = playerIndex;
    action.winnerIndex = playerIndex;
  }

  return action;
}

export function endTurn(state) {
  if (state.status !== "playing") {
    return { type: "no-advance", status: state.status };
  }

  const from = state.currentPlayerIndex;
  const to = (from + 1) % state.players.length;
  state.currentPlayerIndex = to;

  if (to === 0) {
    state.turnNumber += 1;
  }

  return { type: "advance", from, to, turnNumber: state.turnNumber };
}

export function playTurn(state) {
  const actions = beginTurn(state);
  const drawAction = actions.find((action) => action.type === "draw");

  if (!drawAction) {
    return actions;
  }

  let incomingCard = drawAction.card;

  while (incomingCard && state.status === "playing") {
    const action = resolveIncomingCard(state, incomingCard);
    actions.push(action);

    if (action.type === "discard") {
      break;
    }

    if (state.status === "won") {
      actions.push({ type: "win", winnerIndex: state.winnerIndex });
      break;
    }

    incomingCard = action.pickedCard;
  }

  if (state.status === "playing") {
    actions.push(endTurn(state));
  }

  return actions;
}

export function countRevealed(player) {
  return player.board.filter((position) => position.revealed).length;
}

export function hasWon(player) {
  return countRevealed(player) === 10;
}

export function cardLabel(card) {
  if (!card) {
    return "No card";
  }

  const color = COLORS.find((item) => item.id === card.color);
  return `${color ? color.name : card.color} ${card.value}`;
}

function cryptoId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2);
}
