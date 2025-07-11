import { BOARD_WIDTH, BOARD_HEIGHT } from '../utils/constants.js';

// 衝突判定を行う関数群

/**
 * 指定された位置が有効かどうかをチェックする
 * @param {object} block - 操作中のブロック
 * @param {Array<Array<any>>} grid - ゲームボードのグリッド
 * @returns {boolean} - 有効な場合はtrue、衝突する場合はfalse
 */
export function isValidMove(block, grid) {
  for (let y = 0; y < block.shape.length; y++) {
    for (let x = 0; x < block.shape[y].length; x++) {
      if (block.shape[y][x]) {
        const boardX = block.x + x;
        const boardY = block.y + y;

        // 1. ボードの壁との衝突判定
        if (boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_HEIGHT) {
          return false;
        }

        // 2. 他の固定ブロックとの衝突判定
        // boardY < 0 は、ボードの上端より上なのでチェック不要
        if (boardY >= 0 && grid[boardY][boardX]) {
          return false;
        }
      }
    }
  }
  return true;
}
