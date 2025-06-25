/**
 * SISTEMA UNIFICADO DE UNIDADES - VERSÃO CORRIGIDA
 * 
 * PROBLEMA IDENTIFICADO:
 * O sistema anterior estava com a conversão invertida! 
 * 
 * ANÁLISE DOS DADOS CROSSLOG:
 * - Crosslog: xmax=1200 significa 1200mm (120cm)
 * - Three.js scene: pallet aparenta ter ~12 units de comprimento
 * - Logo: 1200mm ÷ 12 units = 100mm/unit
 * 
 * CORREÇÃO FUNDAMENTAL:
 * 1 Three.js unit = 100mm = 10cm (NÃO 10mm = 1cm)
 * 
 * Save this as: GUI/3d-viewer/js/units-system.js
 */

class UnifiedUnitsSystem {
    constructor() {
        // CORREÇÃO FUNDAMENTAL - NOVA REGRA BASE
        // Baseado na análise: palete de 1200mm tem ~12 units no Three.js
        this.BASE_UNIT_MM = 100; // 1 Three.js unit = 100mm = 10cm
        
        console.log('🔧 CORRIGINDO SISTEMA DE UNIDADES...');
        console.log('Nova regra base: 1 Three.js unit = 100mm = 10cm');
        
        // CONVERSÕES DERIVADAS (recalculadas)
        this.conversions = {
            // From Crosslog (mm) to Three.js (units)
            mmToThreeUnits: 1 / this.BASE_UNIT_MM,        // mm → units (÷100)
            threeUnitsToMm: this.BASE_UNIT_MM,            // units → mm (×100)
            
            // From Three.js (units) to Display (cm)  
            threeUnitsToCm: this.BASE_UNIT_MM / 10,       // units → cm (×10, porque 100mm = 10cm)
            cmToThreeUnits: 10 / this.BASE_UNIT_MM,       // cm → units (÷10)
            
            // From Crosslog (mm) to Display (cm)
            mmToCm: 0.1,                                  // mm → cm (÷10)
            cmToMm: 10,                                   // cm → mm (×10)
            
            // From Display (cm) to Display (m)
            cmToM: 0.01,                                  // cm → m (÷100)
            mToCm: 100                                    // m → cm (×100)
        };
        
        // INFORMAÇÕES DE REFERÊNCIA CORRIGIDAS
        this.referenceData = {
            crosslogPallet: {
                lengthMm: 1200,    // Dados originais
                widthMm: 800,
                heightMm: 1500
            },
            threeJsPallet: {
                lengthUnits: 1200 * this.conversions.mmToThreeUnits,  // 12 units (1200÷100)
                widthUnits: 800 * this.conversions.mmToThreeUnits,    // 8 units (800÷100)  
                heightUnits: 1500 * this.conversions.mmToThreeUnits   // 15 units (1500÷100)
            },
            displayPallet: {
                lengthCm: 120,     // 1200mm = 120cm
                widthCm: 80,       // 800mm = 80cm
                heightCm: 150      // 1500mm = 150cm
            }
        };
        
        console.log('🔧 Sistema corrigido inicializado');
        this.logCorrectionValidation();
    }
    
    // =====================================
    // MÉTODOS DE CONVERSÃO CORRIGIDOS
    // =====================================
    
    /**
     * CROSSLOG → THREE.JS (CORRIGIDO)
     */
    crosslogToThreeJS(valueInMm) {
        return valueInMm * this.conversions.mmToThreeUnits;
    }
    
    /**
     * THREE.JS → DISPLAY (cm) (CORRIGIDO)
     */
    threeJSToDisplayCm(valueInUnits) {
        return valueInUnits * this.conversions.threeUnitsToCm;
    }
    
    /**
     * THREE.JS → DISPLAY (m) (CORRIGIDO)
     */
    threeJSToDisplayM(valueInUnits) {
        const cm = this.threeJSToDisplayCm(valueInUnits);
        return cm * this.conversions.cmToM;
    }
    
    /**
     * CROSSLOG → DISPLAY (cm) (mantido)
     */
    crosslogToDisplayCm(valueInMm) {
        return valueInMm * this.conversions.mmToCm;
    }
    
    /**
     * HEIGHT CALCULATION (CORRIGIDO)
     * 
     * PROBLEMA ANTERIOR: O sistema estava convertendo errado
     * SOLUÇÃO: Usar a nova regra de conversão
     */
    calculateDisplayHeight(boxes, palletTopY = 0.61, boxFloorOffset = 0.72) {
        if (!boxes || boxes.length === 0) {
            return {
                cm: 0,
                m: 0,
                displayText: '0cm'
            };
        }
        
        console.log('🔧 DEBUGGING HEIGHT CALCULATION:');
        console.log(`Pallet reference: ${palletTopY} + ${boxFloorOffset} = ${palletTopY + boxFloorOffset} units`);
        
        // Encontrar o ponto mais alto entre todos os boxes
        let maxY = -Infinity;
        let debugBox = null;
        
        boxes.forEach((box, index) => {
            const boxTop = box.position.y + (box.geometry.parameters.height / 2);
            console.log(`Box ${index}: pos.y=${box.position.y.toFixed(3)}, height=${box.geometry.parameters.height.toFixed(3)}, top=${boxTop.toFixed(3)}`);
            
            if (boxTop > maxY) {
                maxY = boxTop;
                debugBox = index;
            }
        });
        
        console.log(`Highest box: #${debugBox} with top at ${maxY.toFixed(3)} units`);
        
        // Calcular altura do topo do palete ao ponto mais alto
        const referenceLevel = palletTopY + boxFloorOffset;
        const heightInThreeUnits = Math.max(0, maxY - referenceLevel);
        
        console.log(`Height in Three.js units: ${heightInThreeUnits.toFixed(3)}`);
        
        // CONVERSÃO CORRIGIDA
        const heightCm = this.threeJSToDisplayCm(heightInThreeUnits);
        const heightM = this.threeJSToDisplayM(heightInThreeUnits);
        
        console.log(`Height in cm: ${heightCm.toFixed(1)}`);
        console.log(`Height in m: ${heightM.toFixed(2)}`);
        
        const result = {
            cm: heightCm,
            m: heightM,
            displayText: heightCm >= 100 ? `${heightM.toFixed(2)}m` : `${heightCm.toFixed(1)}cm`
        };
        
        console.log(`Final display: ${result.displayText}`);
        return result;
    }
    
    /**
     * VOLUME CALCULATION (CORRIGIDO)
     * 
     * PROBLEMA: Volume efficiency = 100% significa conversão errada
     */
    calculateBoxVolumeCm3(box) {
        // Dimensões do box em Three.js units
        const widthUnits = box.geometry.parameters.width;
        const heightUnits = box.geometry.parameters.height;
        const depthUnits = box.geometry.parameters.depth;
        
        console.log(`📦 Box dimensions (units): ${widthUnits.toFixed(2)} × ${heightUnits.toFixed(2)} × ${depthUnits.toFixed(2)}`);
        
        // Converter para cm usando sistema CORRIGIDO
        const widthCm = this.threeJSToDisplayCm(widthUnits);
        const heightCm = this.threeJSToDisplayCm(heightUnits);
        const depthCm = this.threeJSToDisplayCm(depthUnits);
        
        console.log(`📦 Box dimensions (cm): ${widthCm.toFixed(1)} × ${heightCm.toFixed(1)} × ${depthCm.toFixed(1)}`);
        
        // Volume em cm³
        const volumeCm3 = widthCm * heightCm * depthCm;
        console.log(`📦 Box volume: ${volumeCm3.toFixed(1)} cm³`);
        
        return volumeCm3;
    }
    
    /**
     * CENTER OF MASS CALCULATION (CORRIGIDO)
     */
    formatCenterOfMassDeviation(deviationInThreeUnits) {
        console.log(`🎯 CoM deviation (units): ${deviationInThreeUnits.toFixed(3)}`);
        
        const deviationCm = this.threeJSToDisplayCm(deviationInThreeUnits);
        const deviationMm = deviationCm * this.conversions.cmToMm;
        
        console.log(`🎯 CoM deviation (cm): ${deviationCm.toFixed(1)}`);
        console.log(`🎯 CoM deviation (mm): ${deviationMm.toFixed(1)}`);
        
        // Lógica de display mantida
        if (deviationMm < 10) {
            return `${deviationMm.toFixed(1)}mm`;
        } else {
            return `${deviationCm.toFixed(1)}cm`;
        }
    }
    
    /**
     * PALLET AREA CALCULATION (NOVO - para Volume Efficiency)
     */
    getPalletAreaCm2() {
        // Baseado nas dimensões de referência corretas
        const lengthCm = this.referenceData.displayPallet.lengthCm;
        const widthCm = this.referenceData.displayPallet.widthCm;
        const areaCm2 = lengthCm * widthCm;
        
        console.log(`📐 Pallet area: ${lengthCm}cm × ${widthCm}cm = ${areaCm2} cm²`);
        return areaCm2;
    }
    
    // =====================================
    // MÉTODOS DE VALIDAÇÃO CORRIGIDOS
    // =====================================
    
    /**
     * Validação das correções aplicadas
     */
    logCorrectionValidation() {
        console.log('=== VALIDATION OF CORRECTIONS ===');
        console.log('Expected Crosslog → Three.js conversions:');
        console.log(`1200mm → ${this.crosslogToThreeJS(1200)} units (should be ~12)`);
        console.log(`800mm → ${this.crosslogToThreeJS(800)} units (should be ~8)`);
        console.log(`1500mm → ${this.crosslogToThreeJS(1500)} units (should be ~15)`);
        console.log('');
        console.log('Expected Three.js → Display conversions:');
        console.log(`12 units → ${this.threeJSToDisplayCm(12)} cm (should be 120)`);
        console.log(`8 units → ${this.threeJSToDisplayCm(8)} cm (should be 80)`);
        console.log(`15 units → ${this.threeJSToDisplayCm(15)} cm (should be 150)`);
        console.log('');
        
        // Validar se as conversões estão corretas
        const test1 = Math.abs(this.crosslogToThreeJS(1200) - 12) < 0.001;
        const test2 = Math.abs(this.threeJSToDisplayCm(12) - 120) < 0.001;
        const test3 = Math.abs(this.getPalletAreaCm2() - 9600) < 1;
        
        console.log(`Crosslog→Three.js test: ${test1 ? '✅' : '❌'}`);
        console.log(`Three.js→Display test: ${test2 ? '✅' : '❌'}`);
        console.log(`Pallet area test: ${test3 ? '✅' : '❌'} (${this.getPalletAreaCm2()} cm²)`);
        console.log('==================================');
    }
    
    /**
     * Debug método para troubleshooting
     */
    debugCurrentState(boxes) {
        if (!boxes || boxes.length === 0) {
            console.log('No boxes to debug');
            return;
        }
        
        console.log('=== CURRENT STATE DEBUG ===');
        console.log(`Number of boxes: ${boxes.length}`);
        
        // Debug primeiro box como exemplo
        const firstBox = boxes[0];
        if (firstBox) {
            console.log('First box analysis:');
            console.log(`Position: (${firstBox.position.x.toFixed(2)}, ${firstBox.position.y.toFixed(2)}, ${firstBox.position.z.toFixed(2)}) units`);
            console.log(`Dimensions: ${firstBox.geometry.parameters.width.toFixed(2)} × ${firstBox.geometry.parameters.height.toFixed(2)} × ${firstBox.geometry.parameters.depth.toFixed(2)} units`);
            
            const volumeCm3 = this.calculateBoxVolumeCm3(firstBox);
            console.log(`Volume: ${volumeCm3.toFixed(1)} cm³`);
        }
        
        // Debug height calculation
        const height = this.calculateDisplayHeight(boxes);
        console.log(`Total height: ${height.displayText}`);
        
        // Debug total volume
        let totalVolume = 0;
        boxes.forEach(box => {
            totalVolume += this.calculateBoxVolumeCm3(box);
        });
        console.log(`Total occupied volume: ${totalVolume.toFixed(1)} cm³`);
        
        const palletArea = this.getPalletAreaCm2();
        const availableVolume = palletArea * height.cm;
        console.log(`Available volume: ${availableVolume.toFixed(1)} cm³`);
        
        const efficiency = totalVolume / availableVolume * 100;
        console.log(`Volume efficiency: ${efficiency.toFixed(1)}%`);
        
        console.log('============================');
    }
    
    /**
     * Método para verificar se precisa atualizar outros arquivos
     */
    getOldSystemProblems() {
        return [
            'VolumeEfficiency.js - usando unitConversion.unitsToCm = 10 (ERRADO)',
            'center-of-mass.js - usando 1 unit = 1cm (ERRADO)',
            'main.js - cálculos baseados no sistema antigo (ERRADO)',
            'bottom-metrics.js - pode estar usando conversões erradas'
        ];
    }
    
    // =====================================
    // MÉTODOS DE CONFIGURAÇÃO MANTIDOS
    // =====================================
    
    getSystemInfo() {
        return {
            baseRule: `1 Three.js unit = ${this.BASE_UNIT_MM}mm = ${this.BASE_UNIT_MM/10}cm`,
            conversions: this.conversions,
            reference: this.referenceData,
            corrections: [
                'Fixed: 1 unit = 100mm (was 10mm)',
                'Fixed: Volume calculations',
                'Fixed: Height calculations', 
                'Fixed: Center of mass calculations'
            ]
        };
    }
    
    getConversionFactors() {
        return {
            CROSSLOG_MM_TO_THREEJS_UNITS: this.conversions.mmToThreeUnits,          // ÷100
            THREEJS_UNITS_TO_DISPLAY_CM: this.conversions.threeUnitsToCm,          // ×10
            THREEJS_UNITS_TO_DISPLAY_M: this.conversions.threeUnitsToCm * this.conversions.cmToM,
            PALLET_AREA_CM2: this.getPalletAreaCm2()
        };
    }
}

// Substituir instância global
window.UnifiedUnitsSystem = UnifiedUnitsSystem;

// Criar nova instância corrigida
console.log('🔧 REPLACING OLD UNITS SYSTEM...');
window.unitsSystem = new UnifiedUnitsSystem();

// Validar sistema corrigido
console.log('🔧 VALIDATING CORRECTED SYSTEM...');
window.unitsSystem.validateSystemConsistency = function() {
    const issues = [];
    
    // Testar conversões ida e volta
    const testValues = [1200, 800, 1500];
    
    testValues.forEach(mm => {
        const units = this.crosslogToThreeJS(mm);
        const backToMm = units * this.conversions.threeUnitsToMm;
        
        if (Math.abs(mm - backToMm) > 0.001) {
            issues.push(`Round-trip conversion failed for ${mm}mm`);
        }
    });
    
    // Testar se palete tem dimensões esperadas
    const palletArea = this.getPalletAreaCm2();
    if (Math.abs(palletArea - 9600) > 1) {
        issues.push(`Pallet area wrong: ${palletArea} cm² (expected ~9600)`);
    }
};

window.unitsSystem.validateSystemConsistency();