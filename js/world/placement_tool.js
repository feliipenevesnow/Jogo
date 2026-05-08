import * as THREE from 'three';
import { WORLD_CONFIG, getHillEffect, getNoise } from './config.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

/**
 * Sistema de posicionamento interativo para o objeto colossal.
 */
export class PlacementTool {
    constructor(scene, camera, terrain, onPlace) {
        this.scene = scene;
        this.camera = camera;
        this.terrain = terrain;
        this.onPlace = onPlace;
        
        this.markedPoints = []; // Lista para armazenar as coordenadas
        
        // Guia Visual: Um pequeno quadrado vermelho (2x2 metros)
        const ghostGeo = new THREE.BoxGeometry(2, 0.5, 2);
        this.ghost = new THREE.Mesh(
            ghostGeo,
            new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.6 })
        );
        this.scene.add(this.ghost);

        // Painel flutuante com o mouse
        this.coordDisplay = document.createElement('div');
        this.coordDisplay.style.position = 'fixed';
        this.coordDisplay.style.background = 'rgba(0, 0, 0, 0.8)';
        this.coordDisplay.style.color = '#ffaa00';
        this.coordDisplay.style.padding = '10px';
        this.coordDisplay.style.borderRadius = '5px';
        this.coordDisplay.style.fontFamily = 'Arial, sans-serif';
        this.coordDisplay.style.fontSize = '16px';
        this.coordDisplay.style.fontWeight = 'bold';
        this.coordDisplay.style.zIndex = '9999';
        this.coordDisplay.style.pointerEvents = 'none'; // Para não bloquear o clique
        document.body.appendChild(this.coordDisplay);

        // Painel fixo na esquerda para listar os pontos gravados
        this.listDisplay = document.createElement('div');
        this.listDisplay.style.position = 'fixed';
        this.listDisplay.style.top = '20px';
        this.listDisplay.style.left = '20px';
        this.listDisplay.style.background = 'rgba(0, 50, 100, 0.9)';
        this.listDisplay.style.color = 'white';
        this.listDisplay.style.padding = '20px';
        this.listDisplay.style.borderRadius = '10px';
        this.listDisplay.style.fontFamily = 'monospace';
        this.listDisplay.style.fontSize = '18px';
        this.listDisplay.style.zIndex = '9999';
        this.listDisplay.style.maxHeight = '80vh';
        this.listDisplay.style.overflowY = 'auto';
        this.listDisplay.innerHTML = '<h3>Coordenadas de Eventos</h3><ul id="coordList" style="list-style-type: none; padding: 0;">Nenhum ponto marcado ainda.</ul>';
        document.body.appendChild(this.listDisplay);

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('click', (e) => this.onClick(e));
    }

    onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Fazer a janelinha acompanhar o mouse
        this.coordDisplay.style.left = (event.clientX + 15) + 'px';
        this.coordDisplay.style.top = (event.clientY + 15) + 'px';

        this.raycaster.setFromCamera(this.mouse, this.camera);
        // Intersecar com qualquer coisa no cenário
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);

        // Ignorar o próprio fantasma ou os marcadores já colocados
        const validIntersect = intersects.find(i => i.object !== this.ghost && !i.object.isMarker);

        if (validIntersect) {
            const point = validIntersect.point;
            
            const x = point.x.toFixed(2);
            const z = point.z.toFixed(2);
            
            const hill = getHillEffect(point.x);
            const noise = getNoise(point.x, point.z, WORLD_CONFIG.width, WORLD_CONFIG.depth);
            const yPos = WORLD_CONFIG.baseHeight + hill + noise + 0.25; // Levemente acima do chão
            
            this.ghost.position.set(point.x, yPos, point.z);
            
            this.coordDisplay.innerHTML = `Clique para Marcar<br>X: ${x} | Z: ${z}`;
        }
    }

    onClick() {
        const x = this.ghost.position.x.toFixed(2);
        const y = this.ghost.position.y.toFixed(2);
        const z = this.ghost.position.z.toFixed(2);
        
        // Criar marcador permanente azul claro
        const markerGeo = new THREE.BoxGeometry(2, 0.5, 2);
        const markerMat = new THREE.MeshBasicMaterial({ color: 0x00aaff });
        const marker = new THREE.Mesh(markerGeo, markerMat);
        marker.position.copy(this.ghost.position);
        marker.isMarker = true; // Flag para ignorar no raycast
        this.scene.add(marker);

        // Adicionar na lista
        this.markedPoints.push({ x, y, z });
        this.updateListUI();
    }

    updateListUI() {
        const listUl = document.getElementById('coordList');
        listUl.innerHTML = ''; // Limpar
        
        this.markedPoints.forEach((pt, index) => {
            const li = document.createElement('li');
            li.style.marginBottom = '10px';
            li.style.borderBottom = '1px solid rgba(255,255,255,0.2)';
            li.style.paddingBottom = '5px';
            li.innerHTML = `<b style="color: #00ff00;">${index + 1}º:</b> X: ${pt.x}, Y: ${pt.y}, Z: ${pt.z}`;
            listUl.appendChild(li);
        });
    }
}
