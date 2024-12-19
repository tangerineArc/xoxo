// const gameMode = "manual";
const gameMode = "bot";

const game = (function(p1Mark, p2Mark) {

    function _createPlayer(mark) {
        return {mark};
    }

    const player1 = _createPlayer(p1Mark);
    const player2 = _createPlayer(p2Mark);

    const _board = [];
    let _currentPlayer = structuredClone(player1);

    function initializeBoard() {
        _board.length = 0;
        _currentPlayer = structuredClone(player1);

        for (let i = 0; i < 3; i ++) {
            _board.push(["_", "_", "_"]);
        }
    }

    function updateGameState(position, board = _board) {
        if (board[position[0]][position[1]] !== "_") {
            return false;
        }

        board[position[0]][position[1]] = _currentPlayer.mark;

        if (_currentPlayer.mark === player1.mark) {
            _currentPlayer = structuredClone(player2);
        } else {
            _currentPlayer = structuredClone(player1);
        }

        return true;
    }

    function getCurrentPlayer() {
        return structuredClone(_currentPlayer);
    }

    function getBoard() {
        return structuredClone(_board);
    }

    function _getBoardState(board = _board) {
        const rows = [[], [], []];
        const columns = [[], [], []];
        const diagonals = [[], []];

        let numBlanks = 0;

        for (let i = 0; i < 3; i ++) {
            for (let j = 0; j < 3; j ++) {
                const position = [i, j];
                const mark = board[i][j];

                rows[i].push([mark, position]);
                columns[j].push([mark, position]);
                if (i === j) {
                    diagonals[0].push([mark, position]); // primary diagonal
                }
                if (i + j === 2) {
                    diagonals[1].push([mark, position]); // secondary diagonal
                }
                if (mark === "_") {
                    numBlanks ++;
                }
            }
        }

        return [[rows, columns, diagonals], numBlanks];
    }

    function getRunningState(board = _board) {
        const [boardState, numBlanks] = _getBoardState(board);

        for (let orientation of boardState) { // [rows, columns, diagonals]
            for (let dimension of orientation) {
                const entry = dimension.map(item => item[0]);
                const positions = dimension.map(item => item[1]);

                if (entry.includes("_")) continue;
                if (!entry.includes(player1.mark)) return [false, structuredClone(player2), positions];
                if (!entry.includes(player2.mark)) return [false, structuredClone(player1), positions];
            }
        }

        if (numBlanks === 0) {
            // [isRunning, winner, winPositions]
            return [false, null, null]; // game draw
        }

        return [true, null, null]; // game is not over i.e. running
    }

    return {initializeBoard, updateGameState, getCurrentPlayer, getBoard, getRunningState};

})("x", "o");


const bots = (function(game, humanMark, botMark) {

    function tangerine(board) {        
        const emptyCells = _getEmptyCells(board);
        const cellScoreMap = {"0": [], "1": [], "-1": []};

        for (let cell of emptyCells) {
            board[cell[0]][cell[1]] = botMark;
            const score = _minimax(board, humanMark);
            board[cell[0]][cell[1]] = botMark;

            if (score === 0) {
                cellScoreMap["0"].push(cell);
            } else if (score === 1) {
                cellScoreMap["1"].push(cell);
            } else if (score === -1) {
                cellScoreMap["-1"].push(cell);
            }
        }

        console.log(cellScoreMap);

        const zeroLength = cellScoreMap["0"].length;
        const winLength = cellScoreMap["1"].length;
        const loseLength = cellScoreMap["-1"].length;
        
        if (winLength !== 0) {
            return cellScoreMap["1"][Math.floor(Math.random() * winLength)];
        }
        if (zeroLength !== 0) {
            return cellScoreMap["0"][Math.floor(Math.random() * zeroLength)];
        }
        return cellScoreMap["-1"][Math.floor(Math.random() * loseLength)];
    }

    function lemon() {
        const emptyCells = _getEmptyCells(game.getBoard());
        const idx = Math.floor(Math.random() * emptyCells.length);
        
        if (emptyCells.length !== 0) return emptyCells[idx];
        return null;
    }

    function _getEmptyCells(board) {
        const emptyCells = [];
        for (let i = 0; i < 3; i ++) {
            for (let j = 0; j < 3; j ++) {
                if (board[i][j] === "_") {
                    emptyCells.push([i, j]);
                }
            }
        }

        return structuredClone(emptyCells);
    }

    function _minimax(board, currentPlayerMark) {
        const [isRunning, winner, ] = game.getRunningState(board);
        if (winner && winner.mark === humanMark) {
            return -1;
        } else if (winner && winner.mark === botMark) {
            return 1;
        } else if (!isRunning) {
            return 0;
        }

        const emptyCells = _getEmptyCells(board);

        if (currentPlayerMark === botMark) {
            let bestScore = -Infinity;
            for (let cell of emptyCells) {
                board[cell[0]][cell[1]] = currentPlayerMark;
                let score = _minimax(board, humanMark);
                board[cell[0]][cell[1]] = "_";
                bestScore = Math.max(score, bestScore);
            }
            return bestScore;
        } else {
            let bestScore = Infinity;
            for (let cell of emptyCells) {
                board[cell[0]][cell[1]] = currentPlayerMark;
                let score = _minimax(board, botMark);
                board[cell[0]][cell[1]] = "_";
                bestScore = Math.min(score, bestScore);
            }
            return bestScore;
        }
    }

    return {lemon, tangerine};

})(game, "x", "o");


const display = (function(game, bots, gameMode) {

    const cells = document.querySelectorAll(".arena > div");
    const resetButton = document.querySelector(".global-settings > button");
    const [xTag, oTag] = document.querySelectorAll(".player-settings > div");
    const modeSelectors = document.querySelectorAll(".mode-settings > div");

    game.initializeBoard();

    cells.forEach(cell => {
        cell.addEventListener("click", registerMove);
    });

    resetButton.addEventListener("click", resetDisplay);

    modeSelectors.forEach(selector => {
        selector.addEventListener("click", setGameMode);
    });

    // function setGameMode(event) {
    //     resetDisplay();
    //     if (event.currentTarget)
    // }

    function resetDisplay(event) {
        game.initializeBoard();
        cells.forEach(cell => {
            cell.textContent = "";
            cell.className = ""; // remove styling
            cell.style.fontWeight = "bold";
            cell.addEventListener("click", registerMove);
        });
        
        changeTag();
    }

    function registerMove(event) {
        const currentPlayer = game.getCurrentPlayer();

        let position;
        if (gameMode === "manual" || currentPlayer.mark === "x") {
            position = event.currentTarget.dataset.position
                .split("")
                .map(pos => Number(pos));
        } else {
            // position = bots.lemon();
            position = bots.tangerine(game.getBoard());
        }

        if (position === null) return;
        
        if (game.updateGameState(position)) {
            updateDisplay(position, currentPlayer.mark);
        }

        const [isGameRunning, winner, winPositions] = game.getRunningState();

        if (!isGameRunning) {
            cells.forEach(cell => {
                cell.removeEventListener("click", registerMove);
            });

            if (winner) {
                showGameOverState(winPositions.map(pos => pos.join("")));
                return;
            } else {
                console.log("draw");
            }
        }

        changeTag();

        if (gameMode === "bot") {
            event.currentTarget.click();
        }
    }

    function updateDisplay(position, mark) {
        position = position.join("");
        const cell = Array
            .from(cells)
            .filter(cell => cell.dataset.position === position)[0];
        cell.textContent = mark;
    }

    function showGameOverState(positions) {
        const winCells = Array
            .from(cells)
            .filter(cell => positions.includes(cell.dataset.position));
        
        winCells.forEach(cell => {
            cell.className = "win-pos";
            cell.style.fontWeight = "normal";
        });
    }

    function changeTag() {
        const currentPlayer = game.getCurrentPlayer();
        if (currentPlayer.mark === "x") {
            xTag.className = "selected-player";
            oTag.className = "";
        } else {
            xTag.className = "";
            oTag.className = "selected-player";
        }
    }

})(game, bots, gameMode);