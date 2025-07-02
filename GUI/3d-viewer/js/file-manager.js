/**
 * File Manager - Crosslog Files Management
 * Handles loading, renaming and storing data files
 */

class FileManager {
    constructor(palletApp) {
        this.palletApp = palletApp;
        
        // In-memory file storage
        this.loadedFiles = new Map();
        
        // Default file (simulation.txt)
        this.defaultFileName = 'simulation.txt';
        this.currentFileName = this.defaultFileName;
        
        // Interface elements
        this.loadButton = null;
        this.fileInput = null;
        this.dropZone = null;
        
        this.init();
    }
    
    /**
     * Initialize file manager
     */
    init() {
        this.createFileInput();
        this.setupDropZone();
        this.loadDefaultFile();
        
        // Setup load button with delay to ensure it exists
        this.setupLoadButtonWithRetry();
    }
    
    /**
     * Setup load button with retry mechanism
     */
    setupLoadButtonWithRetry() {
        let attempts = 0;
        const maxAttempts = 20;
        
        const trySetupButton = () => {
            attempts++;
            
            if (this.setupLoadButton()) {
                console.log('Load New File button found and configured successfully');
                return;
            }
            
            if (attempts < maxAttempts) {
                setTimeout(trySetupButton, 500);
            } else {
                console.warn('Load New File button not found after maximum attempts. Button will be created if needed.');
            }
        };
        
        // Start immediately, then retry if needed
        trySetupButton();
    }
    
    /**
     * Create hidden file input
     */
    createFileInput() {
        this.fileInput = document.createElement('input');
        this.fileInput.type = 'file';
        this.fileInput.accept = '.txt,.dat,.crosslog';
        this.fileInput.style.display = 'none';
        this.fileInput.addEventListener('change', (event) => {
            this.handleFileSelection(event.target.files);
        });
        
        document.body.appendChild(this.fileInput);
    }
    
    /**
     * Setup "Load New File" button
     * @returns {boolean} True if button was found and configured
     */
    setupLoadButton() {
        // Multiple strategies to find the button
        const buttonSelectors = [
            '.btn-load-file',
            '#load-new-file',
            '[title*="Load"]',
            '[title*="new simulation file"]'
        ];
        
        // Try each selector
        for (const selector of buttonSelectors) {
            this.loadButton = document.querySelector(selector);
            if (this.loadButton) {
                break;
            }
        }
        
        // If not found by selectors, search by text content
        if (!this.loadButton) {
            const buttons = document.querySelectorAll('button');
            buttons.forEach(button => {
                const text = button.textContent.toLowerCase();
                if (text.includes('load new file') || text.includes('📁')) {
                    this.loadButton = button;
                }
            });
        }
        
        if (this.loadButton) {
            // Remove existing listeners to avoid duplicates
            this.loadButton.removeEventListener('click', this.handleLoadButtonClick);
            
            // Add new listener
            this.handleLoadButtonClick = () => {
                this.fileInput.click();
            };
            this.loadButton.addEventListener('click', this.handleLoadButtonClick);
            
            return true;
        }
        
        return false;
    }
    
    /**
     * Setup drag & drop area
     */
    setupDropZone() {
        // Use main container as drop zone
        this.dropZone = document.querySelector('.threejs-container, .visualization-area');
        
        if (!this.dropZone) {
            console.warn('Drop zone not found');
            return;
        }
        
        // Prevent default browser behavior
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, this.preventDefaults, false);
            document.body.addEventListener(eventName, this.preventDefaults, false);
        });
        
        // Highlight zone when file is dragged
        ['dragenter', 'dragover'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, () => this.highlight(), false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, () => this.unhighlight(), false);
        });
        
        // Handle file drop
        this.dropZone.addEventListener('drop', (event) => {
            const files = event.dataTransfer.files;
            this.handleFileSelection(files);
        }, false);
        
        // Add visual indicator
        this.addDropIndicator();
    }
    
    /**
     * Prevent default browser behaviors
     */
    preventDefaults(event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    /**
     * Highlight drop area
     */
    highlight() {
        this.dropZone.classList.add('drag-highlight');
    }
    
    /**
     * Remove highlight from drop area
     */
    unhighlight() {
        this.dropZone.classList.remove('drag-highlight');
    }
    
    /**
     * Add visual indicator for drag & drop
     */
    addDropIndicator() {
        if (!this.dropZone.querySelector('.drop-indicator')) {
            const indicator = document.createElement('div');
            indicator.className = 'drop-indicator';
            indicator.innerHTML = `
                <div class="drop-content">
                    <div class="drop-icon">📁</div>
                    <div class="drop-text">Drag Crosslog files here</div>
                    <div class="drop-subtext">or click "Load New File"</div>
                </div>
            `;
            
            // Add inline styles to ensure visibility
            indicator.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(59, 130, 246, 0.1);
                border: 2px dashed #3b82f6;
                border-radius: 8px;
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                pointer-events: none;
            `;
            
            const dropContent = indicator.querySelector('.drop-content');
            dropContent.style.cssText = `
                text-align: center;
                color: #3b82f6;
                font-size: 18px;
                font-weight: 600;
            `;
            
            this.dropZone.style.position = 'relative';
            this.dropZone.appendChild(indicator);
            
            // Show indicator during drag
            this.dropZone.addEventListener('dragenter', () => {
                indicator.style.display = 'flex';
            });
            
            this.dropZone.addEventListener('dragleave', (event) => {
                // Only hide if completely left the zone
                if (!this.dropZone.contains(event.relatedTarget)) {
                    indicator.style.display = 'none';
                }
            });
            
            this.dropZone.addEventListener('drop', () => {
                indicator.style.display = 'none';
            });
        }
    }
    
    /**
     * Handle file selection
     * @param {FileList} files - List of selected files
     */
    async handleFileSelection(files) {
        if (!files || files.length === 0) {
            return;
        }
        
        const file = files[0];
        
        // Validate file type
        if (!this.isValidFileType(file)) {
            this.showMessage('Invalid file type. Use .txt, .dat or .crosslog files', 'error');
            return;
        }
        
        try {
            // Read file content
            const content = await this.readFileContent(file);
            
            // Generate timestamped name
            const newFileName = this.generateTimestampedName(file.name);
            
            // Store file
            this.loadedFiles.set(newFileName, {
                content: content,
                originalName: file.name,
                loadedAt: new Date(),
                size: file.size
            });
            
            // Set as current file
            this.currentFileName = newFileName;
            
            // Show success message
            this.showMessage(`File loaded: ${newFileName}`, 'success');
            
            // Reload simulation
            await this.reloadSimulation(content);
            
            // Update interface
            this.updateFileSelector();
            
        } catch (error) {
            console.error('Error loading file:', error);
            this.showMessage('Error loading file: ' + error.message, 'error');
        }
    }
    
    /**
     * Validate if file type is accepted
     * @param {File} file - File to validate
     * @returns {boolean} True if valid
     */
    isValidFileType(file) {
        const validExtensions = ['.txt', '.dat', '.crosslog'];
        const fileName = file.name.toLowerCase();
        
        return validExtensions.some(ext => fileName.endsWith(ext));
    }
    
    /**
     * Read file content
     * @param {File} file - File to read
     * @returns {Promise<string>} File content
     */
    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                resolve(event.target.result);
            };
            
            reader.onerror = () => {
                reject(new Error('Error reading file'));
            };
            
            reader.readAsText(file, 'UTF-8');
        });
    }
    
    /**
     * Generate timestamped name
     * @param {string} originalName - Original file name
     * @returns {string} Timestamped name
     */
    generateTimestampedName(originalName) {
        const now = new Date();
        
        // Format date as dd-mm-yy_hh-mm-ss
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = String(now.getFullYear()).slice(-2);
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        
        const timestamp = `${day}-${month}-${year}_${hours}-${minutes}-${seconds}`;
        
        // Remove extension from original name to add timestamp
        const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
        const extension = originalName.includes('.') ? originalName.split('.').pop() : 'txt';
        
        return `simulation_${timestamp}.${extension}`;
    }
    
    /**
     * Reload simulation with new file
     * @param {string} content - File content
     */
    async reloadSimulation(content) {
        if (!this.palletApp) {
            throw new Error('PalletApp is not available');
        }
        
        console.log('FileManager: Starting reload simulation');
        
        // Stop current animation if running
        if (this.palletApp.stopAnimation) {
            this.palletApp.stopAnimation();
        }
        
        // Clear current simulation
        if (this.palletApp.clearSimulation) {
            this.palletApp.clearSimulation();
        }
        
        // Load new data
        if (this.palletApp.loadDataFromString) {
            await this.palletApp.loadDataFromString(content);
        } else {
            // Fallback - reload page with new data
            this.palletApp.dataLoader.parseDataFile(content);
            this.palletApp.dataLoader.loadPallet(0);
        }
        
        // Reset controls
        if (this.palletApp.dataLoader?.allPallets?.length > 0) {
        this.palletApp.dataLoader.currentPalletIndex = 0;
        }
        this.palletApp.updateButtonStates();
        this.palletApp.updatePalletCounter();
        this.palletApp.updateBoxCounter();
        if (this.palletApp.simulator && this.palletApp.simulator.resetCameraToInitialPosition) {
            this.palletApp.simulator.resetCameraToInitialPosition();
        }

        //Exit Standby mode
        if (this.palletApp.exitStandbyMode) {
            this.palletApp.exitStandbyMode();
        }
        
        console.log('FileManager: Reload simulation completed');
    }
    
    /**
     * Load default file
     */
    async loadDefaultFile() {
        try {
            // Try to load simulation.txt if it exists
            const response = await fetch('3d-viewer/data/simulation.txt');
            
            if (response.ok) {
                const content = await response.text();
                this.loadedFiles.set(this.defaultFileName, {
                    content: content,
                    originalName: this.defaultFileName,
                    loadedAt: new Date(),
                    size: content.length,
                    isDefault: true
                });
            }
        } catch (error) {
            console.warn('Default file not found:', error.message);
        }
    }
    
    /**
     * Update file selector in interface
     */
    updateFileSelector() {
        // Create or update loaded files dropdown
        let selector = document.querySelector('#file-selector');
        
        if (!selector && this.loadedFiles.size > 1) {
            selector = this.createFileSelector();
        }
        
        if (selector) {
            this.populateFileSelector(selector);
        }
    }
    
    /**
     * Create file selector
     * @returns {HTMLElement} Selector element
     */
    createFileSelector() {
        const container = document.querySelector('.metrics-area, .status-bar');
        
        if (!container) {
            return null;
        }
        
        const selectorGroup = document.createElement('div');
        selectorGroup.className = 'file-selector-group';
        selectorGroup.innerHTML = `
            <label for="file-selector">Current File:</label>
            <select id="file-selector">
                <!-- Populated dynamically -->
            </select>
        `;
        
        const selector = selectorGroup.querySelector('#file-selector');
        selector.addEventListener('change', (event) => {
            this.switchToFile(event.target.value);
        });
        
        container.appendChild(selectorGroup);
        return selector;
    }
    
    /**
     * Populate selector with available files
     * @param {HTMLSelectElement} selector - Select element
     */
    populateFileSelector(selector) {
        selector.innerHTML = '';
        
        this.loadedFiles.forEach((fileData, fileName) => {
            const option = document.createElement('option');
            option.value = fileName;
            option.textContent = fileData.isDefault ? 
                `${fileName} (default)` : 
                fileName;
            option.selected = fileName === this.currentFileName;
            
            selector.appendChild(option);
        });
    }
    
    /**
     * Switch to specific file
     * @param {string} fileName - File name
     */
    async switchToFile(fileName) {
        if (!this.loadedFiles.has(fileName)) {
            this.showMessage('File not found', 'error');
            return;
        }
        
        try {
            this.currentFileName = fileName;
            const fileData = this.loadedFiles.get(fileName);
            
            await this.reloadSimulation(fileData.content);
            this.showMessage(`Switched to: ${fileName}`, 'info');

            if (this.palletApp.startSimulationTimer) {
            setTimeout(() => {
                this.palletApp.startSimulationTimer();
                console.log('Timer restarted after file switch'); // Debug
            }, 200);
        }       
        } catch (error) {
            console.error('Error switching file:', error);
            this.showMessage('Error loading file: ' + error.message, 'error');
        }
    }
    
    /**
     * Show message to user
     * @param {string} message - Message to show
     * @param {string} type - Message type (success, error, info)
     */
    showMessage(message, type = 'info') {
        // Remove previous message if exists
        const existingMessage = document.querySelector('.file-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Create new message
        const messageElement = document.createElement('div');
        messageElement.className = `file-message file-message-${type}`;
        messageElement.textContent = message;
        
        // Message styles
        messageElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 6px;
            color: white;
            font-weight: 500;
            z-index: 2000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
        `;
        
        // Colors by type
        const colors = {
            success: '#22c55e',
            error: '#ef4444',
            info: '#3b82f6'
        };
        
        messageElement.style.backgroundColor = colors[type] || colors.info;
        
        document.body.appendChild(messageElement);
        
        // Remove after 4 seconds
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.style.opacity = '0';
                messageElement.style.transform = 'translateX(100%)';
                
                setTimeout(() => {
                    messageElement.remove();
                }, 300);
            }
        }, 4000);
    }
    
    /**
     * Get current file
     * @returns {Object|null} Current file data
     */
    getCurrentFile() {
        return this.loadedFiles.get(this.currentFileName) || null;
    }
    
    /**
     * List all loaded files
     * @returns {Array} List of file names
     */
    getLoadedFiles() {
        return Array.from(this.loadedFiles.keys());
    }
    
    /**
     * Remove file from memory
     * @param {string} fileName - File name to remove
     */
    removeFile(fileName) {
        if (fileName === this.defaultFileName) {
            this.showMessage('Cannot remove default file', 'error');
            return;
        }
        
        if (this.loadedFiles.has(fileName)) {
            this.loadedFiles.delete(fileName);
            
            // If it was current file, switch to default
            if (fileName === this.currentFileName) {
                this.currentFileName = this.defaultFileName;
                
                if (this.loadedFiles.has(this.defaultFileName)) {
                    this.switchToFile(this.defaultFileName);
                }
            }
            
            this.updateFileSelector();
            this.showMessage(`File removed: ${fileName}`, 'info');
        }
    }
    
    /**
     * Clear all files except default
     */
    clearAllFiles() {
        const filesToRemove = [];
        
        this.loadedFiles.forEach((fileData, fileName) => {
            if (!fileData.isDefault) {
                filesToRemove.push(fileName);
            }
        });
        
        filesToRemove.forEach(fileName => {
            this.loadedFiles.delete(fileName);
        });
        
        this.currentFileName = this.defaultFileName;
        this.updateFileSelector();
        this.showMessage('All files removed', 'info');
    }
    
    /**
     * Manual trigger for button setup (public method)
     * Can be called externally if button is created after FileManager initialization
     */
    retryButtonSetup() {
        return this.setupLoadButton();
    }
}

// Export for global use
window.FileManager = FileManager;