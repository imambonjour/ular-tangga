// Game Constants
const GRID_SIZE = 10;
const TOTAL_SQUARES = 100;

const SNAKES = {
    25: 4, 32: 28, 46: 15, 60: 43, 69: 33, 74: 66, 93: 75, 99: 95
};

const LADDERS = {
    12: 50, 19: 38, 59: 79, 73: 92, 77: 85
};

// Game State
let players = [];
let currentPlayerIndex = 0;
let isMoving = false;
let gameActive = false;

// DOM Elements
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const playersLayer = document.getElementById('players-layer');
const turnIndicator = document.getElementById('turn-indicator');
const diceFace = document.getElementById('dice-face');
const gameLog = document.getElementById('game-log');
const rollBtn = document.getElementById('roll-btn');

/**
 * Initialize the game with the selected number of players
 */
function startGame(numPlayers) {
    players = [];
    playersLayer.innerHTML = '';
    
    for (let i = 0; i < numPlayers; i++) {
        const player = {
            id: i + 1,
            position: 1,
            color: getColorForPlayer(i),
            element: createPlayerElement(i)
        };
        players.push(player);
        playersLayer.appendChild(player.element);
        updatePlayerUI(player);
    }
    
    currentPlayerIndex = 0;
    gameActive = true;
    startScreen.style.display = 'none';
    gameScreen.style.display = 'flex';
    
    updateTurnIndicator();
    addLog(`Game started with ${numPlayers} players!`);
}

/**
 * Creates the DOM element for a player token
 */
function createPlayerElement(index) {
    const el = document.createElement('img');
    el.src = `assets/textures/avatars/${index + 1}.png`;
    el.className = 'player-token';
    el.id = `player-${index + 1}`;
    return el;
}

/**
 * Boustrophedon Grid Mapping
 * Square 1 is bottom-left (0,0) index in our logical grid if we think 0-9
 * However, we mapping to percentages for CSS absolute positioning.
 */
function getCoordinates(square) {
    // Convert 1-100 to 0-99
    const zeroBased = square - 1;
    
    // Row index (0-9) from bottom to top
    const row = Math.floor(zeroBased / GRID_SIZE);
    
    // Column index (0-9)
    let col = zeroBased % GRID_SIZE;
    
    // Reverse column for even rows (row 0 is first row, odd row indices are reversed)
    // Row 0 (1-10): Left to Right
    // Row 1 (11-20): Right to Left
    // Row 2 (21-30): Left to Right
    if (row % 2 !== 0) {
        col = (GRID_SIZE - 1) - col;
    }
    
    // Calculate percentages
    // bottom is 0%, top is 90% (since each cell is 10%)
    // left is 0%, right is 90%
    const bottom = row * 10;
    const left = col * 10;
    
    return { bottom, left };
}

/**
 * Update player visual position
 */
function updatePlayerUI(player) {
    const { bottom, left } = getCoordinates(player.position);
    
    // Adjust slightly to avoid perfect overlap if multiple players on same square
    const offset = (player.id - 1) * 2; 
    
    player.element.style.bottom = `${bottom + 1}%`;
    player.element.style.left = `${left + offset}%`;
}

/**
 * Handle dice roll
 */
async function handleRoll() {
    if (!gameActive || isMoving) return;
    
    isMoving = true;
    rollBtn.disabled = true;
    
    const roll = Math.floor(Math.random() * 6) + 1;
    
    // Animate dice (simplified)
    await animateDice(roll);
    
    const player = players[currentPlayerIndex];
    addLog(`${getPlayerName(player)} rolled a ${roll}!`);
    
    await movePlayerSequence(player, roll);
    
    if (player.position === TOTAL_SQUARES) {
        victory(player);
        return;
    }
    
    // End turn
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    updateTurnIndicator();
    isMoving = false;
    rollBtn.disabled = false;
}

/**
 * Dice spritesheet animation/update
 */
async function animateDice(finalValue) {
    // Show random faces for 500ms
    for (let i = 0; i < 5; i++) {
        const temp = Math.floor(Math.random() * 6) + 1;
        updateDiceFace(temp);
        await sleep(100);
    }
    updateDiceFace(finalValue);
}

function updateDiceFace(value) {
    diceFace.style.backgroundImage = `url('assets/textures/dice/${value}.png')`;
}

/**
 * Move player square by square
 */
async function movePlayerSequence(player, steps) {
    for (let i = 0; i < steps; i++) {
        if (player.position >= TOTAL_SQUARES) break;
        
        player.position++;
        updatePlayerUI(player);
        await sleep(300);
    }
    
    // Check for Snake or Ladder
    if (SNAKES[player.position]) {
        const oldPos = player.position;
        player.position = SNAKES[player.position];
        addLog(`OH NO! A snake at ${oldPos} took ${getPlayerName(player)} down to ${player.position}!`);
        await sleep(500);
        updatePlayerUI(player);
    } else if (LADDERS[player.position]) {
        const oldPos = player.position;
        player.position = LADDERS[player.position];
        addLog(`HURRAY! A ladder at ${oldPos} took ${getPlayerName(player)} up to ${player.position}!`);
        await sleep(500);
        updatePlayerUI(player);
    }
}

function updateTurnIndicator() {
    const player = players[currentPlayerIndex];
    turnIndicator.innerText = `${getPlayerName(player)}'S TURN`;
    turnIndicator.style.color = player.color;
    
    // Reset dice row to current player's color (showing 1 as default)
    updateDiceFace(1);
}

function getPlayerName(player) {
    return `PLAYER ${player.id}`;
}

function getColorForPlayer(index) {
    const colors = ['#ff4d4d', '#ffa500', '#ffff4d', '#4dff4d']; // Red, Orange, Yellow, Green
    return colors[index];
}

function addLog(message) {
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerText = `> ${message}`;
    gameLog.prepend(entry);
}

function victory(player) {
    addLog(`CONGRATULATIONS! ${getPlayerName(player)} WON!`);
    turnIndicator.innerText = `${getPlayerName(player)} WINS!`;
    turnIndicator.style.color = '#ffd700';
    gameActive = false;
    rollBtn.innerText = 'GAME OVER';
    rollBtn.disabled = true;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
