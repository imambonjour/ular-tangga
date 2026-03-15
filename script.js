// Game Constants
const GRID_SIZE = 10;
const TOTAL_SQUARES = 100;

const SNAKES = {
    25: 4, 32: 28, 46: 15, 60: 43, 69: 33, 74: 66, 93: 75, 99: 95
};

const LADDERS = {
    12: 50, 19: 38, 59: 79, 73: 92, 77: 85
};

const BUNDLE_COUNT = 15;
let bundleSquares = [];
let QUESTIONS = []; 

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

// Quiz Elements
const quizModal = document.getElementById('quiz-modal');
const quizQuestion = document.getElementById('quiz-question');
const quizTimerBar = document.getElementById('quiz-timer-bar');
const quizImage = document.getElementById('quiz-image');

let quizTimerInterval = null;

/**
 * Load questions from external JSON
 */
async function loadQuestions() {
    try {
        const response = await fetch('assets/questions.json');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        QUESTIONS = data.questions;
        console.log("Questions loaded successfully from JSON.");
    } catch (error) {
        console.warn("Using fallback questions from questions-data.js:", error);
        if (typeof FALLBACK_QUESTIONS !== 'undefined') {
            QUESTIONS = FALLBACK_QUESTIONS;
        } else {
            console.error("No question data found!");
        }
    }
}

// Initial load - single call
loadQuestions();

/**
 * Initialize the game with the selected number of players
 */
function startGame(numPlayers) {
    if (isMoving) return; 
    
    // Reset state
    players = [];
    playersLayer.innerHTML = '';
    currentPlayerIndex = 0;
    gameActive = true;
    isMoving = false;

    // Place bundles
    placeBundles();

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
    
    // Count how many players are on this square
    const playersOnSquare = players.filter(p => p.position === player.position);
    const count = playersOnSquare.length;
    const playerIndex = playersOnSquare.findIndex(p => p.id === player.id);
    
    let scale = 1.0;
    let offsetX = 0;
    let offsetY = 0;
    
    if (count > 1) {
        // Shrink based on density
        scale = count === 2 ? 0.75 : (count === 3 ? 0.6 : 0.5);
        
        // Arrange in a small grid or offset pattern within the cell
        // A single cell is 10x10 units in our coordinate system
        // Player token is roughly 9x9 units now (9%)
        // We want to spread them out slightly
        
        const spacing = 2.5; // Offset in percentage points
        if (count === 2) {
            offsetX = playerIndex === 0 ? -spacing : spacing;
        } else if (count === 3) {
            // Triangle pattern
            if (playerIndex === 0) { offsetX = 0; offsetY = spacing; }
            else if (playerIndex === 1) { offsetX = -spacing; offsetY = -spacing; }
            else { offsetX = spacing; offsetY = -spacing; }
        } else if (count === 4) {
            // Square pattern
            offsetX = (playerIndex % 2 === 0) ? -spacing : spacing;
            offsetY = (playerIndex < 2) ? spacing : -spacing;
        }
    }
    
    player.element.style.bottom = `${bottom + 0.5 + offsetY}%`;
    player.element.style.left = `${left + 0.5 + offsetX}%`;
    player.element.style.transform = `scale(${scale})`;
}

/**
 * Bundle Logic
 */
function isForbiddenSquare(square) {
    // Snake head, Ladder base, Start (1), Finish (100)
    // Also exclude Snake tails and Ladder tops
    const snakeTails = Object.values(SNAKES);
    const ladderTops = Object.values(LADDERS);
    
    return SNAKES[square] || 
           LADDERS[square] || 
           snakeTails.includes(square) || 
           ladderTops.includes(square) || 
           square === 1 || 
           square === TOTAL_SQUARES;
}

function placeBundles() {
    bundleSquares = [];
    const availableSquares = [];
    for (let i = 2; i < TOTAL_SQUARES; i++) {
        if (!isForbiddenSquare(i)) {
            availableSquares.push(i);
        }
    }

    // Pick random squares for bundles
    for (let i = 0; i < BUNDLE_COUNT; i++) {
        if (availableSquares.length === 0) break;
        const randomIndex = Math.floor(Math.random() * availableSquares.length);
        const square = availableSquares.splice(randomIndex, 1)[0];
        bundleSquares.push(square);

        // Render bundle marker
        createBundleElement(square);
    }
}

function createBundleElement(square) {
    const { bottom, left } = getCoordinates(square);
    const el = document.createElement('img');
    el.src = 'assets/textures/quiz/gift.png';
    el.className = 'bundle-marker';
    el.style.bottom = `${bottom + 2}%`;
    el.style.left = `${left + 2}%`;
    el.dataset.square = square;
    playersLayer.appendChild(el);
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
}

/**
 * Dice spritesheet animation/update
 */
async function animateDice(finalValue) {
    // Start rolling animation
    diceFace.classList.add('dice-rolling');

    // Play for 800ms
    await sleep(800);

    // Stop animation and show final value
    diceFace.classList.remove('dice-rolling');
    updateDiceFace(finalValue);
}

function updateDiceFace(value) {
    diceFace.style.backgroundImage = `url('assets/textures/dice/${value}.png')`;
}

/**
 * Move player square by square
 */
async function movePlayerSequence(player, steps) {
    let goingForward = true;
    for (let i = 0; i < steps; i++) {
        const oldPos = player.position;
        
        // If we reach 100 and still have steps, bounce back
        if (player.position === TOTAL_SQUARES) {
            goingForward = false;
        }

        if (goingForward) {
            player.position++;
        } else {
            player.position--;
        }

        updatePlayersOnSquare(oldPos);
        updatePlayersOnSquare(player.position);
        await sleep(300);
    }

    // Check for Bundle (Quiz)
    if (bundleSquares.includes(player.position)) {
        await showQuiz();
        return; // handleDecision will resume the game
    }

    await checkTeleportation(player);
}

async function checkTeleportation(player) {
    // Check for Snake or Ladder
    if (SNAKES[player.position]) {
        const oldPos = player.position;
        player.position = SNAKES[player.position];
        addLog(`OH NO! A snake at ${oldPos} took ${getPlayerName(player)} down to ${player.position}!`);
        await sleep(500);
        updatePlayersOnSquare(oldPos);
        updatePlayersOnSquare(player.position);
    } else if (LADDERS[player.position]) {
        const oldPos = player.position;
        player.position = LADDERS[player.position];
        addLog(`HURRAY! A ladder at ${oldPos} took ${getPlayerName(player)} up to ${player.position}!`);
        await sleep(500);
        updatePlayersOnSquare(oldPos);
        updatePlayersOnSquare(player.position);
    }

    checkWinCondition(player);
    endTurn();
}

function checkWinCondition(player) {
    if (player.position === TOTAL_SQUARES) {
        victory(player);
        return true;
    }
    return false;
}

function endTurn() {
    if (!gameActive) return;
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    updateTurnIndicator();
    isMoving = false;
    rollBtn.disabled = false;
}

/**
 * Quiz & Teacher controls
 */
async function showQuiz() {
    if (QUESTIONS.length === 0) {
        addLog("Error: No questions available!");
        endTurn();
        return;
    }

    const randomIndex = Math.floor(Math.random() * QUESTIONS.length);
    const q = QUESTIONS[randomIndex];

    quizQuestion.innerHTML = q.pertanyaan;

    // Handle Image
    if (q.img) {
        quizImage.src = q.img;
        quizImage.style.display = 'block';
    } else {
        quizImage.style.display = 'none';
    }

    // Show modal
    quizModal.style.display = 'flex';
    addLog("Quiz Time! Teacher is deciding...");

    // Render LaTeX Math if KaTeX is loaded
    if (typeof renderMathInElement === 'function') {
        renderMathInElement(quizModal, {
            delimiters: [
                {left: '$$', right: '$$', display: true},
                {left: '$', right: '$', display: false}
            ],
            throwOnError : false
        });
    }

    // Start Timer
    const duration = (q.duration || 10) * 1000;
    startQuizTimer(duration);
}

/**
 * Timer logic for the quiz
 */
function startQuizTimer(timeLimitMs) {
    let timeLeft = timeLimitMs;
    quizTimerBar.style.width = '100%';

    if (quizTimerInterval) clearInterval(quizTimerInterval);

    const startTime = Date.now();

    quizTimerInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        timeLeft = Math.max(0, timeLimitMs - elapsed);

        const percentage = (timeLeft / timeLimitMs) * 100;
        quizTimerBar.style.width = `${percentage}%`;

        if (timeLeft <= 0) {
            clearInterval(quizTimerInterval);
            addLog("Time's up!");
            handleDecision(false);
        }
    }, 50);
}

async function handleDecision(isCorrect) {
    if (quizTimerInterval) clearInterval(quizTimerInterval);

    quizModal.style.display = 'none';
    const player = players[currentPlayerIndex];

    if (isCorrect) {
        addLog(`Teacher ACCEPTED! ${getPlayerName(player)} stays.`);
        await checkTeleportation(player);
    } else {
        addLog(`Teacher REJECTED! ${getPlayerName(player)} moves back 3 squares.`);

        // Move back 3 squares (or minimum to Square 1)
        const targetPos = Math.max(1, player.position - 3);
        const stepsToBack = player.position - targetPos;

        for (let i = 0; i < stepsToBack; i++) {
            player.position--;
            updatePlayersOnSquare(player.position + 1); // Refresh old
            updatePlayersOnSquare(player.position);     // Refresh new
            await sleep(300);
        }

        await checkTeleportation(player);
    }
}

function removeBundle(square) {
    bundleSquares = bundleSquares.filter(s => s !== square);
    const bundles = document.querySelectorAll('.bundle-marker');
    bundles.forEach(b => {
        if (parseInt(b.dataset.square) === square) {
            b.remove();
        }
    });
}


function updateTurnIndicator() {
    const player = players[currentPlayerIndex];
    turnIndicator.innerText = `${getPlayerName(player)}'S TURN`;
    turnIndicator.style.color = player.color;
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

function updatePlayersOnSquare(square) {
    players.forEach(p => {
        if (p.position === square) {
            updatePlayerUI(p);
        }
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
