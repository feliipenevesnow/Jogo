import * as THREE from 'three';
import { WORLD_CONFIG, getHillEffect } from './config.js';

/**
 * Cria escadarias integradas às calçadas laterais.
 */
export function createStairs(innerWidth, innerDepth, baseHeight) {
    const group = new THREE.Group();
    const { sw } = WORLD_CONFIG;
    
    const stepDepth = 0.5;
    const stepHeight = 0.15;
    const material = new THREE.MeshStandardMaterial({ 
        color: 0x999999,
        roughness: 0.8
    });

    // Função para criar uma escadaria em um local específico
    function addStairFlight(startX, startZ, width) {
        const flightLength = 10;
        const steps = Math.floor(flightLength / stepDepth);
        
        for (let i = 0; i < steps; i++) {
            const x = startX + i * stepDepth;
            const hill = getHillEffect(x);
            
            // Cada degrau é uma caixa sólida que vai até o chão
            const geo = new THREE.BoxGeometry(stepDepth, baseHeight + hill + (i * 0.05), width);
            const step = new THREE.Mesh(geo, material);
            
            step.position.set(x, (baseHeight + hill) / 2, startZ);
            step.receiveShadow = true;
            step.castShadow = true;
            group.add(step);
        }
    }

    // Adicionar escadas nas calçadas Norte e Sul (onde o morro sobe)
    // Apenas na parte onde a inclinação começa a ficar forte
    addStairFlight(5, -(innerDepth / 2 + sw / 2), sw); // Calçada Norte
    addStairFlight(5, (innerDepth / 2 + sw / 2), sw);  // Calçada Sul

    return group;
}
