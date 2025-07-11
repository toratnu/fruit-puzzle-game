// scripts/game/timer.js

export class Timer {
    constructor(panelUpdater, mode) {
        this.panelUpdater = panelUpdater;
        this.mode = mode;
        this.initialTime = (mode === 'normal') ? 90 : 60; // ノーマル90秒、スコアアタック60秒
        this.timeRemaining = this.initialTime;
        this.timerInterval = null;
        this.onTimeUp = null;
    }

    init() {
        this.timeRemaining = this.initialTime;
        this.panelUpdater.updateTime(this.timeRemaining);
        this.stop();
    }

    start(onTimeUpCallback) {
        this.onTimeUp = onTimeUpCallback;
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        this.timerInterval = setInterval(() => {
            this.timeRemaining--;
            this.panelUpdater.updateTime(this.timeRemaining);
            if (this.timeRemaining <= 0) {
                this.stop();
                if (this.onTimeUp) {
                    this.onTimeUp();
                }
            }
        }, 1000);
    }

    stop() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    pause() {
        this.stop();
    }

    resume() {
        this.start(this.onTimeUp);
    }

    getTimeRemaining() {
        return this.timeRemaining;
    }
}
