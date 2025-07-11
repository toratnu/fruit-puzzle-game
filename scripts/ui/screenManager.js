// 画面表示を管理するクラス
export class ScreenManager {
  constructor() {
    this.screens = {
      start: document.getElementById('start-screen'),
      howToPlay: document.getElementById('how-to-play-screen'),
      game: document.getElementById('game-screen'),
      gameOver: document.getElementById('game-over-screen'),
    };
    this.currentScreen = null;
  }

  // 指定された画面を表示し、他の画面を非表示にする
  showScreen(screenName) {
    for (const key in this.screens) {
      if (this.screens[key]) {
        this.screens[key].classList.add('hidden');
        this.screens[key].classList.remove('active');
      }
    }
    if (this.screens[screenName]) {
      this.screens[screenName].classList.remove('hidden');
      this.screens[screenName].classList.add('active');
      this.currentScreen = screenName;
    }
  }

  // 初期画面を表示
  init() {
    this.showScreen('start');
  }
}