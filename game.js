document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed");

    // --- Utility Functions ---
    const getEl = (id) => {
        const element = document.getElementById(id);
        if (!element) console.error(`Element not found: #${id}`);
        return element;
    };
    const setVh = () => {
        document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    };
    window.addEventListener('resize', setVh);
    setVh();

    // --- DOM Elements ---
    console.log("Getting DOM elements...");
    const elements = {
        // Screens & Overlays
        startScreen: getEl('start-screen'),
        howToPlayScreen: getEl('how-to-play-screen'),
        gameOverlay: getEl('game-overlay'),
        overlayContent: getEl('overlay-content'),
        // Buttons
        startBtn: getEl('start-btn'),
        scoreAttackBtn: getEl('score-attack-btn'),
        howToPlayBtn: getEl('how-to-play-btn'),
        backToStartBtn: getEl('back-to-start-btn'),
        overlayReturnBtn: getEl('overlay-return-btn'),
        gamePauseBtn: getEl('game-pause-btn'),
        // Game UI
        gameWrapper: getEl('game-wrapper'),
        timeDisplay: getEl('time-display'),
        score: getEl('score'),
        goal: getEl('goal'),
        level: getEl('level'),
        cleared: getEl('cleared'),
        startHighScore: getEl('start-high-score'),
        goalBox: getEl('goal-box'),
        // Canvases
        gameBoardCanvas: getEl('game-board'),
        nextBlockCanvas: getEl('next-block-canvas'),
        // Mobile Controls
        mobileControls: getEl('mobile-controls'),
        btnLeft: getEl('btn-left'),
        btnRight: getEl('btn-right'),
        btnRotate: getEl('btn-rotate'),
        btnSoftDrop: getEl('btn-soft-drop'),
        btnHardDrop: getEl('btn-hard-drop'),
    };
    console.log("DOM elements acquired.");

    const ctx = elements.gameBoardCanvas.getContext('2d');
    const nextCtx = elements.nextBlockCanvas.getContext('2d');

    // --- Game Constants ---
    const CONSTANTS = {
        BOARD_WIDTH: 10,
        BOARD_HEIGHT: 20,
        BLOCK_SIZE: 30,
        LEVEL_UP_CLEARED: 32,
        NORMAL_TIME: 90,
        SCORE_ATTACK_TIME: 60,
        FRUIT_TYPES: ['cherry', 'peach', 'orange', 'banana', 'melon', 'blueberry', 'grape'],
        TETROMINOS: {
            'I': { shape: [[1, 1, 1, 1]] },
            'O': { shape: [[1, 1], [1, 1]] },
            'T': { shape: [[0, 1, 0], [1, 1, 1]] },
            'L': { shape: [[0, 0, 1], [1, 1, 1]] },
            'J': { shape: [[1, 0, 0], [1, 1, 1]] },
            'S': { shape: [[0, 1, 1], [1, 1, 0]] },
            'Z': { shape: [[1, 1, 0], [0, 1, 1]] },
        },
        GAME_MODES: {
            NORMAL: 'NORMAL',
            SCORE_ATTACK: 'SCORE_ATTACK',
        }
    };

    // --- Game State ---
    let state = {};

    function resetState() {
        state = {
            gameMode: CONSTANTS.GAME_MODES.NORMAL,
            board: Array.from({ length: CONSTANTS.BOARD_HEIGHT }, () => Array(CONSTANTS.BOARD_WIDTH).fill(null)),
            currentPiece: null,
            nextPiece: null,
            isPaused: false,
            isGameOver: false,
            isProcessing: false,
            score: 0,
            level: 1,
            totalCleared: 0,
            stage: 1,
            goal: 1000,
            highScore: parseInt(localStorage.getItem('fruitHighScore') || '0'),
            timer: CONSTANTS.NORMAL_TIME,
            gameLoopId: null,
            lastTime: 0,
            timerStart: 0,
            timePaused: 0,
            dropCounter: 0,
            dropInterval: 1000,
            particles: [],
            popups: [],
        };
    }

    // --- Assets & Audio ---
    const assets = { images: {}, sounds: {} };
    let audioContext;
    let bgmNode;

    const assetPaths = {
        images: {
            ...CONSTANTS.FRUIT_TYPES.reduce((acc, fruit) => ({ ...acc, [fruit]: `assets/images/fruits/${fruit}.png` }), {}),
            bg_stage_1: 'assets/images/backgrounds/bg_stage_1.png',
            bg_stage_2: 'assets/images/backgrounds/bg_stage_2.png',
        },
        sounds: {
            land: 'assets/sounds/land.mp3',
            clear: 'assets/sounds/clear.mp3',
            level_up: 'assets/sounds/level_up.mp3',
            chain: 'assets/sounds/chain.mp3',
            bgm: 'assets/sounds/bgm.m4a',
        }
    };

    const AudioManager = {
        async init() {
            try {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) { console.error("Web Audio API is not supported."); }
        },
        resume() {
            if (audioContext && audioContext.state === 'suspended') {
                audioContext.resume();
            }
        },
        playSound(name) {
            if (!audioContext || !assets.sounds[name]) return;
            const source = audioContext.createBufferSource();
            source.buffer = assets.sounds[name];
            source.connect(audioContext.destination);
            source.start(0);
        },
        playBGM() {
            if (!audioContext || !assets.sounds.bgm) return;
            this.stopBGM();
            const source = audioContext.createBufferSource();
            source.buffer = assets.sounds.bgm;
            source.loop = true;
            const gainNode = audioContext.createGain();
            gainNode.gain.value = 0.1;
            source.connect(gainNode).connect(audioContext.destination);
            source.start(0);
            bgmNode = { source, gainNode };
        },
        stopBGM() {
            if (bgmNode) {
                bgmNode.gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
                bgmNode.source.stop(audioContext.currentTime + 0.5);
                bgmNode = null;
            }
        },
        setMute(muted) {
            if (bgmNode) {
                bgmNode.gainNode.gain.value = muted ? 0 : 0.1;
            }
        }
    };

    // --- UI Manager ---
    const UIManager = {
        init() {
            elements.startHighScore.textContent = state.highScore;
            const newHighScore = localStorage.getItem('newHighScore');
            if (newHighScore === 'true') {
                elements.startHighScore.classList.add('new-high-score');
                localStorage.removeItem('newHighScore');
                setTimeout(() => elements.startHighScore.classList.remove('new-high-score'), 1500);
            }
        },
        showScreen(screenName) {
            const screens = {
                start: elements.startScreen,
                howto: elements.howToPlayScreen,
                game: elements.gameWrapper,
                overlay: elements.gameOverlay
            };
            Object.values(screens).forEach(s => s.classList.add('hidden'));
            if (screens[screenName]) {
                screens[screenName].classList.remove('hidden');
            }
        },
        updateGameUI() {
            elements.score.textContent = state.score;
            elements.level.textContent = state.level;
            elements.cleared.textContent = state.totalCleared;
            elements.goal.textContent = state.gameMode === CONSTANTS.GAME_MODES.NORMAL ? state.goal : '---';
            elements.goalBox.style.display = state.gameMode === CONSTANTS.GAME_MODES.NORMAL ? 'block' : 'none';
        },
        updateTimer() {
            elements.timeDisplay.textContent = `TIME: ${Math.ceil(state.timer)}`;
            elements.timeDisplay.classList.toggle('countdown', state.timer <= 5.5 && state.timer > 0);
            elements.gameWrapper.classList.toggle('time-warning-flash', state.timer <= 5.5 && state.timer > 0);
        },
        displayOverlay(title, message, showReturn = true) {
            this.showScreen('overlay');
            elements.overlayContent.innerHTML = `<h1>${title}</h1><p>${message}</p>`;
            elements.overlayReturnBtn.style.display = showReturn ? 'inline-block' : 'none';
        },
        togglePause(isPaused) {
            elements.gamePauseBtn.textContent = isPaused ? '▶' : '❚❚';
            if (isPaused) {
                this.displayOverlay('PAUSED', 'Click or tap to resume', false);
            } else {
                this.showScreen('game');
            }
        },
        screenShake() {
            elements.gameWrapper.classList.add('screen-shake');
            setTimeout(() => elements.gameWrapper.classList.remove('screen-shake'), 300);
        },
        toggleMobileControls(show) {
            elements.mobileControls.classList.toggle('active', show);
        }
    };

    // --- Renderer ---
    const Renderer = {
        draw() {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            this.drawBackground();
            this.drawBoard();
            if (state.currentPiece) this.drawPiece(state.currentPiece, ctx);
            this.drawParticles();
            this.drawPopups();
            this.drawStageNumber();
        },
        drawBoard() {
            for (let y = 0; y < CONSTANTS.BOARD_HEIGHT; y++) {
                for (let x = 0; x < CONSTANTS.BOARD_WIDTH; x++) {
                    if (state.board[y][x]) {
                        this.drawBlock(x, y, state.board[y][x], ctx);
                    }
                }
            }
        },
        drawPiece(piece, context) {
            const { shape, fruits, x, y } = piece;
            let fruitIndex = 0;
            for (let r = 0; r < shape.length; r++) {
                for (let c = 0; c < shape[r].length; c++) {
                    if (shape[r][c]) {
                        this.drawBlock(x + c, y + r, fruits[fruitIndex], context);
                        fruitIndex++;
                    }
                }
            }
        },
        drawBlock(x, y, fruit, context) {
            const img = assets.images[fruit];
            if (img) {
                context.drawImage(img, x * CONSTANTS.BLOCK_SIZE, y * CONSTANTS.BLOCK_SIZE, CONSTANTS.BLOCK_SIZE, CONSTANTS.BLOCK_SIZE);
            }
        },
        drawNextPiece() {
            nextCtx.clearRect(0, 0, nextCtx.canvas.width, nextCtx.canvas.height);
            if (state.nextPiece) {
                const { shape, fruits } = state.nextPiece;
                const w = shape[0].length * CONSTANTS.BLOCK_SIZE;
                const h = shape.length * CONSTANTS.BLOCK_SIZE;
                const offsetX = (nextCtx.canvas.width - w) / 2;
                const offsetY = (nextCtx.canvas.height - h) / 2;
                let fruitIndex = 0;
                for (let r = 0; r < shape.length; r++) {
                    for (let c = 0; c < shape[r].length; c++) {
                        if (shape[r][c]) {
                            nextCtx.drawImage(assets.images[fruits[fruitIndex]], offsetX + c * CONSTANTS.BLOCK_SIZE, offsetY + r * CONSTANTS.BLOCK_SIZE, CONSTANTS.BLOCK_SIZE, CONSTANTS.BLOCK_SIZE);
                            fruitIndex++;
                        }
                    }
                }
            }
        },
        drawBackground() {
            const bgImage = state.stage % 2 === 0 ? assets.images.bg_stage_2 : assets.images.bg_stage_1;
            if (bgImage) ctx.drawImage(bgImage, 0, 0, ctx.canvas.width, ctx.canvas.height);
        },
        drawStageNumber() {
            ctx.font = 'bold 120px Poppins';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(state.stage, ctx.canvas.width / 2, ctx.canvas.height / 2);
        },
        drawParticles() {
            state.particles.forEach(p => {
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            });
        },
        drawPopups() {
            state.popups.forEach(p => {
                ctx.save();
                ctx.font = 'bold 3em Poppins';
                ctx.fillStyle = `rgba(255, 255, 255, ${p.life})`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.shadowColor = 'rgba(0,0,0,0.7)';
                ctx.shadowBlur = 10;
                ctx.fillText(p.text, ctx.canvas.width / 2, ctx.canvas.height / 2);
                ctx.restore();
            });
        }
    };

    // --- Particle & Popup Manager ---
    const EffectManager = {
        createParticles(x, y, count, color, size, speed) {
            for (let i = 0; i < count; i++) {
                state.particles.push({
                    x: x * CONSTANTS.BLOCK_SIZE + CONSTANTS.BLOCK_SIZE / 2,
                    y: y * CONSTANTS.BLOCK_SIZE + CONSTANTS.BLOCK_SIZE / 2,
                    vx: (Math.random() - 0.5) * speed,
                    vy: (Math.random() - 0.5) * speed,
                    life: 1,
                    color,
                    size: Math.random() * size + 1,
                });
            }
        },
        addPopup(text) {
            state.popups.push({ text, life: 1 });
        },
        update() {
            // Update particles
            for (let i = state.particles.length - 1; i >= 0; i--) {
                const p = state.particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.life -= 0.02;
                if (p.life <= 0) state.particles.splice(i, 1);
            }
            // Update popups
            for (let i = state.popups.length - 1; i >= 0; i--) {
                const p = state.popups[i];
                p.life -= 0.02;
                if (p.life <= 0) state.popups.splice(i, 1);
            }
        }
    };

    // --- Board Manager ---
    const BoardManager = {
        createPiece() {
            const type = Object.keys(CONSTANTS.TETROMINOS)[Math.floor(Math.random() * Object.keys(CONSTANTS.TETROMINOS).length)];
            const piece = CONSTANTS.TETROMINOS[type];
            const availableFruits = CONSTANTS.FRUIT_TYPES.slice(0, Math.min(7, 3 + state.level));
            const fruits = Array.from({ length: 4 }, () => availableFruits[Math.floor(Math.random() * availableFruits.length)]);
            return {
                shape: piece.shape,
                fruits,
                x: Math.floor(CONSTANTS.BOARD_WIDTH / 2) - 1,
                y: 0,
                type
            };
        },
        spawnNewPiece() {
            state.currentPiece = state.nextPiece || this.createPiece();
            state.nextPiece = this.createPiece();
            Renderer.drawNextPiece();
            if (this.checkCollision(state.currentPiece)) {
                Game.end('GAME OVER');
            }
        },
        movePiece(dx, dy) {
            if (!state.currentPiece) return false;
            const testPiece = { ...state.currentPiece, x: state.currentPiece.x + dx, y: state.currentPiece.y + dy };
            if (!this.checkCollision(testPiece)) {
                state.currentPiece = testPiece;
                return true;
            }
            return false;
        },
        rotatePiece() {
            if (!state.currentPiece || state.currentPiece.type === 'O') return;

            const { shape, fruits } = state.currentPiece;
            const N = shape.length;
            const M = shape[0].length;

            // Create a 2D array to hold the fruit types in their current shape positions
            const currentFruitGrid = Array(N).fill(0).map(() => Array(M).fill(null));
            let fruitIdx = 0;
            for (let r = 0; r < N; r++) {
                for (let c = 0; c < M; c++) {
                    if (shape[r][c]) {
                        currentFruitGrid[r][c] = fruits[fruitIdx++];
                    }
                }
            }

            // Rotate both shape and fruit grid 90 degrees clockwise
            const newShape = Array(M).fill(0).map(() => Array(N).fill(0));
            const newFruitGrid = Array(M).fill(0).map(() => Array(N).fill(null));

            for (let r = 0; r < N; r++) {
                for (let c = 0; c < M; c++) {
                    newShape[c][N - 1 - r] = shape[r][c];
                    newFruitGrid[c][N - 1 - r] = currentFruitGrid[r][c];
                }
            }

            // Extract the new linear fruit array
            const newFruits = [];
            for (let r = 0; r < newFruitGrid.length; r++) {
                for (let c = 0; c < newFruitGrid[r].length; c++) {
                    if (newFruitGrid[r][c]) {
                        newFruits.push(newFruitGrid[r][c]);
                    }
                }
            }

            const testPiece = { ...state.currentPiece, shape: newShape, fruits: newFruits };

            // Wall kick data (simplified for all pieces, could be more specific per piece type)
            const kicks = [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1], [-2, 0], [2, 0], [0, -2], [0, 2]];

            for (const [kx, ky] of kicks) {
                testPiece.x = state.currentPiece.x + kx;
                testPiece.y = state.currentPiece.y + ky;
                if (!this.checkCollision(testPiece)) {
                    state.currentPiece = testPiece;
                    return;
                }
            }
        },
        hardDrop() {
            if (!state.currentPiece) return;
            let dropCount = 0;
            while (this.movePiece(0, 1)) {
                dropCount++;
            }
            state.score += dropCount;
            this.lockPiece();
        },
        async lockPiece() {
            if (!state.currentPiece || state.isProcessing) return;
            state.isProcessing = true;

            const { shape, fruits, x, y } = state.currentPiece;
            let fruitIndex = 0;
            for (let r = 0; r < shape.length; r++) {
                for (let c = 0; c < shape[r].length; c++) {
                    if (shape[r][c]) {
                        if (y + r >= 0) {
                            state.board[y + r][x + c] = fruits[fruitIndex];
                        }
                        fruitIndex++;
                    }
                }
            }
            state.currentPiece = null;
            AudioManager.playSound('land');
            Renderer.draw();

            await this.handleBoardResolution();
            
            if (!state.isGameOver) {
                state.isProcessing = false;
                this.spawnNewPiece();
            }
        },
        async handleBoardResolution(chainCount = 1) {
            await this.applyGravity();

            const matches = this.findMatches();
            if (matches.size === 0) {
                return;
            }

            const clearedCount = matches.size;
            state.totalCleared += clearedCount;

            // Score
            const chainBonus = Math.pow(2, chainCount);
            state.score += clearedCount * 10 * state.level * chainBonus;

            // Effects
            if (chainCount > 1) EffectManager.addPopup(`${chainCount} CHAIN!`);
            AudioManager.playSound(chainCount > 1 ? 'chain' : 'clear');
            if (clearedCount >= 5) {
                UIManager.screenShake();
                matches.forEach(m => {
                    const [x, y] = m.split(',').map(Number);
                    EffectManager.createParticles(x, y, 5, '#ffdd33', 4, 8);
                });
            }
            
            // Clear blocks
            matches.forEach(m => {
                const [x, y] = m.split(',').map(Number);
                state.board[y][x] = null;
            });
            
            Renderer.draw();
            await new Promise(res => setTimeout(res, 100)); // Short delay for visual feedback

            await this.handleBoardResolution(chainCount + 1);
        },
        findMatches() {
            const matches = new Set();
            const visited = new Set();

            for (let y = 0; y < CONSTANTS.BOARD_HEIGHT; y++) {
                for (let x = 0; x < CONSTANTS.BOARD_WIDTH; x++) {
                    const fruit = state.board[y][x];
                    if (fruit && !visited.has(`${x},${y}`)) {
                        const group = [];
                        const queue = [{x, y}];
                        visited.add(`${x},${y}`);

                        while(queue.length > 0) {
                            const current = queue.shift();
                            group.push(current);

                            [[0,1], [0,-1], [1,0], [-1,0]].forEach(([dx, dy]) => {
                                const nx = current.x + dx;
                                const ny = current.y + dy;
                                const key = `${nx},${ny}`;

                                if (nx >= 0 && nx < CONSTANTS.BOARD_WIDTH && ny >= 0 && ny < CONSTANTS.BOARD_HEIGHT &&
                                    state.board[ny][nx] === fruit && !visited.has(key)) {
                                    visited.add(key);
                                    queue.push({x: nx, y: ny});
                                }
                            });
                        }
                        if (group.length >= 4) {
                            group.forEach(cell => matches.add(`${cell.x},${cell.y}`));
                        }
                    }
                }
            }
            return matches;
        },
        async applyGravity() {
            let wasChanged;
            do {
                wasChanged = false;
                for (let x = 0; x < CONSTANTS.BOARD_WIDTH; x++) {
                    for (let y = CONSTANTS.BOARD_HEIGHT - 2; y >= 0; y--) {
                        if (state.board[y][x] && !state.board[y + 1][x]) {
                            state.board[y + 1][x] = state.board[y][x];
                            state.board[y][x] = null;
                            wasChanged = true;
                        }
                    }
                }
                if (wasChanged) {
                    Renderer.draw();
                    // No delay here for instantaneous gravity
                }
            } while (wasChanged);
        },
        checkCollision(piece) {
            const { shape, x, y } = piece;
            for (let r = 0; r < shape.length; r++) {
                for (let c = 0; c < shape[r].length; c++) {
                    if (shape[r][c]) {
                        const newX = x + c;
                        const newY = y + r;
                        if (newX < 0 || newX >= CONSTANTS.BOARD_WIDTH || newY >= CONSTANTS.BOARD_HEIGHT ||
                            (newY >= 0 && state.board[newY][newX])) {
                            return true;
                        }
                    }
                }
            }
            return false;
        }
    };

    // --- Game Controller ---
    const Game = {
        async init() {
            console.log("Initializing game...");
            try {
                await this.load();
                console.log("Assets loaded.");
                this.setupEventListeners();
                console.log("Event listeners set up.");
                resetState();
                UIManager.init();
                UIManager.showScreen('start');
                console.log("Game initialized successfully.");
            } catch (err) {
                console.error("Initialization failed:", err);
                document.body.innerHTML = '<h1 style="color:white; text-align:center;">Failed to load game assets. Please refresh.</h1>';
            }
        },
        async load() {
            await AudioManager.init();
            const allPromises = [
                ...Object.entries(assetPaths.images).map(([key, src]) =>
                    new Promise((resolve, reject) => {
                        const img = new Image();
                        img.onload = () => { assets.images[key] = img; resolve(); };
                        img.onerror = (err) => reject(new Error(`Failed to load image ${key} at ${src}: ${err}`));
                        img.src = src;
                    })
                ),
                ...Object.entries(assetPaths.sounds).map(([key, src]) =>
                    fetch(src)
                        .then(res => {
                            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                            return res.arrayBuffer();
                        })
                        .then(buf => audioContext.decodeAudioData(buf))
                        .then(decoded => { assets.sounds[key] = decoded; })
                        .catch(err => { throw new Error(`Failed to load sound ${key} at ${src}: ${err.message}`)} )
                )
            ];
            await Promise.all(allPromises);
        },
        setupEventListeners() {
            elements.startBtn.addEventListener('click', () => this.start(CONSTANTS.GAME_MODES.NORMAL));
            elements.scoreAttackBtn.addEventListener('click', () => this.start(CONSTANTS.GAME_MODES.SCORE_ATTACK));
            elements.howToPlayBtn.addEventListener('click', () => UIManager.showScreen('howto'));
            elements.backToStartBtn.addEventListener('click', () => UIManager.showScreen('start'));
            elements.overlayReturnBtn.addEventListener('click', () => this.quit());
            elements.gamePauseBtn.addEventListener('click', () => this.togglePause());
            elements.gameOverlay.addEventListener('click', () => {
                if (state.isPaused) this.togglePause();
            });

            document.addEventListener('keydown', (e) => {
                if (state.isGameOver) return;
                if (e.code === 'KeyP') {
                    this.togglePause();
                    return;
                }
                if (state.isPaused || state.isProcessing) return;

                switch (e.code) {
                    case 'ArrowLeft': BoardManager.movePiece(-1, 0); break;
                    case 'ArrowRight': BoardManager.movePiece(1, 0); break;
                    case 'ArrowDown':
                        if (BoardManager.movePiece(0, 1)) state.score++;
                        state.dropCounter = 0;
                        break;
                    case 'ArrowUp': case 'Space': BoardManager.rotatePiece(); break;
                    case 'KeyD': BoardManager.hardDrop(); break;
                }
                Renderer.draw();
            });

            // Mobile Controls
            const mobileAction = (action) => (e) => {
                e.preventDefault();
                if (state.isPaused || state.isProcessing) return;
                action();
                Renderer.draw();
            };
            elements.btnLeft.addEventListener('touchstart', mobileAction(() => BoardManager.movePiece(-1, 0)));
            elements.btnRight.addEventListener('touchstart', mobileAction(() => BoardManager.movePiece(1, 0)));
            elements.btnRotate.addEventListener('touchstart', mobileAction(() => BoardManager.rotatePiece()));
            elements.btnSoftDrop.addEventListener('touchstart', mobileAction(() => { if (BoardManager.movePiece(0, 1)) state.score++; }));
            elements.btnHardDrop.addEventListener('touchstart', mobileAction(() => BoardManager.hardDrop()));
        },
        start(mode) {
            AudioManager.resume();
            resetState();
            state.gameMode = mode;

            if (mode === CONSTANTS.GAME_MODES.SCORE_ATTACK) {
                state.timer = CONSTANTS.SCORE_ATTACK_TIME;
                state.level = 9;
                state.goal = Infinity;
            } else {
                state.timer = CONSTANTS.NORMAL_TIME;
                state.level = 1;
                state.goal = 1000;
            }
            state.dropInterval = Math.max(150, 1000 - (state.level - 1) * 50);

            UIManager.showScreen('game');
            UIManager.toggleMobileControls(true);
            UIManager.updateGameUI();
            AudioManager.playBGM();
            BoardManager.spawnNewPiece();
            
            state.lastTime = performance.now();
            state.timerStart = performance.now();
            state.timePaused = 0;
            this.loop();
        },
        loop(timestamp = 0) {
            if (state.isGameOver) return;
            if (state.isPaused) {
                state.gameLoopId = requestAnimationFrame(this.loop.bind(this));
                return;
            }

            // --- Timer Logic ---
            const elapsed = (timestamp - state.timerStart - state.timePaused) / 1000;
            const timeLimit = state.gameMode === CONSTANTS.GAME_MODES.NORMAL ? CONSTANTS.NORMAL_TIME : CONSTANTS.SCORE_ATTACK_TIME;
            state.timer = timeLimit - elapsed;
            UIManager.updateTimer();
            if (state.timer <= 0) {
                this.end("TIME'S UP!");
                return;
            }

            // --- Drop Logic ---
            state.dropCounter += timestamp - state.lastTime;
            state.lastTime = timestamp;

            if (state.dropCounter > state.dropInterval && !state.isProcessing) {
                if (!BoardManager.movePiece(0, 1)) {
                    BoardManager.lockPiece();
                }
                state.dropCounter = 0;
            }

            // --- Updates & Drawing ---
            EffectManager.update();
            this.checkLevelUp();
            if (state.gameMode === CONSTANTS.GAME_MODES.NORMAL) this.checkStageClear();
            UIManager.updateGameUI();
            Renderer.draw();
            state.gameLoopId = requestAnimationFrame(this.loop.bind(this));
        },
        checkLevelUp() {
            const newLevel = Math.floor(state.totalCleared / CONSTANTS.LEVEL_UP_CLEARED) + 1;
            if (newLevel > state.level) {
                state.level = newLevel;
                state.dropInterval = Math.max(150, 1000 - (state.level - 1) * 50);
                EffectManager.addPopup(`LEVEL UP!`);
                AudioManager.playSound('level_up');
            }
        },
        checkStageClear() {
            if (state.score >= state.goal) {
                this.endStage(`STAGE ${state.stage} CLEAR!`);
            }
        },
        async endStage(reason) {
            if (state.isProcessing) return;
            state.isProcessing = true;
            cancelAnimationFrame(state.gameLoopId);
            UIManager.displayOverlay(reason, `Score: ${state.score}`, false);
            AudioManager.playSound('clear');
            await new Promise(res => setTimeout(res, 3000));
            this.nextStage();
        },
        nextStage() {
            state.stage++;
            state.goal += 500;
            state.board.forEach(row => row.fill(null));
            state.score = 0; // Reset score for new stage
            state.isProcessing = false;
            state.currentPiece = null;
            state.dropInterval = Math.max(150, 1000 - (state.level - 1) * 50 - (state.stage - 1) * 25);
            
            UIManager.showScreen('game');
            state.lastTime = performance.now();
            state.timerStart = performance.now();
            state.timePaused = 0;
            this.loop();
            BoardManager.spawnNewPiece();
        },
        togglePause() {
            if (state.isGameOver) return;
            state.isPaused = !state.isPaused;
            UIManager.togglePause(state.isPaused);
            AudioManager.setMute(state.isPaused);
            if (state.isPaused) {
                state.pauseStart = performance.now();
                cancelAnimationFrame(state.gameLoopId);
            } else {
                state.timePaused += performance.now() - state.pauseStart;
                state.lastTime = performance.now();
                this.loop();
            }
        },
        end(reason) {
            if (state.isGameOver) return;
            state.isGameOver = true;
            cancelAnimationFrame(state.gameLoopId);
            UIManager.toggleMobileControls(false);

            if (state.score > state.highScore) {
                state.highScore = state.score;
                localStorage.setItem('fruitHighScore', state.highScore);
                localStorage.setItem('newHighScore', 'true');
            }
            UIManager.displayOverlay(reason, `Final Score: ${state.score}`);
            AudioManager.playSound('level_up'); // Placeholder for game over
        },
        quit() {
            if(state.gameLoopId) cancelAnimationFrame(state.gameLoopId);
            AudioManager.stopBGM();
            resetState();
            UIManager.init();
            UIManager.showScreen('start');
            UIManager.toggleMobileControls(false);
        }
    };

    // --- Initialization ---
    Game.init();

});