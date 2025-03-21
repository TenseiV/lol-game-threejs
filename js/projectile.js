export class Projectile {
    constructor(scene, position, direction, isPlayerProjectile) {
        this.scene = scene;
        this.position = position.clone();
        this.direction = direction.clone();
        this.isPlayerProjectile = isPlayerProjectile;
        this.speed = isPlayerProjectile ? 20 : 12; // Les projectiles du joueur sont plus rapides
        this.radius = 0.3;
        
        // Créer le modèle du projectile
        this.createModel();
    }
    
    createModel() {
        const geometry = new THREE.SphereGeometry(this.radius, 8, 8);
        
        // Couleur différente selon l'origine du projectile
        const material = new THREE.MeshStandardMaterial({
            color: this.isPlayerProjectile ? 0x0AC8B9 : 0xFF5859, // Turquoise pour joueur, rouge pour ennemis
            roughness: 0.2,
            metalness: 0.8,
            emissive: this.isPlayerProjectile ? 0x0AC8B9 : 0xFF5859,
            emissiveIntensity: 0.5
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        this.scene.add(this.mesh);
        
        // Ajouter une lumière pour l'effet brillant
        this.light = new THREE.PointLight(
            this.isPlayerProjectile ? 0x0AC8B9 : 0xFF5859,
            0.7,
            3
        );
        this.light.position.copy(this.position);
        this.scene.add(this.light);
        
        // Effet de traînée (particules)
        if (this.isPlayerProjectile) {
            // Créer le système de traînée pour les projectiles du joueur
            const trailGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
            const trailMaterial = new THREE.MeshBasicMaterial({
                color: 0x0AC8B9,
                transparent: true,
                opacity: 0.7
            });
            
            this.trail = [];
            for (let i = 0; i < 5; i++) {
                const trailPart = new THREE.Mesh(trailGeometry, trailMaterial);
                trailPart.visible = false;
                this.scene.add(trailPart);
                this.trail.push({
                    mesh: trailPart,
                    position: this.position.clone(),
                    age: i * 0.05
                });
            }
        }
    }
    
    update(deltaTime) {
        // Déplacer le projectile dans sa direction
        const moveDistance = this.speed * deltaTime;
        const movement = this.direction.clone().multiplyScalar(moveDistance);
        this.position.add(movement);
        
        // Mettre à jour la position du mesh et de la lumière
        this.mesh.position.copy(this.position);
        this.light.position.copy(this.position);
        
        // Effet de rotation pour les projectiles
        this.mesh.rotation.x += deltaTime * 2;
        this.mesh.rotation.y += deltaTime * 3;
        
        // Mettre à jour la traînée pour les projectiles du joueur
        if (this.isPlayerProjectile && this.trail) {
            for (let i = 0; i < this.trail.length; i++) {
                const trailPart = this.trail[i];
                trailPart.age += deltaTime;
                
                if (trailPart.age > 0.05) {
                    trailPart.age = 0;
                    trailPart.position.copy(this.position);
                    trailPart.mesh.position.copy(this.position);
                    trailPart.mesh.visible = true;
                    
                    // Faire disparaître progressivement
                    trailPart.mesh.material.opacity = 0.7;
                    setTimeout(() => {
                        if (trailPart.mesh) {
                            trailPart.mesh.material.opacity *= 0.8;
                        }
                    }, 50);
                    setTimeout(() => {
                        if (trailPart.mesh) {
                            trailPart.mesh.material.opacity *= 0.8;
                        }
                    }, 100);
                    setTimeout(() => {
                        if (trailPart.mesh) {
                            trailPart.mesh.visible = false;
                        }
                    }, 150);
                }
            }
        }
    }
    
    remove() {
        // Nettoyer le projectile et ses effets
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh = null;
        }
        
        if (this.light) {
            this.scene.remove(this.light);
            this.light = null;
        }
        
        // Nettoyer la traînée
        if (this.trail) {
            for (let i = 0; i < this.trail.length; i++) {
                if (this.trail[i].mesh) {
                    this.scene.remove(this.trail[i].mesh);
                    this.trail[i].mesh = null;
                }
            }
            this.trail = null;
        }
    }
} 