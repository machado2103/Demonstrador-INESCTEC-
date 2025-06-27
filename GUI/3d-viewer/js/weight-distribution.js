/**
 * Weight Distribution System
 */

class WeightDistributionCalculator {
    constructor() {
        // grid (6×4 = 24 cells)
        this.gridConfig = {
            rows: 8,        
            cols: 12,        
            totalCells: 96  
        };
        
        // Pallet dimensions
        this.palletDimensions = {
            length: 12.0,    // 1200mm = 12 units
            width: 8.0,      // 800mm = 8 units  
            centerX: 0,      
            centerZ: 0       
        };
        
        // Cell dimensions
        this.cellDimensions = {
            width: this.palletDimensions.length / this.gridConfig.cols,   // 2.0 units (200mm)
            height: this.palletDimensions.width / this.gridConfig.rows    // 2.0 units (200mm)
        };
        
        // Weight distribution state
        this.weightGrid = new Array(this.gridConfig.totalCells).fill(0);
        this.totalWeight = 0;
        this.maxCellWeight = 0;
        
        this.colorConfig = {
            colors: {
                veryLow: '#2E7D32',    // Dark green (0-20%)
                low: '#66BB6A',        // Light green (20-40%)
                medium: '#FDD835',     // Yellow (40-60%)
                high: '#FF8F00',       // Orange (60-80%)
                veryHigh: '#D32F2F',   // Red (80-100%)
                empty: '#F5F5F5'       // Light gray - no weight
            },
            
            thresholds: {
                veryLow: 0.20,    // 0-20%
                low: 0.40,        // 20-40%
                medium: 0.60,     // 40-60%
                high: 0.80,       // 60-80%
                veryHigh: 1.00    // 80-100%
            },

            legendInfo: [
                { key: 'veryLow', color: '#2E7D32', label: 'Very Low', range: '0-20%' },
                { key: 'low', color: '#66BB6A', label: 'Low', range: '20-40%' },
                { key: 'medium', color: '#FDD835', label: 'Medium', range: '40-60%' },
                { key: 'high', color: '#FF8F00', label: 'High', range: '60-80%' },
                { key: 'veryHigh', color: '#D32F2F', label: 'Very High', range: '80-100%' }
            ],
            
            categoryNames: {
                empty: 'No Weight',
                veryLow: 'Very Low',
                low: 'Low', 
                medium: 'Medium',
                high: 'High',
                veryHigh: 'Very High'
            }
        };
        
        // HTML element references
        this.heatmapElement = null;
        this.legendElement = null;
        
        // Debug state
        this.isDebugMode = false;
        
        
        // Initialize complete system
        this.initializeCompleteSystem();
    }
    
    /**
     * Initialize complete system with heatmap + legend + CSS
     */
    initializeCompleteSystem() {
        
        // Initialize heatmap
        this.initializeHeatmapHTML();
        
        // Initialize dynamic legend
        this.initializeDynamicLegend();
        
    }
    
    /**
     * Inject compact CSS
     */
    injectRequiredCSS() {
        // Check if CSS already injected
        if (document.getElementById('weight-distribution-css')) {
            return;
        }
        
        const css = `
        <style id="weight-distribution-css">
        /* Weight Distribution - COMPACT CSS to prevent oversized containers */
        .heatmap .heat-grid {
            display: grid !important;
            gap: 1px !important;
            width: 100% !important;
            max-width: 200px !important;
            padding: 3px !important;
            background-color: # !important;
            border-radius: 4px !important;
            margin: 0 auto !important;
            aspect-ratio: 1.5 !important;
        }
        
        .heatmap .heat-grid .heat-cell {
            border-radius: 1px !important;
            transition: all 0.3s ease !important;
            min-height: 12px !important;
            min-width: 12px !important;
            cursor: pointer !important;
            height: auto !important;
        }
        
        .heatmap .heat-grid .heat-cell:hover {
            transform: scale(1.1) !important;
            box-shadow: 0 1px 3px rgba(0,0,0,0.3) !important;
            z-index: 10 !important;
            position: relative !important;
        }
        
        .heatmap .legend {
            margin-top: 6px !important;
            font-size: 0.7rem !important;
            display: flex !important;
            flex-wrap: wrap !important;
            justify-content: center !important;
            gap: 6px !important;
            max-width: 220px !important;
            margin-left: auto !important;
            margin-right: auto !important;
        }
        
        .heatmap .legend span {
            display: flex !important;
            align-items: center !important;
            gap: 3px !important;
            margin: 1px !important;
            font-size: 0.65rem !important;
        }
        
        .heatmap .legend-dot {
            width: 8px !important;
            height: 8px !important;
            border-radius: 50% !important;
            flex-shrink: 0 !important;
        }
        
        /* FIXED: Compact the metric card container */
        .metric-card .heatmap {
            max-width: 220px !important;
            margin: 0 auto !important;
        }
        </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', css);
    }
    
    /**
     * Initialize heatmap HTML
     */
    initializeHeatmapHTML() {
        this.heatmapElement = document.querySelector('.heatmap .heat-grid');
        
        if (!this.heatmapElement) {
            console.warn('Heatmap HTML element not found');
            return;
        }
        
        // Clear existing content
        this.heatmapElement.innerHTML = '';
        
        // Create grid cells (24 cells)
        for (let i = 0; i < this.gridConfig.totalCells; i++) {
            const cell = document.createElement('div');
            cell.className = 'heat-cell';
            cell.id = `heat-cell-${i}`;
            cell.title = `Cell ${i + 1}: 0kg`;
            this.heatmapElement.appendChild(cell);
        }
        
        // Apply CSS layout
        this.heatmapElement.style.gridTemplateColumns = `repeat(${this.gridConfig.cols}, 1fr)`;
        this.heatmapElement.style.gridTemplateRows = `repeat(${this.gridConfig.rows}, 1fr)`;
    }
    
    /**
     * Initialize dynamic legend
     */
    initializeDynamicLegend() {
        this.legendElement = document.querySelector('.heatmap .legend');
        
        if (!this.legendElement) {
            console.warn('Legend HTML element not found');
            return;
        }
        
        // Clear existing legend
        this.legendElement.innerHTML = '';
        
        // Create legend with 5 colors
        this.colorConfig.legendInfo.forEach(item => {
            const legendItem = document.createElement('span');
            
            const dot = document.createElement('div');
            dot.className = 'legend-dot';
            dot.style.backgroundColor = item.color;
            
            const label = document.createElement('span');
            label.textContent = item.label;
            
            legendItem.appendChild(dot);
            legendItem.appendChild(label);
            this.legendElement.appendChild(legendItem);
        });
    }
    
    /**
     * MAIN METHOD: Calculate weight distribution
     */
    calculateWeightDistribution(boxes) {
        if (this.isDebugMode) {
            console.log(`Calculating weight distribution for ${boxes.length} boxes...`);
        }
        
        this.resetGrid();
        
        if (!boxes || boxes.length === 0) {
            this.updateHeatmapDisplay();
            return this.getDistributionSummary();
        }
        
        boxes.forEach((box, index) => {
            try {
                this.processBoxWeight(box, index);
            } catch (error) {
                console.warn(`Error processing box ${index}:`, error.message);
            }
        });
        
        this.calculateFinalStatistics();
        this.updateHeatmapDisplay();
        
        if (this.isDebugMode) {
            this.logDistributionSummary();
        }
        
        return this.getDistributionSummary();
    }
    
    /**
     * Process individual box weight
     */
    processBoxWeight(box, index) {
        const weight = this.extractBoxWeight(box);
        const bounds = this.calculateBoxBounds(box);
        
        if (weight <= 0) return;
        
        const affectedCells = this.findAffectedCells(bounds);
        this.distributeWeightToCells(weight, bounds, affectedCells, index);
        this.totalWeight += weight;
    }
    
    /**
     * Extract box weight
     */
    extractBoxWeight(box) {
        if (!box.userData || typeof box.userData.weight !== 'number') {
            return 0;
        }
        return box.userData.weight;
    }
    
    /**
     * Calculate box bounds
     */
    calculateBoxBounds(box) {
        const pos = box.position;
        const geom = box.geometry.parameters;
        
        return {
            minX: pos.x - (geom.width / 2),
            maxX: pos.x + (geom.width / 2),
            minZ: pos.z - (geom.depth / 2),
            maxZ: pos.z + (geom.depth / 2),
            area: geom.width * geom.depth
        };
    }
    
    /**
     * Find affected cells
     */
    findAffectedCells(bounds) {
        const affectedCells = [];
        
        const palletMinX = -this.palletDimensions.length / 2;
        const palletMaxX = this.palletDimensions.length / 2;
        const palletMinZ = -this.palletDimensions.width / 2;
        const palletMaxZ = this.palletDimensions.width / 2;
        
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
                        bounds: { minX: cellMinX, maxX: cellMaxX, minZ: cellMinZ, maxZ: cellMaxZ }
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
     * Distribute weight to cells
     */
    distributeWeightToCells(totalWeight, boxBounds, affectedCells, boxIndex) {
        if (affectedCells.length === 0) return;
        
        const totalIntersectionArea = affectedCells.reduce((sum, cell) => sum + cell.intersectionArea, 0);
        if (totalIntersectionArea === 0) return;
        
        affectedCells.forEach(cell => {
            const weightProportion = cell.intersectionArea / totalIntersectionArea;
            const cellWeight = totalWeight * weightProportion;
            this.weightGrid[cell.index] += cellWeight;
        });
    }
    
    /**
     * Reset grid
     */
    resetGrid() {
        this.weightGrid = new Array(this.gridConfig.totalCells).fill(0);
        this.totalWeight = 0;
        this.maxCellWeight = 0;
    }
    
    /**
     * Calculate final statistics
     */
    calculateFinalStatistics() {
        this.maxCellWeight = Math.max(...this.weightGrid);
    }
    
    /**
     * Update heatmap display
     */
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
    
    /**
     * Calculate color and category based on weight
     */
    calculateCellColorAndCategory(cellWeight) {
        if (cellWeight === 0) {
            return { color: this.colorConfig.colors.empty, category: 'empty' };
        }
        
        if (this.maxCellWeight === 0) {
            return { color: this.colorConfig.colors.empty, category: 'empty' };
        }
        
        const intensity = cellWeight / this.maxCellWeight;
        
        if (intensity <= this.colorConfig.thresholds.veryLow) {
            return { color: this.colorConfig.colors.veryLow, category: 'veryLow' };
        } else if (intensity <= this.colorConfig.thresholds.low) {
            return { color: this.colorConfig.colors.low, category: 'low' };
        } else if (intensity <= this.colorConfig.thresholds.medium) {
            return { color: this.colorConfig.colors.medium, category: 'medium' };
        } else if (intensity <= this.colorConfig.thresholds.high) {
            return { color: this.colorConfig.colors.high, category: 'high' };
        } else {
            return { color: this.colorConfig.colors.veryHigh, category: 'veryHigh' };
        }
    }
    
    /**
     * Get distribution summary
     */
    getDistributionSummary() {
        const nonEmptyCells = this.weightGrid.filter(weight => weight > 0).length;
        const averageWeight = this.totalWeight / Math.max(nonEmptyCells, 1);
        
        const categories = { 
            empty: 0, veryLow: 0, low: 0, medium: 0, high: 0, veryHigh: 0 
        };
        
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
            cellSizeMm: `${(this.cellDimensions.width*100).toFixed(0)}×${(this.cellDimensions.height*100).toFixed(0)}mm`
        };
    }
    
    /**
     * Assess balance
     */
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
    
    dispose() {
        console.log(' Disposing weight distribution calculator...');
        this.resetGrid();
        this.heatmapElement = null;
        this.legendElement = null;
        
        // Remove injected CSS
        const cssElement = document.getElementById('weight-distribution-css');
        if (cssElement) {
            cssElement.remove();
        }
        
        console.log(' Weight distribution calculator disposed');
    }
}

window.WeightDistributionCalculator = WeightDistributionCalculator;