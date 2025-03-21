export class Target {
    constructor(scene, position) {
        this.scene = scene;
        this.position = position.clone();
        this.radius = 0.7;
        this.speed = 5;
        
        // Direction aléatoire pour le mouvement
        this.direction = new THREE.Vector3(
            Math.random() * 2 - 1,
            0,
            Math.random() * 2 - 1
        ).normalize();
        
        // Durée de vie en secondes avant changement de direction
        this.directionChangeTime = 2;
        this.timeSinceDirectionChange = 0;
        
        // Créer le modèle de la cible
        this.createModel();
    }
    
    createModel() {
        // Groupe pour contenir toutes les parties de la cible
        this.mesh = new THREE.Group();
        this.mesh.position.copy(this.position);
        this.scene.add(this.mesh);
        
        // Corps principal de la cible (anneau)
        const ringGeometry = new THREE.TorusGeometry(this.radius, 0.1, 16, 32);
        const ringMaterial = new THREE.MeshStandardMaterial({
            color: 0xC8AA6E, // Or LoL
            roughness: 0.3,
            metalness: 0.7,
            emissive: 0xC8AA6E,
            emissiveIntensity: 0.2
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        ring.castShadow = true;
        this.mesh.add(ring);
        
        // Centre de la cible
        const centerGeometry = new THREE.SphereGeometry(this.radius * 0.3, 16, 16);
        const centerMaterial = new THREE.MeshStandardMaterial({
            color: 0xFF9900, // Orange
            roughness: 0.2,
            metalness: 0.8,
            emissive: 0xFF9900,
            emissiveIntensity: 0.3
        });
        const center = new THREE.Mesh(centerGeometry, centerMaterial);
        center.castShadow = true;
        this.mesh.add(center);
        
        // Effet flottant
        this.initialY = this.position.y;
        
        // Lumière pour la mise en évidence
        const targetLight = new THREE.PointLight(0xC8AA6E, 0.5, 3);
        this.mesh.add(targetLight);
        
        // Particules autour de la cible (effet visuel)
        this.particles = [];
        const particleGeometry = new THREE.SphereGeometry(0.05, 4, 4);
        const particleMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFD700,
            transparent: true,
            opacity: 0.7
        });
        
        for (let i = 0; i < 10; i++) {
            const particle = new THREE.Mesh(particleGeometry, particleMaterial.clone());
            
            // Positionner les particules autour de la cible
            const angle = (i / 10) * Math.PI * 2;
            const radius = this.radius * 1.2;
            particle.position.set(
                Math.cos(angle) * radius,
                (Math.random() - 0.5) * 0.5,
                Math.sin(angle) * radius
            );
            
            // Ajouter des propriétés pour l'animation
            particle.userData = {
                originalPos: particle.position.clone(),
                speed: 0.5 + Math.random() * 0.5,
                offset: Math.random() * Math.PI * 2
            };
            
            this.mesh.add(particle);
            this.particles.push(particle);
        }
    }
    
    update(deltaTime) {
        // Mise à jour de la position en fonction de la direction
        this.timeSinceDirectionChange += deltaTime;
        
        if (this.timeSinceDirectionChange > this.directionChangeTime) {
            // Changer de direction
            this.direction = new THREE.Vector3(
                Math.random() * 2 - 1,
                0,
                Math.random() * 2 - 1
            ).normalize();
            
            this.timeSinceDirectionChange = 0;
        }
        
        // Déplacer la cible
        const moveDistance = this.speed * deltaTime;
        this.position.add(this.direction.clone().multiplyScalar(moveDistance));
        
        // Effet flottant (oscillation verticale)
        const time = performance.now() * 0.001; // Temps en secondes
        this.position.y = this.initialY + Math.sin(time * 2) * 0.2;
        
        // Faire tourner la cible
        this.mesh.rotation.y += deltaTime * 1.5;
        
        // Mettre à jour la position du mesh
        this.mesh.position.copy(this.position);
        
        // Animer les particules
        this.particles.forEach((particle) => {
            const data = particle.userData;
            const particleTime = time * data.speed + data.offset;
            
            // Mouvement oscillant des particules
            particle.position.x = data.originalPos.x + Math.sin(particleTime) * 0.1;
            particle.position.y = data.originalPos.y + Math.cos(particleTime) * 0.1;
            particle.position.z = data.originalPos.z + Math.sin(particleTime + Math.PI/4) * 0.1;
            
            // Pulsation d'opacité
            particle.material.opacity = 0.4 + Math.sin(particleTime * 2) * 0.3;
        });
    }
    
    remove() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh = null;
            this.particles = [];
        }
    }
} 