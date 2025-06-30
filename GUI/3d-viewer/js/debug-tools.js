/**
 * DEBUG TOOLS para Electron - Centro de Massa e Weight Distribution
 * Ficheiro: debug-tools.js
 * 
 * Como usar:
 * 1. Incluir no HTML: <script src="js/debug-tools.js"></script>
 * 2. No Electron DevTools: debugCenterOfMass()
 * 3. Ou criar botão temporário na interface
 */

class CenterOfMassDebugTool {
    constructor() {
        this.debugResults = {};
        this.initDebugUI();
    }

    /**
     * Criar interface de debug temporária
     */
    initDebugUI() {
        // Só criar se estivermos em modo de desenvolvimento
        if (window.location.href.includes('localhost') || window.location.href.includes('127.0.0.1') || window.location.href.includes('file://')) {
            this.createDebugButton();
        }
    }

    /**
     * Criar botão de debug temporário na interface
     */
    createDebugButton() {
        const debugButton = document.createElement('button');
        debugButton.id = 'debug-center-mass-btn';
        debugButton.textContent = '🔧 Debug Center Mass';
        debugButton.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 9999;
            background: #e74c3c;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 5px;
            cursor: pointer;
            font-family: monospace;
            font-size: 12px;
        `;
        
        debugButton.addEventListener('click', () => {
            this.quickAnalysis();
        });
        
        // Adicionar quando a página carregar
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                document.body.appendChild(debugButton);
            });
        } else {
            document.body.appendChild(debugButton);
        }
    }

    /**
     * ANÁLISE COMPLETA: Comparar todos os sistemas de coordenadas
     */
    analyzeCoordinateSystem() {
        console.log('🔍 INÍCIO DA ANÁLISE DE COORDENADAS DO CENTRO DE MASSA');
        console.log('=====================================================');

        // 1. Obter dados dos sistemas existentes
        const threeJSData = this.getThreeJSCenterOfMass();
        const heatmapData = this.getHeatmapCenterOfMass();
        const rawBoxData = this.getRawBoxData();

        // 2. Calcular centro de massa manualmente (verificação independente)
        const manualCalculation = this.calculateCenterOfMassManually(rawBoxData);

        // 3. Analisar sistemas de coordenadas
        const coordinateAnalysis = this.analyzeCoordinateSystems();

        // 4. Verificar conversões
        const conversionAnalysis = this.analyzeCoordinateConversions(manualCalculation);

        // 5. Gerar relatório completo
        return this.generateDebugReport({
            threeJSData,
            heatmapData,
            rawBoxData,
            manualCalculation,
            coordinateAnalysis,
            conversionAnalysis
        });
    }

    /**
     * Obter dados do centro de massa do Three.js
     */
    getThreeJSCenterOfMass() {
        if (!window.palletApp || !window.palletApp.centerOfMassState.lastCalculation) {
            return { error: 'Dados do Three.js não disponíveis' };
        }

        const cm = window.palletApp.centerOfMassState.lastCalculation;
        const beam = window.palletApp.simulator?.centerOfMassGroup;
        
        return {
            calculated: { x: cm.x, y: cm.y, z: cm.z },
            beamPosition: beam ? { x: beam.position.x, z: beam.position.z } : null,
            deviationCm: cm.deviationCm,
            total3D: cm.totalDeviation3D || 'não calculado'
        };
    }

    /**
     * Obter dados do weight distribution heatmap
     */
    getHeatmapCenterOfMass() {
        if (!window.palletApp || !window.palletApp.weightDistributionCalculator) {
            return { error: 'Weight distribution não disponível' };
        }

        const calc = window.palletApp.weightDistributionCalculator;
        const cmDebug = calc.centerOfMassDebug;
        const pointElement = calc.centerOfMassPoint.element;

        let pointPosition = { x: 'N/A', z: 'N/A' };
        if (pointElement) {
            const left = pointElement.style.left;
            const top = pointElement.style.top;
            pointPosition = { 
                x: left, 
                z: top,
                xPercent: parseFloat(left) || 0,
                zPercent: parseFloat(top) || 0
            };
        }

        return {
            calculated: cmDebug.rawCalculation,
            heatmapPosition: pointPosition,
            isVisible: calc.centerOfMassPoint.isVisible,
            coordinateHistory: calc.centerOfMassPoint.coordinateHistory || []
        };
    }

    /**
     * Obter dados brutos das caixas
     */
    getRawBoxData() {
        if (!window.palletApp || !window.palletApp.simulator || !window.palletApp.simulator.boxes) {
            return { error: 'Caixas não disponíveis' };
        }

        const boxes = window.palletApp.simulator.boxes;
        const boxData = [];

        boxes.forEach((box, index) => {
            const pos = box.position;
            const geom = box.geometry.parameters;
            const weight = box.userData.weight || 0;

            boxData.push({
                index,
                position: { x: pos.x, y: pos.y, z: pos.z },
                dimensions: { w: geom.width, h: geom.height, d: geom.depth },
                weight: weight,
                weightKg: weight / 1000
            });
        });

        return {
            count: boxes.length,
            boxes: boxData,
            totalWeightGrams: boxData.reduce((sum, box) => sum + box.weight, 0),
            totalWeightKg: boxData.reduce((sum, box) => sum + box.weightKg, 0)
        };
    }

    /**
     * CÁLCULO INDEPENDENTE: Centro de massa manual para verificação
     */
    calculateCenterOfMassManually(rawBoxData) {
        if (rawBoxData.error || !rawBoxData.boxes || rawBoxData.boxes.length === 0) {
            return { error: 'Não há dados de caixas para calcular' };
        }

        let totalWeightedX = 0;
        let totalWeightedY = 0;
        let totalWeightedZ = 0;
        let totalWeight = 0;

        console.log('📊 CÁLCULO MANUAL DO CENTRO DE MASSA:');
        console.log('Box | Position (X,Y,Z) | Weight(kg) | Weighted Coords');
        console.log('----+------------------+-----------+----------------');

        rawBoxData.boxes.forEach((box, index) => {
            const weight = box.weightKg;
            const x = box.position.x;
            const y = box.position.y;
            const z = box.position.z;

            totalWeightedX += weight * x;
            totalWeightedY += weight * y;
            totalWeightedZ += weight * z;
            totalWeight += weight;

            console.log(`${index.toString().padStart(3)} | (${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)}) | ${weight.toFixed(3)}kg | (${(weight*x).toFixed(2)}, ${(weight*y).toFixed(2)}, ${(weight*z).toFixed(2)})`);
        });

        if (totalWeight === 0) {
            return { error: 'Peso total é zero' };
        }

        const centerX = totalWeightedX / totalWeight;
        const centerY = totalWeightedY / totalWeight;
        const centerZ = totalWeightedZ / totalWeight;

        // Calcular desvios
        const horizontal2D = Math.sqrt(centerX * centerX + centerZ * centerZ);
        const total3D = Math.sqrt(centerX * centerX + centerY * centerY + centerZ * centerZ);

        console.log('----+------------------+-----------+----------------');
        console.log(`TOTAIS: Peso=${totalWeight.toFixed(3)}kg | Centro=(${centerX.toFixed(3)}, ${centerY.toFixed(3)}, ${centerZ.toFixed(3)})`);

        return {
            center: { x: centerX, y: centerY, z: centerZ },
            totalWeight: totalWeight,
            deviations: {
                horizontal2D: horizontal2D,
                total3D: total3D,
                horizontal2D_cm: horizontal2D * 10, // Assumindo 1 unit = 10cm
                total3D_cm: total3D * 10
            },
            details: {
                totalWeightedX,
                totalWeightedY,
                totalWeightedZ,
                boxCount: rawBoxData.boxes.length
            }
        };
    }

    /**
     * Analisar sistemas de coordenadas utilizados
     */
    analyzeCoordinateSystems() {
        console.log('🗺️ ANÁLISE DOS SISTEMAS DE COORDENADAS:');

        // Three.js coordinate system
        const threeJSSystem = {
            name: 'Three.js 3D Scene',
            origin: 'Center of pallet at Y=-8',
            xAxis: 'Left(-) to Right(+)',
            yAxis: 'Down(-) to Up(+)',
            zAxis: 'Back(-) to Front(+)',
            units: '1 unit = 10cm',
            palletPosition: { x: 0, y: -8, z: 0 },
            palletDimensions: { length: 12, width: 8, height: 1.44 }
        };

        // Heatmap coordinate system
        const heatmapSystem = {
            name: 'Weight Distribution Heatmap',
            origin: 'Top-left corner (0%, 0%)',
            xAxis: 'Left(0%) to Right(100%)',
            yAxis: 'Top(0%) to Bottom(100%)',
            units: 'Percentage of pallet dimensions',
            gridSize: '24x16 cells',
            palletRepresentation: '100% x 100%'
        };

        console.log('Three.js System:', threeJSSystem);
        console.log('Heatmap System:', heatmapSystem);

        return { threeJSSystem, heatmapSystem };
    }

    /**
     * Analisar conversões entre sistemas de coordenadas
     */
    analyzeCoordinateConversions(manualCalculation) {
        if (manualCalculation.error) {
            return { error: 'Não é possível analisar conversões sem dados válidos' };
        }

        const cm = manualCalculation.center;
        console.log('🔄 ANÁLISE DE CONVERSÕES DE COORDENADAS:');

        // Conversão Three.js para Heatmap (atual)
        const palletHalfLength = 6.0;  // 12/2
        const palletHalfWidth = 4.0;   // 8/2

        const xPercent_current = ((cm.x + palletHalfLength) / 12.0) * 100;
        const zPercent_current = ((cm.z + palletHalfWidth) / 8.0) * 100;

        // Testar conversões alternativas
        const xPercent_alt1 = ((cm.x + palletHalfLength) / 12.0) * 100;
        const zPercent_alt1 = (((-cm.z) + palletHalfWidth) / 8.0) * 100; // Z invertido

        const xPercent_alt2 = (((-cm.x) + palletHalfLength) / 12.0) * 100; // X invertido
        const zPercent_alt2 = ((cm.z + palletHalfWidth) / 8.0) * 100;

        const xPercent_alt3 = (((-cm.x) + palletHalfLength) / 12.0) * 100; // Ambos invertidos
        const zPercent_alt3 = (((-cm.z) + palletHalfWidth) / 8.0) * 100;

        console.log(`Centro de Massa Three.js: (${cm.x.toFixed(3)}, ${cm.z.toFixed(3)})`);
        console.log('Conversões possíveis para Heatmap:');
        console.log(`ATUAL:        X=${xPercent_current.toFixed(1)}%, Z=${zPercent_current.toFixed(1)}%`);
        console.log(`Z invertido:  X=${xPercent_alt1.toFixed(1)}%, Z=${zPercent_alt1.toFixed(1)}%`);
        console.log(`X invertido:  X=${xPercent_alt2.toFixed(1)}%, Z=${zPercent_alt2.toFixed(1)}%`);
        console.log(`Ambos invert: X=${xPercent_alt3.toFixed(1)}%, Z=${zPercent_alt3.toFixed(1)}%`);

        return {
            threeJS: { x: cm.x, z: cm.z },
            conversions: {
                current: { x: xPercent_current, z: zPercent_current },
                zInverted: { x: xPercent_alt1, z: zPercent_alt1 },
                xInverted: { x: xPercent_alt2, z: zPercent_alt2 },
                bothInverted: { x: xPercent_alt3, z: zPercent_alt3 }
            }
        };
    }

    /**
     * Gerar relatório completo
     */
    generateDebugReport(data) {
        console.log('📋 RELATÓRIO FINAL DE DEBUG');
        console.log('============================');

        const report = {
            timestamp: new Date().toISOString(),
            summary: {},
            issues: [],
            recommendations: []
        };

        // Comparar cálculos
        if (data.manualCalculation.error) {
            report.issues.push('❌ Não foi possível calcular centro de massa manualmente');
        } else {
            const manual = data.manualCalculation.center;
            const threeJS = data.threeJSData.calculated;
            const heatmap = data.heatmapData.calculated;

            console.log('COMPARAÇÃO DE CÁLCULOS:');
            console.log(`Manual:   (${manual.x.toFixed(3)}, ${manual.y.toFixed(3)}, ${manual.z.toFixed(3)})`);
            console.log(`Three.js: (${threeJS?.x.toFixed(3)}, ${threeJS?.y?.toFixed(3)}, ${threeJS?.z.toFixed(3)})`);
            console.log(`Heatmap:  (${heatmap?.x?.toFixed(3)}, ${heatmap?.y?.toFixed(3)}, ${heatmap?.z?.toFixed(3)})`);

            // Verificar consistência
            if (threeJS && Math.abs(manual.x - threeJS.x) > 0.001) {
                report.issues.push(`❌ Discrepância em X: Manual=${manual.x.toFixed(3)}, Three.js=${threeJS.x.toFixed(3)}`);
            }
            if (threeJS && Math.abs(manual.z - threeJS.z) > 0.001) {
                report.issues.push(`❌ Discrepância em Z: Manual=${manual.z.toFixed(3)}, Three.js=${threeJS.z.toFixed(3)}`);
            }
        }

        // Analisar posição do heatmap
        if (data.heatmapData.heatmapPosition) {
            const pos = data.heatmapData.heatmapPosition;
            console.log(`POSIÇÃO NO HEATMAP: ${pos.x}, ${pos.z} (${pos.xPercent}%, ${pos.zPercent}%)`);
            
            if (data.conversionAnalysis && !data.conversionAnalysis.error) {
                const conversions = data.conversionAnalysis.conversions;
                const actualX = pos.xPercent || 0;
                const actualZ = pos.zPercent || 0;

                console.log('ANÁLISE DE CONVERSÃO:');
                console.log(`Atual no heatmap: (${actualX.toFixed(1)}%, ${actualZ.toFixed(1)}%)`);
                console.log(`Esperado (atual):  (${conversions.current.x.toFixed(1)}%, ${conversions.current.z.toFixed(1)}%)`);

                // Encontrar a conversão mais próxima
                const diffs = {
                    current: Math.abs(actualX - conversions.current.x) + Math.abs(actualZ - conversions.current.z),
                    zInverted: Math.abs(actualX - conversions.zInverted.x) + Math.abs(actualZ - conversions.zInverted.z),
                    xInverted: Math.abs(actualX - conversions.xInverted.x) + Math.abs(actualZ - conversions.xInverted.z),
                    bothInverted: Math.abs(actualX - conversions.bothInverted.x) + Math.abs(actualZ - conversions.bothInverted.z)
                };

                const closest = Object.entries(diffs).reduce((min, [key, diff]) => 
                    diff < min.diff ? { key, diff } : min, { key: 'current', diff: Infinity }
                );

                console.log(`🎯 CONVERSÃO MAIS PRÓXIMA: ${closest.key} (diferença: ${closest.diff.toFixed(2)})`);

                if (closest.key !== 'current') {
                    report.issues.push(`❌ Conversão de coordenadas incorreta! Usar: ${closest.key}`);
                    report.recommendations.push(`✅ Implementar conversão '${closest.key}' para corrigir posição do heatmap`);
                }
            }
        }

        // Verificar consistência visual
        console.log('🎯 VERIFICAÇÃO VISUAL:');
        if (data.threeJSData.calculated && data.threeJSData.beamPosition) {
            const calc = data.threeJSData.calculated;
            const beam = data.threeJSData.beamPosition;
            
            if (Math.abs(calc.x - beam.x) > 0.001 || Math.abs(calc.z - beam.z) > 0.001) {
                report.issues.push(`❌ Beam visual não coincide com cálculo: Calc(${calc.x.toFixed(3)}, ${calc.z.toFixed(3)}) vs Beam(${beam.x.toFixed(3)}, ${beam.z.toFixed(3)})`);
            } else {
                console.log('✅ Beam visual alinhado com cálculo Three.js');
            }
        }

        // Resumo final
        report.summary = {
            totalIssues: report.issues.length,
            calculationConsistent: report.issues.filter(i => i.includes('Discrepância')).length === 0,
            visualConsistent: report.issues.filter(i => i.includes('Beam')).length === 0,
            coordinateConversionCorrect: report.issues.filter(i => i.includes('Conversão')).length === 0
        };

        if (report.issues.length === 0) {
            console.log('🎉 NENHUM PROBLEMA ENCONTRADO!');
        } else {
            console.log(`⚠️ ENCONTRADOS ${report.issues.length} PROBLEMAS:`);
            report.issues.forEach(issue => console.log(`   ${issue}`));
        }

        if (report.recommendations.length > 0) {
            console.log('💡 RECOMENDAÇÕES:');
            report.recommendations.forEach(rec => console.log(`   ${rec}`));
        }

        this.debugResults = report;
        return report;
    }

    /**
     * Método rápido para executar análise completa
     */
    quickAnalysis() {
        console.clear();
        console.log('🚀 ANÁLISE RÁPIDA DE CENTRO DE MASSA - ELECTRON');
        return this.analyzeCoordinateSystem();
    }

    /**
     * Análise específica para Electron DevTools
     */
    electronDebug() {
        console.group('🔧 ELECTRON DEBUG - CENTER OF MASS');
        
        const result = this.quickAnalysis();
        
        console.group('📊 DADOS BRUTOS');
        console.log('Raw Box Data:', this.getRawBoxData());
        console.log('Three.js Data:', this.getThreeJSCenterOfMass());
        console.log('Heatmap Data:', this.getHeatmapCenterOfMass());
        console.groupEnd();
        
        console.groupEnd();
        
        return result;
    }
}

// Tornar disponível globalmente
window.CenterOfMassDebugTool = CenterOfMassDebugTool;
window.centerMassDebug = new CenterOfMassDebugTool();

// Funções de conveniência para executar no Electron DevTools
window.debugCenterOfMass = () => window.centerMassDebug.quickAnalysis();
window.electronDebugCenterMass = () => window.centerMassDebug.electronDebug();

console.log('🔧 DEBUG TOOLS CARREGADO para ELECTRON!');
console.log('Execute: debugCenterOfMass() para análise completa');
console.log('Execute: electronDebugCenterMass() para debug específico do Electron');