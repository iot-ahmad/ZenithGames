class GameState {
    constructor() {
        this.reset();
        
        // Define the ingredient mapping per level (1 to 16)
        this.levelRewards = [
            { level: 1, type: 'Jameed', part: 1 }, { level: 2, type: 'Jameed', part: 2 },
            { level: 3, type: 'Jameed', part: 3 }, { level: 4, type: 'Jameed', part: 4 },
            { level: 5, type: 'Meat', part: 1 }, { level: 6, type: 'Meat', part: 2 },
            { level: 7, type: 'Meat', part: 3 }, { level: 8, type: 'Meat', part: 4 },
            { level: 9, type: 'Rice', part: 1 }, { level: 10, type: 'Rice', part: 2 },
            { level: 11, type: 'Rice', part: 3 }, { level: 12, type: 'Rice', part: 4 },
            { level: 13, type: 'Shrak', part: 1 }, { level: 14, type: 'Shrak', part: 2 },
            { level: 15, type: 'Shrak', part: 3 }, { level: 16, type: 'Shrak', part: 4 }
        ];
    }

    reset() {
        this.lives = 3;
        this.falafelCount = 0;
        this.currentLevel = 1;
        this.collectedIngredients = {
            'Jameed': 0,
            'Meat': 0,
            'Rice': 0,
            'Shrak': 0
        };
        this.hasTriggeredStarvingEvent = false;
    }

    loseLife() {
        if (this.lives > 0) {
            this.lives--;
        }
    }

    addFalafel() {
        this.falafelCount++;
    }

    canSpawnMajorIngredient() {
        return this.falafelCount >= 10;
    }

    collectMajorIngredient() {
        const reward = this.levelRewards.find(r => r.level === this.currentLevel);
        if (reward) {
            this.collectedIngredients[reward.type]++;
        }
    }

    nextLevel() {
        this.currentLevel++;
        this.falafelCount = 0; // Reset falafel count per level
    }
}

// Global instance
window.gameState = new GameState();
