export class Minion {
    constructor(scene, position) {
        this.scene = scene;
        this.position = position;
        this.health = 50;
        this.maxHealth = 50;
        this.speed = 3;
        this.radius = 0.8;
        
        // Créer le modèle du sbire
        this.createModel();
    }
    
    createModel() {
        // Groupe pour contenir toutes les parties du sbire
        this.mesh = new THREE.Group();
        this.mesh.position.copy(this.position);
        this.scene.add(this.mesh);
        
        // Corps du sbire
        const bodyGeometry = new THREE.BoxGeometry(0.8, 1, 0.8);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0xFF5859, // Rouge LoL (sbires rouges)
            roughness: 0.8,
            metalness: 0.2
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.5;
        body.castShadow = true;
        this.mesh.add(body);
        
        // Tête
        const headGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        const headMaterial = new THREE.MeshStandardMaterial({
            color: 0x2B2A28, // Gris foncé
            roughness: 0.5,
            metalness: 0.1
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.2;
        head.castShadow = true;
        this.mesh.add(head);
        
        // Arme (gourdin pour les sbires)
        const weaponGeometry = new THREE.CylinderGeometry(0.1, 0.2, 0.8, 8);
        const weaponMaterial = new THREE.MeshStandardMaterial({
            color: 0x696969, // Gris
            roughness: 0.5,
            metalness: 0.5
        });
        const weapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
        weapon.position.set(0.5, 0.6, 0);
        weapon.rotation.set(0, 0, Math.PI / 4);
        weapon.castShadow = true;
        this.mesh.add(weapon);
        
        // Barre de vie
        this.createHealthBar();
    }
    
    createHealthBar() {
        const healthBarWidth = 1;
        const healthBarHeight = 0.1;
        
        // Conteneur de la barre de vie
        this.healthBarContainer = new THREE.Mesh(
            new THREE.PlaneGeometry(healthBarWidth, healthBarHeight),
            new THREE.MeshBasicMaterial({
                color: 0x333333,
                transparent: true,
                opacity: 0.8
            })
        );
        this.healthBarContainer.rotation.x = -Math.PI / 2;
        this.healthBarContainer.position.y = 1.8;
        this.mesh.add(this.healthBarContainer);
        
        // Barre de vie actuelle
        this.healthBar = new THREE.Mesh(
            new THREE.PlaneGeometry(healthBarWidth, healthBarHeight),
            new THREE.MeshBasicMaterial({
                color: 0x00FF00,
                transparent: true,
                opacity: 0.8
            })
        );
        this.healthBar.rotation.x = -Math.PI / 2;
        this.healthBar.position.y = 1.81; // Légèrement au-dessus pour éviter le z-fighting
        this.mesh.add(this.healthBar);
        
        // Mettre à jour la barre de vie initiale
        this.updateHealthBar();
    }
    
    updateHealthBar() {
        const healthRatio = this.health / this.maxHealth;
        this.healthBar.scale.x = Math.max(0, healthRatio);
        this.healthBar.position.x = (healthRatio - 1) / 2;
        
        // Changer la couleur en fonction de la santé
        if (healthRatio > 0.6) {
            this.healthBar.material.color.setHex(0x00FF00); // Vert
        } else if (healthRatio > 0.3) {
            this.healthBar.material.color.setHex(0xFFFF00); // Jaune
        } else {
            this.healthBar.material.color.setHex(0xFF0000); // Rouge
        }
    }
    
    update(deltaTime, playerPosition) {
        // Déplacer le sbire vers le joueur
        const direction = new THREE.Vector3();
        direction.subVectors(playerPosition, this.position).normalize();
        
        const moveDistance = this.speed * deltaTime;
        this.position.add(direction.multiplyScalar(moveDistance));
        
        // Faire tourner le sbire vers le joueur
        this.mesh.lookAt(playerPosition.x, this.position.y, playerPosition.z);
        
        // Mettre à jour la position du mesh
        this.mesh.position.copy(this.position);
    }
    
    takeDamage(amount) {
        this.health -= amount;
        this.updateHealthBar();
    }
    
    remove() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
        }
    }
} 