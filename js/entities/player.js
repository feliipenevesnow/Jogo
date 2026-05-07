import * as THREE from 'three';
import { WORLD_CONFIG, getHillEffect, getNoise } from '../world/config.js';
import { treeColliders } from '../world/ativos.js';

export class Player {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;

        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ color: 0x3498db });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.visible = false;
        this.scene.add(this.mesh);

        this.position = new THREE.Vector3(-40, 15, 0);
        this.rotation = 0;
        this.speed = 0.2;
        this.turnSpeed = 0.04;

        this.keys = {};
        this.initControls();
    }

    initControls() {
        window.addEventListener('keydown', (e) => this.keys[e.code] = true);
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);
    }

    update() {
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) this.rotation += this.turnSpeed;
        if (this.keys['ArrowRight'] || this.keys['KeyD']) this.rotation -= this.turnSpeed;
        this.mesh.rotation.y = this.rotation;

        const direction = new THREE.Vector3(Math.sin(this.rotation), 0, Math.cos(this.rotation));
        const oldPosition = this.position.clone();

        if (this.keys['ArrowUp'] || this.keys['KeyW']) this.position.addScaledVector(direction, this.speed);
        if (this.keys['ArrowDown'] || this.keys['KeyS']) this.position.addScaledVector(direction, -this.speed);

        // 1. Colisão com Árvores
        for (const tree of treeColliders) {
            const dx = this.position.x - tree.x;
            const dz = this.position.z - tree.z;
            const distance = Math.sqrt(dx * dx + dz * dz);

            if (distance < tree.radius) {
                // Impedir movimento (volta para a posição anterior)
                this.position.copy(oldPosition);
                break;
            }
        }

        // 2. Colisão com Bordas
        const limitX = WORLD_CONFIG.width / 2 + WORLD_CONFIG.sw + WORLD_CONFIG.streetW - 5;
        const limitZ = WORLD_CONFIG.depth / 2 + WORLD_CONFIG.sw + WORLD_CONFIG.streetW - 5;
        if (Math.abs(this.position.x) > limitX || Math.abs(this.position.z) > limitZ) {
            this.position.copy(oldPosition);
        }

        // 3. Altura do Terreno
        const groundHeight = this.getTerrainHeight(this.position.x, this.position.z);
        // Altura aumentada a pedido do usuário para 3.5
        this.position.y = groundHeight + 3.5;

        this.mesh.position.copy(this.position);
        this.updateCamera();
    }

    updateCamera() {
        // Câmera FPV ajustada
        const camOffset = new THREE.Vector3(
            Math.sin(this.rotation) * 0.2,
            0.5,
            Math.cos(this.rotation) * 0.2
        );
        this.camera.position.copy(this.position).add(camOffset);

        const lookAtOffset = new THREE.Vector3(
            Math.sin(this.rotation) * 10,
            -0.1,
            Math.cos(this.rotation) * 10
        );
        this.camera.lookAt(this.position.clone().add(lookAtOffset));
    }

    getTerrainHeight(x, z) {
        const { width, sw, baseHeight, curbH, streetY } = WORLD_CONFIG;
        const hill = getHillEffect(x);

        if (Math.abs(x) < width / 2 && Math.abs(z) < width / 2) {
            return baseHeight + getNoise(x, z, width, width) + hill;
        } else if (Math.abs(x) < (width / 2 + sw) && Math.abs(z) < (width / 2 + sw)) {
            return baseHeight + curbH + hill;
        } else {
            return baseHeight + streetY + hill;
        }
    }
}
