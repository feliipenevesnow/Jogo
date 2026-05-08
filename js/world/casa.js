import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { WORLD_CONFIG, getHillEffect, getNoise } from './config.js';

/**
 * Carrega e posiciona o modelo da casa.
 */
export function createHouse(scene, x, y, z) {
    const loader = new OBJLoader();
    
    loader.load('3D objetos/casa/casa.obj', (obj) => {
        // Normalização e Escala
        const box = new THREE.Box3().setFromObject(obj);
        const size = new THREE.Vector3();
        box.getSize(size);
        
        // Escala ainda maior conforme pedido
        const targetWidth = 15 * 4.5; 
        const scaleFactor = targetWidth / size.x;
        obj.scale.set(scaleFactor, scaleFactor, scaleFactor);
        
        // O posicionamento será exato no ponto central, pois a ferramenta visual agora tem o tamanho real.
        const finalX = x;
        const finalZ = z;

        // O offset Y é necessário porque o pivô do modelo não está na base
        const bottomY = box.min.y * scaleFactor; 
        
        let yPos;
        if (y !== undefined && y !== null) {
            // Se o Y manual foi passado (via scroll do mouse), usar ele!
            yPos = y - bottomY;
        } else {
            // Altura automática caso não venha manual
            const hill = getHillEffect(finalX);
            yPos = WORLD_CONFIG.baseHeight + WORLD_CONFIG.curbH + hill - bottomY;
        }

        // Posicionamento exato!
        obj.position.set(finalX, yPos, finalZ); 

        // Rotação para ficar de frente
        obj.rotation.y = Math.PI;
        
        // Sombras e Materiais
        obj.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.material) {
                    child.material.side = THREE.DoubleSide;
                }
            }
        });
        
        scene.add(obj);
        console.log("Modelo Casa carregado e posicionado em:", x, z);
    }, 
    (xhr) => {
        console.log('Casa: ' + (xhr.loaded / xhr.total * 100) + '% carregado');
    },
    (error) => {
        console.error('Erro ao carregar modelo Casa:', error);
    });
}
