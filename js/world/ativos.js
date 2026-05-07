import * as THREE from 'three';
import { TDSLoader } from 'three/addons/loaders/TDSLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { WORLD_CONFIG, getHillEffect, getNoise } from './config.js';

export const treeColliders = [];
const treeInstances = []; 

/**
 * Adiciona árvores com posicionamento preciso no terreno irregular.
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
    const totalTrees = 21; 
    const { width, depth } = WORLD_CONFIG;

    for (let i = 0; i < totalTrees; i++) {
        const typeIndex = i % treeTypes.length;
        const container = new THREE.Group();
        const treeInstance = treeTypes[typeIndex].clone();
        
        const s = 0.9 + Math.random() * 0.4;
        treeInstance.scale.multiplyScalar(s);
        
        container.add(treeInstance);
        container.rotation.y = Math.random() * Math.PI * 2;
        
        const x = (Math.random() - 0.5) * (width - 40);
        const z = (Math.random() - 0.5) * (depth - 40);
        
        // CORREÇÃO: Incluir o Noise para a árvore não flutuar
        const hill = getHillEffect(x);
        const noise = getNoise(x, z, width, depth);
        const y = WORLD_CONFIG.baseHeight + hill + noise;
        
        container.position.set(x, y, z);
        group.add(container);

        treeInstances.push(container);
        treeColliders.push({ x, z, radius: 2.5 });
    }
}

export function updateAssetsOptimization(playerPosition) {
    const maxDist = 70; 
    for (const tree of treeInstances) {
        const dist = tree.position.distanceTo(playerPosition);
        tree.visible = (dist < maxDist);
    }
}
