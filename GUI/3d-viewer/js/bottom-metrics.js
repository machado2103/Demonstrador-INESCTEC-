/**
 * Bottom Metrics Calculator for Palletization Simulator
 * 
 * MÉTRICAS IMPLEMENTADAS:
 * 1. Load Stability Index (LSI) - Substitui "Collisions"
 * 2. Box Density Score - Substitui "Global Efficiency"
 * 
 * LIMITES SEGUROS AJUSTÁVEIS:
 * - Limite conservador: 20cm (para transportes sensíveis)
 * - Limite padrão: 30cm (para aplicações industriais normais)
 * - Limite liberal: 40cm (para cargas estáveis)
 * 
 * Save this as: GUI/3d-viewer/js/bottom-metrics.js
 */

class BottomMetricsCalculator {
    constructor() {
        // Pallet physical dimensions (1 unit = 10cm in coordinate system)
        this.palletDimensions = {
            length: 12.0,           // 120cm
            width: 8.0,             // 80cm
            baseArea: 96,           // 120cm × 80cm = 9600 cm² (stored as 96 for easier calculation)
            centerX: 0,             // Pallet center X
            centerZ: 0              // Pallet center Z
        };
        
        // CONFIGURAÇÃO DE LIMITES SEGUROS AJUSTÁVEIS
        this.safetyLimits = {
            // Diferentes níveis de segurança baseados em padrões industriais
            conservative: 20,       // 20cm - Para transportes sensíveis (produtos frágeis)
            standard: 30,           // 30cm - Para aplicações industriais normais
            liberal: 40,            // 40cm - Para cargas muito estáveis
            
            // Limite ativo (pode ser alterado dinamicamente)
            current: 30             // PADRÃO: 30cm (mais realista que 40cm)
        };
        
        // Current metrics state
        this.currentMetrics = {
            // Load Stability Index components
            lsi: {
                value: 100,                     // LSI percentage (0-100%)
                centerOfMassScore: 100,         // Center of mass contribution
                weightDistributionScore: 100,   // Weight distribution contribution
                stabilityRating: 'Excellent'    // Text rating
            },
            
            // Box Density Score components
            boxDensity: {
                value: 0,                       // Boxes per square meter
                score: 0,                       // Density score (0-100%)
                efficiency: 'Low'               // Efficiency rating
            }
        };
        
        console.log('BottomMetricsCalculator initialized');
        console.log(`Active safety limit: ${this.safetyLimits.current}cm`);
        console.log('Available safety profiles:', Object.keys(this.safetyLimits).filter(key => key !== 'current'));
    }
    
    /**
     * MÉTODO PRINCIPAL: Calcular todas as métricas avançadas
     * @param {Array} boxes - Array de boxes Three.js
     * @param {Object} centerOfMassResult - Resultado do cálculo de centro de massa
     * @returns {Object} Métricas calculadas
     */
    calculateBottomMetrics(boxes, centerOfMassResult = null) {
        console.log('=== Calculating Bottom Metrics ===');
        
        // Validar entrada
        if (!boxes || boxes.length === 0) {
            return this.getEmptyMetrics();
        }
        
        // Calcular Load Stability Index
        const lsiResult = this.calculateLoadStabilityIndex(boxes, centerOfMassResult);
        
        // Calcular Box Density Score
        const densityResult = this.calculateBoxDensityScore(boxes);
        
        // Armazenar resultados
        this.currentMetrics.lsi = lsiResult;
        this.currentMetrics.boxDensity = densityResult;
        
        console.log(`✓ LSI: ${lsiResult.value.toFixed(1)}% (${lsiResult.stabilityRating})`);
        console.log(`✓ Box Density: ${densityResult.value.toFixed(1)} boxes/m² (${densityResult.efficiency})`);
        
        return this.getCurrentMetrics();
    }
    
    /**
     * CALCULAR LOAD STABILITY INDEX (LSI)
     * Formula: LSI = (Center_of_Mass_Score × 0.6) + (Weight_Distribution_Score × 0.4)
     * 
     * @param {Array} boxes - Array de boxes
     * @param {Object} centerOfMassResult - Resultado do centro de massa
     * @returns {Object} LSI calculation result
     */
    calculateLoadStabilityIndex(boxes, centerOfMassResult) {
        console.log('Calculating Load Stability Index...');
        
        // 1. CENTER OF MASS SCORE (60% do LSI)
        let centerOfMassScore = 100; // Default quando não há desvio
        
        if (centerOfMassResult && typeof centerOfMassResult.deviationCm === 'number') {
            const deviationCm = centerOfMassResult.deviationCm;
            const safeLimit = this.safetyLimits.current;
            
            // Calcular score baseado no desvio em relação ao limite seguro
            if (deviationCm <= safeLimit) {
                // Linear decay: 100% quando desvio = 0, 0% quando desvio = limite
                centerOfMassScore = Math.max(0, (1 - deviationCm / safeLimit) * 100);
            } else {
                // Penalidade severa para desvios acima do limite
                centerOfMassScore = 0;
            }
            
            console.log(`Center of Mass: ${deviationCm.toFixed(1)}cm deviation, score: ${centerOfMassScore.toFixed(1)}%`);
        }
        
        // 2. WEIGHT DISTRIBUTION SCORE (40% do LSI)
        const weightDistributionScore = this.calculateWeightDistributionScore(boxes);
        
        // 3. CALCULAR LSI FINAL
        const lsiValue = (centerOfMassScore * 0.6) + (weightDistributionScore * 0.4);
        
        // 4. DETERMINAR RATING DE ESTABILIDADE
        const stabilityRating = this.getLSIRating(lsiValue);
        
        return {
            value: lsiValue,
            centerOfMassScore: centerOfMassScore,
            weightDistributionScore: weightDistributionScore,
            stabilityRating: stabilityRating,
            safetyLimit: this.safetyLimits.current
        };
    }
    
    /**
     * Calcular score de distribuição de peso
     * Analisa como o peso está distribuído ao longo do palete
     * 
     * @param {Array} boxes - Array de boxes
     * @returns {number} Weight distribution score (0-100%)
     */
    calculateWeightDistributionScore(boxes) {
        if (boxes.length <= 1) return 100; // Um ou nenhum box = distribuição perfeita
        
        // Dividir palete em 4 quadrantes
        const quadrants = [0, 0, 0, 0]; // [Q1, Q2, Q3, Q4]
        let totalWeight = 0;
        
        boxes.forEach(box => {
            const weight = box.userData.weight || 0;
            const x = box.position.x;
            const z = box.position.z;
            
            // Determinar quadrante baseado na posição
            let quadrant = 0;
            if (x >= 0 && z >= 0) quadrant = 0; // Q1: +x, +z
            else if (x < 0 && z >= 0) quadrant = 1; // Q2: -x, +z
            else if (x < 0 && z < 0) quadrant = 2; // Q3: -x, -z
            else quadrant = 3; // Q4: +x, -z
            
            quadrants[quadrant] += weight;
            totalWeight += weight;
        });
        
        if (totalWeight === 0) return 100;
        
        // Calcular percentuais por quadrante
        const percentages = quadrants.map(weight => (weight / totalWeight) * 100);
        
        // Calcular desvio padrão dos percentuais
        const mean = 25; // Distribuição perfeita = 25% por quadrante
        const variance = percentages.reduce((sum, percentage) => {
            return sum + Math.pow(percentage - mean, 2);
        }, 0) / 4;
        const standardDeviation = Math.sqrt(variance);
        
        // Converter desvio padrão para score (0-100%)
        // SD = 0 (perfeito) → 100%, SD = 25 (terrível) → 0%
        const maxSD = 25; // Máximo desvio possível
        const score = Math.max(0, (1 - standardDeviation / maxSD) * 100);
        
        console.log(`Weight distribution SD: ${standardDeviation.toFixed(1)}%, score: ${score.toFixed(1)}%`);
        return score;
    }
    
    /**
     * Determinar rating de estabilidade baseado no LSI
     * @param {number} lsiValue - Valor do LSI (0-100%)
     * @returns {string} Rating de estabilidade
     */
    getLSIRating(lsiValue) {
        if (lsiValue >= 85) return 'Excellent';
        if (lsiValue >= 70) return 'Good';
        if (lsiValue >= 55) return 'Fair';
        if (lsiValue >= 40) return 'Poor';
        return 'Critical';
    }
    
    /**
     * CALCULAR BOX DENSITY SCORE
     * Mede quantos boxes por metro quadrado + eficiência de utilização
     * 
     * @param {Array} boxes - Array de boxes
     * @returns {Object} Box density calculation result
     */
    calculateBoxDensityScore(boxes) {
        console.log('Calculating Box Density Score...');
        
        if (!boxes || boxes.length === 0) {
            return {
                value: 0,
                score: 0,
                efficiency: 'Empty'
            };
        }
        
        // 1. CALCULAR DENSIDADE BRUTA (boxes por m²)
        const palletAreaM2 = this.palletDimensions.baseArea / 100; // Converter para m²
        const rawDensity = boxes.length / palletAreaM2;
        
        // 2. CALCULAR SCORE DE EFICIÊNCIA
        // Baseado em benchmarks industriais: 30-50 boxes/m² é típico para paletes mistas
        const benchmarks = {
            minimum: 10,    // Densidade mínima aceitável
            good: 30,       // Boa densidade
            excellent: 50   // Densidade excelente
        };
        
        let efficiencyScore = 0;
        if (rawDensity >= benchmarks.excellent) {
            efficiencyScore = 100;
        } else if (rawDensity >= benchmarks.good) {
            // Linear entre good e excellent
            const ratio = (rawDensity - benchmarks.good) / (benchmarks.excellent - benchmarks.good);
            efficiencyScore = 70 + (ratio * 30); // 70-100%
        } else if (rawDensity >= benchmarks.minimum) {
            // Linear entre minimum e good
            const ratio = (rawDensity - benchmarks.minimum) / (benchmarks.good - benchmarks.minimum);
            efficiencyScore = 30 + (ratio * 40); // 30-70%
        } else {
            // Abaixo do mínimo
            efficiencyScore = Math.max(0, (rawDensity / benchmarks.minimum) * 30);
        }
        
        // 3. DETERMINAR RATING DE EFICIÊNCIA
        const efficiency = this.getDensityEfficiencyRating(efficiencyScore);
        
        console.log(`Box Density: ${rawDensity.toFixed(1)} boxes/m², efficiency: ${efficiencyScore.toFixed(1)}%`);
        
        return {
            value: rawDensity,
            score: efficiencyScore,
            efficiency: efficiency,
            benchmarks: benchmarks
        };
    }
    
    /**
     * Determinar rating de eficiência da densidade
     * @param {number} score - Score de eficiência (0-100%)
     * @returns {string} Rating de eficiência
     */
    getDensityEfficiencyRating(score) {
        if (score >= 85) return 'Excellent';
        if (score >= 70) return 'Good';
        if (score >= 50) return 'Fair';
        if (score >= 30) return 'Poor';
        return 'Low';
    }
    
    /**
     * GERENCIAR LIMITES DE SEGURANÇA
     * Permite alternar entre diferentes perfis de segurança
     */
    
    /**
     * Definir limite de segurança personalizado
     * @param {number} limitCm - Limite em centímetros
     */
    setSafetyLimit(limitCm) {
        if (limitCm > 0 && limitCm <= 60) { // Máximo 60cm (razoável)
            this.safetyLimits.current = limitCm;
            console.log(`Safety limit updated to ${limitCm}cm`);
        } else {
            console.warn(`Invalid safety limit: ${limitCm}cm. Must be between 1-60cm.`);
        }
    }
    
    /**
     * Usar perfil de segurança predefinido
     * @param {string} profile - 'conservative', 'standard', ou 'liberal'
     */
    setSafetyProfile(profile) {
        if (this.safetyLimits.hasOwnProperty(profile) && profile !== 'current') {
            this.safetyLimits.current = this.safetyLimits[profile];
            console.log(`Safety profile set to ${profile}: ${this.safetyLimits.current}cm`);
        } else {
            console.warn(`Invalid safety profile: ${profile}. Available: conservative, standard, liberal`);
        }
    }
    
    /**
     * Obter informações sobre limites de segurança
     * @returns {Object} Informações sobre limites
     */
    getSafetyInfo() {
        return {
            current: this.safetyLimits.current,
            profiles: {
                conservative: this.safetyLimits.conservative,
                standard: this.safetyLimits.standard,
                liberal: this.safetyLimits.liberal
            },
            explanation: {
                conservative: 'Para produtos frágeis ou transportes sensíveis',
                standard: 'Para aplicações industriais normais (recomendado)',
                liberal: 'Para cargas muito estáveis e transporte cuidadoso'
            }
        };
    }
    
    /**
     * MÉTODOS DE ACESSO AOS RESULTADOS
     */
    
    /**
     * Obter métricas vazias (quando não há dados)
     */
    getEmptyMetrics() {
        return {
            lsi: {
                value: 100,
                centerOfMassScore: 100,
                weightDistributionScore: 100,
                stabilityRating: 'No Load',
                safetyLimit: this.safetyLimits.current
            },
            boxDensity: {
                value: 0,
                score: 0,
                efficiency: 'Empty'
            }
        };
    }
    
    /**
     * Obter métricas atuais com informações adicionais
     */
    getCurrentMetrics() {
        return {
            ...this.currentMetrics,
            timestamp: Date.now(),
            safetyInfo: this.getSafetyInfo()
        };
    }
    
    /**
     * Obter valores formatados para display na UI
     */
    getFormattedMetrics() {
        const current = this.currentMetrics;
        
        return {
            lsi: {
                display: `${current.lsi.value.toFixed(1)}%`,
                rating: current.lsi.stabilityRating,
                color: this.getLSIColor(current.lsi.value)
            },
            boxDensity: {
                display: `${current.boxDensity.value.toFixed(1)} boxes/m²`,
                rating: current.boxDensity.efficiency,
                color: this.getDensityColor(current.boxDensity.score)
            }
        };
    }
    

    getLSIColor(lsiValue) {
        if (window.palletApp && window.palletApp.animationState.isCompleted) {
            return '#27ae60'; // Verde quando animação completa
        } else {
            return '#3498db'; // Azul durante animação
        }
}
    
    getDensityColor(densityScore) {
        // CORRIGIDO: Cor baseada no estado da animação, não na pontuação
        if (window.palletApp && window.palletApp.animationState.isCompleted) {
            return '#27ae60'; // Verde quando animação completa
        } else {
            return '#3498db'; // Azul durante animação
        }
    }
    
    /**
     * MÉTODOS DE DEBUG E ANÁLISE
     */
    
    /**
     * Debug completo das métricas de rodapé
     */
    debugBottomMetrics() {
        console.log('=== BOTTOM METRICS DEBUG ===');
        
        const metrics = this.getCurrentMetrics();
        const formatted = this.getFormattedMetrics();
        
        console.log('Load Stability Index (LSI):');
        console.log(`  Overall: ${formatted.lsi.display} (${formatted.lsi.rating})`);
        console.log(`  Center of Mass Score: ${metrics.lsi.centerOfMassScore.toFixed(1)}% (weight: 60%)`);
        console.log(`  Weight Distribution Score: ${metrics.lsi.weightDistributionScore.toFixed(1)}% (weight: 40%)`);
        console.log(`  Safety Limit: ${metrics.lsi.safetyLimit}cm`);
        console.log('');
        
        console.log('Box Density Score:');
        console.log(`  Density: ${formatted.boxDensity.display} (${formatted.boxDensity.rating})`);
        console.log(`  Efficiency Score: ${metrics.boxDensity.score.toFixed(1)}%`);
        console.log('');
        
        console.log('Safety Configuration:');
        const safetyInfo = this.getSafetyInfo();
        console.log(`  Current Limit: ${safetyInfo.current}cm`);
        console.log(`  Available Profiles:`, safetyInfo.profiles);
        
        console.log('================================');
        
        return { metrics, formatted, safetyInfo };
    }
    
    /**
     * Reset das métricas
     */
    reset() {
        console.log('Resetting bottom metrics...');
        this.currentMetrics = {
            lsi: {
                value: 100,
                centerOfMassScore: 100,
                weightDistributionScore: 100,
                stabilityRating: 'No Load',
                safetyLimit: this.safetyLimits.current
            },
            boxDensity: {
                value: 0,
                score: 0,
                efficiency: 'Empty'
            }
        };
        console.log('✓ Bottom metrics reset');
    }
    
    /**
     * Dispose dos recursos
     */
    dispose() {
        console.log('Disposing bottom metrics calculator...');
        this.currentMetrics = null;
        console.log('✓ Bottom metrics calculator disposed');
    }
}

// Export para acesso global
window.BottomMetricsCalculator = BottomMetricsCalculator;