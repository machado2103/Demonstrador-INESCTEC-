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
        this.camera.position.set(0, 20, 18);
        this.camera.lookAt(0, 5, 20);
    }
    
    /**
     * Create WebGL renderer
     */
    createRenderer() {
        if (!window.WebGLRenderingContext) {
            throw new Error('WebGL is not supported by this browser');
        }
        
        this.renderer = new THREE.WebGLRenderer({ 
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
        const beamStartY = -(palletHeight / 2);
        const beamEndY = 1000;
        const beamHeight = beamEndY - beamStartY;
        const beamRadius = 0.1;
        
        // Create beam geometry
        const beamGeometry = new THREE.CylinderGeometry(
            beamRadius, beamRadius, beamHeight, 8, 1
        );
        
        // Create beam material with enhanced visibility
        const beamMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.30,
            blending: THREE.NormalBlending,
            depthWrite: false,
            side: THREE.DoubleSide,
            emissive: 0xff0000,
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
        this.createCenterOfMassCross();
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

    /**
     * Create cross marker at center of mass position
     */
    createCenterOfMassCross() {
        const crossSize = 0.8;
        const crossThickness = 0.05;
        const crossHeight = 0.02;
        
        // Create cross geometry
        const horizontalArmGeometry = new THREE.BoxGeometry(
            crossSize, crossHeight, crossThickness
        );
        
        const verticalArmGeometry = new THREE.BoxGeometry(
            crossThickness, crossHeight, crossSize
        );
        
        // Create cross material
        const crossMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: false,
            emissive: 0xaa0000,
            emissiveIntensity: 0.3,
            side: THREE.DoubleSide
        });
        
        const horizontalArm = new THREE.Mesh(horizontalArmGeometry, crossMaterial);
        const verticalArm = new THREE.Mesh(verticalArmGeometry, crossMaterial);
        
        this.centerOfMassCross = new THREE.Group();
        this.centerOfMassCross.add(horizontalArm);
        this.centerOfMassCross.add(verticalArm);
        
        // Disable shadows
        horizontalArm.castShadow = false;
        horizontalArm.receiveShadow = false;
        verticalArm.castShadow = false;
        verticalArm.receiveShadow = false;
        
        this.centerOfMassGroup.add(this.centerOfMassCross);
        this.centerOfMassCross.position.y = 0;
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
            color: 0x00ff00,
            transparent: false,
            emissive: 0x004400,
            emissiveIntensity: 0.4,
            side: THREE.DoubleSide
        });
        
        this.palletCenterReference = new THREE.Mesh(referenceGeometry, referenceMaterial);
        this.palletCenterReference.castShadow = false;
        this.palletCenterReference.receiveShadow = false;
        
        // Position at geometric center, will update Y based on load height
        this.palletCenterReference.position.set(0, 0.72, 0);
        
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