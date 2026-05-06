class LevelScene extends Phaser.Scene {
    constructor() {
        super('LevelScene');
    }

    create() {
        this.cameras.main.setBounds(0, 0, 3200, 600);
        this.physics.world.setBounds(0, 0, 3200, 600);

        // Background
        this.bg = this.add.tileSprite(0, 0, 800, 600, 'bg').setOrigin(0, 0);
        this.bg.setScrollFactor(0);

        // Ground (Procedural platform for now)
        this.ground = this.add.rectangle(1600, 580, 3200, 40, 0x555555);
        this.physics.add.existing(this.ground, true);

        // Player
        this.player = this.add.rectangle(100, 500, 32, 48, 0x1e90ff); // Blue jacket
        this.physics.add.existing(this.player);
        this.player.body.setCollideWorldBounds(true);
        this.physics.add.collider(this.player, this.ground);

        // Shemagh visual
        this.shemagh = this.add.rectangle(100, 480, 34, 10, 0xffffff);
        this.shemagh.setStrokeStyle(2, 0xff0000);
        
        // Falafels (Currency)
        this.falafels = this.physics.add.group();
        for (let i = 0; i < 15; i++) {
            let f = this.add.circle(300 + i * 150, 400, 10, 0xd4af37);
            this.physics.add.existing(f, true); // static
            this.falafels.add(f);
        }
        this.physics.add.overlap(this.player, this.falafels, this.collectFalafel, null, this);

        // Obstacles (Dallah, Man-hole, Shisha)
        this.obstacles = this.physics.add.group();
        for (let i = 0; i < 3; i++) {
            let obs = this.add.rectangle(600 + i * 800, 540, 40, 40, 0x000000);
            this.physics.add.existing(obs, true);
            this.obstacles.add(obs);
        }
        this.physics.add.collider(this.player, this.obstacles, this.hitObstacle, null, this);

        // Major Ingredient
        this.ingredientSpawned = false;
        this.ingredient = this.add.rectangle(2800, 540, 40, 40, 0x00ff00).setVisible(false);
        this.physics.add.existing(this.ingredient, true);
        this.physics.add.overlap(this.player, this.ingredient, this.collectIngredient, null, this);

        // End Level Door
        this.door = this.add.rectangle(3100, 500, 60, 100, 0x8b4513);
        this.physics.add.existing(this.door, true);
        this.physics.add.overlap(this.player, this.door, this.finishLevel, null, this);

        // Controls
        this.cursors = this.input.keyboard.createCursorKeys();

        this.cameras.main.startFollow(this.player, true, 0.05, 0.05);

        // Bubble setup "يزم علامك"
        this.bubbleGroup = this.add.group();
        this.speechText = this.add.text(0, 0, 'يزم علامك ودنا نتغدا!', {
            fontFamily: 'PixelArabic, Cairo, sans-serif',
            fontSize: '18px',
            color: '#000000',
            backgroundColor: '#ffffe0',
            padding: { x: 5, y: 5 }
        }).setOrigin(0.5, 1).setVisible(false);
        this.speechText.setStroke('#ff0000', 2);
    }

    update() {
        if (!this.player.active) return;

        // Visuals attach to player
        this.shemagh.x = this.player.x;
        this.shemagh.y = this.player.y - 20;

        // Background parallax
        this.bg.tilePositionX = this.cameras.main.scrollX * 0.3;

        // Movement
        if (this.cursors.left.isDown) {
            this.player.body.setVelocityX(-200);
            // Simulate shemagh flapping
            this.shemagh.x += 5; 
        } else if (this.cursors.right.isDown) {
            this.player.body.setVelocityX(200);
            // Simulate shemagh flapping
            this.shemagh.x -= 5;
        } else {
            this.player.body.setVelocityX(0);
        }

        if (this.cursors.up.isDown && this.player.body.touching.down) {
            this.player.body.setVelocityY(-500);
        }

        // Logic check for Major Ingredient
        if (!this.ingredientSpawned && window.gameState.canSpawnMajorIngredient()) {
            this.spawnMajorIngredient();
        }

        // Update speech bubble position
        if (this.speechText.visible) {
            this.speechText.x = this.player.x;
            this.speechText.y = this.player.y - 40;
        }
    }

    collectFalafel(player, falafel) {
        falafel.destroy();
        window.gameState.addFalafel();
        this.events.emit('updateUI');
    }

    spawnMajorIngredient() {
        this.ingredientSpawned = true;
        this.ingredient.setVisible(true);
        // Add a spawn effect
        this.tweens.add({
            targets: this.ingredient,
            y: this.ingredient.y - 20,
            yoyo: true,
            repeat: 3,
            duration: 200
        });
    }

    collectIngredient(player, ingredient) {
        if (!this.ingredientSpawned) return;
        ingredient.destroy();
        window.gameState.collectMajorIngredient();
        this.events.emit('updateUI');
    }

    hitObstacle(player, obstacle) {
        if (player.isInvulnerable) return;

        window.gameState.loseLife();
        this.events.emit('updateUI');

        player.isInvulnerable = true;
        this.tweens.add({
            targets: [this.player, this.shemagh],
            alpha: 0.2,
            yoyo: true,
            repeat: 5,
            duration: 100,
            onComplete: () => { player.isInvulnerable = false; }
        });

        // Push back
        player.body.setVelocityX(player.body.velocity.x > 0 ? -300 : 300);
        player.body.setVelocityY(-300);

        // Check for Event
        if (window.gameState.lives === 1 && !window.gameState.hasTriggeredStarvingEvent) {
            this.triggerStarvingEvent();
        }

        if (window.gameState.lives <= 0) {
            this.scene.restart();
            window.gameState.reset();
            this.events.emit('updateUI');
        }
    }

    triggerStarvingEvent() {
        window.gameState.hasTriggeredStarvingEvent = true;
        
        // Show bubble
        this.speechText.setVisible(true);
        
        // Pulse effect
        this.tweens.add({
            targets: this.speechText,
            scaleX: 1.2,
            scaleY: 1.2,
            yoyo: true,
            repeat: -1,
            duration: 500
        });

        // Change player visual slightly to represent starving
        this.player.fillColor = 0xffa500; // Turn orange-ish
        
        // Womp Womp sound placeholder
        console.log("PLAYING SOUND: 8-bit womp-womp");
    }

    finishLevel(player, door) {
        window.gameState.nextLevel();
        if (window.gameState.currentLevel > 16) {
            alert("Congratulations! You completed Mansaf Quest and gathered all ingredients!");
            window.gameState.reset();
            this.scene.restart();
        } else {
            this.scene.restart();
        }
        this.events.emit('updateUI');
    }
}
