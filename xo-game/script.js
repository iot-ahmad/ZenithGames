const boardElement = document.getElementById("board");
const statusElement = document.getElementById("status");
const resetButton = document.getElementById("reset-btn");

const winLines = [
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

function renderBoard() {
  boardElement.innerHTML = "";
  board.forEach((value, index) => {
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "cell";
    cell.textContent = value;
    cell.disabled = value !== "" || gameOver;
    cell.addEventListener("click", () => playMove(index));
    boardElement.appendChild(cell);
  });
}

function getWinner() {
  for (const [a, b, c] of winLines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return "";
}

function playMove(index) {
  if (board[index] || gameOver) return;
  board[index] = currentPlayer;

  const winner = getWinner();
  if (winner) {
    statusElement.textContent = `الفائز: ${winner}`;
    gameOver = true;
  } else if (!board.includes("")) {
    statusElement.textContent = "تعادل!";
    gameOver = true;
  } else {
    currentPlayer = currentPlayer === "X" ? "O" : "X";
    statusElement.textContent = `الدور: ${currentPlayer}`;
  }

  renderBoard();
}

function resetGame() {
  board = Array(9).fill("");
  currentPlayer = "X";
  gameOver = false;
  statusElement.textContent = "الدور: X";
  renderBoard();
}

resetButton.addEventListener("click", resetGame);
renderBoard();
