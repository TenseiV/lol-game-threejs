import { Player } from './player.js';
import { Minion } from './minion.js';
import { Projectile } from './projectile.js';
import { Target } from './target.js';

export class Game {
    constructor(ui, keyBindings) {
        this.ui = ui;
        this.keyBindings = keyBindings;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.player = null;
        this.minions = [];
        this.enemyProjectiles = [];
        this.playerProjectiles = [];
        this.targets = [];
        this.clock = new THREE.Clock();
        this.isGameRunning = false;
        
        // Game parameters
        this.minionWaveTime = 30; // Time between minion waves in seconds
        this.lastMinionWave = 0;
        this.minionWavesSpawned = 0;
        this.minionsPerWave = 6; // Minions per wave
        this.minionLanes = ['top', 'mid', 'bot']; // Minion lanes
        this.projectileSpawnRate = 4; // in seconds
        this.lastProjectileSpawn = 0;
        
        // Controls
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            space: false
        };
        
        // Mouse position for player movement
        this.mousePosition = new THREE.Vector2();
        this.isMouseDown = false;
        
        // Constants
        this.GROUND_SIZE = 100;
        this.MINION_LIMIT = 50;
        this.PROJECTILE_LIMIT = 15;
        
        // Stats
        this.health = 100;
        this.gold = 0;
        this.score = 0;
    }
    
    init() {
        // Create the scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0A1428);
        
        // Create the camera (isometric view like LoL)
        this.camera = new THREE.OrthographicCamera(
            window.innerWidth / -20,
            window.innerWidth / 20,
            window.innerHeight / 20,
            window.innerHeight / -20,
            1,
            1000
        );
        
        // Position the camera for isometric view
        this.camera.position.set(40, 60, 40); // Adjust these values to get the right angle
        this.camera.lookAt(0, 0, 0);
        
        // Make camera globally accessible for health bars
        window.camera = this.camera;
        
        // Create the renderer (optimized for performance)
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.getElementById('game-container').appendChild(this.renderer.domElement);
        
        // Add lights
        const ambientLight = new THREE.AmbientLight(0x6b7c85, 0.7);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 100, 50);
        directionalLight.castShadow = true;
        
        // Optimize shadow settings
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -60;
        directionalLight.shadow.camera.right = 60;
        directionalLight.shadow.camera.top = 60;
        directionalLight.shadow.camera.bottom = -60;
        
        this.scene.add(directionalLight);
        
        // Create the ground (Summoner's Rift style)
        this.createSummonersRift();
        
        // Create the player champion
        this.player = new Player(this.scene);
        
        // Setup controls
        this.setupControls();
        
        // Setup window resizing
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    createSummonersRift() {
        // Create the ground texture
        const groundSize = this.GROUND_SIZE;
        const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize, 32, 32);
        
        // Summoner's Rift green/blue tint
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x23411c,
            roughness: 0.8,
            metalness: 0.2
        });
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Create lanes (3 main lanes as in LoL)
        this.createLanes();
        
        // Create jungle area with decorative elements
        this.createJungle();
    }
    
    createLanes() {
        const halfSize = this.GROUND_SIZE / 2;
        const laneWidth = 8;
        
        // Lane material (more grayish like LoL lanes)
        const laneMaterial = new THREE.MeshStandardMaterial({
            color: 0x7e7865,
            roughness: 0.7,
            metalness: 0.1
        });
        
        // Top lane
        const topLane = new THREE.Mesh(
            new THREE.PlaneGeometry(laneWidth, this.GROUND_SIZE),
            laneMaterial
        );
        topLane.rotation.x = -Math.PI / 2;
        topLane.position.set(-halfSize/2, 0.01, 0);
        topLane.receiveShadow = true;
        this.scene.add(topLane);
        
        // Mid lane
        const midLane = new THREE.Mesh(
            new THREE.PlaneGeometry(laneWidth, this.GROUND_SIZE),
            laneMaterial
        );
        midLane.rotation.x = -Math.PI / 2;
        midLane.rotation.z = Math.PI / 2;
        midLane.position.set(0, 0.01, 0);
        midLane.receiveShadow = true;
        this.scene.add(midLane);
        
        // Bot lane
        const botLane = new THREE.Mesh(
            new THREE.PlaneGeometry(laneWidth, this.GROUND_SIZE),
            laneMaterial
        );
        botLane.rotation.x = -Math.PI / 2;
        botLane.position.set(halfSize/2, 0.01, 0);
        botLane.receiveShadow = true;
        this.scene.add(botLane);
        
        // Create lane markers for spawning (invisible, just for positioning)
        this.laneSpawnPoints = {
            top: new THREE.Vector3(-halfSize/2, 0, -halfSize),
            mid: new THREE.Vector3(-halfSize, 0, -halfSize/2),
            bot: new THREE.Vector3(halfSize/2, 0, -halfSize)
        };
        
        this.laneDirections = {
            top: new THREE.Vector3(0, 0, 1).normalize(),
            mid: new THREE.Vector3(1, 0, 1).normalize(),
            bot: new THREE.Vector3(0, 0, 1).normalize()
        };
    }
    
    createJungle() {
        // Add some jungle elements like trees and rocks
        const treeCount = 30;
        const rockCount = 20;
        const halfSize = this.GROUND_SIZE / 2 - 5;
        
        // Simple tree geometry
        const treeGeometry = new THREE.ConeGeometry(2, 8, 8);
        const treeMaterial = new THREE.MeshStandardMaterial({
            color: 0x0e6b0e,
            roughness: 0.8,
            metalness: 0.1
        });
        
        // Tree trunk
        const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 4, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({
            color: 0x5c3a21,
            roughness: 0.8,
            metalness: 0.1
        });
        
        // Rock geometry
        const rockGeometry = new THREE.DodecahedronGeometry(1.5, 0);
        const rockMaterial = new THREE.MeshStandardMaterial({
            color: 0x777777,
            roughness: 0.9,
            metalness: 0.1
        });
        
        // Create trees
        for (let i = 0; i < treeCount; i++) {
            // Keep trees away from lanes
            let x, z;
            do {
                x = (Math.random() * 2 - 1) * halfSize;
                z = (Math.random() * 2 - 1) * halfSize;
            } while (
                Math.abs(x) < 6 && Math.abs(z) < halfSize ||  // Mid lane
                Math.abs(x - halfSize/2) < 6 && Math.abs(z) < halfSize ||  // Bot lane
                Math.abs(x + halfSize/2) < 6 && Math.abs(z) < halfSize     // Top lane
            );
            
            const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
            trunk.position.set(x, 2, z);
            trunk.castShadow = true;
            trunk.receiveShadow = true;
            this.scene.add(trunk);
            
            const tree = new THREE.Mesh(treeGeometry, treeMaterial);
            tree.position.set(x, 6, z);
            tree.castShadow = true;
            tree.receiveShadow = true;
            this.scene.add(tree);
        }
        
        // Create rocks
        for (let i = 0; i < rockCount; i++) {
            // Keep rocks away from lanes
            let x, z;
            do {
                x = (Math.random() * 2 - 1) * halfSize;
                z = (Math.random() * 2 - 1) * halfSize;
            } while (
                Math.abs(x) < 6 && Math.abs(z) < halfSize ||  // Mid lane
                Math.abs(x - halfSize/2) < 6 && Math.abs(z) < halfSize ||  // Bot lane
                Math.abs(x + halfSize/2) < 6 && Math.abs(z) < halfSize     // Top lane
            );
            
            const rock = new THREE.Mesh(rockGeometry, rockMaterial);
            rock.position.set(x, 0.5, z);
            rock.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            rock.scale.set(
                0.5 + Math.random() * 0.5,
                0.5 + Math.random() * 0.5,
                0.5 + Math.random() * 0.5
            );
            rock.castShadow = true;
            rock.receiveShadow = true;
            this.scene.add(rock);
        }
    }
    
    setupControls() {
        // Mouse controls for movement (like in LoL)
        this.renderer.domElement.addEventListener('mousedown', (event) => {
            if (!this.isGameRunning) return;
            
            // Right click for movement
            if (event.button === 2) {
                this.isMouseDown = true;
                
                // Get the clicked point in 3D space
                this.updateMousePosition(event);
                
                // Move the player to the clicked position
                this.movePlayerToMousePosition();
            }
            
            // Left click for shooting
            if (event.button === 0) {
                this.updateMousePosition(event);
                
                // Get clicked position in world space
                const targetPoint = this.getMouseWorldPosition();
                
                // Aim at the clicked position
                this.player.lookAtPosition(targetPoint);
                
                // Calculate direction from player to click point
                const direction = new THREE.Vector3()
                    .subVectors(targetPoint, this.player.position)
                    .normalize();
                
                // Shoot
                this.player.shoot();
                const projectile = new Projectile(
                    this.scene,
                    this.player.position.clone().add(new THREE.Vector3(0, 1, 0)),
                    direction,
                    true
                );
                this.playerProjectiles.push(projectile);
            }
        });
        
        this.renderer.domElement.addEventListener('mouseup', (event) => {
            if (event.button === 2) {
                this.isMouseDown = false;
            }
        });
        
        this.renderer.domElement.addEventListener('mousemove', (event) => {
            if (!this.isGameRunning) return;
            
            this.updateMousePosition(event);
            
            // If right mouse button is held down, keep moving the player
            if (this.isMouseDown) {
                this.movePlayerToMousePosition();
            }
        });
        
        // Prevent context menu on right-click
        this.renderer.domElement.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
        
        // Keyboard events (for alternative controls)
        window.addEventListener('keydown', (event) => {
            // Check custom key bindings
            if (event.code === this.keyBindings.getBinding('forward')) this.keys.forward = true;
            if (event.code === this.keyBindings.getBinding('backward')) this.keys.backward = true;
            if (event.code === this.keyBindings.getBinding('left')) this.keys.left = true;
            if (event.code === this.keyBindings.getBinding('right')) this.keys.right = true;
            if (event.code === 'Space') this.keys.space = true;
        });
        
        window.addEventListener('keyup', (event) => {
            // Check custom key bindings
            if (event.code === this.keyBindings.getBinding('forward')) this.keys.forward = false;
            if (event.code === this.keyBindings.getBinding('backward')) this.keys.backward = false;
            if (event.code === this.keyBindings.getBinding('left')) this.keys.left = false;
            if (event.code === this.keyBindings.getBinding('right')) this.keys.right = false;
            if (event.code === 'Space') this.keys.space = false;
        });
    }
    
    updateMousePosition(event) {
        // Convert mouse position to normalized coordinates (-1 to 1)
        this.mousePosition.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mousePosition.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }
    
    getMouseWorldPosition() {
        // Create a ray from the camera through the mouse position
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(this.mousePosition, this.camera);
        
        // Calculate intersection with the ground plane
        const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const targetPoint = new THREE.Vector3();
        raycaster.ray.intersectPlane(groundPlane, targetPoint);
        
        return targetPoint;
    }
    
    movePlayerToMousePosition() {
        const targetPoint = this.getMouseWorldPosition();
        this.player.moveToPosition(targetPoint);
    }
    
    spawnMinionWave() {
        if (this.minions.length >= this.MINION_LIMIT) return;
        
        console.log("Spawning minion wave", this.minionWavesSpawned + 1);
        
        // Increase minion count every few waves
        const minionsPerLane = this.minionsPerWave + Math.floor(this.minionWavesSpawned / 3);
        
        // Spawn minions in each lane
        for (const lane of this.minionLanes) {
            const spawnPoint = this.laneSpawnPoints[lane].clone();
            const direction = this.laneDirections[lane].clone();
            
            // Add some randomness to spacing
            for (let i = 0; i < minionsPerLane; i++) {
                // Offset position based on position in wave and add slight randomness
                const offset = i * 3;
                const randomOffset = new THREE.Vector3(
                    (Math.random() - 0.5) * 2,
                    0,
                    (Math.random() - 0.5) * 2
                );
                
                const minionPos = spawnPoint.clone().add(
                    direction.clone().multiplyScalar(-offset)
                ).add(randomOffset);
                
                // Create a minion
                const minion = new Minion(
                    this.scene,
                    minionPos,
                    direction.clone(),
                    lane,
                    10 + Math.floor(this.minionWavesSpawned / 2) * 5 // Scale HP with wave number
                );
                
                this.minions.push(minion);
            }
        }
        
        this.minionWavesSpawned++;
    }
    
    spawnEnemyProjectile() {
        if (this.enemyProjectiles.length >= this.PROJECTILE_LIMIT) return;
        
        // Randomly select a few minions to shoot projectiles
        const shootingMinions = this.minions.filter(() => Math.random() < 0.05);
        
        for (const minion of shootingMinions) {
            if (this.enemyProjectiles.length >= this.PROJECTILE_LIMIT) break;
            
            // Direction towards player with slight random deviation
            const dir = this.player.position.clone().sub(minion.position).normalize();
            const deviation = 0.2; // Adjust for difficulty
            dir.x += (Math.random() - 0.5) * deviation;
            dir.z += (Math.random() - 0.5) * deviation;
            dir.normalize();
            
            const projectile = new Projectile(
                this.scene,
                minion.position.clone().add(new THREE.Vector3(0, 1, 0)),
                dir,
                false
            );
            this.enemyProjectiles.push(projectile);
        }
    }
    
    onWindowResize() {
        // Update orthographic camera on window resize
        const aspect = window.innerWidth / window.innerHeight;
        this.camera.left = window.innerWidth / -20;
        this.camera.right = window.innerWidth / 20;
        this.camera.top = window.innerHeight / 20;
        this.camera.bottom = window.innerHeight / -20;
        
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    update() {
        if (!this.isGameRunning) return;
        
        const delta = this.clock.getDelta();
        const time = this.clock.getElapsedTime();
        
        // Update player (keyboard controls as fallback)
        this.player.update(delta, this.keys);
        this.keepInBounds(this.player);
        
        // Spawn new minion wave
        if (time - this.lastMinionWave > this.minionWaveTime) {
            this.spawnMinionWave();
            this.lastMinionWave = time;
        }
        
        // Spawn enemy projectiles
        if (time - this.lastProjectileSpawn > this.projectileSpawnRate) {
            this.spawnEnemyProjectile();
            this.lastProjectileSpawn = time;
        }
        
        // Update minions
        for (let i = this.minions.length - 1; i >= 0; i--) {
            const minion = this.minions[i];
            minion.update(delta);
            this.keepInBounds(minion);
            
            // Check collision with player
            if (this.checkCollision(minion, this.player)) {
                this.health -= 5 * delta;
                this.ui.updateHealth(this.health);
                
                if (this.health <= 0) {
                    this.gameOver();
                    return;
                }
            }
            
            // Remove dead minions
            if (minion.health <= 0) {
                // Check if player got the last hit
                if (minion.wasHitByPlayer) {
                    this.gold += 20;
                    this.score += 10;
                    this.ui.updateGold(this.gold);
                    this.ui.updateScore(this.score);
                }
                
                minion.remove();
                this.minions.splice(i, 1);
            }
        }
        
        // Update player projectiles
        for (let i = this.playerProjectiles.length - 1; i >= 0; i--) {
            const projectile = this.playerProjectiles[i];
            projectile.update(delta);
            
            if (this.isOutOfBounds(projectile)) {
                projectile.remove();
                this.playerProjectiles.splice(i, 1);
                continue;
            }
            
            // Check collisions with minions
            for (let j = this.minions.length - 1; j >= 0; j--) {
                const minion = this.minions[j];
                
                if (this.checkCollision(projectile, minion)) {
                    projectile.remove();
                    this.playerProjectiles.splice(i, 1);
                    
                    minion.takeDamage(25, true); // Mark as hit by player
                    break;
                }
            }
        }
        
        // Update enemy projectiles
        for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
            const projectile = this.enemyProjectiles[i];
            projectile.update(delta);
            
            if (this.isOutOfBounds(projectile)) {
                projectile.remove();
                this.enemyProjectiles.splice(i, 1);
                continue;
            }
            
            // Check collision with player
            if (this.checkCollision(projectile, this.player)) {
                projectile.remove();
                this.enemyProjectiles.splice(i, 1);
                
                this.health -= 10;
                this.ui.updateHealth(this.health);
                
                if (this.health <= 0) {
                    this.gameOver();
                    return;
                }
            }
        }
        
        // Render
        this.renderer.render(this.scene, this.camera);
    }
    
    keepInBounds(entity) {
        const halfSize = this.GROUND_SIZE / 2 - 2;
        entity.position.x = Math.max(-halfSize, Math.min(halfSize, entity.position.x));
        entity.position.z = Math.max(-halfSize, Math.min(halfSize, entity.position.z));
    }
    
    isOutOfBounds(entity) {
        const halfSize = this.GROUND_SIZE / 2;
        return (
            entity.position.x < -halfSize ||
            entity.position.x > halfSize ||
            entity.position.z < -halfSize ||
            entity.position.z > halfSize
        );
    }
    
    checkCollision(entity1, entity2) {
        const distance = entity1.position.distanceTo(entity2.position);
        return distance < (entity1.radius + entity2.radius);
    }
    
    start() {
        this.init();
        this.ui.reset();
        this.ui.startTimer();
        this.health = 100;
        this.gold = 0;
        this.score = 0;
        this.minionWavesSpawned = 0;
        this.lastMinionWave = 0;
        this.isGameRunning = true;
        
        // Animation loop
        const animate = () => {
            if (!this.isGameRunning) return;
            requestAnimationFrame(animate);
            this.update();
        };
        
        animate();
    }
    
    gameOver() {
        this.isGameRunning = false;
        this.ui.stopTimer();
        this.ui.showGameOver();
    }
    
    dispose() {
        // Clean up the scene
        this.isGameRunning = false;
        
        if (this.renderer) {
            this.renderer.domElement.remove();
        }
        
        // Remove objects from the scene
        if (this.player) {
            this.player.remove();
        }
        
        this.minions.forEach(minion => minion.remove());
        this.playerProjectiles.forEach(proj => proj.remove());
        this.enemyProjectiles.forEach(proj => proj.remove());
        
        this.minions = [];
        this.playerProjectiles = [];
        this.enemyProjectiles = [];
        
        // Remove event listeners
        window.removeEventListener('resize', this.onWindowResize);
    }
} 