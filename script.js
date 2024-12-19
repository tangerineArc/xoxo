// const gameMode = "manual";
const gameMode = "bot";

const game = (function(p1Mark, p2Mark, gameMode) {

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

    function updateGameState(position) {
        if (_board[position[0]][position[1]] !== "_") {
            return false;
        }

        _board[position[0]][position[1]] = _currentPlayer.mark;

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

    function _getBoardState() {
        const rows = [[], [], []];
        const columns = [[], [], []];
        const diagonals = [[], []];
        let numBlanks = 0;

        for (let i = 0; i < 3; i ++) {
            for (let j = 0; j < 3; j ++) {
                const position = [i, j];
                const mark = _board[i][j];

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

    function getRunningState() {
        const [boardState, numBlanks] = _getBoardState();

        for (let orientation of boardState) { // [rows, columns, diagonals]
            for (let dimension of orientation) {
                const entry = dimension.map(item => item[0]);
                const positions = dimension.map(item => item[1]);

                if (entry.includes("_")) continue;
                if (!entry.includes(player1.mark)) return [false, player2, positions];
                if (!entry.includes(player2.mark)) return [false, player1, positions];
            }
        }

        if (numBlanks === 0) {
            // [isRunning, winner, winPositions]
            return [false, null, null]; // game draw
        }

        return [true, null, null]; // game is not over i.e. running
    }

    return {initializeBoard, updateGameState, getCurrentPlayer, getBoard, getRunningState};

})("x", "o", gameMode);


const bots = (function(game, humanMark, botMark) {

    // two bots: random-bot, intelligent-bot
    /* 
        dependencies: 
            currentBoardState: array (2d)
            humanMark: string ("x")
            botMark: string("o")
            checkWinStatus: func

     */

    function tangerineBot() {

    }

    function lemon() {
        const board = game.getBoard();
        const emptyCells = _getEmptyCells(board);

        const idx = Math.floor(Math.random() * emptyCells.length);
        // console.log(emptyCells[idx]);
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

    return {lemon};

})(game, "x", "o");


const display = (function(game, bots, gameMode) {

    const cells = document.querySelectorAll(".arena > div");
    const resetButton = document.querySelector(".global-settings > button");
    const [xTag, oTag] = document.querySelectorAll(".player-settings > div");

    game.initializeBoard();

    cells.forEach(cell => {
        cell.addEventListener("click", registerMove);
    });

    resetButton.addEventListener("click", resetDisplay);

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
            position = bots.lemon();
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