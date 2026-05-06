import * as THREE from 'three';

/**
 * Cria o terreno com ondulações e inclinação tipo rampa.
 * @returns {THREE.Group} O grupo contendo o terreno.
 */
export function createTerrain() {
    const terrainGroup = new THREE.Group();

    // Parâmetros do terreno
    const width = 40;
    const height = 5; // Altura da base do bloco
    const depth = 40;
    const segments = 64; 
    
    // Usar BoxGeometry para ter volume real (lados e fundo)
    const geometry = new THREE.BoxGeometry(width, height, depth, segments, 1, segments);
    
    // 2. Aplicar ondulações e inclinação apenas no topo
    const positions = geometry.attributes.position;
    
    for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const z = positions.getZ(i);
        
        // Apenas modifica os vértices que estão no topo do box (y > 0)
        if (y > 0) {
            // Ondulações
            const wave1 = Math.sin(x * 0.3) * Math.cos(z * 0.3) * 0.8;
            const wave2 = Math.sin(x * 0.1) * 0.5;
            const noise = wave1 + wave2;

            // Efeito de rampa: sobe conforme X aumenta
            const rampEffect = (x + width / 2) * 0.2; 

            // Aplica a nova altura
            positions.setY(i, y + noise + rampEffect);
        }
    }

    geometry.computeVertexNormals();

    // Carregar texturas
    const textureLoader = new THREE.TextureLoader();
    const grassTexture = textureLoader.load('assets/grass.png');
    const dirtTexture = textureLoader.load('assets/dirt.png');
    
    // Configurar repetição das texturas
    grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
    grassTexture.repeat.set(4, 4);
    
    dirtTexture.wrapS = dirtTexture.wrapT = THREE.RepeatWrapping;
    dirtTexture.repeat.set(4, 1);

    // 3. Materiais (Multi-material para topo verde e lados marrom)
    const grassMaterial = new THREE.MeshStandardMaterial({
        map: grassTexture,
        roughness: 0.8,
    });
    
    const dirtMaterial = new THREE.MeshStandardMaterial({
        map: dirtTexture,
        roughness: 0.9,
    });

    // Atribuir materiais: [x+, x-, y+, y-, z+, z-]
    const materials = [
        dirtMaterial, // x+
        dirtMaterial, // x-
        grassMaterial, // y+ (topo)
        dirtMaterial, // y- (fundo)
        dirtMaterial, // z+
        dirtMaterial  // z-
    ];


    const block = new THREE.Mesh(geometry, materials);
    block.receiveShadow = true;
    block.castShadow = true;
    
    // Centralizar para que a base fique no chão
    block.position.y = height / 2;

    terrainGroup.add(block);
    
    return terrainGroup;
}

