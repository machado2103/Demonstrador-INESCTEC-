/**
 * Center of Mass Calculator for Palletization Simulator - DYNAMIC UNITS
 * 
 * ENHANCED UNIT SYSTEM:
 * - Shows mm when deviation < 10mm (more precise for small deviations)
 * - Shows cm when deviation >= 10mm (cleaner for larger deviations)
 * - Automatic unit selection for best readability
 * 
 * Save this as: GUI/3d-viewer/js/center-of-mass.js
 */

class CenterOfMassCalculator {
    constructor() {
        // Physics constants and configuration
        this.palletDimensions = {
            length: 12.0,    // 1200mm in our coordinate system (1 unit = 1cm)
            width: 8.0,      // 800mm in our coordinate system (1 unit = 1cm)
            centerX: 0,      // Pallet center X coordinate
            centerZ: 0       // Pallet center Z coordinate
        };
        
        // Calculation state
        this.currentCenterOfMass = {
            x: 0,            // X coordinate of center of mass
            y: 0,            // Y coordinate (height) of center of mass
            z: 0,            // Z coordinate of center of mass (we ignore Y for top-down analysis)
            totalWeight: 0,  // Total weight of all boxes
            deviation2D: 0,  // Distance from pallet center (in units, where 1 unit = 1cm)
            deviation3D: 0,  //True 3D deviation (X,Y,Z)
            boxCount: 0      // Number of boxes included in calculation
        };
        
        // Debug and analysis data
        this.calculationHistory = [];
        this.isDebugMode = false;
        
        console.log('CenterOfMassCalculator initialized with pallet dimensions:', this.palletDimensions);
        console.log('Unit system: 1 coordinate unit = 1cm');
    }
    
    /**
     * Calculate center of mass for all boxes currently in the scene
     * This is the main method that performs the physics calculation
     * 
     * @param {Array} boxes - Array of Three.js box meshes with userData containing weight
     * @returns {Object} Center of mass information including coordinates and deviation
     */
    calculateCenterOfMass(boxes) {
        // Validate input
        if (!boxes || boxes.length === 0) {
            console.log('No boxes provided for calculation');
            return this.getEmptyResult();
        }
        
        // Initialize calculation variables for 3D calculation
        let weightedSumX = 0;    // Sum of (weight × x-position) for all boxes
        let weightedSumY = 0;    // ✅ NEW: Sum of (weight × y-position) for height analysis
        let weightedSumZ = 0;    // Sum of (weight × z-position) for all boxes
        let totalWeight = 0;     // Total weight of all boxes
        let validBoxCount = 0;   // Count of boxes with valid weight data
        
        // Debug information
        if (this.isDebugMode) {
            console.log(`🧮 Calculating 3D center of mass for ${boxes.length} boxes`);
        }
        
        // Process each box in the 3D calculation
        for (let i = 0; i < boxes.length; i++) {
            const box = boxes[i];
            
            // Extract weight from box metadata
            const weight = this.extractBoxWeight(box);
            
            if (weight <= 0) {
                console.warn(`📦 Box ${i} has invalid weight: ${weight}. Skipping.`);
                continue; // Skip boxes with invalid weight
            }
            
            // Get box position in world coordinates
            const position = this.getBoxPosition(box);
            
            // ✅ ENHANCED: Add contribution to all three axes
            // Physics formula: Center = Σ(mass_i × position_i) / Σ(mass_i)
            weightedSumX += weight * position.x;
            weightedSumY += weight * position.y;  // ✅ NEW: Include height component
            weightedSumZ += weight * position.z;
            totalWeight += weight;
            validBoxCount++;
            
            // Enhanced debug output for 3D analysis
            if (this.isDebugMode) {
                console.log(`📦 Box ${i}: pos(${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)}), weight=${weight}kg`);
                console.log(`   contribution=(${(weight * position.x).toFixed(2)}, ${(weight * position.y).toFixed(2)}, ${(weight * position.z).toFixed(2)})`);
            }
        }
        
        // Validate that we have valid data for calculation
        if (totalWeight <= 0 || validBoxCount === 0) {
            console.warn('⚠️ No valid boxes found for center of mass calculation');
            return this.getEmptyResult();
        }
        
        // ✅ ENHANCED: Calculate 3D center of mass coordinates
        const centerX = weightedSumX / totalWeight;
        const centerY = weightedSumY / totalWeight;  // ✅ NEW: Height center of mass
        const centerZ = weightedSumZ / totalWeight;
        
        // ✅ ENHANCED: Calculate both 2D and 3D deviations
        // 2D deviation (horizontal only) - for backward compatibility
        const deviation2D = Math.sqrt(centerX * centerX + centerZ * centerZ);
        
        // 3D deviation (complete spatial analysis) - NEW FEATURE
        const deviation3D = Math.sqrt(centerX * centerX + centerY * centerY + centerZ * centerZ);
        
        // Store enhanced results
        this.currentCenterOfMass = {
            x: centerX,
            y: centerY,          // ✅ NEW: Y coordinate stored
            z: centerZ,
            totalWeight: totalWeight,
            deviation2D: deviation2D,    // Horizontal deviation only
            deviation3D: deviation3D,    // ✅ NEW: Complete 3D deviation
            boxCount: validBoxCount
        };

        // Enhanced logging with 3D information
        const deviationCm2D = window.unitsSystem ? 
            window.unitsSystem.threeJSToDisplayCm(deviation2D) : 
            deviation2D * 10;
            
        const deviationCm3D = window.unitsSystem ? 
            window.unitsSystem.threeJSToDisplayCm(deviation3D) : 
            deviation3D * 10;
        
        
        // Store in history for analysis
        this.calculationHistory.push({
            timestamp: Date.now(),
            result: { ...this.currentCenterOfMass },
            boxCount: validBoxCount
        });
        
        return this.getCurrentResult();
    }
    
    /**
     * Extract weight data from a Three.js box mesh
     * The weight should be stored in box.userData.weight when the box was created
     * 
     * @param {THREE.Mesh} box - The Three.js box mesh
     * @returns {number} The weight of the box in kg
     */
    extractBoxWeight(box) {
        // Check if box has valid userData with weight information
        if (!box.userData || typeof box.userData.weight !== 'number') {
            console.warn('Box missing weight data in userData:', box.userData);
            return 0;
        }
        
        return box.userData.weight;
    }
    
    /**
     * Get the position of a box in our coordinate system
     * This handles coordinate system conversion if needed
     * 
     * @param {THREE.Mesh} box - The Three.js box mesh
     * @returns {Object} Position object with x, y, z coordinates
     */
    getBoxPosition(box) {
        // For center of mass calculation, we primarily care about X and Z coordinates
        // Y (height) doesn't affect the top-down center of mass analysis
        return {
            x: box.position.x,
            y: box.position.y,
            z: box.position.z
        };
    }
    
    /**
     * Get empty result object for cases with no valid data
     * @returns {Object} Empty center of mass result
     */
    getEmptyResult() {
        this.currentCenterOfMass = {
            x: 0,
            z: 0,
            totalWeight: 0,
            deviation: 0,
            boxCount: 0
        };
        
        return this.getCurrentResult();
    }
    
    /**
     * Get current center of mass result with additional calculated properties
     * @returns {Object} Complete center of mass analysis
     */
    getCurrentResult() {
        const result = { ...this.currentCenterOfMass };
        
        // Add additional analysis properties
        result.deviationMm = this.currentCenterOfMass.deviation * 10; // Convert units to mm (1 unit = 1cm = 10mm)
        result.deviationCm = this.currentCenterOfMass.deviation; // Deviation in cm (direct units)
        result.deviationPercentage = this.calculateDeviationPercentage();
        result.stabilityRating = this.calculateStabilityRating();
        result.isWithinSafeZone = this.isWithinSafeZone();
        
        return result;
    }
    
    /**
     * Calculate deviation as percentage of pallet size
     * This provides context for how significant the deviation is
     * @returns {number} Deviation as percentage
     */
    calculateDeviationPercentage() {
            if (this.currentCenterOfMass.deviation3D === 0) return 0;
            
            // Calculate 3D diagonal including height estimate
            const estimatedMaxHeight = 20; // 20 units = 200cm typical max pallet height
            const pallet3DDiagonal = Math.sqrt(
                this.palletDimensions.length * this.palletDimensions.length +
                this.palletDimensions.width * this.palletDimensions.width +
                estimatedMaxHeight * estimatedMaxHeight
            ) / 2;
            
            return (this.currentCenterOfMass.deviation3D / pallet3DDiagonal) * 100;
        }
    
    /**
     * Calculate a stability rating based on center of mass deviation
     * @returns {string} Stability rating (Excellent, Good, Fair, Poor)
     */
    calculateStabilityRating() {
        const deviationMm = this.currentCenterOfMass.deviation * 10; // Convert to mm
        
        if (deviationMm <= 50) return 'Excellent';     // <= 5cm
        if (deviationMm <= 150) return 'Good';         // <= 15cm  
        if (deviationMm <= 300) return 'Fair';         // <= 30cm
        return 'Poor';                                 // > 30cm
    }
    
    /**
     * Check if center of mass is within safe operating zone
     * @returns {boolean} True if within safe zone
     */
    isWithinSafeZone() {
        const deviationMm = this.currentCenterOfMass.deviation * 10; // Convert to mm
        return deviationMm <= 250; // 25cm deviation considered safe
    }
    
    /**
     * ENHANCED: Get formatted deviation string with dynamic units for display
     * Shows mm for small deviations, cm for larger ones
     * @returns {string} Formatted deviation for UI display
     */
    // SUBSTITUIR o método getFormattedDeviation() por:
    getFormattedDeviation() {
        if (window.unitsSystem && window.unitsSystem.formatCenterOfMassDeviation) {
            return window.unitsSystem.formatCenterOfMassDeviation(this.currentCenterOfMass.deviation3D);
        } else {
            // Fallback formatting
            const deviationMm = this.currentCenterOfMass.deviation3D * 10;
            return deviationMm < 10 ? `${deviationMm.toFixed(1)}mm` : `${(deviationMm/10).toFixed(1)}cm`;
        }
    }

    getFormattedDeviation2D() {
        if (window.unitsSystem && window.unitsSystem.formatCenterOfMassDeviation) {
            return window.unitsSystem.formatCenterOfMassDeviation(this.currentCenterOfMass.deviation2D);
        } else {
            const deviationMm = this.currentCenterOfMass.deviation2D * 10;
            return deviationMm < 10 ? `${deviationMm.toFixed(1)}mm` : `${(deviationMm/10).toFixed(1)}cm`;
        }
    }
    
    /**
     * ENHANCED: Get formatted deviation with specific unit
     * @param {string} unit - 'mm' or 'cm'
     * @returns {string} Formatted deviation in specified unit
     */
    getFormattedDeviationInUnit(unit) {
        if (unit === 'mm') {
            const deviationMm = this.currentCenterOfMass.deviation * 10;
            return `${deviationMm.toFixed(1)}mm`;
        } else if (unit === 'cm') {
            const deviationCm = this.currentCenterOfMass.deviation;
            return `${deviationCm.toFixed(1)}cm`;
        } else {
            return this.getFormattedDeviation(); // Default dynamic formatting
        }
    }
    
    /**
     * ENHANCED: Get deviation values in both units
     * @returns {Object} Deviation values in both mm and cm with formatting info
     */
    getDeviationMetrics() {
        const deviation2DMm = this.currentCenterOfMass.deviation2D * 10;
        const deviation3DMm = this.currentCenterOfMass.deviation3D * 10;
        const heightDeviationMm = Math.abs(this.currentCenterOfMass.y) * 10;
        
        return {
            // 2D metrics (horizontal only)
            horizontal: {
                mm: {
                    value: deviation2DMm,
                    formatted: `${deviation2DMm.toFixed(1)}mm`
                },
                cm: {
                    value: deviation2DMm / 10,
                    formatted: `${(deviation2DMm / 10).toFixed(1)}cm`
                }
            },
            
            // ✅ NEW: 3D metrics (complete analysis)
            spatial: {
                mm: {
                    value: deviation3DMm,
                    formatted: `${deviation3DMm.toFixed(1)}mm`
                },
                cm: {
                    value: deviation3DMm / 10,
                    formatted: `${(deviation3DMm / 10).toFixed(1)}cm`
                }
            },
            
            // ✅ NEW: Height-specific metrics
            height: {
                mm: {
                    value: heightDeviationMm,
                    formatted: `${heightDeviationMm.toFixed(1)}mm`
                },
                cm: {
                    value: heightDeviationMm / 10,
                    formatted: `${(heightDeviationMm / 10).toFixed(1)}cm`
                }
            },
            
            // Primary display (3D)
            display: this.getFormattedDeviation(),
            recommendedUnit: deviation3DMm < 10 ? 'mm' : 'cm'
        };
    }
    
    /**
     * Enable or disable debug mode for detailed calculation logging
     * @param {boolean} enabled - Whether to enable debug mode
     */
    setDebugMode(enabled) {
        this.isDebugMode = enabled;
        console.log(`Center of mass debug mode ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    /**
     * Get calculation history for analysis
     * @returns {Array} Array of historical calculations
     */
    getCalculationHistory() {
        return [...this.calculationHistory];
    }
    
    /**
     * Clear calculation history (useful for memory management)
     */
    clearHistory() {
        this.calculationHistory = [];
        console.log('Center of mass calculation history cleared');
    }
    
    /**
     * Get detailed analysis report of current center of mass
     * @returns {Object} Comprehensive analysis report
     */
    getAnalysisReport() {
        const result = this.getCurrentResult();
        const metrics = this.getDeviationMetrics();
        
        return {
            summary: {
                centerOfMass: { x: result.x, z: result.z },
                deviation: {
                    mm: metrics.mm.value,
                    cm: metrics.cm.value,
                    display: metrics.display,
                    recommendedUnit: metrics.recommendedUnit
                },
                stabilityRating: result.stabilityRating,
                isWithinSafeZone: result.isWithinSafeZone
            },
            details: {
                totalWeight: result.totalWeight,
                boxCount: result.boxCount,
                deviationPercentage: result.deviationPercentage,
                palletDimensions: this.palletDimensions
            },
            recommendations: this.generateRecommendations(result)
        };
    }
    
    /**
     * ENHANCED: Visualize center of mass data in console with dynamic units
     */
    visualizeInConsole() {
        const result = this.getCurrentResult();
        const metrics = this.getDeviationMetrics();
        
        console.log('=== CENTER OF MASS ANALYSIS ===');
        console.log(`Position: (${result.x.toFixed(3)}, ${result.z.toFixed(3)}) units`);
        console.log(`Deviation: ${metrics.display} (${metrics.mm.formatted} / ${metrics.cm.formatted})`);
        console.log(`Recommended Unit: ${metrics.recommendedUnit}`);
        console.log(`Stability: ${result.stabilityRating}`);
        console.log(`Total Weight: ${result.totalWeight}kg`);
        console.log(`Box Count: ${result.boxCount}`);
        console.log('===============================');
    }
    
    /**
     * ENHANCED: Debug method with unit system explanation
     */
    debugUnitSystem() {
        console.log('=== UNIT SYSTEM DEBUG ===');
        console.log('Coordinate System:');
        console.log('  - 1 coordinate unit = 1cm');
        console.log('  - Pallet: 12.0 × 8.0 units = 120cm × 80cm');
        console.log('  - Center: (0, 0)');
        console.log('');
        console.log('Display Logic:');
        console.log('  - If deviation < 10mm → show in mm (more precise)');
        console.log('  - If deviation >= 10mm → show in cm (cleaner)');
        console.log('');
        console.log('Current State:');
        
        if (this.currentCenterOfMass.boxCount > 0) {
            const metrics = this.getDeviationMetrics();
            console.log(`  - Raw deviation: ${this.currentCenterOfMass.deviation.toFixed(3)} units`);
            console.log(`  - In mm: ${metrics.mm.formatted}`);
            console.log(`  - In cm: ${metrics.cm.formatted}`);
            console.log(`  - Display: ${metrics.display}`);
            console.log(`  - Recommended: ${metrics.recommendedUnit}`);
        } else {
            console.log('  - No boxes loaded');
        }
        
        console.log('=========================');
    }
}

// Export the class to make it available globally
// This enables other files to create instances and use the functionality
window.CenterOfMassCalculator = CenterOfMassCalculator;