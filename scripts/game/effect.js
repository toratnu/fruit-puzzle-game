// scripts/game/effect.js

export class Effect {
    constructor(ctx) {
        this.ctx = ctx;
        this.effects = [];
        this.cellSize = 30; // Boardと同じセルサイズ
    }

    createClearEffect(positions, isLargeClear) {
        // positions: 消去されたブロックの {x, y} 座標の配列
        // isLargeClear: 5個以上の大規模消去かどうか

        positions.forEach(pos => {
            const centerX = pos.x * this.cellSize + this.cellSize / 2;
            const centerY = pos.y * this.cellSize + this.cellSize / 2;

            const particleCount = isLargeClear ? 30 : 15;
            const particleColor = isLargeClear ? '#FFD700' : '#ADD8E6'; // 金色または水色
            const particleSize = isLargeClear ? 4 : 2;
            const particleSpeed = isLargeClear ? 5 : 3;
            const particleDuration = isLargeClear ? 600 : 400; // ms

            for (let i = 0; i < particleCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const vx = Math.cos(angle) * particleSpeed;
                const vy = Math.sin(angle) * particleSpeed;
                this.effects.push({
                    type: 'particle',
                    x: centerX,
                    y: centerY,
                    vx: vx,
                    vy: vy,
                    size: particleSize,
                    color: particleColor,
                    alpha: 1,
                    duration: particleDuration,
                    startTime: performance.now()
                });
            }
        });

        if (isLargeClear) {
            this.screenShake(300, 0.2); // 0.3秒間、振幅0.2で画面シェイク
        }
    }

    createChainText(chainCount) {
        this.effects.push({
            type: 'chainText',
            text: `${chainCount} CHAIN!`,
            alpha: 1,
            yOffset: 0,
            duration: 1000, // 1秒
            startTime: performance.now(),
            color: this.getChainColor(chainCount)
        });
    }

    getChainColor(chainCount) {
        if (chainCount === 1) return '#ADD8E6'; // 青
        if (chainCount === 2) return '#90EE90'; // 緑
        if (chainCount === 3) return '#FFFF00'; // 黄
        return '#FF4500'; // 赤 (4連鎖以上)
    }

    createLevelUpEffect() {
        this.effects.push({
            type: 'levelUpText',
            text: 'LEVEL UP!',
            alpha: 0,
            scale: 0.5,
            duration: 1200, // 1.2秒
            startTime: performance.now()
        });
    }

    createStageClearEffect() {
        this.effects.push({
            type: 'stageClearText',
            text: 'STAGE CLEAR!',
            alpha: 0,
            scale: 0.5,
            duration: 2000, // 2秒
            startTime: performance.now()
        });
    }

    screenShake(duration, intensity) {
        const canvas = this.ctx.canvas;
        const originalTransform = this.ctx.getTransform();
        const shakeStartTime = performance.now();

        const animateShake = () => {
            const elapsed = performance.now() - shakeStartTime;
            if (elapsed < duration) {
                const translateX = (Math.random() - 0.5) * intensity * 20;
                const translateY = (Math.random() - 0.5) * intensity * 20;
                canvas.style.transform = `translate(${translateX}px, ${translateY}px)`;
                requestAnimationFrame(animateShake);
            } else {
                canvas.style.transform = 'translate(0, 0)'; // 元に戻す
            }
        };
        requestAnimationFrame(animateShake);
    }

    draw() {
        const now = performance.now();
        this.effects = this.effects.filter(effect => {
            const elapsed = now - effect.startTime;
            const progress = elapsed / effect.duration;

            if (progress >= 1) return false; // エフェクト終了

            this.ctx.save();

            if (effect.type === 'particle') {
                effect.x += effect.vx;
                effect.y += effect.vy;
                effect.alpha = 1 - progress;

                this.ctx.globalAlpha = effect.alpha;
                this.ctx.fillStyle = effect.color;
                this.ctx.beginPath();
                this.ctx.arc(effect.x, effect.y, effect.size, 0, Math.PI * 2);
                this.ctx.fill();
            } else if (effect.type === 'chainText') {
                effect.alpha = Math.sin(progress * Math.PI); // 0から1へ、そして0へ
                this.ctx.globalAlpha = effect.alpha;
                this.ctx.font = 'bold 48px Arial';
                this.ctx.fillStyle = effect.color;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(effect.text, this.ctx.canvas.width / 2, this.ctx.canvas.height / 2 - 50 + effect.yOffset);
            } else if (effect.type === 'levelUpText' || effect.type === 'stageClearText') {
                // フェードイン、表示、フェードアウト
                if (progress < 0.2) {
                    effect.alpha = progress / 0.2;
                    effect.scale = 0.5 + 0.5 * (progress / 0.2);
                } else if (progress < 0.8) {
                    effect.alpha = 1;
                    effect.scale = 1;
                } else {
                    effect.alpha = 1 - (progress - 0.8) / 0.2;
                    effect.scale = 1 + 0.5 * ((progress - 0.8) / 0.2);
                }

                this.ctx.globalAlpha = effect.alpha;
                this.ctx.font = `${48 * effect.scale}px Arial`;
                this.ctx.fillStyle = '#FFD700'; // 金色
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(effect.text, this.ctx.canvas.width / 2, this.ctx.canvas.height / 2);
            }

            this.ctx.restore();
            return true;
        });
    }
}