import * as THREE from 'three';

/**
 * Cria uma textura leve de círculo em memória para que as estrelas pareçam esferas
 * brilhantes, sem precisar carregar nenhuma imagem externa.
 */
function createStarTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(8, 8, 0, 8, 8, 8);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.2, 'rgba(255,255,255,0.8)');
    gradient.addColorStop(0.5, 'rgba(255,255,255,0.2)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 16, 16);
    return new THREE.CanvasTexture(canvas);
}

/**
 * Cria o céu estrelado otimizado.
 */
export function createNightSky(scene) {
    // Fundo do horizonte levemente mais vibrante
    const nightColor = 0x07071a; 
    
    scene.background = new THREE.Color(nightColor);
    scene.fog = new THREE.Fog(nightColor, 50, 500); 

    const skyGroup = new THREE.Group();

    // 1. A LUA GIGANTE NO HORIZONTE
    const moonGeo = new THREE.CircleGeometry(40, 32);
    const moonMat = new THREE.MeshBasicMaterial({ 
        color: 0xffffee, 
        fog: false // Não é afetada pela neblina para brilhar muito
    });
    const moon = new THREE.Mesh(moonGeo, moonMat);
    // Posiciona a lua bem no horizonte, de frente para a descida
    moon.position.set(-200, 60, -300);
    moon.lookAt(0, 0, 0);
    skyGroup.add(moon);

    // 2. CAMADA DE ESTRELAS FOCADA NO HORIZONTE
    const starsGeometry = new THREE.BufferGeometry();
    const count = 5000; // Mais estrelas!
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const color1 = new THREE.Color(0xffffff); // Branca brilhante
    const color2 = new THREE.Color(0xaaccff); // Azul mágica
    const color3 = new THREE.Color(0xffddaa); // Dourada

    for (let i = 0; i < count; i++) {
        const r = 400 + Math.random() * 200;
        const theta = 2 * Math.PI * Math.random();
        
        // TRUQUE: Forçar a maioria das estrelas a nascer BEM NO HORIZONTE (ângulo phi perto de 90 graus)
        // Math.random() elevado a um poder curva a probabilidade
        let phi;
        if (Math.random() > 0.3) {
            // 70% das estrelas concentradas perto da linha de visão do jogador
            phi = Math.PI/2 - (Math.random() * 0.4); 
        } else {
            // 30% espalhadas pelo resto do céu
            phi = Math.acos(2 * Math.random() - 1);
        }
        
        let x = r * Math.sin(phi) * Math.cos(theta);
        let y = r * Math.cos(phi);
        let z = r * Math.sin(phi) * Math.sin(theta);

        if (y < -20) y = Math.abs(y); // Não gastar com estrelas embaixo do chão

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        const randColor = Math.random();
        let starColor = color1;
        if (randColor > 0.7) starColor = color2;
        else if (randColor > 0.5) starColor = color3;

        colors[i * 3] = starColor.r;
        colors[i * 3 + 1] = starColor.g;
        colors[i * 3 + 2] = starColor.b;
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starsMaterial = new THREE.PointsMaterial({
        size: 5.0, // ESTRELAS MUITO MAIORES E MAIS BRILHANTES
        map: createStarTexture(),
        vertexColors: true,
        transparent: true,
        opacity: 1.0,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending 
    });

    const starField = new THREE.Points(starsGeometry, starsMaterial);
    skyGroup.add(starField);
    
    // Rotacionar levemente o céu
    skyGroup.rotation.x = Math.PI / 8;
    
    scene.add(skyGroup);

    return skyGroup;
}
