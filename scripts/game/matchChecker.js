import { BOARD_WIDTH, BOARD_HEIGHT } from '../utils/constants.js';

// フルーツの連結をチェックし、消去と連鎖処理を行うクラス
export class MatchChecker {
  constructor(board) {
    this.board = board;
  }

  /**
   * 消去すべきフルーツの塊を見つけて消去し、消した数を返す
   * @returns {number} 消去したフルーツの総数
   */
  checkAndClearMatches() {
    const matches = this.findMatches();
    if (matches.length === 0) {
      return 0;
    }

    let clearedCount = 0;
    matches.forEach(group => {
      clearedCount += group.length;
      group.forEach(({ x, y }) => {
        this.board.grid[y][x] = null;
      });
    });

    this.applyGravity();
    return clearedCount;
  }

  /**
   * 盤面全体で4つ以上繋がっているフルーツの塊をすべて見つける
   * @returns {Array<Array<{x: number, y: number}>>} - 連結したフルーツの座標グループの配列
   */
  findMatches() {
    const matches = [];
    const visited = Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(false));

    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        if (this.board.grid[y][x] && !visited[y][x]) {
          const fruitType = this.board.grid[y][x];
          const currentGroup = [];
          this.findConnectedFruits(x, y, fruitType, visited, currentGroup);

          if (currentGroup.length >= 4) {
            matches.push(currentGroup);
          }
        }
      }
    }
    return matches;
  }

  /**
   * 深さ優先探索（DFS）で同じ種類のフルーツが繋がっている塊を見つける
   */
  findConnectedFruits(x, y, fruitType, visited, group) {
    if (
      x < 0 || x >= BOARD_WIDTH || y < 0 || y >= BOARD_HEIGHT || // 範囲外
      visited[y][x] || // 訪問済み
      this.board.grid[y][x] !== fruitType // フルーツが違う
    ) {
      return;
    }

    visited[y][x] = true;
    group.push({ x, y });

    // 上下左右を探索
    this.findConnectedFruits(x, y + 1, fruitType, visited, group);
    this.findConnectedFruits(x, y - 1, fruitType, visited, group);
    this.findConnectedFruits(x + 1, y, fruitType, visited, group);
    this.findConnectedFruits(x - 1, y, fruitType, visited, group);
  }

  /**
   * ブロック消去後に、宙に浮いたブロックを落下させる（重力処理）
   */
  applyGravity() {
    for (let x = 0; x < BOARD_WIDTH; x++) {
      let emptyRow = -1;
      // 列の下から上へスキャン
      for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
        if (this.board.grid[y][x] === null && emptyRow === -1) {
          emptyRow = y;
        }
        if (this.board.grid[y][x] !== null && emptyRow !== -1) {
          // ブロックを空きスペースに移動
          this.board.grid[emptyRow][x] = this.board.grid[y][x];
          this.board.grid[y][x] = null;
          emptyRow--;
        }
      }
    }
  }
}