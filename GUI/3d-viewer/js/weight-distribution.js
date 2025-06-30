/**
 * Weight Distribution System
 */

class WeightDistributionCalculator {
    constructor() {
        // grid (12×8 = 96 cells)
        this.gridConfig = {
            rows: 16,        
            cols: 24,        
            totalCells: 384 
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

        this.centerOfMassPoint = {
        element: null,
        isVisible: false,
        currentPosition: { x: 0, z: 0 },
        lastUpdate: 0
        };
        
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

        setTimeout(() => {
        this.initializeCenterOfMassPoint();
        }, 100);
        
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
        
        // Create legend with 5 weight colors
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
        
        // Mass center
        const centerOfMassLegendItem = document.createElement('span');
        centerOfMassLegendItem.style.cssText = `
            display: flex !important;
            align-items: center !important;
            gap: 3px !important;
            margin: 0 !important;
            font-size: 0.6rem !important;
            white-space: nowrap !important;
            margin-left: 8px !important;
            padding-left: 8px !important;
            border-left: 1px solid #dee2e6 !important;
        `;
        
        // Criar o ponto do centro de massa (similar ao que aparece no heatmap)
        const centerOfMassDot = document.createElement('div');
        centerOfMassDot.className = 'legend-dot';
        centerOfMassDot.style.cssText = `
            width: 8px !important;
            height: 8px !important;
            border-radius: 50% !important;
            flex-shrink: 0 !important;
            background: radial-gradient(circle, #1a365d 0%, #2c5282 50%, #3182ce 100%) !important;
            border: 1px solid #ffffff !important;
            box-shadow: 0 0 3px rgba(26, 54, 93, 0.6) !important;
        `;
        
        // Label do centro de massa
        const centerOfMassLabel = document.createElement('span');
        centerOfMassLabel.textContent = 'Mass Center';
        centerOfMassLabel.style.cssText = `
            font-size: 0.6rem !important;
            color: #2c3e50 !important;
            font-weight: 500 !important;
        `;
        
        centerOfMassLegendItem.appendChild(centerOfMassDot);
        centerOfMassLegendItem.appendChild(centerOfMassLabel);
        this.legendElement.appendChild(centerOfMassLegendItem);
    }


    /**
     * Inicializar o ponto de centro de massa no heatmap
     */
    initializeCenterOfMassPoint() {
        if (!this.heatmapElement) {
            console.warn('Heatmap element not found - cannot create center of mass point');
            return;
        }
        
        // Encontrar o container do heatmap
        const heatmapContainer = this.heatmapElement.parentElement;
        if (!heatmapContainer) {
            console.warn('Heatmap container not found');
            return;
        }
        
        // Criar o elemento do ponto
        this.centerOfMassPoint.element = document.createElement('div');
        this.centerOfMassPoint.element.id = 'center-of-mass-heatmap-point';
        this.centerOfMassPoint.element.className = 'center-of-mass-point';
        
        // Aplicar estilos do ponto
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
        
        // Adicionar tooltip
        this.centerOfMassPoint.element.title = 'Center of Mass Position';
        
        // Posicionar relativamente ao container do heatmap
        heatmapContainer.style.position = 'relative';
        heatmapContainer.appendChild(this.centerOfMassPoint.element);
        
        console.log('✅ Center of mass heatmap point initialized');
    }

/**
 * Converter coordenadas do centro de massa para posição no heatmap
 * @param {number} centerX - Coordenada X do centro de massa (Three.js units)
 * @param {number} centerZ - Coordenada Z do centro de massa (Three.js units)  
 * @returns {Object} Posição em percentagem no heatmap
 */
convertCenterOfMassToHeatmapPosition(centerX, centerZ) {
    // Dimensões da palete em coordenadas Three.js
    const palletHalfLength = this.palletDimensions.length / 2;  // 6.0 units
    const palletHalfWidth = this.palletDimensions.width / 2;    // 4.0 units
    
    // Converter coordenadas do centro de massa (-6 a +6, -4 a +4) para percentagem (0% a 100%)
    
    // X: -6.0 → 0%, 0 → 50%, +6.0 → 100%
    const xPercent = ((centerX + palletHalfLength) / this.palletDimensions.length) * 100;
    
    // Z: -4.0 → 0%, 0 → 50%, +4.0 → 100%  
    const zPercent = ((centerZ + palletHalfWidth) / this.palletDimensions.width) * 100;
    
    // Limitar entre 0% e 100%
    const clampedX = Math.max(0, Math.min(100, xPercent));
    const clampedZ = Math.max(0, Math.min(100, zPercent));
    
    return {
        x: clampedX,
        z: clampedZ,
        isWithinBounds: (xPercent >= 0 && xPercent <= 100 && zPercent >= 0 && zPercent <= 100)
    };
}

/**
 * Atualizar posição do ponto de centro de massa no heatmap
 * @param {Object} centerOfMassData - Dados do centro de massa do CenterOfMassCalculator
 */
updateCenterOfMassPoint(centerOfMassData) {
    if (!this.centerOfMassPoint.element) {
        // Tentar inicializar se ainda não foi criado
        this.initializeCenterOfMassPoint();
        if (!this.centerOfMassPoint.element) {
            return;
        }
    }
    
    if (!centerOfMassData || typeof centerOfMassData.x !== 'number' || typeof centerOfMassData.z !== 'number') {
        this.hideCenterOfMassPoint();
        return;
    }
    
    // Converter coordenadas para posição no heatmap
    const position = this.convertCenterOfMassToHeatmapPosition(centerOfMassData.x, centerOfMassData.z);
    
    // Atualizar posição CSS
    this.centerOfMassPoint.element.style.left = `${position.x}%`;
    this.centerOfMassPoint.element.style.top = `${position.z}%`;
    
    // Atualizar tooltip com informação detalhada
    const deviation = centerOfMassData.deviationCm || 0;
    this.centerOfMassPoint.element.title = 
        `Center of Mass\n` +
        `Position: (${centerOfMassData.x.toFixed(2)}, ${centerOfMassData.z.toFixed(2)})\n` +
        `Deviation: ${deviation.toFixed(1)}cm\n` +
        `Grid: ${position.x.toFixed(1)}%, ${position.z.toFixed(1)}%`;
    
    // Mostrar o ponto
    this.showCenterOfMassPoint();
    
    // Armazenar posição atual
    this.centerOfMassPoint.currentPosition = { x: centerOfMassData.x, z: centerOfMassData.z };
    this.centerOfMassPoint.lastUpdate = Date.now();
    
    // Efeito visual baseado na estabilidade
    this.updatePointVisualFeedback(centerOfMassData);
}

/**
 * Mostrar o ponto de centro de massa
 */
showCenterOfMassPoint() {
    if (this.centerOfMassPoint.element) {
        this.centerOfMassPoint.element.style.opacity = '1';
        this.centerOfMassPoint.element.style.visibility = 'visible';
        this.centerOfMassPoint.isVisible = true;
    }
}

/**
 * Esconder o ponto de centro de massa
 */
hideCenterOfMassPoint() {
    if (this.centerOfMassPoint.element) {
        this.centerOfMassPoint.element.style.opacity = '0';
        this.centerOfMassPoint.element.style.visibility = 'hidden';
        this.centerOfMassPoint.isVisible = false;
    }
}

/**
 * Atualizar feedback visual baseado na estabilidade do centro de massa
 * @param {Object} centerOfMassData - Dados do centro de massa
 */
updatePointVisualFeedback(centerOfMassData) {
    if (!this.centerOfMassPoint.element) return;
    
    const deviation = centerOfMassData.deviationCm || 0;
    
    // Cores baseadas na estabilidade (quanto maior o desvio, mais vermelho)
    let color, glowColor, pulseSpeed;
    
    if (deviation <= 5) {
        // Excelente (≤ 5cm) - Azul escuro
        color = '#1a365d';
        glowColor = 'rgba(26, 54, 93, 0.8)';
        pulseSpeed = '3s';
    } else if (deviation <= 15) {
        // Bom (≤ 15cm) - Azul 
        color = '#2c5282';
        glowColor = 'rgba(44, 82, 130, 0.8)';
        pulseSpeed = '2s';
    } else if (deviation <= 25) {
        // Aceitável (≤ 25cm) - Azul claro
        color = '#3182ce';
        glowColor = 'rgba(49, 130, 206, 0.8)';
        pulseSpeed = '1.5s';
    } else {
        // Problemático (> 25cm) - Laranja/Vermelho
        color = '#dd6b20';
        glowColor = 'rgba(221, 107, 32, 0.8)';
        pulseSpeed = '1s';
    }
    
    // Aplicar nova cor e animação
    this.centerOfMassPoint.element.style.background = 
        `radial-gradient(circle, ${color} 0%, ${color}aa 50%, ${color}88 100%)`;
    
    this.centerOfMassPoint.element.style.boxShadow = 
        `0 0 6px ${glowColor}, 0 0 12px ${glowColor}66, inset 0 1px 0 rgba(255, 255, 255, 0.4)`;
    
    // Animação de pulso para desvios altos
    if (deviation > 15) {
        this.centerOfMassPoint.element.style.animation = `centerMassPulse ${pulseSpeed} ease-in-out infinite`;
    } else {
        this.centerOfMassPoint.element.style.animation = 'none';
    }
}

/**
 * Limpar o ponto de centro de massa (usar no dispose)
 */
disposeCenterOfMassPoint() {
    if (this.centerOfMassPoint.element) {
        this.centerOfMassPoint.element.remove();
        this.centerOfMassPoint.element = null;
    }
    this.centerOfMassPoint.isVisible = false;
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

    
    reset() {
    console.log('Resetting weight distribution calculator...');
    
    // Reset weight grid
    this.resetGrid();
    
    // Hide center of mass point
    this.hideCenterOfMassPoint();
    
    // Clear heatmap display
    this.updateHeatmapDisplay();
    
    // Reset center of mass point state
    this.centerOfMassPoint.currentPosition = { x: 0, z: 0 };
    this.centerOfMassPoint.lastUpdate = 0;
    this.centerOfMassPoint.isVisible = false;
    
    console.log('Weight distribution calculator reset complete');
    }



    
    dispose() {
        console.log(' Disposing weight distribution calculator...');
        this.resetGrid();
        this.heatmapElement = null;
        this.legendElement = null;

        this.disposeCenterOfMassPoint();
        
        // Remove injected CSS
        const cssElement = document.getElementById('weight-distribution-css');
        if (cssElement) {
            cssElement.remove();
        }
        
        console.log(' Weight distribution calculator disposed');
    }
}

window.WeightDistributionCalculator = WeightDistributionCalculator;
