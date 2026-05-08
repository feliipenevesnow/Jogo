import * as THREE from 'three';
import { WORLD_CONFIG, getHillEffect, getNoise } from './config.js';

import { createDetailedStaircase } from './staircase.js';

/**
 * Cria a trilha de concreto centralizada e plana.
 */
export function createTrail() {
    const group = new THREE.Group();
    const { width, depth, baseHeight, pathW, pathRectW, pathRectD, pathXOffset } = WORLD_CONFIG;
    
    const textureLoader = new THREE.TextureLoader();
    const concreteTexture = textureLoader.load('assets/concrete_v2.png');
    concreteTexture.wrapS = concreteTexture.wrapT = THREE.RepeatWrapping;
    concreteTexture.repeat.set(1, 4);
    concreteTexture.anisotropy = 16;
    
    const concreteMaterial = new THREE.MeshStandardMaterial({ 
        map: concreteTexture, 
        roughness: 0.8 
    });

    // 1. Retângulo Central no Centro Real (pathXOffset = 0)
    const rectParts = [
        { w: pathRectW, d: pathW, x: pathXOffset, z: -pathRectD/2 },
        { w: pathRectW, d: pathW, x: pathXOffset, z: pathRectD/2 },
        { w: pathW, d: pathRectD + pathW, x: pathXOffset - pathRectW/2, z: 0 },
        { w: pathW, d: pathRectD + pathW, x: pathXOffset + pathRectW/2, z: 0 }
    ];

    // 2. Conexões Simétricas
    const connParts = [
        // OESTE
        { w: (width/2 - pathRectW/2), d: pathW, x: -width/2 + (width/2 - pathRectW/2)/2, z: 0 },
        
        // LESTE (Removido daqui para ser substituído pela escada abaixo)
        // { w: (width/2 - pathRectW/2), d: pathW, x: width/2 - (width/2 - pathRectW/2)/2, z: 0 },
        
        // NORTE
        { w: pathW, d: (depth/2 - pathRectD/2), x: 0, z: -(pathRectD/2 + (depth/2 - pathRectD/2)/2) },
        { w: pathW, d: (depth/2 - pathRectD/2), x: pathRectW/2 - 5, z: -(pathRectD/2 + (depth/2 - pathRectD/2)/2) },
        
        // SUL
        { w: pathW, d: (depth/2 - pathRectD/2), x: -pathRectW/2 + 5, z: (pathRectD/2 + (depth/2 - pathRectD/2)/2) }
    ];

    const allParts = [...rectParts, ...connParts];

    allParts.forEach(p => {
        const segX = Math.max(2, Math.ceil(p.w / 1.5));
        const segZ = Math.max(2, Math.ceil(p.d / 1.5));
        
        const geo = new THREE.PlaneGeometry(p.w, p.d, segX, segZ);
        geo.rotateX(-Math.PI / 2);
        
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const vx = pos.getX(i) + p.x;
            const vz = pos.getZ(i) + p.z;
            const hill = getHillEffect(vx);
            const noise = getNoise(vx, vz, width, depth);
            pos.setY(i, baseHeight + hill + noise + 0.08);
        }
        
        const mesh = new THREE.Mesh(geo, concreteMaterial);
        mesh.position.set(p.x, 0, p.z);
        mesh.receiveShadow = true;
        group.add(mesh);
    });

    // 3. Adicionar a Escadaria Detalhada no lugar da rampa LESTE
    const startX = pathRectW / 2;
    const endX = width / 2;
    group.add(createDetailedStaircase(startX, endX, 0, pathW));

    return group;
}
