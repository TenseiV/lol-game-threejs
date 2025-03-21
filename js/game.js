import { Player } from './player.js';
import { Minion } from './minion.js';
import { Projectile } from './projectile.js';
import { Target } from './target.js';

export class Game {
    constructor(ui) {
        this.ui = ui;
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
        
        // Paramètres de jeu
        this.minionSpawnRate = 3; // en secondes
        this.projectileSpawnRate = 2; // en secondes
        this.targetSpawnRate = 5; // en secondes
        this.lastMinionSpawn = 0;
        this.lastProjectileSpawn = 0;
        this.lastTargetSpawn = 0;
        
        // Contrôles
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            space: false
        };
        
        // Constantes
        this.GROUND_SIZE = 100;
        this.MINION_LIMIT = 10;
        this.PROJECTILE_LIMIT = 15;
        this.TARGET_LIMIT = 5;
        
        // Stats
        this.health = 100;
        this.gold = 0;
        this.score = 0;
    }
    
    init() {
        // Créer la scène
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0A1428);
        
        // Créer la caméra
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 30, 30);
        this.camera.lookAt(0, 0, 0);
        
        // Créer le renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        document.getElementById('game-container').appendChild(this.renderer.domElement);
        
        // Ajouter des lumières
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
        
        // Créer le sol
        const groundGeometry = new THREE.PlaneGeometry(this.GROUND_SIZE, this.GROUND_SIZE);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x1E2328,
            roughness: 0.8,
            metalness: 0.2
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Ajouter des bordures à l'arène
        this.createArena();
        
        // Créer le joueur
        this.player = new Player(this.scene);
        
        // Configurer les contrôles
        this.setupControls();
        
        // Configurer le redimensionnement de la fenêtre
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    createArena() {
        const wallHeight = 5;
        const wallThickness = 1;
        const halfSize = this.GROUND_SIZE / 2;
        
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0xC8AA6E,
            roughness: 0.7,
            metalness: 0.3
        });
        
        // Mur Nord
        const northWall = new THREE.Mesh(
            new THREE.BoxGeometry(this.GROUND_SIZE, wallHeight, wallThickness),
            wallMaterial
        );
        northWall.position.set(0, wallHeight / 2, -halfSize);
        northWall.castShadow = true;
        northWall.receiveShadow = true;
        this.scene.add(northWall);
        
        // Mur Sud
        const southWall = new THREE.Mesh(
            new THREE.BoxGeometry(this.GROUND_SIZE, wallHeight, wallThickness),
            wallMaterial
        );
        southWall.position.set(0, wallHeight / 2, halfSize);
        southWall.castShadow = true;
        southWall.receiveShadow = true;
        this.scene.add(southWall);
        
        // Mur Est
        const eastWall = new THREE.Mesh(
            new THREE.BoxGeometry(wallThickness, wallHeight, this.GROUND_SIZE),
            wallMaterial
        );
        eastWall.position.set(halfSize, wallHeight / 2, 0);
        eastWall.castShadow = true;
        eastWall.receiveShadow = true;
        this.scene.add(eastWall);
        
        // Mur Ouest
        const westWall = new THREE.Mesh(
            new THREE.BoxGeometry(wallThickness, wallHeight, this.GROUND_SIZE),
            wallMaterial
        );
        westWall.position.set(-halfSize, wallHeight / 2, 0);
        westWall.castShadow = true;
        westWall.receiveShadow = true;
        this.scene.add(westWall);
    }
    
    setupControls() {
        // Événements clavier
        window.addEventListener('keydown', (event) => {
            switch (event.code) {
                case 'KeyW': this.keys.forward = true; break;
                case 'KeyS': this.keys.backward = true; break;
                case 'KeyA': this.keys.left = true; break;
                case 'KeyD': this.keys.right = true; break;
                case 'Space': this.keys.space = true; break;
            }
        });
        
        window.addEventListener('keyup', (event) => {
            switch (event.code) {
                case 'KeyW': this.keys.forward = false; break;
                case 'KeyS': this.keys.backward = false; break;
                case 'KeyA': this.keys.left = false; break;
                case 'KeyD': this.keys.right = false; break;
                case 'Space': this.keys.space = false; break;
            }
        });
        
        // Événements de la souris pour viser
        window.addEventListener('mousemove', (event) => {
            if (!this.isGameRunning) return;
            
            // Convertir la position de la souris en coordonnées normalisées (-1 à 1)
            const mouse = new THREE.Vector2();
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            
            // Faire un raycasting pour déterminer où le joueur vise
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, this.camera);
            
            // Calculer l'intersection avec le plan du sol
            const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
            const targetPoint = new THREE.Vector3();
            raycaster.ray.intersectPlane(groundPlane, targetPoint);
            
            // Faire tourner le joueur vers le point ciblé
            this.player.lookAt(targetPoint);
        });
        
        // Tirer avec le clic gauche
        window.addEventListener('mousedown', (event) => {
            if (!this.isGameRunning || event.button !== 0) return;
            
            this.player.shoot();
            const projectile = new Projectile(
                this.scene,
                this.player.position.clone(),
                this.player.getDirection(),
                true
            );
            this.playerProjectiles.push(projectile);
        });
    }
    
    spawnMinion() {
        if (this.minions.length >= this.MINION_LIMIT) return;
        
        // Position aléatoire sur le bord de l'arène
        const side = Math.floor(Math.random() * 4); // 0-3 pour N, E, S, O
        const pos = new THREE.Vector3();
        const halfSize = this.GROUND_SIZE / 2 - 5;
        
        switch (side) {
            case 0: // Nord
                pos.set(
                    Math.random() * this.GROUND_SIZE - halfSize,
                    0,
                    -halfSize
                );
                break;
            case 1: // Est
                pos.set(
                    halfSize,
                    0,
                    Math.random() * this.GROUND_SIZE - halfSize
                );
                break;
            case 2: // Sud
                pos.set(
                    Math.random() * this.GROUND_SIZE - halfSize,
                    0,
                    halfSize
                );
                break;
            case 3: // Ouest
                pos.set(
                    -halfSize,
                    0,
                    Math.random() * this.GROUND_SIZE - halfSize
                );
                break;
        }
        
        const minion = new Minion(this.scene, pos);
        this.minions.push(minion);
    }
    
    spawnEnemyProjectile() {
        if (this.enemyProjectiles.length >= this.PROJECTILE_LIMIT) return;
        
        // Position aléatoire autour de l'arène
        const angle = Math.random() * Math.PI * 2;
        const radius = this.GROUND_SIZE / 2 - 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const pos = new THREE.Vector3(x, 2, z);
        
        // Direction vers le joueur avec légère déviation aléatoire
        const dir = this.player.position.clone().sub(pos).normalize();
        const deviation = 0.2; // Ajustez pour la difficulté
        dir.x += (Math.random() - 0.5) * deviation;
        dir.z += (Math.random() - 0.5) * deviation;
        dir.normalize();
        
        const projectile = new Projectile(this.scene, pos, dir, false);
        this.enemyProjectiles.push(projectile);
    }
    
    spawnTarget() {
        if (this.targets.length >= this.TARGET_LIMIT) return;
        
        // Position aléatoire dans l'arène
        const halfSize = this.GROUND_SIZE / 2 - 10;
        const x = (Math.random() * 2 - 1) * halfSize;
        const z = (Math.random() * 2 - 1) * halfSize;
        const pos = new THREE.Vector3(x, 1, z);
        
        const target = new Target(this.scene, pos);
        this.targets.push(target);
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    update() {
        if (!this.isGameRunning) return;
        
        const delta = this.clock.getDelta();
        const time = this.clock.getElapsedTime();
        
        // Mettre à jour le joueur
        this.player.update(delta, this.keys);
        this.keepInBounds(this.player);
        
        // Mettre à jour la caméra pour suivre le joueur
        const cameraOffset = new THREE.Vector3(0, 30, 30);
        this.camera.position.copy(this.player.position).add(cameraOffset);
        this.camera.lookAt(this.player.position);
        
        // Mettre à jour les sbires
        for (let i = this.minions.length - 1; i >= 0; i--) {
            const minion = this.minions[i];
            minion.update(delta, this.player.position);
            this.keepInBounds(minion);
            
            // Vérifier la collision avec le joueur
            if (this.checkCollision(minion, this.player)) {
                this.health -= 5 * delta;
                this.ui.updateHealth(this.health);
                
                if (this.health <= 0) {
                    this.gameOver();
                    return;
                }
            }
        }
        
        // Mettre à jour les projectiles du joueur
        for (let i = this.playerProjectiles.length - 1; i >= 0; i--) {
            const projectile = this.playerProjectiles[i];
            projectile.update(delta);
            
            if (this.isOutOfBounds(projectile)) {
                projectile.remove();
                this.playerProjectiles.splice(i, 1);
                continue;
            }
            
            // Vérifier les collisions avec les sbires
            for (let j = this.minions.length - 1; j >= 0; j--) {
                const minion = this.minions[j];
                
                if (this.checkCollision(projectile, minion)) {
                    projectile.remove();
                    this.playerProjectiles.splice(i, 1);
                    
                    minion.takeDamage(25);
                    if (minion.health <= 0) {
                        minion.remove();
                        this.minions.splice(j, 1);
                        this.gold += 20;
                        this.score += 10;
                        this.ui.updateGold(this.gold);
                        this.ui.updateScore(this.score);
                    }
                    
                    break;
                }
            }
        }
        
        // Mettre à jour les projectiles ennemis
        for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
            const projectile = this.enemyProjectiles[i];
            projectile.update(delta);
            
            if (this.isOutOfBounds(projectile)) {
                projectile.remove();
                this.enemyProjectiles.splice(i, 1);
                continue;
            }
            
            // Vérifier la collision avec le joueur
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
        
        // Mettre à jour les cibles
        for (let i = this.targets.length - 1; i >= 0; i--) {
            const target = this.targets[i];
            target.update(delta);
            
            // Vérifier les collisions avec les projectiles du joueur
            for (let j = this.playerProjectiles.length - 1; j >= 0; j--) {
                const projectile = this.playerProjectiles[j];
                
                if (this.checkCollision(projectile, target)) {
                    projectile.remove();
                    this.playerProjectiles.splice(j, 1);
                    
                    target.remove();
                    this.targets.splice(i, 1);
                    this.gold += 30;
                    this.score += 25;
                    this.ui.updateGold(this.gold);
                    this.ui.updateScore(this.score);
                    break;
                }
            }
        }
        
        // Spawn de nouveaux ennemis et projectiles
        if (time - this.lastMinionSpawn > this.minionSpawnRate) {
            this.spawnMinion();
            this.lastMinionSpawn = time;
        }
        
        if (time - this.lastProjectileSpawn > this.projectileSpawnRate) {
            this.spawnEnemyProjectile();
            this.lastProjectileSpawn = time;
        }
        
        if (time - this.lastTargetSpawn > this.targetSpawnRate) {
            this.spawnTarget();
            this.lastTargetSpawn = time;
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
        // Nettoyer la scène
        this.isGameRunning = false;
        
        if (this.renderer) {
            this.renderer.domElement.remove();
        }
        
        // Supprimer les objets de la scène
        if (this.player) {
            this.player.remove();
        }
        
        this.minions.forEach(minion => minion.remove());
        this.playerProjectiles.forEach(proj => proj.remove());
        this.enemyProjectiles.forEach(proj => proj.remove());
        this.targets.forEach(target => target.remove());
        
        this.minions = [];
        this.playerProjectiles = [];
        this.enemyProjectiles = [];
        this.targets = [];
        
        // Supprimer les événements
        window.removeEventListener('resize', this.onWindowResize);
    }
} 