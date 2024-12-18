function createPlayer(name, mark) {
    return {name, mark};
}

const player1 = createPlayer("chiku", "x");
const player2 = createPlayer("miku", "o");

// console.log(player1);
// console.log(player2);

function createGameBoard() {
    const board = [["_", "_", "_"], ["_", "_", "_"], ["_", "_", "_"]];
    return board;
}

const board = createGameBoard();

console.log(board);

function updateGameBoard(mark, position) {
    board[position[0]][position[1]] = mark;
    // return board;
}

updateGameBoard("x", [0, 1]);
console.log(board);

function checkGameOverStatus() {
    board.forEach(row => {
        if (!row.includes("_")) return true;
    });

    const row0 = []; const row1 = []; const row2 = [];
    const col0 = []; const col1 = []; const col2 = [];
    const primaryDiag = []; const secondaryDiag = [];

    for (let i = 0; i < 3; i ++) {
        for (let j = 0; j < 3; j ++) {
            if (i === j) {
                primaryDiag.push(board[i][j]);
            }
            if (i + j === 2) {
                secondaryDiag.push(board[i][j]);
            }
            if (i === 0) {
                row0.push(board[i][j]);
            } else if (i == 1) {
                row1.push(board[i][j]);
            } else if (i == 2) {
                row2.push(board[i][j]);
            }
            if (j === 0) {
                col0.push(board[i][j]);
            } else if (j === 1) {
                col1.push(board[i][j]);
            } else if (j === 2) {
                col2.push(board[i][j]);
            }
        }
    }

    for (let row of [row0, row1, row2, col0, col1, col2, primaryDiag, secondaryDiag]) {
        if (row.includes("_")) {
            continue;
        }
        if (!row.includes("o")) {
            return [true, "x"];
        }
        if (!row.includes("x" )) {
            return [true, "o"];
        }
    }

    return [false, "_"];
}

console.log(checkGameOverStatus());

updateGameBoard(player1.mark, [1, 1]);
console.log(board);
console.log(checkGameOverStatus());


updateGameBoard(player1.mark, [2, 1]);
console.log(board);
console.log(checkGameOverStatus());