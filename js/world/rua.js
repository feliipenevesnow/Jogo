import * as THREE from 'three';
import { WORLD_CONFIG, getHillEffect } from './config.js';

/**
 * Cria as ruas ao redor da calçada.
 */
export function createStreet(innerWidth, innerDepth, height, texture) {
    const { streetW, streetY } = WORLD_CONFIG;
    const group = new THREE.Group();

    const asphaltMaterial = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.6,
    });

    const gridLength = 400; // Ruas agora se estendem para longe
    const parts = [
        { w: streetW, h: height - 0.2, d: gridLength, x: -(innerWidth + streetW) / 2, z: 0 },
        { w: streetW, h: height - 0.2, d: gridLength, x: (innerWidth + streetW) / 2, z: 0 },
        { w: gridLength, h: height - 0.2, d: streetW, x: 0, z: -(innerDepth + streetW) / 2 },
        { w: gridLength, h: height - 0.2, d: streetW, x: 0, z: (innerDepth + streetW) / 2 }
    ];

    parts.forEach(p => {
        const segsW = Math.max(1, Math.ceil(p.w));
        const segsD = Math.max(1, Math.ceil(p.d));
        const geo = new THREE.BoxGeometry(p.w, p.h, p.d, segsW, 1, segsD);
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const vx = pos.getX(i) + p.x;
            const vy = pos.getY(i);
            if (vy > 0) {
                pos.setY(i, vy + getHillEffect(vx) + streetY);
            }
        }
        geo.computeVertexNormals();
        const mesh = new THREE.Mesh(geo, asphaltMaterial);
        mesh.position.set(p.x, p.h / 2, p.z);
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        group.add(mesh);

        // Faixa amarela
        const isHorizontal = p.w > p.d;
        const lineW = isHorizontal ? p.w * 0.9 : 0.2;
        const lineD = isHorizontal ? 0.2 : p.d * 0.9;
        const lineSegments = Math.ceil(Math.max(lineW, lineD));
        const lineGeo = new THREE.PlaneGeometry(lineW, lineD, lineSegments, 1);
        const lineMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
        const line = new THREE.Mesh(lineGeo, lineMat);
        
        line.rotation.x = -Math.PI / 2;
        
        // Posicionar a linha no topo da rua com um pequeno offset
        const lpos = lineGeo.attributes.position;
        for (let i = 0; i < lpos.count; i++) {
            const worldX = lpos.getX(i) + p.x;
            // O valor de Z na PlaneGeometry (antes da rotação) ou Y (após rotação)
            // Vamos usar o deslocamento local para seguir o morro
            lpos.setZ(i, getHillEffect(worldX));
        }
        
        // A altura base da linha é a altura do topo da rua (height + streetY)
        line.position.set(p.x, height + streetY + 0.05, p.z);
        
        group.add(line);
    });

    return group;
}
