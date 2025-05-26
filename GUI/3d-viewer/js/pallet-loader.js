/**
 * Pallet Data Loader and Parser
 * This system reads and interprets palletization data files,
 * converting text-based coordinates into 3D visualizations
 * 
 * Save this as: GUI/3d-viewer/pallet-loader.js
 */

class PalletDataLoader {
    constructor(simulator) {
        this.simulator = simulator;
        this.palletData = null;      // Stores parsed pallet information
        this.currentPalletIndex = 0; // Which pallet we're currently viewing
        this.allPallets = [];        // Array containing all parsed pallets
        this.boxColors = {};         // Color mapping for different item types
        this.animationSpeed = 500;   // Milliseconds between box placements
        
        this.initializeColors();
        console.log('PalletDataLoader initialized with animation speed:', this.animationSpeed, 'ms');
    }
    
    /**
     * Initialize color palette for different box types
     * Each item type gets a consistent color for easy identification
     */
    initializeColors() {
        // Predefined color palette for different item types
        // These colors are chosen to be distinct and professional-looking
        this.colorPalette = [
            0x3498db, // Blue
            0xe74c3c, // Red  
            0x2ecc71, // Green
            0xf39c12, // Orange
            0x9b59b6, // Purple
            0x1abc9c, // Turquoise
            0xe67e22, // Dark Orange
            0x34495e, // Dark Blue-Grey
            0x16a085, // Dark Turquoise
            0x27ae60, // Dark Green
            0x8e44ad, // Dark Purple
            0x2980b9, // Dark Blue
            0xc0392b, // Dark Red
            0xd35400, // Dark Orange-Red
            0x7f8c8d, // Grey
            0x95a5a6  // Light Grey
        ];
        
        console.log('Initialized color palette with', this.colorPalette.length, 'distinct colors');
    }
    
    /**
     * Parse a complete palletization data file
     * This method extracts all pallet and box information from the text format
     * 
     * @param {string} fileContent - Raw text content from the data file
     * @returns {Object} Parsed data structure containing all pallets and their boxes
     */
    parseDataFile(fileContent) {
        console.log('Starting to parse palletization data...');
        
        const lines = fileContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        const parsedData = {
            orderInfo: {},
            pallets: []
        };
        
        let currentSection = null;
        let currentPallet = null;
        let lineIndex = 0;
        
        console.log('Processing', lines.length, 'lines of data');
        
        while (lineIndex < lines.length) {
            const line = lines[lineIndex];
            
            // Identify different sections of the data file
            if (line.startsWith('[order_id]')) {
                parsedData.orderInfo.orderId = parseInt(lines[lineIndex + 1]);
                console.log('Found order ID:', parsedData.orderInfo.orderId);
                lineIndex += 2;
                continue;
            }
            
            if (line.startsWith('[pallet_quantity]')) {
                parsedData.orderInfo.palletQuantity = parseInt(lines[lineIndex + 1]);
                console.log('Expected number of pallets:', parsedData.orderInfo.palletQuantity);
                lineIndex += 2;
                continue;
            }
            
            if (line.startsWith('[pallet_id')) {
                // Start of a new pallet definition
                currentPallet = this.parsePalletHeader(lines, lineIndex);
                console.log('Starting pallet', currentPallet.id, 'with dimensions:', 
                           currentPallet.width + 'x' + currentPallet.depth + 'x' + currentPallet.height);
                lineIndex += 2; // Skip header line and data line
                continue;
            }
            
            if (line.startsWith('[total_volume')) {
                // Parse volume and efficiency metrics
                const metrics = this.parsePalletMetrics(lines, lineIndex);
                if (currentPallet) {
                    currentPallet.metrics = metrics;
                    console.log('Added metrics to pallet', currentPallet.id, 
                               '- Efficiency:', (metrics.occupiedVolume / metrics.totalVolume * 100).toFixed(1) + '%');
                }
                lineIndex += 2;
                continue;
            }
            
            if (line.startsWith('[item_quantity]')) {
                // Parse the number of items and then the item definitions
                const itemQuantity = parseInt(lines[lineIndex + 1]);
                if (currentPallet) {
                    currentPallet.itemQuantity = itemQuantity;
                    console.log('Parsing', itemQuantity, 'boxes for pallet', currentPallet.id);
                    
                    // Parse all box definitions for this pallet
                    const boxes = this.parseBoxDefinitions(lines, lineIndex + 2, itemQuantity);
                    currentPallet.boxes = boxes;
                    
                    // Add completed pallet to our collection
                    parsedData.pallets.push(currentPallet);
                    console.log('Completed pallet', currentPallet.id, 'with', boxes.length, 'boxes');
                }
                
                // Skip past all the box definition lines
                lineIndex += 2 + itemQuantity;
                continue;
            }
            
            lineIndex++;
        }
        
        this.allPallets = parsedData.pallets;
        console.log(`Successfully parsed ${parsedData.pallets.length} pallets with total of ${this.getTotalBoxCount()} boxes`);
        
        return parsedData;
    }
    
    /**
     * Parse pallet header information (dimensions, weight, etc.)
     */
    parsePalletHeader(lines, startIndex) {
        const headerLine = lines[startIndex + 1];
        const parts = headerLine.split('\t').map(part => part.trim());
        
        return {
            id: parseInt(parts[0]),
            width: parseFloat(parts[1]),   // X dimension in mm
            depth: parseFloat(parts[2]),   // Y dimension in mm  
            height: parseFloat(parts[3]),  // Z dimension in mm
            weight: parseFloat(parts[4]),  // Pallet weight in grams
            totalLoad: parseFloat(parts[5]) // Total load including boxes
        };
    }
    
    /**
     * Parse volume and efficiency metrics for a pallet
     */
    parsePalletMetrics(lines, startIndex) {
        const metricsLine = lines[startIndex + 1];
        const parts = metricsLine.split('\t').map(part => part.trim());
        
        return {
            totalVolume: parseFloat(parts[0]),
            occupiedVolume: parseFloat(parts[1]),
            m1: parseFloat(parts[2]),
            m2: parseFloat(parts[3])
        };
    }
    
    /**
     * Parse all box definitions for a single pallet
     * Each box has position, dimensions, type, weight, and other properties
     */
    parseBoxDefinitions(lines, startIndex, quantity) {
        const boxes = [];
        
        for (let i = 0; i < quantity; i++) {
            const lineIndex = startIndex + i;
            if (lineIndex >= lines.length) break;
            
            const boxLine = lines[lineIndex];
            const parts = boxLine.split('\t').map(part => part.trim());
            
            if (parts.length >= 11) {
                const box = {
                    // Position coordinates (convert from mm to our 3D units)
                    xmin: parseFloat(parts[0]) * 0.01,  // Convert mm to units
                    ymin: parseFloat(parts[1]) * 0.01,
                    zmin: parseFloat(parts[2]) * 0.01,
                    xmax: parseFloat(parts[3]) * 0.01,
                    ymax: parseFloat(parts[4]) * 0.01,
                    zmax: parseFloat(parts[5]) * 0.01,
                    
                    // Box properties
                    sequence: parseInt(parts[6]),
                    itemType: parseInt(parts[7]),
                    weight: parseFloat(parts[8]),
                    k: parseInt(parts[9]),
                    irregular: parseInt(parts[10]),
                    
                    // Calculate dimensions from coordinates
                    width: (parseFloat(parts[3]) - parseFloat(parts[0])) * 0.01,
                    depth: (parseFloat(parts[4]) - parseFloat(parts[1])) * 0.01,
                    height: (parseFloat(parts[5]) - parseFloat(parts[2])) * 0.01,
                    
                    // Calculate center position for 3D placement
                    centerX: ((parseFloat(parts[3]) + parseFloat(parts[0])) / 2) * 0.01,
                    centerY: ((parseFloat(parts[4]) + parseFloat(parts[1])) / 2) * 0.01,
                    centerZ: ((parseFloat(parts[5]) + parseFloat(parts[2])) / 2) * 0.01
                };
                
                boxes.push(box);
            }
        }
        
        return boxes;
    }
    
    /**
     * Get color for a specific item type
     * Ensures consistent colors across the entire simulation
     */
    getColorForItemType(itemType) {
        if (!this.boxColors[itemType]) {
            // Assign a color from our palette, cycling through if we have many types
            const colorIndex = Object.keys(this.boxColors).length % this.colorPalette.length;
            this.boxColors[itemType] = this.colorPalette[colorIndex];
            console.log('Assigned color', this.boxColors[itemType].toString(16), 'to item type', itemType);
        }
        return this.boxColors[itemType];
    }
    
    /**
     * Create a 3D box mesh from box data
     * This converts our parsed data into actual 3D objects
     */
    createBoxMesh(boxData) {
        // Create the geometry using the calculated dimensions
        const geometry = new THREE.BoxGeometry(
            boxData.width,
            boxData.height,
            boxData.depth
        );
        
        // Get consistent color for this item type
        const color = this.getColorForItemType(boxData.itemType);
        
        // Create material with some visual enhancement
        const material = new THREE.MeshLambertMaterial({
            color: color,
            transparent: true,
            opacity: 0.8,
        });
        
        // Create the mesh
        const mesh = new THREE.Mesh(geometry, material);
        
        // Position the box at its calculated center
        // Note: coordinate system conversion from data format to Three.js format
        mesh.position.set(
            boxData.centerX - 6, // Offset to center on pallet (12/2 = 6)
            boxData.centerZ,     // Z becomes Y in our coordinate system
            boxData.centerY - 4  // Offset to center on pallet (8/2 = 4)
        );
        
        // Enable shadows
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Store reference to original data for debugging and interaction
        mesh.userData = boxData;
        
        return mesh;
    }
    
    /**
     * Load and display a specific pallet with animated box placement
     */
    loadPallet(palletIndex = 0) {
        if (palletIndex < 0 || palletIndex >= this.allPallets.length) {
            console.error('Invalid pallet index:', palletIndex);
            return;
        }
        
        // Clear existing boxes
        this.clearCurrentBoxes();
        
        const pallet = this.allPallets[palletIndex];
        this.currentPalletIndex = palletIndex;
        
        console.log(`Loading pallet ${pallet.id} with ${pallet.boxes.length} boxes`);
        
        // Create and add all boxes for this pallet with animation
        pallet.boxes.forEach((boxData, index) => {
            setTimeout(() => {
                const boxMesh = this.createBoxMesh(boxData);
                this.simulator.scene.add(boxMesh);
                this.simulator.boxes.push(boxMesh);
                
                // Update UI counters
                this.updateUI();
                
                // Log progress every 10 boxes
                if ((index + 1) % 10 === 0 || index === pallet.boxes.length - 1) {
                    console.log(`Placed ${index + 1}/${pallet.boxes.length} boxes`);
                }
            }, index * this.animationSpeed);
        });
    }
    
    /**
     * Clear all boxes from the current scene
     */
    clearCurrentBoxes() {
        console.log('Clearing', this.simulator.boxes.length, 'boxes from scene');
        
        this.simulator.boxes.forEach(box => {
            this.simulator.scene.remove(box);
            // Dispose of geometry and materials to free memory
            box.geometry.dispose();
            box.material.dispose();
        });
        this.simulator.boxes = [];
    }
    
    /**
     * Update the user interface with current pallet information
     */
    updateUI() {
        if (this.allPallets.length === 0) return;
        
        const currentPallet = this.allPallets[this.currentPalletIndex];
        
        // Update box count
        const boxCountElement = document.getElementById('boxes-count');
        if (boxCountElement) {
            boxCountElement.textContent = this.simulator.boxes.length;
        }
        
        // Update height (find the highest box)
        let maxHeight = 0;
        this.simulator.boxes.forEach(box => {
            const boxTop = box.position.y + (box.userData.height / 2);
            maxHeight = Math.max(maxHeight, boxTop);
        });
        
        const heightElement = document.getElementById('current-height');
        if (heightElement) {
            heightElement.textContent = `${(maxHeight * 100).toFixed(1)}cm`;
        }
        
        // Update efficiency
        const efficiencyElement = document.getElementById('global-efficiency');
        if (efficiencyElement && currentPallet.metrics) {
            const efficiency = (currentPallet.metrics.occupiedVolume / currentPallet.metrics.totalVolume * 100);
            efficiencyElement.textContent = `${efficiency.toFixed(1)}%`;
        }
    }
    
    /**
     * Get total number of boxes across all pallets
     */
    getTotalBoxCount() {
        return this.allPallets.reduce((total, pallet) => total + pallet.boxes.length, 0);
    }
    
    /**
     * Navigate to next pallet
     */
    nextPallet() {
        if (this.currentPalletIndex < this.allPallets.length - 1) {
            console.log('Navigating to next pallet');
            this.loadPallet(this.currentPalletIndex + 1);
        } else {
            console.log('Already at last pallet');
        }
    }
    
    /**
     * Navigate to previous pallet
     */
    previousPallet() {
        if (this.currentPalletIndex > 0) {
            console.log('Navigating to previous pallet');
            this.loadPallet(this.currentPalletIndex - 1);
        } else {
            console.log('Already at first pallet');
        }
    }
}

// Export for use in other files
window.PalletDataLoader = PalletDataLoader;