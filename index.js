class TicTacToe {
    constructor() {
        this.gridSize = 10;
        this.winCondition = 5;
        this.currentPlayer = 'X';
        this.board = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(''));
        this.gameActive = true;
        this.moveHistory = [];
        this.moveCount = 0;
        
        this.initializeGame();
        this.loadGameState();
    }
    
    initializeGame() {
        this.createBoard();
        this.bindEvents();
        this.updateDisplay();
    }
    
    createBoard() {
        const gameBoard = document.getElementById('game-board');
        gameBoard.innerHTML = '';
        
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = document.createElement('button');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.addEventListener('click', () => this.handleCellClick(row, col));
                gameBoard.appendChild(cell);
            }
        }
    }
    
    bindEvents() {
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('undo-btn').addEventListener('click', () => this.undoMove());
    }
    
    handleCellClick(row, col) {
        if (!this.gameActive || this.board[row][col] !== '') {
            return;
        }
        
        this.makeMove(row, col);
    }
    
    makeMove(row, col) {
        // Store move in history
        this.moveHistory.push({
            row,
            col,
            player: this.currentPlayer,
            moveNumber: this.moveCount
        });
        
        // Update board
        this.board[row][col] = this.currentPlayer;
        this.moveCount++;
        
        // Update cell display
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        cell.textContent = this.currentPlayer;
        cell.classList.add('occupied', this.currentPlayer.toLowerCase());
        
        // Check for win
        const winResult = this.checkWin(row, col);
        if (winResult.isWin) {
            this.handleWin(winResult.winningCells);
            return;
        }
        
        // Check for draw
        if (this.moveCount === this.gridSize * this.gridSize) {
            this.handleDraw();
            return;
        }
        
        // Switch player
        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        this.updateDisplay();
        this.saveGameState();
    }
    
    checkWin(row, col) {
        const directions = [
            [0, 1],   // horizontal
            [1, 0],   // vertical
            [1, 1],   // diagonal \
            [1, -1]   // diagonal /
        ];
        
        const player = this.board[row][col];
        
        for (const [dx, dy] of directions) {
            const winningCells = [[row, col]];
            
            // Check in positive direction
            let r = row + dx;
            let c = col + dy;
            while (r >= 0 && r < this.gridSize && c >= 0 && c < this.gridSize && 
                   this.board[r][c] === player) {
                winningCells.push([r, c]);
                r += dx;
                c += dy;
            }
            
            // Check in negative direction
            r = row - dx;
            c = col - dy;
            while (r >= 0 && r < this.gridSize && c >= 0 && c < this.gridSize && 
                   this.board[r][c] === player) {
                winningCells.push([r, c]);
                r -= dx;
                c -= dy;
            }
            
            if (winningCells.length >= this.winCondition) {
                return { isWin: true, winningCells };
            }
        }
        
        return { isWin: false, winningCells: [] };
    }
    
    handleWin(winningCells) {
        this.gameActive = false;
        
        // Highlight winning cells
        winningCells.forEach(([row, col]) => {
            const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            cell.classList.add('winning');
        });
        
        document.getElementById('game-status').textContent = `Player ${this.currentPlayer} wins!`;
        document.getElementById('game-status').style.color = '#e74c3c';
        this.saveGameState();
    }
    
    handleDraw() {
        this.gameActive = false;
        document.getElementById('game-status').textContent = "It's a draw!";
        document.getElementById('game-status').style.color = '#f39c12';
        this.saveGameState();
    }
    
    undoMove() {
        if (this.moveHistory.length === 0 || !this.gameActive) {
            return;
        }
        
        const lastMove = this.moveHistory.pop();
        const { row, col, player } = lastMove;
        
        // Clear the cell
        this.board[row][col] = '';
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        cell.textContent = '';
        cell.classList.remove('occupied', 'x', 'o', 'winning');
        
        // Update game state
        this.moveCount--;
        this.currentPlayer = player; // Set back to the player who made the last move
        this.gameActive = true;
        
        // Clear any win highlights
        document.querySelectorAll('.winning').forEach(cell => {
            cell.classList.remove('winning');
        });
        
        this.updateDisplay();
        this.saveGameState();
    }
    
    restartGame() {
        this.board = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(''));
        this.currentPlayer = 'X';
        this.gameActive = true;
        this.moveHistory = [];
        this.moveCount = 0;
        
        // Clear all cells
        document.querySelectorAll('.cell').forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('occupied', 'x', 'o', 'winning');
        });
        
        this.updateDisplay();
        this.saveGameState();
    }
    
    updateDisplay() {
        document.getElementById('current-player').textContent = this.currentPlayer;
        document.getElementById('move-count').textContent = this.moveCount;
        
        // Update game status
        if (this.gameActive) {
            document.getElementById('game-status').textContent = 'Game in progress';
            document.getElementById('game-status').style.color = '#27ae60';
        }
        
        // Update undo button state
        const undoBtn = document.getElementById('undo-btn');
        undoBtn.disabled = this.moveHistory.length === 0 || !this.gameActive;
    }
    
    saveGameState() {
        const gameState = {
            board: this.board,
            currentPlayer: this.currentPlayer,
            gameActive: this.gameActive,
            moveHistory: this.moveHistory,
            moveCount: this.moveCount,
            timestamp: Date.now()
        };
        
        localStorage.setItem('ticTacToeGame', JSON.stringify(gameState));
    }
    
    loadGameState() {
        const savedState = localStorage.getItem('ticTacToeGame');
        if (!savedState) {
            return;
        }
        
        try {
            const gameState = JSON.parse(savedState);
            
            // Check if the saved game is not too old (optional, 7 days)
            const sevenDays = 7 * 24 * 60 * 60 * 1000;
            if (Date.now() - gameState.timestamp > sevenDays) {
                localStorage.removeItem('ticTacToeGame');
                return;
            }
            
            this.board = gameState.board;
            this.currentPlayer = gameState.currentPlayer;
            this.gameActive = gameState.gameActive;
            this.moveHistory = gameState.moveHistory || [];
            this.moveCount = gameState.moveCount || 0;
            
            // Restore board display
            for (let row = 0; row < this.gridSize; row++) {
                for (let col = 0; col < this.gridSize; col++) {
                    const cellValue = this.board[row][col];
                    if (cellValue !== '') {
                        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                        cell.textContent = cellValue;
                        cell.classList.add('occupied', cellValue.toLowerCase());
                    }
                }
            }
            
            // Check if there's a win condition in the loaded state
            if (!this.gameActive) {
                // Re-check the last move for win highlighting
                if (this.moveHistory.length > 0) {
                    const lastMove = this.moveHistory[this.moveHistory.length - 1];
                    const winResult = this.checkWin(lastMove.row, lastMove.col);
                    if (winResult.isWin) {
                        this.handleWin(winResult.winningCells);
                    }
                }
            }
            
            this.updateDisplay();
        } catch (error) {
            console.error('Error loading game state:', error);
            localStorage.removeItem('ticTacToeGame');
        }
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new TicTacToe();
});