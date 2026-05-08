import * as THREE from 'three';
import { createClient } from '@supabase/supabase-js';
import { createTerrain } from './world/terreno.js';
import { Player } from './entities/player.js';
import { updateAssetsOptimization } from './world/ativos.js';
import { PlacementTool } from './world/placement_tool.js';
import { NpcPlacementTool } from './world/npc_placement_tool.js';
import { createNYCity } from './world/ny_city.js';
import { createHouse } from './world/casa.js';
import { createNightSky } from './world/ceu.js';
import { createHomemEmPe, createHomemSentado } from './world/npcs.js';

// Scene Setup
const scene = new THREE.Scene();
const starField = createNightSky(scene); // Configura fundo, fog e estrelas

// Camera Setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000); // Far plane aumentado para 1000 para a cidade
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

// Lights (Clareando um pouco mais a noite)
const ambientLight = new THREE.AmbientLight(0x333355, 0.7); // Mais claro, mas ainda tom de noite
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xbbddff, 0.9); // Luar mais forte
directionalLight.position.set(20, 100, 20);
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

// Hidden Ground Plane for Placement outside the map
const raycastPlaneGeo = new THREE.PlaneGeometry(2000, 2000);
const raycastPlaneMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 });
const raycastPlane = new THREE.Mesh(raycastPlaneGeo, raycastPlaneMat);
raycastPlane.rotation.x = -Math.PI / 2;
raycastPlane.position.y = 0; // No nível do chão
scene.add(raycastPlane);

// Add Player
const player = new Player(scene, camera);

// Modelo NY Permanente
createNYCity(scene, -165.04, -34.54);

// Modelo Casa Permanente (Posicionado milimetricamente com altura corrigida pelo usuário)
createHouse(scene, 42.36, 22.64, 119.04);

// NPCs (Personagens)
createHomemEmPe(scene);

// Homem Sentado 1 (De costas para a praça)
createHomemSentado(scene, -11.26, 6.16, 17.51, Math.PI);

// Homem Sentado 2 (De frente para o primeiro)
// O usuário solicitou Y exato de 6.5 para esse aqui
createHomemSentado(scene, -11.61, 6, 14.51, 0);

// Ferramenta de Posicionamento (Pausada)
// new NpcPlacementTool(scene, camera, '3D objetos/homem/homem_sentado.obj', {
//     targetScaleHeight: 3.5,
//     initialRotation: 0
// });


// Handle Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Lógica de Diálogo Inicial
const uiContainer = document.getElementById('ui-container');
const dialogueText = document.getElementById('dialogue-text');
const dialogueBtn = document.getElementById('dialogue-btn');

const initialMessage = "EU: Nossa, parece um lugar muito estranho e difícil de reconhecer. Mas, parando pra pensar... até que lembra uma balada malfeita.";
let charIndex = 0;

function typeWriter() {
    if (charIndex < initialMessage.length) {
        dialogueText.innerHTML += initialMessage.charAt(charIndex);
        charIndex++;
        setTimeout(typeWriter, 40); // Velocidade da digitação
    } else {
        // Mostra o botão ao terminar
        dialogueBtn.style.display = 'inline-block';
    }
}

// Configuração do Supabase
const supabaseUrl = 'https://mainyyxzwizvukmsibwe.supabase.co';
const supabaseKey = 'sb_publishable_SQ9hI5xAGbXdzTRrklIweA_SJIfJKGp';
const supabase = createClient(supabaseUrl, supabaseKey);

const instaModal = document.getElementById('insta-modal');
const instaInput = document.getElementById('insta-input');
const instaBtn = document.getElementById('insta-btn');
const instaMsg = document.getElementById('insta-msg');
let instaPhase = 1;

instaBtn.onclick = async () => {
    const username = instaInput.value.trim();
    if (!username) return;

    instaBtn.disabled = true;

    const valueToSave = instaPhase === 1 ? username : `2° envio ${username}`;

    const { data, error } = await supabase
      .from('usuarios_instagram')
      .insert([ { usuario: valueToSave } ]);

    instaBtn.disabled = false;

    if (error) {
        console.error('Erro ao salvar no banco:', error.message);
    }
    
    instaModal.style.display = 'none';
    instaInput.value = '';

    if (instaPhase === 1) {
        document.getElementById('start-modal').style.display = 'flex';
    } else {
        // Segunda fase (após clicar no botão "Tocar nos Orbes")
        uiContainer.style.display = 'block';
        dialogueBtn.style.display = 'none';
        dialogueText.innerHTML = '';
        
        const msgFinal = "EU: ...";
        let cIndexFinal = 0;
        function typeMsgFinal() {
            if (cIndexFinal < msgFinal.length) {
                dialogueText.innerHTML += msgFinal.charAt(cIndexFinal);
                cIndexFinal++;
                setTimeout(typeMsgFinal, 250);
            } else {
                dialogueBtn.style.display = 'inline-block';
                dialogueBtn.onclick = () => {
                    // Esconde todos os elementos do jogo e roda o vídeo
                    uiContainer.style.display = 'none';
                    if (mobileControls) mobileControls.style.display = 'none';
                    document.querySelector('canvas').style.display = 'none';
                    // O heartbeatContainer NÃO é escondido para continuar batendo na frente do vídeo!
                    
                    const video = document.getElementById('end-video');
                    video.src = 'assets/video/video.mp4';
                    video.style.display = 'block';
                    video.play();

                    video.onended = () => {
                        video.style.filter = 'blur(10px)';
                        video.style.transition = 'filter 2s ease';
                        
                        const endText = document.createElement('div');
                        endText.style.position = 'absolute';
                        endText.style.top = '50%';
                        endText.style.left = '50%';
                        endText.style.transform = 'translate(-50%, -50%)';
                        endText.style.color = 'white';
                        endText.style.fontSize = '32px';
                        endText.style.fontWeight = 'bold';
                        endText.style.fontFamily = 'monospace';
                        endText.style.textShadow = '2px 2px 5px black';
                        endText.style.zIndex = '100001';
                        document.body.appendChild(endText);
                        
                        const msgText = "Depois dessa, eu bloqueava!";
                        let j = 0;
                        function typeEndMsg() {
                            if (j < msgText.length) {
                                endText.innerHTML += msgText.charAt(j);
                                j++;
                                setTimeout(typeEndMsg, 150);
                            }
                        }
                        setTimeout(typeEndMsg, 500);
                    };
                };
            }
        }
        setTimeout(typeMsgFinal, 500);
    }
};

dialogueBtn.onclick = () => {
    // Esconde o painel inteiro e libera o jogador
    uiContainer.style.display = 'none';
    player.canMove = true;
};

// ==========================================
// GERENCIADOR DE EVENTOS E BATIMENTO CARDÍACO
// ==========================================
let currentStage = 0;
const coord1 = new THREE.Vector3(-80.07, 5.25, 53.15);
const coord2 = new THREE.Vector3(-64.46, 5.25, -25.30);
const coord3 = new THREE.Vector3(0.00, 5.54, 38.00); // Terceira Coordenada (mais pra frente)
const coord4 = new THREE.Vector3(52.00, 24.05, 93.00); // Quarta Coordenada (parando um pouco antes da árvore)

// Marcador criativo para a Coordenada 1 (Um pilar de luz flutuante)
const markerGeo = new THREE.OctahedronGeometry(1.5, 0);
const markerMat = new THREE.MeshBasicMaterial({ color: 0xff4444, wireframe: true });
const targetMarker = new THREE.Mesh(markerGeo, markerMat);
targetMarker.position.copy(coord1);
targetMarker.position.y = 8;
scene.add(targetMarker);

// Efeitos Visuais Especiais do Homem em Pé

// Criando uma textura circular por código para as partículas não serem quadradas
const pCanvas = document.createElement('canvas');
pCanvas.width = 32;
pCanvas.height = 32;
const pCtx = pCanvas.getContext('2d');
pCtx.beginPath();
pCtx.arc(16, 16, 16, 0, Math.PI * 2);
pCtx.fillStyle = 'white';
pCtx.fill();
const pTexture = new THREE.CanvasTexture(pCanvas);

// 1. Partículas
const particleGeo = new THREE.BufferGeometry();
const particleCount = 100;
const pPosArray = new Float32Array(particleCount * 3);
for (let i=0; i<particleCount * 3; i++) {
    pPosArray[i] = (Math.random() - 0.5) * 4; // Espalhamento
}
particleGeo.setAttribute('position', new THREE.BufferAttribute(pPosArray, 3));
const particleMat = new THREE.PointsMaterial({ 
    color: 0xffffff, 
    size: 0.3, 
    transparent: true, 
    opacity: 0.8, 
    map: pTexture,
    alphaTest: 0.1,
    blending: THREE.AdditiveBlending 
});
const auraParticles = new THREE.Points(particleGeo, particleMat);
auraParticles.position.copy(coord2);
auraParticles.position.y += 2.5; // Centro do corpo
auraParticles.visible = false;
scene.add(auraParticles);

// 2. Luz da Aura
const auraLight = new THREE.PointLight(0xffffff, 10, 30); // Intensidade aumentada
auraLight.position.copy(coord2);
auraLight.position.y += 2.5;
auraLight.visible = false;
scene.add(auraLight);

// 3. Grupo de Orbes Brilhantes (Transformação)
const orbGroup = new THREE.Group();
orbGroup.position.copy(coord2);
orbGroup.position.y += 4.0; // Orbes flutuando mais alto a pedido do usuário
orbGroup.visible = false;
scene.add(orbGroup);

const orbGeo = new THREE.SphereGeometry(0.3, 16, 16);
const orbMat = new THREE.MeshBasicMaterial({ 
    color: 0xaaddff, // Azul claro brilhante
    transparent: true, 
    opacity: 0.9, 
    blending: THREE.AdditiveBlending 
});

const orb1 = new THREE.Mesh(orbGeo, orbMat);
const orb2 = new THREE.Mesh(orbGeo, orbMat);
const orb3 = new THREE.Mesh(orbGeo, orbMat);

orb1.position.set(0.6, 0, 0);
orb2.position.set(-0.3, 0, 0.5);
orb3.position.set(-0.3, 0, -0.5);

orbGroup.add(orb1);
orbGroup.add(orb2);
orbGroup.add(orb3);

// A luz acompanha o grupo de orbes
const groupLight = new THREE.PointLight(0xaaddff, 8, 20);
orbGroup.add(groupLight);

const heartElement = document.getElementById('heart');
const heartbeatContainer = document.getElementById('heartbeat-container');

// Configuração do Áudio do Batimento (Sintetizado no navegador para não precisar de mp3)
let audioCtx = null;
let nextBeatTime = 0;
let beatInterval = 1.5; // Segundos
let heartbeatActive = false; // Flag de segurança para garantir que o som pare

const startBtn = document.getElementById('start-btn');
startBtn.onclick = () => {
    // Cria e desbloqueia o AudioContext no clique exato do usuário
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.value = 0;
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);

    // Inicia o coração logo de início
    heartbeatActive = true;
    heartbeatContainer.classList.add('heart-center');
    heartbeatContainer.style.display = 'block';
    
    playHeartbeat(audioCtx.currentTime);
    nextBeatTime = audioCtx.currentTime + beatInterval;

    setTimeout(() => {
        heartbeatContainer.classList.remove('heart-center');
    }, 2000);

    document.getElementById('start-modal').style.display = 'none';
    setTimeout(typeWriter, 500);
};

function playHeartbeat(time) {
    if (!heartbeatActive || !audioCtx) return; // Garante que não toca depois que passar de fase
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    // Tuntum 1
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(60, time);
    osc1.frequency.exponentialRampToValueAtTime(30, time + 0.1);
    
    // Volume AUMENTADO de 1.0 para 3.5
    gain1.gain.setValueAtTime(0, time);
    gain1.gain.linearRampToValueAtTime(3.5, time + 0.05);
    gain1.gain.linearRampToValueAtTime(0, time + 0.15);
    
    osc1.start(time);
    osc1.stop(time + 0.2);

    // Tuntum 2
    const time2 = time + 0.25;
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(70, time2);
    osc2.frequency.exponentialRampToValueAtTime(30, time2 + 0.1);
    
    gain2.gain.setValueAtTime(0, time2);
    gain2.gain.linearRampToValueAtTime(2.5, time2 + 0.05);
    gain2.gain.linearRampToValueAtTime(0, time2 + 0.15);
    
    osc2.start(time2);
    osc2.stop(time2 + 0.2);
}

function updateEvents() {
    if (!player) return;
    
    // Batimento Cardíaco Contínuo (roda em todas as fases)
    if (heartbeatActive && audioCtx) {
        if (audioCtx.currentTime > nextBeatTime) {
            playHeartbeat(nextBeatTime);
            nextBeatTime += beatInterval;
        }
    }
    
    const pPos = player.position;

    if (currentStage === 0) {
        // Anima o marcador
        targetMarker.rotation.y += 0.02;
        targetMarker.position.y = 8 + Math.sin(Date.now() * 0.003) * 1;

        // Verifica se chegou na Coordenada 1
        if (pPos.distanceTo(coord1) < 8) {
            currentStage = 1;
            scene.remove(targetMarker); // Remove o marcador
            
            // Pausa o jogo e mostra o segundo diálogo
            player.canMove = false;
            uiContainer.style.display = 'block';
            dialogueBtn.style.display = 'none';
            dialogueText.innerHTML = '';
            
            const msg2 = "EU: Nossa, que lugar sem vida e triste...";
            let cIndex = 0;
            
            function typeMsg2() {
                if (cIndex < msg2.length) {
                    dialogueText.innerHTML += msg2.charAt(cIndex);
                    cIndex++;
                    setTimeout(typeMsg2, 40);
                } else {
                    dialogueBtn.style.display = 'inline-block';
                    // Muda a ação do botão para revelar o homem e iniciar o terror
                    dialogueBtn.onclick = () => {
                        uiContainer.style.display = 'none';
                        player.canMove = true;
                        
                        // O Homem aparece e brilha!
                        if (window.homemEmPeObj) window.homemEmPeObj.visible = true;
                        auraParticles.visible = true;
                        auraLight.visible = true;
                        
                        currentStage = 2;
                    };
                }
            }
            setTimeout(typeMsg2, 500); // pequeno delay
        }
    } else if (currentStage === 2) {
        // Animação das partículas
        auraParticles.rotation.y += 0.01;
        const positions = auraParticles.geometry.attributes.position.array;
        for(let i = 1; i < particleCount * 3; i+=3) {
            positions[i] += Math.sin(Date.now() * 0.001 + i) * 0.01; // Sobe e desce
        }
        auraParticles.geometry.attributes.position.needsUpdate = true;

        // Lógica do Batimento Cardíaco Baseado na Distância para o Homem
        const distToMan = pPos.distanceTo(coord2);
        
        let factor = (distToMan - 5) / 75; 
        if (factor < 0) factor = 0;
        if (factor > 1) factor = 1;
        
        beatInterval = 0.3 + (factor * 1.2); 
        heartElement.style.animationDuration = beatInterval + 's';
        
        if (audioCtx && audioCtx.currentTime > nextBeatTime) {
            playHeartbeat(nextBeatTime);
            nextBeatTime += beatInterval;
        }

        // Chegou MUITO perto do Homem! (Stage 3)
        if (distToMan < 6) {
            currentStage = 3;
            
            // Pausa o jogo, mas mantém o batimento cardíaco frenético ativo!
            player.canMove = false;
            
            uiContainer.style.display = 'block';
            dialogueBtn.style.display = 'none';
            dialogueText.innerHTML = '';
            
            const msg3 = "EU: Nossa... Oi!";
            let cIndex3 = 0;
            
            function typeMsg3() {
                if (cIndex3 < msg3.length) {
                    dialogueText.innerHTML += msg3.charAt(cIndex3);
                    cIndex3++;
                    setTimeout(typeMsg3, 50);
                } else {
                    dialogueBtn.style.display = 'inline-block';
                    dialogueBtn.onclick = () => {
                        uiContainer.style.display = 'none';
                        player.canMove = true;
                        
                        // Inicia a transição bonita
                        currentStage = 3.5;
                    };
                }
            }
            setTimeout(typeMsg3, 500);
        }
    } else if (currentStage >= 3 && currentStage < 4) {
        // O coração continua batendo rápido durante todo o diálogo e transição
        beatInterval = 0.3;
        heartElement.style.animationDuration = '0.3s';
        if (audioCtx && audioCtx.currentTime > nextBeatTime) {
            playHeartbeat(nextBeatTime);
            nextBeatTime += beatInterval;
        }

        if (currentStage === 3.5) {
            // Animação de "Implosão" apenas das Partículas, o homem some instantaneamente
            auraParticles.rotation.y += 0.3; 
            auraParticles.scale.multiplyScalar(0.95);

            if (window.homemEmPeObj && window.homemEmPeObj.visible) {
                // Apenas desaparece sem encolher, como o usuário pediu
                window.homemEmPeObj.visible = false;
            }

            // Quando as partículas ficarem minúsculas, os orbes nascem
            if (auraParticles.scale.y < 0.1) {
                orbGroup.scale.set(0.1, 0.1, 0.1); // Começam minúsculos
                orbGroup.visible = true;
                currentStage = 3.8;
            }
        } else if (currentStage === 3.8) {
            // Animação dos orbes crescendo e assumindo o controle
            auraParticles.rotation.y += 0.2;
            orbGroup.rotation.y += 0.2;
            
            if (orbGroup.scale.x < 1.0) {
                orbGroup.scale.addScalar(0.05); // Orbes inflam
            } else {
                // Transição finalizada, começa a viajar
                auraParticles.visible = false;
                auraLight.visible = false;
                currentStage = 4;
            }
        }
    } else if (currentStage === 4) {
        // Coração se mantém
        beatInterval = 0.3;
        heartElement.style.animationDuration = '0.3s';
        if (audioCtx.currentTime > nextBeatTime) {
            playHeartbeat(nextBeatTime);
            nextBeatTime += beatInterval;
        }

        // Animação dos 3 Orbes girando loucamente entre si
        orbGroup.rotation.y += 0.08;
        orbGroup.rotation.x += 0.04;
        orbGroup.rotation.z += 0.06;
        
        // Movimento do Grupo em direção à Coordenada 3
        const dir2D = new THREE.Vector3(coord3.x, 0, coord3.z).sub(new THREE.Vector3(orbGroup.position.x, 0, orbGroup.position.z));
        const dist2D = dir2D.length();
        
        if (dist2D > 1.0) {
            dir2D.normalize();
            orbGroup.position.x += dir2D.x * 0.08;
            orbGroup.position.z += dir2D.z * 0.08;
            
            // Respeitando a altura real do terreno
            const tHeight = player.getTerrainHeight(orbGroup.position.x, orbGroup.position.z);
            orbGroup.position.y = tHeight + 2.5 + Math.sin(Date.now() * 0.005) * 0.3;
        } else {
            // Chegou na Coord 3
            currentStage = 5;
        }
    } else if (currentStage === 5) {
        // Coração se mantém acelerado
        beatInterval = 0.3;
        if (audioCtx.currentTime > nextBeatTime) {
            playHeartbeat(nextBeatTime);
            nextBeatTime += beatInterval;
        }

        // Bloqueia o andar para trás para o jogador não fugir!
        player.canMoveBackward = false;
        const keySBtn = document.getElementById('KeyS');
        if (keySBtn) {
            keySBtn.style.opacity = '0.3';
            keySBtn.style.backgroundColor = 'rgba(100, 100, 100, 0.5)';
        }

        // Orbes ficam esperando o player chegar na Coordenada 3 (banco)
        orbGroup.rotation.y += 0.05;
        orbGroup.rotation.x += 0.02;
        orbGroup.rotation.z += 0.03;
        orbGroup.position.y = coord3.y + 1.5 + Math.sin(Date.now() * 0.002) * 0.3; // flutuando de leve
        
        const distToOrbs = pPos.distanceTo(orbGroup.position);
        if (distToOrbs < 8) {
            // Chegou perto dos Orbes no banco!
            currentStage = 6;
            
            // Os dois homens sentados aparecem magicamente
            if (window.homensSentados) {
                window.homensSentados.forEach(homem => homem.visible = true);
                
                // Transfere o efeito de partículas para o primeiro homem sentado
                auraParticles.position.copy(window.homensSentados[0].position);
                auraParticles.position.y += 1.5;
                // Deixa as partículas BEM grudadinhas nele para mostrar quem é o especial
                auraParticles.scale.set(0.6, 0.6, 0.6); 
                auraParticles.visible = true;
                
                // A luz também acompanha ele
                auraLight.position.copy(window.homensSentados[0].position);
                auraLight.position.y += 1.5;
                auraLight.visible = true;
            }
        }
    } else if (currentStage === 6) {
        // O jogo acaba e o coração continua a bater sem parar
        beatInterval = 0.3;
        if (audioCtx.currentTime > nextBeatTime) {
            playHeartbeat(nextBeatTime);
            nextBeatTime += beatInterval;
        }

        // Anima os orbes rodeando o homem sentado
        if (window.homensSentados && window.homensSentados[0]) {
            orbGroup.position.copy(window.homensSentados[0].position);
            orbGroup.position.y += 1.5 + Math.sin(Date.now() * 0.002) * 0.3;
            orbGroup.rotation.y += 0.05;
            orbGroup.rotation.x += 0.02;
            orbGroup.rotation.z += 0.03;
        }

        // As partículas continuam se movendo APERTADAS ao redor do homem sentado especial
        auraParticles.rotation.y += 0.01;
        const positions = auraParticles.geometry.attributes.position.array;
        for(let i = 1; i < particleCount * 3; i+=3) {
            positions[i] += Math.sin(Date.now() * 0.001 + i) * 0.01;
        }
        auraParticles.geometry.attributes.position.needsUpdate = true;

        // Checando proximidade com o homem sentado
        if (window.homensSentados && window.homensSentados[0]) {
            const distToSeated = pPos.distanceTo(window.homensSentados[0].position);
            if (distToSeated < 5) {
                currentStage = 7;
                
                player.canMove = false;
                uiContainer.style.display = 'block';
                dialogueBtn.style.display = 'none';
                dialogueText.innerHTML = '';
                
                const msg4 = "EU: ...";
                let cIndex4 = 0;
                function typeMsg4() {
                    if (cIndex4 < msg4.length) {
                        dialogueText.innerHTML += msg4.charAt(cIndex4);
                        cIndex4++;
                        setTimeout(typeMsg4, 250); // BEM Lento para dar impacto
                    } else {
                        dialogueBtn.style.display = 'inline-block';
                        dialogueBtn.onclick = () => {
                            uiContainer.style.display = 'none';
                            player.canMove = true;
                            currentStage = 7.5;
                        };
                    }
                }
                setTimeout(typeMsg4, 500);
            }
        }
    } else if (currentStage >= 7.5 && currentStage < 8) {
        // Coração ativo
        beatInterval = 0.3;
        if (audioCtx.currentTime > nextBeatTime) {
            playHeartbeat(nextBeatTime);
            nextBeatTime += beatInterval;
        }

        if (currentStage === 7.5) {
            // Implosão do homem sentado
            auraParticles.rotation.y += 0.3;
            auraParticles.scale.multiplyScalar(0.95);
            
            if (window.homensSentados && window.homensSentados[0]) {
                window.homensSentados[0].scale.multiplyScalar(0.92);
                window.homensSentados[0].rotation.y += 0.5;
                
                if (window.homensSentados[0].scale.y < 0.05) {
                    window.homensSentados[0].visible = false;
                    
                    // Orbes já estão posicionados, só precisam voltar a ser pequenos e crescer
                    orbGroup.scale.set(0.1, 0.1, 0.1);
                    currentStage = 7.8;
                }
            }
        } else if (currentStage === 7.8) {
            // Orbes inflam novamente
            auraParticles.rotation.y += 0.2;
            orbGroup.rotation.y += 0.2;
            if (orbGroup.scale.x < 1.0) {
                orbGroup.scale.addScalar(0.05);
            } else {
                auraParticles.visible = false;
                auraLight.visible = false;
                currentStage = 8;
            }
        }
    } else if (currentStage === 8) {
        // Coração ativo
        beatInterval = 0.3;
        if (audioCtx.currentTime > nextBeatTime) {
            playHeartbeat(nextBeatTime);
            nextBeatTime += beatInterval;
        }

        // Orbes voam para a Coordenada 4 seguindo o terreno
        orbGroup.rotation.y += 0.08;
        orbGroup.rotation.x += 0.04;
        orbGroup.rotation.z += 0.06;
        
        const dir2D = new THREE.Vector3(coord4.x, 0, coord4.z).sub(new THREE.Vector3(orbGroup.position.x, 0, orbGroup.position.z));
        const dist2D = dir2D.length();
        
        if (dist2D > 1.0) {
            dir2D.normalize();
            orbGroup.position.x += dir2D.x * 0.08;
            orbGroup.position.z += dir2D.z * 0.08;
            
            // Altura real
            const tHeight = player.getTerrainHeight(orbGroup.position.x, orbGroup.position.z);
            orbGroup.position.y = tHeight + 3.0 + Math.sin(Date.now() * 0.005) * 0.4;
        } else {
            currentStage = 9; // Chegou na 4ª coordenada
        }
    } else if (currentStage === 9 || currentStage === 10) {
        // Os orbes continuam flutuando e dançando na 4º coordenada
        orbGroup.rotation.y += 0.1;
        orbGroup.rotation.x += 0.05;
        orbGroup.rotation.z += 0.08;
        
        const tHeight = player.getTerrainHeight(orbGroup.position.x, orbGroup.position.z);
        orbGroup.position.y = tHeight + 3.0 + Math.sin(Date.now() * 0.005) * 0.5;

        // O coração fica insano (Ainda mais acelerado!)
        beatInterval = 0.15;
        heartElement.style.animationDuration = '0.15s';
        if (audioCtx && audioCtx.currentTime > nextBeatTime) {
            playHeartbeat(nextBeatTime);
            nextBeatTime += beatInterval;
        }

        if (currentStage === 9) {
            const distToFinal = pPos.distanceTo(orbGroup.position);
            // Requer que o player chegue perto (quina do terreno) para prosseguir
            if (distToFinal < 12 && !window.waitingForButton) {
                window.waitingForButton = true;
                // Espera 2 segundos e mostra o botão "Tocar"
                setTimeout(() => {
                    const touchBtn = document.createElement('button');
                    touchBtn.id = 'touch-orbs-btn';
                    touchBtn.innerHTML = 'Tocar nos Orbes';
                    touchBtn.style.position = 'absolute';
                    touchBtn.style.top = '50%';
                    touchBtn.style.left = '50%';
                    touchBtn.style.transform = 'translate(-50%, -50%)';
                    touchBtn.style.padding = '15px 30px';
                    touchBtn.style.fontSize = '20px';
                    touchBtn.style.color = 'white';
                    touchBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                    touchBtn.style.border = '2px solid white';
                    touchBtn.style.borderRadius = '10px';
                    touchBtn.style.backdropFilter = 'blur(5px)';
                    touchBtn.style.cursor = 'pointer';
                    touchBtn.style.zIndex = '1000';
                    
                    touchBtn.onclick = () => {
                        touchBtn.remove(); // Remove o botão de tocar
                        currentStage = 10;
                        player.canMove = false;
                        
                        instaPhase = 2;
                        instaMsg.innerText = "Confirme seu usuário do Instagram para continuar:";
                        instaModal.style.display = 'flex';
                    };
                    
                    document.body.appendChild(touchBtn);
                }, 2000);
            }
        }
    }
}
// ==========================================

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

    // Atualizar Eventos
    updateEvents();

    // Atualizar jogador (isso também atualiza a câmera)
    player.update();

    // Otimização: Renderizar apenas o que está perto do jogador
    updateAssetsOptimization(player.position);

    // Animação sutil do céu estrelado (roda beeeeem devagar)
    if (starField) {
        starField.rotation.y += 0.0002;
    }

    renderer.render(scene, camera);
}

animate();
