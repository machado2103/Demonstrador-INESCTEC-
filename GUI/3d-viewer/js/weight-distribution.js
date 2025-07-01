/**
 * Weight Distribution Calculator
 */

class WeightDistributionCalculator {
    constructor() {
        this.gridConfig = {
            rows: 16,        
            cols: 24,        
            totalCells: 384  
        };
        
        this.palletDimensions = {
            length: 12.0,    // X-axis: 1200mm = 12 units
            width: 8.0,      // Z-axis: 800mm = 8 units
            centerX: 0,      
            centerZ: 0       
        };
        
        this.cellDimensions = {
            width: this.palletDimensions.length / this.gridConfig.cols,   // 0.5 units per cell
            height: this.palletDimensions.width / this.gridConfig.rows,   // 0.5 units per cell
            cellSizeMm: 50   
        };
        
        //Weight distribution is 2D only (horizontal projection)
        this.weightGrid = new Array(this.gridConfig.totalCells).fill(0);
        this.totalWeight = 0;
        this.maxCellWeight = 0;
        
        // DEBUG: Track individual box contributions for verification
        this.boxContributions = [];
        this.centerOfMassDebug = {
            rawCalculation: { x: 0, y: 0, z: 0 },
            totalWeight: 0,
            boxCount: 0,
            individualBoxes: []
        };
        
        this.colorConfig = {
            // 10-color gradient from green to red (10% increments each)
            colors: {
    level0: '#064E3B',    // Emerald-900
    level1: '#047857',    // Emerald-700
    level2: '#059669',    // Emerald-600
    level3: '#10B981',    // Emerald-500
    level4: '#34D399',    // Emerald-400
    level5: '#6EE7B7',    // Emerald-300
    level6: '#FBBF24',    // Amber-400 (much better than harsh yellow)
    level7: '#F59E0B',    // Amber-500
    level8: '#DC2626',    // Red-600
    level9: '#991B1B',    // Red-800
    empty: '#F9FAFB'
            },
            
            // 10 threshold levels (10% increments)
            thresholds: {
                level0: 0.10,    // 0-10%
                level1: 0.20,    // 10-20%
                level2: 0.30,    // 20-30%
                level3: 0.40,    // 30-40%
                level4: 0.50,    // 40-50%
                level5: 0.60,    // 50-60%
                level6: 0.70,    // 60-70%
                level7: 0.80,    // 70-80%
                level8: 0.90,    // 80-90%
                level9: 1.00     // 90-100%
            },

            // Legend information for display
            legendInfo: [
                { key: 'level0', color: '#064E3B' },
                { key: 'level1', color: '#047857' },
                { key: 'level2', color: '#059669' },
                { key: 'level3', color: '#10B981' },
                { key: 'level4', color: '#34D399' },
                { key: 'level5', color: '#6EE7B7' },
                { key: 'level6', color: '#FBBF24' },
                { key: 'level7', color: '#F59E0B' },
                { key: 'level8', color: '#DC2626' },
                { key: 'level9', color: '#991B1B' }
            ],
            
            // Human-readable category names
            categoryNames: {
                empty: 'No Weight',
                level0: 'Minimal (0-10%)',
                level1: 'Very Low (10-20%)',
                level2: 'Low (20-30%)',
                level3: 'Low-Medium (30-40%)',
                level4: 'Medium (40-50%)',
                level5: 'Medium-High (50-60%)',
                level6: 'High (60-70%)',
                level7: 'Very High (70-80%)',
                level8: 'Extreme (80-90%)',
                level9: 'Maximum (90-100%)'
            }
        };
        
        this.heatmapElement = null;
        this.legendElement = null;

        this.centerOfMassPoint = {
            element: null,
            isVisible: false,
            currentPosition: { x: 0, z: 0 }, // Only 2D for weight distribution
            lastUpdate: 0,
            coordinateHistory: []
        };
        
        this.isDebugMode = true; // Enable debug by default to verify calculations
        
        this.initializeCompleteSystem();
    }
    
    /**
     * MAIN METHOD: Calculate 2D weight distribution (horizontal projection only)
     * This represents how weight is distributed on the pallet base
     */
    calculateWeightDistribution(boxes) {
        
        this.resetGrid();
        this.resetDebugData();
        
        if (!boxes || boxes.length === 0) {
            this.updateHeatmapDisplay();
            return this.getDistributionSummary();
        }
        
        // Process each box and track for debugging
        let processedBoxes = 0;
        let totalWeightProcessed = 0;
        
        boxes.forEach((box, index) => {
            try {
                const result = this.processBoxWeight2D(box, index);
                if (result.success) {
                    processedBoxes++;
                    totalWeightProcessed += result.weight;
                    
                    // DEBUG: Store individual box data
                    this.centerOfMassDebug.individualBoxes.push({
                        index: index,
                        position: { x: box.position.x, y: box.position.y, z: box.position.z },
                        weight: result.weight,
                        weightContributionX: result.weight * box.position.x,
                        weightContributionZ: result.weight * box.position.z
                    });
                }
            } catch (error) {
                console.warn(`Error processing box ${index}:`, error.message);
            }
        });
        
        // FIXED: Calculate center of mass manually to verify
        this.calculateAndVerifyCenterOfMass();
        
        this.calculateFinalStatistics();
        this.updateHeatmapDisplay();
        

        
        return this.getDistributionSummary();
    }
    
    /**
     * FIXED: Process individual box for 2D weight distribution only
     */
    processBoxWeight2D(box, index) {
        const weightData = this.extractAndValidateBoxWeight(box, index);
        
        if (!weightData.isValid) {
            return { success: false, reason: weightData.reason };
        }
        
        const weight = weightData.weightKg;
        const bounds = this.calculateBoxBounds2D(box); // Only horizontal bounds
        
        const affectedCells = this.findAffectedCells(bounds);
        this.distributeWeightToCells2D(weight, bounds, affectedCells, index);
        
        this.totalWeight += weight;
        
        return { 
            success: true, 
            weight: weight,
            cellsAffected: affectedCells.length,
            horizontalPosition: { x: box.position.x, z: box.position.z }
        };
    }
    
    /**
     * Extract and validate box weight - always assumes input is in grams
     */
    extractAndValidateBoxWeight(box, index) {
        if (!box.userData || typeof box.userData.weight !== 'number') {
            return {
                isValid: false,
                reason: `Box ${index} missing weight data`,
                weightKg: 0
            };
        }
        
        const rawWeightGrams = box.userData.weight;
        
        if (rawWeightGrams <= 0) {
            return {
                isValid: false,
                reason: `Box ${index} has invalid weight: ${rawWeightGrams}`,
                weightKg: 0
            };
        }
        
        const weightKg = rawWeightGrams / 1000;
        
        return {
            isValid: true,
            weightKg: weightKg,
            originalWeightGrams: rawWeightGrams
        };
    }
    
    /**
     * FIXED: Calculate 2D bounds only (ignore height Y)
     */
    calculateBoxBounds2D(box) {
        const pos = box.position;
        const geom = box.geometry.parameters;
        
        return {
            minX: pos.x - (geom.width / 2),
            maxX: pos.x + (geom.width / 2),
            minZ: pos.z - (geom.depth / 2),
            maxZ: pos.z + (geom.depth / 2),
            area: geom.width * geom.depth, // Horizontal area only
            centerX: pos.x,
            centerZ: pos.z
            // Note: No Y coordinate - this is 2D projection
        };
    }
    
    /**
     * FIXED: Distribute weight in 2D only
     */
    distributeWeightToCells2D(totalWeight, boxBounds, affectedCells, boxIndex) {
        if (affectedCells.length === 0) return;
        
        const totalIntersectionArea = affectedCells.reduce((sum, cell) => sum + cell.intersectionArea, 0);
        if (totalIntersectionArea === 0) return;
        
        affectedCells.forEach(cell => {
            const weightProportion = cell.intersectionArea / totalIntersectionArea;
            const cellWeight = totalWeight * weightProportion;
            
            // Only 2D weight distribution
            this.weightGrid[cell.index] += cellWeight;
            
            // DEBUG: Track contributions
            this.boxContributions.push({
                boxIndex: boxIndex,
                cellIndex: cell.index,
                cellRow: cell.row,
                cellCol: cell.col,
                weight: cellWeight,
                proportion: weightProportion
            });
        });
    }
    
    /**
     * CRITICAL FIX: Calculate center of mass using PALLET BASE as reference
     * The pallet is positioned at Y = -8, so we need to account for this offset
     */
    calculateAndVerifyCenterOfMass() {
        let totalWeightedX = 0;
        let totalWeightedZ = 0;
        let totalWeight = 0;
        
        // FIXED: Calculate center of mass relative to pallet base, not (0,0,0)
        const PALLET_Y_OFFSET = -8; // Pallet position in scene
        const PALLET_HEIGHT = 1.44;
        const PALLET_BASE_Y = PALLET_Y_OFFSET - (PALLET_HEIGHT / 2); // True pallet base level
        
        this.centerOfMassDebug.individualBoxes.forEach(box => {
            // Use horizontal coordinates as-is (they're correct)
            totalWeightedX += box.weightContributionX;
            totalWeightedZ += box.weightContributionZ;
            totalWeight += box.weight;
        });
        
        if (totalWeight > 0) {
            // Calculate horizontal center of mass (relative to pallet center, which is correct)
            this.centerOfMassDebug.rawCalculation.x = totalWeightedX / totalWeight;
            this.centerOfMassDebug.rawCalculation.z = totalWeightedZ / totalWeight;
            this.centerOfMassDebug.totalWeight = totalWeight;
            this.centerOfMassDebug.boxCount = this.centerOfMassDebug.individualBoxes.length;
            
            // NEW: Calculate vertical center of mass relative to pallet base
            let totalWeightedY = 0;
            this.centerOfMassDebug.individualBoxes.forEach(box => {
                // Adjust Y coordinate to be relative to pallet base
                const relativeY = box.position.y - PALLET_BASE_Y;
                totalWeightedY += box.weight * relativeY;
            });
            this.centerOfMassDebug.rawCalculation.y = totalWeightedY / totalWeight;
        }
        
        // Compare with grid-based calculation
        const gridBasedCenterOfMass = this.calculateCenterOfMassFromGrid();
    
    }
    
    /**
     * NEW: Calculate center of mass from the weight grid
     */
    calculateCenterOfMassFromGrid() {
        let totalWeightedX = 0;
        let totalWeightedZ = 0;
        let totalWeight = 0;
        
        for (let row = 0; row < this.gridConfig.rows; row++) {
            for (let col = 0; col < this.gridConfig.cols; col++) {
                const cellIndex = row * this.gridConfig.cols + col;
                const cellWeight = this.weightGrid[cellIndex];
                
                if (cellWeight > 0) {
                    // Calculate cell center coordinates
                    const palletMinX = -this.palletDimensions.length / 2;
                    const palletMinZ = -this.palletDimensions.width / 2;
                    
                    const cellCenterX = palletMinX + (col + 0.5) * this.cellDimensions.width;
                    const cellCenterZ = palletMinZ + (row + 0.5) * this.cellDimensions.height;
                    
                    totalWeightedX += cellWeight * cellCenterX;
                    totalWeightedZ += cellWeight * cellCenterZ;
                    totalWeight += cellWeight;
                }
            }
        }
        
        if (totalWeight > 0) {
            return {
                x: totalWeightedX / totalWeight,
                z: totalWeightedZ / totalWeight,
                totalWeight: totalWeight
            };
        }
        
        return { x: 0, z: 0, totalWeight: 0 };
    }
    
    /**
     * Find affected cells (unchanged but verified)
     */
    findAffectedCells(bounds) {
        const affectedCells = [];
        
        const palletMinX = -this.palletDimensions.length / 2;  // -6.0
        const palletMaxX = this.palletDimensions.length / 2;   // +6.0
        const palletMinZ = -this.palletDimensions.width / 2;   // -4.0
        const palletMaxZ = this.palletDimensions.width / 2;    // +4.0
        
        for (let row = 0; row < this.gridConfig.rows; row++) {
            for (let col = 0; col < this.gridConfig.cols; col++) {
                const cellMinX = palletMinX + (col * this.cellDimensions.width);
                const cellMaxX = cellMinX + this.cellDimensions.width;
                const cellMinZ = palletMinZ + (row * this.cellDimensions.height);
                const cellMaxZ = cellMinZ + this.cellDimensions.height;
                
                const intersection = this.calculateIntersection(bounds, {
                    minX: cellMinX, maxX: cellMaxX,
                    minZ: cellMinZ, maxZ: cellMaxZ
                });
                
                if (intersection.area > 0) {
                    const cellIndex = row * this.gridConfig.cols + col;
                    affectedCells.push({
                        index: cellIndex,
                        row: row,
                        col: col,
                        intersectionArea: intersection.area,
                        bounds: { minX: cellMinX, maxX: cellMaxX, minZ: cellMinZ, maxZ: cellMaxZ },
                        centerX: (cellMinX + cellMaxX) / 2,
                        centerZ: (cellMinZ + cellMaxZ) / 2
                    });
                }
            }
        }
        
        return affectedCells;
    }
    
    /**
     * Calculate rectangle intersection
     */
    calculateIntersection(rect1, rect2) {
        const minX = Math.max(rect1.minX, rect2.minX);
        const maxX = Math.min(rect1.maxX, rect2.maxX);
        const minZ = Math.max(rect1.minZ, rect2.minZ);
        const maxZ = Math.min(rect1.maxZ, rect2.maxZ);
        
        if (minX < maxX && minZ < maxZ) {
            const area = (maxX - minX) * (maxZ - minZ);
            return { area: area, minX: minX, maxX: maxX, minZ: minZ, maxZ: maxZ };
        } else {
            return { area: 0 };
        }
    }
    
    /**
     * FIXED: Corrected center of mass to heatmap position conversion
     */
    convertCenterOfMassToHeatmapPosition(centerX, centerZ) {
        if (typeof centerX !== 'number' || typeof centerZ !== 'number') {
            console.warn('Invalid center of mass coordinates:', { centerX, centerZ });
            return { x: 50, z: 50, isWithinBounds: false };
        }
        
        const palletHalfLength = this.palletDimensions.length / 2;  // 6.0
        const palletHalfWidth = this.palletDimensions.width / 2;    // 4.0
        
        // CORRECTED: Proper coordinate system conversion
        const xPercent = ((centerX + palletHalfLength) / this.palletDimensions.length) * 100;
        const zPercent = ((centerZ + palletHalfWidth) / this.palletDimensions.width) * 100;
        
        const clampedX = Math.max(0, Math.min(100, xPercent));
        const clampedZ = Math.max(0, Math.min(100, zPercent));
        
        const isWithinBounds = (xPercent >= 0 && xPercent <= 100 && zPercent >= 0 && zPercent <= 100);
        
        
        return {
            x: clampedX,
            z: clampedZ,
            isWithinBounds: isWithinBounds,
            debug: {
                originalX: centerX,
                originalZ: centerZ,
                xPercent: xPercent,
                zPercent: zPercent
            }
        };
    }
    
    /**
     * Update center of mass point using the VERIFIED calculation
     */
    updateCenterOfMassPoint(centerOfMassData) {
        if (!this.centerOfMassPoint.element) {
            this.initializeCenterOfMassPoint();
            if (!this.centerOfMassPoint.element) {
                console.warn('Failed to initialize center of mass point');
                return;
            }
        }
        
        // FIXED: Use our own verified calculation instead of external data
        const verifiedCenterOfMass = this.centerOfMassDebug.rawCalculation;
        
        if (!verifiedCenterOfMass || 
            typeof verifiedCenterOfMass.x !== 'number' || 
            typeof verifiedCenterOfMass.z !== 'number') {
            this.hideCenterOfMassPoint();
            return;
        }
        
        const position = this.convertCenterOfMassToHeatmapPosition(
            verifiedCenterOfMass.x, 
            verifiedCenterOfMass.z
        );
        
        // Update CSS position
        this.centerOfMassPoint.element.style.left = `${position.x}%`;
        this.centerOfMassPoint.element.style.top = `${position.z}%`;
        
        // Enhanced tooltip
        this.centerOfMassPoint.element.title = 
            `2D Weight Distribution Center of Mass\n` +
            `Position: (${verifiedCenterOfMass.x.toFixed(2)}, ${verifiedCenterOfMass.z.toFixed(2)})\n` +
            `Total Weight: ${this.centerOfMassDebug.totalWeight.toFixed(1)}kg\n` +
            `Heatmap: ${position.x.toFixed(1)}%, ${position.z.toFixed(1)}%\n` +
            `Boxes: ${this.centerOfMassDebug.boxCount}`;
        
        this.showCenterOfMassPoint();
        
        this.centerOfMassPoint.currentPosition = { 
            x: verifiedCenterOfMass.x, 
            z: verifiedCenterOfMass.z
        };
        this.centerOfMassPoint.lastUpdate = Date.now();
        
        // Store for debugging
        this.centerOfMassPoint.coordinateHistory.push({
            timestamp: Date.now(),
            input: { x: verifiedCenterOfMass.x, z: verifiedCenterOfMass.z },
            output: { x: position.x, z: position.z },
            bounds: position.isWithinBounds
        });
        
        if (this.centerOfMassPoint.coordinateHistory.length > 10) {
            this.centerOfMassPoint.coordinateHistory.shift();
        }
    }
    
    /**
     * COMPREHENSIVE DEBUG METHOD with coordinate system verification
     */

    
    /**
     * Get quadrant analysis for verification
     */
    getQuadrantAnalysis() {
        const quadrantWeights = [0, 0, 0, 0];
        
        for (let row = 0; row < this.gridConfig.rows; row++) {
            for (let col = 0; col < this.gridConfig.cols; col++) {
                const cellIndex = row * this.gridConfig.cols + col;
                const cellWeight = this.weightGrid[cellIndex];
                
                if (cellWeight > 0) {
                    const isRightHalf = col >= (this.gridConfig.cols / 2);
                    const isFrontHalf = row >= (this.gridConfig.rows / 2);
                    
                    let quadrant;
                    if (isRightHalf && isFrontHalf) quadrant = 0;
                    else if (!isRightHalf && isFrontHalf) quadrant = 1;
                    else if (!isRightHalf && !isFrontHalf) quadrant = 2;
                    else quadrant = 3;
                    
                    quadrantWeights[quadrant] += cellWeight;
                }
            }
        }
        
        const totalWeight = quadrantWeights.reduce((sum, w) => sum + w, 0);
        const leftWeight = quadrantWeights[1] + quadrantWeights[2];
        const rightWeight = quadrantWeights[0] + quadrantWeights[3];
        
        return {
            quadrants: quadrantWeights,
            leftVsRight: {
                left: leftWeight,
                right: rightWeight,
                difference: leftWeight - rightWeight,
                shouldBeLeftOfCenter: leftWeight > rightWeight
            },
            totalWeight: totalWeight
        };
    }
    
    /**
     * Get stability recommendation based on center of mass
     */
    getStabilityRecommendation(centerOfMass) {
        const horizontalDeviation = Math.sqrt(centerOfMass.x ** 2 + centerOfMass.z ** 2);
        const deviationCm = horizontalDeviation * 10; // Convert to cm
        
        if (deviationCm < 5) {
            return 'EXCELLENT: Center of mass very close to pallet center';
        } else if (deviationCm < 15) {
            return 'GOOD: Center of mass within acceptable range';
        } else if (deviationCm < 30) {
            return 'CAUTION: Center of mass significantly off-center';
        } else {
            return 'WARNING: Center of mass dangerously off-center';
        }
    }
    
    /**
     * ENHANCED DEBUG: Weight distribution by quadrants with proper analysis
     */
    debugWeightByQuadrants() {
        const quadrantWeights = [0, 0, 0, 0]; // [Q1: +X+Z, Q2: -X+Z, Q3: -X-Z, Q4: +X-Z]
        const quadrantNames = ['Right-Front (+X+Z)', 'Left-Front (-X+Z)', 'Left-Back (-X-Z)', 'Right-Back (+X-Z)'];
        
        for (let row = 0; row < this.gridConfig.rows; row++) {
            for (let col = 0; col < this.gridConfig.cols; col++) {
                const cellIndex = row * this.gridConfig.cols + col;
                const cellWeight = this.weightGrid[cellIndex];
                
                if (cellWeight > 0) {
                    // Determine quadrant based on grid position
                    const isRightHalf = col >= (this.gridConfig.cols / 2);
                    const isFrontHalf = row >= (this.gridConfig.rows / 2);
                    
                    let quadrant;
                    if (isRightHalf && isFrontHalf) quadrant = 0;      // Q1: +X+Z
                    else if (!isRightHalf && isFrontHalf) quadrant = 1; // Q2: -X+Z
                    else if (!isRightHalf && !isFrontHalf) quadrant = 2; // Q3: -X-Z
                    else quadrant = 3;                                 // Q4: +X-Z
                    
                    quadrantWeights[quadrant] += cellWeight;
                }
            }
        }
        
        const totalWeight = quadrantWeights.reduce((sum, w) => sum + w, 0);
        
        console.log('Weight Distribution by Quadrants:');
        quadrantWeights.forEach((weight, index) => {
            const percentage = totalWeight > 0 ? (weight / totalWeight * 100).toFixed(1) : '0.0';
            console.log(`  ${quadrantNames[index]}: ${weight.toFixed(2)} kg (${percentage}%)`);
        });
        
        // ANALYSIS: Check if distribution explains the center of mass position
        const leftWeight = quadrantWeights[1] + quadrantWeights[2]; // Q2 + Q3
        const rightWeight = quadrantWeights[0] + quadrantWeights[3]; // Q1 + Q4
        const frontWeight = quadrantWeights[0] + quadrantWeights[1]; // Q1 + Q2
        const backWeight = quadrantWeights[2] + quadrantWeights[3]; // Q3 + Q4

        
        if (leftWeight > rightWeight) {
            console.log(`  → Center of mass should be LEFT of center (difference: ${(leftWeight - rightWeight).toFixed(2)} kg)`);
        } else if (rightWeight > leftWeight) {
            console.log(`  → Center of mass should be RIGHT of center (difference: ${(rightWeight - leftWeight).toFixed(2)} kg)`);
        } else {
            console.log(`  → Center of mass should be CENTERED horizontally`);
        }
        
        if (frontWeight > backWeight) {
            console.log(`  → Center of mass should be FRONT of center (difference: ${(frontWeight - backWeight).toFixed(2)} kg)`);
        } else if (backWeight > frontWeight) {
            console.log(`  → Center of mass should be BACK of center (difference: ${(backWeight - frontWeight).toFixed(2)} kg)`);
        } else {
            console.log(`  → Center of mass should be CENTERED front-to-back`);
        }
    }
    
    /**
     * Debug top weighted cells
     */
    debugTopWeightedCells() {
        const cellsWithWeight = [];
        
        for (let i = 0; i < this.gridConfig.totalCells; i++) {
            if (this.weightGrid[i] > 0) {
                const row = Math.floor(i / this.gridConfig.cols);
                const col = i % this.gridConfig.cols;
                
                cellsWithWeight.push({
                    index: i,
                    row: row,
                    col: col,
                    weight: this.weightGrid[i]
                });
            }
        }
        
        // Sort by weight descending
        cellsWithWeight.sort((a, b) => b.weight - a.weight);
        
        console.log('Top 5 Weighted Cells:');
        cellsWithWeight.slice(0, 5).forEach((cell, index) => {
            console.log(`  ${index + 1}. Cell [${cell.row}, ${cell.col}]: ${cell.weight.toFixed(3)} kg`);
        });
    }
    
    /**
     * Reset debug data
     */
    resetDebugData() {
        this.boxContributions = [];
        this.centerOfMassDebug = {
            rawCalculation: { x: 0, y: 0, z: 0 },
            totalWeight: 0,
            boxCount: 0,
            individualBoxes: []
        };
    }
    
    // Helper methods (unchanged)
    resetGrid() {
        this.weightGrid = new Array(this.gridConfig.totalCells).fill(0);
        this.totalWeight = 0;
        this.maxCellWeight = 0;
    }
    
    calculateFinalStatistics() {
        this.maxCellWeight = Math.max(...this.weightGrid);
    }
    
    updateHeatmapDisplay() {
        if (!this.heatmapElement) return;
        
        for (let i = 0; i < this.gridConfig.totalCells; i++) {
            const cellElement = document.getElementById(`heat-cell-${i}`);
            if (!cellElement) continue;
            
            const cellWeight = this.weightGrid[i];
            const { color, category } = this.calculateCellColorAndCategory(cellWeight);
            
            cellElement.style.backgroundColor = color;
            
            const row = Math.floor(i / this.gridConfig.cols);
            const col = i % this.gridConfig.cols;
            const categoryName = this.colorConfig.categoryNames[category];
            
            cellElement.title = `Row ${row + 1}, Col ${col + 1}\nWeight: ${cellWeight.toFixed(1)}kg\nCategory: ${categoryName}`;
        }
    }
    
    calculateCellColorAndCategory(cellWeight) {
    // Handle empty cells
    if (cellWeight === 0) {
        return { color: this.colorConfig.colors.empty, category: 'empty' };
    }
    
    // Handle case where no weight exists yet
    if (this.maxCellWeight === 0) {
        return { color: this.colorConfig.colors.empty, category: 'empty' };
    }
    
    // Calculate intensity as percentage of maximum cell weight
    const intensity = cellWeight / this.maxCellWeight;
    
    // Determine color level based on 10% increments
    if (intensity <= this.colorConfig.thresholds.level0) {
        return { color: this.colorConfig.colors.level0, category: 'level0' };
    } else if (intensity <= this.colorConfig.thresholds.level1) {
        return { color: this.colorConfig.colors.level1, category: 'level1' };
    } else if (intensity <= this.colorConfig.thresholds.level2) {
        return { color: this.colorConfig.colors.level2, category: 'level2' };
    } else if (intensity <= this.colorConfig.thresholds.level3) {
        return { color: this.colorConfig.colors.level3, category: 'level3' };
    } else if (intensity <= this.colorConfig.thresholds.level4) {
        return { color: this.colorConfig.colors.level4, category: 'level4' };
    } else if (intensity <= this.colorConfig.thresholds.level5) {
        return { color: this.colorConfig.colors.level5, category: 'level5' };
    } else if (intensity <= this.colorConfig.thresholds.level6) {
        return { color: this.colorConfig.colors.level6, category: 'level6' };
    } else if (intensity <= this.colorConfig.thresholds.level7) {
        return { color: this.colorConfig.colors.level7, category: 'level7' };
    } else if (intensity <= this.colorConfig.thresholds.level8) {
        return { color: this.colorConfig.colors.level8, category: 'level8' };
    } else {
        return { color: this.colorConfig.colors.level9, category: 'level9' };
    }
    }
    
    getDistributionSummary() {
    const nonEmptyCells = this.weightGrid.filter(weight => weight > 0).length;
    const averageWeight = this.totalWeight / Math.max(nonEmptyCells, 1);
    
    // Initialize all 10 categories plus empty
    const categories = { 
        empty: 0, 
        level0: 0, level1: 0, level2: 0, level3: 0, level4: 0,
        level5: 0, level6: 0, level7: 0, level8: 0, level9: 0
    };
    
    // Count cells in each category
    this.weightGrid.forEach(weight => {
        const { category } = this.calculateCellColorAndCategory(weight);
        categories[category]++;
    });
    
    return {
        totalWeight: this.totalWeight,
        maxCellWeight: this.maxCellWeight,
        averageWeight: averageWeight,
        occupiedCells: nonEmptyCells,
        totalCells: this.gridConfig.totalCells,
        occupancyPercentage: (nonEmptyCells / this.gridConfig.totalCells) * 100,
        categories: categories,
        weightGrid: [...this.weightGrid],
        isBalanced: this.assessBalance(),
        gridResolution: `${this.gridConfig.rows}×${this.gridConfig.cols}`,
        cellSizeMm: `${this.cellDimensions.cellSizeMm}×${this.cellDimensions.cellSizeMm}mm`,
        centerOfMass: this.centerOfMassDebug.rawCalculation,
        lastUpdate: Date.now(),
        colorLevels: 10  // New property indicating enhanced granularity
    };
    }


    assessBalance() {
        if (this.totalWeight === 0) return true;
        
        const occupiedWeights = this.weightGrid.filter(weight => weight > 0);
        if (occupiedWeights.length === 0) return true;
        
        const mean = occupiedWeights.reduce((sum, w) => sum + w, 0) / occupiedWeights.length;
        const variance = occupiedWeights.reduce((sum, w) => sum + Math.pow(w - mean, 2), 0) / occupiedWeights.length;
        const standardDeviation = Math.sqrt(variance);
        
        const coefficientOfVariation = standardDeviation / mean;
        return coefficientOfVariation < 0.5;
    }
    
    // Initialize methods (simplified)
    initializeCompleteSystem() {
        try {
            this.initializeHeatmapHTML();
            this.initializeDynamicLegend();
            
            setTimeout(() => {
                this.initializeCenterOfMassPoint();
            }, 100);
            
            
        } catch (error) {
            console.error('Error initializing weight distribution system:', error);
        }
    }
    
    initializeHeatmapHTML() {
        this.heatmapElement = document.querySelector('.heatmap .heat-grid');
        
        if (!this.heatmapElement) {
            console.warn('Heatmap HTML element not found');
            return;
        }
        
        this.heatmapElement.innerHTML = '';
        
        for (let i = 0; i < this.gridConfig.totalCells; i++) {
            const cell = document.createElement('div');
            cell.className = 'heat-cell';
            cell.id = `heat-cell-${i}`;
            cell.title = `Cell ${i + 1}: 0kg`;
            this.heatmapElement.appendChild(cell);
        }
        
        this.heatmapElement.style.gridTemplateColumns = `repeat(${this.gridConfig.cols}, 1fr)`;
        this.heatmapElement.style.gridTemplateRows = `repeat(${this.gridConfig.rows}, 1fr)`;
    }
    
    initializeDynamicLegend() {
        this.legendElement = document.querySelector('.heatmap .legend');
        
        if (!this.legendElement) {
            console.warn('Legend HTML element not found');
            return;
        }
        
        this.legendElement.innerHTML = '';
        
        // Configure main legend container for single-line layout
        this.legendElement.style.cssText = `
            margin-top: 8px !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            width: 100% !important;
            gap: 4px !important;
        `;
        
        // Create single-row container for all 10 colors
        const colorLegendContainer = document.createElement('div');
        colorLegendContainer.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            flex-wrap: nowrap;
            width: 100%;
            overflow: visible;
        `;
        
        // Add all 10 color items to the single row
        this.colorConfig.legendInfo.forEach(item => {
            const legendItem = document.createElement('span');
            legendItem.style.cssText = `
                display: flex;
                align-items: center;
                gap: 2px;
                font-size: 0.5rem;
                white-space: nowrap;
                padding: 1px;
                flex-shrink: 1;
                min-width: 0;
            `;
            
            const dot = document.createElement('div');
            dot.className = 'legend-dot';
            dot.style.cssText = `
                width: 7px;
                height: 7px;
                border-radius: 2px;
                flex-shrink: 0;
                background-color: ${item.color};
                border: 1px solid rgba(0,0,0,0.15);
            `;
            
            const label = document.createElement('span');
            label.textContent = item.label;
            label.style.cssText = `
                font-size: 0.5rem;
                color: #333;
                font-weight: 500;
                text-overflow: ellipsis;
                overflow: hidden;
                white-space: nowrap;
                min-width: 0;
            `;
            
            legendItem.appendChild(dot);
            legendItem.appendChild(label);
            colorLegendContainer.appendChild(legendItem);
        });
        
        // Add the single-line color legend to main container
        this.legendElement.appendChild(colorLegendContainer);
        
        // Center of mass legend item (on its own line below)
        const centerOfMassLegendItem = document.createElement('div');
        centerOfMassLegendItem.style.cssText = `
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 3px !important;
            font-size: 0.55rem !important;
            white-space: nowrap !important;
            margin-top: 2px !important;
        `;
        
        const centerOfMassDot = document.createElement('div');
        centerOfMassDot.className = 'legend-dot';
        centerOfMassDot.style.cssText = `
            width: 7px !important;
            height: 7px !important;
            border-radius: 50% !important;
            flex-shrink: 0 !important;
            background: radial-gradient(circle, #1a365d 0%, #2c5282 50%, #3182ce 100%) !important;
            border: 1px solid #ffffff !important;
            box-shadow: 0 0 3px rgba(26, 54, 93, 0.6) !important;
        `;
        
        const centerOfMassLabel = document.createElement('span');
        centerOfMassLabel.textContent = 'Center of Mass';
        centerOfMassLabel.style.cssText = `
            font-size: 0.55rem !important;
            color: #2c3e50 !important;
            font-weight: 500 !important;
        `;
        
        centerOfMassLegendItem.appendChild(centerOfMassDot);
        centerOfMassLegendItem.appendChild(centerOfMassLabel);
        this.legendElement.appendChild(centerOfMassLegendItem);
    }

    initializeCenterOfMassPoint() {
        if (!this.heatmapElement) {
            console.warn('Heatmap element not found - cannot create center of mass point');
            return;
        }
        
        const heatmapContainer = this.heatmapElement.parentElement;
        if (!heatmapContainer) {
            console.warn('Heatmap container not found');
            return;
        }
        
        this.centerOfMassPoint.element = document.createElement('div');
        this.centerOfMassPoint.element.id = 'center-of-mass-heatmap-point';
        this.centerOfMassPoint.element.className = 'center-of-mass-point';
        
        this.centerOfMassPoint.element.style.cssText = `
            position: absolute;
            width: 12px;
            height: 12px;
            background: radial-gradient(circle, #1a365d 0%, #2c5282 50%, #3182ce 100%);
            border: 2px solid #ffffff;
            border-radius: 50%;
            transform: translate(-50%, -50%);
            z-index: 15;
            pointer-events: none;
            box-shadow: 
                0 0 6px rgba(26, 54, 93, 0.8),
                0 0 12px rgba(26, 54, 93, 0.6),
                inset 0 1px 0 rgba(255, 255, 255, 0.4);
            transition: all 0.3s ease;
            opacity: 0;
            visibility: hidden;
        `;
        
        this.centerOfMassPoint.element.title = '2D Weight Distribution Center';
        
        heatmapContainer.style.position = 'relative';
        heatmapContainer.appendChild(this.centerOfMassPoint.element);
    }

    showCenterOfMassPoint() {
        if (this.centerOfMassPoint.element) {
            this.centerOfMassPoint.element.style.opacity = '1';
            this.centerOfMassPoint.element.style.visibility = 'visible';
            this.centerOfMassPoint.isVisible = true;
        }
    }

    hideCenterOfMassPoint() {
        if (this.centerOfMassPoint.element) {
            this.centerOfMassPoint.element.style.opacity = '0';
            this.centerOfMassPoint.element.style.visibility = 'hidden';
            this.centerOfMassPoint.isVisible = false;
        }
    }
    
    reset() {
        this.resetGrid();
        this.resetDebugData();
        this.hideCenterOfMassPoint();
        this.updateHeatmapDisplay();
        
        this.centerOfMassPoint.currentPosition = { x: 0, z: 0 };
        this.centerOfMassPoint.lastUpdate = 0;
        this.centerOfMassPoint.isVisible = false;
        this.centerOfMassPoint.coordinateHistory = [];
    }

    dispose() {
        this.resetGrid();
        this.heatmapElement = null;
        this.legendElement = null;

        if (this.centerOfMassPoint.element) {
            this.centerOfMassPoint.element.remove();
            this.centerOfMassPoint.element = null;
        }
    }


}

// Export for global access
window.WeightDistributionCalculator = WeightDistributionCalculator;