/**
 * Unified Unit System
 * 
 * 1 Three.js unit = 100mm = 10cm
 * 
 */

class UnifiedUnitsSystem {
    constructor() {
        // Base Rule
        this.BASE_UNIT_MM = 100; // 1 Three.js unit = 100mm = 10cm
        
        // CONVERSIONS
        this.conversions = {
            // From Crosslog (mm) to Three.js (units)
            mmToThreeUnits: 1 / this.BASE_UNIT_MM,        // mm → units (÷100)
            threeUnitsToMm: this.BASE_UNIT_MM,            // units → mm (×100)
            
            // From Three.js (units) to Display (cm)  
            threeUnitsToCm: this.BASE_UNIT_MM / 10,       // units → cm (×10)
            cmToThreeUnits: 10 / this.BASE_UNIT_MM,       // cm → units (÷10)
            
            // From Crosslog (mm) to Display (cm)
            mmToCm: 0.1,                                  // mm → cm (÷10)
            cmToMm: 10,                                   // cm → mm (×10)
            
            // From Display (cm) to Display (m)
            cmToM: 0.01,                                  // cm → m (÷100)
            mToCm: 100                                    // m → cm (×100)
        };
        
        // Reference Data
        this.referenceData = {
            crosslogPallet: {
                lengthMm: 1200,
                widthMm: 800,
                heightMm: 1500
            },
            threeJsPallet: {
                lengthUnits: 12,   // 1200÷100
                widthUnits: 8,     // 800÷100  
                heightUnits: 15    // 1500÷100
            },
            displayPallet: {
                lengthCm: 120,     // 1200mm = 120cm
                widthCm: 80,       // 800mm = 80cm
                heightCm: 150      // 1500mm = 150cm
            }
        };
    }
    
    // =====================================
    // Conversion Methods
    // =====================================
    
    /**
     * Convert from Crosslog (mm) to Three.js (units)
     */
    crosslogToThreeJS(valueInMm) {
        return valueInMm * this.conversions.mmToThreeUnits;
    }
    
    /**
     * Convert from Three.js (units) to Display (cm)
     */
    threeJSToDisplayCm(valueInUnits) {
        return valueInUnits * this.conversions.threeUnitsToCm;
    }
    
    /**
     * Convert from Three.js (units) to Display (m)
     */
    threeJSToDisplayM(valueInUnits) {
        const cm = this.threeJSToDisplayCm(valueInUnits);
        return cm * this.conversions.cmToM;
    }
    
    /**
     * Convert from Crosslog (mm) to Display (cm)
     */
    crosslogToDisplayCm(valueInMm) {
        return valueInMm * this.conversions.mmToCm;
    }
    
    /**
     * Total Pallet height calculation
     */
    calculateDisplayHeight(boxes, palletTopY = 0.61, boxFloorOffset = 0.72) {
        if (!boxes || boxes.length === 0) {
            return {
                cm: 0,
                m: 0,
                displayText: '0cm'
            };
        }
        
        // Find highest point
        let maxY = -Infinity;
        
        boxes.forEach((box) => {
            const boxTop = box.position.y + (box.geometry.parameters.height / 2);
            if (boxTop > maxY) {
                maxY = boxTop;
            }
        });
        
        // Calculte the height of the hightest point
        const referenceLevel = palletTopY + boxFloorOffset;
        const heightInThreeUnits = Math.max(0, maxY - referenceLevel);
        
        // Convert to display
        const heightCm = this.threeJSToDisplayCm(heightInThreeUnits);
        const heightM = this.threeJSToDisplayM(heightInThreeUnits);
        
        return {
            cm: heightCm,
            m: heightM,
            displayText: heightCm >= 100 ? `${heightM.toFixed(2)}m` : `${heightCm.toFixed(1)}cm`
        };
    }
    
    /**
     * Box Volume calculation  cm³
     */
    calculateBoxVolumeCm3(box) {
        // Box dimensions in Three.js units
        const widthUnits = box.geometry.parameters.width;
        const heightUnits = box.geometry.parameters.height;
        const depthUnits = box.geometry.parameters.depth;
        
        // Convert to cm
        const widthCm = this.threeJSToDisplayCm(widthUnits);
        const heightCm = this.threeJSToDisplayCm(heightUnits);
        const depthCm = this.threeJSToDisplayCm(depthUnits);
        
        // Volume in cm³
        return widthCm * heightCm * depthCm;
    }
    
    /**
     * Format center of mass deviation
     */
    formatCenterOfMassDeviation(deviationInThreeUnits) {
        const deviationCm = this.threeJSToDisplayCm(deviationInThreeUnits);
        const deviationMm = deviationCm * this.conversions.cmToMm;
        
        if (deviationMm < 10) {
            return `${deviationMm.toFixed(1)}mm`;
        } else {
            return `${deviationCm.toFixed(1)}cm`;
        }
    }
    
    /**
     * Pallet area in cm²
     */
    getPalletAreaCm2() {
        const lengthCm = this.referenceData.displayPallet.lengthCm;
        const widthCm = this.referenceData.displayPallet.widthCm;
        return lengthCm * widthCm;
    }
    
    // =====================================
    // CONFIG METHODS
    // =====================================
    
    getSystemInfo() {
        return {
            baseRule: `1 Three.js unit = ${this.BASE_UNIT_MM}mm = ${this.BASE_UNIT_MM/10}cm`,
            conversions: this.conversions,
            reference: this.referenceData
        };
    }
    
    getConversionFactors() {
        return {
            CROSSLOG_MM_TO_THREEJS_UNITS: this.conversions.mmToThreeUnits,
            THREEJS_UNITS_TO_DISPLAY_CM: this.conversions.threeUnitsToCm,
            THREEJS_UNITS_TO_DISPLAY_M: this.conversions.threeUnitsToCm * this.conversions.cmToM,
            PALLET_AREA_CM2: this.getPalletAreaCm2()
        };
    }
}

// Init System
window.UnifiedUnitsSystem = UnifiedUnitsSystem;
window.unitsSystem = new UnifiedUnitsSystem();