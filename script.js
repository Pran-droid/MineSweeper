class MinesweeperGame {
    constructor() {
        this.difficulties = {
            easy: { rows: 9, cols: 9, mines: 10 },
            medium: { rows: 16, cols: 16, mines: 40 },
            hard: { rows: 16, cols: 30, mines: 99 }
        };
        
        this.currentDifficulty = 'easy';
        this.gameMode = null; // 'single' or 'multi'
        this.board = [];
        this.gameState = 'menu'; // menu, setup, playing, gameOver
        this.players = [];
        this.currentPlayerIndex = 0;
        this.round = 1;
        this.minesPlaced = false;
        this.flagCount = 0;
        this.startTime = null;
        this.timer = null;
        
        this.initializeElements();
        this.setupEventListeners();
        this.generateDefaultColors();
    }

    initializeElements() {
        // Mode selection
        this.modeSelection = document.getElementById('mode-selection');
        
        // Setup elements
        this.setupScreen = document.getElementById('setup-screen');
        this.singlePlayerSetup = document.getElementById('single-player-setup');
        this.multiplayerSetup = document.getElementById('multiplayer-setup');
        this.playersListEl = document.getElementById('players-list');
        this.playerNameInput = document.getElementById('player-name-input');
        this.playerColorInput = document.getElementById('player-color-input');
        this.addPlayerBtn = document.getElementById('add-player-btn');
        this.startSingleGameBtn = document.getElementById('start-single-game');
        this.startMultiGameBtn = document.getElementById('start-multi-game');
        this.backToModesBtn = document.getElementById('back-to-modes');

        // Game elements
        this.gameScreen = document.getElementById('game-screen');
        this.singlePlayerInfo = document.getElementById('single-player-info');
        this.multiplayerInfo = document.getElementById('multiplayer-info');
        this.playersInfoEl = document.getElementById('players-info');
        this.currentTurnEl = document.getElementById('current-turn');
        this.singleStatusEl = document.getElementById('single-status');
        this.gameBoard = document.getElementById('game-board');
        this.mineCountEl = document.getElementById('mine-count');
        this.cellsLeftEl = document.getElementById('cells-left');
        this.roundNumberEl = document.getElementById('round-number');
        this.gameStatusEl = document.getElementById('game-status');
        this.newGameBtn = document.getElementById('new-game-btn');
        this.newRoundBtn = document.getElementById('new-round-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.leaderboardEl = document.getElementById('leaderboard-list');
        this.leaderboard = document.getElementById('leaderboard');
        this.roundInfo = document.getElementById('round-info');
        this.modeSpecificHelp = document.getElementById('mode-specific-help');

        // Single player specific elements
        this.spTimeEl = document.getElementById('sp-time');
        this.spFlagsEl = document.getElementById('sp-flags');
        this.spRemainingEl = document.getElementById('sp-remaining');
    }

    generateDefaultColors() {
        this.defaultColors = [
            '#3498db', '#e74c3c', '#2ecc71', '#f39c12',
            '#9b59b6', '#1abc9c', '#34495e', '#e67e22'
        ];
        this.colorIndex = 0;
    }

    setupEventListeners() {
        // Setup screen events
        this.backToModesBtn.addEventListener('click', () => this.backToModes());
        this.addPlayerBtn.addEventListener('click', () => this.addPlayer());
        this.startSingleGameBtn.addEventListener('click', () => this.startGame());
        this.startMultiGameBtn.addEventListener('click', () => this.startGame());
        
        this.playerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addPlayer();
        });

        // Difficulty buttons in setup
        document.querySelectorAll('#setup-difficulty .difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('#setup-difficulty .difficulty-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentDifficulty = e.target.dataset.difficulty;
            });
        });

        // Game screen events
        this.newGameBtn.addEventListener('click', () => this.startNewGame());
        this.newRoundBtn.addEventListener('click', () => this.startNewRound());
        this.resetBtn.addEventListener('click', () => this.backToSetup());
    }

    selectMode(mode) {
        this.gameMode = mode;
        this.modeSelection.classList.add('hidden');
        this.setupScreen.classList.add('active');
        
        if (mode === 'single') {
            this.singlePlayerSetup.style.display = 'block';
            this.multiplayerSetup.style.display = 'none';
            this.modeSpecificHelp.textContent = 'Beat your best time!';
        } else {
            this.singlePlayerSetup.style.display = 'none';
            this.multiplayerSetup.style.display = 'block';
            this.modeSpecificHelp.textContent = 'Take turns and earn points!';
        }
    }

    backToModes() {
        this.modeSelection.classList.remove('hidden');
        this.setupScreen.classList.remove('active');
        this.gameMode = null;
    }

    backToSetup() {
        this.gameScreen.classList.remove('active');
        this.setupScreen.classList.add('active');
        this.stopTimer();
        this.gameState = 'setup';
    }

    addPlayer() {
        const name = this.playerNameInput.value.trim();
        if (!name) return;

        if (this.players.find(p => p.name === name)) {
            alert('Player name already exists!');
            return;
        }

        const color = this.playerColorInput.value;
        const player = {
            name: name,
            color: color,
            score: 0,
            roundScore: 0
        };

        this.players.push(player);
        this.updatePlayersDisplay();
        this.playerNameInput.value = '';
        
        // Set next default color
        this.colorIndex = (this.colorIndex + 1) % this.defaultColors.length;
        this.playerColorInput.value = this.defaultColors[this.colorIndex];

        // Enable start button if we have 2+ players
        this.startMultiGameBtn.disabled = this.players.length < 2;
        this.startMultiGameBtn.textContent = this.players.length < 2 ? 
            `Start Game (Need ${2 - this.players.length} more player${2 - this.players.length > 1 ? 's' : ''})` : 
            'Start Game';
    }

    removePlayer(index) {
        this.players.splice(index, 1);
        this.updatePlayersDisplay();
        this.startMultiGameBtn.disabled = this.players.length < 2;
        this.startMultiGameBtn.textContent = this.players.length < 2 ? 
            `Start Game (Need ${2 - this.players.length} more player${2 - this.players.length > 1 ? 's' : ''})` : 
            'Start Game';
    }

    updatePlayersDisplay() {
        this.playersListEl.innerHTML = '';
        this.players.forEach((player, index) => {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player-input';
            playerDiv.innerHTML = `
                <span style="color: ${player.color}; font-weight: bold;">${player.name}</span>
                <div style="width: 30px; height: 30px; background: ${player.color}; border-radius: 50%;"></div>
                <button class="remove-player" onclick="game.removePlayer(${index})">×</button>
            `;
            this.playersListEl.appendChild(playerDiv);
        });
    }

    startGame() {
        if (this.gameMode === 'multi' && this.players.length < 2) return;
        
        this.gameState = 'playing';
        this.setupScreen.classList.remove('active');
        this.gameScreen.classList.add('active');
        this.currentPlayerIndex = 0;
        this.round = 1;
        this.flagCount = 0;
        
        // Setup UI based on mode
        if (this.gameMode === 'single') {
            this.singlePlayerInfo.style.display = 'block';
            this.multiplayerInfo.style.display = 'none';
            this.leaderboard.style.display = 'none';
            this.newRoundBtn.style.display = 'none';
            this.roundInfo.style.display = 'none';
            this.singleStatusEl.textContent = 'Click any cell to start!';
        } else {
            this.singlePlayerInfo.style.display = 'none';
            this.multiplayerInfo.style.display = 'block';
            this.leaderboard.style.display = 'block';
            this.newRoundBtn.style.display = 'inline-block';
            this.roundInfo.style.display = 'flex';
            
            // Reset scores for new game
            this.players.forEach(player => {
                player.score = 0;
                player.roundScore = 0;
            });
        }
        
        this.createBoard();
        this.updateGameDisplay();
    }

    startNewGame() {
        this.gameState = 'playing';
        this.currentPlayerIndex = 0;
        this.minesPlaced = false;
        this.flagCount = 0;
        this.stopTimer();
        
        if (this.gameMode === 'single') {
            this.singleStatusEl.textContent = 'Click any cell to start!';
        } else {
            // Reset round scores only
            this.players.forEach(player => player.roundScore = 0);
        }
        
        this.createBoard();
        this.updateGameDisplay();
        this.gameStatusEl.textContent = '';
        this.gameStatusEl.className = 'game-status';
    }

    startNewRound() {
        this.round++;
        this.currentPlayerIndex = 0;
        this.minesPlaced = false;
        this.flagCount = 0;
        
        // Reset round scores
        this.players.forEach(player => player.roundScore = 0);
        
        this.createBoard();
        this.updateGameDisplay();
        this.gameStatusEl.textContent = '';
        this.gameStatusEl.className = 'game-status';
    }

    createBoard() {
        const config = this.difficulties[this.currentDifficulty];
        this.board = [];
        this.gameBoard.innerHTML = '';
        this.gameBoard.style.gridTemplateColumns = `repeat(${config.cols}, 1fr)`;
        this.gameBoard.style.display = 'grid';
        this.gameBoard.style.gap = '1px';

        // Initialize board array
        for (let row = 0; row < config.rows; row++) {
            this.board[row] = [];
            for (let col = 0; col < config.cols; col++) {
                this.board[row][col] = {
                    isMine: false,
                    isRevealed: false,
                    isFlagged: false,
                    neighborMines: 0,
                    revealedBy: null
                };
            }
        }

        // Create DOM elements
        for (let row = 0; row < config.rows; row++) {
            for (let col = 0; col < config.cols; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                cell.addEventListener('click', (e) => this.handleCellClick(e, row, col));
                cell.addEventListener('contextmenu', (e) => this.handleRightClick(e, row, col));
                
                this.gameBoard.appendChild(cell);
            }
        }
    }

    placeMines(firstClickRow, firstClickCol) {
        const config = this.difficulties[this.currentDifficulty];
        let minesPlaced = 0;

        while (minesPlaced < config.mines) {
            const row = Math.floor(Math.random() * config.rows);
            const col = Math.floor(Math.random() * config.cols);

            if ((row === firstClickRow && col === firstClickCol) || this.board[row][col].isMine) {
                continue;
            }

            this.board[row][col].isMine = true;
            minesPlaced++;
        }

        this.calculateNeighborMines();
        this.minesPlaced = true;
    }

    calculateNeighborMines() {
        const config = this.difficulties[this.currentDifficulty];
        
        for (let row = 0; row < config.rows; row++) {
            for (let col = 0; col < config.cols; col++) {
                if (!this.board[row][col].isMine) {
                    let count = 0;
                    for (let r = -1; r <= 1; r++) {
                        for (let c = -1; c <= 1; c++) {
                            const newRow = row + r;
                            const newCol = col + c;
                            if (newRow >= 0 && newRow < config.rows && 
                                newCol >= 0 && newCol < config.cols && 
                                this.board[newRow][newCol].isMine) {
                                count++;
                            }
                        }
                    }
                    this.board[row][col].neighborMines = count;
                }
            }
        }
    }

    handleCellClick(e, row, col) {
        e.preventDefault();
        
        if (this.gameState !== 'playing') return;
        if (this.board[row][col].isFlagged || this.board[row][col].isRevealed) return;

        // Place mines on first click and start timer
        if (!this.minesPlaced) {
            this.placeMines(row, col);
            if (this.gameMode === 'single') {
                this.startTimer();
                this.singleStatusEl.textContent = 'Game in progress...';
            }
        }

        if (this.gameMode === 'single') {
            this.handleSinglePlayerClick(row, col);
        } else {
            this.handleMultiPlayerClick(row, col);
        }

        this.updateGameDisplay();
    }

    handleSinglePlayerClick(row, col) {
        if (this.board[row][col].isMine) {
            // Game over
            this.gameState = 'gameOver';
            this.stopTimer();
            this.revealAllMines();
            
            const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            cell.classList.add('exploded');
            
            this.gameStatusEl.textContent = '💥 Game Over! You hit a mine.';
            this.gameStatusEl.className = 'game-status lose';
            this.singleStatusEl.textContent = 'Game Over!';
        } else {
            // Successful reveal
            this.revealCell(row, col);
            
            if (this.checkWin()) {
                this.gameState = 'gameOver';
                this.stopTimer();
                const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
                this.gameStatusEl.textContent = `🎉 Congratulations! You won in ${elapsed} seconds!`;
                this.gameStatusEl.className = 'game-status win';
                this.singleStatusEl.textContent = 'Victory!';
            }
        }
    }

    handleMultiPlayerClick(row, col) {
        const currentPlayer = this.players[this.currentPlayerIndex];

        if (this.board[row][col].isMine) {
            // Player hit a mine - lose points and end turn
            this.board[row][col].isRevealed = true;
            this.board[row][col].revealedBy = currentPlayer;
            currentPlayer.roundScore = Math.max(0, currentPlayer.roundScore - 10);
            
            const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            cell.classList.add('exploded');
            
            this.gameStatusEl.textContent = `💥 ${currentPlayer.name} hit a mine! -10 points`;
            this.gameStatusEl.className = 'game-status lose';
            this.nextPlayer();
        } else {
            // Successful reveal - award points
            const revealedCells = this.revealCell(row, col, currentPlayer);
            const points = revealedCells * (this.board[row][col].neighborMines === 0 ? 2 : 1);
            currentPlayer.roundScore += points;
            
            this.gameStatusEl.textContent = `✨ ${currentPlayer.name} revealed ${revealedCells} cell${revealedCells > 1 ? 's' : ''} (+${points} points)`;
            this.gameStatusEl.className = 'game-status win';
            
            if (this.checkWin()) {
                this.endRound();
            } else {
                this.nextPlayer();
            }
        }
    }

    handleRightClick(e, row, col) {
        e.preventDefault();
        
        if (this.gameState !== 'playing') return;
        if (this.board[row][col].isRevealed) return;

        this.board[row][col].isFlagged = !this.board[row][col].isFlagged;
        this.flagCount += this.board[row][col].isFlagged ? 1 : -1;
        this.updateGameDisplay();
    }

    revealCell(row, col, player = null) {
        const config = this.difficulties[this.currentDifficulty];
        let revealedCount = 0;
        
        if (row < 0 || row >= config.rows || col < 0 || col >= config.cols) return 0;
        if (this.board[row][col].isRevealed || this.board[row][col].isFlagged) return 0;

        this.board[row][col].isRevealed = true;
        if (player) this.board[row][col].revealedBy = player;
        revealedCount = 1;

        // If empty cell, reveal neighbors
        if (this.board[row][col].neighborMines === 0) {
            for (let r = -1; r <= 1; r++) {
                for (let c = -1; c <= 1; c++) {
                    revealedCount += this.revealCell(row + r, col + c, player);
                }
            }
        }

        return revealedCount;
    }

    revealAllMines() {
        const config = this.difficulties[this.currentDifficulty];
        for (let row = 0; row < config.rows; row++) {
            for (let col = 0; col < config.cols; col++) {
                if (this.board[row][col].isMine) {
                    this.board[row][col].isRevealed = true;
                }
            }
        }
    }

    nextPlayer() {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        setTimeout(() => {
            this.gameStatusEl.textContent = '';
            this.gameStatusEl.className = 'game-status';
            this.updateGameDisplay();
        }, 2000);
    }

    checkWin() {
        const config = this.difficulties[this.currentDifficulty];
        let revealedSafeCells = 0;
        let totalSafeCells = config.rows * config.cols - config.mines;

        for (let row = 0; row < config.rows; row++) {
            for (let col = 0; col < config.cols; col++) {
                if (this.board[row][col].isRevealed && !this.board[row][col].isMine) {
                    revealedSafeCells++;
                }
            }
        }

        return revealedSafeCells === totalSafeCells;
    }

    endRound() {
        this.gameState = 'gameOver';
        
        // Add round scores to total scores
        this.players.forEach(player => {
            player.score += player.roundScore;
        });

        // Find round winner
        const roundWinner = this.players.reduce((winner, player) => 
            player.roundScore > winner.roundScore ? player : winner
        );

        this.gameStatusEl.textContent = `🎉 Round ${this.round} Complete! Winner: ${roundWinner.name} (+${roundWinner.roundScore} points)`;
        this.gameStatusEl.className = 'game-status win';
        
        this.updateGameDisplay();
    }

    startTimer() {
        this.startTime = Date.now();
        this.timer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            this.spTimeEl.textContent = elapsed.toString().padStart(3, '0');
        }, 1000);
    }

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    updateGameDisplay() {
        const config = this.difficulties[this.currentDifficulty];

        // Update players info for multiplayer
        if (this.gameMode === 'multi') {
            this.playersInfoEl.innerHTML = '';
            this.players.forEach((player, index) => {
                const playerCard = document.createElement('div');
                playerCard.className = `player-card ${index === this.currentPlayerIndex && this.gameState === 'playing' ? 'active' : ''}`;
                playerCard.innerHTML = `
                    <div class="player-name" style="color: ${player.color}">${player.name}</div>
                    <div class="player-score">Total: ${player.score}</div>
                    <div class="player-score">Round: ${player.roundScore}</div>
                `;
                this.playersInfoEl.appendChild(playerCard);
            });

            // Update current turn
            if (this.gameState === 'playing') {
                const currentPlayer = this.players[this.currentPlayerIndex];
                this.currentTurnEl.textContent = `${currentPlayer.name}'s Turn`;
                this.currentTurnEl.style.background = `linear-gradient(145deg, ${currentPlayer.color}, ${this.darkenColor(currentPlayer.color)})`;
            } else {
                this.currentTurnEl.textContent = 'Round Complete';
                this.currentTurnEl.style.background = 'linear-gradient(145deg, #95a5a6, #7f8c8d)';
            }

            this.roundNumberEl.textContent = this.round;
            this.updateLeaderboard();
        }

        // Update single player stats
        if (this.gameMode === 'single') {
            this.spFlagsEl.textContent = this.flagCount;
            this.spRemainingEl.textContent = config.mines - this.flagCount;
        }

        // Update game info
        this.mineCountEl.textContent = config.mines;
        
        let cellsLeft = 0;
        for (let row = 0; row < config.rows; row++) {
            for (let col = 0; col < config.cols; col++) {
                if (!this.board[row][col].isRevealed && !this.board[row][col].isMine) {
                    cellsLeft++;
                }
            }
        }
        this.cellsLeftEl.textContent = cellsLeft;

        // Update board display
        for (let row = 0; row < config.rows; row++) {
            for (let col = 0; col < config.cols; col++) {
                const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                const cellData = this.board[row][col];
                
                cell.className = 'cell';
                cell.textContent = '';
                cell.style.removeProperty('--player-color');

                if (cellData.isFlagged) {
                    cell.classList.add('flagged');
                    cell.textContent = '🚩';
                } else if (cellData.isRevealed) {
                    cell.classList.add('revealed');
                    if (cellData.revealedBy && this.gameMode === 'multi') {
                        cell.classList.add('player-reveal');
                        cell.style.setProperty('--player-color', cellData.revealedBy.color);
                    }
                    if (cellData.isMine) {
                        cell.classList.add('mine');
                        cell.textContent = '💣';
                    } else if (cellData.neighborMines > 0) {
                        cell.classList.add(`number-${cellData.neighborMines}`);
                        cell.textContent = cellData.neighborMines;
                    }
                }
            }
        }
    }

    darkenColor(color) {
        // Simple color darkening function
        const hex = color.replace('#', '');
        const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - 30);
        const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - 30);
        const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - 30);
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    updateLeaderboard() {
        // Sort players by total score
        const sortedPlayers = [...this.players].sort((a, b) => b.score - a.score);
        
        this.leaderboardEl.innerHTML = '';
        sortedPlayers.forEach((player, index) => {
            const item = document.createElement('div');
            item.className = 'leaderboard-item';
            item.style.borderLeftColor = player.color;
            
            const rank = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
            
            item.innerHTML = `
                <span>${rank} ${player.name}</span>
                <span style="font-weight: bold;">${player.score} pts</span>
            `;
            this.leaderboardEl.appendChild(item);
        });
    }
}

// Initialize game when page loads
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new MinesweeperGame();
});