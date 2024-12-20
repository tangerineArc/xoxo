"use strict";

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


const bots = (function(game) {

    function tangerine(board, humanMark, botMark) {
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

    function lemon(board) {
        const emptyCells = _getEmptyCells(board);
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

    function _minimax(board, currentPlayerMark, humanMark, botMark) {
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
                let score = _minimax(board, humanMark, humanMark, botMark);
                board[cell[0]][cell[1]] = "_";
                bestScore = Math.max(score, bestScore);
            }
            return bestScore;
        } else {
            let bestScore = Infinity;
            for (let cell of emptyCells) {
                board[cell[0]][cell[1]] = currentPlayerMark;
                let score = _minimax(board, botMark, humanMark, botMark);
                board[cell[0]][cell[1]] = "_";
                bestScore = Math.min(score, bestScore);
            }
            return bestScore;
        }
    }

    return {lemon, tangerine};

})(game);


(function(game, bots, gameMode) {

    const BOT_DISTRO = 0.5;
    const BOT_MODE_INSTRUCTION = `choose either <span>X</span> or <span>O</span> to start playing <br> <span>X</span> plays first`;
    const HUMAN_WIN_MESSAGE = "You have beaten the bot! <br> click <span>reset</span> to start over";
    const BOT_WIN_MESSAGE = "The AI overlord has taken over! <br> click <span>reset</span> to start over";
    const DRAW_MESSAGE = "It's a tie! <br> click <span>reset</span> to start over";

    const cells = document.querySelectorAll(".arena > div");
    const resetButton = document.querySelector(".global-settings > button");
    const [xTag, oTag] = document.querySelectorAll(".player-settings > div");
    const modeSelectors = document.querySelectorAll(".mode-settings > div");
    const markSelectors = [xTag, oTag];
    const gameTip = document.querySelector(".game-tip");

    let botMark = null;
    let humanMark = null;

    game.initializeBoard();

    cells.forEach(cell => {
        cell.addEventListener("click", registerMove);
    });

    resetButton.addEventListener("click", event => {
        resetDisplay(event);

        if (gameMode === "bot") {
            gameTip.innerHTML = BOT_MODE_INSTRUCTION;
            gameTip.style.visibility = "visible";
        }
    });

    modeSelectors.forEach(selector => {
        selector.addEventListener("click", setGameMode);
    });

    markSelectors.forEach(selector => {
        selector.addEventListener("click", setHumanMark);
    });

    function setHumanMark(event) {
        if (gameMode === "manual") return;
        if (event.currentTarget.className === "selected-player") return;

        resetDisplay();
        humanMark = event.currentTarget.textContent;
        botMark = humanMark === "x" ? "o" : "x";

        markSelectors.forEach(selector => {
            selector.className = "";
        });
        event.currentTarget.className = "selected-player";

        if (botMark === "x") {
            cells[0].click();
        }

        gameTip.innerHTML = "";
        gameTip.style.visibility = "hidden";
    }

    function setGameMode(event) {
        if (event.currentTarget.className === "selected-mode") return;

        resetDisplay();
        gameMode = event.currentTarget.dataset.mode;

        modeSelectors.forEach(selector => {
            selector.className = "";
        });

        event.currentTarget.className = "selected-mode";

        markSelectors.forEach(selector => {
            selector.className = "";
        });

        if (gameMode === "bot") {
            gameTip.innerHTML = BOT_MODE_INSTRUCTION;
            gameTip.style.visibility = "visible";
        } else {
            gameTip.innerHTML = "";
            gameTip.style.visibility = "hidden";
            changeTag();
        }
    }

    function resetDisplay(event) {
        game.initializeBoard();
        cells.forEach(cell => {
            cell.textContent = "";
            cell.className = ""; // remove styling
            cell.style.fontWeight = "bold";
            cell.addEventListener("click", registerMove);
        });

        if (gameMode === "manual") {
            changeTag();
        } else {
            markSelectors.forEach(selector => {
                selector.className = "";
            });

            botMark = null;
            humanMark = null;
        }

        gameTip.innerHTML = "";
        gameTip.style.visibility = "hidden";
    }

    function registerMove(event) {
        if (gameMode === "bot" && (!humanMark || !botMark)) return;

        const currentPlayer = game.getCurrentPlayer();

        let position;
        if (gameMode === "manual" || currentPlayer.mark === humanMark) {
            position = event.currentTarget.dataset.position
                .split("")
                .map(pos => Number(pos));
        } else {
            position = Math.random() < BOT_DISTRO ?
                bots.lemon(game.getBoard()) :
                bots.tangerine(game.getBoard(), humanMark, botMark);
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
                showGameOverState(winPositions.map(pos => pos.join("")), winner);
                return;
            } else {
                // console.log("draw");
                gameTip.innerHTML = DRAW_MESSAGE;
                gameTip.style.visibility = "visible";
            }
        }

        if (gameMode === "manual") {
            changeTag();
        }

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

    function showGameOverState(positions, winner) {
        const winCells = Array
            .from(cells)
            .filter(cell => positions.includes(cell.dataset.position));

        winCells.forEach(cell => {
            cell.className = "win-pos";
            cell.style.fontWeight = "normal";
        });

        if (gameMode === "bot" && winner.mark === humanMark) {
            gameTip.innerHTML = HUMAN_WIN_MESSAGE;
        } else if (gameMode === "bot") {
            gameTip.innerHTML = BOT_WIN_MESSAGE;
        }

        if (gameMode === "manual") {
            gameTip.innerHTML = `Player <span>${winner.mark.toUpperCase()}</span> wins! <br> click <span>reset</span> to start over`;
        }

        gameTip.style.visibility = "visible";
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

})(game, bots, "manual");
