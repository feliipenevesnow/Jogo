import * as THREE from 'three';
import { WORLD_CONFIG, getHillEffect, getNoise } from './config.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'; // Importado para suportar o banco.glb

export class NpcPlacementTool {
    constructor(scene, camera, npcObjPath, options, onPlace) {
        this.scene = scene;
        this.camera = camera;
        this.onPlace = onPlace;
        
        this.ghost = new THREE.Group();
        this.scene.add(this.ghost);

        const isGLB = npcObjPath.toLowerCase().endsWith('.glb') || npcObjPath.toLowerCase().endsWith('.gltf');

        const processModel = (obj) => {
            const box = new THREE.Box3().setFromObject(obj);
            const size = new THREE.Vector3();
            box.getSize(size);
            
            let scaleFactor = 1;
            if (options.targetWidth) {
                scaleFactor = options.targetWidth / size.x;
            } else if (options.targetScaleHeight) {
                scaleFactor = options.targetScaleHeight / size.y;
            }
            
            obj.scale.set(scaleFactor, scaleFactor, scaleFactor);
            
            obj.traverse((child) => {
                if (child.isMesh) {
                    if (child.material) {
                        child.material = new THREE.MeshStandardMaterial({
                            color: 0x00ffaa, 
                            transparent: true,
                            opacity: 0.6,
                            side: THREE.DoubleSide
                        });
                    }
                }
            });

            const bottomY = box.min.y * scaleFactor;
            obj.position.y = -bottomY;
            obj.rotation.y = options.initialRotation !== undefined ? options.initialRotation : Math.PI;

            this.ghost.add(obj);
        };

        if (isGLB) {
            const loader = new GLTFLoader();
            loader.load(npcObjPath, (gltf) => {
                processModel(gltf.scene);
            });
        } else {
            const loader = new OBJLoader();
            loader.load(npcObjPath, (obj) => {
                processModel(obj);
            });
        }

        
        this.coordDisplay = document.createElement('div');
        this.coordDisplay.style.position = 'fixed';
        this.coordDisplay.style.top = '10px';
        this.coordDisplay.style.right = '10px';
        this.coordDisplay.style.background = 'rgba(0, 150, 255, 0.9)';
        this.coordDisplay.style.color = 'white';
        this.coordDisplay.style.padding = '20px';
        this.coordDisplay.style.borderRadius = '10px';
        this.coordDisplay.style.fontFamily = 'Arial, sans-serif';
        this.coordDisplay.style.fontSize = '24px';
        this.coordDisplay.style.fontWeight = 'bold';
        this.coordDisplay.style.zIndex = '9999';
        this.coordDisplay.innerHTML = 'Posicionando NPC - Mova o Mouse';
        document.body.appendChild(this.coordDisplay);

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.yOffset = 0; 
        this.rotationOffset = 0;
        this.scaleMultiplier = 1.0; // Adicionado para permitir redimensionar

        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('click', (e) => this.onClick(e));
        window.addEventListener('wheel', (e) => {
            if (e.ctrlKey) {
                // CTRL + Scroll para aumentar/diminuir o tamanho do objeto!
                this.scaleMultiplier -= e.deltaY * 0.001;
                this.scaleMultiplier = Math.max(0.1, this.scaleMultiplier); // Não deixar ficar invisível
            } else if (e.shiftKey) {
                // SHIFT + Scroll para rotacionar
                this.rotationOffset += e.deltaY * 0.005;
                this.ghost.rotation.y = this.rotationOffset;
            } else {
                // Apenas Scroll para subir/descer
                this.yOffset -= e.deltaY * 0.01; 
            }
            if (this.lastIntersect) this.updateGhostPosition(this.lastIntersect);
        });
    }

    onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);

        const validIntersect = intersects.find(i => {
            let obj = i.object;
            while(obj) {
                if (obj === this.ghost) return false;
                obj = obj.parent;
            }
            return true;
        });

        if (validIntersect) {
            this.lastIntersect = validIntersect.point;
            this.updateGhostPosition(this.lastIntersect);
        }
    }

    updateGhostPosition(point) {
        const x = point.x.toFixed(2);
        const z = point.z.toFixed(2);
        
        const hill = getHillEffect(point.x);
        const noise = getNoise(point.x, point.z, WORLD_CONFIG.width, WORLD_CONFIG.depth);
        const yPos = WORLD_CONFIG.baseHeight + hill + noise + this.yOffset;
        
        this.ghost.position.set(point.x, yPos, point.z);
        
        // Aplicar a escala dinâmica se o usuário alterou com o CTRL
        if (this.ghost.children.length > 0) {
            const obj = this.ghost.children[0];
            const baseScale = obj.userData.baseScale || obj.scale.x;
            if (!obj.userData.baseScale) obj.userData.baseScale = baseScale;
            
            const finalScale = baseScale * this.scaleMultiplier;
            obj.scale.set(finalScale, finalScale, finalScale);
        }
        
        this.coordDisplay.innerHTML = `NPC / Objeto<br>X: ${x}<br>Y: ${yPos.toFixed(2)}<br>Z: ${z}<br>Tamanho: ${this.scaleMultiplier.toFixed(2)}x<br><small>Scroll: Altura | SHIFT+Scroll: Girar<br>CTRL+Scroll: Tamanho<br>Clique para Fixar</small>`;
    }

    onClick() {
        const x = this.ghost.position.x.toFixed(2);
        const y = this.ghost.position.y.toFixed(2);
        const z = this.ghost.position.z.toFixed(2);
        const rot = this.ghost.rotation.y.toFixed(2);
        const scale = this.scaleMultiplier.toFixed(2);
        
        console.log(`Coordenadas: X: ${x}, Y: ${y}, Z: ${z}, Rot: ${rot}, Escala: ${scale}`);
        alert(`Objeto fixado!\nX: ${x}\nY: ${y}\nZ: ${z}\nRotação: ${rot}\nEscala: ${scale}\nCopie e envie para o chat.`);
        
        if (this.onPlace) {
            this.onPlace(this.ghost.position.x, this.ghost.position.y, this.ghost.position.z, this.ghost.rotation.y, this.scaleMultiplier);
        }
    }
}
