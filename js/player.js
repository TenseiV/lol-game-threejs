export class Player {
    constructor(scene) {
        this.scene = scene;
        this.position = new THREE.Vector3(0, 0, 0);
        this.targetPosition = null;
        this.velocity = new THREE.Vector3();
        this.speed = 10;
        this.radius = 1;
        this.health = 100;
        this.isMoving = false;
        
        // Create the player model
        this.createModel();
        
        // Movement path visualization
        this.pathLine = this.createPathLine();
        this.scene.add(this.pathLine);
    }
    
    createModel() {
        // Create champion model (simplified for performance)
        this.mesh = new THREE.Group();
        
        // Champion body (blue cylinder like LoL champion)
        // Using cylinder instead of capsule which is not available in Three.js r128
        const bodyGeometry = new THREE.CylinderGeometry(0.7, 0.7, 1.5, 8, 1);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x3498db,  // Blue color for ally
            roughness: 0.7,
            metalness: 0.3
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 1.2;
        body.castShadow = true;
        this.mesh.add(body);
        
        // Champion head
        const headGeometry = new THREE.SphereGeometry(0.4, 16, 16);
        const headMaterial = new THREE.MeshStandardMaterial({
            color: 0x2980b9,
            roughness: 0.7,
            metalness: 0.3
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 2.5;
        head.castShadow = true;
        this.mesh.add(head);
        
        // Champion arms
        const armGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.8, 8);
        const armMaterial = new THREE.MeshStandardMaterial({
            color: 0x3498db,
            roughness: 0.7,
            metalness: 0.3
        });
        
        // Left arm
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.85, 1.5, 0);
        leftArm.rotation.z = Math.PI / 8;
        leftArm.castShadow = true;
        this.mesh.add(leftArm);
        
        // Right arm
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.85, 1.5, 0);
        rightArm.rotation.z = -Math.PI / 8;
        rightArm.castShadow = true;
        this.mesh.add(rightArm);
        
        // Add to scene
        this.mesh.position.copy(this.position);
        this.scene.add(this.mesh);
        
        // Create a circular indicator beneath the player (like in LoL)
        const indicatorGeometry = new THREE.CircleGeometry(0.7, 32);
        const indicatorMaterial = new THREE.MeshBasicMaterial({
            color: 0x3498db,
            transparent: true,
            opacity: 0.5
        });
        this.indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
        this.indicator.rotation.x = -Math.PI / 2; // Lay flat on ground
        this.indicator.position.y = 0.01; // Just above ground
        this.mesh.add(this.indicator);
    }
    
    createPathLine() {
        // Create a line to show movement path
        const points = [
            this.position.clone(),
            this.position.clone()
        ];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: 0x3498db,
            transparent: true,
            opacity: 0.6
        });
        
        return new THREE.Line(geometry, material);
    }
    
    updatePathLine() {
        if (!this.targetPosition) {
            this.pathLine.visible = false;
            return;
        }
        
        // Update the line points
        const points = [
            this.position.clone().setY(0.1), // Slightly above ground
            this.targetPosition.clone().setY(0.1)
        ];
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        this.pathLine.geometry.dispose();
        this.pathLine.geometry = geometry;
        this.pathLine.visible = this.isMoving;
    }
    
    moveToPosition(targetPos) {
        // Set target position (ignore Y to keep on ground)
        this.targetPosition = new THREE.Vector3(
            targetPos.x,
            this.position.y,
            targetPos.z
        );
        
        // Calculate direction to target
        this.lookAtPosition(targetPos);
        
        this.isMoving = true;
        this.updatePathLine();
    }
    
    lookAtPosition(targetPos) {
        // Make the player look at the target position
        const lookAtPos = new THREE.Vector3(targetPos.x, this.position.y, targetPos.z);
        this.mesh.lookAt(lookAtPos);
    }
    
    update(delta, keys) {
        // Handle keyboard movement if used
        if (keys.forward || keys.backward || keys.left || keys.right) {
            this.isMoving = false; // Stop path movement when using keyboard
            this.pathLine.visible = false;
            
            const moveSpeed = this.speed * delta;
            
            // Calculate movement direction
            if (keys.forward) this.position.z -= moveSpeed;
            if (keys.backward) this.position.z += moveSpeed;
            if (keys.left) this.position.x -= moveSpeed;
            if (keys.right) this.position.x += moveSpeed;
            
            // Update mesh position
            this.mesh.position.copy(this.position);
            return;
        }
        
        // Handle path movement (right-click in LoL)
        if (this.isMoving && this.targetPosition) {
            // Calculate distance to target
            const distanceToTarget = this.position.distanceTo(this.targetPosition);
            
            // If we're close enough to the target, stop moving
            if (distanceToTarget < 0.2) {
                this.isMoving = false;
                this.pathLine.visible = false;
                return;
            }
            
            // Calculate movement direction and normalize
            const direction = new THREE.Vector3();
            direction.subVectors(this.targetPosition, this.position).normalize();
            
            // Move towards target
            const moveDistance = Math.min(this.speed * delta, distanceToTarget);
            this.position.add(direction.multiplyScalar(moveDistance));
            
            // Update mesh position
            this.mesh.position.copy(this.position);
            
            // Update path line
            this.updatePathLine();
        }
    }
    
    getDirection() {
        // Get the direction the player is facing
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(this.mesh.quaternion);
        return direction;
    }
    
    shoot() {
        // Visual feedback for shooting
        // In a full implementation, you might add an animation or particle effect
    }
    
    remove() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
        }
        if (this.pathLine) {
            this.scene.remove(this.pathLine);
        }
    }
} 