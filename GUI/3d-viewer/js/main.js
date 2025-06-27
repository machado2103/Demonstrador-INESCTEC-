/**
 * Main Application Controller
 * Coordinates 3D visualization, data loading, and user interface for pallet simulation
 */

class PalletizationApp {
    constructor() {
        // Core application components
        this.simulator = null;
        this.dataLoader = null;
        this.fileManager = null; // NOVO: Adicionar FileManager
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
            this.initializeFileManager(); // NOVO: Inicializar FileManager
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
     * Initialize file management system
     * NOVO: Função para inicializar o FileManager
     */
    initializeFileManager() {
        this.fileManager = new FileManager({
            simulator: this.simulator,
            dataLoader: this.dataLoader,
            stopAnimation: () => this.stopAnimation(),
            clearSimulation: () => this.clearSimulation(),
            loadDataFromString: (content) => this.loadDataFromString(content),
            resetControls: () => this.resetControls()
        });
        
        console.log('FileManager initialized successfully');
    }
    
    /**
     * Set up user interface controls
     */
    setupUI() {
        // Aguardar que tanto a visualization quanto a metrics area estejam prontas
        this.waitForUIElements().then(() => {
            this.createNavigationControls();
            this.setupInfoDisplays();
        });
    }

        /**
     * Wait for UI elements to be ready
     */
    async waitForUIElements() {
        return new Promise((resolve) => {
            const checkElements = () => {
                const visualArea = document.querySelector('.visualization-area');
                const metricsArea = document.querySelector('.metrics-area');
                
                if (visualArea && metricsArea) {
                    resolve();
                } else {
                    setTimeout(checkElements, 100);
                }
            };
            checkElements();
        });
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
    // Em vez de procurar na visualization-area, vamos procurar na metrics-area
        const metricsArea = document.querySelector('.metrics-area');
        if (!metricsArea) {
            setTimeout(() => {
                this.createNavigationControls();
            }, 500);
            return;
        }
        
        // Encontrar o container do Layer Efficiency para substituir
        const layerEfficiencyCard = document.querySelector('.metric-card:last-child');
        if (!layerEfficiencyCard) {
            console.warn('Layer efficiency card not found');
            return;
        }
        
        // Em vez de criar um container separado, vamos aplicar os estilos diretamente ao card
        const controlsContainer = layerEfficiencyCard; // Usar o card existente
        controlsContainer.style.cssText += `
            display: grid;
            grid-template-columns: 1fr 1fr; /* Duas colunas iguais em largura */
            grid-template-rows: auto; /* Uma linha que se adapta ao conteúdo */
            gap: 25px; /* Espaço generoso entre as duas colunas */
            padding: 20px;
            align-items: start; /* Alinhar ao topo para permitir alturas diferentes */
        `;

        const leftArea = document.createElement('div');
        leftArea.style.cssText = `
            display: flex;
            flex-direction: column;
            justify-content: space-between; /* Distribuir espaço uniformemente */
            gap: 20px; /* Aumentado de 15px para 20px */
            grid-column: 1;
            align-items: center;
            height: 100%; /* Ocupar toda a altura disponível */
            padding: 10px 0; /* Distância mínima das edges superior e inferior */
        `;

        const rightArea = document.createElement('div');
        rightArea.style.cssText = `
            display: flex;
            flex-direction: column;
            justify-content: space-between; /* Distribuir os dois grupos uniformemente */
            gap: 20px; /* Aumentado para maior separação entre grupos */
            grid-column: 2;
            height: 100%; /* Ocupar toda a altura */
            padding: 20px 0; /* Distância das edges */
        `;

// Grupo superior: Controlos de Palete
const palletControlsGroup = document.createElement('div');
palletControlsGroup.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: center;
`;

// Título do grupo de controlos de palete
const palletTitle = document.createElement('div');
palletTitle.textContent = 'PALLET CONTROLS';
palletTitle.style.cssText = `
    font-size: 0.9rem;
    color: #2c3e50;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    text-align: center;
    margin-bottom: 5px 0;
`;

// Container para botões de palete
const palletButtons = document.createElement('div');
palletButtons.style.cssText = `
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px; /* Espaço entre botões */
    flex-wrap: wrap; /* Permitir quebra de linha se necessário */
`;

// Grupo inferior: Controlos de Animação
const animationControlsGroup = document.createElement('div');
animationControlsGroup.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: center;
`;

// Título do grupo de controlos de animação
const animationTitle = document.createElement('div');
animationTitle.textContent = 'ANIMATION CONTROLS';
animationTitle.style.cssText = `
    font-size: 0.8rem;
    color: #2c3e50;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    text-align: center;
    margin-bottom: 5px 0;
`;

// Container para botões de animação
const animationButtons = document.createElement('div');
animationButtons.style.cssText = `
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
`;
        
        // Limpar o conteúdo do card e adicionar o título
        layerEfficiencyCard.innerHTML = '';

        // Criar e adicionar o título
        const title = document.createElement('h3');
        title.textContent = 'Pallet Controls';
        title.style.cssText = `
            grid-column: 1 / -1; /* Ocupar todas as 3 colunas (da primeira à última) */
            grid-row: 1; /* Primeira linha */
            text-align: center;
            margin: 0;
            margin-bottom: 10px;
            color: var(--dark-color);
            font-size: 1rem;
            font-weight: bold;
        `;
        layerEfficiencyCard.appendChild(title);
        
        // Top row titles
        const leftTitle = document.createElement('div');
        leftTitle.textContent = 'PALLET CONTROLS';
        leftTitle.style.cssText = `
            font-size: 0.7rem;
            color: #2c3e50;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            text-align: center;
            grid-column: 1; /* Primeira coluna */
            grid-row: 2; /* Segunda linha */
        `;
        
                // Contador de paletes - centro
        const palletCounter = document.createElement('div');
        palletCounter.id = 'pallet-counter';
        palletCounter.style.cssText = `
            font-weight: bold;
            color: #2c3e50;
            font-size: 1.1rem; /* Aumentado para maior destaque */
            padding: 15px 25px; /* Padding mais generoso */
            background: linear-gradient(145deg, #f8f9fa, #e9ecef);
            border-radius: 8px;
            border: 2px solid #dee2e6;
            text-align: center;
            width: 100%; /* Ocupar toda a largura disponível */
            box-shadow: 0 2px 4px rgba(0,0,0,0.1); /* Sombra subtil */
        `;
        palletCounter.textContent = 'Pallet 0 of 0';

        // Título direito - ANIMATION CONTROLS
        const rightTitle = document.createElement('div');
        rightTitle.textContent = 'ANIMATION CONTROLS';
        rightTitle.style.cssText = `
            font-size: 0.7rem;
            color: #2c3e50;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            text-align: center;
            grid-column: 3; /* Terceira coluna */
            grid-row: 2; /* Segunda linha */
        `;
        
        // Bottom row controls
        const leftButtons = document.createElement('div');
        leftButtons.style.cssText = `
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 8px;
            grid-column: 1; /* Primeira coluna */
            grid-row: 3; /* Terceira linha */
            width: 100%;
        `;
        
        // Create pallet control buttons
        const restartButton = this.createControlButton('', () => {
            this.restartCurrentPallet();
        }, 'square', 'restart', true); // iconOnly = true
        restartButton.id = 'restart-pallet-btn';
        restartButton.disabled = true;
        restartButton.title = 'Restart current pallet animation';
        
        const prevPalletButton = this.createControlButton('Prev.', () => {
            if (this.dataLoader) {
                this.dataLoader.previousPallet();
                this.resetAnimationState();
                this.resetSimulationTimer();
            }
        }, 'square', 'arrowLeft');
        prevPalletButton.id = 'prev-pallet-btn';
        prevPalletButton.disabled = true;
        prevPalletButton.title = 'Previous pallet solution';

        const nextPalletButton = this.createControlButton('Next', () => {
            if (this.dataLoader) {
                this.dataLoader.nextPallet();
                this.resetAnimationState();
                this.resetSimulationTimer();
            }
        }, 'square', 'arrowRight');
        nextPalletButton.id = 'next-pallet-btn';
        nextPalletButton.disabled = true;
        nextPalletButton.title = 'Next pallet solution';

        const finishedButton = this.createControlButton('', () => {
            this.finishCurrentPallet();
        }, 'square', 'skipForward');
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
            font-size: 1.2rem; /* Ligeiramente maior que o contador de paletes */
            padding: 15px 25px;
            background: linear-gradient(145deg, #ffffff, #f8f9fa);
            border-radius: 8px;
            border: 2px solid #3498db;
            text-align: center;
            box-shadow: 0 3px 6px rgba(52, 152, 219, 0.2);
            width: 100%;
        `;
        boxCounter.textContent = 'Box 0 of 0';

        const loadFileButton = document.createElement('button');
        loadFileButton.style.cssText = `
            background: linear-gradient(145deg, #63CBF1, #2F8DCB);
            color: white;
            border: none;
            border-radius: 8px;
            padding: 12px 20px;
            font-size: 0.95rem;
            font-weight: bold;
            cursor: pointer;
            width: 100%;
            transition: all 0.3s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        `;
        loadFileButton.textContent = '📁 Load New File';
        loadFileButton.title = 'Load a new simulation file';

        loadFileButton.addEventListener('mouseenter', () => {
        loadFileButton.style.transform = 'translateY(-2px)';
        loadFileButton.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
        });
        loadFileButton.addEventListener('mouseleave', () => {
            loadFileButton.style.transform = 'translateY(0)';
            loadFileButton.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        });

        // Adicionar elementos à área esquerda
        leftArea.appendChild(palletCounter);
        leftArea.appendChild(boxCounter);
        leftArea.appendChild(loadFileButton);

        
        // Right animation controls
        const rightButtons = document.createElement('div');
        rightButtons.style.cssText = `
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 8px;
            grid-column: 3; /* Terceira coluna */
            grid-row: 3; /* Terceira linha */
            width: 100%;
        `;
        
        const stepBackButton = this.createControlButton('', () => {
            this.stepBackwardOneBox();
        }, 'square', 'stepBack', true);
        stepBackButton.id = 'step-back-btn';
        stepBackButton.disabled = true;
        stepBackButton.title = 'Remove one box';

        const playPauseButton = this.createControlButton('', () => {
            this.togglePlayPause();
        }, 'square', 'play', true);
        playPauseButton.id = 'play-pause-btn';
        playPauseButton.disabled = true;
        playPauseButton.title = 'Play or pause animation';

        const stepForwardButton = this.createControlButton('', () => {
            this.stepForwardOneBox();
        }, 'square', 'stepForward', true);
        stepForwardButton.id = 'step-forward-btn';
        stepForwardButton.disabled = true;
        stepForwardButton.title = 'Add one box';
        
        rightButtons.appendChild(stepBackButton);
        rightButtons.appendChild(playPauseButton);
        rightButtons.appendChild(stepForwardButton);
        
        // Assemble the grid layout
        palletButtons.appendChild(restartButton);
        palletButtons.appendChild(prevPalletButton);
        palletButtons.appendChild(nextPalletButton);
        palletButtons.appendChild(finishedButton);

        animationButtons.appendChild(stepBackButton);
        animationButtons.appendChild(playPauseButton);
        animationButtons.appendChild(stepForwardButton);

        // Montar os grupos de controlos
        palletControlsGroup.appendChild(palletTitle);
        palletControlsGroup.appendChild(palletButtons);

        animationControlsGroup.appendChild(animationTitle);
        animationControlsGroup.appendChild(animationButtons);

        // Montar a área direita
        rightArea.appendChild(palletControlsGroup);
        rightArea.appendChild(animationControlsGroup);

        // Adicionar elementos à área esquerda
        leftArea.appendChild(palletCounter);
        leftArea.appendChild(boxCounter);
        leftArea.appendChild(loadFileButton);

        // Adicionar as duas áreas principais ao container
        layerEfficiencyCard.innerHTML = ''; // Limpar conteúdo existente
        layerEfficiencyCard.appendChild(leftArea);
        layerEfficiencyCard.appendChild(rightArea);


        // Notify FileManager that the button is now available
        if (this.fileManager && this.fileManager.retryButtonSetup) {
            setTimeout(() => {
                this.fileManager.retryButtonSetup();
            }, 100);
        }


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
            large: 'padding: 10px 20px; font-size: 1rem;',
            square: 'padding: 10px; min-width: 40px; min-height: 40px; font-size: 0.85rem;'
        };
        
        if (iconOnly) {
            const iconOnlyStyles = {
                small: 'padding: 6px; min-width: 32px;',
                medium: 'padding: 8px; min-width: 36px;',
                large: 'padding: 10px; min-width: 40px;',
                square: 'padding: 12px; min-width: 48px; min-height: 48px;'
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

    // NOVAS FUNÇÕES PARA INTEGRAÇÃO COM FILEMANAGER
    /**
     * Stop current animation
     * NOVO: Para integração com FileManager
     */
    stopAnimation() {
        if (this.dataLoader && this.dataLoader.animationTimeouts) {
            this.dataLoader.animationTimeouts.forEach(timeoutId => {
                clearTimeout(timeoutId);
            });
            this.dataLoader.animationTimeouts = [];
        }
        
        this.animationState.isPlaying = false;
        this.animationState.isPaused = false;
        
        this.stopSimulationTimer();
        
        const button = document.getElementById('play-pause-btn');
        if (button) {
            button.textContent = '▶ Play';
            button.title = 'Start animation';
        }
    }

    /**
     * Clear current simulation
     * NOVO: Para integração com FileManager
     */
    clearSimulation() {
        if (this.dataLoader) {
            this.dataLoader.clearCurrentBoxes();
        }
        
        if (this.simulator && this.simulator.centerOfMassGroup) {
            this.simulator.hideCenterOfMassBeam();
        }
        
        this.resetAnimationState();
        this.resetSimulationTimer();
        
        // Reset metrics calculators
        if (this.volumeEfficiencyCalculator) {
            this.volumeEfficiencyCalculator.reset();
        }
        if (this.bottomMetricsCalculator) {
            this.bottomMetricsCalculator.reset();
        }
    }

    /**
     * Load data from string content
     * NOVO: Para integração com FileManager
     * @param {string} content - File content
     */
    async loadDataFromString(content) {
        try {
            // Stop any current animation
            this.stopAnimation();
            
            // Clear current simulation
            this.clearSimulation();
            
            // Parse new data using existing method
            const success = this.loadCrosslogData(content, 'New File');
            
            if (success) {
                // Update UI
                this.updateButtonStates();
                this.updatePalletCounter();
                this.updateBoxCounter();
                
                console.log('Data loaded successfully from string');
            } else {
                throw new Error('Failed to parse Crosslog data');
            }
            
        } catch (error) {
            console.error('Error loading data from string:', error);
            throw error;
        }
    }

    /**
     * Reset controls to initial state
     * NOVO: Para integração com FileManager
     */
    resetControls() {
        // Reset to first pallet
        if (this.dataLoader && this.dataLoader.allPallets && this.dataLoader.allPallets.length > 0) {
            this.dataLoader.currentPalletIndex = 0;
        }
        
        // Reset animation state
        this.resetAnimationState();
        this.resetSimulationTimer();
        
        // Update UI
        this.updateButtonStates();
        this.updatePalletCounter();
        this.updateBoxCounter();
        
        // Reset camera to initial position if needed
        if (this.simulator && this.simulator.camera) {
            this.simulator.camera.position.set(0, 20, 18);
            this.simulator.camera.lookAt(0, 5, 20);
            
            if (this.simulator.controls) {
                this.simulator.controls.reset();
            }
        }
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
                    ySpan: zSpan,
                    zSpan: xSpan
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
        
        
        if (this.animationState.isCompleted) {
            centerMassElement.style.color = '#27ae60';
        } else {
            centerMassElement.style.color = '#3498db';
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

// NOVO: Objeto global para acesso ao FileManager e backward compatibility
window.palletAppUtils = {
    /**
     * Get current application instance
     */
    getApp: () => window.palletApp,
    
    /**
     * Get current simulator
     */
    getSimulator: () => window.palletApp?.simulator || null,
    
    /**
     * Get current data loader
     */
    getDataLoader: () => window.palletApp?.dataLoader || null,
    
    /**
     * Get current file manager
     */
    getFileManager: () => window.palletApp?.fileManager || null,
    
    /**
     * Load a specific pallet by index
     * @param {number} index - Pallet index
     */
    loadPallet: (index) => {
        if (window.palletApp && window.palletApp.dataLoader && window.palletApp.dataLoader.allPallets) {
            if (index >= 0 && index < window.palletApp.dataLoader.allPallets.length) {
                window.palletApp.dataLoader.currentPalletIndex = index;
                window.palletApp.dataLoader.loadPallet(index);
                window.palletApp.updatePalletCounter();
                window.palletApp.updateBoxCounter();
                window.palletApp.resetAnimationState();
                window.palletApp.resetSimulationTimer();
                return true;
            }
        }
        return false;
    },
    
    /**
     * Get current application statistics
     */
    getStats: () => {
        if (window.palletApp && window.palletApp.dataLoader) {
            return window.palletApp.dataLoader.getStatistics();
        }
        return null;
    },
    
    /**
     * Toggle center of mass beam visibility
     */
    toggleCenterOfMassBeam: () => {
        if (window.palletApp && window.palletApp.simulator) {
            if (window.palletApp.simulator.isCenterOfMassBeamVisible()) {
                window.palletApp.simulator.hideCenterOfMassBeam();
            } else {
                window.palletApp.updateCenterOfMassDisplay();
            }
        }
    }

    
};

    /**
     * Navigate to box selection page
     */
    function goToBoxSelection() {
        window.location.href = '../box_selection/index.html';
    }

    /**
     * Navigate to ending page
     */
    function goToEndingPage() {
        window.location.href = '../ending_page/index.html';
    }