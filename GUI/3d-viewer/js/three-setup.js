/**
 * Three.js Setup for Palletization Simulator - Improved Pallet Design with FIXED Green Reference
 * This file creates the basic 3D environment for visualizing pallet stacking
 * 
 * FIXED: Green reference point now stays at geometric center (0,0) and doesn't move with center of mass
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
        
        // Center of mass visualization components
        this.centerOfMassGroup = null;      // Group containing beam, cross, and glow
        this.centerOfMassBeam = null;       // Red vertical beam
        this.centerOfMassCross = null;      // Red cross marker at top
        this.centerOfMassGlow = null;       // Glow effect sprite
        this.palletCenterReference = null;  // FIXED: Green point that stays at center (0,0)
        
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
     * Create lighting optimized for data visualization clarity
     */
    createLights() {
        // Strong ambient light provides even illumination from all directions
        // Think of this as having light panels on every wall of a photography studio
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(this.ambientLight);
        
        // Primary directional light - reduced intensity to minimize harsh shadows
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
        this.directionalLight.position.set(10, 10, 5);
        this.directionalLight.castShadow = true;
        
        // Configure softer shadows for better visual comfort
        this.directionalLight.shadow.mapSize.width = 1024;  // Reduced for softer edges
        this.directionalLight.shadow.mapSize.height = 1024;
        this.directionalLight.shadow.camera.near = 0.5;
        this.directionalLight.shadow.camera.far = 50;
        this.directionalLight.shadow.camera.left = -15;     // Expanded for tall pallets
        this.directionalLight.shadow.camera.right = 15;
        this.directionalLight.shadow.camera.top = 15;
        this.directionalLight.shadow.camera.bottom = -15;
        
        this.scene.add(this.directionalLight);
        
        // OPTIONAL: Add fill lights to eliminate remaining shadows
        // These are like the lights used in professional photography studios
        const fillLight1 = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight1.position.set(-10, 8, -5);  // Opposite side of main light
        fillLight1.castShadow = false;         // No additional shadows
        this.scene.add(fillLight1);
        
        const fillLight2 = new THREE.DirectionalLight(0xffffff, 0.2);
        fillLight2.position.set(5, 10, -10);   // Third angle for complete coverage
        fillLight2.castShadow = false;
        this.scene.add(fillLight2);
        
        console.log('Data visualization lighting created');
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
            this.controls.minDistance = 2;
            this.controls.maxDistance = 50;
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
     * Create center of mass beam and visual components
     */
    createCenterOfMassBeam() {
        console.log('Creating center of mass visual beam...');
        
        // Create a group to hold all center of mass visual elements (except fixed reference)
        this.centerOfMassGroup = new THREE.Group();
        this.centerOfMassGroup.name = 'CenterOfMassVisualization';
        
        // Calculate beam dimensions relative to pallet
        const palletHeight = 1.44; // Total pallet height from three-setup.js
        const beamStartY = -(palletHeight / 2); // Start from ground level (bottom of pallet)
        const beamEndY = 1000; // Very high
        const beamHeight = beamEndY - beamStartY; // Total beam height
        const beamRadius = 0.1; // Thin beam as requested
        
        // Create the main beam geometry - a cylinder pointing upward
        const beamGeometry = new THREE.CylinderGeometry(
            beamRadius,     // radiusTop
            beamRadius,     // radiusBottom  
            beamHeight,     // height
            8,              // radialSegments (8 sides for performance)
            1               // heightSegments
        );
        
        // Create the beam material - ENHANCED for maximum red intensity and visibility
        const beamMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,                    // Pure red color (unchanged)
            transparent: true,                  // Enable transparency
            opacity: 0.30,                     // Almost opaque for maximum visibility
            blending: THREE.NormalBlending,    // Normal blending for glow effect
            depthWrite: false,                 // Don't write to depth buffer (prevents sorting issues)
            side: THREE.DoubleSide,            // Render both sides for better visibility
            emissive: 0xff0000,                // Make it glow red from within
            emissiveIntensity: 0.3             // Intensity of inner glow
        });
        
        // Create the beam mesh
        this.centerOfMassBeam = new THREE.Mesh(beamGeometry, beamMaterial);
        
        // Position the beam so it starts from ground and extends upward
        this.centerOfMassBeam.position.y = beamStartY + (beamHeight / 2);
        
        // Disable shadows as requested
        this.centerOfMassBeam.castShadow = false;
        this.centerOfMassBeam.receiveShadow = false;
        
        // Store beam properties for future updates
        this.centerOfMassBeam.userData = {
            baseHeight: beamStartY + (beamHeight / 2),
            isVisible: true
        };
        
        // Add beam to the group
        this.centerOfMassGroup.add(this.centerOfMassBeam);
        
        // Create additional visual components
        this.createBeamGlowSprite();
        this.createCenterOfMassCross();
        
        // FIXED: Create the green reference point separately (not in centerOfMassGroup)
        this.createFixedPalletCenterReference();
        
        // Add the group to the scene (initially at origin)
        this.scene.add(this.centerOfMassGroup);
        
        // Initially hide the beam until we have center of mass data
        this.hideCenterOfMassBeam();
        
        console.log('Center of mass beam created successfully with fixed green reference');
    }

    /**
     * Create a glowing sprite effect for the beam
     * This adds a radial glow effect at the top of the beam
     */
    createBeamGlowSprite() {
        // Create a simple radial gradient texture for the glow effect
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const context = canvas.getContext('2d');
        
        // Create radial gradient from center
        const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 0, 0, 1.0)');    // Solid red center
        gradient.addColorStop(0.3, 'rgba(255, 0, 0, 0.8)');  // Semi-transparent red
        gradient.addColorStop(0.7, 'rgba(255, 0, 0, 0.3)');  // More transparent
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0.0)');    // Fully transparent edge
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, 64, 64);
        
        // Create texture from canvas
        const glowTexture = new THREE.CanvasTexture(canvas);
        
        // Create sprite material
        const spriteMaterial = new THREE.SpriteMaterial({
            map: glowTexture,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        // Create sprite
        this.centerOfMassGlow = new THREE.Sprite(spriteMaterial);
        this.centerOfMassGlow.scale.set(2, 2, 1); // Make it visible but not too large
        
        // Position sprite at top of beam
        const palletHeight = 1.44;
        const beamStartY = -(palletHeight / 2);
        const beamEndY = 1000;
        const topOfBeam = beamEndY - beamStartY - (beamStartY + ((beamEndY - beamStartY) / 2));
        this.centerOfMassGlow.position.y = topOfBeam;
        
        // Add to the center of mass group
        this.centerOfMassGroup.add(this.centerOfMassGlow);
        
        console.log('Center of mass glow sprite created');
    }

    /**
     * Create a dynamic cross marker at the center of mass position
     * This cross shows exactly where the center of mass intersects with the top of the load
     */
    createCenterOfMassCross() {
        console.log('Creating center of mass cross marker...');
        
        // Cross dimensions - sized to be clearly visible but not overwhelming
        const crossSize = 0.8;      // Total width/height of cross arms
        const crossThickness = 0.05; // Thickness of cross arms
        const crossHeight = 0.02;    // How much the cross extends vertically
        
        // Create the cross geometry using two intersecting boxes
        // Horizontal arm of the cross (left-right)
        const horizontalArmGeometry = new THREE.BoxGeometry(
            crossSize,        // width (extends left-right)
            crossHeight,      // height (thin vertical profile)
            crossThickness    // depth (extends forward-back, but thin)
        );
        
        // Vertical arm of the cross (forward-back from top view)
        const verticalArmGeometry = new THREE.BoxGeometry(
            crossThickness,   // width (thin left-right profile)
            crossHeight,      // height (thin vertical profile)
            crossSize         // depth (extends forward-back)
        );
        
        // Create material for the cross - bright red with slight glow
        const crossMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,           // Pure red to match the beam
            transparent: false,        // Solid cross for clear visibility
            emissive: 0xaa0000,       // Dark red emissive glow
            emissiveIntensity: 0.3,   // Moderate glow intensity
            side: THREE.DoubleSide    // Visible from all angles
        });
        
        // Create the two arms of the cross
        const horizontalArm = new THREE.Mesh(horizontalArmGeometry, crossMaterial);
        const verticalArm = new THREE.Mesh(verticalArmGeometry, crossMaterial);
        
        // Create a group to hold both arms of the cross
        this.centerOfMassCross = new THREE.Group();
        this.centerOfMassCross.add(horizontalArm);
        this.centerOfMassCross.add(verticalArm);
        
        // Disable shadows for the cross (it's a UI element, not a physical object)
        horizontalArm.castShadow = false;
        horizontalArm.receiveShadow = false;
        verticalArm.castShadow = false;
        verticalArm.receiveShadow = false;
        
        // Add the cross to the center of mass group so it moves with the beam
        this.centerOfMassGroup.add(this.centerOfMassCross);
        
        // Initially position the cross at pallet level (will be updated dynamically)
        this.centerOfMassCross.position.y = 0;
        
        console.log('Center of mass cross marker created successfully');
    }

    /**
     * FIXED: Create a FIXED green reference point that always stays at the geometric center (0,0)
     * This provides a visual reference to compare against center of mass deviation
     * The green point NEVER moves horizontally - only follows the height of the load
     */
    createFixedPalletCenterReference() {
        console.log('Creating FIXED pallet center reference point...');
        
        // Reference point specifications - designed to be clearly visible but distinct from cross
        const pointRadius = 0.15;        // Slightly larger than cross thickness for visibility
        const pointHeight = 0.08;        // Taller than cross for better visibility from above
        
        // Create geometry for the reference point - using a cylinder for better visibility
        const referenceGeometry = new THREE.CylinderGeometry(
            pointRadius,     // radiusTop
            pointRadius,     // radiusBottom
            pointHeight,     // height
            12,              // radialSegments (more sides for smoother appearance)
            1                // heightSegments
        );
        
        // Create material for the reference point - solid green with slight glow
        const referenceMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,           // Pure green color for clear contrast with red cross
            transparent: false,        // Solid point for maximum clarity
            emissive: 0x004400,       // Dark green emissive glow for visibility
            emissiveIntensity: 0.4,   // Strong glow to ensure visibility
            side: THREE.DoubleSide    // Visible from all angles
        });
        
        // Create the reference point mesh
        this.palletCenterReference = new THREE.Mesh(referenceGeometry, referenceMaterial);
        
        // Disable shadows for the reference point (it's a UI element, not a physical object)
        this.palletCenterReference.castShadow = false;
        this.palletCenterReference.receiveShadow = false;
        
        // FIXED: Position the reference point at the exact geometric center of the pallet
        // X and Z coordinates are ALWAYS (0, 0) since this represents the true center
        // Y position starts at pallet level and will be updated to match load height
        this.palletCenterReference.position.set(0, 0.72, 0); // Fixed at geometric center
        
        // CRITICAL FIX: Add the reference point directly to the scene, NOT to centerOfMassGroup
        // This ensures it stays fixed at the geometric center and doesn't move with center of mass
        this.scene.add(this.palletCenterReference);
        
        // Initially hide until boxes are present
        this.palletCenterReference.visible = false;
        
        console.log('FIXED pallet center reference point created at (0, 0) - will NOT move with center of mass');
    }

    /**
     * Update the center of mass beam position based on physics calculations
     * This is called whenever the center of mass changes
     * 
     * @param {Object} centerOfMass - Object with x, z coordinates from center-of-mass.js
     * @param {number} centerOfMass.x - X coordinate of center of mass
     * @param {number} centerOfMass.z - Z coordinate of center of mass
     */
    updateCenterOfMassBeamPosition(centerOfMass) {
        if (!this.centerOfMassGroup || !this.centerOfMassBeam) {
            console.warn('Center of mass beam not initialized');
            return;
        }
        
        // Validate input coordinates
        if (typeof centerOfMass.x !== 'number' || typeof centerOfMass.z !== 'number') {
            console.warn('Invalid center of mass coordinates:', centerOfMass);
            return;
        }
        
        // Update the position of the entire group (beam + glow + cross)
        this.centerOfMassGroup.position.x = centerOfMass.x;
        this.centerOfMassGroup.position.z = centerOfMass.z;
        // Y position stays the same (beam always goes from ground to top)
        
        // Show the beam now that we have valid coordinates
        this.showCenterOfMassBeam();
        
        // Optional: Log position updates for debugging
        if (Math.abs(centerOfMass.x) > 0.1 || Math.abs(centerOfMass.z) > 0.1) {
            console.log(`Center of mass beam positioned at (${centerOfMass.x.toFixed(2)}, ${centerOfMass.z.toFixed(2)})`);
        }
    }

    /**
     * Show the center of mass beam
     * Makes the beam visible when we have valid center of mass data
     */
    showCenterOfMassBeam() {
        if (this.centerOfMassGroup) {
            this.centerOfMassGroup.visible = true;
            
            // Update beam visibility flag
            if (this.centerOfMassBeam) {
                this.centerOfMassBeam.userData.isVisible = true;
            }
        }
    }

    /**
     * Hide the center of mass beam
     * Hides the beam when there are no boxes or invalid data
     */
    hideCenterOfMassBeam() {
        if (this.centerOfMassGroup) {
            this.centerOfMassGroup.visible = false;
            
            // Update beam visibility flag
            if (this.centerOfMassBeam) {
                this.centerOfMassBeam.userData.isVisible = false;
            }
        }
    }

    /**
     * Check if center of mass beam is currently visible
     * @returns {boolean} True if beam is visible
     */
    isCenterOfMassBeamVisible() {
        return this.centerOfMassGroup && this.centerOfMassGroup.visible;
    }

    /**
     * FIXED: Update ONLY the height of the green reference point to match current load height
     * The X and Z coordinates ALWAYS remain at (0, 0) - the geometric center
     * 
     * @param {Array} boxes - Array of box meshes currently in the scene
     */
    updatePalletCenterReferenceHeight(boxes) {
        if (!this.palletCenterReference || !boxes || boxes.length === 0) {
            // Hide reference point when no boxes are present
            if (this.palletCenterReference) {
                this.palletCenterReference.visible = false;
            }
            return;
        }
        
        // Find the highest point among all boxes
        let maxHeight = -Infinity;
        
        boxes.forEach(box => {
            // Calculate the top of this box: position + half height
            const boxTop = box.position.y + (box.geometry.parameters.height / 2);
            if (boxTop > maxHeight) {
                maxHeight = boxTop;
            }
        });
        
        // Position the reference point slightly above the highest box
        // but ALWAYS keep X and Z at (0, 0) - the geometric center
        const referenceOffset = 0.12; // Slightly higher than cross to avoid visual overlap
        this.palletCenterReference.position.x = 0;  // ALWAYS at geometric center
        this.palletCenterReference.position.z = 0;  // ALWAYS at geometric center
        this.palletCenterReference.position.y = maxHeight + referenceOffset;
        
        // Make sure the reference point is visible
        this.palletCenterReference.visible = true;
        
        console.log(`Fixed reference point height updated to: ${(maxHeight + referenceOffset).toFixed(2)} but remains at center (0, 0)`);
    }

    /**
     * Update the cross position to mark the center of mass at the top of the current load
     * This method calculates the height of the tallest box and positions the cross there
     * 
     * @param {Array} boxes - Array of box meshes currently in the scene
     */
    updateCenterOfMassCrossHeight(boxes) {
        if (!this.centerOfMassCross || !boxes || boxes.length === 0) {
            // Hide cross when no boxes are present
            if (this.centerOfMassCross) {
                this.centerOfMassCross.visible = false;
            }
            
            // Also hide the green reference point when no boxes
            if (this.palletCenterReference) {
                this.palletCenterReference.visible = false;
            }
            return;
        }
        
        // Find the highest point among all boxes
        let maxHeight = -Infinity;
        
        boxes.forEach(box => {
            // Calculate the top of this box: position + half height
            const boxTop = box.position.y + (box.geometry.parameters.height / 2);
            if (boxTop > maxHeight) {
                maxHeight = boxTop;
            }
        });
        
        // Position the cross slightly above the highest box
        const crossOffset = 0.1; // Small offset so cross doesn't merge with boxes
        this.centerOfMassCross.position.y = maxHeight + crossOffset;
        
        // Make sure the cross is visible
        this.centerOfMassCross.visible = true;
        
        console.log(`Cross positioned at height: ${(maxHeight + crossOffset).toFixed(2)}`);

        // Update the green reference point height (but keep it at center)
        this.updatePalletCenterReferenceHeight(boxes);
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
        
        // Dispose center of mass beam resources
        if (this.centerOfMassGroup) {
            this.centerOfMassGroup.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
            this.scene.remove(this.centerOfMassGroup);
        }
        
        // ADDED: Dispose fixed reference point resources
        if (this.palletCenterReference) {
            if (this.palletCenterReference.geometry) this.palletCenterReference.geometry.dispose();
            if (this.palletCenterReference.material) this.palletCenterReference.material.dispose();
            this.scene.remove(this.palletCenterReference);
        }
        
        console.log('3D simulator disposed successfully with all visual elements cleanup');
    }
}

// Export for use in other files - this makes the class available globally
window.PalletSimulator = PalletSimulator;