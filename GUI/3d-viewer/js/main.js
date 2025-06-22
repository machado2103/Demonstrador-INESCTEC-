/**
 * Main Application Controller
 * This file orchestrates the entire palletization simulator,
 * connecting the 3D visualization with data loading and user interface
 * 
 * Save this as: GUI/3d-viewer/js/main.js
 */

class PalletizationApp {
    constructor() {
        this.simulator = null;
        this.dataLoader = null;
        this.isInitialized = false;
        this.currentDataFile = null;
        
        console.log('PalletizationApp constructor called');
        this.init();
    }
    
    /**
     * Initialize the complete application
     * This sets up all components and connects them together
     */
    async init() {
        try {
            console.log('Initializing Palletization Application...');
            
            // Wait for DOM to be fully loaded
            if (document.readyState === 'loading') {
                console.log('Waiting for DOM to finish loading...');
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }
            
            // Wait a moment for Three.js libraries to be fully available
            await this.waitForThreeJS();
            
            // Initialize the 3D simulator first
            this.initializeSimulator();
            
            // Initialize the data loader
            this.initializeDataLoader();
            
            // Set up user interface controls
            this.setupUI();
            
            // Show welcome message
            this.showWelcomeMessage();
            
            // Load Crosslog data if available (you can customize this part)
            // this.loadCrosslogData(); // Uncomment when ready to load data
            
            this.isInitialized = true;
            console.log('Palletization Application fully initialized and ready for Crosslog data!');
            
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.showError('Failed to initialize the 3D visualization. Please refresh the page and try again.');
        }
    }
    
    /**
     * Wait for Three.js libraries to be available
     * This ensures we don't try to use Three.js before it's loaded
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
     */
    initializeSimulator() {
        console.log('Creating 3D simulator...');
        
        // Create the simulator instance targeting the correct container
        this.simulator = new PalletSimulator('threejs-container');
        
        // Remove the loading message once 3D scene is ready
        const loadingMessage = document.querySelector('.threejs-loading');
        if (loadingMessage) {
            loadingMessage.style.display = 'none';
            console.log('Removed loading message - 3D scene is now visible');
        }
        
        console.log('3D Simulator initialized successfully');
    }
    
    /**
     * Initialize the data loading system
     */
    initializeDataLoader() {
        console.log('Creating data loader...');
        this.dataLoader = new PalletDataLoader(this.simulator);
        console.log('Data Loader initialized successfully');
    }
    
    /**
     * Set up user interface controls and event handlers
     */
    setupUI() {
        console.log('Setting up user interface controls...');
        
        // Navigation controls for switching between pallets
        this.createNavigationControls();
        
        // Speed controls removed as requested - functionality preserved but not displayed
        // this.createSpeedControls();
        
        // Information display updates
        this.setupInfoDisplays();
        
        console.log('User interface controls set up successfully');
    }
    
    /**
     * Create navigation controls for switching between pallets and controlling simulation
     */
    createNavigationControls() {
        // Create controls container
        const visualizationArea = document.querySelector('.visualization-area');
        if (visualizationArea) {
            const controlsContainer = document.createElement('div');
            controlsContainer.className = 'controls-container';
            controlsContainer.style.cssText = `
                display: flex;
                gap: 10px;
                margin-bottom: 15px;
                justify-content: center;
                flex-wrap: wrap;
                padding: 10px;
                background: rgba(255, 255, 255, 0.9);
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            `;
            
            visualizationArea.insertBefore(controlsContainer, visualizationArea.children[1]);
        }
        
        const controlsContainer = document.querySelector('.controls-container');
        if (!controlsContainer) return;
        
        // Restart button - allows restarting current pallet animation from beginning
        const restartButton = this.createControlButton('🔄 Restart', () => {
            this.restartCurrentPallet();
        });
        restartButton.id = 'restart-pallet-btn';
        restartButton.disabled = true; // Initially disabled until data is loaded
        restartButton.title = 'Restart current pallet animation from the beginning';
        
        // Previous pallet button - renamed to be more specific
        const prevButton = this.createControlButton('◀ Previous Box', () => {
            if (this.dataLoader) {
                this.dataLoader.previousPallet();
            }
        });
        prevButton.id = 'prev-pallet-btn';
        prevButton.disabled = true;
        prevButton.title = 'Go to previous pallet solution';
        
        // Pallet counter display - now shows count without placeholder text
        const palletCounter = document.createElement('span');
        palletCounter.id = 'pallet-counter';
        palletCounter.style.cssText = `
            display: flex;
            align-items: center;
            padding: 8px 16px;
            background: white;
            border-radius: 6px;
            font-weight: bold;
            color: #2c3e50;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            font-size: 0.9rem;
            min-width: 100px;
            justify-content: center;
        `;
        palletCounter.textContent = '0 of 0'; // Clear, informative default instead of "Ready for data"
        
        // Next pallet button - renamed to be more specific
        const nextButton = this.createControlButton('Next Box ▶', () => {
            if (this.dataLoader) {
                this.dataLoader.nextPallet();
            }
        });
        nextButton.id = 'next-pallet-btn';
        nextButton.disabled = true;
        nextButton.title = 'Go to next pallet solution';
        
        // Finished pallet button - completes current pallet quickly
        const finishedButton = this.createControlButton('⚡ Finished Pallet', () => {
            this.finishCurrentPallet();
        });
        finishedButton.id = 'finished-pallet-btn';
        finishedButton.disabled = true; // Initially disabled until animation is running
        finishedButton.title = 'Complete current pallet animation instantly';
        
        // Add all controls to container in the specified order
        // Order: Restart, Previous Box, Counter, Next Box, Finished Pallet
        controlsContainer.appendChild(restartButton);
        controlsContainer.appendChild(prevButton);
        controlsContainer.appendChild(palletCounter);
        controlsContainer.appendChild(nextButton);
        controlsContainer.appendChild(finishedButton);
        
        console.log('Added enhanced navigation controls with restart and finish functionality');
    }
    
    /**
     * Create speed controls for animation timing
     */
    createSpeedControls() {
        const controlsContainer = document.querySelector('.controls-container');
        if (!controlsContainer) return;
        
        // Animation speed slider
        const speedContainer = document.createElement('div');
        speedContainer.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            background: white;
            padding: 8px 12px;
            border-radius: 6px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        `;
        
        const speedLabel = document.createElement('label');
        speedLabel.textContent = '⚡ Speed:';
        speedLabel.style.fontSize = '0.9rem';
        speedLabel.style.fontWeight = 'bold';
        
        const speedSlider = document.createElement('input');
        speedSlider.type = 'range';
        speedSlider.min = '50';
        speedSlider.max = '1000';
        speedSlider.value = '500';
        speedSlider.style.width = '80px';
        speedSlider.title = 'Animation speed: faster ← → slower';
        
        speedSlider.addEventListener('input', (e) => {
            if (this.dataLoader) {
                this.dataLoader.animationSpeed = parseInt(e.target.value);
                console.log('Animation speed changed to:', e.target.value, 'ms');
            }
        });
        
        speedContainer.appendChild(speedLabel);
        speedContainer.appendChild(speedSlider);
        controlsContainer.appendChild(speedContainer);
        
        console.log('Added speed controls');
    }
    
    /**
     * Create a styled button for controls
     */
    createControlButton(text, onClick) {
        const button = document.createElement('button');
        button.textContent = text;
        button.style.cssText = `
            padding: 8px 16px;
            background: linear-gradient(145deg, #3498db, #2980b9);
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
            font-size: 0.9rem;
            transition: all 0.3s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        `;
        
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
     * Set up automatic updates for information displays
     */
    setupInfoDisplays() {
        // Create a periodic update for dynamic information
        setInterval(() => {
            if (this.dataLoader && this.dataLoader.allPallets.length > 0) {
                this.updateNavigationButtons();
                this.updatePalletCounter();
            }
        }, 200);
        
        console.log('Set up automatic UI updates');
    }
    
    /**
     * Update navigation button states with enhanced logic for new controls
     * This function acts like a traffic controller, determining which buttons should be active
     */
    updateNavigationButtons() {
        // Get references to all our control buttons
        const prevBtn = document.getElementById('prev-pallet-btn');
        const nextBtn = document.getElementById('next-pallet-btn');
        const restartBtn = document.getElementById('restart-pallet-btn');
        const finishedBtn = document.getElementById('finished-pallet-btn');
        
        // Only proceed if we have data loaded and buttons exist
        if (!this.dataLoader || !prevBtn || !nextBtn || !restartBtn || !finishedBtn) {
            return;
        }
        
        const hasData = this.dataLoader.allPallets.length > 0;
        const currentIndex = this.dataLoader.currentPalletIndex;
        const totalPallets = this.dataLoader.allPallets.length;
        
        if (hasData) {
            // Navigation buttons logic - enable based on position in sequence
            prevBtn.disabled = currentIndex <= 0; // Can't go before the first pallet
            nextBtn.disabled = currentIndex >= totalPallets - 1; // Can't go after the last pallet
            
            // Restart button logic - enable when there's data to restart
            // This button should always be available when data is loaded
            restartBtn.disabled = false;
            
            // Finished pallet button logic - enable when there might be animation to complete
            // In a more sophisticated implementation, we might check if animation is actually running
            // For now, we enable it whenever data is loaded
            finishedBtn.disabled = false;
            
            console.log('Button states updated - Previous:', !prevBtn.disabled, 
                       'Next:', !nextBtn.disabled, 'Restart: enabled, Finished: enabled');
        } else {
            // No data loaded - disable all buttons except basic navigation structure
            prevBtn.disabled = true;
            nextBtn.disabled = true;
            restartBtn.disabled = true;
            finishedBtn.disabled = true;
            
            console.log('No data loaded - all control buttons disabled');
        }
    }
    
    /**
     * Restart the current pallet animation from the beginning
     * This function demonstrates advanced state management in interactive applications
     */
    restartCurrentPallet() {
        if (!this.dataLoader || this.dataLoader.allPallets.length === 0) {
            console.log('No data available to restart');
            return;
        }
        
        console.log('=== Restarting Current Pallet Animation ===');
        
        // Step 1: Clear any pending animation timeouts to prevent conflicts
        // This is crucial - without this, old and new animations would overlap
        this.dataLoader.clearCurrentBoxes();
        
        // Step 2: Provide visual feedback to user
        this.showMessage('Restarting pallet animation...');
        
        // Step 3: Get current pallet index and reload it
        const currentIndex = this.dataLoader.currentPalletIndex;
        console.log('Restarting pallet', currentIndex + 1, 'of', this.dataLoader.allPallets.length);
        
        // Step 4: Reload the current pallet with fresh animation
        // This creates a clean slate while maintaining the same pallet selection
        this.dataLoader.loadPallet(currentIndex);
        
        // Step 5: Update button states
        this.updateNavigationButtons();
        
        console.log('✓ Pallet restart completed successfully');
    }
    
    /**
     * Finish the current pallet animation quickly
     * This function demonstrates elegant animation acceleration techniques
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
        console.log('Current boxes:', currentBoxCount, '/ Total boxes:', totalBoxCount);
        
        // Step 1: Provide visual feedback
        this.showMessage('Completing pallet instantly...');
        
        // Step 2: Temporarily store original animation speed
        const originalSpeed = this.dataLoader.animationSpeed;
        
        // Step 3: Set ultra-fast animation speed (10ms between boxes)
        this.dataLoader.animationSpeed = 10;
        
        // Step 4: Clear current boxes and restart with fast animation
        // This ensures we get all boxes, not just the remaining ones
        this.dataLoader.clearCurrentBoxes();
        this.dataLoader.loadPallet(this.dataLoader.currentPalletIndex);
        
        // Step 5: Restore original animation speed after a delay
        // Calculate delay: remaining boxes * 10ms + safety buffer
        const remainingBoxes = totalBoxCount;
        const completionTime = remainingBoxes * 10 + 500; // 500ms safety buffer
        
        setTimeout(() => {
            this.dataLoader.animationSpeed = originalSpeed;
            this.showMessage(`Pallet completed with ${totalBoxCount} boxes`);
            console.log('✓ Fast completion finished - animation speed restored');
        }, completionTime);
        
        console.log('✓ Fast completion initiated - will complete in ~' + (completionTime/1000) + ' seconds');
    }
    
    /**
     * Update pallet counter display
     * This function keeps users informed about their current position in the pallet sequence
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
     * Show welcome message for Crosslog data integration
     */
    showWelcomeMessage() {
        console.log('=== Palletization Simulator - Ready for Crosslog Data ===');
        console.log('✓ 3D visualization initialized');
        console.log('✓ Crosslog data parser ready');
        console.log('✓ Realistic pallet visualization loaded');
        console.log('');
        console.log('System ready to process Crosslog format data files');
        console.log('Use navigation controls to explore different pallets when data is loaded');
        console.log('Adjust animation speed as needed using the speed slider');
        console.log('Use mouse to rotate, zoom, and pan the 3D view');
        console.log('');
        console.log('To load Crosslog data: call window.palletApp.loadCrosslogData(textContent)');
    }
    
    /**
     * Load Crosslog formatted data directly
     * This method is specifically designed for Crosslog data format
     * 
     * @param {string} crosslogContent - The complete Crosslog data file content
     * @param {string} fileName - Optional filename for identification
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
                // This is where the interface comes alive with interactive possibilities
                const prevBtn = document.getElementById('prev-pallet-btn');
                const nextBtn = document.getElementById('next-pallet-btn');
                const restartBtn = document.getElementById('restart-pallet-btn');
                const finishedBtn = document.getElementById('finished-pallet-btn');
                
                if (prevBtn && nextBtn && restartBtn && finishedBtn) {
                    // Enable restart and finished buttons immediately - they're always useful with data
                    restartBtn.disabled = false;
                    finishedBtn.disabled = false;
                    
                    // Navigation buttons depend on having multiple pallets
                    prevBtn.disabled = parsedData.pallets.length <= 1;
                    nextBtn.disabled = parsedData.pallets.length <= 1;
                    
                    console.log('✓ All control buttons activated and configured');
                }
                
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
// This creates the global application instance
console.log('Setting up application auto-initialization...');

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