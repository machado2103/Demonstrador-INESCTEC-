/**
 * Main Application Controller
 * Coordinates 3D visualization, data loading, and user interface for pallet simulation
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
            isCompleted: false
        };
        
        // Sequence tracking for manual/automatic consistency
        this.sequenceState = {
            lastPlacedSequence: -1,
            nextExpectedSequence: 0,
            isConsistent: true
        };
        
        // Dynamic metrics tracking system
        this.metricsState = {
            palletTopY: 0.61,
            boxFloorOffset: 0.72,
            currentMaxHeight: 0,
            
            simulationTimer: {
                startTime: null,
                elapsedTime: 0,
                isRunning: false,
                pausedTime: 0,
                displayInterval: null
            }
        };
        
        // Center of Mass calculation system
        this.centerOfMassCalculator = new CenterOfMassCalculator();
        this.centerOfMassState = {
            isEnabled: true,
            updateFrequency: 300,
            lastCalculation: null,
            calculationHistory: []
        };

        // Volume efficiency calculation system
        this.volumeEfficiencyCalculator = new VolumeEfficiencyCalculator();

        // Bottom metrics calculation system  
        this.bottomMetricsCalculator = new BottomMetricsCalculator();

        // Weight distribution calculation system
        this.weightDistributionCalculator = new WeightDistributionCalculator();
        this.weightDistributionState = {
            isEnabled: true,
            updateFrequency: 200,
            lastCalculation: null
        };
        
        this.init();
    }
    
    /**
     * Initialize the complete application
     */
    async init() {
        try {
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }
            
            await this.waitForThreeJS();
            
            this.initializeSimulator();
            this.initializeDataLoader();
            this.setupUI();
            
            await this.loadDefaultCrosslogData();
            
            this.isInitialized = true;
            
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.showError('Failed to initialize the 3D visualization. Please refresh the page and try again.');
        }
    }
    
    /**
     * Wait for Three.js libraries to be available
     */
    async waitForThreeJS() {
        let attempts = 0;
        const maxAttempts = 50;
        
        while (attempts < maxAttempts) {
            if (typeof THREE !== 'undefined' && typeof THREE.OrbitControls !== 'undefined') {
                return;
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        throw new Error('Three.js libraries failed to load within the expected time');
    }
    
    /**
     * Initialize 3D simulator
     */
    initializeSimulator() {
        this.simulator = new PalletSimulator('threejs-container');

        // Initialize volume efficiency pie chart
        setTimeout(() => {
            this.volumeEfficiencyCalculator.initializePieChart();
        }, 500);
        
        // Initialize center of mass beam visualization
        this.simulator.createCenterOfMassBeam();
        
        // Remove loading message
        const loadingMessage = document.querySelector('.threejs-loading');
        if (loadingMessage) {
            loadingMessage.style.display = 'none';
        }
    }
    
    /**
     * Initialize data loading system
     */
    initializeDataLoader() {
        this.dataLoader = new PalletDataLoader(this.simulator);
    }
    
    /**
     * Set up user interface controls
     */
    setupUI() {
        this.createNavigationControls();
        this.setupInfoDisplays();
    }
    
    /**
     * Load default Crosslog data automatically
     */
    async loadDefaultCrosslogData() {
        try {
            const response = await fetch('3d-viewer/data/simulation.txt');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const fileContent = await response.text();
            
            if (!fileContent || fileContent.trim().length === 0) {
                throw new Error('Simulation file is empty or contains no valid data');
            }
            
            const success = this.loadCrosslogData(fileContent, 'simulation.txt');
            
            if (success) {
                this.showMessage('Simulation data loaded successfully');
            } else {
                throw new Error('Failed to parse the Crosslog data in simulation.txt');
            }
            
        } catch (error) {
            this.showMessage('No default data found - application ready for manual data loading');
        }
    }
    
    /**
     * Create navigation controls with three-zone layout
     */
    createNavigationControls() {
        const visualizationArea = document.querySelector('.visualization-area');
        if (!visualizationArea) {
            setTimeout(() => {
                this.createNavigationControls();
            }, 500);
            return;
        }
        
        // Create the controls container
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
        
        // Top row titles
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
        
        // Bottom row controls
        const leftButtons = document.createElement('div');
        leftButtons.style.cssText = `
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 12px;
            grid-column: 1;
            grid-row: 2;
            width: 100%;
        `;
        
        // Create pallet control buttons
        const restartButton = this.createControlButton('', () => {
            this.restartCurrentPallet();
        }, 'small', 'restart', true);
        restartButton.id = 'restart-pallet-btn';
        restartButton.disabled = true;
        restartButton.title = 'Restart current pallet animation';
        
        const prevPalletButton = this.createControlButton('Prev.', () => {
            if (this.dataLoader) {
                this.dataLoader.previousPallet();
                this.resetAnimationState();
                this.resetSimulationTimer();
            }
        }, 'small', 'arrowLeft');
        prevPalletButton.id = 'prev-pallet-btn';
        prevPalletButton.disabled = true;
        prevPalletButton.title = 'Previous pallet solution';

        const nextPalletButton = this.createControlButton('Next', () => {
            if (this.dataLoader) {
                this.dataLoader.nextPallet();
                this.resetAnimationState();
                this.resetSimulationTimer();
            }
        }, 'small', 'arrowRight');
        nextPalletButton.id = 'next-pallet-btn';
        nextPalletButton.disabled = true;
        nextPalletButton.title = 'Next pallet solution';

        const finishedButton = this.createControlButton('', () => {
            this.finishCurrentPallet();
        }, 'small', 'skipForward');
        finishedButton.id = 'finished-pallet-btn';
        finishedButton.disabled = true;
        finishedButton.title = 'Fast Forward';
        
        leftButtons.appendChild(restartButton);
        leftButtons.appendChild(prevPalletButton);
        leftButtons.appendChild(nextPalletButton);
        leftButtons.appendChild(finishedButton);
        
        // Center box counter
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
        
        // Right animation controls
        const rightButtons = document.createElement('div');
        rightButtons.style.cssText = `
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 12px;
            grid-column: 3;
            grid-row: 2;
            width: 100%;
        `;
        
        const stepBackButton = this.createControlButton('', () => {
            this.stepBackwardOneBox();
        }, 'small', 'stepBack', true);
        stepBackButton.id = 'step-back-btn';
        stepBackButton.disabled = true;
        stepBackButton.title = 'Remove one box';

        const playPauseButton = this.createControlButton('', () => {
            this.togglePlayPause();
        }, 'medium', 'play', true);
        playPauseButton.id = 'play-pause-btn';
        playPauseButton.disabled = true;
        playPauseButton.title = 'Play or pause animation';

        const stepForwardButton = this.createControlButton('', () => {
            this.stepForwardOneBox();
        }, 'small', 'stepForward', true);
        stepForwardButton.id = 'step-forward-btn';
        stepForwardButton.disabled = true;
        stepForwardButton.title = 'Add one box';
        
        rightButtons.appendChild(stepBackButton);
        rightButtons.appendChild(playPauseButton);
        rightButtons.appendChild(stepForwardButton);
        
        // Assemble the grid layout
        controlsContainer.appendChild(leftTitle);
        controlsContainer.appendChild(palletCounter);
        controlsContainer.appendChild(rightTitle);
        controlsContainer.appendChild(leftButtons);
        controlsContainer.appendChild(boxCounter);
        controlsContainer.appendChild(rightButtons);
    }
    
    /**
     * Create styled control button
     */
    createControlButton(text, onClick, size = 'medium', iconName = null, iconOnly = false) {
        const button = document.createElement('button');
        
        button.className = 'control-button';
        if (iconOnly) {
            button.classList.add('icon-only');
        } else if (iconName) {
            button.classList.add('with-icon');
        }
        button.classList.add(size);
        
        // Define size-specific styles
        const sizeStyles = {
            small: 'padding: 6px 12px; font-size: 0.8rem;',
            medium: 'padding: 8px 16px; font-size: 0.9rem;',
            large: 'padding: 10px 20px; font-size: 1rem;'
        };
        
        if (iconOnly) {
            const iconOnlyStyles = {
                small: 'padding: 6px; min-width: 32px;',
                medium: 'padding: 8px; min-width: 36px;',
                large: 'padding: 10px; min-width: 40px;'
            };
            sizeStyles[size] = iconOnlyStyles[size];
        }
        
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
            display: flex;
            align-items: center;
            justify-content: center;
            gap: ${iconOnly ? '0' : '6px'};
        `;
        
        // Create button content
        let buttonContent = '';
        
        if (iconName && window.iconLibrary) {
            const iconSize = size === 'large' ? 'large' : size === 'small' ? 'small' : 'medium';
            buttonContent += window.iconLibrary.createButtonIcon(iconName, iconSize);
        }
        
        if (!iconOnly && text) {
            buttonContent += `<span>${text}</span>`;
        }
        
        if (!buttonContent) {
            buttonContent = text;
        }
        
        button.innerHTML = buttonContent;
        
        // Add hover effects
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
     * Calculate current height in centimeters
     */
    calculateCurrentHeight() {
        if (!window.unitsSystem) {
            console.error('Units system not available for height calculation');
            return 0;
        }
        
        const result = window.unitsSystem.calculateDisplayHeight(
            this.simulator ? this.simulator.boxes : [],
            this.metricsState.palletTopY,
            this.metricsState.boxFloorOffset
        );
        
        this.metricsState.currentMaxHeight = result.cm;
        return result.cm;
    }
    
    /**
     * Start the simulation timer
     */
    startSimulationTimer() {
        const timer = this.metricsState.simulationTimer;
        
        if (!timer.isRunning && !this.animationState.isCompleted) {
            timer.startTime = Date.now();
            timer.isRunning = true;
            
            timer.displayInterval = setInterval(() => {
                this.updateTimeDisplay();
            }, 100);
        }
    }
    
    /**
     * Stop or pause the simulation timer
     */
    stopSimulationTimer() {
        const timer = this.metricsState.simulationTimer;
        
        if (timer.isRunning) {
            const sessionTime = Date.now() - timer.startTime;
            timer.pausedTime += sessionTime;
            
            timer.isRunning = false;
            timer.startTime = null;
            
            if (timer.displayInterval) {
                clearInterval(timer.displayInterval);
                timer.displayInterval = null;
            }
        }
    }
    
    /**
     * Reset the simulation timer to zero
     */
    resetSimulationTimer() {
        const timer = this.metricsState.simulationTimer;
        
        this.stopSimulationTimer();
        
        timer.elapsedTime = 0;
        timer.pausedTime = 0;
        timer.startTime = null;
        timer.isRunning = false;
        
        this.animationState.isCompleted = false;
        
        this.updateTimeDisplay();
    }
    
    /**
     * Get total elapsed simulation time in milliseconds
     */
    getTotalElapsedTime() {
        const timer = this.metricsState.simulationTimer;
        
        let totalTime = timer.pausedTime;
        
        if (timer.isRunning && timer.startTime) {
            totalTime += (Date.now() - timer.startTime);
        }
        
        return totalTime;
    }
    
    /**
     * Update the time display in the UI
     */
    updateTimeDisplay() {
        const timeElement = document.getElementById('simulation-time');
        if (!timeElement) return;
        
        const totalMs = this.getTotalElapsedTime();
        const seconds = totalMs / 1000;
        
        let displayText;
        if (seconds < 60) {
            displayText = `${seconds.toFixed(1)}s`;
        } else {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            displayText = `${minutes}:${remainingSeconds.toFixed(1).padStart(4, '0')}`;
        }
        
        timeElement.textContent = displayText;
        
        if (this.animationState.isCompleted) {
            timeElement.style.color = '#27ae60';
        } else {
            timeElement.style.color = '#3498db';
        }
    }
    
    /**
     * Update the height display in the UI
     */
    updateHeightDisplay() {
        const heightElement = document.getElementById('current-height');
        if (!heightElement) return;
        
        const currentHeightCm = this.calculateCurrentHeight();
        
        let displayText;
        if (currentHeightCm >= 100) {
            const heightInMeters = currentHeightCm / 100;
            displayText = `${heightInMeters.toFixed(2)}m`;
        } else {
            displayText = `${currentHeightCm.toFixed(1)}cm`;
        }
        
        heightElement.textContent = displayText;
        
        if (this.animationState.isCompleted) {
            heightElement.style.color = '#27ae60';
        } else {
            heightElement.style.color = '#3498db';
        }
    }
    
    /**
     * Toggle between play and pause states
     */
    togglePlayPause() {
        const button = document.getElementById('play-pause-btn');
        if (!button || !this.dataLoader) return;
        
        if (this.animationState.isPlaying) {
            this.dataLoader.animationTimeouts.forEach(timeoutId => {
                clearTimeout(timeoutId);
            });
            this.dataLoader.animationTimeouts = [];
            
            this.animationState.isPlaying = false;
            this.animationState.isPaused = true;
            button.textContent = '▶ Play';
            button.title = 'Resume animation';
            
            this.stopSimulationTimer();
        } else {
            if (this.animationState.isPaused) {
                this.resumeAnimation();
            } else {
                this.restartCurrentPallet();
            }
            
            this.animationState.isPlaying = true;
            this.animationState.isPaused = false;
            button.textContent = '⏸ Pause';
            button.title = 'Pause animation';
            
            this.startSimulationTimer();
        }
        
        this.updateButtonStates();
    }
    
    /**
     * Step backward by removing one box
     */
    stepBackwardOneBox() {
        if (!this.simulator || this.simulator.boxes.length === 0) {
            return;
        }
        
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
            this.simulator.scene.remove(lastBox);
            this.simulator.boxes.splice(maxSequenceIndex, 1);
            
            if (lastBox.geometry) lastBox.geometry.dispose();
            if (lastBox.material) lastBox.material.dispose();
            
            this.sequenceState.lastPlacedSequence = this.findCurrentMaxSequence();
            this.sequenceState.nextExpectedSequence = maxSequence;
        }
        
        this.animationState.isCompleted = false;
        this.updateHeightDisplay();
        this.animationState.currentBoxIndex = this.simulator.boxes.length;
        this.updateBoxCounter();
        this.updateButtonStates();
    }
    
    /**
     * Step forward by adding one box
     */
    stepForwardOneBox() {
        if (!this.dataLoader || this.dataLoader.allPallets.length === 0) {
            return;
        }
        
        const currentPallet = this.dataLoader.allPallets[this.dataLoader.currentPalletIndex];
        const sortedBoxes = [...currentPallet.boxes].sort((a, b) => a.sequence - b.sequence);
        
        const nextBoxIndex = this.findNextBoxToPlace(sortedBoxes);
        
        if (nextBoxIndex === -1) {
            return;
        }
        
        const nextBox = sortedBoxes[nextBoxIndex];
        
        this.dataLoader.createAndAddBox(nextBox);
        
        this.sequenceState.lastPlacedSequence = nextBox.sequence;
        this.sequenceState.nextExpectedSequence = this.findNextExpectedSequence(sortedBoxes, nextBox.sequence);
        
        if (this.simulator.boxes.length === sortedBoxes.length) {
            this.setAnimationCompleted();
        }
        
        this.updateHeightDisplay();
        this.animationState.currentBoxIndex = this.simulator.boxes.length;
        this.updateBoxCounter();
        this.updateButtonStates();
    }

    /**
     * Set animation as completed and update UI
     */
    setAnimationCompleted() {
        this.animationState.isCompleted = true;
        this.animationState.isPlaying = false;
        this.animationState.isPaused = false;
        
        this.stopSimulationTimer();
        
        const button = document.getElementById('play-pause-btn');
        if (button) {
            button.textContent = '▶ Play';
            button.title = 'Restart animation';
        }
        
        this.updateTimeDisplay();
        this.updateHeightDisplay();
        this.updateButtonStates();
    }
    
    /**
     * Update boxes placed display
     */
    updateBoxesPlacedDisplay() {
        const boxesElement = document.getElementById('boxes-count');
        if (!boxesElement) return;
        
        const currentBoxCount = this.simulator ? this.simulator.boxes.length : 0;
        boxesElement.textContent = currentBoxCount.toString();
        
        if (this.dataLoader && this.dataLoader.allPallets.length > 0) {
            const totalBoxes = this.dataLoader.allPallets[this.dataLoader.currentPalletIndex].boxes.length;
            const progressPercentage = (currentBoxCount / totalBoxes) * 100;
            
            if (progressPercentage === 100) {
                boxesElement.style.color = '#27ae60';
            } else {
                boxesElement.style.color = '#3498db';
            }
        }
    }
    
    /**
     * Find the next box that should be placed
     */
    findNextBoxToPlace(sortedBoxes) {
        const placedSequences = new Set(
            this.simulator.boxes.map(box => box.userData.sequence)
        );
        
        for (let i = 0; i < sortedBoxes.length; i++) {
            const sequence = sortedBoxes[i].sequence;
            if (!placedSequences.has(sequence)) {
                return i;
            }
        }
        
        return -1;
    }
    
    /**
     * Calculate next expected sequence
     */
    findNextExpectedSequence(sortedBoxes, currentSequence) {
        const currentIndex = sortedBoxes.findIndex(box => box.sequence === currentSequence);
        if (currentIndex === -1 || currentIndex === sortedBoxes.length - 1) {
            return -1;
        }
        return sortedBoxes[currentIndex + 1].sequence;
    }
    
    /**
     * Find current maximum sequence in scene
     */
    findCurrentMaxSequence() {
        if (this.simulator.boxes.length === 0) return -1;
        
        return Math.max(...this.simulator.boxes.map(box => box.userData.sequence));
    }
    
    /**
     * Resume animation from current position
     */
    resumeAnimation() {
        if (!this.dataLoader || this.dataLoader.allPallets.length === 0) return;
        
        const currentPallet = this.dataLoader.allPallets[this.dataLoader.currentPalletIndex];
        const currentBoxCount = this.simulator.boxes.length;
        const sortedBoxes = [...currentPallet.boxes].sort((a, b) => a.sequence - b.sequence);
        
        for (let i = currentBoxCount; i < sortedBoxes.length; i++) {
            const delay = (i - currentBoxCount) * this.dataLoader.animationSpeed;
            
            const timeoutId = setTimeout(() => {
                this.dataLoader.createAndAddBox(sortedBoxes[i]);
                this.animationState.currentBoxIndex = i + 1;
                this.updateBoxCounter();
                
                if (i === sortedBoxes.length - 1) {
                    this.setAnimationCompleted();
                }
            }, delay);
            
            this.dataLoader.animationTimeouts.push(timeoutId);
        }
    }
    
    /**
     * Reset animation state
     */
    resetAnimationState() {
        this.animationState.isPlaying = false;
        this.animationState.isPaused = false;
        this.animationState.currentBoxIndex = 0;
        this.animationState.isCompleted = false;
        
        this.sequenceState.lastPlacedSequence = -1;
        this.sequenceState.nextExpectedSequence = 0;
        this.sequenceState.isConsistent = true;
        
        this.metricsState.currentMaxHeight = 0;
        this.updateHeightDisplay();
        
        this.centerOfMassState.lastCalculation = null;
        this.updateCenterOfMassDisplay();
        
        const button = document.getElementById('play-pause-btn');
        if (button) {
            button.textContent = '▶ Play';
            button.title = 'Start animation';
        }

        this.bottomMetricsCalculator.reset();
        
        this.updateButtonStates();
    }
    
    /**
     * Update all button states based on current conditions
     */
    updateButtonStates() {
        const prevBtn = document.getElementById('prev-pallet-btn');
        const nextBtn = document.getElementById('next-pallet-btn');
        const restartBtn = document.getElementById('restart-pallet-btn');
        const finishedBtn = document.getElementById('finished-pallet-btn');
        const stepBackBtn = document.getElementById('step-back-btn');
        const stepForwardBtn = document.getElementById('step-forward-btn');
        const playPauseBtn = document.getElementById('play-pause-btn');
        
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
            prevBtn.disabled = currentIndex <= 0;
            nextBtn.disabled = currentIndex >= totalPallets - 1;
            
            restartBtn.disabled = false;
            finishedBtn.disabled = false;
            
            playPauseBtn.disabled = false;
            stepBackBtn.disabled = currentBoxes <= 0;
            stepForwardBtn.disabled = currentBoxes >= totalBoxes;
            
        } else {
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
     * Update box counter display
     */
    updateBoxCounter() {
        const boxCounter = document.getElementById('box-counter');
        if (boxCounter && this.dataLoader) {
            const currentBoxes = this.simulator.boxes.length;
            const totalBoxes = this.dataLoader.allPallets.length > 0 ? 
                this.dataLoader.allPallets[this.dataLoader.currentPalletIndex].boxes.length : 0;
            
            boxCounter.textContent = `Box ${currentBoxes} of ${totalBoxes}`;
            
            this.animationState.currentBoxIndex = currentBoxes;
            this.animationState.totalBoxes = totalBoxes;
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
     * Setup automatic information display updates
     */
    setupInfoDisplays() {
        setInterval(() => {
            if (this.dataLoader && this.dataLoader.allPallets.length > 0) {
                this.updateButtonStates();
                this.updatePalletCounter();
                this.updateBoxCounter();
                this.updateHeightDisplay();
                this.updateBoxesPlacedDisplay();
                this.updateCenterOfMassDisplay();

                // Update volume efficiency in real-time
                const currentHeightCm = this.calculateCurrentHeight();
                this.volumeEfficiencyCalculator.updateEfficiency(this.simulator.boxes, currentHeightCm);

                // Update bottom metrics
                const centerOfMassResult = this.centerOfMassState.lastCalculation;
                this.bottomMetricsCalculator.calculateBottomMetrics(this.simulator.boxes, centerOfMassResult);
                this.updateBottomMetricsDisplay();

                this.updateWeightDistribution();
            }
        }, 200);
    }
    
    /**
     * Restart current pallet animation from beginning
     */
    restartCurrentPallet() {
        if (!this.dataLoader || this.dataLoader.allPallets.length === 0) {
            return;
        }
        
        this.dataLoader.clearCurrentBoxes();
        this.resetAnimationState();
        this.resetSimulationTimer();

        this.volumeEfficiencyCalculator.reset();
        this.bottomMetricsCalculator.reset();
        
        this.showMessage('Restarting pallet animation...');
        
        const currentIndex = this.dataLoader.currentPalletIndex;
        this.dataLoader.loadPallet(currentIndex);
        
        this.startSimulationTimer();
    }
    
    /**
     * Finish current pallet animation quickly
     */
    finishCurrentPallet() {
        if (!this.dataLoader || this.dataLoader.allPallets.length === 0) {
            return;
        }
        
        const currentPallet = this.dataLoader.allPallets[this.dataLoader.currentPalletIndex];
        const currentBoxCount = this.simulator.boxes.length;
        const totalBoxCount = currentPallet.boxes.length;
        
        if (currentBoxCount >= totalBoxCount) {
            this.showMessage('Pallet already complete');
            return;
        }
        
        this.showMessage('Completing pallet instantly...');
        
        const originalSpeed = this.dataLoader.animationSpeed;
        this.dataLoader.animationSpeed = 10;
        
        this.dataLoader.clearCurrentBoxes();
        this.resetAnimationState();
        this.dataLoader.loadPallet(this.dataLoader.currentPalletIndex);
        
        const remainingBoxes = totalBoxCount;
        const completionTime = remainingBoxes * 10 + 500;
        
        setTimeout(() => {
            this.dataLoader.animationSpeed = originalSpeed;
            this.showMessage(`Pallet completed with ${totalBoxCount} boxes`);
            this.setAnimationCompleted();
        }, completionTime);
    }

    /**
     * Get height information in both units
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
     * Get comprehensive box statistics
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
     * Load Crosslog formatted data
     */
    loadCrosslogData(crosslogContent, fileName = 'Crosslog Data') {
        try {
            const parsedData = this.dataLoader.parseDataFile(crosslogContent);
            this.currentDataFile = parsedData;
            
            if (parsedData.pallets.length > 0) {
                this.dataLoader.loadPallet(0);
                this.startSimulationTimer();
                this.updateButtonStates();
                this.showMessage(`Loaded ${parsedData.pallets.length} pallets from Crosslog data`);
                
                return true;
            } else {
                this.showError('No valid pallet data found in the Crosslog file');
                return false;
            }
            
        } catch (error) {
            console.error('Error loading Crosslog data:', error);
            this.showError('Failed to parse the Crosslog data. Please check the file format.');
            return false;
        }
    }
    
    /**
     * Show message to user
     */
    showMessage(message) {
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
     * Show error message to user
     */
    showError(message) {
        console.error('Error:', message);
        alert('Error: ' + message);
    }
    
    /**
     * Clean up resources when application is closed
     */
    dispose() {
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

        if (this.weightDistributionCalculator) {
            this.weightDistributionCalculator.dispose();
        }
    }

    /**
     * Calculate center of mass and update UI display
     */
    updateCenterOfMassDisplay() {
        if (!this.simulator || !this.simulator.boxes || 
            this.simulator.boxes.length === 0 || 
            !this.centerOfMassState.isEnabled) {
            
            this.setCenterOfMassUI('0.0cm');
            
            if (this.simulator && this.simulator.hideCenterOfMassBeam) {
                this.simulator.hideCenterOfMassBeam();
            }
            
            return;
        }
        
        try {
            const result = this.centerOfMassCalculator.calculateCenterOfMass(this.simulator.boxes);
            
            this.centerOfMassState.lastCalculation = result;
            
            const formattedDeviation = this.centerOfMassCalculator.getFormattedDeviation();
            this.setCenterOfMassUI(formattedDeviation);
            
            this.updateCenterOfMassVisualFeedback(result);
            
            if (this.simulator && this.simulator.updateCenterOfMassBeamPosition) {
                this.simulator.updateCenterOfMassBeamPosition({
                    x: result.x,
                    z: result.z
                });
                
                if (this.simulator.updateCenterOfMassCrossHeight) {
                    this.simulator.updateCenterOfMassCrossHeight(this.simulator.boxes);
                }
            }
            
            if (result.deviationCm > 20) {
                console.warn(`High center of mass deviation detected: ${formattedDeviation}`);
            }
            
        } catch (error) {
            console.error('Error calculating center of mass:', error);
            this.setCenterOfMassUI('Error');
            
            if (this.simulator && this.simulator.hideCenterOfMassBeam) {
                this.simulator.hideCenterOfMassBeam();
            }
        }
    }

    /**
     * Get detailed center of mass analysis
     */
    getCenterOfMassAnalysis() {
        if (!this.centerOfMassState.lastCalculation) {
            return null;
        }
        
        return this.centerOfMassCalculator.getAnalysisReport();
    }

    /**
     * Debug center of mass calculation
     */
    debugCenterOfMass() {
        if (!this.simulator || this.simulator.boxes.length === 0) {
            return;
        }
        
        this.centerOfMassCalculator.setDebugMode(true);
        
        const result = this.centerOfMassCalculator.calculateCenterOfMass(this.simulator.boxes);
        
        this.centerOfMassCalculator.visualizeInConsole();
        
        this.simulator.boxes.forEach((box, index) => {
            const weight = box.userData.weight || 0;
            const pos = box.position;
            console.log(`Box ${index}: pos(${pos.x.toFixed(2)}, ${pos.z.toFixed(2)}), weight=${weight}kg`);
        });
        
        this.centerOfMassCalculator.setDebugMode(false);
        
        return result;
    }

    /**
     * Reverse engineering analysis of coordinate system scaling
     */
    debugReverseEngineering() {
        try {
            if (!this.dataLoader) {
                return { error: 'DataLoader not initialized', timestamp: new Date().toISOString() };
            }
            
            if (!this.simulator) {
                return { error: 'Simulator not initialized', timestamp: new Date().toISOString() };
            }
            
            if (!this.dataLoader.allPallets || this.dataLoader.allPallets.length === 0) {
                return { error: 'No pallet data available', timestamp: new Date().toISOString() };
            }
            
            if (!this.simulator.boxes || this.simulator.boxes.length === 0) {
                return { error: 'No boxes available for analysis', timestamp: new Date().toISOString() };
            }
            
            const boxes = this.simulator.boxes;
            
            let minX = Infinity, maxX = -Infinity;
            let minY = Infinity, maxY = -Infinity; 
            let minZ = Infinity, maxZ = -Infinity;
            
            let validBoxCount = 0;
            boxes.forEach((box) => {
                try {
                    if (!box || !box.position || !box.geometry || !box.geometry.parameters) {
                        return;
                    }
                    
                    const pos = box.position;
                    const geom = box.geometry.parameters;
                    
                    if (typeof pos.x !== 'number' || typeof pos.y !== 'number' || typeof pos.z !== 'number' ||
                        typeof geom.width !== 'number' || typeof geom.height !== 'number' || typeof geom.depth !== 'number') {
                        return;
                    }
                    
                    const leftX = pos.x - geom.width/2;
                    const rightX = pos.x + geom.width/2;
                    const bottomY = pos.y - geom.height/2;
                    const topY = pos.y + geom.height/2;
                    const backZ = pos.z - geom.depth/2;
                    const frontZ = pos.z + geom.depth/2;
                    
                    if (leftX < minX) minX = leftX;
                    if (rightX > maxX) maxX = rightX;
                    if (bottomY < minY) minY = bottomY;
                    if (topY > maxY) maxY = topY;
                    if (backZ < minZ) minZ = backZ;
                    if (frontZ > maxZ) maxZ = frontZ;
                    
                    validBoxCount++;
                    
                } catch (error) {
                    // Skip invalid boxes
                }
            });
            
            if (validBoxCount === 0) {
                return { error: 'No valid boxes for spatial analysis', timestamp: new Date().toISOString() };
            }
            
            const xSpan = maxX - minX;
            const ySpan = maxY - minY;
            const zSpan = maxZ - minZ;
            
            let currentXSizeCm = 0;
            let deviationFromExpected = 0;
            
            if (window.unitsSystem && window.unitsSystem.conversions) {
                const currentConversion = window.unitsSystem.conversions.threeUnitsToCm;
                currentXSizeCm = xSpan * currentConversion;
                deviationFromExpected = Math.abs(currentXSizeCm - 120);
            }
            
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
            return {
                timestamp: new Date().toISOString(),
                success: false,
                error: error.message,
                errorStack: error.stack
            };
        }
    }

    /**
     * Update center of mass deviation display in UI
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
     * Update bottom metrics display in UI
     */
    updateBottomMetricsDisplay() {
        const formatted = this.bottomMetricsCalculator.getFormattedMetrics();
        
        // Update LSI (replaces Collisions)
        const lsiElement = document.getElementById('collisions');
        if (lsiElement) {
            lsiElement.textContent = formatted.lsi.display;
            lsiElement.style.color = formatted.lsi.color;
            lsiElement.title = `Load Stability: ${formatted.lsi.rating}`;
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
     * Update weight distribution calculation
     */
    updateWeightDistribution() {
        if (!this.weightDistributionState.isEnabled || 
            !this.simulator || 
            !this.simulator.boxes || 
            this.simulator.boxes.length === 0) {
            
            if (this.weightDistributionCalculator) {
                this.weightDistributionCalculator.calculateWeightDistribution([]);
            }
            return;
        }

        try {
            const distributionResult = this.weightDistributionCalculator.calculateWeightDistribution(this.simulator.boxes);
            
            this.weightDistributionState.lastCalculation = distributionResult;
            
            if (distributionResult && !distributionResult.isBalanced) {
                console.warn('Weight distribution is unbalanced - consider redistributing load');
            }

        } catch (error) {
            console.error('Error calculating weight distribution:', error);
        }
    }
}

// Initialize application when page is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.palletApp = new PalletizationApp();
    });
} else {
    window.palletApp = new PalletizationApp();
}

// Clean up when page is closed
window.addEventListener('beforeunload', () => {
    if (window.palletApp) {
        window.palletApp.dispose();
    }
});