/**
 * Sistema de Diagnóstico Automático para Unidades de Medida
 * Save this as: GUI/3d-viewer/js/debug-config.js
 * 
 * SUBSTITUI o debug-config.js existente - este executa diagnósticos automáticos
 */

// Sistema central de controlo de debugging
window.DEBUG_CONFIG = {
    // Controlo geral - desliga TUDO se for false
    ENABLED: true,
    
    // Controlos específicos por sistema
    UNITS_SYSTEM: true,              // ACTIVADO para diagnóstico
    VOLUME_EFFICIENCY: true,         // ACTIVADO para diagnóstico
    CENTER_OF_MASS: false,
    HEIGHT_CALC: true,               // ACTIVADO para diagnóstico
    ANIMATION: false,
    REVERSE_ENGINEERING: true,
    INITIALIZATION: true,            // ACTIVADO para ver o arranque
    PROGRESS: false,
    
    // NOVO: Sistema de diagnóstico automático
    AUTO_DIAGNOSIS: true,            // Executa diagnósticos automáticos
    DIAGNOSIS_INTERVAL: 5000,        // Diagnóstico a cada 5 segundos
    SHOW_SUMMARY: true               // Mostra resumo na consola
};

// Funções helper para logging condicional (mantidas do original)
window.debugLog = function(category, ...args) {
    if (window.DEBUG_CONFIG.ENABLED && window.DEBUG_CONFIG[category]) {
        console.log(`[${category}]`, ...args);
    }
};

window.debugWarn = function(category, ...args) {
    if (window.DEBUG_CONFIG.ENABLED) {
        console.warn(`[${category}]`, ...args);
    }
};

window.debugError = function(category, ...args) {
    console.error(`[${category}]`, ...args);
};

/**
 * SISTEMA DE DIAGNÓSTICO AUTOMÁTICO
 * Este sistema recolhe automaticamente dados críticos e apresenta conclusões
 */
class AutoDiagnosticsSystem {
    constructor() {
        this.diagnosticHistory = [];
        this.lastBoxCount = 0;
        this.isRunning = false;
        this.intervalId = null;
        
        // Dados críticos que queremos monitorizar
        this.criticalData = {
            boxes: [],
            heightUI: '0cm',
            heightCalculated: 0,
            heightUnits: 0,
            palletDimensions: { x: 0, y: 0, z: 0 },
            volumeEfficiency: 0,
            unitsSystemExists: false,
            conversionFactor: 0
        };
        
        console.log('🔬 Sistema de Diagnóstico Automático inicializado');
        this.startDiagnosis();
    }
    
    /**
     * Iniciar diagnósticos automáticos
     */
    startDiagnosis() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        console.log('🔬 Iniciando diagnósticos automáticos...');
        
        // Diagnóstico imediato
        setTimeout(() => this.runDiagnosis(), 2000);
        
        // Diagnósticos periódicos
        this.intervalId = setInterval(() => {
            this.runDiagnosis();
        }, window.DEBUG_CONFIG.DIAGNOSIS_INTERVAL);
        
        console.log(`🔬 Diagnósticos programados a cada ${window.DEBUG_CONFIG.DIAGNOSIS_INTERVAL/1000} segundos`);
    }
    
    /**
     * MÉTODO PRINCIPAL: Executar diagnóstico completo
     */
    runDiagnosis() {
        const timestamp = new Date().toLocaleTimeString();
        
        try {
            // Recolher dados críticos
            this.collectCriticalData();
            
            // Verificar se há mudanças significativas
            const hasChanges = this.detectSignificantChanges();
            
            if (hasChanges || window.DEBUG_CONFIG.SHOW_SUMMARY) {
                console.log(`\n🔬 [${timestamp}] DIAGNÓSTICO AUTOMÁTICO`);
                console.log('=' .repeat(50));
                
                // Executar análises específicas
                this.analyzeBoxData();
                this.analyzeHeightConsistency();
                this.analyzeUnitsSystem();
                this.analyzeVolumeEfficiency();
                this.provideConclusionsAndRecommendations();
                
                console.log('=' .repeat(50));
            }
            
            // Armazenar no histórico
            this.storeDiagnosticData();
            
        } catch (error) {
            console.error('🔬 Erro no diagnóstico automático:', error);
        }
    }
    
    /**
     * Recolher todos os dados críticos do sistema
     */
    collectCriticalData() {
        // 1. Verificar se a aplicação principal existe
        const app = window.palletApp;
        if (!app || !app.simulator) {
            this.criticalData.boxes = [];
            return;
        }
        
        // 2. Recolher dados dos boxes
        this.criticalData.boxes = app.simulator.boxes || [];
        
        // 3. Altura mostrada no UI
        const heightElement = document.getElementById('current-height');
        this.criticalData.heightUI = heightElement ? heightElement.textContent : '0cm';
        
        // 4. Verificar sistema de unidades
        this.criticalData.unitsSystemExists = typeof window.unitsSystem !== 'undefined';
        
        // 5. Calcular altura em units (coordenadas Three.js)
        if (this.criticalData.boxes.length > 0) {
            this.calculateRealDimensions();
        }
        
        // 6. Volume efficiency atual
        const efficiencyElement = document.querySelector('#occupied-percentage');
        if (efficiencyElement) {
            const match = efficiencyElement.textContent.match(/(\d+\.?\d*)/);
            this.criticalData.volumeEfficiency = match ? parseFloat(match[1]) : 0;
        }
    }
    
    /**
     * Calcular dimensões reais em coordenadas Three.js
     */
    calculateRealDimensions() {
        const boxes = this.criticalData.boxes;
        if (boxes.length === 0) return;
        
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;
        
        boxes.forEach(box => {
            if (!box.geometry || !box.geometry.parameters) return;
            
            const params = box.geometry.parameters;
            const pos = box.position;
            
            // Calcular extremidades de cada box
            const leftX = pos.x - params.width/2;
            const rightX = pos.x + params.width/2;
            const bottomY = pos.y - params.height/2;
            const topY = pos.y + params.height/2;
            const backZ = pos.z - params.depth/2;
            const frontZ = pos.z + params.depth/2;
            
            // Atualizar extremos globais
            if (leftX < minX) minX = leftX;
            if (rightX > maxX) maxX = rightX;
            if (bottomY < minY) minY = bottomY;
            if (topY > maxY) maxY = topY;
            if (backZ < minZ) minZ = backZ;
            if (frontZ > maxZ) maxZ = frontZ;
        });
        
        // Armazenar dimensões calculadas
        this.criticalData.palletDimensions = {
            x: maxX - minX,
            y: maxY - minY,
            z: maxZ - minZ
        };
        
        this.criticalData.heightUnits = maxY - minY;
    }
    
    /**
     * Detectar se houve mudanças significativas que justifiquem um relatório
     */
    detectSignificantChanges() {
        const currentBoxCount = this.criticalData.boxes.length;
        
        // Mudança no número de boxes é sempre significativa
        if (currentBoxCount !== this.lastBoxCount) {
            this.lastBoxCount = currentBoxCount;
            return true;
        }
        
        // Se for o primeiro diagnóstico
        if (this.diagnosticHistory.length === 0) {
            return true;
        }
        
        // Mostrar summary periodicamente mesmo sem mudanças
        const lastDiagnosis = this.diagnosticHistory[this.diagnosticHistory.length - 1];
        const timeSinceLastReport = Date.now() - lastDiagnosis.timestamp;
        
        return timeSinceLastReport > 30000; // Relatório a cada 30 segundos
    }
    
    /**
     * ANÁLISE 1: Dados dos boxes
     */
    analyzeBoxData() {
        const boxCount = this.criticalData.boxes.length;
        
        console.log(`📦 BOXES: ${boxCount} encontrados`);
        
        if (boxCount === 0) {
            console.log('   ⚠️  Nenhum box carregado - diagnóstico limitado');
            return;
        }
        
        // Analisar alguns boxes de exemplo
        const sampleSize = Math.min(3, boxCount);
        console.log(`   📊 Análise de ${sampleSize} boxes (amostra):`);
        
        for (let i = 0; i < sampleSize; i++) {
            const box = this.criticalData.boxes[i];
            if (box.geometry && box.geometry.parameters) {
                const params = box.geometry.parameters;
                const volume = params.width * params.height * params.depth;
                console.log(`   Box ${i}: ${params.width.toFixed(2)}×${params.height.toFixed(2)}×${params.depth.toFixed(2)} units (vol: ${volume.toFixed(3)} units³)`);
            }
        }
    }
    
    /**
     * ANÁLISE 2: Consistência da altura
     */
    analyzeHeightConsistency() {
        console.log(`📏 ALTURA:`);
        console.log(`   UI mostra: ${this.criticalData.heightUI}`);
        console.log(`   Calculada: ${this.criticalData.heightUnits.toFixed(3)} units`);
        
        // Extrair valor numérico da altura do UI
        const heightMatch = this.criticalData.heightUI.match(/(\d+\.?\d*)/);
        if (heightMatch) {
            const heightUINumber = parseFloat(heightMatch[1]);
            const heightUnits = this.criticalData.heightUnits;
            
            if (heightUnits > 0) {
                const conversionFactor = heightUINumber / heightUnits;
                this.criticalData.conversionFactor = conversionFactor;
                
                console.log(`   Factor de conversão implícito: ${conversionFactor.toFixed(2)} cm/unit`);
                console.log(`   (${heightUINumber} cm ÷ ${heightUnits.toFixed(3)} units = ${conversionFactor.toFixed(2)})`);
                
                // Avaliar se faz sentido
                if (conversionFactor >= 8 && conversionFactor <= 12) {
                    console.log(`   ✅ Factor parece correto (próximo de 10 cm/unit)`);
                } else if (conversionFactor >= 0.8 && conversionFactor <= 1.2) {
                    console.log(`   ⚠️  Factor sugere 1 unit = 1 cm`);
                } else {
                    console.log(`   🔴 Factor suspeito - pode indicar problema de escala`);
                }
            }
        }
    }
    
    /**
     * ANÁLISE 3: Sistema de unidades
     */
    analyzeUnitsSystem() {
        console.log(`🔧 SISTEMA DE UNIDADES:`);
        
        if (this.criticalData.unitsSystemExists) {
            console.log(`   ✅ window.unitsSystem encontrado`);
            
            try {
                const config = window.unitsSystem.conversions;
                console.log(`   Configuração: ${JSON.stringify(config)}`);
                
                if (config && config.threeUnitsToCm) {
                    const officialFactor = config.threeUnitsToCm;
                    const calculatedFactor = this.criticalData.conversionFactor;
                    
                    console.log(`   Factor oficial: ${officialFactor} cm/unit`);
                    
                    if (calculatedFactor > 0) {
                        const difference = Math.abs(officialFactor - calculatedFactor);
                        const percentDiff = (difference / officialFactor) * 100;
                        
                        console.log(`   Diferença: ${difference.toFixed(2)} cm/unit (${percentDiff.toFixed(1)}%)`);
                        
                        if (percentDiff < 10) {
                            console.log(`   ✅ Configuração consistente com cálculos`);
                        } else {
                            console.log(`   🔴 INCONSISTÊNCIA DETECTADA!`);
                        }
                    }
                }
            } catch (error) {
                console.log(`   ⚠️  Erro ao aceder configuração: ${error.message}`);
            }
        } else {
            console.log(`   🔴 window.unitsSystem NÃO encontrado`);
        }
    }
    
    /**
     * ANÁLISE 4: Volume Efficiency
     */
    analyzeVolumeEfficiency() {
        console.log(`📊 VOLUME EFFICIENCY:`);
        console.log(`   Valor atual: ${this.criticalData.volumeEfficiency}%`);
        
        if (this.criticalData.volumeEfficiency >= 99) {
            console.log(`   🔴 PROBLEMA: Efficiency suspeita (${this.criticalData.volumeEfficiency}%)`);
            console.log(`   Possíveis causas:`);
            console.log(`   - Cálculo de altura disponível incorreto`);
            console.log(`   - Erro na conversão de unidades`);
            console.log(`   - Volume das boxes mal calculado`);
        } else if (this.criticalData.volumeEfficiency > 0) {
            console.log(`   ✅ Efficiency parece normal`);
        } else {
            console.log(`   ⚠️  Efficiency zero - pode ser normal se não houver boxes`);
        }
    }
    
    /**
     * ANÁLISE 5: Conclusões e recomendações
     */
    provideConclusionsAndRecommendations() {
        console.log(`🎯 CONCLUSÕES:`);
        
        const factor = this.criticalData.conversionFactor;
        const boxes = this.criticalData.boxes.length;
        const efficiency = this.criticalData.volumeEfficiency;
        
        if (boxes === 0) {
            console.log(`   📝 Carregue um palete para análise completa`);
            return;
        }
        
        // Análise do factor de conversão
        if (factor >= 8 && factor <= 12) {
            console.log(`   ✅ Sistema de unidades aparenta estar CORRETO`);
            console.log(`   📝 Factor ${factor.toFixed(1)} cm/unit é próximo do esperado (10 cm/unit)`);
        } else if (factor >= 0.8 && factor <= 1.2) {
            console.log(`   ⚠️  Sistema pode estar usando 1 unit = 1 cm`);
            console.log(`   📝 Considere verificar conversões em pallet-loader.js`);
        } else {
            console.log(`   🔴 PROBLEMA DETECTADO no sistema de unidades`);
            console.log(`   📝 Factor ${factor.toFixed(1)} cm/unit está fora do esperado`);
        }
        
        // Análise do volume efficiency
        if (efficiency >= 99) {
            console.log(`   🔴 Volume Efficiency suspeita (${efficiency}%)`);
            console.log(`   📝 Verifique cálculos em VolumeEfficiency.js`);
        }
        
        // Recomendações específicas
        console.log(`\n💡 RECOMENDAÇÕES:`);
        
        if (factor < 5 || factor > 15) {
            console.log(`   1. Verificar conversões em pallet-loader.js (linha ~200)`);
            console.log(`   2. Confirmar se * 0.01 está correto para mm→units`);
        }
        
        if (efficiency >= 99) {
            console.log(`   3. Debug do volume calculation em VolumeEfficiency.js`);
            console.log(`   4. Verificar se altura atual está correcta`);
        }
        
        if (!this.criticalData.unitsSystemExists) {
            console.log(`   5. Carregar units-system.js antes de main.js`);
        }
    }
    
    /**
     * Armazenar dados para histórico
     */
    storeDiagnosticData() {
        this.diagnosticHistory.push({
            timestamp: Date.now(),
            data: { ...this.criticalData }
        });
        
        // Manter apenas últimos 10 diagnósticos
        if (this.diagnosticHistory.length > 10) {
            this.diagnosticHistory.shift();
        }
    }
    
    /**
     * Parar diagnósticos
     */
    stopDiagnosis() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
        console.log('🔬 Diagnósticos automáticos parados');
    }
    
    /**
     * Forçar diagnóstico manual
     */
    forceDiagnosis() {
        console.log('🔬 Diagnóstico manual forçado...');
        this.runDiagnosis();
    }
}

// Inicializar sistema de diagnóstico automático quando DOM estiver pronto
if (window.DEBUG_CONFIG.AUTO_DIAGNOSIS) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                window.autoDiagnostics = new AutoDiagnosticsSystem();
            }, 3000); // Esperar 3 segundos para a aplicação carregar
        });
    } else {
        setTimeout(() => {
            window.autoDiagnostics = new AutoDiagnosticsSystem();
        }, 3000);
    }
    
    console.log('🔬 Sistema de diagnóstico será iniciado em 3 segundos...');
    console.log('💡 Comandos disponíveis após carregamento:');
    console.log('   window.autoDiagnostics.forceDiagnosis() - diagnóstico manual');
    console.log('   window.autoDiagnostics.stopDiagnosis() - parar diagnósticos');
}