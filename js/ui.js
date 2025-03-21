export class UI {
    constructor() {
        // Éléments d'interface
        this.healthElement = document.getElementById('health-value');
        this.goldElement = document.getElementById('gold-value');
        this.scoreElement = document.getElementById('score-value');
        this.timerElement = document.getElementById('timer-value');
        
        // Éléments pour l'écran de fin
        this.finalScoreElement = document.getElementById('final-score');
        this.finalGoldElement = document.getElementById('final-gold');
        this.finalTimeElement = document.getElementById('final-time');
        
        // Valeurs initiales
        this.health = 100;
        this.gold = 0;
        this.score = 0;
        this.time = 0;
        
        // Timer de jeu
        this.gameTimer = null;
    }
    
    // Mettre à jour les points de vie
    updateHealth(health) {
        this.health = health;
        this.healthElement.textContent = Math.max(0, Math.floor(health));
    }
    
    // Mettre à jour l'or
    updateGold(gold) {
        this.gold = gold;
        this.goldElement.textContent = gold;
    }
    
    // Mettre à jour le score
    updateScore(score) {
        this.score = score;
        this.scoreElement.textContent = score;
    }
    
    // Démarrer le chronomètre
    startTimer() {
        this.time = 0;
        this.timerElement.textContent = '0';
        
        this.gameTimer = setInterval(() => {
            this.time += 1;
            this.timerElement.textContent = this.time;
        }, 1000);
    }
    
    // Arrêter le chronomètre
    stopTimer() {
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
    }
    
    // Afficher l'écran de fin
    showGameOver() {
        this.finalScoreElement.textContent = this.score;
        this.finalGoldElement.textContent = this.gold;
        this.finalTimeElement.textContent = this.time;
        
        document.getElementById('game-over-screen').classList.remove('hidden');
    }
    
    // Réinitialiser l'interface
    reset() {
        this.updateHealth(100);
        this.updateGold(0);
        this.updateScore(0);
        this.stopTimer();
        this.time = 0;
        this.timerElement.textContent = '0';
    }
} 