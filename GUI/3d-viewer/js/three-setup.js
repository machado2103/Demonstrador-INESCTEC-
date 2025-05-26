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
     * Create the wooden pallet base
     * This serves as the foundation for all our boxes
     */
    createPallet() {
        // Pallet dimensions (in centimeters, scaled down for display)
        const palletWidth = 12;   // 1200mm = 12 units in our scale
        const palletDepth = 8;    // 800mm = 8 units in our scale  
        const palletHeight = 0.15; // 15cm = 0.15 units in our scale
        
        // Create the main pallet platform geometry
        const palletGeometry = new THREE.BoxGeometry(palletWidth, palletHeight, palletDepth);
        
        // Create a wood-like material with brown color and some texture
        const palletMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x8D6E63, // Brown color for wood
        });
        
        // Create the mesh (geometry + material = visible object)
        this.pallet = new THREE.Mesh(palletGeometry, palletMaterial);
        
        // Position the pallet so its top surface is at y=0 (ground level)
        this.pallet.position.y = -palletHeight / 2;
        
        // Enable the pallet to receive shadows from boxes above
        this.pallet.receiveShadow = true;
        
        // Add wooden slats for more realistic appearance
        this.createPalletSlats(palletWidth, palletDepth, palletHeight);
        
        // Add the pallet to our scene
        this.scene.add(this.pallet);
        
        console.log('Pallet created with dimensions:', palletWidth, 'x', palletDepth, 'x', palletHeight);
    }
    
    /**
     * Create wooden slats on the pallet for more realistic appearance
     */
    createPalletSlats(width, depth, height) {
        const slatMaterial = new THREE.MeshLambertMaterial({ color: 0x6D4C41 });
        
        // Create longitudinal slats (running along the length)
        const numSlats = 5;
        const slatWidth = 0.3;
        const slatThickness = 0.05;
        
        for (let i = 0; i < numSlats; i++) {
            const slatGeometry = new THREE.BoxGeometry(width, slatThickness, slatWidth);
            const slat = new THREE.Mesh(slatGeometry, slatMaterial);
            
            // Position slats evenly across the depth
            const slatPosition = (i - (numSlats - 1) / 2) * (depth / numSlats);
            slat.position.set(0, height / 2, slatPosition);
            slat.receiveShadow = true;
            
            this.scene.add(slat);
        }
        
        console.log(`Created ${numSlats} wooden slats for realistic pallet appearance`);
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