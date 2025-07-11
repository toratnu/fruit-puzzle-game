import { Board } from './board.js';
import { Block } from './block.js';
import { MatchChecker } from './matchChecker.js';
import { isValidMove } from './collision.js';
import { ScoreManager } from './scoreManager.js';
import { DROP_INTERVAL, BLOCK_SIZE } from '../utils/constants.js';
import { PanelUpdater } from '../ui/panelUpdater.js';

// ゲーム全体の進行と状態を管理するクラス
export class GameEngine {
  constructor(canvas, screenManager, mode, panelUpdater, scoreManager) {
    this.screenManager = screenManager;
    this.mode = mode;
    this.panelUpdater = panelUpdater;
    this.scoreManager = scoreManager;
    this.board = new Board(canvas);
    this.matchChecker = new MatchChecker(this.board);
    this.currentBlock = null;
    this.lastDropTime = 0;
    this.isGameOver = false;

    this.gameLoop = this.gameLoop.bind(this);
  }

  // ゲームを開始する
  start() {
    this.scoreManager.reset();
    this.panelUpdater.updateHighScore(this.scoreManager.loadHighScore()); // ハイスコアを初期表示
    this.panelUpdater.updateAll(this.scoreManager);
    this.spawnNewBlock();
    requestAnimationFrame(this.gameLoop);
  }

  // ゲームループ
  gameLoop(currentTime) {
    if (this.isGameOver) {
      console.log("Game Over");
      document.getElementById('final-score').textContent = this.scoreManager.score;
      this.screenManager.showScreen('gameOver');
      return;
    }

    // 落下処理
    if (currentTime - this.lastDropTime > DROP_INTERVAL) {
      this.moveBlock(0, 1);
      this.lastDropTime = currentTime;
    }

    this.update();
    this.draw();

    requestAnimationFrame(this.gameLoop);
  }

  // ゲームの状態を更新
  update() {
    // 現状、更新処理はgameLoop内に集約
  }

  // 全てを描画
  draw() {
    this.board.draw();
    if (this.currentBlock) {
      this.drawBlock(this.currentBlock);
    }
  }

  // 新しいブロックを生成
  spawnNewBlock() {
    this.currentBlock = new Block();
    if (!isValidMove(this.currentBlock, this.board.grid)) {
      this.isGameOver = true;
    }
  }

  // 操作中のブロックを描画
  drawBlock(block) {
    const ctx = this.board.ctx;
    block.fruitGrid.forEach((row, y) => {
      row.forEach((fruitType, x) => {
        if (fruitType && this.board.fruitImages[fruitType]) {
          ctx.drawImage(
            this.board.fruitImages[fruitType],
            (block.x + x) * BLOCK_SIZE,
            (block.y + y) * BLOCK_SIZE,
            BLOCK_SIZE, BLOCK_SIZE
          );
        }
      });
    });
  }

  // ブロックの移動
  moveBlock(dx, dy) {
    if (!this.currentBlock) return;
    const tempBlock = { ...this.currentBlock, x: this.currentBlock.x + dx, y: this.currentBlock.y + dy };

    if (isValidMove(tempBlock, this.board.grid)) {
      this.currentBlock.move(dx, dy);
    } else if (dy > 0) {
      // 下に移動できなければ固定
      this.handleLanding();
    }
  }

  // ブロックの回転
  rotateBlock() {
    if (!this.currentBlock) return;
    const tempBlock = { ...this.currentBlock };
    tempBlock.rotate = () => { // 簡易的な回転メソッドの模倣
        const originalRotation = tempBlock.rotationIndex;
        tempBlock.rotationIndex = (tempBlock.rotationIndex + 1) % tempBlock.rotations.length;
        tempBlock.shape = tempBlock.rotations[tempBlock.rotationIndex];
    };
    tempBlock.rotate();

    if (isValidMove(tempBlock, this.board.grid)) {
      this.currentBlock.rotate();
    } else {
        // TODO: 壁キックなどの回転補正処理
    }
  }

  // ハードドロップ
  hardDrop() {
    if (!this.currentBlock) return;
    while (isValidMove(this.currentBlock, this.board.grid)) {
      this.currentBlock.move(0, 1);
    }
    // 1つ戻して接地
    this.currentBlock.move(0, -1);
    this.handleLanding();
  }

  // ブロック着地時の処理
  handleLanding() {
    this.board.fixBlock(this.currentBlock);
    
    // 固定後に一度重力処理を適用
    this.matchChecker.applyGravity();

    // 消去処理と連鎖チェック
    let chain = 0;
    let clearedCount;
    do {
        clearedCount = this.matchChecker.checkAndClearMatches();
        if(clearedCount > 0){
            chain++;
            console.log(`${chain} CHAIN!`);
            this.scoreManager.addScore(clearedCount, chain);
            this.scoreManager.updateClearedLines(clearedCount); // 消去したブロック数を渡す
            this.panelUpdater.updateAll(this.scoreManager);
        }
    } while (clearedCount > 0);

    this.spawnNewBlock();
  }
}