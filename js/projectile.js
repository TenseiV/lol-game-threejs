export class Projectile {
    constructor(scene, position, direction, isPlayerProjectile = false) {
        this.scene = scene;
        this.position = position.clone();
        this.direction = direction.clone().normalize();
        this.isPlayerProjectile = isPlayerProjectile;
        this.speed = isPlayerProjectile ? 30 : 15;
        this.radius = 0.3;
        this.lifetime = 0;
        this.maxLifetime = 3; // Seconds before automatic removal
        
        // Create a projectile that resembles a LoL skill shot
        this.createProjectile();
    }
    
    createProjectile() {
        // Create different projectiles based on source
        if (this.isPlayerProjectile) {
            // Blue skillshot for player (like Ezreal Q)
            this.createPlayerProjectile();
        } else {
            // Red projectile for enemies
            this.createEnemyProjectile();
        }
        
        // Position the projectile
        this.mesh.position.copy(this.position);
        
        // Orient the projectile in the direction it's traveling
        this.mesh.lookAt(this.position.clone().add(this.direction));
        
        // Add to scene
        this.scene.add(this.mesh);
    }
    
    createPlayerProjectile() {
        // Create a blue energy bolt
        this.mesh = new THREE.Group();
        
        // Main body - elongated to look like a skillshot
        const bodyGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1.5, 8);
        bodyGeometry.rotateX(Math.PI / 2); // Rotate to align with direction
        
        const bodyMaterial = new THREE.MeshBasicMaterial({
            color: 0x0ACBE6,
            transparent: true,
            opacity: 0.8
        });
        
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.mesh.add(body);
        
        // Core - brighter inner part
        const coreGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1.6, 8);
        coreGeometry.rotateX(Math.PI / 2);
        
        const coreMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0.9
        });
        
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        this.mesh.add(core);
    }
    
    createEnemyProjectile() {
        // Create a red energy projectile
        this.mesh = new THREE.Group();
        
        // Main body
        const bodyGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        const bodyMaterial = new THREE.MeshBasicMaterial({
            color: 0xFF3333,
            transparent: true,
            opacity: 0.8
        });
        
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.mesh.add(body);
        
        // Core
        const coreGeometry = new THREE.SphereGeometry(0.15, 8, 8);
        const coreMaterial = new THREE.MeshBasicMaterial({
            color: 0xFF7777,
            transparent: true,
            opacity: 0.9
        });
        
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        this.mesh.add(core);
    }
    
    update(delta) {
        // Update lifetime
        this.lifetime += delta;
        
        // Remove if lifetime exceeded
        if (this.lifetime > this.maxLifetime) {
            this.remove();
            return false;
        }
        
        // Move projectile in its direction
        const moveAmount = this.speed * delta;
        const movement = this.direction.clone().multiplyScalar(moveAmount);
        this.position.add(movement);
        
        // Update mesh position
        this.mesh.position.copy(this.position);
        
        // If player projectile, add a trail effect
        if (this.isPlayerProjectile && Math.random() > 0.7) {
            this.createTrailEffect();
        }
        
        return true;
    }
    
    createTrailEffect() {
        // Create a particle that stays behind and fades out
        const trailGeometry = new THREE.SphereGeometry(0.1, 4, 4);
        const trailMaterial = new THREE.MeshBasicMaterial({
            color: this.isPlayerProjectile ? 0x0ACBE6 : 0xFF3333,
            transparent: true,
            opacity: 0.5
        });
        
        const trail = new THREE.Mesh(trailGeometry, trailMaterial);
        trail.position.copy(this.position);
        this.scene.add(trail);
        
        // Fade out and remove after a short time
        const fadeOutTime = 0.3; // seconds
        let elapsedTime = 0;
        const initialOpacity = trailMaterial.opacity;
        
        const animate = () => {
            elapsedTime += 0.016; // Approximately 60fps
            
            if (elapsedTime < fadeOutTime) {
                const newOpacity = initialOpacity * (1 - elapsedTime / fadeOutTime);
                trailMaterial.opacity = newOpacity;
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(trail);
                trailGeometry.dispose();
                trailMaterial.dispose();
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    remove() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
            // Dispose of geometries and materials to free up memory
            if (this.mesh.children) {
                this.mesh.children.forEach(child => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) child.material.dispose();
                });
            }
        }
    }
} 