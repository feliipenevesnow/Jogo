import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

/**
 * Carrega e posiciona o modelo de NY fora do mapa.
 */
export function createNYCity(scene, x, z) {
    const loader = new OBJLoader();
    
    loader.load('3D objetos/ny/ny.obj', (obj) => {
        // Normalização e Escala
        const box = new THREE.Box3().setFromObject(obj);
        const size = new THREE.Vector3();
        box.getSize(size);
        
        // Escala monumental para uma cidade
        const targetWidth = 150; 
        const scaleFactor = targetWidth / size.x;
        obj.scale.set(scaleFactor, scaleFactor, scaleFactor);
        
        // Posicionamento (Abaixado ainda mais para mergulhar no horizonte)
        obj.position.set(x, -5, z); 
        
        // Rotação para ver outra face
        obj.rotation.y = Math.PI / 2;
        
        // Sombras
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
        console.log("Modelo NY carregado e posicionado em:", x, z);
    }, 
    (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% carregado');
    },
    (error) => {
        console.error('Erro ao carregar modelo NY:', error);
    });
}
