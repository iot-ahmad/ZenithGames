const config = {
    type: Phaser.CANVAS,
    width: 800,
    height: 600,
    backgroundColor: '#3498db',
    parent: document.body,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 800 },
            debug: true
        }
    },
    scene: [BootScene, LevelScene, UIScene],
    pixelArt: true,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

const game = new Phaser.Game(config);
