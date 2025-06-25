/**
 * Enhanced Main Application Controller - FIXED Timer and Center of Mass
 * 
 * CORRECTIONS APPLIED:
 * 1. Timer stops when animation completes and turns green
 * 2. Height display turns green when animation completes  
 * 3. Center of mass calculation debugging added
 * 4. Proper animation completion detection
 * 
 * Save this as: GUI/3d-viewer/js/main.js
 */

class PalletizationApp {
    constructor() {
        // Core application components
        this.simulator = null;
        this.dataLoader = null;
        this.isInitialized = false;
        this.currentDataFile = null;
        
        // Animation state management
        this.animationState = {
            isPlaying: false,
            isPaused: false,
            currentBoxIndex: 0,
            totalBoxes: 0,
            isCompleted: false  // NEW: Track if animation is completed
        };
        
        // Robust sequence tracking to fix manual/automatic inconsistencies
        this.sequenceState = {
            lastPlacedSequence: -1,     // Last sequence actually placed
            nextExpectedSequence: 0,    // Next sequence that should be placed
            isConsistent: true          // Flag to detect inconsistencies
        };
        
        // Dynamic metrics tracking system for real-time information
        this.metricsState = {
            // Height calculation system
            palletTopY: 0.61,           // Y coordinate of pallet top surface
            boxFloorOffset: 0.72,       // Additional Y offset applied to boxes
            currentMaxHeight: 0,        // Current highest point in cm
            
            // Simulation timer system
            simulationTimer: {
                startTime: null,        // When current simulation session started
                elapsedTime: 0,         // Total elapsed time in milliseconds
                isRunning: false,       // Is timer currently running
                pausedTime: 0,          // Time accumulated before current session
                displayInterval: null   // Interval for updating display
            }
        };
        
        //Center of Mass calculation system
        this.centerOfMassCalculator = new CenterOfMassCalculator();
        this.centerOfMassState = {
            isEnabled: true,            // Whether to calculate center of mass
            updateFrequency: 300,       // How often to recalculate (ms)f
            lastCalculation: null,      // Last calculation result
            calculationHistory: []      // History for trend analysis
        };

        // Volume efficiency calculation system
        this.volumeEfficiencyCalculator = new VolumeEfficiencyCalculator();

        // Bottom metrics calculation system  
        this.bottomMetricsCalculator = new BottomMetricsCalculator();
        
        debugLog('INITIALIZATION', '🔧 PalletizationApp constructor - all systems initialized with corrections');
        this.init();

        console.log('DEBUG TEST: debugReverseEngineering exists:', typeof this.debugReverseEngineering);
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
            console.log('Enhanced Palletization Application fully initialized with dynamic metrics!');
            
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
    
    initializeSimulator() {
        console.log('Creating 3D simulator...');
        
        // Create the simulator instance targeting the HTML container
        this.simulator = new PalletSimulator('threejs-container');

        // Initialize volume efficiency pie chart
        setTimeout(() => {
            this.volumeEfficiencyCalculator.initializePieChart();
        }, 500); // Small delay to ensure DOM is ready
        
        // NEW: Initialize center of mass beam visualization
        this.simulator.createCenterOfMassBeam();

       
        // Remove the loading message once 3D scene is ready
        const loadingMessage = document.querySelector('.threejs-loading');
        if (loadingMessage) {
            loadingMessage.style.display = 'none';
            console.log('Removed loading message - 3D scene is now visible');
        }
        
        console.log('3D Simulator initialized successfully with center of mass beam');
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
        
        // Set up automatic information display updates with enhanced metrics
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
            color: #2c3e50;
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
            color: #2c3e50;
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
        
        // Create pallet control buttons with enhanced functionality
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
                this.resetSimulationTimer(); // ENHANCED: Reset timer when changing pallets
                
            }
        }, 'small');
        prevPalletButton.id = 'prev-pallet-btn';
        prevPalletButton.disabled = true;
        prevPalletButton.title = 'Previous pallet solution';
        
        const nextPalletButton = this.createControlButton('Next Pallet', () => {
            if (this.dataLoader) {
                this.dataLoader.nextPallet();
                this.resetAnimationState();
                this.resetSimulationTimer(); // ENHANCED: Reset timer when changing pallets
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
        
        // Create animation control buttons with enhanced functionality
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
        
        console.log('Professional grid-based navigation controls created with enhanced functionality');
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
    
    calculateCurrentHeight() {
        if (!window.unitsSystem) {
            console.error('❌ Units system not available for height calculation');
            return 0;
        }
        // Usar o sistema unificado para cálculo de altura
        const result = window.unitsSystem.calculateDisplayHeight(
            this.simulator ? this.simulator.boxes : [],
            this.metricsState.palletTopY,
            this.metricsState.boxFloorOffset
        );

        debugLog('HEIGHT_CALC', `🔧 Height calculation: ${result.cm.toFixed(1)}cm (${result.displayText})`);



        
        // Armazenar para referência
        this.metricsState.currentMaxHeight = result.cm;
        return result.cm;
    }
    
    /**
     * ENHANCED: Start the simulation timer
     * Called when animation begins or resumes
     */
    startSimulationTimer() {
        const timer = this.metricsState.simulationTimer;
        
        if (!timer.isRunning && !this.animationState.isCompleted) { // FIXED: Don't start if completed
            timer.startTime = Date.now();
            timer.isRunning = true;
            
            // Start the display update interval (update every 100ms for smooth display)
            timer.displayInterval = setInterval(() => {
                this.updateTimeDisplay();
            }, 100);
            
        }
    }
    
    /**
     * ENHANCED: Stop or pause the simulation timer
     * Called when animation is paused or stopped
     */
    stopSimulationTimer() {
        const timer = this.metricsState.simulationTimer;
        
        if (timer.isRunning) {
            // Calculate elapsed time for this session
            const sessionTime = Date.now() - timer.startTime;
            timer.pausedTime += sessionTime;
            
            timer.isRunning = false;
            timer.startTime = null;
            
            // Clear the display update interval
            if (timer.displayInterval) {
                clearInterval(timer.displayInterval);
                timer.displayInterval = null;
            }
            
        }
    }
    
    /**
     * ENHANCED: Reset the simulation timer to zero
     * Called when restarting pallet or changing to different pallet
     */
    resetSimulationTimer() {
        const timer = this.metricsState.simulationTimer;
        
        // Stop any running timer
        this.stopSimulationTimer();
        
        // Reset all timer values
        timer.elapsedTime = 0;
        timer.pausedTime = 0;
        timer.startTime = null;
        timer.isRunning = false;
        
        // Reset completion state
        this.animationState.isCompleted = false;
        
        // Update display immediately
        this.updateTimeDisplay();
        
        console.log('Simulation timer reset');
    }
    
    /**
     * ENHANCED: Get the total elapsed simulation time in milliseconds
     * Includes both completed sessions and current session if running
     */
    getTotalElapsedTime() {
        const timer = this.metricsState.simulationTimer;
        
        let totalTime = timer.pausedTime;
        
        // Add current session time if timer is running
        if (timer.isRunning && timer.startTime) {
            totalTime += (Date.now() - timer.startTime);
        }
        
        return totalTime;
    }
    
    /**
     * FIXED: Update the time display in the UI with green color when completed
     * Shows elapsed time in a user-friendly format
     */
    updateTimeDisplay() {
        const timeElement = document.getElementById('simulation-time');
        if (!timeElement) return;
        
        const totalMs = this.getTotalElapsedTime();
        const seconds = totalMs / 1000;
        
        // Format time nicely - different formats for different durations
        let displayText;
        if (seconds < 60) {
            displayText = `${seconds.toFixed(1)}s`;
        } else {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            displayText = `${minutes}:${remainingSeconds.toFixed(1).padStart(4, '0')}`;
        }
        
        timeElement.textContent = displayText;
        
        // FIXED: Change color to green when animation is completed
        if (this.animationState.isCompleted) {
            timeElement.style.color = '#27ae60'; // Green for completed
        } else {
            timeElement.style.color = '#3498db'; // Blue for active/paused
        }
    }
    
    /**
     * FIXED: Update the height display in the UI with green color when completed
     * Shows current pallet height in centimeters
     */
    updateHeightDisplay() {
        const heightElement = document.getElementById('current-height');
        if (!heightElement) return;
        
        const currentHeightCm = this.calculateCurrentHeight();
        
        // Smart unit conversion logic
        let displayText;
        if (currentHeightCm >= 100) {
            // Convert to meters when height is 100cm or more
            const heightInMeters = currentHeightCm / 100;
            displayText = `${heightInMeters.toFixed(2)}m`;
        } else {
            // Keep in centimeters for values under 100cm
            displayText = `${currentHeightCm.toFixed(1)}cm`;
        }
        
        heightElement.textContent = displayText;
        
        // FIXED: Change color to green when animation is completed
        if (this.animationState.isCompleted) {
            heightElement.style.color = '#27ae60'; // Green for completed
        } else {
            heightElement.style.color = '#3498db'; // Blue for active/paused
        }

    }
    
    /**
     * ENHANCED: Toggle between play and pause states with timer integration
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
            
            // ENHANCED: Stop the simulation timer
            this.stopSimulationTimer();
            
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
            
            // ENHANCED: Start the simulation timer
            this.startSimulationTimer();
            
            console.log('Animation started/resumed');
        }
        
        this.updateButtonStates();
    }
    
    /**
     * ENHANCED: Step backward by removing one box with height updates
     * This provides precise control over the visualization
     */
    stepBackwardOneBox() {
        if (!this.simulator || this.simulator.boxes.length === 0) {
            console.log('No boxes to remove');
            return;
        }
        
        // Find the box with the highest sequence (last placed logically)
        let lastBox = null;
        let maxSequence = -1;
        let maxSequenceIndex = -1;
        
        this.simulator.boxes.forEach((box, index) => {
            if (box.userData.sequence > maxSequence) {
                maxSequence = box.userData.sequence;
                lastBox = box;
                maxSequenceIndex = index;
            }
        });
        
        if (lastBox) {
            // Remove the box from the scene
            this.simulator.scene.remove(lastBox);
            this.simulator.boxes.splice(maxSequenceIndex, 1);
            
            // Dispose of resources to prevent memory leaks
            if (lastBox.geometry) lastBox.geometry.dispose();
            if (lastBox.material) lastBox.material.dispose();
            
            // ENHANCED: Update sequence tracking
            this.sequenceState.lastPlacedSequence = this.findCurrentMaxSequence();
            this.sequenceState.nextExpectedSequence = maxSequence; // The removed sequence becomes next expected
            
            console.log(`Removed box with sequence ${maxSequence}. Remaining: ${this.simulator.boxes.length}`);
        }
        
        // Reset completion state when removing boxes
        this.animationState.isCompleted = false;
        
        // ENHANCED: Update height display after removing box
        this.updateHeightDisplay();
        
        // Update our animation state tracking
        this.animationState.currentBoxIndex = this.simulator.boxes.length;
        this.updateBoxCounter();
        this.updateButtonStates();
    }
    
    /**
     * ENHANCED: Step forward by adding one box with sequence tracking and height updates
     * Now uses sequence-based tracking instead of simple box count for consistency
     */
    stepForwardOneBox() {
        if (!this.dataLoader || this.dataLoader.allPallets.length === 0) {
            console.log('No pallet data available');
            return;
        }
        
        const currentPallet = this.dataLoader.allPallets[this.dataLoader.currentPalletIndex];
        const sortedBoxes = [...currentPallet.boxes].sort((a, b) => a.sequence - b.sequence);
        
        // ENHANCED: Instead of using boxes.length as direct index
        // Find the next box based on sequence logic
        const nextBoxIndex = this.findNextBoxToPlace(sortedBoxes);
        
        if (nextBoxIndex === -1) {
            console.log('All boxes already placed or sequence completed');
            return;
        }
        
        const nextBox = sortedBoxes[nextBoxIndex];
        
        // Add the box to the scene
        this.dataLoader.createAndAddBox(nextBox);
        
        // ENHANCED: Update sequence tracking
        this.sequenceState.lastPlacedSequence = nextBox.sequence;
        this.sequenceState.nextExpectedSequence = this.findNextExpectedSequence(sortedBoxes, nextBox.sequence);
        
        // Check if this completes the animation
        if (this.simulator.boxes.length === sortedBoxes.length) {
            this.setAnimationCompleted();
        }
        
        // ENHANCED: Update height display after adding box
        this.updateHeightDisplay();
        
        // Update our state tracking
        this.animationState.currentBoxIndex = this.simulator.boxes.length;
        this.updateBoxCounter();
        this.updateButtonStates();
        
        console.log(`Added box with sequence ${nextBox.sequence}. Total boxes: ${this.simulator.boxes.length}`);
    }

    /**
     * FIXED: Set animation as completed and update UI accordingly
     */
    setAnimationCompleted() {
        console.log('=== ANIMATION COMPLETED ===');
        
        this.animationState.isCompleted = true;
        this.animationState.isPlaying = false;
        this.animationState.isPaused = false;
        
        // Stop the timer permanently
        this.stopSimulationTimer();
        
        // Update button text
        const button = document.getElementById('play-pause-btn');
        if (button) {
            button.textContent = '▶ Play';
            button.title = 'Restart animation';
        }
        
        // Update displays with green color
        this.updateTimeDisplay();
        this.updateHeightDisplay();
        this.updateButtonStates();
        
        console.log('Animation marked as completed - timer stopped, UI updated to green');
    }
    
    /**
     * ENHANCED: Update the boxes placed display with actual count
     * Shows the real number of boxes currently placed in the scene
     */
    updateBoxesPlacedDisplay() {
        const boxesElement = document.getElementById('boxes-count');
        if (!boxesElement) return;
        
        const currentBoxCount = this.simulator ? this.simulator.boxes.length : 0;
        boxesElement.textContent = currentBoxCount.toString();
        
        // Optional: Add visual feedback based on progress
        if (this.dataLoader && this.dataLoader.allPallets.length > 0) {
            const totalBoxes = this.dataLoader.allPallets[this.dataLoader.currentPalletIndex].boxes.length;
            const progressPercentage = (currentBoxCount / totalBoxes) * 100;
            
            // Change color based on completion percentage
            if (progressPercentage === 100) {
                boxesElement.style.color = '#27ae60'; // Green for complete
            } else {
                boxesElement.style.color = '#3498db'; // Blue for the rest
            }
        }
    }
    
    /**
     * ENHANCED: Find the next box that should be placed based on current scene state
     * This ensures consistency regardless of how we got to the current state
     */
    findNextBoxToPlace(sortedBoxes) {
        // Get all sequences currently placed in the scene
        const placedSequences = new Set(
            this.simulator.boxes.map(box => box.userData.sequence)
        );
        
        // Find the first sequence that hasn't been placed yet
        for (let i = 0; i < sortedBoxes.length; i++) {
            const sequence = sortedBoxes[i].sequence;
            if (!placedSequences.has(sequence)) {
                return i;
            }
        }
        
        // All boxes have been placed
        return -1;
    }
    
    /**
     * ENHANCED: Calculate what the next expected sequence should be
     */
    findNextExpectedSequence(sortedBoxes, currentSequence) {
        const currentIndex = sortedBoxes.findIndex(box => box.sequence === currentSequence);
        if (currentIndex === -1 || currentIndex === sortedBoxes.length - 1) {
            return -1; // Sequence not found or it's the last one
        }
        return sortedBoxes[currentIndex + 1].sequence;
    }
    
    /**
     * ENHANCED: Find the current maximum sequence in the scene
     */
    findCurrentMaxSequence() {
        if (this.simulator.boxes.length === 0) return -1;
        
        return Math.max(...this.simulator.boxes.map(box => box.userData.sequence));
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
                    this.setAnimationCompleted(); // FIXED: Use new completion method
                }
            }, delay);
            
            this.dataLoader.animationTimeouts.push(timeoutId);
        }
    }
    
    /**
     * FIXED: Handle animation completion using the new method
     * This is called when the animation reaches the end
     */
    onAnimationComplete() {
        this.setAnimationCompleted(); // Use the new centralized completion method
    }
    
    /**
     * ENHANCED: Reset animation state with metrics integration
     * This is called when changing pallets or restarting
     */
    resetAnimationState() {
        this.animationState.isPlaying = false;
        this.animationState.isPaused = false;
        this.animationState.currentBoxIndex = 0;
        this.animationState.isCompleted = false; // Reset completion state
        
        // Reset sequence tracking
        this.sequenceState.lastPlacedSequence = -1;
        this.sequenceState.nextExpectedSequence = 0;
        this.sequenceState.isConsistent = true;
        
        // Reset metrics
        this.metricsState.currentMaxHeight = 0;
        this.updateHeightDisplay();
        
        // Reset center of mass calculation
        this.centerOfMassState.lastCalculation = null;
        this.updateCenterOfMassDisplay(); // This will hide the beam
        
        const button = document.getElementById('play-pause-btn');
        if (button) {
            button.textContent = '▶ Play';
            button.title = 'Start animation';
        }

        //Resets the bottom metrics
        this.bottomMetricsCalculator.reset();
        
        this.updateButtonStates();
        console.log('Animation state, metrics, and center of mass visualization reset');
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
     * ENHANCED: Modified setupInfoDisplays to include the new box counter
     * This ensures all dynamic information updates properly
     */
    setupInfoDisplays() {
        setInterval(() => {
            if (this.dataLoader && this.dataLoader.allPallets.length > 0) {
                this.updateButtonStates();          // Keep buttons in sync with state
                this.updatePalletCounter();         // Update pallet information
                this.updateBoxCounter();            // Update box count information
                
                // ENHANCED: Update dynamic metrics
                this.updateHeightDisplay();         // Real-time height calculation with smart units
                this.updateBoxesPlacedDisplay();    // Real-time boxes placed count
                this.updateCenterOfMassDisplay();   // Real-time center of mass calculation


                // Update volume efficiency in real-time  (For the Volume  Calculation)
                const currentHeightCm = this.calculateCurrentHeight();
                this.volumeEfficiencyCalculator.updateEfficiency(this.simulator.boxes, currentHeightCm);


                // Update bottom metrics (LSI and Box Density)
                const centerOfMassResult = this.centerOfMassState.lastCalculation;
                this.bottomMetricsCalculator.calculateBottomMetrics(this.simulator.boxes, centerOfMassResult);
                this.updateBottomMetricsDisplay();
            }
        }, 200); // Keep 200ms for responsive UI updates
        
    }
    
    /**
     * ENHANCED: Restart the current pallet animation from the beginning with timer reset
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
        
        // ENHANCED: Reset simulation timer for fresh start
        this.resetSimulationTimer();

        // Reset volume efficiency
        this.volumeEfficiencyCalculator.reset();

        //Reset bottom metrics
        this.bottomMetricsCalculator.reset();
        
        // Provide visual feedback to user
        this.showMessage('Restarting pallet animation...');
        
        // Reload the current pallet with fresh animation
        const currentIndex = this.dataLoader.currentPalletIndex;
        this.dataLoader.loadPallet(currentIndex);
        
        // ENHANCED: Start timer when animation begins
        this.startSimulationTimer();
        
        console.log('✓ Pallet restart completed successfully with timer reset');
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
            this.setAnimationCompleted(); // FIXED: Use new completion method
        }, completionTime);
        
        console.log('✓ Fast completion initiated');
    }

    /**
     * BONUS: Method to get height information in both units
     * Useful for debugging or advanced displays
     */
    getHeightInfo() {
        const heightCm = this.calculateCurrentHeight();
        const heightM = heightCm / 100;
        
        return {
            centimeters: heightCm,
            meters: heightM,
            displayText: heightCm >= 100 ? `${heightM.toFixed(2)}m` : `${heightCm.toFixed(1)}cm`,
            isOverOneMeter: heightCm >= 100
        };
    }

    /**
     * BONUS: Method to get comprehensive box statistics
     * Provides detailed information about box placement progress
     */
    getBoxStatistics() {
        if (!this.simulator || !this.dataLoader || this.dataLoader.allPallets.length === 0) {
            return null;
        }
        
        const currentBoxCount = this.simulator.boxes.length;
        const totalBoxes = this.dataLoader.allPallets[this.dataLoader.currentPalletIndex].boxes.length;
        const progressPercentage = (currentBoxCount / totalBoxes) * 100;
        
        return {
            placed: currentBoxCount,
            total: totalBoxes,
            remaining: totalBoxes - currentBoxCount,
            progressPercentage: progressPercentage,
            isComplete: currentBoxCount === totalBoxes
        };
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
                
                // ENHANCED: Start simulation timer
                this.startSimulationTimer();
                
                // Enable all navigation controls now that we have data
                this.updateButtonStates();
                
                // Update status and provide user feedback
                this.showMessage(`Loaded ${parsedData.pallets.length} pallets from Crosslog data`);

                
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
        console.log('Message:', message);
        
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
        console.error('Error:', message);
        alert('Error: ' + message);
    }
    
    /**
     * ENHANCED: Clean up resources when the application is closed
     * Now properly disposes of timer intervals
     */
    dispose() {
        console.log('Disposing application resources...');
        
        // ENHANCED: Clean up timer resources
        this.stopSimulationTimer();
        if (this.metricsState.simulationTimer.displayInterval) {
            clearInterval(this.metricsState.simulationTimer.displayInterval);
        }
        
        if (this.simulator) {
            this.simulator.dispose();
        }
        
        if (this.dataLoader) {
            this.dataLoader.clearCurrentBoxes();
        }
        
        if (this.volumeEfficiencyCalculator) {
            this.volumeEfficiencyCalculator.dispose();
        }

        if (this.bottomMetricsCalculator) {
            this.bottomMetricsCalculator.dispose();
        }

        console.log('Application disposed successfully with metrics cleanup');
    }
    
    /**
     * ENHANCED: Debug method to verify height calculations
     * Use this to troubleshoot coordinate system issues
     */
    debugHeightCalculation() {
        if (this.simulator.boxes.length === 0) {
            console.log('No boxes to analyze');
            return;
        }
        
        console.log('=== HEIGHT CALCULATION DEBUG ===');
        console.log('Pallet reference level:', this.metricsState.palletTopY + this.metricsState.boxFloorOffset);
        
        this.simulator.boxes.forEach((box, index) => {
            const boxTop = box.position.y + (box.geometry.parameters.height / 2);
            const boxBottom = box.position.y - (box.geometry.parameters.height / 2);
            console.log(`Box ${index}: Y=${box.position.y.toFixed(2)}, Height=${box.geometry.parameters.height.toFixed(2)}, Top=${boxTop.toFixed(2)}, Bottom=${boxBottom.toFixed(2)}`);
        });
        
        console.log('Calculated height:', this.calculateCurrentHeight().toFixed(2), 'cm');
    }

    /**
     * ENHANCED: Calculate center of mass and update UI display
     * This method bridges the physics calculator with the user interface
     */
    updateCenterOfMassDisplay() {
        // Only calculate if we have boxes and the system is enabled
        if (!this.simulator || !this.simulator.boxes || 
            this.simulator.boxes.length === 0 || 
            !this.centerOfMassState.isEnabled) {
            
            // Show zero deviation when no boxes are present
            this.setCenterOfMassUI('0.0cm');
            
            // Hide the beam when no boxes are present
            if (this.simulator && this.simulator.hideCenterOfMassBeam) {
                this.simulator.hideCenterOfMassBeam();
            }
            
            return;
        }
        
        try {
            // Perform the physics calculation
            const result = this.centerOfMassCalculator.calculateCenterOfMass(this.simulator.boxes);
            
            // Store the result for other systems to use
            this.centerOfMassState.lastCalculation = result;
            
            // Update the UI with formatted deviation
            const formattedDeviation = this.centerOfMassCalculator.getFormattedDeviation();
            this.setCenterOfMassUI(formattedDeviation);
            
            // Add visual feedback based on stability
            this.updateCenterOfMassVisualFeedback(result);
            
            // Update the visual beam position based on calculated center of mass
            if (this.simulator && this.simulator.updateCenterOfMassBeamPosition) {
                this.simulator.updateCenterOfMassBeamPosition({
                    x: result.x,
                    z: result.z
                });
                
                // Update cross height to match current load height
                if (this.simulator.updateCenterOfMassCrossHeight) {
                    this.simulator.updateCenterOfMassCrossHeight(this.simulator.boxes);
                }
            }
            
            // Log significant changes (optional)
            if (result.deviationCm > 20) {
                console.warn(`High center of mass deviation detected: ${formattedDeviation}`);
            }
            
        } catch (error) {
            console.error('Error calculating center of mass:', error);
            this.setCenterOfMassUI('Error');
            
            // Hide beam on error
            if (this.simulator && this.simulator.hideCenterOfMassBeam) {
                this.simulator.hideCenterOfMassBeam();
            }
        }
    }

    /**
     * Get detailed center of mass analysis for advanced users
     * @returns {Object} Complete center of mass analysis or null if not available
     */
    getCenterOfMassAnalysis() {
        if (!this.centerOfMassState.lastCalculation) {
            return null;
        }
        
        return this.centerOfMassCalculator.getAnalysisReport();
    }

    /**
     * Debug method to analyze center of mass calculation
     * Call this from browser console: window.palletApp.debugCenterOfMass()
     */
    debugCenterOfMass() {
        console.log('=== CENTER OF MASS DEBUG ===');
        
        if (!this.simulator || this.simulator.boxes.length === 0) {
            console.log('No boxes available for analysis');
            return;
        }
        
        // Enable debug mode temporarily
        this.centerOfMassCalculator.setDebugMode(true);
        
        // Perform calculation with detailed logging
        const result = this.centerOfMassCalculator.calculateCenterOfMass(this.simulator.boxes);
        
        // Show comprehensive analysis
        this.centerOfMassCalculator.visualizeInConsole();
        
        // Show individual box contributions
        console.log('Individual box analysis:');
        this.simulator.boxes.forEach((box, index) => {
            const weight = box.userData.weight || 0;
            const pos = box.position;
            console.log(`Box ${index}: pos(${pos.x.toFixed(2)}, ${pos.z.toFixed(2)}), weight=${weight}kg`);
        });
        
        // Show deviation analysis
        console.log('');
        console.log('DEVIATION ANALYSIS:');
        console.log(`Center of Mass: (${result.x.toFixed(3)}, ${result.z.toFixed(3)})`);
        console.log(`Deviation: ${result.deviationCm.toFixed(1)}cm`);
        console.log(`Pallet Half-Length: ${6.0}cm (600mm)`);
        console.log(`Pallet Half-Width: ${4.0}cm (400mm)`);
        console.log(`Maximum Safe Deviation: ~${4.0}cm (half width)`);
        
        // Disable debug mode
        this.centerOfMassCalculator.setDebugMode(false);
        
        console.log('========================');
        
        return result;
    }

/**
 * MÉTODO COMPLETO: Análise de engenharia reversa da escala do sistema
 * Call this from browser console: window.palletApp.debugReverseEngineering()
 * 
 * PROPÓSITO EDUCATIVO: Descobrir a verdadeira relação entre units Three.js e dimensões reais
 * Este método funciona como um detective que recolhe evidências de várias fontes
 * e depois compara essas evidências para descobrir a verdade sobre a escala do sistema
 */
/**
 * VERSÃO ROBUSTA: Análise de engenharia reversa com tratamento de erros
 * Esta versão inclui validação defensiva e captura de erros para debugging
 */
    debugReverseEngineering() {
        try {
            console.log('=== REVERSE ENGINEERING ANALYSIS ===');
            console.log('Starting forensic analysis of coordinate system scaling...');
            console.log('🔍 Diagnostic mode: Enhanced error checking enabled');
            console.log('');
            
            // STEP 1: Validação fundamental do estado da aplicação
            console.log('📋 STEP 1: Application State Validation');
            
            // Verificar se os componentes básicos existem
            if (!this.dataLoader) {
                console.log('❌ DataLoader not available');
                return { error: 'DataLoader not initialized', timestamp: new Date().toISOString() };
            }
            console.log('✅ DataLoader available');
            
            if (!this.simulator) {
                console.log('❌ Simulator not available');
                return { error: 'Simulator not initialized', timestamp: new Date().toISOString() };
            }
            console.log('✅ Simulator available');
            
            if (!this.dataLoader.allPallets || this.dataLoader.allPallets.length === 0) {
                console.log('❌ No pallet data loaded');
                return { error: 'No pallet data available', timestamp: new Date().toISOString() };
            }
            console.log(`✅ Found ${this.dataLoader.allPallets.length} pallets`);
            
            if (!this.simulator.boxes || this.simulator.boxes.length === 0) {
                console.log('❌ No boxes in scene');
                return { error: 'No boxes available for analysis', timestamp: new Date().toISOString() };
            }
            console.log(`✅ Found ${this.simulator.boxes.length} boxes in scene`);
            
            console.log('');
            
            // STEP 2: Análise dos dados Crosslog (com validação)
            console.log('📋 STEP 2: Crosslog Data Analysis');
            console.log('Examining the theoretical blueprint data...');
            
            const currentPallet = this.dataLoader.allPallets[this.dataLoader.currentPalletIndex];
            console.log('Expected pallet size: 1200mm × 800mm × 1500mm');
            console.log(`Current pallet index: ${this.dataLoader.currentPalletIndex + 1} of ${this.dataLoader.allPallets.length}`);
            console.log(`Total boxes in current pallet: ${currentPallet.boxes ? currentPallet.boxes.length : 'unknown'}`);
            
            if (currentPallet.metadata && currentPallet.metadata.dimensions) {
                console.log('Pallet dimensions from data:', currentPallet.metadata.dimensions);
            } else {
                console.log('⚠️ No metadata dimensions available');
            }
            
            console.log('');
            
            // STEP 3: Análise da cena Three.js (com validação)
            console.log('🎮 STEP 3: Three.js Scene Analysis');
            console.log('Exploring the actual 3D world that was created...');
            
            if (!this.simulator.scene) {
                console.log('❌ Three.js scene not available');
                return { error: 'Three.js scene not available', timestamp: new Date().toISOString() };
            }
            
            // Procurar objetos de palete de forma segura
            const palletObjects = [];
            try {
                this.simulator.scene.traverse((object) => {
                    if (object && object.name && object.name.includes('pallet')) {
                        palletObjects.push(object);
                    }
                });
            } catch (error) {
                console.log('⚠️ Error during scene traversal:', error.message);
            }
            
            if (palletObjects.length > 0) {
                console.log(`✅ Found ${palletObjects.length} pallet objects in the scene`);
                palletObjects.forEach((pallet, index) => {
                    console.log(`Pallet ${index}:`, pallet.geometry?.parameters || 'No geometry parameters');
                });
            } else {
                console.log('⚠️ No pallet objects found by name');
            }
            
            console.log('');
            
            // STEP 4: Análise espacial das caixas (com validação robusta)
            console.log('📦 STEP 4: Box Positioning Analysis');
            console.log('Measuring the actual placement and dimensions of all boxes...');
            
            const boxes = this.simulator.boxes;
            console.log(`Analyzing ${boxes.length} boxes for spatial relationships...`);
            
            // Declarar variáveis para o bounding box
            let minX = Infinity, maxX = -Infinity;
            let minY = Infinity, maxY = -Infinity; 
            let minZ = Infinity, maxZ = -Infinity;
            
            // Mostrar exemplos detalhados com validação
            console.log('\nDetailed analysis of first 3 boxes (as representative samples):');
            boxes.slice(0, 3).forEach((box, index) => {
                try {
                    if (box && box.position && box.geometry && box.geometry.parameters) {
                        const pos = box.position;
                        const geom = box.geometry.parameters;
                        console.log(`Box ${index}: position(${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)}), dimensions(${geom.width.toFixed(2)} × ${geom.height.toFixed(2)} × ${geom.depth.toFixed(2)})`);
                    } else {
                        console.log(`Box ${index}: Invalid box data structure`);
                    }
                } catch (error) {
                    console.log(`Box ${index}: Error analyzing - ${error.message}`);
                }
            });
            
            // Calcular bounding box com validação robusta
            let validBoxCount = 0;
            boxes.forEach((box, index) => {
                try {
                    if (!box || !box.position || !box.geometry || !box.geometry.parameters) {
                        console.log(`⚠️ Box ${index}: Invalid structure, skipping`);
                        return;
                    }
                    
                    const pos = box.position;
                    const geom = box.geometry.parameters;
                    
                    // Verificar se os valores são números válidos
                    if (typeof pos.x !== 'number' || typeof pos.y !== 'number' || typeof pos.z !== 'number' ||
                        typeof geom.width !== 'number' || typeof geom.height !== 'number' || typeof geom.depth !== 'number') {
                        console.log(`⚠️ Box ${index}: Invalid numeric values, skipping`);
                        return;
                    }
                    
                    // Calcular as extremidades de cada caixa no espaço 3D
                    const leftX = pos.x - geom.width/2;
                    const rightX = pos.x + geom.width/2;
                    const bottomY = pos.y - geom.height/2;
                    const topY = pos.y + geom.height/2;
                    const backZ = pos.z - geom.depth/2;
                    const frontZ = pos.z + geom.depth/2;
                    
                    // Actualizar os limites do envelope total
                    if (leftX < minX) minX = leftX;
                    if (rightX > maxX) maxX = rightX;
                    if (bottomY < minY) minY = bottomY;
                    if (topY > maxY) maxY = topY;
                    if (backZ < minZ) minZ = backZ;
                    if (frontZ > maxZ) maxZ = frontZ;
                    
                    validBoxCount++;
                    
                } catch (error) {
                    console.log(`⚠️ Box ${index}: Error processing - ${error.message}`);
                }
            });
            
            console.log(`\n📊 Processed ${validBoxCount} valid boxes out of ${boxes.length} total`);
            
            if (validBoxCount === 0) {
                console.log('❌ No valid boxes found for analysis');
                return { error: 'No valid boxes for spatial analysis', timestamp: new Date().toISOString() };
            }
            
            console.log('\n🔍 Complete Scene Bounding Box Analysis:');
            console.log(`X range: ${minX.toFixed(3)} to ${maxX.toFixed(3)} (total span: ${(maxX-minX).toFixed(3)} units)`);
            console.log(`Y range: ${minY.toFixed(3)} to ${maxY.toFixed(3)} (total span: ${(maxY-minY).toFixed(3)} units)`);
            console.log(`Z range: ${minZ.toFixed(3)} to ${maxZ.toFixed(3)} (total span: ${(maxZ-minZ).toFixed(3)} units)`);
            
            // STEP 5: Cálculos de escala (com protecção contra divisão por zero)
            console.log('\n🧮 STEP 5: Scale Factor Calculations');
            console.log('Testing different hypotheses about the coordinate system...');
            
            const xSpan = maxX - minX;
            const ySpan = maxY - minY;
            const zSpan = maxZ - minZ;
            
            if (xSpan > 0.001 && ySpan > 0.001) { // Usar tolerância pequena em vez de zero exato
                console.log('\n📏 HYPOTHESIS 1: X span represents 120cm (standard pallet length)');
                const scaleFactor1 = 120 / xSpan;
                console.log(`If 1 unit = ${scaleFactor1.toFixed(2)} cm, then:`);
                console.log(`  Y span would represent: ${(ySpan * scaleFactor1).toFixed(1)} cm (height)`);
                console.log(`  Z span would represent: ${(zSpan * scaleFactor1).toFixed(1)} cm (width)`);
                
                console.log('\n📏 HYPOTHESIS 2: Y span represents ~150cm (visual height estimate)');
                const scaleFactor2 = 150 / ySpan;
                console.log(`If 1 unit = ${scaleFactor2.toFixed(2)} cm, then:`);
                console.log(`  X span would represent: ${(xSpan * scaleFactor2).toFixed(1)} cm (length)`);
                console.log(`  Z span would represent: ${(zSpan * scaleFactor2).toFixed(1)} cm (width)`);
            } else {
                console.log('⚠️ Cannot perform scale calculations: dimensions too small or zero');
            }
            
            // STEP 6: Validação do sistema atual (com verificação do unitsSystem)
            console.log('\n⚖️ STEP 6: Current System Validation');
            console.log('Comparing our discoveries with the current system settings...');
            
            let currentXSizeCm = 0;
            let deviationFromExpected = 0;
            
            if (window.unitsSystem && window.unitsSystem.conversions) {
                const currentConversion = window.unitsSystem.conversions.threeUnitsToCm;
                console.log(`Current system setting: 1 unit = ${currentConversion} cm`);
                console.log('Applying current system to our measurements:');
                console.log(`  X span: ${(xSpan * currentConversion).toFixed(1)} cm`);
                console.log(`  Y span: ${(ySpan * currentConversion).toFixed(1)} cm`);
                console.log(`  Z span: ${(zSpan * currentConversion).toFixed(1)} cm`);
                
                currentXSizeCm = xSpan * currentConversion;
                deviationFromExpected = Math.abs(currentXSizeCm - 120);
                
                console.log(`\n🎯 ACCURACY ASSESSMENT:`);
                console.log(`Expected pallet length: 120cm (industry standard)`);
                console.log(`Current calculation: ${currentXSizeCm.toFixed(1)}cm`);
                console.log(`Deviation from expected: ${deviationFromExpected.toFixed(1)}cm`);
                
                if (deviationFromExpected < 5) {
                    console.log('✅ VERDICT: Scale appears CORRECT (within 5cm tolerance)');
                    console.log('The current unit system is working as expected.');
                } else {
                    console.log('❌ VERDICT: Scale appears INCORRECT (deviation > 5cm)');
                    console.log('The current unit system may need calibration.');
                    if (currentXSizeCm > 0) {
                        const correctionFactor = 120 / currentXSizeCm;
                        console.log(`🔧 Suggested correction factor: ${correctionFactor.toFixed(3)}`);
                        if (window.unitsSystem.BASE_UNIT_MM) {
                            console.log(`This means changing BASE_UNIT_MM from ${window.unitsSystem.BASE_UNIT_MM} to ${(window.unitsSystem.BASE_UNIT_MM * correctionFactor).toFixed(0)}`);
                        }
                    }
                }
            } else {
                console.log('❌ Units system not available for comparison');
                console.log('window.unitsSystem:', typeof window.unitsSystem);
            }
            
            // CONCLUSÃO
            console.log('\n================================');
            console.log('🏁 INVESTIGATION COMPLETE');
            console.log('📊 SUMMARY OF FINDINGS:');
            console.log(`   • Analyzed ${validBoxCount} valid boxes out of ${boxes.length} total`);
            console.log(`   • Measured scene dimensions: ${xSpan.toFixed(1)} × ${ySpan.toFixed(1)} × ${zSpan.toFixed(1)} units`);
            console.log(`   • Current scale accuracy: ${deviationFromExpected < 5 ? 'GOOD' : 'NEEDS ATTENTION'}`);
            console.log('================================');
            
            return {
                timestamp: new Date().toISOString(),
                success: true,
                validBoxCount: validBoxCount,
                totalBoxCount: boxes.length,
                spatialAnalysis: {
                    xSpan: xSpan,
                    ySpan: ySpan,
                    zSpan: zSpan
                },
                systemValidation: {
                    currentConversionFactor: window.unitsSystem?.conversions?.threeUnitsToCm || 'not available',
                    calculatedLengthCm: currentXSizeCm,
                    deviationCm: deviationFromExpected,
                    accuracyAssessment: deviationFromExpected < 5 ? 'correct' : 'incorrect'
                }
            };
            
        } catch (error) {
            console.log('');
            console.log('💥 CRITICAL ERROR CAUGHT:');
            console.log('Error message:', error.message);
            console.log('Error stack:', error.stack);
            console.log('');
            console.log('This error information will help identify the root cause.');
            
            return {
                timestamp: new Date().toISOString(),
                success: false,
                error: error.message,
                errorStack: error.stack
            };
        }
    }

    /**
     * Update the center of mass deviation display in the UI
     */
    setCenterOfMassUI(deviationText) {
        const centerMassElement = document.getElementById('center-mass');
        if (centerMassElement) {
            centerMassElement.textContent = deviationText;
        }
    }

    /**
     * Provide visual feedback based on center of mass stability
     */
    updateCenterOfMassVisualFeedback(result) {
        const centerMassElement = document.getElementById('center-mass');
        if (!centerMassElement) return;
        
        switch (result.stabilityRating) {
            case 'Excellent':
                centerMassElement.style.color = '#27ae60';
                centerMassElement.title = 'Excellent stability';
                break;
            case 'Good':
                centerMassElement.style.color = '#3498db';
                centerMassElement.title = 'Good stability';
                break;
            case 'Fair':
                centerMassElement.style.color = '#f39c12';
                centerMassElement.title = 'Fair stability';
                break;
            case 'Poor':
                centerMassElement.style.color = '#e74c3c';
                centerMassElement.title = 'Poor stability';
                break;
            default:
                centerMassElement.style.color = '#95a5a6';
        }
    }


        /**
     * Update bottom metrics display in the UI
     */
    updateBottomMetricsDisplay() {
        const formatted = this.bottomMetricsCalculator.getFormattedMetrics();
        
        // Update LSI (replaces Collisions)
        const lsiElement = document.getElementById('collisions');
        if (lsiElement) {
            lsiElement.textContent = formatted.lsi.display;
            lsiElement.style.color = formatted.lsi.color;
            lsiElement.title = `Load Stabilitfy: ${formatted.lsi.rating}`;
        }
        
        // Update Box Density (replaces Global Efficiency)  
        const densityElement = document.getElementById('global-efficiency');
        if (densityElement) {
            densityElement.textContent = formatted.boxDensity.display;
            densityElement.style.color = formatted.boxDensity.color;
            densityElement.title = `Density Efficiency: ${formatted.boxDensity.rating}`;
        }
    }

        /**
     * Show welcome message for Crosslog data integration
     */
    showWelcomeMessage() {
        debugLog('INITIALIZATION', '=== Enhanced Palletization Simulator Ready ===');
        debugLog('INITIALIZATION', '✓ 3D visualization initialized with improved lighting and camera controls');
        debugLog('INITIALIZATION', '✓ Crosslog data parser ready');
        debugLog('INITIALIZATION', '✓ Three-zone control interface activated');
        debugLog('INITIALIZATION', '✓ Real-time box counting and animation control enabled');
        debugLog('INITIALIZATION', '✓ Dynamic height calculation and simulation timer integrated');
        debugLog('INITIALIZATION', '');
        debugLog('INITIALIZATION', 'Advanced Features Available:');
        debugLog('INITIALIZATION', '  - Play/pause animation control with timer integration');
        debugLog('INITIALIZATION', '  - Step-by-step box placement and removal');
        debugLog('INITIALIZATION', '  - Real-time progress tracking and height calculation');
        debugLog('INITIALIZATION', '  - Enhanced camera zoom for tall pallets');
        debugLog('INITIALIZATION', '  - Improved lighting for better visibility');
        debugLog('INITIALIZATION', '  - Sequence-based consistency for manual/automatic modes');
        debugLog('INITIALIZATION', '');
        debugLog('INITIALIZATION', 'System ready for professional palletization analysis!');
    }
}


// Wait for page to be ready, then initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM loaded, creating application...');
        window.palletApp = new PalletizationApp();
    });
} else {
    console.log('DOM already loaded, creating application immediately...');
    window.palletApp = new PalletizationApp();
}

// Clean up when the page is closed
window.addEventListener('beforeunload', () => {
    console.log('Page is closing, cleaning up...');
    if (window.palletApp) {
        window.palletApp.dispose();
    }
});