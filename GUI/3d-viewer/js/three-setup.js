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
        
        // Center of mass visualization components (X,Z)
        this.centerOfMassGroup = null;
        this.centerOfMassBeam = null;
        this.centerOfMassCross = null;
        this.centerOfMassGlow = null;
        this.palletCenterReference = null;  // Green reference point at geometric center

        // Sistema de visualização horizontal do centro de massa (altura Y)
        this.horizontalCenterOfMassGroup = null;     // Grupo para beam e mira horizontais
        this.horizontalCenterOfMassBeam = null;      // Beam horizontal infinito
        this.horizontalBeamGlow = null;              // Efeito visual de brilho no beam horizontal
        
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
        this.createCenterOfMassBeam(); //Não existia antes
        this.createHorizontalCenterOfMassSystem();
        this.createGeometricCenterSphere();
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
            color: 0x2c5282,           // Mesmo azul consistente
            transparent: true,
            opacity: 0.12,             
            blending: THREE.NormalBlending,
            depthWrite: false,         
            depthTest: false,         
            side: THREE.DoubleSide,
            emissive: 0x1a365d,
            emissiveIntensity: 0.2    
        })
        
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
        this.centerOfMassBeam.userData.isDynamic = true;
        this.centerOfMassBeam.userData.originalHeight = beamHeight;
        
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
        gradient.addColorStop(0, 'rgba(44, 82, 130, 1.0)'); // Azul em vez de vermelho
        gradient.addColorStop(0.3, 'rgba(44, 82, 130, 0.8)');
        gradient.addColorStop(0.7, 'rgba(44, 82, 130, 0.3)');
        gradient.addColorStop(1, 'rgba(44, 82, 130, 0.0)');
        
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
        
        // Manter horizontal - sem rotações complexas!
        // O plano já está na orientação certa por defeito
        this.centerOfMassCross.rotation.x = -Math.PI / 2;  // Apenas rotacionar para ficar horizontal no chão
        
        // === CONFIGURAÇÕES FINAIS ===
        this.centerOfMassCross.castShadow = false;      // Sem sombras
        this.centerOfMassCross.receiveShadow = false;   // Sem receber sombras
        
        // Adicionar ao grupo do centro de massa
        this.centerOfMassGroup.add(this.centerOfMassCross);
        this.centerOfMassCross.position.y = 0;
        
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
     * Criar sistema de visualização horizontal do centro de massa
     * Chamar este método no init() depois de createCenterOfMassBeam()
     */
    createHorizontalCenterOfMassSystem() {
        this.horizontalCenterOfMassGroup = new THREE.Group();
        this.horizontalCenterOfMassGroup.name = 'HorizontalCenterOfMassVisualization';
        
        // Usar as mesmas cores do sistema vertical para consistência visual
        const beamColor = 0x2c5282;      // Azul do beam existente
        const emissiveColor = 0x1a365d;  // Cor emissiva do beam existente
        
        this.createInfiniteHorizontalBeam(beamColor, emissiveColor);
        this.createHorizontalCenterOfMassCross(beamColor, emissiveColor);
        this.createHorizontalBeamGlow();
        
        this.scene.add(this.horizontalCenterOfMassGroup);
        this.hideHorizontalCenterOfMassSystem();
        
    }

    /**
     * Criar beam horizontal infinito que se estende desde o centro da palete
     */
    createInfiniteHorizontalBeam(beamColor, emissiveColor) {
        // Calcular dimensões do beam horizontal infinito
        const beamLength = 2000;      // Comprimento muito longo para simular infinito
        const beamRadius = 0.08;      // Raio similar ao beam vertical mas ligeiramente mais fino
        
        // Criar geometria horizontal
        const beamGeometry = new THREE.CylinderGeometry(
            beamRadius, beamRadius, beamLength, 8, 1
        );
        
        // Rodar a geometria para ficar horizontal ao longo do eixo Z
        beamGeometry.rotateZ(Math.PI / 2);
        
        // Material com propriedades especiais para visibilidade garantida
        const beamMaterial = new THREE.MeshBasicMaterial({
            color: beamColor,
            transparent: true,
            opacity: 0.12,              // Ligeiramente mais subtil que o beam vertical
            blending: THREE.NormalBlending,
            depthWrite: false,          // Não escrever no depth buffer
            depthTest: false,           // Não testar profundidade - sempre visível
            side: THREE.DoubleSide,
            emissive: emissiveColor,
            emissiveIntensity: 0.2
        });
        
        this.horizontalCenterOfMassBeam = new THREE.Mesh(beamGeometry, beamMaterial);
        
        // Posicionar o beam para que comece no centro da palete
        this.horizontalCenterOfMassBeam.position.set(beamLength / 2, 0, 0);
        
        // Configurações de renderização especiais
        this.horizontalCenterOfMassBeam.castShadow = false;
        this.horizontalCenterOfMassBeam.receiveShadow = false;
        this.horizontalCenterOfMassBeam.renderOrder = 999; // Renderizar quase no topo
        
        this.horizontalCenterOfMassBeam.userData = {
            isHorizontalBeam: true,
            isVisible: true,
            baseLength: beamLength
        };
        
        this.horizontalCenterOfMassGroup.add(this.horizontalCenterOfMassBeam);
    }

    /**
     * Criar mira horizontal que marca a altura Y do centro de massa
     */
    createHorizontalCenterOfMassCross(beamColor, emissiveColor) {
    // Criar a mesma textura da mira vertical para consistência
    const canvas = document.createElement('canvas');
    const size = 128;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    const centerX = size / 2;
    const centerY = size / 2;
    const circleRadius = size * 0.25;
    
    // Fundo transparente
    ctx.clearRect(0, 0, size, size);
    
    // Círculo base claro
    ctx.fillStyle = '#f8f8f8';
    ctx.beginPath();
    ctx.arc(centerX, centerY, circleRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Quadrantes escuros para dar contraste
    ctx.fillStyle = '#4a4a4a';
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX, centerY - circleRadius);
    ctx.arc(centerX, centerY, circleRadius, -Math.PI/2, 0, false);
    ctx.lineTo(centerX, centerY);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX, centerY + circleRadius);
    ctx.arc(centerX, centerY, circleRadius, Math.PI/2, Math.PI, false);
    ctx.lineTo(centerX, centerY);
    ctx.fill();
    
    // Contorno do círculo
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(centerX, centerY, circleRadius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Mira interna (cruz)
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    
    // Linha horizontal da mira
    ctx.beginPath();
    ctx.moveTo(centerX - circleRadius * 1.1, centerY);
    ctx.lineTo(centerX + circleRadius * 1.1, centerY);
    ctx.stroke();
    
    // Linha vertical da mira  
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - circleRadius * 1.1);
    ctx.lineTo(centerX, centerY + circleRadius * 1.1);
    ctx.stroke();
    
    // Criar textura e geometria
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    const crossRadius = 0.35;  // Ligeiramente menor que a mira vertical
    const crossGeometry = new THREE.PlaneGeometry(
        crossRadius * 2,
        crossRadius * 2
    );
    
    // Material com renderização especial para visibilidade garantida
    const crossMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        alphaTest: 0.1,
        side: THREE.DoubleSide,
        depthWrite: false,
        depthTest: false,           // Sempre visível através das caixas
        emissive: emissiveColor,
        emissiveIntensity: 0.3
    });
    
    this.horizontalCenterOfMassCross = new THREE.Mesh(crossGeometry, crossMaterial);

    this.centerOfMassCross.rotation.x = -Math.PI/2;
    
    // Configurações de renderização especiais
    this.horizontalCenterOfMassCross.castShadow = false;
    this.horizontalCenterOfMassCross.receiveShadow = false;
    this.horizontalCenterOfMassCross.renderOrder = 1001; // Renderizar porf cima do beam
    
    // CORREÇÃO: Posição inicial será calculada dinamicamente
    // Em vez de posição fixa, a mira será posicionada na face frontal das caixas
    this.horizontalCenterOfMassCross.position.set(6.0, 0, 0); // Posição inicial neutra
    
    this.horizontalCenterOfMassGroup.add(this.horizontalCenterOfMassCross);
    }


    /**
     * Criar efeito de brilho para o beam horizontal
     */
    createHorizontalBeamGlow() {       
        this.horizontalBeamGlow = null;
    }

        /**
     * Calculate the frontmost position of all boxes to position the horizontal crosshair
     * This function analyzes all boxes and finds which one extends furthest forward (highest Z)
     * @param {Array} boxes - Array of Three.js box meshes currently in the scene
     * @returns {number} Z coordinate where the horizontal crosshair should be positioned
     */
    calculateFrontmostBoxPosition(boxes) {
        if (!boxes || boxes.length === 0) {
            return 4.0; // Default position if no boxes (middle of pallet)
        }
        
        let frontmostZ = -Infinity;
        
        // Find the box that extends furthest forward (highest Z value)
        boxes.forEach(box => {
            if (!box || !box.position || !box.geometry || !box.geometry.parameters) {
                return; // Skip invalid boxes
            }
            
            const boxCenterZ = box.position.z;
            const boxDepth = box.geometry.parameters.depth;
            const boxFrontZ = boxCenterZ + (boxDepth / 2);
            
            if (boxFrontZ > frontmostZ) {
                frontmostZ = boxFrontZ;
            }
        });
        
        // If no valid boxes found, use default position
        if (frontmostZ === -Infinity) {
            return 4.0;
        }
        
        // Add small margin so crosshair is visible beyond the boxes
        const margin = 0.5;
        return frontmostZ + margin;
    }

    /**
     * Update vertical beam length to point to horizontal beam position
     * Instead of going to infinity, the vertical beam now points to where the horizontal crosshair is
     * @param {number} targetZ - Z coordinate where the vertical beam should end
     */
    updateVerticalBeamLength(targetZ) {
        if (!this.centerOfMassBeam || !this.centerOfMassGlow) {
            return;
        }
        
        // Calculate new beam length
        const palletHeight = 1.44;
        const palletOffset = -8;
        const beamStartY = -(palletHeight / 2) + palletOffset;
        
        // Instead of going to infinity, go to the Z position of horizontal crosshair
        const beamEndY = targetZ;
        const beamHeight = beamEndY - beamStartY;
        
        // Update beam geometry
        const beamRadius = 0.1;
        const newBeamGeometry = new THREE.CylinderGeometry(
            beamRadius, beamRadius, beamHeight, 8, 1
        );
        
        // Replace existing geometry
        this.centerOfMassBeam.geometry.dispose();
        this.centerOfMassBeam.geometry = newBeamGeometry;
        this.centerOfMassBeam.position.y = beamStartY + (beamHeight / 2);
        
        // Update glow position at beam top
        this.centerOfMassGlow.position.y = beamEndY - beamStartY - (beamStartY + ((beamEndY - beamStartY) / 2));
        
        console.log(`Vertical beam updated: height=${beamHeight.toFixed(2)}, points to Z=${targetZ.toFixed(2)}`);
    }

    /**
     * Atualizar posição do sistema horizontal baseado na altura Y do centro de massa
     * @param {Object} centerOfMassData - Dados do centro de massa incluindo Y
     */
    updateHorizontalCenterOfMassPosition(centerOfMassData) {
        if (!this.horizontalCenterOfMassGroup || !centerOfMassData) {
            console.warn('Sistema horizontal de centro de massa não inicializado');
            return;
        }
        
        // Validar coordenada Y
        if (typeof centerOfMassData.y !== 'number') {
            console.warn('Coordenada Y do centro de massa inválida:', centerOfMassData);
            return;
        }
        
        // Atualizar altura Y de todo o grupo horizontal
        this.horizontalCenterOfMassGroup.position.y = centerOfMassData.y;

        this.horizontalCenterOfMassCross.rotation.y = -Math.PI / 2;

        if (this.horizontalCenterOfMassCross) {
            this.horizontalCenterOfMassCross.position.x = 6.0;
        }
        
        
    
        
        this.showHorizontalCenterOfMassSystem();
    }

    /**
     * Mostrar sistema horizontal de centro de massa
     */
    showHorizontalCenterOfMassSystem() {
        if (this.horizontalCenterOfMassGroup) {
            this.horizontalCenterOfMassGroup.visible = true;
            
            if (this.horizontalCenterOfMassBeam) {
                this.horizontalCenterOfMassBeam.userData.isVisible = true;
            }
            
        }
    }

    /**
     * Esconder sistema horizontal de centro de massa
     */
    hideHorizontalCenterOfMassSystem() {
        if (this.horizontalCenterOfMassGroup) {
            this.horizontalCenterOfMassGroup.visible = false;
            
            if (this.horizontalCenterOfMassBeam) {
                this.horizontalCenterOfMassBeam.userData.isVisible = false;
            }
            
        }
    }

    /**
     * Verificar se o sistema horizontal está visível
     */
    isHorizontalCenterOfMassSystemVisible() {
        return this.horizontalCenterOfMassGroup && this.horizontalCenterOfMassGroup.visible;
    }

    /**
     * Alternar visibilidade do sistema horizontal
     */
    toggleHorizontalCenterOfMassSystem() {
        if (this.isHorizontalCenterOfMassSystemVisible()) {
            this.hideHorizontalCenterOfMassSystem();
        } else {
            this.showHorizontalCenterOfMassSystem();
        }
    }

    /**
     * Limpar recursos do sistema horizontal
     */
    disposeHorizontalCenterOfMassSystem() {
        if (this.horizontalCenterOfMassGroup) {
            this.horizontalCenterOfMassGroup.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (child.material.map) child.material.map.dispose();
                    child.material.dispose();
                }
            });
            this.scene.remove(this.horizontalCenterOfMassGroup);
            this.horizontalCenterOfMassGroup = null;
        }
        
        this.horizontalCenterOfMassBeam = null;
        this.horizontalCenterOfMassCross = null;
        this.horizontalBeamGlow = null;
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

    createGeometricCenterSphere() {
    // Propriedades da esfera - dimensionada para ser bem visível mas não dominante
    const sphereRadius = 0.18;  // Ligeiramente maior que o ponto de referência para destacar
    
    // Geometria da esfera com boa resolução para suavidade visual
    const sphereGeometry = new THREE.SphereGeometry(
        sphereRadius,  // Raio da esfera
        16,           // Segmentos horizontais (resolução)
        12            // Segmentos verticais (resolução)
    );
    
    // Material com as mesmas propriedades de visibilidade do beam horizontal
    // Isto garante que a esfera seja sempre visível através das caixas
    const sphereMaterial = new THREE.MeshBasicMaterial({
        color: 0xDAA520,           // Mesma cor dourada do ponto de referência vertical
        transparent: true,
        opacity: 0.8,              // Mais opaca que os beams para ser bem visível
        emissive: 0xB8860B,        // Cor emissiva para dar brilho próprio
        emissiveIntensity: 0.5,    // Intensidade do brilho
        depthWrite: false,         // Não escrever no buffer de profundidade
        depthTest: false,          // Não testar profundidade - sempre visível
        side: THREE.DoubleSide,    // Visível de ambos os lados
        wireframe: false           // Esfera sólida, não em wireframe
    });
    
    // Criar o mesh da esfera
    this.geometricCenterSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    
    // Configurações de renderização para garantir visibilidade máxima
    this.geometricCenterSphere.castShadow = false;      // Não projectar sombras
    this.geometricCenterSphere.receiveShadow = false;   // Não receber sombras
    this.geometricCenterSphere.renderOrder = 1002;     // Renderizar por cima de tudo
    
    // Posição inicial no centro geométrico da palete
    // X e Z sempre fixos em 0 (centro da palete)
    // Y será atualizado dinamicamente baseado na altura da carga
    this.geometricCenterSphere.position.set(0, -7.5, 0); // Posição inicial ligeiramente acima da palete
    
    // Adicionar diretamente à cena (não a um grupo específico)
    // Isto permite controlo independente da esfera
    this.scene.add(this.geometricCenterSphere);
    
    // Inicialmente visível
    this.geometricCenterSphere.visible = false;
    
    // Adicionar metadados úteis para debugging e controlo
    this.geometricCenterSphere.userData = {
        type: 'geometricCenter',
        isReference: true,
        alwaysVisible: true
    };
    
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

    updateVerticalBeamLength(targetZ) {
    if (!this.centerOfMassBeam || !this.centerOfMassGlow) {
        return;
    }
    
    // Calcular novo comprimento do beam vertical
    const palletHeight = 1.44;
    const palletOffset = -8;
    const beamStartY = -(palletHeight / 2) + palletOffset;
    
    // CORREÇÃO: Em vez de ir ao infinito, ir até à posição Z do beam horizontal
    const beamEndY = targetZ; // O beam vai até à coordenada Z da mira horizontal
    const beamHeight = beamEndY - beamStartY;
    
    // Atualizar geometria do beam
    const beamRadius = 0.1;
    const newBeamGeometry = new THREE.CylinderGeometry(
        beamRadius, beamRadius, beamHeight, 8, 1
    );
    
    // Substituir geometria existente
    this.centerOfMassBeam.geometry.dispose();
    this.centerOfMassBeam.geometry = newBeamGeometry;
    this.centerOfMassBeam.position.y = beamStartY + (beamHeight / 2);
    
    // Atualizar posição do brilho no topo do beam
    this.centerOfMassGlow.position.y = beamEndY - beamStartY - (beamStartY + ((beamEndY - beamStartY) / 2));
    
    console.log(`Beam vertical atualizado: altura=${beamHeight.toFixed(2)}, aponta para Z=${targetZ.toFixed(2)}`);
    }

    /**
     * Atualizar posição vertical da esfera de centro geométrico
     * A esfera move-se para marcar o centro geométrico da altura atual da carga
     * @param {Array} boxes - Array de caixas atualmente na cena
     */
    updateGeometricCenterSphere(boxes) {
        // Verificar se a esfera existe e se há caixas para processar
        if (!this.geometricCenterSphere) {
            return; // Esfera não foi criada ainda
        }
        
        // Se não há caixas, posicionar a esfera ligeiramente acima da palete
        if (!boxes || boxes.length === 0) {
            const palletOffset = -8;
            const palletHeight = 1.44;
            const palletTopY = palletOffset + (palletHeight / 2);
            
            this.geometricCenterSphere.position.y = palletTopY + 0.3; // Ligeiramente acima da palete
            this.geometricCenterSphere.visible = true;
            return;
        }
        
        // Encontrar os limites verticais da carga atual
        let minBoxY = Infinity;   // Parte mais baixa de todas as caixas
        let maxBoxY = -Infinity;  // Parte mais alta de todas as caixas
        
        // Analisar cada caixa para determinar os limites verticais
        boxes.forEach(box => {
            // Verificar se a caixa tem dados válidos
            if (!box || !box.position || !box.geometry || !box.geometry.parameters) {
                return; // Ignorar caixas inválidas
            }
            
            // Calcular as posições top e bottom desta caixa específica
            const boxCenterY = box.position.y;
            const boxHeight = box.geometry.parameters.height;
            const boxBottomY = boxCenterY - (boxHeight / 2);
            const boxTopY = boxCenterY + (boxHeight / 2);
            
            // Atualizar os limites se esta caixa os estende
            if (boxBottomY < minBoxY) {
                minBoxY = boxBottomY;
            }
            if (boxTopY > maxBoxY) {
                maxBoxY = boxTopY;
            }
        });
        
        // Calcular o centro geométrico vertical da carga
        const geometricCenterY = (minBoxY + maxBoxY) / 2;
        
        // Atualizar a posição da esfera
        // X e Z permanecem sempre 0 (centro da palete)
        // Apenas Y muda para refletir o centro geométrico atual
        this.geometricCenterSphere.position.x = 0;  // Sempre no centro X
        this.geometricCenterSphere.position.z = 0;  // Sempre no centro Z
        this.geometricCenterSphere.position.y = geometricCenterY;
        
        // Garantir que a esfera está visível
        this.geometricCenterSphere.visible = true;

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
    
    // Encontrar o ponto mais alto das caixas
    let maxHeight = -Infinity;
    
    boxes.forEach(box => {
        const boxTop = box.position.y + (box.geometry.parameters.height / 2);
        if (boxTop > maxHeight) {
            maxHeight = boxTop;
        }
    });
    
    // Posicionar cruz acima da caixa mais alta
    const crossOffset = 0.1;
    this.centerOfMassCross.position.y = maxHeight + crossOffset;
    this.centerOfMassCross.visible = true;

    // Atualizar referência do centro da palete
    this.updatePalletCenterReferenceHeight(boxes);

    this.updateGeometricCenterSphere(boxes);
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

        if (this.geometricCenterSphere) {
            if (this.geometricCenterSphere.geometry) {
                this.geometricCenterSphere.geometry.dispose();
            }
            if (this.geometricCenterSphere.material) {
                this.geometricCenterSphere.material.dispose();
            }
            this.scene.remove(this.geometricCenterSphere);
            this.geometricCenterSphere = null;
        }

        this.disposeHorizontalCenterOfMassSystem();
        
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