import * as THREE from 'three';
import { TDSLoader } from 'three/addons/loaders/TDSLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { WORLD_CONFIG, getHillEffect, getNoise } from './config.js';

export const treeColliders = [];
const treeInstances = []; 

/**
 * LISTA FIXA DE POSIÇÕES - TOTALMENTE FORA DO RETÂNGULO CENTRAL
 * O retângulo central vai de X[-15, 15] e Z[-45, 45] aproximadamente.
 */
const FIXED_TREE_POSITIONS = [
    // Cantos Externos (Noroeste)
    { x: -45, z: -45 }, { x: -40, z: -50 }, { x: -50, z: -40 }, { x: -35, z: -55 },
    // Cantos Externos (Nordeste)
    { x: 45, z: -45 },  { x: 40, z: -50 },  { x: 50, z: -40 },  { x: 35, z: -55 },
    // Cantos Externos (Sudoeste)
    { x: -45, z: 45 },  { x: -40, z: 50 },  { x: 50, z: 40 },   { x: -35, z: 55 },
    // Cantos Externos (Sudeste)
    { x: 45, z: 45 },   { x: 40, z: 50 },   { x: 55, z: 40 },   { x: 35, z: 55 },
    // Laterais da Praça (Longe do centro)
    { x: -50, z: 0 },   { x: -55, z: 15 },  { x: -55, z: -15 },
    { x: 50, z: 8 },    { x: 55, z: 15 },   { x: 55, z: -15 },
    // Ao longo das calçadas (Norte/Sul)
    { x: 20, z: -55 },  { x: -20, z: -55 }, { x: 20, z: 55 },   { x: -20, z: 55 }
];

/**
 * Adiciona árvores em posições fixas, garantindo o centro livre.
 */
export function addAssets(group) {
    const manager = new THREE.LoadingManager();
    const tdsLoader = new TDSLoader(manager);
    const objLoader = new OBJLoader(manager);
    const mtlLoader = new MTLLoader(manager);

    const treeTypes = [];

    // Carregar Modelos
    tdsLoader.setResourcePath('assets/models/tree1/');
    tdsLoader.load('assets/models/tree1/Tree1.3ds', (obj) => {
        obj.userData.type = '3ds';
        normalizeModel(obj, 18); 
        treeTypes.push(obj);
    });

    mtlLoader.setPath('assets/models/tree2/');
    mtlLoader.load('Tree.mtl', (materials) => {
        materials.preload();
        objLoader.setMaterials(materials);
        objLoader.setPath('assets/models/tree2/');
        objLoader.load('Tree.obj', (obj) => {
            obj.userData.type = 'obj';
            normalizeModel(obj, 18);
            treeTypes.push(obj);
        });
    });

    mtlLoader.setPath('assets/models/tree3/');
    mtlLoader.load('Tree.mtl', (materials) => {
        materials.preload();
        objLoader.setMaterials(materials);
        objLoader.setPath('assets/models/tree3/');
        objLoader.load('Tree.obj', (obj) => {
            obj.userData.type = 'obj';
            normalizeModel(obj, 18);
            treeTypes.push(obj);
        });
    });

    manager.onLoad = () => {
        distributeTrees(group, treeTypes);
    };
}

function normalizeModel(obj, targetHeight) {
    if (obj.userData.type === '3ds') obj.rotation.x = -Math.PI / 2;
    const box = new THREE.Box3().setFromObject(obj);
    const size = new THREE.Vector3();
    box.getSize(size);
    const scaleFactor = targetHeight / size.y;
    obj.scale.set(scaleFactor, scaleFactor, scaleFactor);
    const newBox = new THREE.Box3().setFromObject(obj);
    obj.position.y = -newBox.min.y;

    obj.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
                child.material.side = THREE.FrontSide;
            }
        }
    });
}

function distributeTrees(group, treeTypes) {
    const { width, depth } = WORLD_CONFIG;

    FIXED_TREE_POSITIONS.forEach((pos, i) => {
        const typeIndex = i % treeTypes.length;
        const container = new THREE.Group();
        const treeInstance = treeTypes[typeIndex].clone();
        
        const s = 0.9 + (i % 5) * 0.1; 
        treeInstance.scale.multiplyScalar(s);
        
        container.add(treeInstance);
        container.rotation.y = (i * 1.5); 
        
        const hill = getHillEffect(pos.x);
        const noise = getNoise(pos.x, pos.z, width, depth);
        const y = WORLD_CONFIG.baseHeight + hill + noise;
        
        container.position.set(pos.x, y, pos.z);
        group.add(container);

        treeInstances.push(container);
        treeColliders.push({ x: pos.x, z: pos.z, radius: 2.5 });
    });
}

export function updateAssetsOptimization(playerPosition) {
    const maxDist = 75; 
    for (const tree of treeInstances) {
        const dist = tree.position.distanceTo(playerPosition);
        tree.visible = (dist < maxDist);
    }
}
