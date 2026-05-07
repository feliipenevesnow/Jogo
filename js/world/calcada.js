import * as THREE from 'three';
import { WORLD_CONFIG, getHillEffect } from './config.js';

/**
 * Cria a calçada ao redor da quadra.
 */
export function createSidewalk(innerWidth, innerDepth, height, texture) {
    const { sw, curbH } = WORLD_CONFIG;
    const group = new THREE.Group();

    const sidewalkMaterial = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.7,
    });

    const parts = [
        { w: sw, h: height, d: innerDepth, x: -(innerWidth + sw) / 2, z: 0 },
        { w: sw, h: height, d: innerDepth, x: (innerWidth + sw) / 2, z: 0 },
        { w: innerWidth + sw * 2, h: height, d: sw, x: 0, z: -(innerDepth + sw) / 2 },
        { w: innerWidth + sw * 2, h: height, d: sw, x: 0, z: (innerDepth + sw) / 2 }
    ];

    parts.forEach(p => {
        // Aumentar segmentos para a geometria dobrar suavemente no morro cúbico
        const segsW = Math.max(1, Math.ceil(p.w));
        const segsD = Math.max(1, Math.ceil(p.d));
        const geo = new THREE.BoxGeometry(p.w, p.h, p.d, segsW, 1, segsD);
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const vx = pos.getX(i) + p.x;
            const vy = pos.getY(i);
            if (vy > 0) {
                pos.setY(i, vy + getHillEffect(vx) + curbH);
            }
        }
        geo.computeVertexNormals();
        const mesh = new THREE.Mesh(geo, sidewalkMaterial);
        mesh.position.set(p.x, p.h / 2, p.z);
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        group.add(mesh);
    });

    return group;
}
