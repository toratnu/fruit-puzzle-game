import { GameEngine } from './game/gameEngine.js';
import { InputHandler } from './ui/inputHandler.js';

// DOMが読み込まれたらゲームを開始
document.addEventListener('DOMContentLoaded', () => {
  console.log('Game starting...');

  const canvas = document.getElementById('game-board');
  if (!canvas) {
    console.error('Canvas element not found!');
    return;
  }

  // ゲームエンジンと入力ハンドラを初期化
  const gameEngine = new GameEngine(canvas);
  new InputHandler(gameEngine);

  // ゲーム開始
  gameEngine.start();
});
