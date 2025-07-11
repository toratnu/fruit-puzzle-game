import { BOARD_WIDTH, BOARD_HEIGHT, BLOCK_SIZE, FRUIT_TYPES } from '../utils/constants.js';
import { loadImage } from '../utils/helper.js';

// ゲームボードを管理するクラス
export class Board {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = BOARD_WIDTH * BLOCK_SIZE;
    this.height = BOARD_HEIGHT * BLOCK_SIZE;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.grid = this.createEmptyGrid();
    this.fruitImages = {}; // フルーツ画像を格納するオブジェクト
    this.loadFruitImages();
  }

  // フルーツ画像を事前に読み込む
  async loadFruitImages() {
    for (const fruitType of FRUIT_TYPES) {
      try {
        this.fruitImages[fruitType] = await loadImage(`assets/images/fruits/${fruitType}.png`);
      } catch (error) {
        console.error(`Failed to load image for ${fruitType}:`, error);
      }
    }
  }

  // 空のグリッドを生成する
  createEmptyGrid() {
    return Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(null));
  }

  // グリッド全体を描画する
  draw() {
    this.clear();
    this.drawGridLines();
    this.drawBlocks();
  }

  // キャンバスをクリアする
  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  // グリッド線を描画する
  drawGridLines() {
    this.ctx.strokeStyle = '#333'; // グリッド線の色
    for (let x = 0; x < BOARD_WIDTH; x++) {
      for (let y = 0; y < BOARD_HEIGHT; y++) {
        this.ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
      }
    }
  }

  // 固定されたブロックを描画する
  drawBlocks() {
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        const fruitType = this.grid[y][x];
        if (fruitType && this.fruitImages[fruitType]) {
          this.ctx.drawImage(
            this.fruitImages[fruitType],
            x * BLOCK_SIZE,
            y * BLOCK_SIZE,
            BLOCK_SIZE,
            BLOCK_SIZE
          );
        }
      }
    }
  }

  // ブロックをグリッドに固定する
  fixBlock(block) {
    block.shape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          const boardX = block.x + x;
          const boardY = block.y + y;
          if (boardY >= 0) {
            this.grid[boardY][boardX] = block.fruitGrid[y][x];
          }
        }
      });
    });
  }
}