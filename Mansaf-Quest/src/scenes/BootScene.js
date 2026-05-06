class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // Load the AI generated assets
        this.load.image('bg', 'assets/bg.png');
        this.load.image('spritesheet', 'assets/spritesheet.png'); 
    }

    create() {
        this.scene.start('LevelScene');
        this.scene.start('UIScene');
    }
}
