/**
 * Volume Efficiency Calculator - VERSÃO COMPLETAMENTE CORRIGIDA
 * 
 * CORREÇÕES CRÍTICAS APLICADAS:
 * 1. Conversão direta baseada no PalletDataLoader (1 unit = 100mm = 10cm)
 * 2. Inicialização segura de variáveis para evitar ReferenceError
 * 3. Validação robusta de geometria das caixas
 * 4. Debug detalhado para troubleshooting
 * 5. Cálculos de palete baseados nos dados reais do Crosslog
 * 
 * Save this as: GUI/3d-viewer/js/VolumeEfficiency.js
 */

class VolumeEfficiencyCalculator {
    constructor() {
        console.log('🔧 INITIALIZING CORRECTED Volume Efficiency Calculator...');
        
        // CORREÇÃO: Usar dimensões baseadas nos dados Crosslog reais
        // Dados do ficheiro: palete 1200mm × 800mm × 1500mm
        // Conversão PalletDataLoader: * 0.01 (logo 1 unit = 100mm)
        this.palletDimensions = {
            lengthCm: 120,          // 1200mm = 120cm
            widthCm: 80,            // 800mm = 80cm  
            baseAreaCm2: 9600,      // 120cm × 80cm = 9600 cm²
            maxHeightCm: 150        // 1500mm = 150cm (referência máxima)
        };
        
        console.log('✅ Pallet dimensions:', this.palletDimensions);
        
        // Estado de cálculo de eficiência
        this.currentEfficiency = {
            occupiedVolumeCm3: 0,      // cm³ das caixas atualmente colocadas
            availableVolumeCm3: 0,     // cm³ do espaço disponível (base × altura)
            efficiency: 0,             // Percentagem (0-100)
            boxCount: 0,               // Número de caixas incluídas
            currentHeightCm: 0         // Altura atual máxima em cm
        };
        
        // Gestão da instância Chart.js
        this.chartInstance = null;
        this.chartCanvas = null;
        this.isInitialized = false;
        this.isLoading = false;
        
        // Configuração do chart (mantida do original com melhorias estéticas)
        this.chartConfig = {
            colors: {
                occupied: '#63CBF1',    // Azul para espaço ocupado
                free: '#909090'         // Cinza claro para espaço livre
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
        
        console.log('✅ Volume Efficiency Calculator corrected and ready');
    }
    
    /**
     * MÉTODO PRINCIPAL - CALCULAR EFICIÊNCIA (COMPLETAMENTE CORRIGIDO)
     */
    calculateVolumeEfficiency(boxes, currentHeightCm) {
        debugLog('VOLUME_EFFICIENCY', '=== CORRECTED Volume Efficiency Calculation ===');
        debugLog('VOLUME_EFFICIENCY', `Input: ${boxes ? boxes.length : 0} boxes, height: ${currentHeightCm}cm`);
        
        // Verificar entrada
        if (!boxes || boxes.length === 0 || currentHeightCm <= 0) {
            debugLog('VOLUME_EFFICIENCY', 'No boxes or invalid height - returning zero efficiency');
            return this.getEmptyEfficiencyResult();
        }
        
        // CALCULAR volume ocupado com validação robusta
        let totalOccupiedVolumeCm3 = 0;
        let validBoxCount = 0;
        
        boxes.forEach((box, index) => {
            try {
                // INICIALIZAR sempre com 0 para evitar ReferenceError
                let boxVolumeCm3 = 0;
                
                // Verificar se o box tem geometria válida
                if (!box.geometry || !box.geometry.parameters) {
                    console.warn(`Box ${index} has invalid geometry`);
                    return; // Skip this box
                }
                
                // Extrair dimensões do box em Three.js units
                const widthUnits = box.geometry.parameters.width || 0;
                const heightUnits = box.geometry.parameters.height || 0;
                const depthUnits = box.geometry.parameters.depth || 0;
                
                // CONVERSÃO CORRETA baseada no PalletDataLoader
                // PalletDataLoader usa * 0.01 para converter mm → units
                // Logo: 1 unit = 100mm = 10cm
                // Conversão: units → cm = × 10
                const widthCm = widthUnits * 10;
                const heightCm = heightUnits * 10;
                const depthCm = depthUnits * 10;
                
                // Calcular volume em cm³
                boxVolumeCm3 = widthCm * heightCm * depthCm;
                
                // Debug detalhado para troubleshooting
                debugLog('VOLUME_EFFICIENCY', `Box ${index}: ${widthUnits.toFixed(2)}×${heightUnits.toFixed(2)}×${depthUnits.toFixed(2)} units = ${widthCm.toFixed(1)}×${heightCm.toFixed(1)}×${depthCm.toFixed(1)} cm = ${boxVolumeCm3.toFixed(1)} cm³`);
                
                if (boxVolumeCm3 > 0) {
                    totalOccupiedVolumeCm3 += boxVolumeCm3;
                    validBoxCount++;
                } else {
                    console.warn(`Box ${index} has invalid volume: ${boxVolumeCm3} (dimensions: ${widthCm}×${heightCm}×${depthCm} cm)`);
                }
                
            } catch (error) {
                console.error(`Error calculating volume for box ${index}:`, error);
            }
        });
        
        // CALCULAR volume disponível (área fixa × altura dinâmica)
        const availableVolumeCm3 = this.palletDimensions.baseAreaCm2 * currentHeightCm;
        
        debugLog('VOLUME_EFFICIENCY', `Total occupied volume: ${totalOccupiedVolumeCm3.toFixed(1)} cm³`);
        debugLog('VOLUME_EFFICIENCY', `Available volume: ${availableVolumeCm3.toFixed(1)} cm³ (${this.palletDimensions.baseAreaCm2} cm² × ${currentHeightCm.toFixed(1)} cm)`);
        
        // CALCULAR percentagem de eficiência
        let efficiency = 0;
        if (availableVolumeCm3 > 0) {
            efficiency = (totalOccupiedVolumeCm3 / availableVolumeCm3) * 100;
            efficiency = Math.min(efficiency, 100); // Máximo 100%
        }
        
        // Armazenar estado atual
        this.currentEfficiency = {
            occupiedVolumeCm3: totalOccupiedVolumeCm3,
            availableVolumeCm3: availableVolumeCm3,
            efficiency: efficiency,
            boxCount: validBoxCount,
            currentHeightCm: currentHeightCm
        };
        
        debugLog('VOLUME_EFFICIENCY', `✅ Efficiency calculated: ${efficiency.toFixed(1)}%`);
        debugLog('VOLUME_EFFICIENCY', `   (${totalOccupiedVolumeCm3.toFixed(0)} / ${availableVolumeCm3.toFixed(0)} cm³)`);
        
        return this.getCurrentEfficiencyResult();
    }
    
    /**
     * INICIALIZAR PIE CHART (mantido do original com correções estéticas)
     */
    initializePieChart() {
        debugLog('VOLUME_EFFICIENCY', 'Initializing Chart.js with corrected calculations...');
        
        const existingChart = document.querySelector('.efficiency-chart');
        if (!existingChart) {
            console.error('Efficiency chart container not found in DOM');
            return false;
        }
        
        this.showLoadingState(existingChart);
        
        setTimeout(() => {
            this.createChartWithAestheticFixes(existingChart);
            this.updatePieChart(0);
            this.isInitialized = true;
            debugLog('VOLUME_EFFICIENCY', '✓ Chart.js initialized with corrected calculations');
        }, 300);
        
        return true;
    }
    
    /**
     * Mostrar estado de loading durante inicialização
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
     * Criar chart com correções estéticas completas
     */
    createChartWithAestheticFixes(container) {
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
        debugLog('VOLUME_EFFICIENCY', 'Chart.js structure created with corrected calculations');
    }
    
    /**
     * Inicializar chart imediatamente sem animações estranhas
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
        
        debugLog('VOLUME_EFFICIENCY', 'Chart.js pie chart instance created with immediate loading');
    }
    
    /**
     * ATUALIZAR PIE CHART (mantido com melhorias de debug)
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
        
        debugLog('VOLUME_EFFICIENCY', `Pie chart updated: ${efficiency.toFixed(1)}% occupied, ${freePercentage.toFixed(1)}% free`);
    }
    
    /**
     * Atualizar informações da legenda com formatação em bold
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
     * MÉTODO PRINCIPAL DE ATUALIZAÇÃO (CORRIGIDO)
     */
    updateEfficiency(boxes, currentHeightCm) {
        // Debug detalhado para troubleshooting
        debugLog('VOLUME_EFFICIENCY', '🔧 Volume Efficiency Update Called:');
        debugLog('VOLUME_EFFICIENCY', `  Boxes: ${boxes ? boxes.length : 0}`);
        debugLog('VOLUME_EFFICIENCY', `  Height: ${currentHeightCm} cm`);
        debugLog('VOLUME_EFFICIENCY', `  Pallet base area: ${this.palletDimensions.baseAreaCm2} cm²`);
        
        // Calcular nova eficiência
        const result = this.calculateVolumeEfficiency(boxes, currentHeightCm);
        
        // Atualizar representação visual
        this.updatePieChart(result.efficiency);
        
        return result;
    }
    
    /**
     * Obter resultado vazio para casos sem dados
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
     * Obter resultado atual com propriedades adicionais calculadas
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
     * DEBUGGING - Analisar estado atual com detalhes completos
     */
    debugCurrentState(boxes, currentHeightCm) {
        console.log('=== VOLUME EFFICIENCY DEBUG ===');
        console.log('Pallet Configuration (CORRECTED):');
        console.log(`  Base area: ${this.palletDimensions.baseAreaCm2} cm²`);
        console.log(`  Current height: ${currentHeightCm} cm`);
        console.log(`  Available volume: ${this.palletDimensions.baseAreaCm2 * currentHeightCm} cm³`);
        console.log('');
        
        if (!boxes || boxes.length === 0) {
            console.log('No boxes to analyze');
            return;
        }
        
        console.log('Box Analysis (First 5 boxes):');
        let totalVolume = 0;
        
        boxes.slice(0, 5).forEach((box, index) => {
            const widthUnits = box.geometry.parameters.width || 0;
            const heightUnits = box.geometry.parameters.height || 0;
            const depthUnits = box.geometry.parameters.depth || 0;
            
            const widthCm = widthUnits * 10;
            const heightCm = heightUnits * 10;
            const depthCm = depthUnits * 10;
            const volume = widthCm * heightCm * depthCm;
            
            totalVolume += volume;
            console.log(`  Box ${index}: ${widthUnits.toFixed(2)}×${heightUnits.toFixed(2)}×${depthUnits.toFixed(2)} units = ${volume.toFixed(1)} cm³`);
        });
        
        if (boxes.length > 5) {
            console.log(`  ... and ${boxes.length - 5} more boxes`);
            
            // Calcular volume total restante
            boxes.slice(5).forEach(box => {
                const widthUnits = box.geometry.parameters.width || 0;
                const heightUnits = box.geometry.parameters.height || 0;
                const depthUnits = box.geometry.parameters.depth || 0;
                totalVolume += (widthUnits * heightUnits * depthUnits) * 1000; // units³ → cm³
            });
        }
        
        console.log('');
        console.log('Volume Summary:');
        console.log(`  Total occupied: ${totalVolume.toFixed(1)} cm³`);
        console.log(`  Total available: ${(this.palletDimensions.baseAreaCm2 * currentHeightCm).toFixed(1)} cm³`);
        
        const efficiency = totalVolume / (this.palletDimensions.baseAreaCm2 * currentHeightCm) * 100;
        console.log(`  Efficiency: ${efficiency.toFixed(1)}%`);
        console.log('===============================');
    }
    
    /**
     * Obter relatório de análise de eficiência completo
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
            debug: {
                conversionRule: '1 Three.js unit = 100mm = 10cm (based on PalletDataLoader)',
                palletArea: this.palletDimensions.baseAreaCm2,
                calculationMethod: 'Direct conversion from Three.js units'
            }
        };
    }
    
    /**
     * Reset calculator state
     */
    reset() {
        debugLog('VOLUME_EFFICIENCY', 'Resetting volume efficiency calculator...');
        
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
        
        debugLog('VOLUME_EFFICIENCY', '✓ Volume efficiency calculator reset');
    }
    
    /**
     * Dispose resources and cleanup
     */
    dispose() {
        debugLog('VOLUME_EFFICIENCY', 'Disposing volume efficiency calculator resources...');
        
        if (this.chartInstance) {
            this.chartInstance.destroy();
            this.chartInstance = null;
        }
        
        this.currentEfficiency = null;
        this.chartCanvas = null;
        this.isInitialized = false;
        
        debugLog('VOLUME_EFFICIENCY', '✓ Volume efficiency calculator disposed');
    }
}

// Export para acesso global
window.VolumeEfficiencyCalculator = VolumeEfficiencyCalculator;