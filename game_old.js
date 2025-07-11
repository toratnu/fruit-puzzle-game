document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const canvas = document.getElementById('game-board'); console.log('canvas:', canvas);
    const context = canvas.getContext('2d'); console.log('context:', context);
    const nextBlockCanvas = document.getElementById('next-block-canvas'); console.log('nextBlockCanvas:', nextBlockCanvas);
    const nextBlockContext = nextBlockCanvas.getContext('2d'); console.log('nextBlockContext:', nextBlockContext);
    const scoreElement = document.getElementById('score'); console.log('scoreElement:', scoreElement);
    const goalElement = document.getElementById('goal'); console.log('goalElement:', goalElement);
    const levelElement = document.getElementById('level'); console.log('levelElement:', levelElement);
    const clearedElement = document.getElementById('cleared'); console.log('clearedElement:', clearedElement);

    // Screens & Buttons
    const startScreen = document.getElementById('start-screen'); console.log('startScreen:', startScreen);
    const howToPlayScreen = document.getElementById('how-to-play-screen'); console.log('howToPlayScreen:', howToPlayScreen);
    const startBtn = document.getElementById('start-btn'); console.log('startBtn:', startBtn);
    const howToPlayBtn = document.getElementById('how-to-play-btn'); console.log('howToPlayBtn:', howToPlayBtn);
    const backToStartBtn = document.getElementById('back-to-start-btn'); console.log('backToStartBtn:', backToStartBtn);
    const startHighScoreElement = document.getElementById('start-high-score'); console.log('startHighScoreElement:', startHighScoreElement);
    const scoreAttackBtn = document.getElementById('score-attack-btn'); console.log('scoreAttackBtn:', scoreAttackBtn); // New button
    
    // Game UI Elements
    const gameWrapper = document.getElementById('game-wrapper'); console.log('gameWrapper:', gameWrapper);
    const mobileControls = document.getElementById('mobile-controls'); console.log('mobileControls:', mobileControls);
    const timeDisplay = document.getElementById('time-display'); console.log('timeDisplay:', timeDisplay);
    const gamePauseBtn = document.getElementById('game-pause-btn'); console.log('gamePauseBtn:', gamePauseBtn);

    // --- Game Constants ---
    const BOARD_WIDTH = 10, BOARD_HEIGHT = 20, BLOCK_SIZE = 30;
    const LEVEL_UP_THRESHOLD = 32;
    let TIME_LIMIT = 90; // Can change based on mode

    // --- Game Modes ---
    const GAME_MODE = {
        NORMAL: 'normal',
        SCORE_ATTACK: 'scoreAttack',
    };
    let gameMode = GAME_MODE.NORMAL; // Default mode

    // --- Asset Paths ---
    const ASSETS = {
        images: {
            banana: 'assets/images/fruits/banana.png',
            blueberry: 'assets/images/fruits/blueberry.png',
            cherry: 'assets/images/fruits/cherry.png',
            grape: 'assets/images/fruits/grape.png',
            melon: 'assets/images/fruits/melon.png',
            orange: 'assets/images/fruits/orange.png',
            peach: 'assets/images/fruits/peach.png',
            background1: 'assets/images/backgrounds/bg_stage_1.png',
            background2: 'assets/images/backgrounds/bg_stage_2.png',
        },
        sounds: {
            clear: 'assets/sounds/clear.mp3',
            land: 'assets/sounds/land.mp3',
            levelUp: 'assets/sounds/level_up.mp3',
            bgm: 'assets/sounds/bgm.m4a',
            gameOver: 'assets/sounds/level_up.mp3', // Placeholder
            stageClear: 'assets/sounds/clear.mp3', // Placeholder
            chain: 'assets/sounds/chain.mp3' // Added for chain sound
        }
    };
    const loadedAssets = { images: {}, sounds: {} };

    // --- Block Definitions ---
    const TETROMINOS = {
        'I': [[1, 1, 1, 1]], 'O': [[1, 1], [1, 1]], 'T': [[0, 1, 0], [1, 1, 1]],
        'L': [[0, 0, 1], [1, 1, 1]], 'J': [[1, 0, 0], [1, 1, 1]],
        'S': [[0, 1, 1], [1, 1, 0]], 'Z': [[1, 1, 0], [0, 1, 1]]
    };
    const FRUIT_TYPES = {
        CHERRY: 'cherry', PEACH: 'peach', ORANGE: 'orange',
        BANANA: 'banana', MELON: 'melon', BLUEBERRY: 'blueberry', GRAPE: 'grape',
    };
    const FRUIT_VALUES = Object.values(FRUIT_TYPES);

    // --- Game State ---
    let highScore, totalScore, score, level, clearedBlocks, stage, currentGoal;
    let gameOver, isStageClearing, gameLoopId, stageStartTime;
    let board, particles;
    let currentTetromino, currentTetrominoKey, currentTetrominoFruits, currentX, currentY;
    let nextTetromino, nextTetrominoKey, nextTetrominoFruits;
    let lastTime, dropCounter, dropInterval;
    let isPaused = false, pauseStartTime;
    let gameHasStarted = false;

    // --- Audio Context ---
    let audioContext;
    let bgmNode = null;

    // --- Asset Loading ---
    async function loadAssets() {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const imagePromises = Object.entries(ASSETS.images).map(([key, src]) => new Promise((resolve, reject) => { const img = new Image(); img.onload = () => { loadedAssets.images[key] = img; resolve(); }; img.onerror = reject; img.src = src; }));
        const soundPromises = Object.entries(ASSETS.sounds).map(([key, src]) => fetch(src).then(response => response.arrayBuffer()).then(buffer => audioContext.decodeAudioData(buffer)).then(decodedData => { loadedAssets.sounds[key] = decodedData; }).catch(e => { console.error(`Could not load sound: ${key} from ${src}:`, e); throw new Error(`Failed to load sound: ${key}`); })); // Re-throw error to catch in Promise.all
        await Promise.all([...imagePromises, ...soundPromises]);
    }

    // --- Audio Playback ---
    function playSound(buffer, loop = false) { if (!audioContext || !buffer) return null; const source = audioContext.createBufferSource(); const gainNode = audioContext.createGain(); source.buffer = buffer; source.loop = loop; source.connect(gainNode); gainNode.connect(audioContext.destination); source.start(); return { source, gainNode }; }
    function playBGM() { if (bgmNode) stopBGM(); bgmNode = playSound(loadedAssets.sounds.bgm, true); if (bgmNode) bgmNode.gainNode.gain.value = 0.1; }
    function stopBGM() { if (bgmNode && bgmNode.source) { bgmNode.gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5); bgmNode.source.stop(audioContext.currentTime + 0.5); bgmNode = null; } }

    // --- Screen Management ---
    function showStartScreen() {
        gameWrapper.style.visibility = 'hidden';
        mobileControls.style.visibility = 'hidden';
        howToPlayScreen.classList.add('hidden');
        startScreen.classList.remove('hidden');
        
        gameHasStarted = false;
        gameMode = GAME_MODE.NORMAL; // Reset mode when returning to start screen

        highScore = localStorage.getItem('fruitHighScore') || 0;
        startHighScoreElement.textContent = highScore;

        if (localStorage.getItem('newHighScore') === 'true') {
            startHighScoreElement.classList.add('new-high-score');
            localStorage.removeItem('newHighScore');
            setTimeout(() => startHighScoreElement.classList.remove('new-high-score'), 1500);
        }
    }

    // --- Game Initialization ---
    function initGameOnce() {
        if (gameHasStarted) return;
        if (audioContext && audioContext.state === 'suspended') { audioContext.resume(); }
        
        startScreen.classList.add('hidden');
        gameWrapper.style.visibility = 'visible';
        mobileControls.style.visibility = 'visible';

        gameHasStarted = true;
        startGame();
    }

    function startGame() {
        isPaused = false;
        removeOverlays();
        stopBGM();
        playBGM();
        totalScore = 0;
        highScore = localStorage.getItem('fruitHighScore') || 0;
        if (gameLoopId) cancelAnimationFrame(gameLoopId);

        // Mode-specific initializations
        if (gameMode === GAME_MODE.SCORE_ATTACK) {
            TIME_LIMIT = 60; // 60 seconds for score attack
            level = 9; // Start at level 9
            stage = 1; // Stage does not change
        } else { // Normal mode
            TIME_LIMIT = 90; // 90 seconds for normal
            level = 1; // Start at level 1
            stage = 1; // Start at stage 1
        }
        startStage();
        gameLoop();
    }

    function startStage() {
        board = Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0));
        score = 0; 
        clearedBlocks = 0; 
        gameOver = false; 
        isStageClearing = false; 
        particles = [];
        
        // Mode-specific stage setup
        if (gameMode === GAME_MODE.NORMAL) {
            currentGoal = 1000 + (stage - 1) * 100;
        } else { // Score Attack mode
            currentGoal = Infinity; // No goal for score attack
        }

        nextTetromino = null;
        stageStartTime = performance.now();
        dropInterval = Math.max(200, 1000 - (stage - 1) * 75 - (level - 1) * 50); // Drop speed depends on level and stage
        updateInfoPanel();
        spawnNewTetromino();
        spawnNewTetromino();
        lastTime = stageStartTime;
    }

    // --- Core Game Loop ---
    function gameLoop(timestamp = 0) {
        if (isPaused || !gameHasStarted) return;

        if (gameOver || isStageClearing) {
            if (gameOver) { stopBGM(); updateHighScore(); }
            gameLoopId = requestAnimationFrame(gameLoop);
            return;
        }
        const deltaTime = timestamp - lastTime;
        lastTime = timestamp;
        dropCounter += deltaTime;
        if (dropCounter > dropInterval) pieceDrop();
        updateTimer(timestamp);
        updateParticles();
        draw();
        gameLoopId = requestAnimationFrame(gameLoop);
    }

    function updateTimer(timestamp) {
        const elapsed = isPaused ? pauseStartTime - stageStartTime : timestamp - stageStartTime;
        const remainingTime = Math.max(0, TIME_LIMIT - elapsed / 1000);
        timeDisplay.textContent = `TIME: ${remainingTime.toFixed(1)}`;
        
        if (remainingTime <= 5.5 && remainingTime > 0) {
            timeDisplay.classList.add('countdown');
            toggleTimeWarning(true);
        } else {
            timeDisplay.classList.remove('countdown');
            toggleTimeWarning(false);
        }

        if (remainingTime <= 0) {
            gameOver = true;
            totalScore += score; // Add current score to total before displaying game over
            let message = `<h1>TIME'S UP!</h1><p>Total Score: ${totalScore}</p>`;
            displayOverlay(message, false, true);
            playSound(loadedAssets.sounds.gameOver);
        }
    }

    // --- Piece Spawning & Control ---
    function spawnNewTetromino() {
        currentTetromino = nextTetromino; currentTetrominoFruits = nextTetrominoFruits; currentTetrominoKey = nextTetrominoKey;
        currentX = Math.floor(BOARD_WIDTH / 2) - 1; currentY = 0;
        const shapes = Object.keys(TETROMINOS);
        const newShapeKey = shapes[Math.floor(Math.random() * shapes.length)];
        nextTetrominoKey = newShapeKey; nextTetromino = TETROMINOS[newShapeKey]; nextTetrominoFruits = [];
        const fruitsForLevel = getFruitsForLevel();
        for (let i = 0; i < 4; i++) { nextTetrominoFruits.push(fruitsForLevel[Math.floor(Math.random() * fruitsForLevel.length)]); }
        if (currentTetromino && checkCollision(currentX, currentY, currentTetromino)) {
            gameOver = true;
            totalScore += score; // Add current score to total before displaying game over
            let message = `<h1>GAME OVER</h1><p>Total Score: ${totalScore}</p>`;
            displayOverlay(message, false, true);
            playSound(loadedAssets.sounds.gameOver);
        }
    }
    function playerMove(dir) { if (isPaused || gameOver || isStageClearing) return; if (!checkCollision(currentX + dir, currentY, currentTetromino)) { currentX += dir; } }
    function playerRotate() { if (isPaused || gameOver || isStageClearing || currentTetrominoKey === 'O') return; const shape = currentTetromino; const fruits = currentTetrominoFruits; let fruitMatrix = JSON.parse(JSON.stringify(shape)); let fruitIndex = 0; for (let y = 0; y < fruitMatrix.length; y++) for (let x = 0; x < fruitMatrix[y].length; x++) if (fruitMatrix[y][x] !== 0) fruitMatrix[y][x] = fruits[fruitIndex++]; const rotatedShape = []; const rotatedFruitsMatrix = []; for (let y = 0; y < shape[0].length; y++) { rotatedShape[y] = []; rotatedFruitsMatrix[y] = []; for (let x = 0; x < shape.length; x++) { rotatedShape[y][x] = shape[shape.length - 1 - x][y]; rotatedFruitsMatrix[y][x] = fruitMatrix[fruitMatrix.length - 1 - x][y]; } } const newFruits = []; for (let y = 0; y < rotatedFruitsMatrix.length; y++) for (let x = 0; x < rotatedFruitsMatrix[y].length; x++) if (rotatedFruitsMatrix[y][x] !== 0) newFruits.push(rotatedFruitsMatrix[y][x]); const testOffsets = [[0, 0], [-1, 0], [1, 0], [2, 0], [-2, 0], [0, -1], [0, 1]]; for (const [ox, oy] of testOffsets) { if (!checkCollision(currentX + ox, currentY + oy, rotatedShape)) { currentX += ox; currentY += oy; currentTetromino = rotatedShape; currentTetrominoFruits = newFruits; return; } } }
    function pieceDrop(isPlayerAction = false) { if (isPaused || gameOver || isStageClearing) return; if (checkCollision(currentX, currentY + 1, currentTetromino)) { solidifyPiece(); } else { currentY++; if (isPlayerAction) score += 1; } dropCounter = 0; }
    function playerHardDrop() { if (isPaused || gameOver || isStageClearing || !currentTetromino) return; let dropY = currentY; while (!checkCollision(currentX, dropY + 1, currentTetromino)) { dropY++; } if (dropY > currentY) { score += (dropY - currentY); currentY = dropY; solidifyPiece(); } }

    // --- Game Mechanics ---
    async function solidifyPiece() { const shape = currentTetromino, fruits = currentTetrominoFruits, xPos = currentX, yPos = currentY; currentTetromino = null; let fruitIndex = 0; for (let y = 0; y < shape.length; y++) { for (let x = 0; x < shape[y].length; x++) { if (shape[y][x]) { if (yPos + y >= 0) { board[yPos + y][xPos + x] = fruits[fruitIndex]; } fruitIndex++; } } } playSound(loadedAssets.sounds.land); await handleBoardState(); }
    async function handleBoardState(chain = 1) { applyGravity(); draw(); await sleep(100); const matches = findMatches(); if (matches.length > 0) { await animateAndClear(matches, chain); if (isStageClearing) return; await sleep(100); await handleBoardState(chain + 1); } else { spawnNewTetromino(); } }
    async function animateAndClear(matches, chain) { spawnClearParticles(matches, chain, matches.length); playSound(loadedAssets.sounds.clear); updateScore(matches.length, chain); updateClearedBlocks(matches.length); displayChain(chain); for (let i = 0; i < 4; i++) { matches.forEach(([x, y]) => { board[y][x] = 0; }); draw(); await sleep(60); matches.forEach(([x, y, fruit]) => { board[y][x] = fruit; }); draw(); await sleep(60); } matches.forEach(([x, y]) => { board[y][x] = 0; }); checkLevelUp(); if (gameMode === GAME_MODE.NORMAL && score >= currentGoal && !isStageClearing) { await stageClear(); } }
    function applyGravity() { for (let x = 0; x < BOARD_WIDTH; x++) { let emptyRow = BOARD_HEIGHT - 1; for (let y = BOARD_HEIGHT - 1; y >= 0; y--) { if (board[y][x] !== 0) { if (emptyRow !== y) { board[emptyRow][x] = board[y][x]; board[y][x] = 0; } emptyRow--; } } } }
    function findMatches() { const matches = []; const visited = new Set(); for (let y = 0; y < BOARD_HEIGHT; y++) { for (let x = 0; x < BOARD_WIDTH; x++) { if (board[y][x] !== 0 && !visited.has(`${x},${y}`)) { const fruitType = board[y][x]; const group = []; const queue = [[x, y]]; visited.add(`${x},${y}`); group.push([x, y, fruitType]); while (queue.length > 0) { const [cx, cy] = queue.shift(); [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([dx, dy]) => { const nx = cx + dx, ny = cy + dy; if (nx >= 0 && nx < BOARD_WIDTH && ny >= 0 && ny < BOARD_HEIGHT && !visited.has(`${nx},${ny}`) && board[ny][nx] === fruitType) { visited.add(`${nx},${ny}`); queue.push([nx, ny]); group.push([nx, ny, fruitType]); } }); } if (group.length >= 4) { matches.push(...group); } } } } return matches; }
    function checkCollision(xPos, yPos, shape) { if (!shape) return false; for (let y = 0; y < shape.length; y++) { for (let x = 0; x < shape[y].length; x++) { if (shape[y][x]) { const newX = xPos + x; const newY = yPos + y; if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT || (newY >= 0 && board[newY][newX] !== 0)) { return true; } } } } return false; }
    async function stageClear() { isStageClearing = true; totalScore += score; playSound(loadedAssets.sounds.stageClear); let message = `<h1>STAGE ${stage} CLEAR!</h1><p>Total Score: ${totalScore}</p>`; await displayOverlay(message, true, false); stage++; startStage(); }
    function updateScore(count, chain) { if (isStageClearing) return; let baseScore = level * 10 * count; let bonus = count >= 5 ? count * 5 : 0; let chainBonus = Math.pow(2, chain - 1); score += (baseScore + bonus) * chainBonus; updateInfoPanel(); }
    function updateClearedBlocks(count) { clearedBlocks += count; updateInfoPanel(); }
    function checkLevelUp() { const oldLevel = level; level = Math.floor(clearedBlocks / LEVEL_UP_THRESHOLD) + 1; if (level > oldLevel) { let message = `<h1>LEVEL ${level}!</h1>`; showLevelUpPopup(level); dropInterval = Math.max(150, 1000 - (stage - 1) * 75 - (level - 1) * 50); playSound(loadedAssets.sounds.levelUp); updateInfoPanel(); } }
    function getFruitsForLevel() { const count = Math.min(FRUIT_VALUES.length, 4 + (level - 1)); return FRUIT_VALUES.slice(0, count); }
    function updateHighScore() { if (totalScore > highScore) { highScore = totalScore; localStorage.setItem('fruitHighScore', highScore); localStorage.setItem('newHighScore', 'true'); } }

    // --- Drawing & UI ---
    function draw() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        drawBackground();
        drawStageText();
        for (let y = 0; y < BOARD_HEIGHT; y++) { for (let x = 0; x < BOARD_WIDTH; x++) { if (board[y][x] !== 0) { drawBlock(context, x, y, board[y][x]); } } }
        if (currentTetromino) { let i = 0; for (let y = 0; y < currentTetromino.length; y++) { for (let x = 0; x < currentTetromino[y].length; x++) { if (currentTetromino[y][x]) { drawBlock(context, currentX + x, currentY + y, currentTetrominoFruits[i++]); } } } }
        drawParticles();
        drawNextBlock();
        if (isPaused) {
            context.fillStyle = 'rgba(0, 0, 0, 0.6)';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.fillStyle = '#ecf0f1';
            context.font = 'bold 40px Poppins';
            context.textAlign = 'center';
            context.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
        }
    }

    function drawBlock(ctx, x, y, fruitKey) { const realX = x * BLOCK_SIZE; const realY = y * BLOCK_SIZE; const image = loadedAssets.images[fruitKey]; if (image) { ctx.drawImage(image, realX, realY, BLOCK_SIZE, BLOCK_SIZE); } else { ctx.fillStyle = 'purple'; ctx.fillRect(realX, realY, BLOCK_SIZE, BLOCK_SIZE); } }
    function drawNextBlock() { nextBlockContext.clearRect(0, 0, nextBlockCanvas.width, nextBlockCanvas.height); nextBlockContext.fillStyle = '#34495e'; nextBlockContext.fillRect(0, 0, nextBlockCanvas.width, nextBlockCanvas.height); if (!nextTetromino) return; const shape = nextTetromino; const fruits = nextTetrominoFruits; const blockSize = 20; const startX = (nextBlockCanvas.width - shape[0].length * blockSize) / 2; const startY = (nextBlockCanvas.height - shape.length * blockSize) / 2; let i = 0; for (let r = 0; r < shape.length; r++) { for (let c = 0; c < shape[r].length; c++) { if (shape[r][c]) { const img = loadedAssets.images[fruits[i++]]; if (img) { nextBlockContext.drawImage(img, startX + c * blockSize, startY + r * blockSize, blockSize, blockSize); } } } } }
    function updateInfoPanel() { scoreElement.textContent = score; goalElement.textContent = currentGoal; levelElement.textContent = level; clearedElement.textContent = clearedBlocks; }
    function displayOverlay(htmlContent, autoDismiss, showRestart) { const overlay = document.createElement('div'); overlay.className = 'game-overlay'; overlay.style.cssText = `position:fixed;left:0;top:0;width:100%;height:100%;padding:20px;box-sizing:border-box;background-color:rgba(0,0,0,.85);color:#fff;font-size:24px;font-weight:700;display:flex;flex-direction:column;justify-content:center;align-items:center;z-index:50;text-align:center;`; overlay.innerHTML = htmlContent; if (showRestart) { const restartBtn = document.createElement('button'); restartBtn.textContent = 'Return to Title'; restartBtn.style.cssText = 'font-size: 1.2em;padding: 10px 30px;border-radius: 8px;border: none;color: white;cursor: pointer;margin-top:20px;background-color:#e67e22;'; restartBtn.onclick = () => { removeOverlays(); showStartScreen(); }; overlay.appendChild(restartBtn); } document.body.appendChild(overlay); if (autoDismiss) { setTimeout(() => { if (overlay.parentElement) document.body.removeChild(overlay); }, 2000); } }
    function removeOverlays() { document.querySelectorAll('.game-overlay, .chain-indicator, .level-up-popup').forEach(e => e.remove()); }
    function showChainIndicator(chain) { if (chain === 1) playSound(loadedAssets.sounds.clear); else if (chain > 1) playSound(loadedAssets.sounds.chain); const chainText = document.createElement('div'); chainText.className = 'chain-indicator'; chainText.textContent = `${chain} CHAIN!`; chainText.style.cssText = ` position: absolute; left: 50%; top: 40%; transform: translate(-50%, -50%); font-size: 3.5em; font-weight: bold; color: #f1c40f; -webkit-text-stroke: 2px #a10f0f; pointer-events: none; z-index: 101; animation: chain-anim 1s ease-out; `; const style = document.createElement('style'); style.innerHTML = ` @keyframes chain-anim { 0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; } 20% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; } 80% { transform: translate(-50%, -50%) scale(1); opacity: 1; } 100% { transform: translate(-50%, -50%) scale(1); opacity: 0; } } `; document.head.appendChild(style); document.body.appendChild(chainText); setTimeout(() => { if (chainText.parentElement) { chainText.parentElement.removeChild(chainText); } document.head.removeChild(style); }, 1000); }
    function displayChain(chain) { showChainIndicator(chain); }
    function drawBackground() { const bgKey = stage % 2 === 1 ? 'background1' : 'background2'; const bgImage = loadedAssets.images[bgKey]; if (bgImage) { context.drawImage(bgImage, 0, 0, canvas.width, canvas.height); } else { const g = context.createLinearGradient(0, 0, 0, canvas.height); g.addColorStop(0, `hsl(220, 60%, 15%)`); g.addColorStop(1, `hsl(270, 70%, 10%)`); context.fillStyle = g; context.fillRect(0, 0, canvas.width, canvas.height); } }
    function drawStageText() { context.font = 'bold 72px Poppins'; context.fillStyle = 'rgba(255, 255, 255, 0.1)'; context.textAlign = 'center'; context.textBaseline = 'middle'; context.fillText(`STAGE ${stage}`, canvas.width / 2, canvas.height / 2); }
    function spawnClearParticles(matches, chain = 0, clearCount = 0) {
        const particleColors = ['#00BFFF', '#32CD32', '#FFD700', '#FF4500']; // Blue, Green, Yellow, Red
        let colorIndex = Math.min(chain - 1, particleColors.length - 1);
        let particleColor = particleColors[colorIndex] || '#FFFFFF'; // Default to white if chain is 0 or 1

        let numParticles = 10;
        let minSpeed = 0.5, maxSpeed = 1.0;
        let particleLifetime = 400; // 0.4s

        if (clearCount >= 5) { // Large clear
            numParticles = 30;
            minSpeed = 1.5; maxSpeed = 3.0;
            particleLifetime = 600; // 0.6s
            applyScreenShake(0.2, 300); // Amplitude 0.2, Duration 0.3s
        }

        matches.forEach(([x, y, fruitKey]) => {
            const image = loadedAssets.images[fruitKey];
            for (let i = 0; i < numParticles; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * (maxSpeed - minSpeed) + minSpeed;
                particles.push({
                    x: (x + .5) * BLOCK_SIZE,
                    y: (y + .5) * BLOCK_SIZE,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: particleLifetime,
                    maxLife: particleLifetime,
                    color: particleColor, // Use determined color
                    shape: (clearCount < 5) ? (Math.random() > 0.5 ? 'star' : 'dot') : 'circle' // Shape based on clear type
                });
            }
        });
    }
    function updateParticles() { for (let i = particles.length - 1; i >= 0; i--) { const p = particles[i]; p.x += p.vx; p.y += p.vy; p.life--; if (p.life <= 0) particles.splice(i, 1); } }
    function drawParticles() {
        particles.forEach(p => {
            context.globalAlpha = p.life / p.maxLife;
            context.fillStyle = p.color;
            if (p.shape === 'star') {
                drawStar(context, p.x, p.y, 5, (p.life / p.maxLife) * 8 + 2, (p.life / p.maxLife) * 4 + 1);
            } else if (p.shape === 'dot' || p.shape === 'circle') {
                context.beginPath();
                context.arc(p.x, p.y, (p.life / p.maxLife) * 5 + 1, 0, Math.PI * 2);
                context.fill();
            }
            context.globalAlpha = 1;
        });
    }
    function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        let step = Math.PI / spikes;

        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
        ctx.fill();
    }

    function applyScreenShake(amplitude, duration) {
        const startTime = performance.now();
        const gameWrapper = document.getElementById('game-wrapper');
        if (!gameWrapper) return;

        function shake() {
            const elapsed = performance.now() - startTime;
            const progress = elapsed / duration;
            if (progress < 1) {
                const x = (Math.random() - 0.5) * amplitude * 20;
                const y = (Math.random() - 0.5) * amplitude * 20;
                gameWrapper.style.transform = `translate(${x}px, ${y}px)`;
                requestAnimationFrame(shake);
            } else {
                gameWrapper.style.transform = 'translate(0, 0)'; // Reset
            }
        }
        requestAnimationFrame(shake);
    }

    function showLevelUpPopup(level) {
        const popup = document.createElement('div');
        popup.className = 'level-up-popup';
        popup.innerHTML = `<h1>LEVEL ${level}!</h1>`;
        popup.style.cssText = `
            position: fixed;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            font-size: 3em;
            font-weight: bold;
            color: #fff;
            text-shadow: 0 0 10px #0f0, 0 0 20px #0f0;
            z-index: 102;
            opacity: 0;
            animation: level-up-fade 1.2s forwards;
        `;
        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes level-up-fade {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
                20% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
                80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(1.2); }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(popup);

        setTimeout(() => {
            if (popup.parentElement) popup.parentElement.removeChild(popup);
            if (style.parentElement) style.parentElement.removeChild(style);
        }, 1200);
    }

    let timeWarningInterval = null;
    function toggleTimeWarning(enable) {
        if (enable && !timeWarningInterval) {
            let flash = false;
            timeWarningInterval = setInterval(() => {
                if (gameWrapper) {
                    if (flash) {
                        gameWrapper.classList.add('time-warning-flash');
                    } else {
                        gameWrapper.classList.remove('time-warning-flash');
                    }
                    flash = !flash;
                }
            }, 500); // Flash every 0.5s (1s interval for full cycle)
        } else if (!enable && timeWarningInterval) {
            clearInterval(timeWarningInterval);
            timeWarningInterval = null;
            if (gameWrapper) {
                gameWrapper.classList.remove('time-warning-flash');
            }
        }
    }

    // --- Controls & Event Handling ---
    function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

    function togglePause() {
        if (gameOver || isStageClearing || !gameHasStarted) return;
        isPaused = !isPaused;
        if (isPaused) {
            pauseStartTime = performance.now();
            cancelAnimationFrame(gameLoopId);
            if (bgmNode) bgmNode.gainNode.gain.value = 0;
            draw(); // Redraw to show the paused overlay
            toggleTimeWarning(false); // Pause time warning
        } else {
            const pausedDuration = performance.now() - pauseStartTime;
            stageStartTime += pausedDuration;
            if (bgmNode) bgmNode.gainNode.gain.value = 0.1;
            lastTime = performance.now();
            gameLoop();
            // Resume time warning if still critical
            const remainingTime = Math.max(0, TIME_LIMIT - (performance.now() - stageStartTime) / 1000);
            if (remainingTime <= 5.5 && remainingTime > 0) {
                toggleTimeWarning(true);
            }
        }
    }

    function setupEventListeners() {
        startBtn.addEventListener('click', () => { gameMode = GAME_MODE.NORMAL; initGameOnce(); });
        scoreAttackBtn.addEventListener('click', () => { gameMode = GAME_MODE.SCORE_ATTACK; initGameOnce(); });

        howToPlayBtn.addEventListener('click', () => {
            startScreen.classList.add('hidden');
            howToPlayScreen.classList.remove('hidden');
        });
        backToStartBtn.addEventListener('click', () => {
            howToPlayScreen.classList.add('hidden');
            startScreen.classList.remove('hidden');
        });
        if (gamePauseBtn) { // Added null check
            gamePauseBtn.addEventListener('click', togglePause);
        } else {
            console.error("Error: gamePauseBtn element not found in setupEventListeners!");
        }

        document.addEventListener('keydown', e => {
            const key = e.key.toLowerCase();
            if (!gameHasStarted) {
                if (key === 'enter' && !startScreen.classList.contains('hidden')) {
                    startBtn.click();
                }
                return;
            }
            if (key === 'p') { togglePause(); return; }
            if (isPaused || gameOver || isStageClearing) return;
            switch (e.key) {
                case 'ArrowLeft': playerMove(-1); break;
                case 'ArrowRight': playerMove(1); break;
                case 'ArrowDown': pieceDrop(true); break;
                case 'ArrowUp': case ' ': e.preventDefault(); playerRotate(); break;
                case 'd': playerHardDrop(); break;
            }
        });

        const controls = { 'btn-left': () => playerMove(-1), 'btn-right': () => playerMove(1), 'btn-rotate': () => playerRotate(), 'btn-down': () => pieceDrop(true), 'btn-hard-drop': () => playerHardDrop() };
        for (const [id, action] of Object.entries(controls)) {
            const button = document.getElementById(id);
            if (button) {
                button.addEventListener('click', e => {
                    e.preventDefault();
                    if (isPaused || !gameHasStarted || gameOver || isStageClearing) return;
                    action();
                });
            }
        }
    }

    // --- Initial Load ---
    loadAssets().then(() => {
        setupEventListeners();
        showStartScreen();
    }).catch(err => {
        console.error("Failed to load assets. Game cannot start.", err);
        document.body.innerHTML = `<h1 style="color:white;text-align:center;">Error loading assets!</h1><p style="color:white;text-align:center;">Please check the console for details. Error: ${err.message || err}</p>`;
    });
});
