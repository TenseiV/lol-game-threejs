export class Minion {
    constructor(scene, position, direction, lane, maxHealth = 100) {
        this.scene = scene;
        this.position = position.clone();
        this.direction = direction || new THREE.Vector3(0, 0, 1);
        this.lane = lane || 'mid';
        this.radius = 1;
        this.speed = 1.5;
        this.maxHealth = maxHealth;
        this.health = maxHealth;
        this.wasHitByPlayer = false;
        this.healthDecayRate = 0.5; // Health points lost per second naturally
        
        // Create minion mesh
        this.mesh = this.createMinionMesh();
        this.mesh.position.copy(this.position);
        this.scene.add(this.mesh);

        // Create health bar
        this.healthBarContainer = this.createHealthBar();
        this.scene.add(this.healthBarContainer);
        this.updateHealthBar();
    }
    
    createMinionMesh() {
        // Create minion body
        const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0xaa3333, // Red for enemy minions
            roughness: 0.7,
            metalness: 0.3
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.8; // Height from ground
        body.castShadow = true;
        
        // Create minion head
        const headGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const headMaterial = new THREE.MeshStandardMaterial({
            color: 0xbb5555,
            roughness: 0.7,
            metalness: 0.2
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.7;
        head.castShadow = true;
        
        // Group for the entire minion
        const minionGroup = new THREE.Group();
        minionGroup.add(body);
        minionGroup.add(head);
        
        return minionGroup;
    }
    
    createHealthBar() {
        const container = new THREE.Group();
        
        // Background bar (black)
        const bgGeometry = new THREE.PlaneGeometry(1.2, 0.15);
        const bgMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.6
        });
        this.healthBarBg = new THREE.Mesh(bgGeometry, bgMaterial);
        
        // Health bar (green when full, turning red as health decreases)
        const barGeometry = new THREE.PlaneGeometry(1.2, 0.15);
        barGeometry.translate(0.6, 0, 0.01); // Align left edge with origin
        this.healthBarMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            side: THREE.DoubleSide
        });
        this.healthBar = new THREE.Mesh(barGeometry, this.healthBarMaterial);
        this.healthBar.position.x = -0.6; // Offset to align left edge with background
        
        container.add(this.healthBarBg);
        container.add(this.healthBar);
        
        // Position the health bar above the minion
        container.position.y = 2.2; // Above minion head
        
        // Make health bar always face the camera
        container.rotation.x = Math.PI / 2;
        
        return container;
    }
    
    updateHealthBar() {
        if (!this.healthBar) return;
        
        // Calculate health percentage
        const healthPercent = Math.max(0, this.health / this.maxHealth);
        
        // Scale health bar based on current health
        this.healthBar.scale.x = healthPercent;
        
        // Update color (green to red gradient based on health)
        const r = Math.floor(255 * (1 - healthPercent));
        const g = Math.floor(255 * healthPercent);
        this.healthBarMaterial.color.setRGB(r/255, g/255, 0);
        
        // Update position to follow minion
        this.healthBarContainer.position.x = this.position.x;
        this.healthBarContainer.position.z = this.position.z;
        
        // Make health bar always face the camera
        // This will be updated in the update method
    }
    
    update(delta) {
        // Naturally decay health over time (like in League of Legends)
        this.health -= this.healthDecayRate * delta;
        
        // Move along lane
        const moveAmount = this.speed * delta;
        const movement = this.direction.clone().multiplyScalar(moveAmount);
        this.position.add(movement);
        this.mesh.position.copy(this.position);
        
        // Update health bar position and orientation
        this.updateHealthBar();
        
        // Always face health bar towards camera
        if (window.camera) {
            const cameraDirection = new THREE.Vector3();
            window.camera.getWorldDirection(cameraDirection);
            cameraDirection.y = 0; // Keep bar horizontal
            this.healthBarContainer.lookAt(
                this.healthBarContainer.position.clone().add(cameraDirection)
            );
        }
    }
    
    takeDamage(amount, fromPlayer = false) {
        this.health -= amount;
        if (fromPlayer) {
            this.wasHitByPlayer = true;
        }
        this.updateHealthBar();
    }
    
    remove() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
        }
        if (this.healthBarContainer) {
            this.scene.remove(this.healthBarContainer);
        }
    }
} 