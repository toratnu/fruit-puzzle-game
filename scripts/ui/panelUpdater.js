// UIパネルの表示を更新するクラス
export class PanelUpdater {
  constructor() {
    this.scoreDisplay = document.getElementById('score-display');
    this.goalDisplay = document.getElementById('goal-display');
    this.levelDisplay = document.getElementById('level-display');
    this.clearedDisplay = document.getElementById('cleared-display');
    this.highScoreDisplay = document.getElementById('high-score');
    this.timeDisplay = document.getElementById('time-display');
    // NEXTブロックのCanvasは後で実装
    // フィーバーゲージは後で実装
  }

  updateScore(score) {
    this.scoreDisplay.textContent = score;
  }

  updateGoal(goal) {
    this.goalDisplay.textContent = goal;
  }

  updateLevel(level) {
    this.levelDisplay.textContent = level;
  }

  updateCleared(cleared) {
    this.clearedDisplay.textContent = cleared;
  }

  updateHighScore(highScore) {
    this.highScoreDisplay.textContent = highScore;
  }

  updateTime(time) {
    this.timeDisplay.textContent = `TIME: ${time}`;
  }

  // 全てのUIを更新する（ゲーム開始時や状態変化時）
  updateAll(scoreManager) {
    this.updateScore(scoreManager.score);
    this.updateGoal(scoreManager.goal);
    this.updateLevel(scoreManager.level);
    this.updateCleared(scoreManager.clearedLines);
    this.updateHighScore(scoreManager.highScore);
  }
}
