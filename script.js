
const cells = [...document.querySelectorAll(".cell")];
const modeSelect = document.getElementById("gameMode");
const statusText = document.getElementById("status");
const turnDot = document.getElementById("turnDot");
const xName = document.getElementById("xName");
const oName = document.getElementById("oName");
const xScoreText = document.getElementById("xScore");
const oScoreText = document.getElementById("oScore");
const drawScoreText = document.getElementById("drawScore");
const newGameButton = document.getElementById("newGame");
const resetScoresButton = document.getElementById("resetScores");
const tipText = document.getElementById("tipText");

const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
];

let board = Array(9).fill("");
let currentPlayer = "X";
let gameOver = false;
let computerThinking = false;

const scores = {
  X: 0,
  O: 0,
  draws: 0
};

function getWinner(position) {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;

    if (
      position[a] &&
      position[a] === position[b] &&
      position[a] === position[c]
    ) {
      return {
        player: position[a],
        line
      };
    }
  }

  return null;
}

function isDraw(position) {
  return !getWinner(position) && position.every(Boolean);
}

function updateScores() {
  xScoreText.textContent = scores.X;
  oScoreText.textContent = scores.O;
  drawScoreText.textContent = scores.draws;
}

function updateNames() {
  const computerMode = modeSelect.value === "computer";

  xName.textContent = computerMode ? "YOU" : "PLAYER X";
  oName.textContent = computerMode ? "COMPUTER" : "PLAYER O";
}

function setStatus(message, player = currentPlayer) {
  statusText.textContent = message;
  turnDot.classList.toggle("o-turn", player === "O");
}

function renderBoard(winningLine = []) {
  cells.forEach((cell, index) => {
    const value = board[index];

    cell.textContent = value;
    cell.classList.toggle("x", value === "X");
    cell.classList.toggle("o", value === "O");
    cell.classList.toggle("winner", winningLine.includes(index));

    cell.disabled =
      gameOver ||
      computerThinking ||
      Boolean(value) ||
      (
        modeSelect.value === "computer" &&
        currentPlayer === "O"
      );

    const positionName = `Square ${index + 1}`;
    cell.setAttribute(
      "aria-label",
      value ? `${positionName}: ${value}` : `${positionName}: empty`
    );
  });
}

function finishGame(winnerInfo) {
  gameOver = true;

  if (winnerInfo) {
    const winner = winnerInfo.player;
    scores[winner]++;

    const computerMode = modeSelect.value === "computer";

    let message;

    if (computerMode && winner === "X") {
      message = "You win! Amazing move!";
      tipText.textContent = "Great play! Start another round and try again.";
    } else if (computerMode && winner === "O") {
      message = "Computer wins this round!";
      tipText.textContent = "Try creating a fork to threaten two winning moves.";
    } else {
      message = `Player ${winner} wins!`;
      tipText.textContent = `Player ${winner} takes the round!`;
    }

    renderBoard(winnerInfo.line);
    setStatus(message, winner);
  } else {
    scores.draws++;
    tipText.textContent = "Well played! A draw means neither player won.";
    renderBoard();
    setStatus("It's a draw! Nobody wins.", currentPlayer);
  }

  updateScores();
}

function playMove(index) {
  if (
    gameOver ||
    computerThinking ||
    board[index] ||
    (
      modeSelect.value === "computer" &&
      currentPlayer === "O"
    )
  ) {
    return;
  }

  board[index] = currentPlayer;

  const result = getWinner(board);

  if (result) {
    finishGame(result);
    return;
  }

  if (isDraw(board)) {
    finishGame(null);
    return;
  }

  if (modeSelect.value === "two") {
    currentPlayer = currentPlayer === "X" ? "O" : "X";
    renderBoard();
    setStatus(`Player ${currentPlayer}'s turn.`, currentPlayer);
    return;
  }

  // The human plays X and the computer plays O.
  currentPlayer = "O";
  computerThinking = true;
  renderBoard();
  setStatus("Computer is thinking...", "O");

  // Brief pause makes the computer move feel natural.
  window.setTimeout(() => {
    if (gameOver || modeSelect.value !== "computer") return;

    const bestMove = findBestMove(board);

    if (bestMove !== -1) {
      board[bestMove] = "O";
    }

    computerThinking = false;

    const computerResult = getWinner(board);

    if (computerResult) {
      finishGame(computerResult);
      return;
    }

    if (isDraw(board)) {
      finishGame(null);
      return;
    }

    currentPlayer = "X";
    renderBoard();
    setStatus("Your turn — choose a square!", "X");
  }, 300);
}

// Minimax evaluates possible future moves.
// O maximizes the score; X minimizes it.
// This guarantees optimal computer play.
function minimax(position, isMaximizing, depth) {
  const winnerInfo = getWinner(position);

  if (winnerInfo) {
    if (winnerInfo.player === "O") return 10 - depth;
    return depth - 10;
  }

  if (position.every(Boolean)) {
    return 0;
  }

  if (isMaximizing) {
    let bestScore = -Infinity;

    for (let i = 0; i < 9; i++) {
      if (position[i] === "") {
        position[i] = "O";
        const score = minimax(position, false, depth + 1);
        position[i] = "";
        bestScore = Math.max(bestScore, score);
      }
    }

    return bestScore;
  }

  let bestScore = Infinity;

  for (let i = 0; i < 9; i++) {
    if (position[i] === "") {
      position[i] = "X";
      const score = minimax(position, true, depth + 1);
      position[i] = "";
      bestScore = Math.min(bestScore, score);
    }
  }

  return bestScore;
}

function findBestMove(position) {
  let bestScore = -Infinity;
  let bestMoves = [];

  for (let i = 0; i < 9; i++) {
    if (position[i] !== "") continue;

    position[i] = "O";
    const score = minimax(position, false, 0);
    position[i] = "";

    if (score > bestScore) {
      bestScore = score;
      bestMoves = [i];
    } else if (score === bestScore) {
      bestMoves.push(i);
    }
  }

  if (bestMoves.length === 0) return -1;

  // Random choice between equally good moves keeps play varied.
  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}

function startNewRound() {
  board = Array(9).fill("");
  currentPlayer = "X";
  gameOver = false;
  computerThinking = false;

  updateNames();
  renderBoard();

  if (modeSelect.value === "computer") {
    setStatus("Your turn — choose a square!", "X");
    tipText.textContent = "Tip: Take the center or a corner to start strong.";
  } else {
    setStatus("Player X goes first.", "X");
    tipText.textContent = "Take turns placing X and O. Get three in a row to win.";
  }
}

cells.forEach((cell) => {
  cell.addEventListener("click", () => {
    playMove(Number(cell.dataset.index));
  });
});

newGameButton.addEventListener("click", startNewRound);

modeSelect.addEventListener("change", startNewRound);

resetScoresButton.addEventListener("click", () => {
  scores.X = 0;
  scores.O = 0;
  scores.draws = 0;

  updateScores();
  startNewRound();
  setStatus("Scores reset. Ready to play!", "X");
});

updateScores();
startNewRound();
    
