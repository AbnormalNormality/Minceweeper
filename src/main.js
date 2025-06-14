class Minesweeper {
  grid = [];

  constructor() {}

  /**
   * @param {number} rows
   * @param {number} columns
   */
  generateGrid(rows, columns) {
    this.grid = [];

    for (let r = 0; r < rows; r++) {
      this.grid[r] = [];
      for (let c = 0; c < columns; c++) {
        this.grid[r][c] = { mine: false, revealed: false, marked: false };
      }
    }
  }

  /**
   * @returns {[number, number]} Size of the grid as [rows, columns]
   */
  getGridSize() {
    return [this.grid.length, this.grid[0].length];
  }

  /**
   * @param {number} [mines=1]
   */
  placeMines(mines = 1) {
    if (mines <= 0) return;
    const [rows, cols] = this.getGridSize();

    const freeTiles = [];
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        if (!this.grid[r][c].mine && !this.revealed) freeTiles.push([r, c]);

    for (let i = freeTiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [freeTiles[i], freeTiles[j]] = [freeTiles[j], freeTiles[i]];
    }

    let placed = 0;
    while (placed < mines && freeTiles.length > 0) {
      const [r, c] = freeTiles.pop();
      this.getTile(r, c).mine = true;
      placed++;
    }
  }

  /**
   * @param {number} row
   * @param {number} column
   * @param {boolean} allowDiagonals
   * @returns {Array<[number, number]>} Array of surrounding tile coordinates
   */
  getSurroundingTiles(row, column, allowDiagonals = true) {
    const [rows, cols] = this.getGridSize();
    const results = [];

    for (let ir = -1; ir <= 1; ir++) {
      for (let ic = -1; ic <= 1; ic++) {
        if (ir === 0 && ic === 0) continue;

        if (!allowDiagonals && ir !== 0 && ic !== 0) continue;

        const cr = row + ir;
        const cc = column + ic;

        if (cr >= 0 && cr < rows && cc >= 0 && cc < cols) {
          results.push([cr, cc]);
        }
      }
    }

    return results;
  }

  /**
   * @param {number} row
   * @param {number} column
   * @returns {Array<[number, number]>} Array of surounding tile coordinates
   */
  getSurroundingMines(row, column) {
    return this.getSurroundingTiles(row, column).filter(
      ([r, c]) => this.getTile(r, c).mine
    );
  }

  /**
   * @param {number} row
   * @param {number} column
   * @param {boolean} [mark=false]
   * @returns {boolean} Is the game over?
   */
  guessTile(row, column, mark = false) {
    const tile = this.getTile(row, column);

    if (mark || tile.marked) {
      tile.marked = !tile.marked;
      return this.checkWin();
    }

    if (tile.mine && this.isGridEmpty()) {
      tile.mine = false;
      tile.revealed = true;
      this.placeMines(1);
      this.revealSafeTilesFrom(row, column);
      return this.checkWin();
    }

    if (tile.revealed) {
      if (tile.mine) return this.checkWin();

      const neighbours = this.getSurroundingTiles(row, column);
      let marks = 0;

      for (const [r, c] of neighbours) {
        const t = this.getTile(r, c);
        if (t.marked || (t.mine && t.revealed)) marks++;
      }

      const surroundingMineCount = this.getSurroundingMines(row, column).length;

      if (marks === surroundingMineCount) {
        for (const [r, c] of neighbours) {
          const t = this.getTile(r, c);
          if (!t.marked && !t.revealed) {
            t.revealed = true;
            if (!t.mine) {
              this.revealSafeTilesFrom(r, c);
            }
          }
        }
      }
    } else if (tile.mine) {
      tile.revealed = true;
    } else {
      this.revealSafeTilesFrom(row, column);
    }

    return this.checkWin();
  }

  /**
   * @param {number} row
   * @param {number} column
   * @returns {object} The tile object at the given coordinates.
   */
  getTile(row, column) {
    return this.grid[row][column];
  }

  /**
   * @returns {[boolean, boolean]} [gameOver, playerWon]
   */
  checkWin() {
    let totalMines = 0;
    let markedMines = 0;
    let markedTiles = 0;
    let correctlyRevealed = 0;
    let totalTiles = 0;

    for (const row of this.grid) {
      for (const tile of row) {
        totalTiles++;

        if (tile.revealed && tile.mine) return [true, false]; // Stepped on a mine

        if (tile.revealed && !tile.mine) correctlyRevealed++;
        if (tile.marked) markedTiles++;
        if (tile.mine) {
          totalMines++;
          if (tile.marked) markedMines++;
        }
      }
    }

    const allMinesMarked =
      markedMines === totalMines && markedTiles === totalMines;
    const allSafeRevealed = correctlyRevealed === totalTiles - totalMines;

    if (allMinesMarked || allSafeRevealed) return [true, true];

    return [false, false];
  }

  /**
   * @param {number} row
   * @param {number} column
   */
  revealSafeTilesFrom(row, column) {
    const toCheck = [[row, column]];
    const visited = new Set();

    while (toCheck.length) {
      const coords = toCheck.pop();
      const key = coords.join(",");

      if (visited.has(key)) continue;
      visited.add(key);

      const tile = this.getTile(...coords);
      if (tile.mine) continue;
      if (tile.marked) continue;
      tile.revealed = true;

      const nearbyMines = this.getSurroundingMines(...coords).length;
      if (nearbyMines === 0) {
        const neighbours = this.getSurroundingTiles(...coords);
        toCheck.push(...neighbours);
      }
    }
  }

  /**
   * @returns {boolean} Is the grid unrevealed?
   */
  isGridEmpty() {
    for (const row of this.grid) {
      for (const tile of row) {
        if (tile.revealed) return false;
      }
    }
    return true;
  }
}

function displayGrid(itsJoever = false) {
  if (!gridDiv) return;
  gridDiv.innerHTML = "";

  const [rows, cols] = ms.getGridSize();

  gridDiv.style.setProperty("--rows", rows);
  gridDiv.style.setProperty("--columns", cols);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tile = ms.grid[r][c];
      const tileDiv = document.createElement("div");
      tileDiv.className = "tile";

      tileDiv.style.gridRow = r + 1;
      tileDiv.style.gridColumn = c + 1;

      if (r !== rows - 1) tileDiv.style.borderBottom = "var(--border)";
      if (c !== cols - 1) tileDiv.style.borderRight = "var(--border)";

      const tileText = document.createElement("div");

      let newColour = "var(--grid-colour)";
      let newText = "❓";

      if (
        tile.revealed ||
        (itsJoever && tile.mine && !tile.marked) ||
        (itsJoever && !tile.mine && tile.marked)
      ) {
        newColour = tile.mine ? "var(--mine-colour)" : "var(--safe-colour)";
        tileDiv.style.cursor = "default";

        if (tile.mine) {
          newText = "💣";
        } else {
          const mines = ms.getSurroundingMines(r, c);
          if (mines.length) newText = mines.length;
          else newText = "";
        }
      } else if (tile.marked) {
        newColour = "var(--marked-colour)";
        newText = "🚩";
      }

      const key = `${r},${c}`;
      const oldColour = oldColoursMap[key] || "var(--grid-colour)";

      tileDiv.style.setProperty("--tile-colour", oldColour);

      requestAnimationFrame(() => {
        tileDiv.style.setProperty("--tile-colour", newColour);
        tileText.textContent = newText;
        oldColoursMap[key] = newColour;
      });

      if (!itsJoever) {
        tileDiv.onclick = () => {
          const isGameOver = ms.guessTile(r, c);
          displayGrid();
          if (isGameOver[0]) gameOver(isGameOver[1]);
        };

        tileDiv.addEventListener("contextmenu", (event) => {
          event.preventDefault();
          const isGameOver = ms.guessTile(r, c, true);
          displayGrid();
          if (isGameOver[0]) gameOver(isGameOver[1]);
        });
      }

      if (itsJoever) tileDiv.classList.add("disabled");

      tileDiv.appendChild(tileText);
      gridDiv.appendChild(tileDiv);
    }
  }
}

function gameOver(win) {
  displayGrid(true);

  if (win) console.log("You win!");
  else console.log("You lose!");
}

function generateGrid() {
  const rows = parseInt(rowsInput.value, 10);
  const cols = parseInt(colsInput.value, 10);
  const mineDensity = Math.max(1, Math.min(99, parseFloat(minesInput.value)));

  const totalTiles = rows * cols;
  const maxMines = totalTiles - 1;
  const mineCount = Math.max(
    1,
    Math.min(Math.round((totalTiles * mineDensity) / 100), maxMines)
  );

  ms.generateGrid(rows, cols);
  ms.placeMines(mineCount);
}

ms = new Minesweeper();

let gridDiv = null;
let rowsInput = null;
let colsInput = null;
let minesInput = null;
let startButton = null;

let oldColoursMap = {};

document.addEventListener("DOMContentLoaded", () => {
  gridDiv = document.getElementById("grid");
  rowsInput = document.getElementById("rows");
  colsInput = document.getElementById("cols");
  minesInput = document.getElementById("mines");
  startButton = document.getElementById("start");

  startButton.onclick = () => {
    generateGrid();
    displayGrid();
  };

  generateGrid();
  displayGrid();
});
