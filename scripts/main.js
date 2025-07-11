import { GameEngine } from './game/gameEngine.js';
import { InputHandler } from './ui/inputHandler.js';
import { ScreenManager } from './ui/screenManager.js';
import { PanelUpdater } from './ui/panelUpdater.js';
import { ScoreManager } from './game/scoreManager.js';

let gameEngine;
let inputHandler;
let screenManager;
let panelUpdater;
let scoreManager;

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM Content Loaded.');

  screenManager = new ScreenManager();
  panelUpdater = new PanelUpdater();
  scoreManager = new ScoreManager();

  // 初期ハイスコアを表示
  panelUpdater.updateHighScore(scoreManager.loadHighScore());

  screenManager.init(); // スタート画面を表示

  // ボタンイベントリスナーの設定
  document.getElementById('start-button').addEventListener('click', () => startGame('normal'));
  document.getElementById('score-attack-button').addEventListener('click', () => startGame('scoreAttack'));
  document.getElementById('how-to-play-button').addEventListener('click', () => screenManager.showScreen('howToPlay'));
  document.getElementById('back-to-title-button').addEventListener('click', () => screenManager.showScreen('start'));
  document.getElementById('return-to-title-from-gameover').addEventListener('click', () => screenManager.showScreen('start'));
  document.getElementById('pause-button').addEventListener('click', () => {
    // TODO: ポーズ機能の実装
    console.log('Pause button clicked');
  });
});

function startGame(mode) {
  const canvas = document.getElementById('game-board');
  if (!canvas) {
    console.error('Canvas element not found!');
    return;
  }

  // ゲームエンジンと入力ハンドラを初期化（ゲーム開始時のみ）
  gameEngine = new GameEngine(canvas, screenManager, mode, panelUpdater, scoreManager);
  inputHandler = new InputHandler(gameEngine);

  screenManager.showScreen('game');
  gameEngine.start();
}