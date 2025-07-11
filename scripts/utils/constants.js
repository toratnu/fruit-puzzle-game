// ゲームの基本的な設定を保持する定数

// 1. ボードのサイズ設定
export const BOARD_WIDTH = 10; // グリッド単位の幅
export const BOARD_HEIGHT = 20; // グリッド単位の高さ
export const BLOCK_SIZE = 30; // 1ブロックあたりのピクセルサイズ

// 2. ブロックの形状定義 (テトリミノ)
// 各形状は回転状態を持つ配列として定義
export const SHAPES = {
  I: {
    rotations: [
      [[1, 1, 1, 1]],
      [[1], [1], [1], [1]],
    ],
    color: 'cyan', // 仮の色
  },
  L: {
    rotations: [
      [[0, 0, 1], [1, 1, 1]],
      [[1, 0], [1, 0], [1, 1]],
      [[1, 1, 1], [1, 0, 0]],
      [[1, 1], [0, 1], [0, 1]],
    ],
    color: 'orange',
  },
  J: {
    rotations: [
      [[1, 0, 0], [1, 1, 1]],
      [[1, 1], [1, 0], [1, 0]],
      [[1, 1, 1], [0, 0, 1]],
      [[0, 1], [0, 1], [1, 1]],
    ],
    color: 'blue',
  },
  T: {
    rotations: [
      [[0, 1, 0], [1, 1, 1]],
      [[1, 0], [1, 1], [1, 0]],
      [[1, 1, 1], [0, 1, 0]],
      [[0, 1], [1, 1], [0, 1]],
    ],
    color: 'purple',
  },
  O: {
    rotations: [
      [[1, 1], [1, 1]],
    ],
    color: 'yellow',
  },
  S: {
    rotations: [
      [[0, 1, 1], [1, 1, 0]],
      [[1, 0], [1, 1], [0, 1]],
    ],
    color: 'green',
  },
  Z: {
    rotations: [
      [[1, 1, 0], [0, 1, 1]],
      [[0, 1], [1, 1], [1, 0]],
    ],
    color: 'red',
  },
};

// 3. フルーツの種類
// 画像ファイル名と対応させる
export const FRUIT_TYPES = [
  'banana',
  'blueberry',
  'cherry',
  'grape',
  'melon',
  'orange',
  'peach',
];

// 4. ゲームの速度設定
export const DROP_INTERVAL = 1000; // 落下間隔 (ミリ秒)