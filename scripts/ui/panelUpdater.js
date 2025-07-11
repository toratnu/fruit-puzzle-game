// scripts/ui/panelUpdater.js

export class PanelUpdater {
    constructor(board) {
        this.board = board; // Boardインスタンスを受け取る
        this.currentScoreElement = document.getElementById('current-score');
        this.goalScoreElement = document.getElementById('goal-score');
        this.currentLevelElement = document.getElementById('current-level');
        this.clearedBlocksElement = document.getElementById('cleared-blocks');
        this.timeDisplayElement = document.getElementById('time-display');
        this.nextBlockCanvas = document.getElementById('next-block-canvas');
        this.nextBlockCtx = this.nextBlockCanvas.getContext('2d');
        this.normalModeOnlyElements = document.querySelectorAll('.normal-mode-only');
    }

    updateScore(score) {
        this.currentScoreElement.textContent = score;
    }

    updateGoal(goal) {
        this.goalScoreElement.textContent = goal;
    }

    updateLevel(level) {
        this.currentLevelElement.textContent = level;
    }

    updateClearedBlocks(cleared) {
        this.clearedBlocksElement.textContent = cleared;
    }

    updateTime(time) {
        this.timeDisplayElement.textContent = `TIME: ${time}`;
        if (time <= 5 && !this.timeDisplayElement.classList.contains('warning')) {
            this.timeDisplayElement.classList.add('warning');
        } else if (time > 5 && this.timeDisplayElement.classList.contains('warning')) {
            this.timeDisplayElement.classList.remove('warning');
        }
    }

    drawNextBlock(block) {
        this.nextBlockCtx.clearRect(0, 0, this.nextBlockCanvas.width, this.nextBlockCanvas.height);
        if (!block) return;

        const cellSize = 30; // フルーツ画像のサイズに合わせる
        const blockShape = block.shape[block.rotation];
        const blockTypes = block.types[block.rotation];

        // ブロックを中央に描画するためのオフセットを計算
        let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
        for (let r = 0; r < blockShape.length; r++) {
            for (let c = 0; c < blockShape[r].length; c++) {
                if (blockShape[r][c] === 1) {
                    minX = Math.min(minX, c);
                    minY = Math.min(minY, r);
                    maxX = Math.max(maxX, c);
                    maxY = Math.max(maxY, r);
                }
            }
        }
        const blockWidth = maxX - minX + 1;
        const blockHeight = maxY - minY + 1;

        const offsetX = (this.nextBlockCanvas.width - blockWidth * cellSize) / 2;
        const offsetY = (this.nextBlockCanvas.height - blockHeight * cellSize) / 2;

        // BoardからfruitImagesを取得
        const gameBoard = document.getElementById('game-board');
        const gameEngineInstance = gameBoard.__gameEngine__; // gameEngineインスタンスへの参照を仮定
        const fruitImages = gameEngineInstance ? gameEngineInstance.board.fruitImages : {};

        for (let r = 0; r < blockShape.length; r++) {
            for (let c = 0; c < blockShape[r].length; c++) {
                if (blockShape[r][c] === 1) {
                    const fruitType = blockTypes[r][c];
                    const img = this.board.fruitImages[fruitType]; // boardから画像を取得
                    if (img) {
                        this.nextBlockCtx.drawImage(img, offsetX + (c - minX) * cellSize, offsetY + (r - minY) * cellSize, cellSize, cellSize);
                    }
                }
            }
        }
    }

    setModeDisplay(mode) {
        if (mode === 'normal') {
            this.normalModeOnlyElements.forEach(el => el.style.display = 'flex');
        } else {
            this.normalModeOnlyElements.forEach(el => el.style.display = 'none');
        }
    }
}