import * as THREE from 'three';
import { WORLD_CONFIG, getHillEffect, getNoise } from './config.js';

/**
 * Cria uma escadaria detalhada com corrimões.
 */
export function createDetailedStaircase(startX, endX, centerZ, pathWidth) {
    const group = new THREE.Group();
    const { baseHeight, width: worldW, depth: worldD } = WORLD_CONFIG;
    
    const stepDepth = 0.8; // Degraus mais longos
    const totalLength = endX - startX;
    const numSteps = Math.floor(totalLength / stepDepth);
    
    const stepMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.7 });
    const railMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.2 });

    const effectiveWidth = pathWidth * 1.6; // Aumentar a largura da escada em 60%

    // 1. Degraus
    for (let i = 0; i < numSteps; i++) {
        const x = startX + i * stepDepth;
        const nextX = x + stepDepth;
        
        const h1 = getHillEffect(x);
        const h2 = getHillEffect(nextX);
        const noise = getNoise(x, centerZ, worldW, worldD);
        
        // Geometria do degrau (Box)
        const geo = new THREE.BoxGeometry(stepDepth + 0.1, 1, effectiveWidth);
        const step = new THREE.Mesh(geo, stepMaterial);
        
        // Posicionar o topo do degrau no nível do terreno
        step.position.set(x + stepDepth/2, baseHeight + h2 + noise - 0.45, centerZ);
        step.castShadow = true;
        step.receiveShadow = true;
        group.add(step);
    }

    // 2. Corrimões
    const railHeight = 2.8; // Corrimões 2x maiores
    const railRadius = 0.1; // Um pouco mais grosso para acompanhar o tamanho
    
    // Função para criar um corrimão de um lado
    const createRail = (sideZ) => {
        const points = [];
        for (let i = 0; i <= numSteps; i++) {
            const x = startX + i * stepDepth;
            const h = getHillEffect(x);
            const n = getNoise(x, sideZ, worldW, worldD);
            points.push(new THREE.Vector3(x, baseHeight + h + n + railHeight, sideZ));
        }
        
        // Tubo do corrimão
        const curve = new THREE.CatmullRomCurve3(points);
        const railGeo = new THREE.TubeGeometry(curve, numSteps, railRadius, 12, false);
        const rail = new THREE.Mesh(railGeo, railMaterial);
        rail.castShadow = true;
        group.add(rail);

        // Postes de sustentação
        for (let i = 0; i <= numSteps; i += 5) {
            const x = startX + i * stepDepth;
            const h = getHillEffect(x);
            const n = getNoise(x, sideZ, worldW, worldD);
            
            const postGeo = new THREE.CylinderGeometry(railRadius * 0.8, railRadius * 0.8, railHeight);
            const post = new THREE.Mesh(postGeo, railMaterial);
            post.position.set(x, baseHeight + h + n + railHeight/2, sideZ);
            post.castShadow = true;
            group.add(post);
        }
    };

    createRail(centerZ - effectiveWidth/2 + 0.15);
    createRail(centerZ + effectiveWidth/2 - 0.15);

    return group;
}
