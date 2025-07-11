// scripts/ui/soundManager.js

export class SoundManager {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.bgmBuffer = null;
        this.bgmSource = null;
        this.soundBuffers = {};
        this.isMuted = false; // ミュート状態を管理

        this.loadSounds();
    }

    async loadSounds() {
        const soundFiles = {
            bgm: 'assets/sounds/bgm.m4a',
            land: 'assets/sounds/land.mp3',
            clear: 'assets/sounds/clear.mp3',
            chain: 'assets/sounds/chain.mp3',
            level_up: 'assets/sounds/level_up.mp3',
            // gameOver: 'assets/sounds/level_up.mp3', // 仮
            // stageClear: 'assets/sounds/clear.mp3', // 仮
        };

        for (const key in soundFiles) {
            if (key === 'bgm') {
                this.bgmBuffer = await this.loadAudio(soundFiles[key]);
            } else {
                this.soundBuffers[key] = await this.loadAudio(soundFiles[key]);
            }
        }
        console.log("All sounds loaded.");
    }

    async loadAudio(url) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            return await this.audioContext.decodeAudioData(arrayBuffer);
        } catch (error) {
            console.error('Error loading audio:', url, error);
            return null;
        }
    }

    playBGM() {
        if (this.bgmBuffer && !this.isMuted) {
            this.stopBGM(); // 既存のBGMを停止
            this.bgmSource = this.audioContext.createBufferSource();
            this.bgmSource.buffer = this.bgmBuffer;
            this.bgmSource.loop = true; // ループ再生
            this.bgmSource.connect(this.audioContext.destination);
            this.bgmSource.start(0);
        }
    }

    stopBGM() {
        if (this.bgmSource) {
            this.bgmSource.stop();
            this.bgmSource.disconnect();
            this.bgmSource = null;
        }
    }

    playSound(key) {
        if (this.soundBuffers[key] && !this.isMuted) {
            const source = this.audioContext.createBufferSource();
            source.buffer = this.soundBuffers[key];
            source.connect(this.audioContext.destination);
            source.start(0);
            source.onended = () => {
                source.disconnect();
            };
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.stopBGM();
        } else {
            // BGMが再生中だった場合、ミュート解除時に再開
            // 現状はゲーム開始時にplayBGMが呼ばれるため、ここでは何もしない
        }
    }

    // 必要に応じて音量調整機能などを追加
}
