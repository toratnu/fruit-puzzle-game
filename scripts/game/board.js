import { BOARD_WIDTH, BOARD_HEIGHT, BLOCK_SIZE } from '../utils/constants.js';

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
        if (this.grid[y][x]) {
          // TODO: フルーツ画像を描画する処理に置き換える
          this.ctx.fillStyle = 'gray'; // 仮の色
          this.ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
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