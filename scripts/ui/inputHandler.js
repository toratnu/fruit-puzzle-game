// キーボード入力を管理するクラス
export class InputHandler {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    this.setupEventListeners();
  }

  setupEventListeners() {
    document.addEventListener('keydown', (e) => this.handleKeyPress(e));
  }

  handleKeyPress(e) {
    if (!this.gameEngine.currentBlock) return;

    switch (e.key) {
      case 'ArrowLeft':
        this.gameEngine.moveBlock(-1, 0);
        break;
      case 'ArrowRight':
        this.gameEngine.moveBlock(1, 0);
        break;
      case 'ArrowDown':
        this.gameEngine.moveBlock(0, 1); // ソフトドロップ
        break;
      case 'ArrowUp':
      case ' ': // Spaceキー
        e.preventDefault(); // Spaceで画面がスクロールするのを防ぐ
        this.gameEngine.rotateBlock();
        break;
      case 'd':
      case 'D':
        this.gameEngine.hardDrop();
        break;
      case 'p':
      case 'P':
        // TODO: ポーズ機能の実装
        break;
    }
  }
}
