/**
 * Volume Efficiency Calculator
 * Calculates and visualizes volume efficiency for pallet loading
 * 
 * Conversion: 1 Three.js unit = 100mm = 10cm (based on PalletDataLoader)
 * Pallet dimensions: 1200mm × 800mm × 1500mm (120cm × 80cm × 150cm)
 */

class VolumeEfficiencyCalculator {
    constructor() {
        // Pallet dimensions based on Crosslog data
        // PalletDataLoader uses * 0.01 conversion (1 unit = 100mm)
        this.palletDimensions = {
            lengthCm: 120,          // 1200mm = 120cm
            widthCm: 80,            // 800mm = 80cm  
            baseAreaCm2: 9600,      // 120cm × 80cm = 9600 cm²
            maxHeightCm: 150        // 1500mm = 150cm (reference maximum)
        };
        
        // Current efficiency state
        this.currentEfficiency = {
            occupiedVolumeCm3: 0,
            availableVolumeCm3: 0,
            efficiency: 0,
            boxCount: 0,
            currentHeightCm: 0
        };
        
        // Chart.js management
        this.chartInstance = null;
        this.chartCanvas = null;
        this.isInitialized = false;
        this.isLoading = false;
        
        // Chart configuration
        this.chartConfig = {
            colors: {
                occupied: '#63CBF1',    // Blue for occupied space
                free: '#909090'         // Light gray for free space
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        enabled: true,
                        callbacks: {
                            label: function(context) {
                                return context.label + ': ' + context.parsed.toFixed(1) + '%';
                            }
                        }
                    }
                },
                animation: { duration: 0, easing: 'linear' },
                elements: {
                    arc: { borderWidth: 0, borderRadius: 0 }
                },
                responsive: true,
                interaction: { intersect: false }
            }
        };
    }
    
    /**
     * Calculate volume efficiency for given boxes and height
     * @param {Array} boxes - Array of box objects with geometry parameters
     * @param {number} currentHeightCm - Current height in centimeters
     * @returns {Object} Efficiency calculation results
     */
    calculateVolumeEfficiency(boxes, currentHeightCm) {
        if (!boxes || boxes.length === 0 || currentHeightCm <= 0) {
            return this.getEmptyEfficiencyResult();
        }
        
        let totalOccupiedVolumeCm3 = 0;
        let validBoxCount = 0;
        
        boxes.forEach((box, index) => {
            try {
                let boxVolumeCm3 = 0;
                
                if (!box.geometry || !box.geometry.parameters) {
                    console.warn(`Box ${index} has invalid geometry`);
                    return;
                }
                
                // Extract dimensions in Three.js units
                const widthUnits = box.geometry.parameters.width || 0;
                const heightUnits = box.geometry.parameters.height || 0;
                const depthUnits = box.geometry.parameters.depth || 0;
                
                // Convert to centimeters: 1 unit = 10cm
                const widthCm = widthUnits * 10;
                const heightCm = heightUnits * 10;
                const depthCm = depthUnits * 10;
                
                boxVolumeCm3 = widthCm * heightCm * depthCm;
                
                if (boxVolumeCm3 > 0) {
                    totalOccupiedVolumeCm3 += boxVolumeCm3;
                    validBoxCount++;
                } else {
                    console.warn(`Box ${index} has invalid volume (dimensions: ${widthCm}×${heightCm}×${depthCm} cm)`);
                }
                
            } catch (error) {
                console.error(`Error calculating volume for box ${index}:`, error);
            }
        });
        
        // Calculate available volume (fixed base area × dynamic height)
        const availableVolumeCm3 = this.palletDimensions.baseAreaCm2 * currentHeightCm;
        
        // Calculate efficiency percentage
        let efficiency = 0;
        if (availableVolumeCm3 > 0) {
            efficiency = (totalOccupiedVolumeCm3 / availableVolumeCm3) * 100;
            efficiency = Math.min(efficiency, 100); // Maximum 100%
        }
        
        // Store current state
        this.currentEfficiency = {
            occupiedVolumeCm3: totalOccupiedVolumeCm3,
            availableVolumeCm3: availableVolumeCm3,
            efficiency: efficiency,
            boxCount: validBoxCount,
            currentHeightCm: currentHeightCm
        };
        
        return this.getCurrentEfficiencyResult();
    }
    
    /**
     * Initialize the pie chart visualization
     * @returns {boolean} Success status
     */
    initializePieChart() {
        const existingChart = document.querySelector('.efficiency-chart');
        if (!existingChart) {
            console.error('Efficiency chart container not found in DOM');
            return false;
        }
        
        this.showLoadingState(existingChart);
        
        setTimeout(() => {
            this.createChart(existingChart);
            this.updatePieChart(0);
            this.isInitialized = true;
        }, 300);
        
        return true;
    }
    
    /**
     * Show loading state during initialization
     */
    showLoadingState(container) {
        this.isLoading = true;
        
        container.innerHTML = `
            <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 180px;
                color: #7f8c8d;
            ">
                <div style="
                    width: 40px;
                    height: 40px;
                    border: 3px solid #ecf0f1;
                    border-top: 3px solid #3498db;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-bottom: 15px;
                "></div>
                <div style="
                    font-size: 0.9rem;
                    font-weight: 500;
                ">Loading Chart...</div>
            </div>
            
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
    }
    
    /**
     * Create chart with complete visual structure
     */
    createChart(container) {
        this.isLoading = false;
        
        container.innerHTML = `
            <div style="position: relative; width: 150px; height: 150px; margin: 0 auto;">
                <canvas id="volume-efficiency-chart" width="150" height="150"></canvas>
            </div>
            
            <div class="efficiency-info" style="margin-top: 15px; text-align: center;">
                <div style="display: flex; justify-content: center; gap: 15px;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span style="
                            display: inline-block; 
                            width: 10px; 
                            height: 10px; 
                            background: ${this.chartConfig.colors.occupied}; 
                            border-radius: 50%;
                        "></span>
                        <span style="font-size: 0.9rem; color: #34495e; font-weight: bold;">
                            Occupied: 
                            <span id="occupied-percentage" style="
                                font-weight: bold; 
                                font-size: 1rem;
                                color: #2c3e50;
                            ">0%</span>
                        </span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span style="
                            display: inline-block; 
                            width: 10px; 
                            height: 10px; 
                            background: ${this.chartConfig.colors.free}; 
                            border-radius: 50%;
                        "></span>
                        <span style="font-size: 0.9rem; color: #34495e; font-weight: bold;">
                            Free: 
                            <span id="free-percentage" style="
                                font-weight: bold; 
                                font-size: 1rem;
                                color: #2c3e50;
                            ">100%</span>
                        </span>
                    </div>
                </div>
            </div>
        `;
        
        this.chartCanvas = document.getElementById('volume-efficiency-chart');
        
        if (typeof Chart === 'undefined') {
            console.error('Chart.js library not found. Please include Chart.js before this script.');
            return;
        }
        
        this.initializeChartImmediate();
    }
    
    /**
     * Initialize chart instance immediately
     */
    initializeChartImmediate() {
        const ctx = this.chartCanvas.getContext('2d');
        
        this.chartInstance = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Occupied', 'Free'],
                datasets: [{
                    data: [0, 100],
                    backgroundColor: [
                        this.chartConfig.colors.occupied,
                        this.chartConfig.colors.free
                    ],
                    borderWidth: 0,
                    hoverBorderWidth: 2,
                    hoverBorderColor: '#34495e'
                }]
            },
            options: {
                ...this.chartConfig.options,
                animation: {
                    duration: 400,
                    easing: 'easeInOutQuart'
                }
            }
        });
    }
    
    /**
     * Update pie chart with new efficiency value
     * @param {number} efficiency - Efficiency percentage (0-100)
     */
    updatePieChart(efficiency) {
        if (!this.isInitialized || !this.chartInstance || this.isLoading) {
            console.warn('Pie chart not ready for updates');
            return;
        }
        
        const freePercentage = 100 - efficiency;
        
        this.chartInstance.data.datasets[0].data = [efficiency, freePercentage];
        this.chartInstance.update('active');
        
        this.updateLegendInfo(efficiency, freePercentage);
    }
    
    /**
     * Update legend information with current percentages
     */
    updateLegendInfo(efficiency, freePercentage) {
        const occupiedSpan = document.getElementById('occupied-percentage');
        const freeSpan = document.getElementById('free-percentage');
        
        if (occupiedSpan) {
            occupiedSpan.textContent = `${efficiency.toFixed(1)}%`;
            occupiedSpan.style.fontSize = '1rem';
            occupiedSpan.style.fontWeight = 'bold';
        }
        
        if (freeSpan) {
            freeSpan.textContent = `${freePercentage.toFixed(1)}%`;
            freeSpan.style.fontSize = '1rem';
            freeSpan.style.fontWeight = 'bold';
        }
    }
    
    /**
     * Main update method for efficiency calculation and visualization
     * @param {Array} boxes - Array of box objects
     * @param {number} currentHeightCm - Current height in centimeters
     * @returns {Object} Efficiency calculation results
     */
    updateEfficiency(boxes, currentHeightCm) {
        const result = this.calculateVolumeEfficiency(boxes, currentHeightCm);
        this.updatePieChart(result.efficiency);
        return result;
    }
    
    /**
     * Get empty efficiency result for cases with no data
     * @returns {Object} Empty efficiency result
     */
    getEmptyEfficiencyResult() {
        this.currentEfficiency = {
            occupiedVolumeCm3: 0,
            availableVolumeCm3: 0,
            efficiency: 0,
            boxCount: 0,
            currentHeightCm: 0
        };
        
        return this.getCurrentEfficiencyResult();
    }
    
    /**
     * Get current efficiency result with additional calculated properties
     * @returns {Object} Complete efficiency result
     */
    getCurrentEfficiencyResult() {
        const result = { ...this.currentEfficiency };
        
        result.wastedVolumeCm3 = result.availableVolumeCm3 - result.occupiedVolumeCm3;
        result.wastedPercentage = result.availableVolumeCm3 > 0 ? 
            (result.wastedVolumeCm3 / result.availableVolumeCm3) * 100 : 0;
        result.volumeDensity = result.currentHeightCm > 0 ? 
            result.occupiedVolumeCm3 / (this.palletDimensions.baseAreaCm2 * result.currentHeightCm) : 0;
        
        return result;
    }
    
    /**
     * Get comprehensive efficiency analysis report
     * @returns {Object} Detailed efficiency report
     */
    getEfficiencyReport() {
        const result = this.getCurrentEfficiencyResult();
        
        return {
            summary: {
                efficiency: result.efficiency,
                occupiedVolumeCm3: result.occupiedVolumeCm3,
                availableVolumeCm3: result.availableVolumeCm3,
                currentHeightCm: result.currentHeightCm
            },
            details: {
                wastedVolumeCm3: result.wastedVolumeCm3,
                wastedPercentage: result.wastedPercentage,
                volumeDensity: result.volumeDensity,
                boxCount: result.boxCount,
                palletDimensions: this.palletDimensions
            },
            metadata: {
                conversionRule: '1 Three.js unit = 100mm = 10cm (based on PalletDataLoader)',
                palletArea: this.palletDimensions.baseAreaCm2,
                calculationMethod: 'Direct conversion from Three.js units'
            }
        };
    }
    
    /**
     * Reset calculator state to initial values
     */
    reset() {
        this.currentEfficiency = {
            occupiedVolumeCm3: 0,
            availableVolumeCm3: 0,
            efficiency: 0,
            boxCount: 0,
            currentHeightCm: 0
        };
        
        if (this.isInitialized) {
            this.updatePieChart(0);
        }
    }
    
    /**
     * Dispose resources and cleanup
     */
    dispose() {
        if (this.chartInstance) {
            this.chartInstance.destroy();
            this.chartInstance = null;
        }
        
        this.currentEfficiency = null;
        this.chartCanvas = null;
        this.isInitialized = false;
    }
}

// Export for global access
window.VolumeEfficiencyCalculator = VolumeEfficiencyCalculator;