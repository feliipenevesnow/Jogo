import * as THREE from 'three';
import { WORLD_CONFIG, getHillEffect } from './config.js';

/**
 * Cria a calçada ao redor da quadra de forma fragmentada para o grid #.
 */
export function createSidewalk(innerWidth, innerDepth, height, texture) {
    const { sw, curbH, streetW } = WORLD_CONFIG;
    const group = new THREE.Group();

    const sidewalkMaterial = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.7,
    });

    const parkLimit = innerWidth / 2;
    const innerSwLimit = parkLimit + sw;
    const streetStart = innerSwLimit;
    const streetEnd = streetStart + streetW;
    const outerSwPos = streetEnd + sw/2;
    const gridLimit = 200;

    const gridParts = [
        // --- CALÇADAS INTERNAS (Ao redor do parque) ---
        { w: sw, d: innerDepth, x: -parkLimit - sw/2, z: 0 },
        { w: sw, d: innerDepth, x: parkLimit + sw/2, z: 0 },
        { w: innerWidth + sw*2, d: sw, x: 0, z: -innerDepth/2 - sw/2 },
        { w: innerWidth + sw*2, d: sw, x: 0, z: innerDepth/2 + sw/2 },

        // --- CALÇADAS EXTERNAS (Fragmentadas para respeitar cruzamentos) ---
        // Verticais OESTE (x = -outerSwPos)
        { w: sw, d: gridLimit - streetEnd, x: -outerSwPos, z: -(gridLimit + streetEnd)/2 }, 
        { w: sw, d: innerDepth + sw*2, x: -outerSwPos, z: 0 }, 
        { w: sw, d: gridLimit - streetEnd, x: -outerSwPos, z: (gridLimit + streetEnd)/2 }, 

        // Verticais LESTE (x = outerSwPos)
        { w: sw, d: gridLimit - streetEnd, x: outerSwPos, z: -(gridLimit + streetEnd)/2 },
        { w: sw, d: innerDepth + sw*2, x: outerSwPos, z: 0 },
        { w: sw, d: gridLimit - streetEnd, x: outerSwPos, z: (gridLimit + streetEnd)/2 },

        // Horizontais NORTE (z = -outerSwPos)
        { w: gridLimit - streetEnd, d: sw, x: -(gridLimit + streetEnd)/2, z: -outerSwPos },
        { w: innerWidth + sw*2, d: sw, x: 0, z: -outerSwPos },
        { w: gridLimit - streetEnd, d: sw, x: (gridLimit + streetEnd)/2, z: -outerSwPos },

        // Horizontais SUL (z = outerSwPos)
        { w: gridLimit - streetEnd, d: sw, x: -(gridLimit + streetEnd)/2, z: outerSwPos },
        { w: innerWidth + sw*2, d: sw, x: 0, z: outerSwPos },
        { w: gridLimit - streetEnd, d: sw, x: (gridLimit + streetEnd)/2, z: outerSwPos },

        // --- ESQUINAS EXTERNAS (Quadrados de conexão) ---
        { w: sw, d: sw, x: -outerSwPos, z: -outerSwPos },
        { w: sw, d: sw, x: outerSwPos, z: -outerSwPos },
        { w: sw, d: sw, x: -outerSwPos, z: outerSwPos },
        { w: sw, d: sw, x: outerSwPos, z: outerSwPos }
    ];

    gridParts.forEach(p => {
        const segsW = Math.max(1, Math.ceil(p.w / 2));
        const segsD = Math.max(1, Math.ceil(p.d / 2));
        const geo = new THREE.BoxGeometry(p.w, height, p.d, segsW, 1, segsD);
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
        mesh.position.set(p.x, height / 2, p.z);
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        group.add(mesh);
    });

    return group;
}
