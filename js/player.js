export class Player {
    constructor(scene) {
        this.scene = scene;
        this.position = new THREE.Vector3(0, 1, 0);
        this.rotation = new THREE.Euler(0, 0, 0);
        this.moveSpeed = 10;
        this.turnSpeed = 2;
        this.radius = 1;
        
        // Créer le modèle du joueur
        this.createModel();
    }
    
    createModel() {
        // Groupe pour contenir toutes les parties du joueur
        this.mesh = new THREE.Group();
        this.mesh.position.copy(this.position);
        this.scene.add(this.mesh);
        
        // Corps du champion (style LoL)
        const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x5383E8, // Bleu League of Legends
            roughness: 0.7,
            metalness: 0.3
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.75;
        body.castShadow = true;
        this.mesh.add(body);
        
        // Tête
        const headGeometry = new THREE.SphereGeometry(0.4, 16, 16);
        const headMaterial = new THREE.MeshStandardMaterial({
            color: 0xF0E6D2, // Beige clair pour le visage
            roughness: 0.5,
            metalness: 0.1
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.7;
        head.castShadow = true;
        this.mesh.add(head);
        
        // Arme (bâton magique)
        const staffGeometry = new THREE.CylinderGeometry(0.05, 0.05, 2, 8);
        const staffMaterial = new THREE.MeshStandardMaterial({
            color: 0x785A28, // Or/bronze LoL
            roughness: 0.2,
            metalness: 0.8
        });
        const staff = new THREE.Mesh(staffGeometry, staffMaterial);
        staff.position.set(0.5, 0.75, 0);
        staff.rotation.set(0, 0, -Math.PI / 4);
        staff.castShadow = true;
        this.mesh.add(staff);
        
        // Orbe magique au bout du bâton
        const orbGeometry = new THREE.SphereGeometry(0.15, 16, 16);
        const orbMaterial = new THREE.MeshStandardMaterial({
            color: 0x0AC8B9, // Bleu turquoise brillant
            roughness: 0.1,
            metalness: 0.9,
            emissive: 0x0AC8B9,
            emissiveIntensity: 0.5
        });
        const orb = new THREE.Mesh(orbGeometry, orbMaterial);
        orb.position.set(0.9, 1.2, 0);
        this.mesh.add(orb);
        
        // Lumière pour l'orbe
        const orbLight = new THREE.PointLight(0x0AC8B9, 1, 5);
        orbLight.position.copy(orb.position);
        this.mesh.add(orbLight);
        
        // Anneau lumineux sous le joueur (effet LoL)
        const ringGeometry = new THREE.RingGeometry(0.7, 0.8, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x0AC8B9,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.01;
        this.mesh.add(ring);
    }
    
    update(deltaTime, keys) {
        // Mouvements WASD
        const moveDistance = this.moveSpeed * deltaTime;
        
        // Obtenir la direction avant/arrière basée sur la rotation
        const forwardVector = new THREE.Vector3(0, 0, -1).applyEuler(this.mesh.rotation);
        const rightVector = new THREE.Vector3(1, 0, 0).applyEuler(this.mesh.rotation);
        
        // Déplacement avant/arrière
        if (keys.forward) {
            this.position.add(forwardVector.clone().multiplyScalar(moveDistance));
        }
        if (keys.backward) {
            this.position.add(forwardVector.clone().multiplyScalar(-moveDistance));
        }
        
        // Déplacement gauche/droite
        if (keys.left) {
            this.position.add(rightVector.clone().multiplyScalar(-moveDistance));
        }
        if (keys.right) {
            this.position.add(rightVector.clone().multiplyScalar(moveDistance));
        }
        
        // Mettre à jour la position du mesh
        this.mesh.position.copy(this.position);
    }
    
    lookAt(targetPoint) {
        // Faire face à la cible (garde y constant pour rester horizontal)
        const targetPosition = new THREE.Vector3(targetPoint.x, this.position.y, targetPoint.z);
        this.mesh.lookAt(targetPosition);
    }
    
    getDirection() {
        // Obtenir la direction vers laquelle le joueur regarde
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyEuler(this.mesh.rotation);
        return direction;
    }
    
    shoot() {
        // Animation de tir (rebond léger)
        const currentScale = this.mesh.scale.clone();
        
        // Petit effet de recul
        this.mesh.scale.set(currentScale.x * 0.9, currentScale.y * 1.1, currentScale.z * 0.9);
        
        // Puis retour à la normale
        setTimeout(() => {
            this.mesh.scale.copy(currentScale);
        }, 100);
    }
    
    remove() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
        }
    }
} 