const p1Mark = "x";
const gameMode = "manual";

const game = (function(p1Mark, gameMode) {
    function _createPlayer(mark) {
        return {mark};
    }

    const player1 = _createPlayer(p1Mark);
    const player2 = _createPlayer(p1Mark === "x" ? "o" : "x");

    const _board = [];
    let _currentPlayer = structuredClone(player1);

    function initializeBoard() {
        for (let i = 0; i < 3; i ++) {
            _board.push(["_", "_", "_"]);
        }
    }

    function updateGameState(position) {
        if (_board[position[0]][position[1]] !== "_") {
            return false;
        }

        _board[position[0]][position[1]] = _currentPlayer.mark;
        console.log(structuredClone(_board));

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

    function _getBoardState() {
        const rows = [[], [], []];
        const columns = [[], [], []];
        const diagonals = [[], []];

        for (let i = 0; i < 3; i ++) {
            for (let j = 0; j < 3; j ++) {
                rows[i].push(_board[i][j]);
                columns[j].push(_board[i][j]);
                if (i === j) diagonals[0].push(_board[i][j]); // primary diagonal
                if (i + j === 2) diagonals[1].push(_board[i][j]); // secondary diagonal
            }
        }

        return [rows, columns, diagonals];
    }

    function getRunningState() {
        const boardState = _getBoardState();

        for (let dimension of boardState) { // [rows, columns, diagonals]
            for (let entry of dimension) {
                if (entry.includes("_")) continue;
                if (!entry.includes(player1.mark)) return [false, player2];
                if (!entry.includes(player2.mark)) return [false, player1];
            }
        }

        return [true, null]; // game is not over i.e. running
    }

    return {initializeBoard, updateGameState, getCurrentPlayer, getRunningState};
})(p1Mark, gameMode);

game.initializeBoard();

const display = (function() {
    const arena = document.querySelector(".arena");
    const cells = document.querySelectorAll(".arena > div");

    cells.forEach(cell => {
        cell.addEventListener("click", registerMove);
    });

    function registerMove(event) {
        if (!game.getRunningState()[0]) {
            return;
        }

        const position = event.currentTarget.dataset.position
            .split("")
            .map(pos => Number(pos));

        const currentPlayer = game.getCurrentPlayer();
        
        if(game.updateGameState(position)) {
            updateDisplay(position, currentPlayer.mark);
        }
    }

    function updateDisplay(position, mark) {
        position = position.join("");
        const cell = Array.from(cells)
            .filter(cell => cell.dataset.position === position)[0];
        cell.textContent = mark;
    }
})();

/* 

  0 1 2
0 _ _ _
1 _ _ _
2 _ _ _

 */