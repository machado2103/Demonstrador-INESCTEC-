/**
 * Enhanced Main Application Controller - Complete Palletization Simulator
 * This file orchestrates the entire palletization simulator with advanced controls,
 * connecting 3D visualization with data loading and comprehensive user interface
 * 
 * Features:
 * - Three-zone control layout (Pallet Controls | Information Display | Animation Controls)
 * - Real-time box counting and pallet tracking
 * - Play/pause animation with step-by-step control
 * - Professional error handling and user feedback
 * 
 * Save this as: GUI/3d-viewer/js/main.js
 */

class PalletizationApp {
    constructor() {
        // Core application components
        this.simulator = null;              // Three.js 3D visualization engine
        this.dataLoader = null;             // Crosslog data parser and loader
        this.isInitialized = false;         // Application initialization state
        this.currentDataFile = null;        // Currently loaded data reference
        
        // Animation state management - this tracks the current state of box placement
        // Think of this as the "brain" that remembers where we are in the animation
        this.animationState = {
            isPlaying: false,               // Is animation currently running?
            isPaused: false,                // Is animation paused (vs stopped)?
            currentBoxIndex: 0,             // How many boxes are currently placed?
            totalBoxes: 0                   // How many boxes should be in this pallet?
        };
        
        console.log('PalletizationApp constructor called - preparing for advanced control');
        this.init();
    }
    
    /**
     * Initialize the complete application with all enhanced features
     * This master function coordinates the startup sequence like a conductor leading an orchestra
     */
    async init() {
        try {
            console.log('Initializing Enhanced Palletization Application...');
            
            // Wait for DOM to be fully loaded - we can't build an interface without the HTML foundation
            if (document.readyState === 'loading') {
                console.log('Waiting for DOM to finish loading...');
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }
            
            // Wait for Three.js libraries - the 3D engine must be ready before we start
            await this.waitForThreeJS();
            
            // Initialize components in logical order - foundation first, then features
            this.initializeSimulator();     // 3D visualization engine
            this.initializeDataLoader();    // Data processing system
            this.setupUI();                 // User interface with enhanced controls
            this.showWelcomeMessage();      // User guidance and status
            
            // Attempt automatic data loading - if successful, user sees immediate results
            await this.loadDefaultCrosslogData();
            
            this.isInitialized = true;
            console.log('Enhanced Palletization Application fully initialized with advanced controls!');
            
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.showError('Failed to initialize the 3D visualization. Please refresh the page and try again.');
        }
    }
    
    /**
     * Wait for Three.js libraries to be available
     * This ensures we don't try to use 3D functionality before it's loaded
     */
    async waitForThreeJS() {
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds maximum wait
        
        while (attempts < maxAttempts) {
            if (typeof THREE !== 'undefined' && typeof THREE.OrbitControls !== 'undefined') {
                console.log('Three.js libraries are ready');
                return;
            }
            
            console.log('Waiting for Three.js libraries... attempt', attempts + 1);
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        throw new Error('Three.js libraries failed to load within the expected time');
    }
    
    /**
     * Initialize the Three.js 3D simulator
     * This creates the visual foundation where all our pallets and boxes will appear
     */
    initializeSimulator() {
        console.log('Creating 3D simulator...');
        
        // Create the simulator instance targeting the HTML container
        this.simulator = new PalletSimulator('threejs-container');
        
        // Remove the loading message once 3D scene is ready - clean interface principle
        const loadingMessage = document.querySelector('.threejs-loading');
        if (loadingMessage) {
            loadingMessage.style.display = 'none';
            console.log('Removed loading message - 3D scene is now visible');
        }
        
        console.log('3D Simulator initialized successfully');
    }
    
    /**
     * Initialize the data loading system
     * This creates our Crosslog parser that converts text files into 3D objects
     */
    initializeDataLoader() {
        console.log('Creating data loader...');
        this.dataLoader = new PalletDataLoader(this.simulator);
        console.log('Data Loader initialized successfully');
    }
    
    /**
     * Set up the complete user interface with enhanced controls
     * This is where we build our three-zone control system
     */
    setupUI() {
        console.log('Setting up enhanced user interface controls...');
        
        // Create the main navigation controls with three-zone layout
        this.createNavigationControls();
        
        // Set up automatic information display updates
        this.setupInfoDisplays();
        
        console.log('Enhanced user interface controls set up successfully');
    }
    
    /**
     * Load Crosslog data automatically from the default data file
     * This provides immediate functionality when the application starts
     */
    async loadDefaultCrosslogData() {
        try {
            console.log('=== Attempting to Load Default Crosslog Data ===');
            console.log('Looking for file: 3d-viewer/data/simulation.txt');
            
            // Attempt to fetch the simulation data file
            const response = await fetch('3d-viewer/data/simulation.txt');
            
            // Check if the file was found and can be read
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // Read the entire file content as text
            const fileContent = await response.text();
            
            // Validate that we actually got some content
            if (!fileContent || fileContent.trim().length === 0) {
                throw new Error('Simulation file is empty or contains no valid data');
            }
            
            console.log('✓ Simulation file loaded successfully');
            console.log(`File size: ${fileContent.length} characters`);
            
            // Process the Crosslog data using our existing parser
            const success = this.loadCrosslogData(fileContent, 'simulation.txt');
            
            if (success) {
                console.log('✓ Default Crosslog data loaded and visualization started!');
                this.showMessage('Simulation data loaded successfully');
            } else {
                throw new Error('Failed to parse the Crosslog data in simulation.txt');
            }
            
        } catch (error) {
            // Handle errors gracefully - don't crash the entire application
            console.log('⚠️ Could not load default data file:', error.message);
            console.log('Application will continue in manual mode');
            this.showMessage('No default data found - application ready for manual data loading');
        }
    }
    
    /**
     * Create enhanced navigation controls with perfectly aligned three-zone layout
     * This creates a professional, space-efficient interface that follows clear visual hierarchy
     * 
     * Layout Structure:
     * Top Row: [PALLET CONTROLS] [Pallet X of Y] [ANIMATION CONTROLS] (titles/info aligned)
     * Bottom Row: [Buttons spread] [Box A of B] [Buttons spread] (controls aligned)
     */
    createNavigationControls() {
        // Create main controls container with optimized spacing
        const visualizationArea = document.querySelector('.visualization-area');
        if (visualizationArea) {
            const controlsContainer = document.createElement('div');
            controlsContainer.className = 'controls-container';
            controlsContainer.style.cssText = `
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                grid-template-rows: auto auto;
                gap: 12px 20px;
                margin-bottom: 15px;
                padding: 20px;
                background: rgba(255, 255, 255, 0.95);
                border-radius: 12px;
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                border: 1px solid #e0e0e0;
                align-items: center;
            `;
            
            visualizationArea.insertBefore(controlsContainer, visualizationArea.children[1]);
        }
        
        const controlsContainer = document.querySelector('.controls-container');
        if (!controlsContainer) return;
        
        // === TOP ROW: ZONE TITLES AND PALLET INFO ===
        
        // Left Zone Title (Grid position: row 1, column 1)
        const leftTitle = document.createElement('div');
        leftTitle.textContent = 'PALLET CONTROLS';
        leftTitle.style.cssText = `
            font-size: 0.75rem;
            color: #666;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            text-align: center;
            grid-column: 1;
            grid-row: 1;
        `;
        
        // Center Zone - Pallet Counter (Grid position: row 1, column 2)
        const palletCounter = document.createElement('div');
        palletCounter.id = 'pallet-counter';
        palletCounter.style.cssText = `
            font-weight: bold;
            color: #2c3e50;
            font-size: 0.9rem;
            padding: 6px 16px;
            background: linear-gradient(145deg, #f8f9fa, #e9ecef);
            border-radius: 6px;
            border: 1px solid #dee2e6;
            text-align: center;
            grid-column: 2;
            grid-row: 1;
            justify-self: center;
        `;
        palletCounter.textContent = 'Pallet 0 of 0';
        
        // Right Zone Title (Grid position: row 1, column 3)
        const rightTitle = document.createElement('div');
        rightTitle.textContent = 'ANIMATION CONTROLS';
        rightTitle.style.cssText = `
            font-size: 0.75rem;
            color: #666;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            text-align: center;
            grid-column: 3;
            grid-row: 1;
        `;
        
        // === BOTTOM ROW: CONTROL BUTTONS AND BOX INFO ===
        
        // Left Zone - Pallet Control Buttons (Grid position: row 2, column 1)
        const leftButtons = document.createElement('div');
        leftButtons.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 8px;
            grid-column: 1;
            grid-row: 2;
            width: 100%;
        `;
        
        // Create pallet control buttons with consistent sizing
        const restartButton = this.createControlButton('Restart', () => {
            this.restartCurrentPallet();
        }, 'small');
        restartButton.id = 'restart-pallet-btn';
        restartButton.disabled = true;
        restartButton.title = 'Restart current pallet animation';
        
        const prevPalletButton = this.createControlButton('Previous Pallet', () => {
            if (this.dataLoader) {
                this.dataLoader.previousPallet();
                this.resetAnimationState();
            }
        }, 'small');
        prevPalletButton.id = 'prev-pallet-btn';
        prevPalletButton.disabled = true;
        prevPalletButton.title = 'Previous pallet solution';
        
        const nextPalletButton = this.createControlButton('Next Pallet', () => {
            if (this.dataLoader) {
                this.dataLoader.nextPallet();
                this.resetAnimationState();
            }
        }, 'small');
        nextPalletButton.id = 'next-pallet-btn';
        nextPalletButton.disabled = true;
        nextPalletButton.title = 'Next pallet solution';
        
        const finishedButton = this.createControlButton('Finish', () => {
            this.finishCurrentPallet();
        }, 'small');
        finishedButton.id = 'finished-pallet-btn';
        finishedButton.disabled = true;
        finishedButton.title = 'Complete pallet instantly';
        
        leftButtons.appendChild(restartButton);
        leftButtons.appendChild(prevPalletButton);
        leftButtons.appendChild(nextPalletButton);
        leftButtons.appendChild(finishedButton);
        
        // Center Zone - Box Counter (Grid position: row 2, column 2)
        const boxCounter = document.createElement('div');
        boxCounter.id = 'box-counter';
        boxCounter.style.cssText = `
            font-weight: bold;
            color: #495057;
            font-size: 1.1rem;
            padding: 8px 20px;
            background: linear-gradient(145deg, #ffffff, #f8f9fa);
            border-radius: 8px;
            border: 2px solid #3498db;
            text-align: center;
            box-shadow: 0 2px 4px rgba(52, 152, 219, 0.2);
            grid-column: 2;
            grid-row: 2;
            justify-self: center;
        `;
        boxCounter.textContent = 'Box 0 of 0';
        
        // Right Zone - Animation Control Buttons (Grid position: row 2, column 3)
        const rightButtons = document.createElement('div');
        rightButtons.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 8px;
            grid-column: 3;
            grid-row: 2;
            width: 100%;
        `;
        
        // Create animation control buttons
        const stepBackButton = this.createControlButton('Previous Box', () => {
            this.stepBackwardOneBox();
        }, 'small');
        stepBackButton.id = 'step-back-btn';
        stepBackButton.disabled = true;
        stepBackButton.title = 'Remove one box';
        
        const playPauseButton = this.createControlButton('⏯️', () => {
            this.togglePlayPause();
        }, 'medium');
        playPauseButton.id = 'play-pause-btn';
        playPauseButton.disabled = true;
        playPauseButton.title = 'Play or pause animation';
        
        const stepForwardButton = this.createControlButton('Next Box', () => {
            this.stepForwardOneBox();
        }, 'small');
        stepForwardButton.id = 'step-forward-btn';
        stepForwardButton.disabled = true;
        stepForwardButton.title = 'Add one box';
        
        rightButtons.appendChild(stepBackButton);
        rightButtons.appendChild(playPauseButton);
        rightButtons.appendChild(stepForwardButton);
        
        // === ASSEMBLE THE GRID LAYOUT ===
        controlsContainer.appendChild(leftTitle);
        controlsContainer.appendChild(palletCounter);
        controlsContainer.appendChild(rightTitle);
        controlsContainer.appendChild(leftButtons);
        controlsContainer.appendChild(boxCounter);
        controlsContainer.appendChild(rightButtons);
        
        console.log('Professional grid-based navigation controls created with perfect alignment');
    }
    
    /**
     * Create a styled button with size variations
     * This creates consistent button styling across the interface
     */
    createControlButton(text, onClick, size = 'medium') {
        const button = document.createElement('button');
        button.textContent = text;
        
        // Define size-specific styles - this creates visual hierarchy
        const sizeStyles = {
            small: 'padding: 6px 12px; font-size: 0.8rem;',
            medium: 'padding: 8px 16px; font-size: 0.9rem;',
            large: 'padding: 10px 20px; font-size: 1rem;'
        };
        
        button.style.cssText = `
            ${sizeStyles[size]}
            background: linear-gradient(145deg, #3498db, #2980b9);
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            white-space: nowrap;
        `;
        
        // Add hover effects for better user feedback
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateY(-2px)';
            button.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translateY(0)';
            button.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        });
        
        button.addEventListener('click', onClick);
        
        return button;
    }
    
    /**
     * Toggle between play and pause states
     * This is the central control for animation state management
     */
    togglePlayPause() {
        const button = document.getElementById('play-pause-btn');
        if (!button || !this.dataLoader) return;
        
        if (this.animationState.isPlaying) {
            // Pause the animation by clearing all pending timeouts
            this.dataLoader.animationTimeouts.forEach(timeoutId => {
                clearTimeout(timeoutId);
            });
            this.dataLoader.animationTimeouts = [];
            
            this.animationState.isPlaying = false;
            this.animationState.isPaused = true;
            button.textContent = '▶ Play';
            button.title = 'Resume animation';
            
            console.log('Animation paused at box', this.simulator.boxes.length);
        } else {
            // Resume or start animation
            if (this.animationState.isPaused) {
                this.resumeAnimation();
            } else {
                this.restartCurrentPallet();
            }
            
            this.animationState.isPlaying = true;
            this.animationState.isPaused = false;
            button.textContent = '⏸ Pause';
            button.title = 'Pause animation';
            
            console.log('Animation started/resumed');
        }
        
        this.updateButtonStates();
    }
    
    /**
     * Step backward by removing one box
     * This provides precise control over the visualization
     */
    stepBackwardOneBox() {
        if (!this.simulator || this.simulator.boxes.length === 0) {
            console.log('No boxes to remove');
            return;
        }
        
        // Remove the last box that was added - this maintains the sequence integrity
        const lastBox = this.simulator.boxes.pop();
        this.simulator.scene.remove(lastBox);
        
        // Dispose of resources to prevent memory leaks
        if (lastBox.geometry) lastBox.geometry.dispose();
        if (lastBox.material) lastBox.material.dispose();
        
        // Update our animation state tracking
        this.animationState.currentBoxIndex = this.simulator.boxes.length;
        this.updateBoxCounter();
        this.updateButtonStates();
        
        console.log(`Removed box. Current count: ${this.simulator.boxes.length}`);
    }
    
    /**
     * Step forward by adding one box
     * This allows users to build the pallet manually, box by box
     */
    stepForwardOneBox() {
        if (!this.dataLoader || this.dataLoader.allPallets.length === 0) {
            console.log('No pallet data available');
            return;
        }
        
        const currentPallet = this.dataLoader.allPallets[this.dataLoader.currentPalletIndex];
        const currentBoxCount = this.simulator.boxes.length;
        
        if (currentBoxCount >= currentPallet.boxes.length) {
            console.log('All boxes already placed');
            return;
        }
        
        // Get the next box to place (sorted by sequence to maintain proper order)
        const sortedBoxes = [...currentPallet.boxes].sort((a, b) => a.sequence - b.sequence);
        const nextBox = sortedBoxes[currentBoxCount];
        
        // Add the box to the scene
        this.dataLoader.createAndAddBox(nextBox);
        
        // Update our state tracking
        this.animationState.currentBoxIndex = this.simulator.boxes.length;
        this.updateBoxCounter();
        this.updateButtonStates();
        
        console.log(`Added box ${currentBoxCount + 1}. Current count: ${this.simulator.boxes.length}`);
    }
    
    /**
     * Resume animation from current position
     * This continues the animation from where it was paused
     */
    resumeAnimation() {
        if (!this.dataLoader || this.dataLoader.allPallets.length === 0) return;
        
        const currentPallet = this.dataLoader.allPallets[this.dataLoader.currentPalletIndex];
        const currentBoxCount = this.simulator.boxes.length;
        const sortedBoxes = [...currentPallet.boxes].sort((a, b) => a.sequence - b.sequence);
        
        // Continue animation from where it was paused
        for (let i = currentBoxCount; i < sortedBoxes.length; i++) {
            const delay = (i - currentBoxCount) * this.dataLoader.animationSpeed;
            
            const timeoutId = setTimeout(() => {
                this.dataLoader.createAndAddBox(sortedBoxes[i]);
                this.animationState.currentBoxIndex = i + 1;
                this.updateBoxCounter();
                
                // Check if this was the last box
                if (i === sortedBoxes.length - 1) {
                    this.onAnimationComplete();
                }
            }, delay);
            
            this.dataLoader.animationTimeouts.push(timeoutId);
        }
    }
    
    /**
     * Handle animation completion
     * This is called when the animation reaches the end
     */
    onAnimationComplete() {
        this.animationState.isPlaying = false;
        this.animationState.isPaused = false;
        
        const button = document.getElementById('play-pause-btn');
        if (button) {
            button.textContent = '▶ Play';
            button.title = 'Restart animation';
        }
        
        this.updateButtonStates();
        console.log('Animation completed');
    }
    
    /**
     * Reset animation state
     * This is called when changing pallets or restarting
     */
    resetAnimationState() {
        this.animationState.isPlaying = false;
        this.animationState.isPaused = false;
        this.animationState.currentBoxIndex = 0;
        
        const button = document.getElementById('play-pause-btn');
        if (button) {
            button.textContent = '▶ Play';
            button.title = 'Start animation';
        }
        
        this.updateButtonStates();
    }
    
    /**
     * Update all button states based on current conditions
     * This ensures the interface always reflects the current state accurately
     */
    updateButtonStates() {
        // Get references to all our control buttons
        const prevBtn = document.getElementById('prev-pallet-btn');
        const nextBtn = document.getElementById('next-pallet-btn');
        const restartBtn = document.getElementById('restart-pallet-btn');
        const finishedBtn = document.getElementById('finished-pallet-btn');
        const stepBackBtn = document.getElementById('step-back-btn');
        const stepForwardBtn = document.getElementById('step-forward-btn');
        const playPauseBtn = document.getElementById('play-pause-btn');
        
        // Only proceed if we have buttons and data
        if (!this.dataLoader || !prevBtn || !nextBtn || !restartBtn || !finishedBtn || 
            !stepBackBtn || !stepForwardBtn || !playPauseBtn) {
            return;
        }
        
        const hasData = this.dataLoader.allPallets.length > 0;
        const currentIndex = this.dataLoader.currentPalletIndex;
        const totalPallets = this.dataLoader.allPallets.length;
        const currentBoxes = this.simulator.boxes.length;
        const totalBoxes = hasData ? this.dataLoader.allPallets[currentIndex].boxes.length : 0;
        
        if (hasData) {
            // Pallet navigation buttons
            prevBtn.disabled = currentIndex <= 0;
            nextBtn.disabled = currentIndex >= totalPallets - 1;
            
            // Pallet control buttons
            restartBtn.disabled = false;
            finishedBtn.disabled = false;
            
            // Animation control buttons
            playPauseBtn.disabled = false;
            stepBackBtn.disabled = currentBoxes <= 0;
            stepForwardBtn.disabled = currentBoxes >= totalBoxes;
            
        } else {
            // No data loaded - disable all buttons
            prevBtn.disabled = true;
            nextBtn.disabled = true;
            restartBtn.disabled = true;
            finishedBtn.disabled = true;
            playPauseBtn.disabled = true;
            stepBackBtn.disabled = true;
            stepForwardBtn.disabled = true;
        }
    }
    
    /**
     * Update the box counter display
     * This provides real-time feedback about current progress
     */
    updateBoxCounter() {
        const boxCounter = document.getElementById('box-counter');
        if (boxCounter && this.dataLoader) {
            const currentBoxes = this.simulator.boxes.length;
            const totalBoxes = this.dataLoader.allPallets.length > 0 ? 
                this.dataLoader.allPallets[this.dataLoader.currentPalletIndex].boxes.length : 0;
            
            boxCounter.textContent = `Box ${currentBoxes} of ${totalBoxes}`;
            
            // Update animation state
            this.animationState.currentBoxIndex = currentBoxes;
            this.animationState.totalBoxes = totalBoxes;
        }
    }
    
    /**
     * Update pallet counter display
     * This keeps users informed about their current position in the pallet sequence
     */
    updatePalletCounter() {
        const counter = document.getElementById('pallet-counter');
        if (counter && this.dataLoader) {
            const current = this.dataLoader.currentPalletIndex + 1;
            const total = this.dataLoader.allPallets.length;
            counter.textContent = `Pallet ${current} of ${total}`;
        }
    }
    
    /**
     * Set up automatic updates for information displays
     * This creates a continuous feedback loop for the user interface
     */
    setupInfoDisplays() {
        // Create a periodic update for dynamic information
        setInterval(() => {
            if (this.dataLoader && this.dataLoader.allPallets.length > 0) {
                this.updateButtonStates();      // Keep buttons in sync with state
                this.updatePalletCounter();     // Update pallet information
                this.updateBoxCounter();        // Update box count information
            }
        }, 200);
        
        console.log('Set up automatic UI updates with enhanced feedback');
    }
    
    /**
     * Restart the current pallet animation from the beginning
     * This provides a clean slate while maintaining the same pallet selection
     */
    restartCurrentPallet() {
        if (!this.dataLoader || this.dataLoader.allPallets.length === 0) {
            console.log('No data available to restart');
            return;
        }
        
        console.log('=== Restarting Current Pallet Animation ===');
        
        // Clear any pending animation timeouts to prevent conflicts
        this.dataLoader.clearCurrentBoxes();
        
        // Reset our animation state
        this.resetAnimationState();
        
        // Provide visual feedback to user
        this.showMessage('Restarting pallet animation...');
        
        // Reload the current pallet with fresh animation
        const currentIndex = this.dataLoader.currentPalletIndex;
        this.dataLoader.loadPallet(currentIndex);
        
        console.log('✓ Pallet restart completed successfully');
    }
    
    /**
     * Finish the current pallet animation quickly
     * This demonstrates elegant animation acceleration techniques
     */
    finishCurrentPallet() {
        if (!this.dataLoader || this.dataLoader.allPallets.length === 0) {
            console.log('No data available to finish');
            return;
        }
        
        const currentPallet = this.dataLoader.allPallets[this.dataLoader.currentPalletIndex];
        const currentBoxCount = this.simulator.boxes.length;
        const totalBoxCount = currentPallet.boxes.length;
        
        // Check if animation is already complete
        if (currentBoxCount >= totalBoxCount) {
            console.log('Pallet animation already complete');
            this.showMessage('Pallet already complete');
            return;
        }
        
        console.log('=== Fast-Completing Current Pallet ===');
        
        // Provide visual feedback
        this.showMessage('Completing pallet instantly...');
        
        // Store original animation speed
        const originalSpeed = this.dataLoader.animationSpeed;
        
        // Set ultra-fast animation speed
        this.dataLoader.animationSpeed = 10;
        
        // Clear current boxes and restart with fast animation
        this.dataLoader.clearCurrentBoxes();
        this.resetAnimationState();
        this.dataLoader.loadPallet(this.dataLoader.currentPalletIndex);
        
        // Restore original animation speed after completion
        const remainingBoxes = totalBoxCount;
        const completionTime = remainingBoxes * 10 + 500;
        
        setTimeout(() => {
            this.dataLoader.animationSpeed = originalSpeed;
            this.showMessage(`Pallet completed with ${totalBoxCount} boxes`);
            this.onAnimationComplete();
        }, completionTime);
        
        console.log('✓ Fast completion initiated');
    }
    
    /**
     * Show welcome message for Crosslog data integration
     */
    showWelcomeMessage() {
        console.log('=== Enhanced Palletization Simulator - Ready for Advanced Control ===');
        console.log('✓ 3D visualization initialized with improved lighting and camera controls');
        console.log('✓ Crosslog data parser ready');
        console.log('✓ Three-zone control interface activated');
        console.log('✓ Real-time box counting and animation control enabled');
        console.log('');
        console.log('Advanced Features Available:');
        console.log('  - Play/pause animation control');
        console.log('  - Step-by-step box placement and removal');
        console.log('  - Real-time progress tracking');
        console.log('  - Enhanced camera zoom for tall pallets');
        console.log('  - Improved lighting for better visibility');
        console.log('');
        console.log('System ready for professional palletization analysis!');
    }
    
    /**
     * Load Crosslog formatted data directly
     * This method is specifically designed for Crosslog data format
     */
    loadCrosslogData(crosslogContent, fileName = 'Crosslog Data') {
        try {
            console.log('=== Loading Crosslog Data ===');
            console.log('Source:', fileName);
            console.log('Content length:', crosslogContent.length, 'characters');
            
            // Parse the Crosslog data using our existing parser
            const parsedData = this.dataLoader.parseDataFile(crosslogContent);
            this.currentDataFile = parsedData;
            
            // Validate that we have valid Crosslog data
            if (parsedData.pallets.length > 0) {
                console.log('✓ Successfully parsed Crosslog data');
                console.log('  - Order ID:', parsedData.orderInfo.orderId);
                console.log('  - Total pallets:', parsedData.pallets.length);
                console.log('  - Total boxes:', this.dataLoader.getTotalBoxCount());
                
                // Load the first pallet automatically
                console.log('Loading first pallet...');
                this.dataLoader.loadPallet(0);
                
                // Enable all navigation controls now that we have data
                this.updateButtonStates();
                
                // Update status and provide user feedback
                this.showMessage(`Loaded ${parsedData.pallets.length} pallets from Crosslog data`);
                console.log('✓ Crosslog data loading completed successfully!');
                
                return true;
            } else {
                console.error('✗ No valid pallets found in Crosslog data');
                this.showError('No valid pallet data found in the Crosslog file');
                return false;
            }
            
        } catch (error) {
            console.error('✗ Error loading Crosslog data:', error);
            this.showError('Failed to parse the Crosslog data. Please check the file format.');
            return false;
        }
    }
    
    /**
     * Show a message to the user
     */
    showMessage(message) {
        console.log('📢 Message:', message);
        
        // Update simulation time with the message temporarily
        const timeElement = document.getElementById('simulation-time');
        if (timeElement) {
            const originalText = timeElement.textContent;
            timeElement.textContent = 'Loading...';
            setTimeout(() => {
                timeElement.textContent = originalText;
            }, 2000);
        }
    }
    
    /**
     * Show an error message to the user
     */
    showError(message) {
        console.error('❌ Error:', message);
        alert('Error: ' + message);
    }
    
    /**
     * Clean up resources when the application is closed
     */
    dispose() {
        console.log('Disposing application resources...');
        
        if (this.simulator) {
            this.simulator.dispose();
        }
        
        if (this.dataLoader) {
            this.dataLoader.clearCurrentBoxes();
        }
        
        console.log('Application disposed successfully');
    }
}

// Auto-initialize the application when the page loads
// This creates the global application instance with enhanced features
console.log('Setting up enhanced application auto-initialization...');

// Wait for page to be ready, then initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM loaded, creating enhanced application...');
        window.palletApp = new PalletizationApp();
    });
} else {
    console.log('DOM already loaded, creating enhanced application immediately...');
    window.palletApp = new PalletizationApp();
}

// Clean up when the page is closed
window.addEventListener('beforeunload', () => {
    console.log('Page is closing, cleaning up...');
    if (window.palletApp) {
        window.palletApp.dispose();
    }
});