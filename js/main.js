import { Game } from './game.js';
import { UI } from './ui.js';

// Démarrer le jeu lorsque le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    const ui = new UI();
    let game = null;

    // Bouton pour démarrer le jeu
    const startButton = document.getElementById('start-button');
    startButton.addEventListener('click', () => {
        document.getElementById('start-screen').classList.add('hidden');
        
        // Initialiser le jeu
        game = new Game(ui);
        game.start();
    });

    // Bouton pour redémarrer le jeu
    const restartButton = document.getElementById('restart-button');
    restartButton.addEventListener('click', () => {
        document.getElementById('game-over-screen').classList.add('hidden');
        
        // Réinitialiser et démarrer un nouveau jeu
        game.dispose();
        game = new Game(ui);
        game.start();
    });
}); 