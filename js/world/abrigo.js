import * as THREE from 'three';
import { WORLD_CONFIG, getHillEffect, getNoise } from './config.js';

/**
 * Cria a estrutura de abrigo (pergola) com bancos e vegetação procedurais.
 */
export function createShelter(x, z) {
    const group = new THREE.Group();
    const { baseHeight, width, depth } = WORLD_CONFIG;

    // Materiais
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9 }); // Concreto/Pedra
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.8 }); // Madeira
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xc6a664, roughness: 1.0 }); // Palha/Telhado
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.8 }); // Folhagem

    // 1. Pilares (6 pilares)
    const pillarGeo = new THREE.BoxGeometry(0.8, 6, 0.8);
    const pillarPositions = [
        { x: -4, z: -2.5 }, { x: 0, z: -2.5 }, { x: 4, z: -2.5 },
        { x: -4, z: 2.5 },  { x: 0, z: 2.5 },  { x: 4, z: 2.5 }
    ];

    pillarPositions.forEach(pos => {
        const pillar = new THREE.Mesh(pillarGeo, pillarMat);
        pillar.position.set(pos.x, 3, pos.z);
        pillar.castShadow = true;
        pillar.receiveShadow = true;
        group.add(pillar);
    });

    // 2. Vigas Superiores
    const beamLongGeo = new THREE.BoxGeometry(9, 0.4, 0.4);
    const beam1 = new THREE.Mesh(beamLongGeo, woodMat);
    beam1.position.set(0, 6, -2.5);
    group.add(beam1);

    const beam2 = new THREE.Mesh(beamLongGeo, woodMat);
    beam2.position.set(0, 6, 2.5);
    group.add(beam2);

    // Vigas Transversais (Pequenas)
    const beamTransGeo = new THREE.BoxGeometry(0.3, 0.3, 6);
    for (let i = -4; i <= 4; i += 2) {
        const beam = new THREE.Mesh(beamTransGeo, woodMat);
        beam.position.set(i, 6.2, 0);
        group.add(beam);
    }

    // 3. Telhado (Placa de Palha)
    const roofGeo = new THREE.BoxGeometry(10, 0.2, 6.5);
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(0, 6.4, 0);
    roof.castShadow = true;
    group.add(roof);

    // 4. Bancos Internos (Pedra)
    const benchGeo = new THREE.BoxGeometry(3, 0.6, 1.2);
    const bench1 = new THREE.Mesh(benchGeo, pillarMat);
    bench1.position.set(-2, 0.3, 0);
    bench1.castShadow = true;
    group.add(bench1);

    const bench2 = new THREE.Mesh(benchGeo, pillarMat);
    bench2.position.set(2, 0.3, 0);
    bench2.castShadow = true;
    group.add(bench2);

    // 5. Vegetação Lateral
    const bushGeo = new THREE.SphereGeometry(1.2, 8, 8);
    for (let i = 0; i < 4; i++) {
        const bush = new THREE.Mesh(bushGeo, leafMat);
        const side = i < 2 ? -5 : 5;
        const offsetZ = (i % 2 === 0) ? -2 : 2;
        bush.position.set(side, 0.5, offsetZ);
        bush.scale.set(1, 0.8, 1);
        group.add(bush);
    }

    // Posicionamento no Mundo
    const hill = getHillEffect(x);
    const noise = getNoise(x, z, width, depth);
    group.position.set(x, baseHeight + hill + noise, z);

    // Escala 2x
    group.scale.set(2, 2, 2);

    // Rotação para o centro + um pouco de rotação extra (invertido 180 graus)
    group.rotation.y = Math.atan2(x, z) + (Math.PI / 4);

    return group;
}

/**
 * Cria apenas o banco 3D (banco.glb) em escala colossal.
 */
export function createGLBBench(x, z, benchModel, options = {}) {
    const group = new THREE.Group();
    const { baseHeight, width, depth } = WORLD_CONFIG;

    const instance = benchModel.clone();
    const box = new THREE.Box3().setFromObject(instance);
    const size = new THREE.Vector3();
    box.getSize(size);

    const targetWidth = 40;
    const scaleFactor = targetWidth / size.x;
    instance.scale.set(scaleFactor, scaleFactor, scaleFactor);

    const newBox = new THREE.Box3().setFromObject(instance);
    instance.position.y = -newBox.min.y;
    
    if (options.customRotation !== undefined) {
        instance.rotation.y = options.customRotation;
    } else {
        instance.rotation.y = Math.atan2(x, z) + Math.PI + (Math.PI / (-2.5));
    }

    group.add(instance);

    let finalY;
    if (options.customY !== undefined) {
        finalY = options.customY;
    } else {
        const hill = getHillEffect(x);
        const noise = getNoise(x, z, width, depth);
        finalY = baseHeight + hill + noise;
    }

    group.position.set(x, finalY, z);

    return group;
}

