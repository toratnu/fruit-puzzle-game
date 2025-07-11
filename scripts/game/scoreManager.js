// スコアとレベルを管理するクラス
export class ScoreManager {
  constructor() {
    this.score = 0;
    this.level = 1;
    this.clearedLines = 0; // 消去したライン数（ブロック数ではない）
    this.goal = 0; // ノーマルモードの目標スコア
    this.highScore = this.loadHighScore();
  }

  // スコアを加算する
  addScore(clearedBlocks, chain) {
    // 基本スコア = レベル * 10 * 消去数
    let baseScore = this.level * 10 * clearedBlocks;

    // 連鎖ボーナス = 基本スコア * 2^(連鎖数 - 1)
    if (chain > 1) {
      baseScore *= Math.pow(2, chain - 1);
    }

    this.score += baseScore;
    this.updateHighScore();
  }

  // 消去したライン数を更新し、レベルアップをチェックする
  updateClearedLines(lines) {
    this.clearedLines += lines;
    // 32個消去でレベルアップ（仕様書より）
    if (this.clearedLines >= this.level * 32) {
      this.levelUp();
    }
  }

  // レベルアップ処理
  levelUp() {
    this.level++;
    console.log(`LEVEL UP! Current Level: ${this.level}`);
    // TODO: レベルアップ時の演出と効果音
  }

  // ハイスコアを更新する
  updateHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.saveHighScore();
    }
  }

  // ハイスコアをLocalStorageから読み込む
  loadHighScore() {
    const savedHighScore = localStorage.getItem('fruitPuzzleHighScore');
    const highScore = savedHighScore ? parseInt(savedHighScore, 10) : 0;
    console.log('Loaded High Score:', highScore);
    return highScore;
  }

  // ハイスコアをLocalStorageに保存する
  saveHighScore() {
    console.log('Saving High Score:', this.highScore);
    localStorage.setItem('fruitPuzzleHighScore', this.highScore);
  }

  // ゲーム開始時にスコアとレベルをリセットする
  reset() {
    this.score = 0;
    this.level = 1;
    this.clearedLines = 0;
    // this.goal = 0; // モードによって設定されるため、ここではリセットしない
  }
}
