import * as THREE from 'three';
import { WORLD_CONFIG, getHillEffect, getNoise } from './config.js';

/**
 * Cria um ponto de ônibus detalhado baseado na imagem de referência.
 */
export function createBusStop(x, z) {
    const group = new THREE.Group();
    const { baseHeight, width, depth } = WORLD_CONFIG;

    // Materiais
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x7a7a7a, roughness: 0.8 }); // Metal Cinza
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.9 });   // Madeira/Bambu
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.4 }); // Telha Escura
    const benchMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.9 }); // Banco

    // 1. Pilares (3 pilares retangulares)
    const pillarGeo = new THREE.BoxGeometry(0.3, 3.5, 0.3);
    const pillarPositions = [-2.5, 0, 2.5];

    pillarPositions.forEach(posZ => {
        const pillar = new THREE.Mesh(pillarGeo, pillarMat);
        pillar.position.set(-0.5, 1.75, posZ);
        pillar.castShadow = true;
        pillar.receiveShadow = true;
        group.add(pillar);
    });

    // 2. Banco (entre o pilar 1 e 2)
    const benchGeo = new THREE.BoxGeometry(0.6, 0.1, 2.5);
    const bench = new THREE.Mesh(benchGeo, benchMat);
    bench.position.set(-0.5, 0.7, -1.25);
    bench.castShadow = true;
    group.add(bench);

    // 4. Telhado (Ondulado/Placa inclinada)
    const roofGeo = new THREE.BoxGeometry(3, 0.05, 6.2);
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.rotation.z = -Math.PI / 8; // Inclinação invertida para subir para a rua
    roof.position.set(-0.4, 3.7, 0);
    roof.castShadow = true;
    group.add(roof);

    // Posicionamento no Mundo
    const hill = getHillEffect(x);
    const noise = getNoise(x, z, width, depth);
    group.position.set(x, baseHeight + hill + noise, z);

    // Escala 2x
    group.scale.set(2, 2, 2);

    // Rotação: Ajuste fino para ficar perfeito
    group.rotation.y = Math.atan2(x, z) + 1;

    return group;
}
