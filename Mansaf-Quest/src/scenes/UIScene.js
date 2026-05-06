class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene', active: false });
    }

    create() {
        this.falafelText = this.add.text(16, 16, 'Falafel: 0/10', { fontSize: '24px', fill: '#fff', stroke: '#000', strokeThickness: 4 });
        this.livesText = this.add.text(16, 50, 'Lives: 3', { fontSize: '24px', fill: '#ff0000', stroke: '#000', strokeThickness: 4 });
        this.levelText = this.add.text(400, 16, 'Level: 1', { fontSize: '24px', fill: '#fff', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5, 0);
        
        this.jameedText = this.add.text(650, 16, 'Jameed: 0/4', { fontSize: '18px', fill: '#fff', stroke: '#000', strokeThickness: 3 });
        this.meatText = this.add.text(650, 40, 'Meat: 0/4', { fontSize: '18px', fill: '#fff', stroke: '#000', strokeThickness: 3 });
        this.riceText = this.add.text(650, 64, 'Rice: 0/4', { fontSize: '18px', fill: '#fff', stroke: '#000', strokeThickness: 3 });
        this.shrakText = this.add.text(650, 88, 'Shrak: 0/4', { fontSize: '18px', fill: '#fff', stroke: '#000', strokeThickness: 3 });

        const levelScene = this.scene.get('LevelScene');
        levelScene.events.on('updateUI', this.updateUI, this);
        this.updateUI();
    }

    updateUI() {
        this.falafelText.setText(`Falafel: ${window.gameState.falafelCount}/10`);
        if (window.gameState.falafelCount >= 10) {
            this.falafelText.setColor('#00ff00');
        } else {
            this.falafelText.setColor('#ffffff');
        }

        this.livesText.setText(`Lives: ${window.gameState.lives}`);
        this.levelText.setText(`Level: ${window.gameState.currentLevel}`);
        
        this.jameedText.setText(`Jameed: ${window.gameState.collectedIngredients['Jameed']}/4`);
        this.meatText.setText(`Meat: ${window.gameState.collectedIngredients['Meat']}/4`);
        this.riceText.setText(`Rice: ${window.gameState.collectedIngredients['Rice']}/4`);
        this.shrakText.setText(`Shrak: ${window.gameState.collectedIngredients['Shrak']}/4`);
    }
}
