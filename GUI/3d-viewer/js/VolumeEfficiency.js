/**
 * Volume Efficiency Calculator - CORREÇÕES ESTÉTICAS ESPECÍFICAS
 * 
 * CORREÇÕES IMPLEMENTADAS:
 * 1. Carregamento imediato do pie chart (sem animação inicial estranha)
 * 2. Estado de loading durante inicialização
 * 3. Números em bold e maiores para melhor visibilidade
 * 4. Gráfico maior e mais circular
 * 5. Eliminação de valores hardcoded durante carregamento
 * 
 * Save this as: GUI/3d-viewer/js/VolumeEfficiency.js
 */

class VolumeEfficiencyCalculator {
    constructor() {
        // Pallet physical dimensions (1 unit = 10cm in coordinate system)
        this.palletDimensions = {
            length: 12.0,           // 12.0 units = 120cm (1200mm)
            width: 8.0,             // 8.0 units = 80cm (800mm)
            baseArea: 9600,         // 120cm × 80cm = 9600 cm²
            maxHeight: 20.0         // Maximum reasonable height for calculations (200cm)
        };
        
        // Unit conversion constants
        this.unitConversion = {
            unitsToMm: 100,         // 1 unit = 100mm
            unitsToCm: 10,          // 1 unit = 10cm
            mmToCm: 0.1             // 1mm = 0.1cm
        };
        
        // Efficiency calculation state
        this.currentEfficiency = {
            occupiedVolume: 0,      // cm³ of boxes currently placed
            availableVolume: 0,     // cm³ of current pallet space (base × height)
            efficiency: 0,          // Percentage (0-100)
            boxCount: 0,            // Number of boxes included
            currentHeight: 0        // Current maximum height of stack in cm
        };
        
        // Chart.js instance management
        this.chartInstance = null;
        this.chartCanvas = null;
        this.isInitialized = false;
        this.isLoading = false;
        
        // CORRIGIDO: Configuração para carregamento imediato e visual melhorado
        this.chartConfig = {
            colors: {
                occupied: '#63CBF1',    // Azul para espaço ocupado
                free: '#ecf0f1'         // Cinza para espaço livre
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false  // Legenda customizada
                    },
                    tooltip: {
                        enabled: true,
                        callbacks: {
                            label: function(context) {
                                return context.label + ': ' + context.parsed.toFixed(1) + '%';
                            }
                        }
                    }
                },
                // CORRIGIDO: Desabilitar animação inicial para carregamento imediato
                animation: {
                    duration: 0,        // Sem animação inicial
                    easing: 'linear'
                },
                // CORRIGIDO: Configurações para gráfico mais circular
                elements: {
                    arc: {
                        borderWidth: 0,     // Sem bordas que criam aparência "reta"
                        borderRadius: 0     // Sem raio nas bordas
                    }
                },
                // Animações apenas para updates posteriores
                responsive: true,
                interaction: {
                    intersect: false
                }
            }
        };
        
        console.log('VolumeEfficiencyCalculator initialized with aesthetic fixes');
    }
    
    /**
     * CORRIGIDO: Inicialização com loading state e carregamento imediato
     */
    initializePieChart() {
        console.log('Initializing Chart.js with immediate loading and aesthetic fixes...');
        
        // Encontrar o container existente
        const existingChart = document.querySelector('.efficiency-chart');
        if (!existingChart) {
            console.error('Efficiency chart container not found in DOM');
            return false;
        }
        
        // CORRIGIDO: Mostrar estado de loading imediatamente
        this.showLoadingState(existingChart);
        
        // Pequeno delay para mostrar loading antes de criar o chart
        setTimeout(() => {
            this.createChartWithAestheticFixes(existingChart);
            this.updatePieChart(0); // Inicializar com 0% imediatamente
            this.isInitialized = true;
            console.log('✓ Chart.js initialized with aesthetic fixes applied');
        }, 300); // 300ms é suficiente para ver o loading sem ser irritante
        
        return true;
    }
    
    /**
     * NOVO: Mostrar estado de loading durante inicialização
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
     * CORRIGIDO: Criar chart com todas as correções estéticas
     */
    createChartWithAestheticFixes(container) {
        this.isLoading = false;
        
        // CORRIGIDO: Tamanho maior para o gráfico (150px em vez de 120px)
        container.innerHTML = `
            <div style="position: relative; width: 150px; height: 150px; margin: 0 auto;">
                <canvas id="volume-efficiency-chart" width="150" height="150"></canvas>
            </div>
            
            <!-- CORRIGIDO: Legenda com números em bold e maiores -->
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
        
        // Obter referência do canvas
        this.chartCanvas = document.getElementById('volume-efficiency-chart');
        
        // Verificar se Chart.js está disponível
        if (typeof Chart === 'undefined') {
            console.error('Chart.js library not found. Please include Chart.js before this script.');
            return;
        }
        
        // CORRIGIDO: Inicializar chart sem animação inicial
        this.initializeChartImmediate();
        
        console.log('Chart.js structure created with aesthetic fixes applied');
    }
    
    /**
     * CORRIGIDO: Inicializar chart imediatamente sem animações estranhas
     */
    initializeChartImmediate() {
        const ctx = this.chartCanvas.getContext('2d');
        
        this.chartInstance = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Occupied', 'Free'],
                datasets: [{
                    data: [0, 100], // Estado inicial: 0% occupied, 100% free
                    backgroundColor: [
                        this.chartConfig.colors.occupied,
                        this.chartConfig.colors.free
                    ],
                    borderWidth: 0,         // CORRIGIDO: Sem bordas para aparência mais circular
                    hoverBorderWidth: 2,
                    hoverBorderColor: '#34495e'
                }]
            },
            options: {
                ...this.chartConfig.options,
                // CORRIGIDO: Reabilitar animações suaves apenas para updates
                animation: {
                    duration: 400,          // Animação rápida para updates
                    easing: 'easeInOutQuart'
                }
            }
        });
        
        console.log('Chart.js pie chart instance created with immediate loading');
    }
    
    /**
     * CORRIGIDO: Calcular eficiência volumétrica (mantém funcionalidade original)
     */
    calculateVolumeEfficiency(boxes, currentHeightCm) {
        console.log('=== Calculating Volume Efficiency ===');
        
        // Handle empty state
        if (!boxes || boxes.length === 0 || currentHeightCm <= 0) {
            console.log('No boxes or invalid height - returning zero efficiency');
            return this.getEmptyEfficiencyResult();
        }
        
        // Calculate total occupied volume from all boxes
        let totalOccupiedVolume = 0;
        let validBoxCount = 0;
        
        boxes.forEach((box, index) => {
            try {
                // Extract box dimensions from geometry (in units, convert to cm)
                const widthUnits = box.geometry.parameters.width;
                const heightUnits = box.geometry.parameters.height;
                const depthUnits = box.geometry.parameters.depth;
                
                // Convert from units to cm (1 unit = 10cm)
                const widthCm = widthUnits * this.unitConversion.unitsToCm;
                const heightCm = heightUnits * this.unitConversion.unitsToCm;
                const depthCm = depthUnits * this.unitConversion.unitsToCm;
                
                // Calculate individual box volume in cm³
                const boxVolume = widthCm * heightCm * depthCm;
                
                if (boxVolume > 0) {
                    totalOccupiedVolume += boxVolume;
                    validBoxCount++;
                } else {
                    console.warn(`Box ${index} has invalid volume: ${boxVolume}`);
                }
                
                // Debug output for first few boxes
                if (index < 3) {
                    console.log(`Box ${index}: ${widthCm.toFixed(1)} × ${heightCm.toFixed(1)} × ${depthCm.toFixed(1)} cm = ${boxVolume.toFixed(1)} cm³`);
                }
            } catch (error) {
                console.error(`Error calculating volume for box ${index}:`, error);
            }
        });
        
        // Calculate available volume (fixed pallet area × dynamic height)
        const availableVolume = this.palletDimensions.baseArea * currentHeightCm;
        
        // Calculate efficiency percentage
        let efficiency = 0;
        if (availableVolume > 0) {
            efficiency = (totalOccupiedVolume / availableVolume) * 100;
            // Cap efficiency at 100%
            efficiency = Math.min(efficiency, 100);
        }
        
        // Store current state
        this.currentEfficiency = {
            occupiedVolume: totalOccupiedVolume,
            availableVolume: availableVolume,
            efficiency: efficiency,
            boxCount: validBoxCount,
            currentHeight: currentHeightCm
        };
        
        // Log results
        console.log(`✓ Efficiency calculated:`);
        console.log(`  - Occupied: ${totalOccupiedVolume.toFixed(1)} cm³`);
        console.log(`  - Available: ${availableVolume.toFixed(1)} cm³`);
        console.log(`  - Efficiency: ${efficiency.toFixed(1)}%`);
        console.log(`  - Boxes: ${validBoxCount}`);
        
        return this.getCurrentEfficiencyResult();
    }
    
    /**
     * Get empty efficiency result for cases with no data
     */
    getEmptyEfficiencyResult() {
        this.currentEfficiency = {
            occupiedVolume: 0,
            availableVolume: 0,
            efficiency: 0,
            boxCount: 0,
            currentHeight: 0
        };
        
        return this.getCurrentEfficiencyResult();
    }
    
    /**
     * Get current efficiency result with additional calculated properties
     */
    getCurrentEfficiencyResult() {
        const result = { ...this.currentEfficiency };
        
        // Add additional analysis properties
        result.wastedVolume = result.availableVolume - result.occupiedVolume;
        result.wastedPercentage = result.availableVolume > 0 ? 
            (result.wastedVolume / result.availableVolume) * 100 : 0;
        result.volumeDensity = result.currentHeight > 0 ? 
            result.occupiedVolume / (this.palletDimensions.baseArea * result.currentHeight) : 0;
        
        return result;
    }
    
    /**
     * CORRIGIDO: Atualizar pie chart com animação suave (não inicial)
     */
    updatePieChart(efficiency) {
        if (!this.isInitialized || !this.chartInstance || this.isLoading) {
            console.warn('Pie chart not ready for updates');
            return;
        }
        
        // Calculate free percentage
        const freePercentage = 100 - efficiency;
        
        // Update Chart.js data with smooth animation
        this.chartInstance.data.datasets[0].data = [efficiency, freePercentage];
        this.chartInstance.update('active');
        
        // CORRIGIDO: Atualizar legenda com formatação em bold
        this.updateLegendInfo(efficiency, freePercentage);
        
        console.log(`Pie chart updated: ${efficiency.toFixed(1)}% occupied, ${freePercentage.toFixed(1)}% free`);
    }
    
    /**
     * CORRIGIDO: Atualizar informações da legenda com formatação em bold
     */
    updateLegendInfo(efficiency, freePercentage) {
        const occupiedSpan = document.getElementById('occupied-percentage');
        const freeSpan = document.getElementById('free-percentage');
        
        if (occupiedSpan) {
            occupiedSpan.textContent = `${efficiency.toFixed(1)}%`;
            // Você pode ajustar estes valores para tornar ainda maiores:
            occupiedSpan.style.fontSize = '1rem';        // Mude para 1.1rem ou 1.2rem se quiser maior
            occupiedSpan.style.fontWeight = 'bold';      // Já está em bold
        }
        
        if (freeSpan) {
            freeSpan.textContent = `${freePercentage.toFixed(1)}%`;
            // Você pode ajustar estes valores para tornar ainda maiores:
            freeSpan.style.fontSize = '1rem';            // Mude para 1.1rem ou 1.2rem se quiser maior
            freeSpan.style.fontWeight = 'bold';          // Já está em bold
        }
    }
    
    /**
     * Main update method - call this from the main application loop
     */
    updateEfficiency(boxes, currentHeightCm) {
        // Calculate new efficiency
        const result = this.calculateVolumeEfficiency(boxes, currentHeightCm);
        
        // Update visual representation
        this.updatePieChart(result.efficiency);
        
        return result;
    }
    
    /**
     * Get efficiency analysis report
     */
    getEfficiencyReport() {
        const result = this.getCurrentEfficiencyResult();
        
        return {
            summary: {
                efficiency: result.efficiency,
                occupiedVolume: result.occupiedVolume,
                availableVolume: result.availableVolume,
                currentHeight: result.currentHeight
            },
            details: {
                wastedVolume: result.wastedVolume,
                wastedPercentage: result.wastedPercentage,
                volumeDensity: result.volumeDensity,
                boxCount: result.boxCount,
                palletDimensions: this.palletDimensions,
                unitConversion: this.unitConversion
            }
        };
    }
    
    /**
     * Debug method for efficiency calculation analysis
     */
    debugEfficiencyCalculation() {
        console.log('=== VOLUME EFFICIENCY DEBUG ===');
        console.log('Unit System:');
        console.log(`  1 coordinate unit = ${this.unitConversion.unitsToCm} cm`);
        console.log('');
        console.log('Pallet Configuration:');
        console.log(`  Dimensions: ${this.palletDimensions.length} × ${this.palletDimensions.width} units`);
        console.log(`  Real size: ${this.palletDimensions.length * this.unitConversion.unitsToCm} × ${this.palletDimensions.width * this.unitConversion.unitsToCm} cm`);
        console.log(`  Base Area: ${this.palletDimensions.baseArea} cm²`);
        console.log(`  Current Height: ${this.currentEfficiency.currentHeight} cm`);
        console.log('');
        console.log('Volume Analysis:');
        console.log(`  Occupied: ${this.currentEfficiency.occupiedVolume.toFixed(2)} cm³`);
        console.log(`  Available: ${this.currentEfficiency.availableVolume.toFixed(2)} cm³`);
        console.log(`  Efficiency: ${this.currentEfficiency.efficiency.toFixed(2)}%`);
        console.log('');
        console.log('Box Information:');
        console.log(`  Box Count: ${this.currentEfficiency.boxCount}`);
        console.log(`  Average Box Volume: ${this.currentEfficiency.boxCount > 0 ? 
            (this.currentEfficiency.occupiedVolume / this.currentEfficiency.boxCount).toFixed(2) : 0} cm³`);
        console.log('===============================');
    }
    
    /**
     * Reset efficiency calculator state
     */
    reset() {
        console.log('Resetting volume efficiency calculator...');
        
        this.currentEfficiency = {
            occupiedVolume: 0,
            availableVolume: 0,
            efficiency: 0,
            boxCount: 0,
            currentHeight: 0
        };
        
        if (this.isInitialized) {
            this.updatePieChart(0);
        }
        
        console.log('✓ Volume efficiency calculator reset');
    }
    
    /**
     * Dispose of resources and cleanup
     */
    dispose() {
        console.log('Disposing volume efficiency calculator resources...');
        
        // Destroy Chart.js instance
        if (this.chartInstance) {
            this.chartInstance.destroy();
            this.chartInstance = null;
        }
        
        this.currentEfficiency = null;
        this.chartCanvas = null;
        this.isInitialized = false;
        
        console.log('✓ Volume efficiency calculator disposed');
    }
}

// Export for global access
window.VolumeEfficiencyCalculator = VolumeEfficiencyCalculator;