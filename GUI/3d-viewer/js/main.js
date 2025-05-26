/**
 * Main Application Controller
 * This file orchestrates the entire palletization simulator,
 * connecting the 3D visualization with data loading and user interface
 * 
 * Save this as: GUI/3d-viewer/main.js
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
            
            // Inform user about how to load data
            this.showWelcomeMessage();
            
            this.isInitialized = true;
            console.log('Palletization Application fully initialized and ready!');
            
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
        
        // File input for loading data files
        this.createFileInput();
        
        // Navigation controls for switching between pallets
        this.createNavigationControls();
        
        // Simulation speed controls
        this.createSpeedControls();
        
        // Information display updates
        this.setupInfoDisplays();
        
        console.log('User interface controls set up successfully');
    }
    
    /**
     * Create file input control for loading palletization data
     */
    createFileInput() {
        // Create a hidden file input element
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.txt';
        fileInput.style.display = 'none';
        fileInput.id = 'data-file-input';
        document.body.appendChild(fileInput);
        
        // Handle file selection
        fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                console.log('User selected file:', file.name);
                this.loadDataFile(file);
            }
        });
        
        // Create a visible button to trigger file selection
        const loadButton = this.createControlButton('📁 Load Data File', () => {
            console.log('Load button clicked');
            fileInput.click();
        });
        
        // Add the button to the visualization area
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
            
            controlsContainer.appendChild(loadButton);
            visualizationArea.insertBefore(controlsContainer, visualizationArea.children[1]);
            console.log('Added file input controls to visualization area');
        }
    }
    
    /**
     * Create navigation controls for switching between pallets
     */
    createNavigationControls() {
        const controlsContainer = document.querySelector('.controls-container');
        if (!controlsContainer) return;
        
        // Previous pallet button
        const prevButton = this.createControlButton('◀ Previous', () => {
            if (this.dataLoader) {
                this.dataLoader.previousPallet();
            }
        });
        prevButton.id = 'prev-pallet-btn';
        prevButton.disabled = true;
        
        // Pallet counter display
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
        `;
        palletCounter.textContent = 'No data loaded';
        
        // Next pallet button  
        const nextButton = this.createControlButton('Next ▶', () => {
            if (this.dataLoader) {
                this.dataLoader.nextPallet();
            }
        });
        nextButton.id = 'next-pallet-btn';
        nextButton.disabled = true;
        
        // Add all controls to container
        controlsContainer.appendChild(prevButton);
        controlsContainer.appendChild(palletCounter);
        controlsContainer.appendChild(nextButton);
        
        console.log('Added navigation controls');
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
     * Update navigation button states
     */
    updateNavigationButtons() {
        const prevBtn = document.getElementById('prev-pallet-btn');
        const nextBtn = document.getElementById('next-pallet-btn');
        
        if (prevBtn && nextBtn && this.dataLoader) {
            prevBtn.disabled = this.dataLoader.currentPalletIndex <= 0;
            nextBtn.disabled = this.dataLoader.currentPalletIndex >= this.dataLoader.allPallets.length - 1;
        }
    }
    
    /**
     * Update pallet counter display
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
     * Load a data file from user input
     */
    async loadDataFile(file) {
        try {
            console.log('Loading data file:', file.name, '(' + (file.size / 1024).toFixed(1) + ' KB)');
            this.showMessage('Loading palletization data...');
            
            // Read the file content
            const fileContent = await this.readFileAsText(file);
            console.log('File read successfully, content length:', fileContent.length, 'characters');
            
            // Parse the data
            const parsedData = this.dataLoader.parseDataFile(fileContent);
            this.currentDataFile = parsedData;
            
            // Load the first pallet
            if (parsedData.pallets.length > 0) {
                console.log('Starting to load first pallet...');
                this.dataLoader.loadPallet(0);
                this.showMessage(`Successfully loaded ${parsedData.pallets.length} pallets from ${file.name}`);
                
                // Enable navigation controls
                const prevBtn = document.getElementById('prev-pallet-btn');
                const nextBtn = document.getElementById('next-pallet-btn');
                if (prevBtn && nextBtn) {
                    prevBtn.disabled = false;
                    nextBtn.disabled = parsedData.pallets.length <= 1;
                }
                
                console.log('Data loading completed successfully!');
            } else {
                this.showError('No valid pallet data found in the file');
            }
            
        } catch (error) {
            console.error('Error loading data file:', error);
            this.showError('Failed to load the data file. Please check the file format and try again.');
        }
    }
    
    /**
     * Show welcome message with instructions
     */
    showWelcomeMessage() {
        console.log('Welcome to the Palletization Simulator!');
        console.log('To get started:');
        console.log('1. Click the "📁 Load Data File" button');
        console.log('2. Select your palletization data file (.txt format)');
        console.log('3. Use navigation controls to explore different pallets');
        console.log('4. Adjust animation speed as needed');
        console.log('Use mouse to rotate and zoom the 3D view');
    }
    
    /**
     * Utility function to read a file as text
     */
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result);
            reader.onerror = (error) => reject(error);
            reader.readAsText(file);
        });
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