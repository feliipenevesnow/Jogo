import * as THREE from 'three';
import { createSidewalk } from './calcada.js';
import { createStreet } from './rua.js';
import { createStairs } from './escada.js';
import { createTrail } from './trilha.js';
import { createShelter, createGLBBench } from './abrigo.js';
import { createBusStop } from './ponto_onibus.js';
import { addAssets } from './ativos.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { WORLD_CONFIG, getHillEffect, getNoise } from './config.js';

/**
 * Cria o terreno com formato de praça ampliada.
 */
export function createTerrain() {
    const terrainGroup = new THREE.Group();

    const { width, baseHeight: height, depth } = WORLD_CONFIG;
    const segments = 128; 
    
    const geometry = new THREE.BoxGeometry(width, height, depth, segments, 1, segments);
    const positions = geometry.attributes.position;
    
    for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const z = positions.getZ(i);
        
        if (y > 0) {
            const noise = getNoise(x, z, width, depth);
            const hillEffect = getHillEffect(x);
            positions.setY(i, y + noise + hillEffect);
        }
    }
    geometry.computeVertexNormals();

    const textureLoader = new THREE.TextureLoader();
    // Carregar Textura de Grama melhorada
    const grassTexture = textureLoader.load('assets/grass_v2.png');
    const dirtTexture = textureLoader.load('assets/dirt.png');
    const sidewalkTexture = textureLoader.load('assets/sidewalk.png');
    const asphaltTexture = textureLoader.load('assets/asphalt.png');
    
    grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
    grassTexture.repeat.set(16, 16); // Ajustado para evitar repetição excessiva
    grassTexture.anisotropy = 16; // Máxima nitidez
    grassTexture.magFilter = THREE.LinearFilter;
    grassTexture.minFilter = THREE.LinearMipmapLinearFilter;
    
    const grassMaterial = new THREE.MeshStandardMaterial({ map: grassTexture, roughness: 0.8 });
    const dirtMaterial = new THREE.MeshStandardMaterial({ map: dirtTexture, roughness: 0.9 });
    const materials = [dirtMaterial, dirtMaterial, grassMaterial, dirtMaterial, dirtMaterial, dirtMaterial];

    const block = new THREE.Mesh(geometry, materials);
    block.receiveShadow = true;
    block.castShadow = true;
    block.position.y = height / 2;
    terrainGroup.add(block);

    // Adicionar Calçadas e Ruas
    const sidewalk = createSidewalk(width, depth, height, sidewalkTexture);
    terrainGroup.add(sidewalk);

    const street = createStreet(width + 10, depth + 10, height, asphaltTexture);
    terrainGroup.add(street);

    // Adicionar Escada no final do morro (agora mais longe)
    const stairs = createStairs(width, depth, height);
    terrainGroup.add(stairs);

    // Adicionar Trilhas de Concreto
    const trails = createTrail();
    terrainGroup.add(trails);

    // Adicionar os Bancos/Abrigos
    const gltfLoader = new GLTFLoader();
    gltfLoader.load('assets/models/bench/banco.glb', (gltf) => {
        const benchModel = gltf.scene;
        
        // Banco 1 (Removido a pedido do usuário)
        // terrainGroup.add(createGLBBench(-6.54, 28.93, benchModel));
        
        // Banco 2: O Banco clonado posicionado perfeitamente pelo usuário
        const originalBenchRotation = Math.atan2(-6.54, 28.93) + Math.PI + (Math.PI / (-2.5));
        terrainGroup.add(createGLBBench(-6.50, 19.98, benchModel, {
            customY: 5.07,
            customRotation: originalBenchRotation
        }));
    });

    // Banco 2: Abrigo Procedural (O "antigo" abrigo.js)
    terrainGroup.add(createShelter(-20.95, -23.56));

    // Ponto de Ônibus
    terrainGroup.add(createBusStop(-38.64, -62.35));


    // Adicionar Ativos (Árvores 3D)
    addAssets(terrainGroup);
    
    return terrainGroup;
}
