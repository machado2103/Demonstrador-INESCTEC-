/**
 * Three.js Setup for Palletization Simulator
 * Creates the 3D environment for visualizing pallet stacking with center of mass visualization
 */

class PalletSimulator {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        
        if (!this.container) {
            throw new Error(`Container with ID '${containerId}' not found`);
        }
        
        // Three.js core components
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        
        // Lighting
        this.ambientLight = null;
        this.directionalLight = null;
        
        // Scene objects
        this.pallet = null;
        this.boxes = [];
        
        // Center of mass visualization components
        this.centerOfMassGroup = null;
        this.centerOfMassBeam = null;
        this.centerOfMassCross = null;
        this.centerOfMassGlow = null;
        this.palletCenterReference = null;  // Green reference point at geometric center
        
        // Animation
        this.animationId = null;
        
        this.init();
    }
    
    /**
     * Initialize the entire 3D environment
     */
    init() {
        this.createScene();
        this.createCamera();
        this.createRenderer();
        this.createLights();
        this.createControls();
        this.createPallet();
        this.setupEventListeners();
        this.animate();
    }
    
    /**
     * Create the 3D scene
     */
    createScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xe3f2fd);
        this.scene.fog = new THREE.Fog(0xe3f2fd, 10, 100);
    }
    
    /**
     * Create perspective camera
     */
    createCamera() {
        const containerRect = this.container.getBoundingClientRect();
        const aspect = containerRect.width / containerRect.height;
        
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    this.camera.position.set(0, 8, 15);  // Mais alta e mais próxima
    this.camera.lookAt(0, -9, 0);         // Olhar para baixo da palete
    }
    
    /**
     * Create WebGL renderer
     */
    createRenderer() {
        if (!window.WebGLRenderingContext) {
            throw new Error('WebGL is not supported by this browser');
        }
        
        this.renderer = new THREE.WebGLRenderer({    //No windows isto pode dar clash mas tenho que ver quando mudar (por causa dos drivers)
            antialias: true,
            alpha: true
        });
        
        const containerRect = this.container.getBoundingClientRect();
        this.renderer.setSize(containerRect.width, containerRect.height);
        
        // Enable shadows
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        this.container.appendChild(this.renderer.domElement);
    }
    
    /**
     * Create optimized lighting for data visualization
     */
    createLights() {
        // Strong ambient light for even illumination
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(this.ambientLight);
        
        // Primary directional light with reduced intensity to minimize harsh shadows
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
        this.directionalLight.position.set(10, 10, 5);
        this.directionalLight.castShadow = true;
        
        // Configure shadow parameters
        this.directionalLight.shadow.mapSize.width = 1024;
        this.directionalLight.shadow.mapSize.height = 1024;
        this.directionalLight.shadow.camera.near = 0.5;
        this.directionalLight.shadow.camera.far = 50;
        this.directionalLight.shadow.camera.left = -15;
        this.directionalLight.shadow.camera.right = 15;
        this.directionalLight.shadow.camera.top = 15;
        this.directionalLight.shadow.camera.bottom = -15;
        
        this.scene.add(this.directionalLight);
        
        // Fill lights to eliminate remaining shadows
        const fillLight1 = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight1.position.set(-10, 8, -5);
        fillLight1.castShadow = false;
        this.scene.add(fillLight1);
        
        const fillLight2 = new THREE.DirectionalLight(0xffffff, 0.2);
        fillLight2.position.set(5, 10, -10);
        fillLight2.castShadow = false;
        this.scene.add(fillLight2);
    }
    
    /**
     * Create camera controls for user interaction
     */
    createControls() {
        if (typeof THREE.OrbitControls !== 'undefined') {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.screenSpacePanning = false;
            this.controls.minDistance = 2;
            this.controls.maxDistance = 50;
            this.controls.maxPolarAngle = Math.PI / 2;
        } else {
            console.warn('OrbitControls not available - camera will be static');
        }
    }
    
    /**
     * Create pallet with precise specifications
     * Dimensions: 1200mm × 800mm × 144mm (12.0 × 8.0 × 1.44 units)
     */
    createPallet() {
        // Pallet dimensions (1mm = 0.01 units)
        const palletLength = 12.0;  // 1200mm
        const palletWidth = 8.0;    // 800mm  
        const palletHeight = 1.44;  // 144mm total height
        const woodColor = 0xd6aa69; // Light wood color
        
        this.pallet = new THREE.Group();
        
        this.createPalletTopSurface(palletLength, palletWidth, palletHeight, woodColor);
        this.createPalletSupportBlocks(palletLength, palletWidth, palletHeight, woodColor);
        this.createPalletBottomBoards(palletLength, palletWidth, palletHeight, woodColor);

        this.pallet.position.y = -8;
        
        this.scene.add(this.pallet);
    }

    /**
     * Create center of mass visualization beam
     */
    createCenterOfMassBeam() {
        this.centerOfMassGroup = new THREE.Group();
        this.centerOfMassGroup.name = 'CenterOfMassVisualization';
        
        // Calculate beam dimensions
        const palletHeight = 1.44;
        const palletOffset = -8;
        const beamStartY = -(palletHeight / 2) + palletOffset;
        const beamEndY = 1000;
        const beamHeight = beamEndY - beamStartY;
        const beamRadius = 0.1;
        
        // Create beam geometry
        const beamGeometry = new THREE.CylinderGeometry(
            beamRadius, beamRadius, beamHeight, 8, 1
        );
        
        // Create beam material with enhanced visibility
        const beamMaterial = new THREE.MeshBasicMaterial({
            color: 0x2c5282,
            transparent: true,
            opacity: 0.1,
            blending: THREE.NormalBlending,
            depthWrite: false,
            side: THREE.DoubleSide,
            emissive: 0x1a365d,
            emissiveIntensity: 0.3
        });
        
        this.centerOfMassBeam = new THREE.Mesh(beamGeometry, beamMaterial);
        this.centerOfMassBeam.position.y = beamStartY + (beamHeight / 2);
        this.centerOfMassBeam.castShadow = false;
        this.centerOfMassBeam.receiveShadow = false;
        
        this.centerOfMassBeam.userData = {
            baseHeight: beamStartY + (beamHeight / 2),
            isVisible: true
        };
        
        this.centerOfMassGroup.add(this.centerOfMassBeam);
        
        this.createBeamGlowSprite();
        this.createCenterOfMassIcon();
        this.createFixedPalletCenterReference();
        
        this.scene.add(this.centerOfMassGroup);
        this.hideCenterOfMassBeam();
    }

    /**
     * Create glow sprite effect for the beam
     */
    createBeamGlowSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const context = canvas.getContext('2d');
        
        // Create radial gradient
        const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 0, 0, 1.0)');
        gradient.addColorStop(0.3, 'rgba(255, 0, 0, 0.8)');
        gradient.addColorStop(0.7, 'rgba(255, 0, 0, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0.0)');
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, 64, 64);
        
        const glowTexture = new THREE.CanvasTexture(canvas);
        
        const spriteMaterial = new THREE.SpriteMaterial({
            map: glowTexture,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        this.centerOfMassGlow = new THREE.Sprite(spriteMaterial);
        this.centerOfMassGlow.scale.set(2, 2, 1);
        
        const palletHeight = 1.44;
        const beamStartY = -(palletHeight / 2);
        const beamEndY = 1000;
        const topOfBeam = beamEndY - beamStartY - (beamStartY + ((beamEndY - beamStartY) / 2));
        this.centerOfMassGlow.position.y = topOfBeam;
        
        this.centerOfMassGroup.add(this.centerOfMassGlow);
    }

createCenterOfMassIcon() {
    const symbolRadius = 0.4;        // Tamanho do símbolo no mundo 3D
    const symbolHeight = 0.02;       // Espessura muito fina
    
    // === CRIAR TEXTURA NO CANVAS ===
    const canvas = document.createElement('canvas');
    const size = 128;                // Resolução da textura
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Definir centro e raio do círculo
    const centerX = size / 2;        // Centro X = 64 pixels
    const centerY = size / 2;        // Centro Y = 64 pixels  
    const circleRadius = size * 0.25 // Raio = 40% do canvas = ~51 pixels
    
    // === PASSO 1: FUNDO TRANSPARENTE ===
    // Limpar tudo (deixar transparente)
    ctx.clearRect(0, 0, size, size);
    
    // === PASSO 2: CÍRCULO PRETO ===
    ctx.fillStyle = '#f8f8f8';
    ctx.beginPath();
    ctx.arc(centerX, centerY, circleRadius, 0, Math.PI * 2);
    ctx.fill();

    // === NOVO PASSO 2.5: QUADRANTE SUPERIOR-DIREITO PRETO ===
    ctx.fillStyle = '#4a4a4a';
    ctx.beginPath();
    // Começar no centro do círculo
    ctx.moveTo(centerX, centerY);
    // Desenhar linha até ao INÍCIO do arco (-π/2 = 12 horas = topo)
    ctx.lineTo(centerX, centerY - circleRadius);
    // Desenhar o arco de -π/2 a 0 (de 12h até 3h)
    ctx.arc(centerX, centerY, circleRadius, -Math.PI/2, 0, false);
    // Fechar voltando ao centro
    ctx.lineTo(centerX, centerY);
    ctx.fill();

    // === NOVO: QUADRANTE INFERIOR ESQUERDO ===
    ctx.fillStyle = '#4a4a4a';
    ctx.beginPath();
    // Começar no centro
    ctx.moveTo(centerX, centerY);
    // Linha até ao INÍCIO do segundo arco (π/2 = 6 horas = fundo)
    ctx.lineTo(centerX, centerY + circleRadius);
    // Arco de π/2 até π (de 6h até 9h = fundo até esquerda)
    ctx.arc(centerX, centerY, circleRadius, Math.PI/2, Math.PI, false);
    // Voltar ao centro
    ctx.lineTo(centerX, centerY);
    ctx.fill();
    
    // === PASSO 3: CONTORNO DO CÍRCULO (um pouco mais grosso) ===
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 4;               // Linha ligeiramente mais grossa
    ctx.beginPath();
    ctx.arc(centerX, centerY, circleRadius, 0, Math.PI * 2);
    ctx.stroke();
    
    // === PASSO 4: MIRA INTERNA (duas linhas em cruz) ===
    ctx.strokeStyle = '#2a2a2a';       // Linhas brancas para contraste contra o fundo preto
    ctx.lineWidth = 4;               // Mesma grossura que o contorno
    ctx.lineCap = 'round';           // Extremidades arredondadas para melhor visual
    
    // Linha horizontal da mira
    ctx.beginPath();
    ctx.moveTo(centerX - circleRadius * 1.1, centerY);  // Começar a 70% do raio à esquerda
    ctx.lineTo(centerX + circleRadius * 1.1, centerY);  // Terminar a 70% do raio à direita
    ctx.stroke();
    
    // Linha vertical da mira  
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - circleRadius * 1.1);  // Começar a 70% do raio acima
    ctx.lineTo(centerX, centerY + circleRadius * 1.1);  // Terminar a 70% do raio abaixo
    ctx.stroke();
    
    // === CRIAR TEXTURA THREE.JS ===
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    // === CRIAR GEOMETRIA SIMPLES ===
    // Usar um plano simples em vez de cilindro para evitar problemas de orientação
    const symbolGeometry = new THREE.PlaneGeometry(
        symbolRadius * 2,            // Largura (diâmetro)
        symbolRadius * 2             // Altura (diâmetro) 
    );
    
    // === MATERIAL COM TRANSPARÊNCIA ===
    const symbolMaterial = new THREE.MeshBasicMaterial({
        map: texture,                // Aplicar nossa textura
        transparent: true,           // Permitir transparência
        alphaTest: 0.1,             // Descartar pixels quase transparentes
        side: THREE.DoubleSide,      // Visível de ambos os lados
        depthWrite: false            // Evitar problemas de profundidade
    });
    
    // === CRIAR O MESH FINAL ===
    this.centerOfMassCross = new THREE.Mesh(symbolGeometry, symbolMaterial);
    
    // === ORIENTAÇÃO CORRETA ===
    // Manter horizontal - sem rotações complexas!
    // O plano já está na orientação certa por defeito
    this.centerOfMassCross.rotation.x = -Math.PI / 2;  // Apenas rotacionar para ficar horizontal no chão
    
    // === CONFIGURAÇÕES FINAIS ===
    this.centerOfMassCross.castShadow = false;      // Sem sombras
    this.centerOfMassCross.receiveShadow = false;   // Sem receber sombras
    
    // Adicionar ao grupo do centro de massa
    this.centerOfMassGroup.add(this.centerOfMassCross);
    this.centerOfMassCross.position.y = 0;
    
    console.log('PASSO 1: Símbolo básico de centro de massa criado');
}

/**
 * OPCIONAL: Função auxiliar para debug da textura
 * Chama esta função no console para ver como ficou a textura
 */
debugCenterOfMassTexture() {
    if (this.centerOfMassCross && this.centerOfMassCross.material.map) {
        // Criar uma imagem temporária para visualizar a textura
        const canvas = this.centerOfMassCross.material.map.image;
        const dataURL = canvas.toDataURL();
        
        console.log('Textura do centro de massa criada:');
        console.log('Para ver a textura, cola este URL numa nova aba do browser:');
        console.log(dataURL);
        
        // Opcional: abrir automaticamente em nova aba
        // window.open(dataURL, '_blank');
    } else {
        console.log('Símbolo do centro de massa ainda não foi criado');
    }
}

    /**
     * Create fixed green reference point at geometric center (0,0)
     * This point never moves horizontally - only follows load height
     */
    createFixedPalletCenterReference() {
        const pointRadius = 0.15;
        const pointHeight = 0.08;
        
        const referenceGeometry = new THREE.CylinderGeometry(
            pointRadius, pointRadius, pointHeight, 12, 1
        );
        
        const referenceMaterial = new THREE.MeshBasicMaterial({
            color: 0xDAA520,
            transparent: false,
            emissive: 0xB8860B,
            emissiveIntensity: 0.4,
            side: THREE.DoubleSide
        });
        
        this.palletCenterReference = new THREE.Mesh(referenceGeometry, referenceMaterial);
        this.palletCenterReference.castShadow = false;
        this.palletCenterReference.receiveShadow = false;
        
        // Position at geometric center, will update Y based on load height
        this.palletCenterReference.position.set(0, 0.72 - 8, 0);
        
        // Add directly to scene (not to centerOfMassGroup) so it stays at (0,0)
        this.scene.add(this.palletCenterReference);
        this.palletCenterReference.visible = false;
    }

    /**
     * Update center of mass beam position
     * @param {Object} centerOfMass - Object with x, z coordinates
     * @param {number} centerOfMass.x - X coordinate of center of mass
     * @param {number} centerOfMass.z - Z coordinate of center of mass
     */
    updateCenterOfMassBeamPosition(centerOfMass) {
        if (!this.centerOfMassGroup || !this.centerOfMassBeam) {
            console.warn('Center of mass beam not initialized');
            return;
        }
        
        if (typeof centerOfMass.x !== 'number' || typeof centerOfMass.z !== 'number') {
            console.warn('Invalid center of mass coordinates:', centerOfMass);
            return;
        }
        
        // Update position of the entire group (beam + glow + cross)
        this.centerOfMassGroup.position.x = centerOfMass.x;
        this.centerOfMassGroup.position.z = centerOfMass.z;
        
        this.showCenterOfMassBeam();
    }

    /**
     * Show the center of mass beam
     */
    showCenterOfMassBeam() {
        if (this.centerOfMassGroup) {
            this.centerOfMassGroup.visible = true;
            
            if (this.centerOfMassBeam) {
                this.centerOfMassBeam.userData.isVisible = true;
            }
        }
    }

    /**
     * Hide the center of mass beam
     */
    hideCenterOfMassBeam() {
        if (this.centerOfMassGroup) {
            this.centerOfMassGroup.visible = false;
            
            if (this.centerOfMassBeam) {
                this.centerOfMassBeam.userData.isVisible = false;
            }
        }
    }

    /**
     * Check if center of mass beam is visible
     * @returns {boolean} True if beam is visible
     */
    isCenterOfMassBeamVisible() {
        return this.centerOfMassGroup && this.centerOfMassGroup.visible;
    }

    /**
     * Update green reference point height to match current load height
     * X and Z coordinates always remain at (0, 0) - geometric center
     * @param {Array} boxes - Array of box meshes currently in the scene
     */
    updatePalletCenterReferenceHeight(boxes) {
        if (!this.palletCenterReference || !boxes || boxes.length === 0) {
            if (this.palletCenterReference) {
                this.palletCenterReference.visible = false;
            }
            return;
        }
        
        // Find the highest point among all boxes
        let maxHeight = -Infinity;
        
        boxes.forEach(box => {
            const boxTop = box.position.y + (box.geometry.parameters.height / 2);
            if (boxTop > maxHeight) {
                maxHeight = boxTop;
            }
        });
        
        // Position reference point above highest box, but keep at geometric center
        const referenceOffset = 0.12;
        this.palletCenterReference.position.x = 0;  // Always at geometric center
        this.palletCenterReference.position.z = 0;  // Always at geometric center
        this.palletCenterReference.position.y = maxHeight + referenceOffset;
        
        this.palletCenterReference.visible = true;
    }

    /**
     * Update cross position to mark center of mass at top of current load
     * @param {Array} boxes - Array of box meshes currently in the scene
     */
    updateCenterOfMassCrossHeight(boxes) {
        if (!this.centerOfMassCross || !boxes || boxes.length === 0) {
            if (this.centerOfMassCross) {
                this.centerOfMassCross.visible = false;
            }
            
            if (this.palletCenterReference) {
                this.palletCenterReference.visible = false;
            }
            return;
        }
        
        // Find the highest point among all boxes
        let maxHeight = -Infinity;
        
        boxes.forEach(box => {
            const boxTop = box.position.y + (box.geometry.parameters.height / 2);
            if (boxTop > maxHeight) {
                maxHeight = boxTop;
            }
        });
        
        // Position cross above highest box
        const crossOffset = 0.1;
        this.centerOfMassCross.position.y = maxHeight + crossOffset;
        this.centerOfMassCross.visible = true;

        // Update green reference point height
        this.updatePalletCenterReferenceHeight(boxes);
    }
    
    /**
     * Create solid top surface of the pallet
     */
    createPalletTopSurface(totalLength, totalWidth, totalHeight, woodColor) {
        const surfaceMaterial = new THREE.MeshLambertMaterial({ color: woodColor });
        
        const surfaceLength = totalLength;  // 1200mm (full length)
        const surfaceWidth = totalWidth;    // 800mm (full width)
        const surfaceThickness = 0.22;      // 22mm thick
        
        const surfaceGeometry = new THREE.BoxGeometry(surfaceLength, surfaceThickness, surfaceWidth);
        const topSurface = new THREE.Mesh(surfaceGeometry, surfaceMaterial);
        
        const yPosition = (totalHeight / 2) - (surfaceThickness / 2);
        topSurface.position.set(0, yPosition, 0);
        
        topSurface.castShadow = true;
        topSurface.receiveShadow = true;
        
        this.pallet.add(topSurface);
    }
    
    /**
     * Create 9 support blocks in strategic positions
     * 4 corners + 2 mid-sides + 2 mid-edges + 1 center = 9 blocks total
     */
    createPalletSupportBlocks(totalLength, totalWidth, totalHeight, woodColor) {
        const blockMaterial = new THREE.MeshLambertMaterial({ color: woodColor });
        
        const blockLength = 1.45;  // 145mm
        const blockWidth = 1.0;    // 100mm
        const blockHeight = 0.78;  // 78mm
        
        const yPosition = -(totalHeight / 2) + (blockHeight / 2);
        
        const blockPositions = [
            // 4 corner blocks
            { x: -(totalLength/2 - blockLength/2), z: -(totalWidth/2 - blockWidth/2), name: 'corner-back-left' },
            { x: (totalLength/2 - blockLength/2), z: -(totalWidth/2 - blockWidth/2), name: 'corner-back-right' },
            { x: -(totalLength/2 - blockLength/2), z: (totalWidth/2 - blockWidth/2), name: 'corner-front-left' },
            { x: (totalLength/2 - blockLength/2), z: (totalWidth/2 - blockWidth/2), name: 'corner-front-right' },
            
            // 2 blocks on long sides (middle)
            { x: 0, z: -(totalWidth/2 - blockWidth/2), name: 'mid-back' },
            { x: 0, z: (totalWidth/2 - blockWidth/2), name: 'mid-front' },
            
            // 2 blocks on short sides (middle) 
            { x: -(totalLength/2 - blockLength/2), z: 0, name: 'mid-left' },
            { x: (totalLength/2 - blockLength/2), z: 0, name: 'mid-right' },
            
            // 1 center block
            { x: 0, z: 0, name: 'center' }
        ];
        
        blockPositions.forEach((pos) => {
            const blockGeometry = new THREE.BoxGeometry(blockLength, blockHeight, blockWidth);
            const block = new THREE.Mesh(blockGeometry, blockMaterial);
            
            block.position.set(pos.x, yPosition, pos.z);
            block.castShadow = true;
            block.receiveShadow = true;
            
            this.pallet.add(block);
        });
    }
    
    /**
     * Create 3 bottom boards along the length for structural reinforcement
     */
    createPalletBottomBoards(totalLength, totalWidth, totalHeight, woodColor) {
        const boardMaterial = new THREE.MeshLambertMaterial({ color: woodColor });
        
        const boardLength = totalLength;   // 1200mm (full length)
        const boardWidth = 1.0;           // 100mm width
        const boardThickness = 0.22;      // 22mm thick
        
        const yPosition = 0.17; // Calculated position on top of support blocks
        
        const boardPositions = [
            { z: -(totalWidth/2 - boardWidth/2), name: 'bottom-back' },
            { z: 0, name: 'bottom-center' },
            { z: (totalWidth/2 - boardWidth/2), name: 'bottom-front' }
        ];
        
        boardPositions.forEach((pos) => {
            const boardGeometry = new THREE.BoxGeometry(boardLength, boardThickness, boardWidth);
            const board = new THREE.Mesh(boardGeometry, boardMaterial);
            
            board.position.set(0, yPosition, pos.z);
            board.castShadow = true;
            board.receiveShadow = true;
            
            this.pallet.add(board);
        });
    }
        
    /**
     * Handle window resize events
     */
    setupEventListeners() {
        window.addEventListener('resize', () => {
            const containerRect = this.container.getBoundingClientRect();
            
            this.camera.aspect = containerRect.width / containerRect.height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(containerRect.width, containerRect.height);
        });
    }
    
    /**
     * Animation loop
     */
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        if (this.controls) {
            this.controls.update();
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    /**
     * Clean up resources
     */
    dispose() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        if (this.controls) {
            this.controls.dispose();
        }
        
        // Clear all boxes
        this.boxes.forEach(box => {
            if (box.geometry) box.geometry.dispose();
            if (box.material) box.material.dispose();
        });
        this.boxes = [];
        
        // Dispose pallet resources
        if (this.pallet) {
            this.pallet.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        }
        
        // Dispose center of mass beam resources
        if (this.centerOfMassGroup) {
            this.centerOfMassGroup.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
            this.scene.remove(this.centerOfMassGroup);
        }
        
        // Dispose fixed reference point resources
        if (this.palletCenterReference) {
            if (this.palletCenterReference.geometry) this.palletCenterReference.geometry.dispose();
            if (this.palletCenterReference.material) this.palletCenterReference.material.dispose();
            this.scene.remove(this.palletCenterReference);
        }
    }
}

// Export for global access
window.PalletSimulator = PalletSimulator;