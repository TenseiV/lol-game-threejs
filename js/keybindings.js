export class KeyBindings {
    constructor() {
        // Default key bindings
        this.bindings = {
            forward: 'KeyW',
            backward: 'KeyS',
            left: 'KeyA',
            right: 'KeyD'
        };
        
        // Load saved bindings from localStorage if available
        this.loadBindings();
    }
    
    // Get the current binding for an action
    getBinding(action) {
        return this.bindings[action] || null;
    }
    
    // Set a new binding for an action
    setBinding(action, keyCode) {
        if (action in this.bindings) {
            this.bindings[action] = keyCode;
            this.saveBindings();
        }
    }
    
    // Check if a key is pressed for an action
    isActionPressed(action, pressedKeys) {
        const binding = this.getBinding(action);
        return binding && pressedKeys[binding];
    }
    
    // Get a friendly name for a key code
    getKeyName(keyCode) {
        // Handle special cases
        switch (keyCode) {
            case 'KeyW': return 'W';
            case 'KeyA': return 'A';
            case 'KeyS': return 'S';
            case 'KeyD': return 'D';
            case 'KeyQ': return 'Q';
            case 'KeyE': return 'E';
            case 'KeyR': return 'R';
            case 'Space': return 'Space';
            case 'ShiftLeft': return 'Shift';
            case 'ControlLeft': return 'Ctrl';
            case 'AltLeft': return 'Alt';
            case 'ArrowUp': return '↑';
            case 'ArrowDown': return '↓';
            case 'ArrowLeft': return '←';
            case 'ArrowRight': return '→';
            default:
                // Extract the key part from the key code (e.g., "KeyA" -> "A")
                if (keyCode.startsWith('Key')) {
                    return keyCode.substring(3);
                }
                if (keyCode.startsWith('Digit')) {
                    return keyCode.substring(5);
                }
                return keyCode;
        }
    }
    
    // Save bindings to localStorage
    saveBindings() {
        try {
            localStorage.setItem('lolGameKeyBindings', JSON.stringify(this.bindings));
        } catch (e) {
            console.error('Failed to save key bindings:', e);
        }
    }
    
    // Load bindings from localStorage
    loadBindings() {
        try {
            const savedBindings = localStorage.getItem('lolGameKeyBindings');
            if (savedBindings) {
                const parsed = JSON.parse(savedBindings);
                for (const action in parsed) {
                    if (action in this.bindings) {
                        this.bindings[action] = parsed[action];
                    }
                }
            }
        } catch (e) {
            console.error('Failed to load key bindings:', e);
        }
    }
    
    // Update the UI to show current bindings
    updateUI() {
        const keybindButtons = document.querySelectorAll('.keybind-button');
        keybindButtons.forEach(button => {
            const action = button.getAttribute('data-action');
            if (action && this.bindings[action]) {
                button.textContent = this.getKeyName(this.bindings[action]);
            }
        });
    }
} 