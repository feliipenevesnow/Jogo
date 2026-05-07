import * as THREE from 'three';
import { WORLD_CONFIG, getHillEffect, getNoise } from './config.js';

/**
 * Cria a estrutura de abrigo (pergola) com bancos e vegetação.
 */
export function createShelter(x, z) {
    const group = new THREE.Group();
    const { baseHeight, width, depth } = WORLD_CONFIG;

    const textureLoader = new THREE.TextureLoader();
    const concreteTexture = textureLoader.load('assets/concrete_v2.png');
    concreteTexture.wrapS = concreteTexture.wrapT = THREE.RepeatWrapping;
    concreteTexture.repeat.set(1, 2);

    const stoneMaterial = new THREE.MeshStandardMaterial({ 
        map: concreteTexture,
        color: 0xdddddd,
        roughness: 0.9 
    });

    const woodMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x5d4037, // Marrom madeira
        roughness: 0.7 
    });

    const roofMaterial = new THREE.MeshStandardMaterial({
        color: 0x8d6e63, // Palha/Madeira clara
        roughness: 1.0
    });

    // 1. Pilares (6 unidades)
    const pillarGeo = new THREE.BoxGeometry(0.8, 4, 0.8);
    const pillarPositions = [
        { x: -3, z: -1.5 }, { x: 0, z: -1.5 }, { x: 3, z: -1.5 },
        { x: -3, z: 1.5 }, { x: 0, z: 1.5 }, { x: 3, z: 1.5 }
    ];

    pillarPositions.forEach(p => {
        const pillar = new THREE.Mesh(pillarGeo, stoneMaterial);
        pillar.position.set(p.x, 2, p.z);
        pillar.castShadow = true;
        pillar.receiveShadow = true;
        group.add(pillar);
    });

    // 2. Vigas Superiores
    const beamLongGeo = new THREE.BoxGeometry(7, 0.3, 0.4);
    const beam1 = new THREE.Mesh(beamLongGeo, woodMaterial);
    beam1.position.set(0, 4, -1.5);
    group.add(beam1);

    const beam2 = new THREE.Mesh(beamLongGeo, woodMaterial);
    beam2.position.set(0, 4, 1.5);
    group.add(beam2);

    // 3. Telhado (Placa de "palha/madeira")
    const roofGeo = new THREE.BoxGeometry(7.5, 0.2, 4);
    const roof = new THREE.Mesh(roofGeo, roofMaterial);
    roof.position.set(0, 4.2, 0);
    roof.castShadow = true;
    group.add(roof);

    // 4. Bancos (2 unidades)
    const benchGeo = new THREE.BoxGeometry(2.5, 0.6, 0.8);
    const bench1 = new THREE.Mesh(benchGeo, stoneMaterial);
    bench1.position.set(-1.5, 0.3, 1.2);
    group.add(bench1);

    const bench2 = new THREE.Mesh(benchGeo, stoneMaterial);
    bench2.position.set(1.5, 0.3, 1.2);
    group.add(bench2);

    // 5. Plantas Laterais (Representadas por folhagem simples)
    const plantGeo = new THREE.SphereGeometry(1, 8, 8);
    const plantMaterial = new THREE.MeshStandardMaterial({ color: 0x2e7d32 });
    
    const plant1 = new THREE.Mesh(plantGeo, plantMaterial);
    plant1.scale.set(1, 1.5, 0.8);
    plant1.position.set(-5, 0.5, 0);
    group.add(plant1);

    const plant2 = new THREE.Mesh(plantGeo, plantMaterial);
    plant2.scale.set(1.2, 1.8, 1);
    plant2.position.set(5, 0.5, 0);
    group.add(plant2);

    // Ajustar altura ao terreno
    const hill = getHillEffect(x);
    const noise = getNoise(x, z, width, depth);
    group.position.set(x, baseHeight + hill + noise, z);
    
    return group;
}
