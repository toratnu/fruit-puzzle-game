// ゲームの時間を管理するクラス
export class Timer {
  constructor(initialTime, onTimeUp) {
    this.initialTime = initialTime;
    this.currentTime = initialTime;
    this.onTimeUp = onTimeUp; // 時間切れ時のコールバック
    this.intervalId = null;
  }

  start() {
    if (this.intervalId) {
      this.stop();
    }
    this.intervalId = setInterval(() => {
      this.currentTime--;
      if (this.currentTime <= 0) {
        this.stop();
        this.onTimeUp();
      }
    }, 1000);
  }

  stop() {
    clearInterval(this.intervalId);
    this.intervalId = null;
  }

  reset() {
    this.stop();
    this.currentTime = this.initialTime;
  }

  getTime() {
    return this.currentTime;
  }
}