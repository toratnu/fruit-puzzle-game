// scripts/game/scoreManager.js

export class ScoreManager {
    constructor(panelUpdater, mode) {
        this.panelUpdater = panelUpdater;
        this.mode = mode;
        this.score = 0;
        this.level = 1;
        this.clearedBlocks = 0;
        this.goalScore = 0;
        this.stage = 1; // ノーマルモード用

        this.LEVEL_UP_THRESHOLD = 32; // 32個消すごとにレベルアップ
        this.NORMAL_MODE_TIME_LIMIT = 90; // ノーマルモードの制限時間
        this.SCORE_ATTACK_TIME_LIMIT = 60; // スコアアタックモードの制限時間
    }

    init() {
        this.score = 0;
        this.clearedBlocks = 0;
        if (this.mode === 'normal') {
            // ステージが1の場合は初期化、それ以外はステージを維持
            if (this.stage === 1) {
                this.level = 1;
            }
            this.goalScore = this.calculateGoalScore(this.stage);
            this.panelUpdater.updateGoal(this.goalScore);
            this.panelUpdater.updateTime(this.NORMAL_MODE_TIME_LIMIT);
        } else { // scoreAttack
            this.level = 9; // スコアアタックはレベル9固定
            this.stage = 1; // スコアアタックはステージ1固定
            this.goalScore = 0; // スコアアタックに目標スコアはない
            this.panelUpdater.updateGoal('---'); // 表示を無効化
            this.panelUpdater.updateTime(this.SCORE_ATTACK_TIME_LIMIT);
        }
        this.panelUpdater.updateScore(this.score);
        this.panelUpdater.updateLevel(this.level);
        this.panelUpdater.updateClearedBlocks(this.clearedBlocks);
    }

    addScore(points) {
        this.score += points;
        this.panelUpdater.updateScore(this.score);
    }

    addClearedBlocks(count) {
        this.clearedBlocks += count;
        this.panelUpdater.updateClearedBlocks(this.clearedBlocks);
    }

    calculateScore(numCleared, chainCount) {
        let baseScore = this.level * 10 * numCleared;
        let quantityBonus = 0;
        if (numCleared >= 5) {
            quantityBonus = (numCleared - 4) * 50; // 例: 5個で50, 6個で100
        }
        let chainBonus = 0;
        if (chainCount > 1) {
            chainBonus = baseScore * (2 ** (chainCount - 1));
        }
        return baseScore + quantityBonus + chainBonus;
    }

    checkLevelUp() {
        const oldLevel = this.level;
        this.level = Math.floor(this.clearedBlocks / this.LEVEL_UP_THRESHOLD) + 1;
        if (this.mode === 'scoreAttack') {
            this.level = 9; // スコアアタックはレベル9固定
        }

        if (this.level > oldLevel) {
            this.panelUpdater.updateLevel(this.level);
            return true;
        }
        return false;
    }

    getDropInterval() {
        // レベルに応じて落下速度を調整 (ms)
        // レベル1: 1000ms, レベル9: 200ms (例)
        return Math.max(100, 1000 - (this.level - 1) * 100);
    }

    calculateGoalScore(stage) {
        // ステージごとの目標スコアを計算
        return stage * 1000; // 例: ステージ1で1000点, ステージ2で2000点
    }

    checkGoalAchieved() {
        return this.score >= this.goalScore;
    }

    getScore() {
        return this.score;
    }

    getLevel() {
        return this.level;
    }

    getStage() {
        return this.stage;
    }

    incrementStage() {
        this.stage++;
        this.score = 0; // スコアをリセット
        this.clearedBlocks = 0; // クリアブロック数をリセット
        // レベルは維持するか、ステージに応じてリセットするかは仕様による
        // 今回はレベルは維持する
        this.goalScore = this.calculateGoalScore(this.stage);
        this.panelUpdater.updateGoal(this.goalScore);
        this.panelUpdater.updateScore(this.score);
        this.panelUpdater.updateClearedBlocks(this.clearedBlocks);
        // タイマーはGameEngineでリセットされる
    }
}