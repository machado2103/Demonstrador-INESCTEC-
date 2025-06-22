/**
 * Three.js Setup for Palletization Simulator - Improved Pallet Design
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
     * Create a precise pallet with the new improved structure
     * This creates a pallet following the exact specifications provided
     */
    createPallet() {
        console.log('Creating improved pallet with solid top surface and support structure...');
        
        // Pallet dimensions (converted from mm to our 3D units: 1mm = 0.01 units)
        const palletLength = 12.0;  // 1200mm
        const palletWidth = 8.0;    // 800mm  
        const palletHeight = 1.44;  // 144mm total height
        
        // Material specifications - light wood color as requested
        const woodColor = 0xd6aa69; // Light wood color (#d6aa69)
        
        // Create the pallet group to hold all components
        this.pallet = new THREE.Group();
        
        // Create all pallet components with precise specifications
        this.createPalletTopSurface(palletLength, palletWidth, palletHeight, woodColor);
        this.createPalletSupportBlocks(palletLength, palletWidth, palletHeight, woodColor);
        this.createPalletBottomBoards(palletLength, palletWidth, palletHeight, woodColor);
        
        // Add the complete pallet to the scene
        this.scene.add(this.pallet);
        
        console.log('Improved pallet completed with dimensions:', palletLength, 'x', palletWidth, 'x', palletHeight, 'units');
        console.log('Real-world equivalent: 1200mm x 800mm x 144mm');
    }
    
    /**
     * Create the solid top surface of the pallet
     * This is a single flat surface where boxes will be placed
     */
    createPalletTopSurface(totalLength, totalWidth, totalHeight, woodColor) {
        const surfaceMaterial = new THREE.MeshLambertMaterial({ color: woodColor });
        
        // Top surface specifications - single solid surface
        const surfaceLength = totalLength;  // 1200mm (full length)
        const surfaceWidth = totalWidth;    // 800mm (full width)
        const surfaceThickness = 0.22;      // 22mm thick
        
        // Create the solid top surface
        const surfaceGeometry = new THREE.BoxGeometry(surfaceLength, surfaceThickness, surfaceWidth);
        const topSurface = new THREE.Mesh(surfaceGeometry, surfaceMaterial);
        
        // Position the surface at the top of the pallet structure
        // Y position: half the total height minus half the surface thickness
        const yPosition = (totalHeight / 2) - (surfaceThickness / 2);
        topSurface.position.set(0, yPosition, 0);
        
        // Enable shadows
        topSurface.castShadow = true;
        topSurface.receiveShadow = true;
        
        this.pallet.add(topSurface);
        
        console.log('Created solid top surface:', surfaceLength, 'x', surfaceWidth, 'x', surfaceThickness, 'units');
        console.log('Surface positioned at Y =', yPosition);
    }
    
    /**
     * Create the 9 support blocks in strategic positions
     * 4 corners + 2 mid-sides + 2 mid-edges + 1 center = 9 blocks total
     */
    createPalletSupportBlocks(totalLength, totalWidth, totalHeight, woodColor) {
        const blockMaterial = new THREE.MeshLambertMaterial({ color: woodColor });
        
        // Support block specifications
        const blockLength = 1.45;  // 145mm
        const blockWidth = 1.0;    // 100mm
        const blockHeight = 0.78;  // 78mm
        
        // Y position - blocks sit on the ground (origin level)
        const yPosition = -(totalHeight / 2) + (blockHeight / 2);
        
        // Define the 9 block positions strategically
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
        
        blockPositions.forEach((pos, index) => {
            const blockGeometry = new THREE.BoxGeometry(blockLength, blockHeight, blockWidth);
            const block = new THREE.Mesh(blockGeometry, blockMaterial);
            
            block.position.set(pos.x, yPosition, pos.z);
            block.castShadow = true;
            block.receiveShadow = true;
            
            this.pallet.add(block);
            
            console.log(`Block ${index + 1} (${pos.name}): positioned at X=${pos.x.toFixed(2)}, Z=${pos.z.toFixed(2)}`);
        });
        
        console.log(`Created ${blockPositions.length} support blocks with dimensions ${blockLength}x${blockHeight}x${blockWidth} units each`);
    }
    
    /**
     * Create the 3 bottom boards along the length
     * These boards provide structural reinforcement and connect the support blocks
     */
    createPalletBottomBoards(totalLength, totalWidth, totalHeight, woodColor) {
        const boardMaterial = new THREE.MeshLambertMaterial({ color: woodColor });
        
        // Bottom board specifications
        const boardLength = totalLength;   // 1200mm (full length)
        const boardWidth = 1.0;           // 100mm width
        const boardThickness = 0.22;      // 22mm thick
        
        // Y position - boards positioned to touch exactly on top of support blocks
        const yPosition = 0.17; // Calculated: -(1.44/2) + 0.78 + 0.22/2 = -0.72 + 0.89 = 0.17
        
        // Calculate positions for 3 boards along the width
        // One centered, two near the edges
        const boardPositions = [
            { z: -(totalWidth/2 - boardWidth/2), name: 'bottom-back' },    // Near back edge
            { z: 0, name: 'bottom-center' },                              // Center
            { z: (totalWidth/2 - boardWidth/2), name: 'bottom-front' }    // Near front edge
        ];
        
        boardPositions.forEach((pos, index) => {
            const boardGeometry = new THREE.BoxGeometry(boardLength, boardThickness, boardWidth);
            const board = new THREE.Mesh(boardGeometry, boardMaterial);
            
            board.position.set(0, yPosition, pos.z);
            board.castShadow = true;
            board.receiveShadow = true;
            
            this.pallet.add(board);
            
            console.log(`Bottom board ${index + 1} (${pos.name}): positioned at Z=${pos.z.toFixed(2)}`);
        });
        
        console.log(`Created ${boardPositions.length} bottom reinforcement boards`);
        console.log(`Board dimensions: ${boardLength}x${boardThickness}x${boardWidth} units each`);
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
        
        // Dispose pallet resources
        if (this.pallet) {
            this.pallet.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        }
        
        console.log('3D simulator disposed successfully');
    }
}

// Export for use in other files - this makes the class available globally
window.PalletSimulator = PalletSimulator;