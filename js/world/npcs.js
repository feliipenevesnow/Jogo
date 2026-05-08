import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

/**
 * Cria os NPCs (personagens não jogáveis) do mundo.
 */
export function createHomemEmPe(scene) {
    const loader = new OBJLoader();

    loader.load('3D objetos/homem/homem_em_pe.obj', (obj) => {
        // Normalização de Escala (Assumindo que o homem tem cerca de 1.8 metros de altura)
        const box = new THREE.Box3().setFromObject(obj);
        const size = new THREE.Vector3();
        box.getSize(size);

        const targetHeight = 5.0; // Aumentado em 10x para combinar com a escala gigante do mapa
        const scaleFactor = targetHeight / size.y;
        obj.scale.set(scaleFactor, scaleFactor, scaleFactor);

        // Adicionar material simples se não tiver
        obj.traverse((child) => {
            if (child.isMesh && !child.material.map) {
                child.material = new THREE.MeshStandardMaterial({
                    color: 0xcccccc, // Cor neutra padrão
                    roughness: 0.8
                });
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        // ==========================================
        // 2ª Coordenada: Posição onde o homem vai ficar
        // X: -64.46, Y: 5.25, Z: -25.30
        // ==========================================
        const posX = -64.46;
        const posY = 5.25;
        const posZ = -25.30;

        // O offset Y é necessário para que os pés encostem exatamente no chão da coordenada
        const bottomY = box.min.y * scaleFactor;
        const finalY = posY - bottomY;

        obj.position.set(posX, finalY, posZ);

        // ==========================================
        // 1ª Coordenada: Para onde ele deve olhar
        // X: -80.07, Y: 5.25, Z: 53.15
        // ==========================================
        const targetX = -80.07;
        const targetZ = 53.15;

        // Faz o modelo virar para a coordenada 1.
        // O Y do target é igual ao finalY para ele olhar reto (na horizontal) e não entortar o corpo pra baixo
        obj.lookAt(targetX, finalY, targetZ);

        // Inicia invisível até o evento da coordenada 1 ser acionado
        obj.visible = false;
        scene.add(obj);

        window.homemEmPeObj = obj; // Referência global para a lógica do jogo

        console.log("Homem em pé carregado (invisível) na coordenada 2!");
    });
}

/**
 * Cria o NPC Homem Sentado
 */
export function createHomemSentado(scene, posX, posY, posZ, rotationY = Math.PI) {
    const loader = new OBJLoader();

    loader.load('3D objetos/homem/homem_sentado.obj', (obj) => {
        const box = new THREE.Box3().setFromObject(obj);
        const size = new THREE.Vector3();
        box.getSize(size);

        // A escala de 3.5 foi ajustada no NpcPlacementTool
        const targetHeight = 3.5; 
        const scaleFactor = targetHeight / size.y;
        obj.scale.set(scaleFactor, scaleFactor, scaleFactor);

        obj.traverse((child) => {
            if (child.isMesh && !child.material.map) {
                child.material = new THREE.MeshStandardMaterial({
                    color: 0xcccccc, 
                    roughness: 0.8
                });
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        const bottomY = box.min.y * scaleFactor;
        const finalY = posY - bottomY;

        obj.position.set(posX, finalY, posZ);
        
        // Aplica a rotação passada (ou Math.PI por padrão)
        obj.rotation.y = rotationY; 
        
        // Começa invisível a pedido do usuário
        obj.visible = false;
        
        scene.add(obj);

        if (!window.homensSentados) window.homensSentados = [];
        window.homensSentados.push(obj);
    });
}
