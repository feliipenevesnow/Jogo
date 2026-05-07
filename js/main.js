import * as THREE from 'three';
import { createTerrain } from './world/terreno.js';
import { Player } from './entities/player.js';
import { updateAssetsOptimization } from './world/ativos.js';

// Scene Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Sky blue
scene.fog = new THREE.Fog(0x87ceeb, 20, 150); // Ajustado para visibilidade balanceada

// Camera Setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 150); // Far plane aumentado para 150
// A posição inicial da câmera será definida pelo Player

// Renderer Setup
const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    powerPreference: 'high-performance',
    precision: 'mediump'
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Limitado a 1.5 para poupar GPU
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
directionalLight.position.set(10, 50, 10);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.left = -100;
directionalLight.shadow.camera.right = 100;
directionalLight.shadow.camera.top = 100;
directionalLight.shadow.camera.bottom = -100;
scene.add(directionalLight);

// Add Terrain
const terrain = createTerrain();
scene.add(terrain);

// Add Player
const player = new Player(scene, camera);

// Handle Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// UI Info
const info = document.createElement('div');
info.style.position = 'absolute';
info.style.top = '10px';
info.style.left = '50%';
info.style.transform = 'translateX(-50%)';
info.style.color = 'white';
info.style.fontFamily = 'sans-serif';
info.style.background = 'rgba(0,0,0,0.5)';
info.style.padding = '10px 20px';
info.style.borderRadius = '20px';
info.style.pointerEvents = 'none';
info.style.textAlign = 'center';
info.innerHTML = 'WASD / Setas ou Controles na Tela';
document.body.appendChild(info);

// Controles Mobile (Botões na tela)
const mobileControls = document.createElement('div');
mobileControls.style.position = 'absolute';
mobileControls.style.bottom = '40px';
mobileControls.style.left = '50%';
mobileControls.style.transform = 'translateX(-50%)';
mobileControls.style.display = 'grid';
mobileControls.style.gridTemplateColumns = 'repeat(3, 70px)';
mobileControls.style.gridGap = '15px';
mobileControls.style.userSelect = 'none';

const createBtn = (id, label, row, col) => {
    const btn = document.createElement('div');
    btn.id = id;
    btn.innerHTML = label;
    btn.style.width = '70px';
    btn.style.height = '70px';
    btn.style.background = 'rgba(255,255,255,0.2)';
    btn.style.backdropFilter = 'blur(5px)';
    btn.style.border = '2px solid white';
    btn.style.borderRadius = '15px';
    btn.style.display = 'flex';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';
    btn.style.color = 'white';
    btn.style.fontSize = '24px';
    btn.style.gridRow = row;
    btn.style.gridColumn = col;
    
    // Mapear eventos de toque para simular teclas no player
    const start = (e) => { e.preventDefault(); player.keys[id] = true; btn.style.background = 'rgba(255,255,255,0.5)'; };
    const end = (e) => { e.preventDefault(); player.keys[id] = false; btn.style.background = 'rgba(255,255,255,0.2)'; };
    
    btn.addEventListener('touchstart', start);
    btn.addEventListener('touchend', end);
    btn.addEventListener('mousedown', start);
    btn.addEventListener('mouseup', end);
    btn.addEventListener('mouseleave', end);
    
    return btn;
};

mobileControls.appendChild(createBtn('KeyW', '↑', 1, 2));
mobileControls.appendChild(createBtn('KeyA', '←', 2, 1));
mobileControls.appendChild(createBtn('KeyS', '↓', 2, 2));
mobileControls.appendChild(createBtn('KeyD', '→', 2, 3));

document.body.appendChild(mobileControls);

// Animation Loop
function animate() {
    requestAnimationFrame(animate);
    
    // Atualizar jogador (isso também atualiza a câmera)
    player.update();
    
    // Otimização: Renderizar apenas o que está perto do jogador
    updateAssetsOptimization(player.position);
    
    renderer.render(scene, camera);
}

animate();
