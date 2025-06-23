/**
 * Pallet Data Loader - Crosslog Format Parser FIXED
 * 
 * CORRECTIONS APPLIED:
 * - Proper animation completion detection
 * - Calls main app's setAnimationCompleted() when last box is placed
 * - Better integration with timer system
 * 
 * Save this as: GUI/3d-viewer/js/pallet-loader.js
 */

class PalletDataLoader {
    constructor(simulator) {
        // Reference to the 3D simulator for adding/removing boxes
        this.simulator = simulator;
        
        // Data storage for parsed information
        this.allPallets = [];           // Array of all parsed pallets
        this.currentPalletIndex = 0;    // Currently selected pallet
        this.orderInfo = {};            // Order metadata
        
        // Animation control
        this.animationSpeed = 500;      // Milliseconds between box placements
        this.animationTimeouts = [];    // Track active timeouts for cleanup
        
        // Color system for different item types
        this.itemTypeColors = new Map(); // Maps item_type to consistent colors
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
        
        console.log('PalletDataLoader initialized with animation speed:', this.animationSpeed, 'ms');
    }
    
    /**
     * Parse a complete Crosslog data file
     * This method processes the entire file structure and extracts all pallets
     */
    parseDataFile(fileContent) {
        console.log('=== Starting Crosslog Data Parsing ===');
        console.log('File size:', fileContent.length, 'characters');
        
        // Clean and split the file into lines
        const lines = fileContent.trim().split('\n').map(line => line.trim()).filter(line => line.length > 0);
        console.log('Total lines to process:', lines.length);
        
        // Initialize parsing state
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
            
            console.log('✓ Order header parsed:', parsedData.orderInfo);
        } catch (error) {
            throw new Error(`Failed to parse order header: ${error.message}`);
        }
        
        // Parse each pallet sequentially
        for (let palletIndex = 0; palletIndex < parsedData.orderInfo.palletQuantity; palletIndex++) {
            try {
                console.log(`--- Parsing Pallet ${palletIndex + 1} ---`);
                
                const palletParseResult = this.parseSinglePallet(lines, currentLineIndex, palletIndex);
                parsedData.pallets.push(palletParseResult.palletData);
                currentLineIndex = palletParseResult.nextLineIndex;
                
                console.log(`✓ Pallet ${palletIndex + 1} parsed:`, palletParseResult.palletData.boxes.length, 'boxes');
                
            } catch (error) {
                console.error(`✗ Failed to parse pallet ${palletIndex + 1}:`, error.message);
                throw new Error(`Failed to parse pallet ${palletIndex + 1}: ${error.message}`);
            }
        }
        
        // Store the parsed data and prepare for visualization
        this.allPallets = parsedData.pallets;
        this.orderInfo = parsedData.orderInfo;
        
        // Assign consistent colors to item types across all pallets
        this.assignItemTypeColors();
        
        console.log('✓ Crosslog parsing completed successfully!');
        console.log('  - Total pallets loaded:', this.allPallets.length);
        console.log('  - Total boxes across all pallets:', this.getTotalBoxCount());
        console.log('  - Unique item types found:', this.itemTypeColors.size);
        
        return parsedData;
    }
    
    /**
     * Parse the order header section of the Crosslog file
     * This extracts order ID and total pallet quantity
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
     * Parse a single pallet section from the Crosslog data
     * This is the missing function that coordinates parsing one complete pallet
     */
    parseSinglePallet(lines, startIndex, palletIndex) {
        let currentIndex = startIndex;
        const palletData = {
            id: palletIndex,
            metadata: {},
            boxes: []
        };
        
        console.log(`Starting to parse pallet ${palletIndex + 1} from line ${currentIndex + 1}`);
        
        // Parse pallet header: [pallet_id x y z weight total_load]
        const palletHeaderResult = this.parsePalletHeader(lines, currentIndex);
        palletData.metadata = palletHeaderResult.metadata;
        currentIndex = palletHeaderResult.nextLineIndex;
        console.log(`Pallet header parsed, now at line ${currentIndex + 1}`);
        
        // Parse volume metrics: [total_volume total_occupied_volume m1 m2]
        const volumeMetricsResult = this.parseVolumeMetrics(lines, currentIndex);
        palletData.metadata.volumeMetrics = volumeMetricsResult.metrics;
        currentIndex = volumeMetricsResult.nextLineIndex;
        console.log(`Volume metrics parsed, now at line ${currentIndex + 1}`);
        
        // Parse item quantity: [item_quantity]
        const itemQuantityResult = this.parseItemQuantity(lines, currentIndex);
        const expectedBoxCount = itemQuantityResult.itemQuantity;
        currentIndex = itemQuantityResult.nextLineIndex;
        console.log(`Expected ${expectedBoxCount} boxes, starting box parsing at line ${currentIndex + 1}`);
        
        // Parse all boxes for this pallet with enhanced debugging
        for (let boxIndex = 0; boxIndex < expectedBoxCount; boxIndex++) {
            try {
                const boxParseResult = this.parseBoxData(lines, currentIndex, boxIndex);
                palletData.boxes.push(boxParseResult.boxData);
                currentIndex = boxParseResult.nextLineIndex;
                
                // Only log every 10th box to avoid console spam, plus first and last
                if (boxIndex === 0 || boxIndex === expectedBoxCount - 1 || (boxIndex + 1) % 10 === 0) {
                    console.log(`Parsed box ${boxIndex + 1}/${expectedBoxCount} for pallet ${palletIndex + 1}, next line: ${currentIndex + 1}`);
                }
            } catch (error) {
                throw new Error(`Failed to parse box ${boxIndex + 1} in pallet ${palletIndex + 1}: ${error.message}`);
            }
        }
        
        // Final validation and logging
        console.log(`Finished parsing ${expectedBoxCount} boxes for pallet ${palletIndex + 1}`);
        console.log(`Current line index: ${currentIndex + 1}, total lines: ${lines.length}`);
        
        // Check if we have more content to parse
        if (currentIndex < lines.length) {
            console.log(`Next line content: "${lines[currentIndex]}"`);
        }
        
        // Validate that we got the expected number of boxes
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
     * Parse item quantity line and skip the descriptive header that follows
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
        
        // NEW: Skip the descriptive header line that follows
        // This line looks like: [xmin ymin zmin xmax ymax zmax sequence item_type weight k irregular]
        if (currentIndex < lines.length && 
            lines[currentIndex] && 
            lines[currentIndex].includes('xmin') && 
            lines[currentIndex].includes('sequence')) {
            
            console.log(`Skipping descriptive header at line ${currentIndex + 1}: "${lines[currentIndex]}"`);
            currentIndex++; // Skip the header line
        }
        
        console.log(`Item quantity parsed: ${itemQuantity} boxes, ready to parse data starting at line ${currentIndex + 1}`);
        
        return {
            itemQuantity: itemQuantity,
            nextLineIndex: currentIndex
        };
    }
    
    /**
     * Parse individual box data line with enhanced validation
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
        
        // Check if this line looks like box data (should start with numbers, not brackets)
        const lineContent = lines[currentIndex].trim();
        if (lineContent.startsWith('[') || lineContent.includes('pallet_id') || lineContent.includes('total_volume') || lineContent.includes('item_quantity')) {
            throw new Error(`Expected box data at line ${currentIndex + 1}, but found header: "${lineContent}"`);
        }
        
        const boxData = lines[currentIndex].split('\t').map(s => s.trim());
        if (boxData.length < 11) {
            throw new Error(`Invalid box data format at line ${currentIndex + 1}: expected 11 fields, got ${boxData.length}. Content: "${lines[currentIndex]}"`);
        }
        
        // Validate that the first few fields are numbers (basic sanity check)
        for (let i = 0; i < 6; i++) {
            if (isNaN(parseFloat(boxData[i]))) {
                throw new Error(`Invalid coordinate data at line ${currentIndex + 1}, field ${i + 1}: "${boxData[i]}" is not a number`);
            }
        }
        
        // Parse coordinates and convert from mm to our 3D units
        const box = {
            // Original coordinates in mm
            coordinates: {
                xmin: parseFloat(boxData[0]),
                ymin: parseFloat(boxData[1]), 
                zmin: parseFloat(boxData[2]),
                xmax: parseFloat(boxData[3]),
                ymax: parseFloat(boxData[4]),
                zmax: parseFloat(boxData[5])
            },
            // Calculate box center and dimensions in our 3D units
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
            // Metadata
            sequence: parseInt(boxData[6]),
            itemType: parseInt(boxData[7]),
            weight: parseFloat(boxData[8]),
            k: parseFloat(boxData[9]),
            irregular: parseInt(boxData[10])
        };
        
        // Adjust position to be relative to pallet center
        box.position.x -= 6.0;  
        box.position.z -= 4.0;  
        box.position.y += 0.72; 
        
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
        console.log('--- Assigning Item Type Colors ---');
        
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
            console.log(`Item type ${itemType} → Color #${this.colorPalette[colorIndex].toString(16)}`);
        });
        
        console.log(`✓ Assigned colors to ${this.itemTypeColors.size} unique item types`);
    }
    
    /**
     * FIXED: Load a specific pallet for 3D visualization with proper completion detection
     */
    loadPallet(palletIndex) {
        if (palletIndex < 0 || palletIndex >= this.allPallets.length) {
            console.error('Invalid pallet index:', palletIndex);
            return;
        }
        
        console.log(`=== Loading Pallet ${palletIndex + 1} for Visualization ===`);
        
        this.clearCurrentBoxes();
        this.currentPalletIndex = palletIndex;
        const currentPallet = this.allPallets[palletIndex];
        
        console.log('Pallet metadata:', currentPallet.metadata);
        console.log('Starting animation for', currentPallet.boxes.length, 'boxes');
        
        const sortedBoxes = [...currentPallet.boxes].sort((a, b) => a.sequence - b.sequence);
        
        sortedBoxes.forEach((boxData, index) => {
            const delay = index * this.animationSpeed;
            
            const timeoutId = setTimeout(() => {
                this.createAndAddBox(boxData);
                if ((index + 1) % 10 === 0 || index === sortedBoxes.length - 1) {
                    console.log(`Box ${index + 1}/${sortedBoxes.length} placed (sequence ${boxData.sequence}, type ${boxData.itemType})`);
                }
                
                // FIXED: Check if this was the last box and notify main app
                if (index === sortedBoxes.length - 1) {
                    console.log('🎯 LAST BOX PLACED - Animation Complete!');
                    
                    // Notify main application that animation is complete
                    setTimeout(() => {
                        if (window.palletApp && window.palletApp.setAnimationCompleted) {
                            window.palletApp.setAnimationCompleted();
                        }
                    }, 100); // Small delay to ensure box is fully rendered
                }
            }, delay);
            
            this.animationTimeouts.push(timeoutId);
        });
        
        console.log(`✓ Animation started - ${sortedBoxes.length} boxes will be placed over ${(sortedBoxes.length * this.animationSpeed / 1000).toFixed(1)} seconds`);
    }
    
    /**
     * Create a 3D box mesh and add it to the scene
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
     * Navigation methods
     */
    previousPallet() {
        if (this.currentPalletIndex > 0) {
            this.loadPallet(this.currentPalletIndex - 1);
        } else {
            console.log('Already at first pallet');
        }
    }
    
    nextPallet() {
        if (this.currentPalletIndex < this.allPallets.length - 1) {
            this.loadPallet(this.currentPalletIndex + 1);
        } else {
            console.log('Already at last pallet');
        }
    }
    
    /**
     * Clear all current boxes from the scene
     */
    clearCurrentBoxes() {
        console.log('Clearing current boxes and animations...');
        
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
        
        console.log('✓ Scene cleared and resources disposed');
    }
    
    /**
     * Utility methods
     */
    getTotalBoxCount() {
        return this.allPallets.reduce((total, pallet) => total + pallet.boxes.length, 0);
    }
    
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