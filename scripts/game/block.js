import { SHAPES, FRUIT_TYPES } from '../utils/constants.js';

// 新しいブロックを生成するクラス
export class Block {
  constructor() {
    this.reset();
  }

  // ブロックの状態を初期化・リセットする
  reset() {
    // 1. ランダムな形状を選択
    const shapeKeys = Object.keys(SHAPES);
    this.shapeKey = shapeKeys[Math.floor(Math.random() * shapeKeys.length)];
    const shapeData = SHAPES[this.shapeKey];
    this.rotations = shapeData.rotations;
    this.rotationIndex = 0;
    this.shape = this.rotations[this.rotationIndex];

    // 2. 初期位置を設定 (ボード中央の上部)
    this.x = Math.floor((10 - this.shape[0].length) / 2); // BOARD_WIDTHは10
    this.y = 0;

    // 3. 各セルにランダムなフルーツを割り当てる
    this.fruitGrid = this.shape.map(row =>
      row.map(cell => (cell ? this.getRandomFruit() : null))
    );
  }

  // ランダムなフルーツの種類を返すヘルパーメソッド
  getRandomFruit() {
    return FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)];
  }

  // ブロックを回転させる
  rotate() {
    this.rotationIndex = (this.rotationIndex + 1) % this.rotations.length;
    const newShape = this.rotations[this.rotationIndex];

    // 回転後のフルーツグリッドを再生成
    const newFruitGrid = newShape.map(row =>
      row.map(cell => (cell ? this.getRandomFruit() : null))
    );

    // TODO: ここで回転後のフルーツを引き継ぐ処理が必要
    // 現状はランダムに再割り当てしているが、仕様に合わせて修正する

    this.shape = newShape;
    this.fruitGrid = newFruitGrid;
  }

  // ブロックを移動させる
  move(dx, dy) {
    this.x += dx;
    this.y += dy;
  }
}
