/**
 * Pallet Data Loader - Crosslog Format Parser
 * Parses Crosslog data files and manages 3D visualization of pallets
 */

class PalletDataLoader {
    constructor(simulator) {
        this.simulator = simulator;
        
        // Data storage
        this.allPallets = [];
        this.currentPalletIndex = 0;
        this.orderInfo = {};
        
        // Animation control
        this.animationSpeed = 500;
        this.animationTimeouts = [];
        
        // Color system for different item types
        this.itemTypeColors = new Map();
        this.colorPalette = [
            0x3498db,  // Blue
            0xe74c3c,  // Red  
            0x2ecc71,  // Green
            0xf39c12,  // Orange
            0x9b59b6,  // Purple
            0x1abc9c,  // Turquoise
            0xe67e22,  // Dark Orange
            0x34495e,  // Dark Blue-Gray
            0xff6b6b,  // Light Red
            0x4ecdc4,  // Light Turquoise
            0x45b7d1,  // Sky Blue
            0x96ceb4,  // Mint Green
            0xffeaa7,  // Light Yellow
            0xdda0dd,  // Plum
            0x74b9ff,  // Bright Blue
            0xa29bfe   // Light Purple
        ];
    }
    
    /**
     * Parse a complete Crosslog data file
     * @param {string} fileContent - Raw file content
     * @returns {Object} Parsed data structure
     */
    parseDataFile(fileContent) {
        const lines = fileContent.trim().split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        let currentLineIndex = 0;
        const parsedData = {
            orderInfo: {},
            pallets: []
        };
        
        // Parse order header information
        try {
            const orderParseResult = this.parseOrderHeader(lines, currentLineIndex);
            parsedData.orderInfo = orderParseResult.orderInfo;
            currentLineIndex = orderParseResult.nextLineIndex;
        } catch (error) {
            throw new Error(`Failed to parse order header: ${error.message}`);
        }
        
        // Parse each pallet sequentially
        for (let palletIndex = 0; palletIndex < parsedData.orderInfo.palletQuantity; palletIndex++) {
            try {
                const palletParseResult = this.parseSinglePallet(lines, currentLineIndex, palletIndex);
                parsedData.pallets.push(palletParseResult.palletData);
                currentLineIndex = palletParseResult.nextLineIndex;
            } catch (error) {
                console.error(`Failed to parse pallet ${palletIndex + 1}:`, error.message);
                throw new Error(`Failed to parse pallet ${palletIndex + 1}: ${error.message}`);
            }
        }
        
        // Store parsed data and assign colors
        this.allPallets = parsedData.pallets;
        this.orderInfo = parsedData.orderInfo;
        this.assignItemTypeColors();
        
        return parsedData;
    }
    
    /**
     * Parse the order header section
     * @param {Array} lines - File lines
     * @param {number} startIndex - Starting line index
     * @returns {Object} Order info and next line index
     */
    parseOrderHeader(lines, startIndex) {
        let currentIndex = startIndex;
        const orderInfo = {};
        
        // Parse [order_id]
        if (!lines[currentIndex] || lines[currentIndex] !== '[order_id]') {
            throw new Error(`Expected [order_id] at line ${currentIndex + 1}, found: ${lines[currentIndex]}`);
        }
        currentIndex++;
        
        orderInfo.orderId = parseInt(lines[currentIndex]);
        if (isNaN(orderInfo.orderId)) {
            throw new Error(`Invalid order ID at line ${currentIndex + 1}: ${lines[currentIndex]}`);
        }
        currentIndex++;
        
        // Parse [pallet_quantity]
        if (!lines[currentIndex] || lines[currentIndex] !== '[pallet_quantity]') {
            throw new Error(`Expected [pallet_quantity] at line ${currentIndex + 1}, found: ${lines[currentIndex]}`);
        }
        currentIndex++;
        
        orderInfo.palletQuantity = parseInt(lines[currentIndex]);
        if (isNaN(orderInfo.palletQuantity) || orderInfo.palletQuantity <= 0) {
            throw new Error(`Invalid pallet quantity at line ${currentIndex + 1}: ${lines[currentIndex]}`);
        }
        currentIndex++;
        
        return {
            orderInfo: orderInfo,
            nextLineIndex: currentIndex
        };
    }
    
    /**
     * Parse a single pallet section
     * @param {Array} lines - File lines
     * @param {number} startIndex - Starting line index
     * @param {number} palletIndex - Pallet index
     * @returns {Object} Pallet data and next line index
     */
    parseSinglePallet(lines, startIndex, palletIndex) {
        let currentIndex = startIndex;
        const palletData = {
            id: palletIndex,
            metadata: {},
            boxes: []
        };
        
        // Parse pallet header
        const palletHeaderResult = this.parsePalletHeader(lines, currentIndex);
        palletData.metadata = palletHeaderResult.metadata;
        currentIndex = palletHeaderResult.nextLineIndex;
        
        // Parse volume metrics
        const volumeMetricsResult = this.parseVolumeMetrics(lines, currentIndex);
        palletData.metadata.volumeMetrics = volumeMetricsResult.metrics;
        currentIndex = volumeMetricsResult.nextLineIndex;
        
        // Parse item quantity
        const itemQuantityResult = this.parseItemQuantity(lines, currentIndex);
        const expectedBoxCount = itemQuantityResult.itemQuantity;
        currentIndex = itemQuantityResult.nextLineIndex;
        
        // Parse all boxes for this pallet
        for (let boxIndex = 0; boxIndex < expectedBoxCount; boxIndex++) {
            try {
                const boxParseResult = this.parseBoxData(lines, currentIndex, boxIndex);
                palletData.boxes.push(boxParseResult.boxData);
                currentIndex = boxParseResult.nextLineIndex;
            } catch (error) {
                throw new Error(`Failed to parse box ${boxIndex + 1} in pallet ${palletIndex + 1}: ${error.message}`);
            }
        }
        
        // Validate box count
        if (palletData.boxes.length !== expectedBoxCount) {
            throw new Error(`Box count mismatch in pallet ${palletIndex + 1}: expected ${expectedBoxCount}, got ${palletData.boxes.length}`);
        }
        
        return {
            palletData: palletData,
            nextLineIndex: currentIndex
        };
    }
    
    /**
     * Parse pallet header line: [pallet_id x y z weight total_load]
     */
    parsePalletHeader(lines, startIndex) {
        let currentIndex = startIndex;
        
        if (!lines[currentIndex] || !lines[currentIndex].includes('pallet_id')) {
            throw new Error(`Expected pallet header at line ${currentIndex + 1}, found: ${lines[currentIndex]}`);
        }
        currentIndex++;
        
        const headerData = lines[currentIndex].split('\t').map(s => s.trim());
        if (headerData.length < 6) {
            throw new Error(`Invalid pallet header format at line ${currentIndex + 1}: ${lines[currentIndex]}`);
        }
        
        const metadata = {
            palletId: parseInt(headerData[0]),
            dimensions: {
                x: parseFloat(headerData[1]),
                y: parseFloat(headerData[2]), 
                z: parseFloat(headerData[3])
            },
            weight: parseFloat(headerData[4]),
            totalLoad: parseFloat(headerData[5])
        };
        
        currentIndex++;
        return {
            metadata: metadata,
            nextLineIndex: currentIndex
        };
    }
    
    /**
     * Parse volume metrics line: [total_volume total_occupied_volume m1 m2]
     */
    parseVolumeMetrics(lines, startIndex) {
        let currentIndex = startIndex;
        
        if (!lines[currentIndex] || !lines[currentIndex].includes('total_volume')) {
            throw new Error(`Expected volume metrics at line ${currentIndex + 1}, found: ${lines[currentIndex]}`);
        }
        currentIndex++;
        
        const metricsData = lines[currentIndex].split('\t').map(s => s.trim());
        if (metricsData.length < 4) {
            throw new Error(`Invalid volume metrics format at line ${currentIndex + 1}: ${lines[currentIndex]}`);
        }
        
        const metrics = {
            totalVolume: parseFloat(metricsData[0]),
            occupiedVolume: parseFloat(metricsData[1]),
            efficiency1: parseFloat(metricsData[2]),
            efficiency2: parseFloat(metricsData[3])
        };
        
        currentIndex++;
        return {
            metrics: metrics,
            nextLineIndex: currentIndex
        };
    }
    
    /**
     * Parse item quantity line and skip descriptive header
     */
    parseItemQuantity(lines, startIndex) {
        let currentIndex = startIndex;
        
        if (!lines[currentIndex] || lines[currentIndex] !== '[item_quantity]') {
            throw new Error(`Expected [item_quantity] at line ${currentIndex + 1}, found: ${lines[currentIndex]}`);
        }
        currentIndex++;
        
        const itemQuantity = parseInt(lines[currentIndex]);
        if (isNaN(itemQuantity) || itemQuantity < 0) {
            throw new Error(`Invalid item quantity at line ${currentIndex + 1}: ${lines[currentIndex]}`);
        }
        currentIndex++;
        
        // Skip descriptive header line if present
        if (currentIndex < lines.length && 
            lines[currentIndex] && 
            lines[currentIndex].includes('xmin') && 
            lines[currentIndex].includes('sequence')) {
            currentIndex++;
        }
        
        return {
            itemQuantity: itemQuantity,
            nextLineIndex: currentIndex
        };
    }
    
    /**
     * Parse individual box data line
     * Format: [xmin ymin zmin xmax ymax zmax sequence item_type weight k irregular]
     */
    parseBoxData(lines, startIndex, boxIndex) {
        let currentIndex = startIndex;
        
        if (currentIndex >= lines.length) {
            throw new Error(`Reached end of file while looking for box ${boxIndex + 1} data at line ${currentIndex + 1}`);
        }
        
        if (!lines[currentIndex]) {
            throw new Error(`Missing box data at line ${currentIndex + 1} for box ${boxIndex + 1}`);
        }
        
        // Validate line format
        const lineContent = lines[currentIndex].trim();
        if (lineContent.startsWith('[') || lineContent.includes('pallet_id') || lineContent.includes('total_volume') || lineContent.includes('item_quantity')) {
            throw new Error(`Expected box data at line ${currentIndex + 1}, but found header: "${lineContent}"`);
        }
        
        const boxData = lines[currentIndex].split('\t').map(s => s.trim());
        if (boxData.length < 11) {
            throw new Error(`Invalid box data format at line ${currentIndex + 1}: expected 11 fields, got ${boxData.length}. Content: "${lines[currentIndex]}"`);
        }
        
        // Validate coordinate data
        for (let i = 0; i < 6; i++) {
            if (isNaN(parseFloat(boxData[i]))) {
                throw new Error(`Invalid coordinate data at line ${currentIndex + 1}, field ${i + 1}: "${boxData[i]}" is not a number`);
            }
        }
        
        // Parse coordinates and convert from mm to 3D units
        const box = {
            coordinates: {
                xmin: parseFloat(boxData[0]),
                ymin: parseFloat(boxData[1]), 
                zmin: parseFloat(boxData[2]),
                xmax: parseFloat(boxData[3]),
                ymax: parseFloat(boxData[4]),
                zmax: parseFloat(boxData[5])
            },
            position: {
                x: (parseFloat(boxData[0]) + parseFloat(boxData[3])) / 2 * 0.01,
                y: (parseFloat(boxData[2]) + parseFloat(boxData[5])) / 2 * 0.01,
                z: (parseFloat(boxData[1]) + parseFloat(boxData[4])) / 2 * 0.01
            },
            dimensions: {
                width: (parseFloat(boxData[3]) - parseFloat(boxData[0])) * 0.01,
                height: (parseFloat(boxData[5]) - parseFloat(boxData[2])) * 0.01,
                depth: (parseFloat(boxData[4]) - parseFloat(boxData[1])) * 0.01
            },
            sequence: parseInt(boxData[6]),
            itemType: parseInt(boxData[7]),
            weight: parseFloat(boxData[8]),
            k: parseFloat(boxData[9]),
            irregular: parseInt(boxData[10])
        };
        
        // Adjust position relative to pallet center
        box.position.x -= 6.0;  
        box.position.z -= 4.0;  
        box.position.y += 0.72 -8; 
        
        currentIndex++;
        return {
            boxData: box,
            nextLineIndex: currentIndex
        };
    }
    
    /**
     * Assign consistent colors to item types across all pallets
     */
    assignItemTypeColors() {
        const allItemTypes = new Set();
        this.allPallets.forEach(pallet => {
            pallet.boxes.forEach(box => {
                allItemTypes.add(box.itemType);
            });
        });
        
        const itemTypeArray = Array.from(allItemTypes).sort((a, b) => a - b);
        itemTypeArray.forEach((itemType, index) => {
            const colorIndex = index % this.colorPalette.length;
            this.itemTypeColors.set(itemType, this.colorPalette[colorIndex]);
        });
    }
    
    /**
     * Load a specific pallet for 3D visualization
     * @param {number} palletIndex - Index of pallet to load
     */
    loadPallet(palletIndex) {
        if (palletIndex < 0 || palletIndex >= this.allPallets.length) {
            console.error('Invalid pallet index:', palletIndex);
            return;
        }
        
        this.clearCurrentBoxes();
        this.currentPalletIndex = palletIndex;
        const currentPallet = this.allPallets[palletIndex];
        
        const sortedBoxes = [...currentPallet.boxes].sort((a, b) => a.sequence - b.sequence);
        
        sortedBoxes.forEach((boxData, index) => {
            const delay = index * this.animationSpeed;
            
            const timeoutId = setTimeout(() => {
                this.createAndAddBox(boxData);
                
                // Check if this was the last box and notify main app
                if (index === sortedBoxes.length - 1) {
                    setTimeout(() => {
                        if (window.palletApp && window.palletApp.setAnimationCompleted) {
                            window.palletApp.setAnimationCompleted();
                        }
                    }, 100);
                }
            }, delay);
            
            this.animationTimeouts.push(timeoutId);
        });
    }
    
    /**
     * Create a 3D box mesh and add it to the scene
     * @param {Object} boxData - Box data from parsed file
     */
    createAndAddBox(boxData) {
        const geometry = new THREE.BoxGeometry(
            boxData.dimensions.width,
            boxData.dimensions.height,
            boxData.dimensions.depth
        );
        
        const color = this.itemTypeColors.get(boxData.itemType) || 0x808080;
        
        const material = new THREE.MeshLambertMaterial({ 
            color: color,
            transparent: true,
            opacity: 0.9 
        });
        
        const box = new THREE.Mesh(geometry, material);
        
        box.position.set(
            boxData.position.x,
            boxData.position.y,
            boxData.position.z
        );
        
        box.castShadow = true;
        box.receiveShadow = true;
        
        box.userData = {
            sequence: boxData.sequence,
            itemType: boxData.itemType,
            weight: boxData.weight,
            originalCoordinates: boxData.coordinates
        };
        
        this.simulator.scene.add(box);
        this.simulator.boxes.push(box);
    }
    
    /**
     * Navigate to previous pallet
     */
    previousPallet() {
        if (this.currentPalletIndex > 0) {
            this.loadPallet(this.currentPalletIndex - 1);
        }
    }
    
    /**
     * Navigate to next pallet
     */
    nextPallet() {
        if (this.currentPalletIndex < this.allPallets.length - 1) {
            this.loadPallet(this.currentPalletIndex + 1);
        }
    }
    
    /**
     * Clear all current boxes from the scene
     */
    clearCurrentBoxes() {
        this.animationTimeouts.forEach(timeoutId => {
            clearTimeout(timeoutId);
        });
        this.animationTimeouts = [];
        
        this.simulator.boxes.forEach(box => {
            this.simulator.scene.remove(box);
            if (box.geometry) box.geometry.dispose();
            if (box.material) box.material.dispose();
        });
        this.simulator.boxes = [];
    }
    
    /**
     * Get total box count across all pallets
     * @returns {number} Total number of boxes
     */
    getTotalBoxCount() {
        return this.allPallets.reduce((total, pallet) => total + pallet.boxes.length, 0);
    }
    
    /**
     * Get comprehensive statistics about loaded data
     * @returns {Object|null} Statistics object or null if no data
     */
    getStatistics() {
        if (this.allPallets.length === 0) {
            return null;
        }
        
        const stats = {
            totalPallets: this.allPallets.length,
            totalBoxes: this.getTotalBoxCount(),
            itemTypes: this.itemTypeColors.size,
            averageBoxesPerPallet: Math.round(this.getTotalBoxCount() / this.allPallets.length),
            palletDetails: this.allPallets.map((pallet, index) => ({
                id: index + 1,
                boxCount: pallet.boxes.length,
                efficiency: pallet.metadata.volumeMetrics ? 
                    (pallet.metadata.volumeMetrics.efficiency1 * 100).toFixed(1) + '%' : 'N/A'
            }))
        };
        
        return stats;
    }
}

window.PalletDataLoader = PalletDataLoader;