// scripts/ui/screenManager.js

export class ScreenManager {
    constructor(startScreen, howToPlayScreen, gameScreen, gameOverScreen) {
        this.startScreen = startScreen;
        this.howToPlayScreen = howToPlayScreen;
        this.gameScreen = gameScreen;
        this.gameOverScreen = gameOverScreen;

        this.screens = [
            this.startScreen,
            this.howToPlayScreen,
            this.gameScreen,
            this.gameOverScreen
        ];
    }

    hideAllScreens() {
        this.screens.forEach(screen => {
            if (screen) {
                screen.classList.remove('active');
            }
        });
    }

    showScreen(screenElement) {
        this.hideAllScreens();
        if (screenElement) {
            screenElement.classList.add('active');
        }
    }

    showStartScreen() {
        this.showScreen(this.startScreen);
    }

    showHowToPlayScreen() {
        this.showScreen(this.howToPlayScreen);
    }

    showGameScreen() {
        this.showScreen(this.gameScreen);
    }

    showGameOverScreen() {
        this.showScreen(this.gameOverScreen);
    }
}
