/**
 * Three.js Setup for Palletization Simulator
 * This file creates the basic 3D environment for visualizing pallet stacking
 * 
 * Save this as: GUI/3d-viewer/three-setup.js
 */

class PalletSimulator {
    constructor(containerId) {
        // Store the container where we'll render the 3D scene
        this.container = document.getElementById(containerId);
        
        // Check if container exists - this prevents mysterious errors later
        if (!this.container) {
            throw new Error(`Container with ID '${containerId}' not found`);
        }
        
        // Three.js core components - think of these as the essential tools for 3D
        this.scene = null;      // The 3D world where all objects live
        this.camera = null;     // Our viewpoint into the 3D world
        this.renderer = null;   // The engine that draws everything on screen
        this.controls = null;   // Allows user to orbit around the scene
        
        // Lighting - without this, we couldn't see anything!
        this.ambientLight = null;   // Soft overall lighting
        this.directionalLight = null; // Strong directional light (like sunlight)
        
        // Scene objects that we'll create
        this.pallet = null;     // The wooden pallet base
        this.boxes = [];        // Array to store all the boxes we place
        
        // Animation and interaction
        this.animationId = null;
        
        this.init();
    }
    
    /**
     * Initialize the entire 3D environment
     * This sets up everything we need for our simulation
     */
    init() {
        console.log('Starting 3D scene initialization...');
        
        this.createScene();
        this.createCamera();
        this.createRenderer();
        this.createLights();
        this.createControls();
        this.createPallet();
        this.setupEventListeners();
        this.animate();
        
        console.log('Three.js Pallet Simulator initialized successfully');
    }
    
    /**
     * Create the 3D scene - this is like setting up an empty stage
     */
    createScene() {
        this.scene = new THREE.Scene();
        
        // Set a pleasant background color (light blue gradient effect)
        this.scene.background = new THREE.Color(0xe3f2fd);
        
        // Optional: Add fog for depth perception (objects farther away appear hazier)
        this.scene.fog = new THREE.Fog(0xe3f2fd, 10, 100);
        
        console.log('3D scene created with background and fog');
    }
    
    /**
     * Create the camera - this defines our viewpoint into the 3D world
     * We use a perspective camera because it mimics how human eyes see (closer objects appear larger)
     */
    createCamera() {
        const containerRect = this.container.getBoundingClientRect();
        const aspect = containerRect.width / containerRect.height;
        
        // PerspectiveCamera parameters: field of view, aspect ratio, near clipping, far clipping
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        
        // Position the camera above and to the side for a good isometric-style view
        this.camera.position.set(8, 6, 8);
        this.camera.lookAt(0, 0, 0); // Look at the center of our scene
        
        console.log('Camera positioned at:', this.camera.position);
    }
    
    /**
     * Create the renderer - this is what actually draws our 3D scene to the screen
     */
    createRenderer() {
        // Check if WebGL is available - modern feature detection
        if (!window.WebGLRenderingContext) {
            throw new Error('WebGL is not supported by this browser');
        }
        
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true, // Makes edges smoother
            alpha: true      // Allows transparency
        });
        
        const containerRect = this.container.getBoundingClientRect();
        this.renderer.setSize(containerRect.width, containerRect.height);
        
        // Enable shadows for more realistic lighting
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Set pixel ratio for crisp rendering on high-DPI displays
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Add the renderer's canvas to our HTML container
        this.container.appendChild(this.renderer.domElement);
        
        console.log('WebGL renderer created and added to DOM');
    }
    
    /**
     * Create lighting - without lights, our 3D world would be completely dark
     */
    createLights() {
        // Ambient light provides soft, even illumination from all directions
        // Think of this as the general daylight that fills a room
        this.ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(this.ambientLight);
        
        // Directional light simulates sunlight - strong, parallel rays
        // This creates shadows and gives objects more dimensional appearance
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        this.directionalLight.position.set(10, 10, 5);
        this.directionalLight.castShadow = true;
        
        // Configure shadow properties for better quality
        this.directionalLight.shadow.mapSize.width = 2048;
        this.directionalLight.shadow.mapSize.height = 2048;
        this.directionalLight.shadow.camera.near = 0.5;
        this.directionalLight.shadow.camera.far = 50;
        this.directionalLight.shadow.camera.left = -10;
        this.directionalLight.shadow.camera.right = 10;
        this.directionalLight.shadow.camera.top = 10;
        this.directionalLight.shadow.camera.bottom = -10;
        
        this.scene.add(this.directionalLight);
        
        console.log('Lighting system created with ambient and directional lights');
    }
    
    /**
     * Create camera controls - this allows users to orbit around the scene
     * Users can click and drag to rotate, scroll to zoom, right-click to pan
     */
    createControls() {
        // Check if OrbitControls is available
        if (typeof THREE.OrbitControls !== 'undefined') {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            
            // Configure control settings for better user experience
            this.controls.enableDamping = true; // Smooth camera movement
            this.controls.dampingFactor = 0.05;
            this.controls.screenSpacePanning = false;
            this.controls.minDistance = 3;
            this.controls.maxDistance = 20;
            this.controls.maxPolarAngle = Math.PI / 2; // Prevent camera from going below ground
            
            console.log('OrbitControls initialized for camera interaction');
        } else {
            console.warn('OrbitControls not available - camera will be static');
        }
    }
    
    /**
     * Create a realistic wooden pallet with proper structure
     * This creates a pallet similar to standard EUR/EPAL pallets
     */
    createPallet() {
        // Pallet dimensions (in centimeters, scaled down for display)
        const palletWidth = 12;   // 1200mm = 12 units in our scale
        const palletDepth = 8;    // 800mm = 8 units in our scale  
        const palletHeight = 0.144; // 14.4cm = 0.144 units (standard pallet height)
        
        // Create the realistic pallet structure
        this.createRealisticPalletStructure(palletWidth, palletDepth, palletHeight);
        
        console.log('Realistic pallet created with dimensions:', palletWidth, 'x', palletDepth, 'x', palletHeight);
    }
    
    /**
     * Create the complete structure of a realistic pallet
     * Includes top deck boards, bottom deck boards, and support blocks
     */
    createRealisticPalletStructure(width, depth, height) {
        // Wood materials with different tones for realism
        const topBoardMaterial = new THREE.MeshLambertMaterial({ color: 0xD4A574 }); // Light wood
        const bottomBoardMaterial = new THREE.MeshLambertMaterial({ color: 0xB8956A }); // Medium wood  
        const blockMaterial = new THREE.MeshLambertMaterial({ color: 0x8D6E63 }); // Dark wood
        
        // Create top deck boards (where boxes will be placed)
        this.createTopDeckBoards(width, depth, height, topBoardMaterial);
        
        // Create bottom deck boards (structural support)
        this.createBottomDeckBoards(width, depth, height, bottomBoardMaterial);
        
        // Create support blocks and stringers
        this.createSupportStructure(width, depth, height, blockMaterial);
        
        console.log('Created realistic pallet structure with top boards, bottom boards, and support blocks');
    }
    
    /**
     * Create the top deck boards - the surface where boxes are placed
     */
    createTopDeckBoards(width, depth, height) {
        const boardMaterial = new THREE.MeshLambertMaterial({ color: 0xD4A574 });
        const boardThickness = 0.02; // 2cm thick boards
        const boardWidth = 0.10; // 10cm wide boards
        const topPosition = height / 2 - boardThickness / 2;
        
        // Create 7 top boards running along the width (1200mm direction)
        const numTopBoards = 7;
        const boardSpacing = depth / (numTopBoards + 1);
        
        for (let i = 0; i < numTopBoards; i++) {
            const boardGeometry = new THREE.BoxGeometry(width, boardThickness, boardWidth);
            const board = new THREE.Mesh(boardGeometry, boardMaterial);
            
            // Position boards with proper spacing
            const boardPosition = (i - (numTopBoards - 1) / 2) * boardSpacing;
            board.position.set(0, topPosition, boardPosition);
            board.castShadow = true;
            board.receiveShadow = true;
            
            this.scene.add(board);
        }
        
        console.log(`Created ${numTopBoards} top deck boards`);
    }
    
    /**
     * Create the bottom deck boards - structural support underneath
     */
    createBottomDeckBoards(width, depth, height) {
        const boardMaterial = new THREE.MeshLambertMaterial({ color: 0xB8956A });
        const boardThickness = 0.02; // 2cm thick boards
        const boardWidth = 0.10; // 10cm wide boards
        const bottomPosition = -height / 2 + boardThickness / 2;
        
        // Create 5 bottom boards running along the width (1200mm direction)
        const numBottomBoards = 5;
        const boardSpacing = depth / (numBottomBoards + 1);
        
        for (let i = 0; i < numBottomBoards; i++) {
            const boardGeometry = new THREE.BoxGeometry(width, boardThickness, boardWidth);
            const board = new THREE.Mesh(boardGeometry, boardMaterial);
            
            // Position boards with proper spacing
            const boardPosition = (i - (numBottomBoards - 1) / 2) * boardSpacing;
            board.position.set(0, bottomPosition, boardPosition);
            board.castShadow = true;
            board.receiveShadow = true;
            
            this.scene.add(board);
        }
        
        console.log(`Created ${numBottomBoards} bottom deck boards`);
    }
    
    /**
     * Create support structure - blocks and stringers that give the pallet its strength
     */
    createSupportStructure(width, depth, height) {
        const blockMaterial = new THREE.MeshLambertMaterial({ color: 0x8D6E63 });
        
        // Create corner blocks
        this.createCornerBlocks(width, depth, height, blockMaterial);
        
        // Create center blocks
        this.createCenterBlocks(width, depth, height, blockMaterial);
        
        // Create stringers (the long structural pieces)
        this.createStringers(width, depth, height, blockMaterial);
    }
    
    /**
     * Create corner support blocks
     */
    createCornerBlocks(width, depth, height) {
        const blockMaterial = new THREE.MeshLambertMaterial({ color: 0x8D6E63 });
        const blockWidth = 0.10;
        const blockDepth = 0.10;
        const blockHeight = height - 0.04; // Height minus top and bottom board thickness
        
        // Position for corner blocks
        const positions = [
            [-width/2 + blockWidth/2, 0, -depth/2 + blockDepth/2], // Front left
            [width/2 - blockWidth/2, 0, -depth/2 + blockDepth/2],   // Front right
            [-width/2 + blockWidth/2, 0, depth/2 - blockDepth/2],   // Back left
            [width/2 - blockWidth/2, 0, depth/2 - blockDepth/2]     // Back right
        ];
        
        positions.forEach((pos, index) => {
            const blockGeometry = new THREE.BoxGeometry(blockWidth, blockHeight, blockDepth);
            const block = new THREE.Mesh(blockGeometry, blockMaterial);
            block.position.set(pos[0], pos[1], pos[2]);
            block.castShadow = true;
            block.receiveShadow = true;
            this.scene.add(block);
        });
        
        console.log('Created 4 corner support blocks');
    }
    
    /**
     * Create center support blocks
     */
    createCenterBlocks(width, depth, height) {
        const blockMaterial = new THREE.MeshLambertMaterial({ color: 0x8D6E63 });
        const blockWidth = 0.10;
        const blockDepth = 0.10;
        const blockHeight = height - 0.04;
        
        // Center blocks along the length
        const centerPositions = [
            [0, 0, -depth/2 + blockDepth/2], // Front center
            [0, 0, depth/2 - blockDepth/2]   // Back center
        ];
        
        centerPositions.forEach((pos) => {
            const blockGeometry = new THREE.BoxGeometry(blockWidth, blockHeight, blockDepth);
            const block = new THREE.Mesh(blockGeometry, blockMaterial);
            block.position.set(pos[0], pos[1], pos[2]);
            block.castShadow = true;
            block.receiveShadow = true;
            this.scene.add(block);
        });
        
        console.log('Created 2 center support blocks');
    }
    
    /**
     * Create stringers - the long structural pieces that connect the blocks
     */
    createStringers(width, depth, height) {
        const stringerMaterial = new THREE.MeshLambertMaterial({ color: 0x8D6E63 });
        const stringerWidth = width;
        const stringerDepth = 0.08;
        const stringerHeight = 0.06;
        
        // Three stringers running along the width
        const stringerPositions = [
            [0, -height/4, -depth/2 + stringerDepth/2], // Front stringer
            [0, -height/4, 0],                          // Center stringer  
            [0, -height/4, depth/2 - stringerDepth/2]   // Back stringer
        ];
        
        stringerPositions.forEach((pos) => {
            const stringerGeometry = new THREE.BoxGeometry(stringerWidth, stringerHeight, stringerDepth);
            const stringer = new THREE.Mesh(stringerGeometry, stringerMaterial);
            stringer.position.set(pos[0], pos[1], pos[2]);
            stringer.castShadow = true;
            stringer.receiveShadow = true;
            this.scene.add(stringer);
        });
        
        console.log('Created 3 structural stringers');
    }
    
    /**
     * Handle window resize events to maintain proper aspect ratio
     */
    setupEventListeners() {
        window.addEventListener('resize', () => {
            const containerRect = this.container.getBoundingClientRect();
            
            // Update camera aspect ratio
            this.camera.aspect = containerRect.width / containerRect.height;
            this.camera.updateProjectionMatrix();
            
            // Update renderer size
            this.renderer.setSize(containerRect.width, containerRect.height);
            
            console.log('Scene resized to:', containerRect.width, 'x', containerRect.height);
        });
    }
    
    /**
     * Animation loop - this runs continuously to update the scene
     * Think of this as the heartbeat of our 3D application
     */
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        // Update controls if they exist
        if (this.controls) {
            this.controls.update();
        }
        
        // Render the scene from the camera's perspective
        this.renderer.render(this.scene, this.camera);
    }
    
    /**
     * Clean up resources when the simulator is no longer needed
     */
    dispose() {
        console.log('Disposing 3D simulator resources...');
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        if (this.controls) {
            this.controls.dispose();
        }
        
        // Clear all boxes from memory
        this.boxes.forEach(box => {
            if (box.geometry) box.geometry.dispose();
            if (box.material) box.material.dispose();
        });
        this.boxes = [];
        
        console.log('3D simulator disposed successfully');
    }
}

// Export for use in other files - this makes the class available globally
window.PalletSimulator = PalletSimulator;