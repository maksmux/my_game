import {
  beginTurn,
  COLORS,
  countRevealed,
  createGame,
  endTurn,
  resolveIncomingCard
} from "./game.js";

const state = {
  game: null,
  playerCount: 2,
  humanCount: 1,
  isAnimating: false,
  active: null,
  pendingCard: null,
  manualStep: "idle",
  stepMessage: "",
  log: [],
  aiTimer: null
};

const elements = {
  turnStatus: document.querySelector("#turnStatus"),
  playerCountOptions: document.querySelector("#playerCountOptions"),
  humanCountOptions: document.querySelector("#humanCountOptions"),
  newGameButton: document.querySelector("#newGameButton"),
  playTurnButton: document.querySelector("#playTurnButton"),
  boardsArea: document.querySelector("#boardsArea"),
  drawPileButton: document.querySelector("#drawPileButton"),
  drawCount: document.querySelector("#drawCount"),
  drawPileText: document.querySelector("#drawPileText"),
  discardPileText: document.querySelector("#discardPileText"),
  discardPreview: document.querySelector("#discardPreview"),
  activeCardDisplay: document.querySelector("#activeCardDisplay"),
  activeCardText: document.querySelector("#activeCardText"),
  stepInstruction: document.querySelector("#stepInstruction"),
  currentCardPanel: document.querySelector("#currentCardPanel"),
  turnLog: document.querySelector("#turnLog"),
  winnerOverlay: document.querySelector("#winnerOverlay"),
  winnerTitle: document.querySelector("#winnerTitle"),
  winnerNewGameButton: document.querySelector("#winnerNewGameButton"),
  rulesLanguageOptions: document.querySelector(".rules-language")
};

elements.playerCountOptions.addEventListener("click", (event) => {
  const button = event.target.closest("[data-player-count]");

  if (!button) {
    return;
  }

  state.playerCount = Number(button.dataset.playerCount);
  state.humanCount = Math.min(state.humanCount, state.playerCount);
  renderHumanOptions();
  syncSegmentedButtons();
});

elements.humanCountOptions.addEventListener("click", (event) => {
  const button = event.target.closest("[data-human-count]");

  if (!button) {
    return;
  }

  state.humanCount = Number(button.dataset.humanCount);
  syncSegmentedButtons();
});

elements.newGameButton.addEventListener("click", startNewGame);
elements.winnerNewGameButton.addEventListener("click", startNewGame);
elements.playTurnButton.addEventListener("click", runCurrentTurn);
elements.rulesLanguageOptions.addEventListener("click", switchRulesLanguage);
elements.drawPileButton.addEventListener("click", drawHumanCard);
elements.discardPreview.addEventListener("click", discardHumanCard);
elements.boardsArea.addEventListener("click", placeHumanCard);

renderHumanOptions();
startNewGame();

function startNewGame() {
  clearTimeout(state.aiTimer);
  state.game = createGame({
    playerCount: state.playerCount,
    humanCount: state.humanCount,
    seed: `${Date.now()}-${state.playerCount}-${state.humanCount}`
  });
  state.isAnimating = false;
  state.active = null;
  state.pendingCard = null;
  state.stepMessage = "";
  state.log = [`New game: ${state.playerCount} ${pluralEn(state.playerCount, "player")}, ${state.humanCount} ${pluralEn(state.humanCount, "human")}.`];
  elements.winnerOverlay.hidden = true;
  setManualStepForCurrentPlayer();
  render();
  scheduleAiTurn();
}

async function runCurrentTurn() {
  if (!state.game || state.game.status !== "playing" || state.isAnimating || state.pendingCard) {
    return;
  }

  clearTimeout(state.aiTimer);
  state.isAnimating = true;
  state.manualStep = "idle";
  state.stepMessage = "";

  const playerIndex = state.game.currentPlayerIndex;
  const player = state.game.players[playerIndex];
  appendLog(`${player.name} starts turn ${state.game.turnNumber}.`);

  const startActions = beginTurn(state.game);
  let incomingCard = null;

  for (const action of startActions) {
    if (action.type === "reshuffle") {
      appendLog(`Discard pile reshuffled into ${action.count} ${pluralEn(action.count, "draw card")}.`);
      render();
      await wait(400);
    }

    if (action.type === "stalled") {
      appendLog("No cards remain to continue the game.");
      state.active = null;
      state.isAnimating = false;
      render();
      return;
    }

    if (action.type === "draw") {
      incomingCard = action.card;
      state.active = {
        playerIndex,
        slot: incomingCard.value,
        card: incomingCard,
        phase: "draw"
      };
      appendLog(`${player.name} drew ${formatCard(incomingCard)}.`);
      render();
      await wait(520);
    }
  }

  while (incomingCard && state.game.status === "playing") {
    state.active = {
      playerIndex,
      slot: incomingCard.value,
      card: incomingCard,
      phase: "target"
    };
    render();
    await wait(460);

    const action = resolveIncomingCard(state.game, incomingCard);

    if (action.type === "discard") {
      appendLog(`${formatCard(action.card)} hit revealed position ${action.slot} and was discarded.`);
      state.active = {
        playerIndex,
        slot: action.slot,
        card: action.card,
        phase: "discard"
      };
      render();
      await wait(640);
      break;
    }

    if (action.type === "place") {
      appendLog(`${formatCard(action.card)} opened position ${action.slot}; ${formatCard(action.pickedCard)} was picked up.`);
      state.active = {
        playerIndex,
        slot: action.slot,
        card: action.card,
        phase: "place"
      };
      render();
      await wait(720);

      if (state.game.status === "won") {
        appendLog(`${player.name} revealed all ten positions.`);
        break;
      }

      incomingCard = action.pickedCard;
      state.active = {
        playerIndex,
        slot: incomingCard.value,
        card: incomingCard,
        phase: "carry"
      };
      render();
      await wait(520);
    }
  }

  if (state.game.status === "playing") {
    const advance = endTurn(state.game);
    appendLog(`Turn passed to ${state.game.players[advance.to].name}.`);
  }

  state.active = null;
  state.pendingCard = null;
  state.isAnimating = false;
  setManualStepForCurrentPlayer();
  render();
  scheduleAiTurn();
}

function drawHumanCard() {
  if (!canDrawFromPile()) {
    return;
  }

  clearTimeout(state.aiTimer);

  const playerIndex = state.game.currentPlayerIndex;
  const player = state.game.players[playerIndex];
  appendLog(`${player.name} starts turn ${state.game.turnNumber}.`);

  const actions = beginTurn(state.game);

  for (const action of actions) {
    if (action.type === "reshuffle") {
      appendLog(`Discard pile reshuffled into ${action.count} ${pluralEn(action.count, "draw card")}.`);
    }

    if (action.type === "stalled") {
      state.manualStep = "idle";
      state.active = null;
      state.pendingCard = null;
      state.stepMessage = "No cards remain to continue the game.";
      appendLog(state.stepMessage);
      render();
      return;
    }

    if (action.type === "draw") {
      state.pendingCard = action.card;
      preparePendingCard(playerIndex, action.card, `${player.name} drew ${formatCard(action.card)}.`);
    }
  }

  render();
}

function placeHumanCard(event) {
  const cardButton = event.target.closest(".board-card");

  if (!cardButton || !canPlacePendingCard()) {
    return;
  }

  const playerIndex = Number(cardButton.dataset.playerIndex);
  const slot = Number(cardButton.dataset.slot);

  if (playerIndex !== state.game.currentPlayerIndex) {
    return;
  }

  if (slot !== state.pendingCard.value) {
    state.stepMessage = `${formatCard(state.pendingCard)} must go to position ${state.pendingCard.value}.`;
    render();
    return;
  }

  const player = state.game.players[playerIndex];
  const targetPosition = player.board[state.pendingCard.value];

  if (targetPosition.revealed) {
    state.manualStep = "discard";
    state.active = null;
    state.stepMessage = `${formatCard(state.pendingCard)} points to revealed position ${state.pendingCard.value}. Click the discard pile.`;
    render();
    return;
  }

  const action = resolveIncomingCard(state.game, state.pendingCard);

  if (action.type !== "place") {
    return;
  }

  appendLog(`${formatCard(action.card)} opened position ${action.slot}; ${formatCard(action.pickedCard)} was picked up.`);
  state.active = {
    playerIndex,
    slot: action.slot,
    card: action.card,
    phase: "place"
  };

  if (state.game.status === "won") {
    state.pendingCard = null;
    state.manualStep = "idle";
    state.stepMessage = `${player.name} revealed all ten positions.`;
    appendLog(state.stepMessage);
    render();
    return;
  }

  preparePendingCard(playerIndex, action.pickedCard, `${formatCard(action.pickedCard)} is now in play.`);
  render();
}

function discardHumanCard() {
  if (!canDiscardPendingCard()) {
    return;
  }

  const action = resolveIncomingCard(state.game, state.pendingCard);

  if (action.type !== "discard") {
    return;
  }

  appendLog(`${formatCard(action.card)} hit revealed position ${action.slot} and was discarded.`);
  state.pendingCard = null;
  state.active = null;
  state.stepMessage = "";

  if (state.game.status === "playing") {
    const advance = endTurn(state.game);
    appendLog(`Turn passed to ${state.game.players[advance.to].name}.`);
  }

  setManualStepForCurrentPlayer();
  render();
  scheduleAiTurn();
}

function render() {
  const game = state.game;

  if (!game) {
    return;
  }

  syncSegmentedButtons();
  renderStatus();
  renderPiles();
  renderBoards();
  renderLog();
  renderWinner();
}

function preparePendingCard(playerIndex, card, logMessage) {
  const player = state.game.players[playerIndex];
  const targetPosition = player.board[card.value];
  const mustDiscard = targetPosition.revealed;

  state.pendingCard = card;
  state.manualStep = mustDiscard ? "discard" : "place";
  state.active = null;
  state.stepMessage = mustDiscard
    ? `${formatCard(card)} points to revealed position ${card.value}. Click the discard pile.`
    : `${formatCard(card)} is in play. Click position ${card.value} on ${player.name}'s board.`;

  appendLog(logMessage);
}

function setManualStepForCurrentPlayer() {
  state.manualStep = isManualHumanTurn() ? "draw" : "idle";
  state.stepMessage = "";
}

function isManualHumanTurn() {
  if (!state.game || state.game.status !== "playing" || state.isAnimating) {
    return false;
  }

  return state.game.players[state.game.currentPlayerIndex].type === "human";
}

function canDrawFromPile() {
  return isManualHumanTurn() && state.manualStep === "draw" && !state.pendingCard;
}

function canPlacePendingCard() {
  return isManualHumanTurn() && state.manualStep === "place" && Boolean(state.pendingCard);
}

function canDiscardPendingCard() {
  return isManualHumanTurn() && state.manualStep === "discard" && Boolean(state.pendingCard);
}

function canClickBoardPosition(playerIndex, slot) {
  return (
    canPlacePendingCard() &&
    playerIndex === state.game.currentPlayerIndex &&
    slot === state.pendingCard.value
  );
}

function getStepInstruction() {
  if (state.stepMessage) {
    return state.stepMessage;
  }

  if (!state.game) {
    return "Start a new game.";
  }

  if (state.game.status === "won") {
    return `${state.game.players[state.game.winnerIndex].name} wins.`;
  }

  if (state.game.status === "stalled") {
    return "No cards remain to continue the game.";
  }

  const currentPlayer = state.game.players[state.game.currentPlayerIndex];

  if (currentPlayer.type === "ai") {
    return "AI will resolve its turn automatically.";
  }

  if (state.manualStep === "draw") {
    return "Click the draw pile to reveal the next card.";
  }

  if (state.manualStep === "place" && state.pendingCard) {
    return `${formatCard(state.pendingCard)} is in play. Click board position ${state.pendingCard.value}.`;
  }

  if (state.manualStep === "discard" && state.pendingCard) {
    return `${formatCard(state.pendingCard)} repeats an open position. Click the discard pile.`;
  }

  return "Wait for the current step to finish.";
}

function renderStatus() {
  const game = state.game;
  const currentPlayer = game.players[game.currentPlayerIndex];

  if (game.status === "won") {
    elements.turnStatus.textContent = `Winner: ${game.players[game.winnerIndex].name}`;
  } else if (game.status === "stalled") {
    elements.turnStatus.textContent = "Game stalled";
  } else if (state.isAnimating) {
    elements.turnStatus.textContent = `Resolving: ${currentPlayer.name}`;
  } else if (currentPlayer.type === "human" && state.manualStep === "draw") {
    elements.turnStatus.textContent = `Turn: ${currentPlayer.name} - draw`;
  } else if (currentPlayer.type === "human" && state.manualStep === "place" && state.pendingCard) {
    elements.turnStatus.textContent = `Turn: ${currentPlayer.name} - place ${state.pendingCard.value}`;
  } else if (currentPlayer.type === "human" && state.manualStep === "discard" && state.pendingCard) {
    elements.turnStatus.textContent = `Turn: ${currentPlayer.name} - discard ${state.pendingCard.value}`;
  } else {
    elements.turnStatus.textContent = `Turn: ${currentPlayer.name}`;
  }

  const canAutoPlay = game.status === "playing" && !state.isAnimating && !state.pendingCard;
  elements.playTurnButton.disabled = !canAutoPlay;
  elements.playTurnButton.textContent = currentPlayer.type === "ai" ? "AI turn" : `Auto-play ${currentPlayer.name}`;
}

function renderPiles() {
  const game = state.game;
  const discardTop = game.discardPile.at(-1);
  const canDraw = canDrawFromPile();
  const canDiscard = canDiscardPendingCard();

  elements.drawCount.textContent = game.drawPile.length;
  elements.drawPileText.textContent = formatCardCount(game.drawPile.length);
  elements.discardPileText.textContent = formatCardCount(game.discardPile.length);
  renderActiveCard();
  elements.stepInstruction.textContent = getStepInstruction();
  elements.currentCardPanel.dataset.phase = state.active?.phase ?? "idle";
  elements.drawPileButton.disabled = !canDraw;
  elements.drawPileButton.classList.toggle("is-clickable", canDraw);
  elements.drawPileButton.classList.toggle("is-draw-target", canDraw);

  elements.discardPreview.className = `pile-card${canDiscard ? " is-clickable is-discard-target" : ""}`;
  elements.discardPreview.disabled = !canDiscard;
  elements.discardPreview.innerHTML = `<span>-</span><small>${game.discardPile.length}</small>`;

  if (discardTop) {
    elements.discardPreview.classList.add(`card-${discardTop.color}`);
    elements.discardPreview.innerHTML = `<span>${discardTop.value}</span><small>${game.discardPile.length}</small>`;
  }
}

function renderActiveCard() {
  const card = state.pendingCard ?? state.active?.card;
  elements.activeCardDisplay.className = "active-card-display";

  if (!card) {
    elements.activeCardDisplay.innerHTML = `<span class="active-card-empty">None</span>`;
    elements.activeCardText.textContent = "No card selected";
    return;
  }

  elements.activeCardDisplay.classList.add(`card-${card.color}`);
  elements.activeCardDisplay.innerHTML = createActiveCardSvg(card);
  elements.activeCardText.textContent = formatCard(card);
}

function createActiveCardSvg(card) {
  const color = COLORS.find((item) => item.id === card.color)?.hex ?? "#2e3f39";

  return `
    <svg class="active-card-svg" viewBox="0 0 160 240" aria-hidden="true" focusable="false">
      <rect class="active-card-svg-shadow" x="8" y="8" width="144" height="224" rx="14" />
      <rect class="active-card-svg-border" x="10" y="6" width="140" height="224" rx="14" />
      <rect class="active-card-svg-body" x="18" y="14" width="124" height="208" rx="10" fill="${color}" />
      <ellipse class="active-card-svg-oval" cx="80" cy="120" rx="48" ry="72" />
      <text class="active-card-svg-brand" x="80" y="49">UNO</text>
      <text class="active-card-svg-number" x="80" y="143" fill="${color}">${card.value}</text>
    </svg>
  `;
}

function renderBoards() {
  const fragment = document.createDocumentFragment();

  for (const [playerIndex, player] of state.game.players.entries()) {
    const board = document.createElement("article");
    board.className = "player-board";

    if (playerIndex === state.game.currentPlayerIndex) {
      board.classList.add("is-current");
    }

    const header = document.createElement("header");
    header.className = "player-board-header";
    header.innerHTML = `
      <div>
        <h2>${player.name}</h2>
        <p>${player.type === "ai" ? "AI" : "Human"}</p>
      </div>
      <strong>${countRevealed(player)}/10</strong>
    `;

    const grid = document.createElement("div");
    grid.className = "board-grid";

    for (const position of player.board) {
      const card = document.createElement("button");
      const isActive = state.active?.playerIndex === playerIndex && state.active?.slot === position.slot;
      const canSelectOwnBoard = canPlacePendingCard() && playerIndex === state.game.currentPlayerIndex;
      const isClickable = canClickBoardPosition(playerIndex, position.slot);

      card.className = "board-card";
      card.type = "button";
      card.dataset.slot = position.slot;
      card.dataset.playerIndex = String(playerIndex);
      card.disabled = !canSelectOwnBoard;

      if (position.revealed) {
        card.classList.add("is-revealed", `card-${position.card.color}`);
      } else {
        card.classList.add("is-hidden");
      }

      if (isActive) {
        card.classList.add("is-active", `phase-${state.active.phase}`);
      }

      if (canSelectOwnBoard) {
        card.classList.add("is-clickable");
      }

      card.innerHTML = `
        <span class="slot-label">${position.slot}</span>
        <span class="card-value">${position.revealed ? position.card.value : "UNO"}</span>
      `;
      grid.append(card);
    }

    board.append(header, grid);
    fragment.append(board);
  }

  elements.boardsArea.replaceChildren(fragment);
}

function renderLog() {
  const items = state.log
    .slice(-9)
    .reverse()
    .map((entry) => `<li>${entry}</li>`)
    .join("");

  elements.turnLog.innerHTML = items;
}

function renderWinner() {
  if (state.game.status !== "won") {
    elements.winnerOverlay.hidden = true;
    return;
  }

  elements.winnerTitle.textContent = `${state.game.players[state.game.winnerIndex].name} wins`;
  elements.winnerOverlay.hidden = false;
}

function renderHumanOptions() {
  const fragment = document.createDocumentFragment();

  for (let count = 1; count <= state.playerCount; count += 1) {
    const button = document.createElement("button");
    button.className = "segment";
    button.type = "button";
    button.dataset.humanCount = String(count);
    button.textContent = String(count);
    fragment.append(button);
  }

  elements.humanCountOptions.replaceChildren(fragment);
  syncSegmentedButtons();
}

function syncSegmentedButtons() {
  document.querySelectorAll("[data-player-count]").forEach((button) => {
    button.classList.toggle("is-active", Number(button.dataset.playerCount) === state.playerCount);
  });

  document.querySelectorAll("[data-human-count]").forEach((button) => {
    button.classList.toggle("is-active", Number(button.dataset.humanCount) === state.humanCount);
  });
}

function switchRulesLanguage(event) {
  const button = event.target.closest("[data-rules-language]");

  if (!button) {
    return;
  }

  const language = button.dataset.rulesLanguage;

  document.querySelectorAll("[data-rules-language]").forEach((item) => {
    const isActive = item.dataset.rulesLanguage === language;
    item.classList.toggle("is-active", isActive);
    item.setAttribute("aria-selected", String(isActive));
  });

  document.querySelectorAll("[data-rules-panel]").forEach((panel) => {
    panel.hidden = panel.dataset.rulesPanel !== language;
  });
}

function renderCardColorStyle() {
  const style = document.createElement("style");
  style.textContent = COLORS.map((color) => `.card-${color.id} { --card-color: ${color.hex}; }`).join("\n");
  document.head.append(style);
}

function appendLog(message) {
  state.log.push(message);
}

function scheduleAiTurn() {
  clearTimeout(state.aiTimer);

  if (!state.game || state.game.status !== "playing" || state.isAnimating) {
    return;
  }

  const currentPlayer = state.game.players[state.game.currentPlayerIndex];

  if (currentPlayer.type === "ai") {
    state.aiTimer = setTimeout(runCurrentTurn, 900);
  }
}

function wait(duration) {
  return new Promise((resolve) => {
    setTimeout(resolve, duration);
  });
}

function formatCardCount(count) {
  return `${count} ${pluralEn(count, "card")}`;
}

function formatCard(card) {
  return `Card ${card.value}`;
}

function pluralEn(count, word) {
  return count === 1 ? word : `${word}s`;
}

renderCardColorStyle();
