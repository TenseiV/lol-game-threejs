import { Game } from './game.js';
import { UI } from './ui.js';
import { KeyBindings } from './keybindings.js';

// Start the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const ui = new UI();
    const keyBindings = new KeyBindings();
    let game = null;

    // Button to start the game
    const startButton = document.getElementById('start-button');
    startButton.addEventListener('click', () => {
        document.getElementById('start-screen').classList.add('hidden');
        
        // Initialize the game
        game = new Game(ui, keyBindings);
        game.start();
    });

    // Button to show settings
    const settingsButton = document.getElementById('settings-button');
    settingsButton.addEventListener('click', () => {
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('settings-screen').classList.remove('hidden');
        
        // Update keybinding buttons to show current settings
        keyBindings.updateUI();
    });
    
    // Button to go back from settings
    const backButton = document.getElementById('back-button');
    backButton.addEventListener('click', () => {
        document.getElementById('settings-screen').classList.add('hidden');
        document.getElementById('start-screen').classList.remove('hidden');
    });

    // Button to restart the game
    const restartButton = document.getElementById('restart-button');
    restartButton.addEventListener('click', () => {
        document.getElementById('game-over-screen').classList.add('hidden');
        
        // Reset and start a new game
        game.dispose();
        game = new Game(ui, keyBindings);
        game.start();
    });
    
    // Initialize keybinding UI
    const keybindButtons = document.querySelectorAll('.keybind-button');
    keybindButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove listening class from all buttons
            keybindButtons.forEach(btn => btn.classList.remove('listening'));
            
            // Add listening class to current button
            button.classList.add('listening');
            button.textContent = 'Press Key';
            
            // Listen for next keypress
            const keyListener = (e) => {
                e.preventDefault();
                
                // Update keybinding
                const action = button.getAttribute('data-action');
                keyBindings.setBinding(action, e.code);
                
                // Update button text
                button.textContent = keyBindings.getKeyName(e.code);
                button.classList.remove('listening');
                
                // Remove event listener
                document.removeEventListener('keydown', keyListener);
            };
            
            // Add event listener for the next key press
            document.addEventListener('keydown', keyListener, { once: true });
        });
    });
}); 