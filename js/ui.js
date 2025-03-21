export class UI {
    constructor() {
        // UI elements
        this.healthElement = document.getElementById('health-value');
        this.goldElement = document.getElementById('gold-value');
        this.scoreElement = document.getElementById('score-value');
        this.timerElement = document.getElementById('timer-value');
        
        // Game over screen elements
        this.finalScoreElement = document.getElementById('final-score');
        this.finalGoldElement = document.getElementById('final-gold');
        this.finalTimeElement = document.getElementById('final-time');
        
        // Initial values
        this.health = 100;
        this.gold = 0;
        this.score = 0;
        this.time = 0;
        
        // Game timer
        this.gameTimer = null;
    }
    
    // Update health points
    updateHealth(health) {
        this.health = health;
        this.healthElement.textContent = Math.max(0, Math.floor(health));
    }
    
    // Update gold
    updateGold(gold) {
        this.gold = gold;
        this.goldElement.textContent = gold;
    }
    
    // Update score
    updateScore(score) {
        this.score = score;
        this.scoreElement.textContent = score;
    }
    
    // Start timer
    startTimer() {
        this.time = 0;
        this.timerElement.textContent = '0';
        
        this.gameTimer = setInterval(() => {
            this.time += 1;
            this.timerElement.textContent = this.time;
        }, 1000);
    }
    
    // Stop timer
    stopTimer() {
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
    }
    
    // Show game over screen
    showGameOver() {
        this.finalScoreElement.textContent = this.score;
        this.finalGoldElement.textContent = this.gold;
        this.finalTimeElement.textContent = this.time;
        
        document.getElementById('game-over-screen').classList.remove('hidden');
    }
    
    // Reset UI
    reset() {
        this.updateHealth(100);
        this.updateGold(0);
        this.updateScore(0);
        this.stopTimer();
        this.time = 0;
        this.timerElement.textContent = '0';
    }
} 