/**
 * Center of Mass Calculator for Palletization Simulator
 * 
 * This file handles all physics calculations related to center of mass analysis.
 * It provides a dedicated, focused system for weight distribution calculations
 * that can be easily maintained and extended.
 * 
 * Key Concepts:
 * - Center of Mass: The point where all mass can be considered concentrated
 * - Weighted Average: Each box "pulls" the center proportional to its weight
 * - Coordinate System: Uses pallet center (0,0) as reference point
 * 
 * Save this as: GUI/3d-viewer/js/center-of-mass.js
 */

class CenterOfMassCalculator {
    constructor() {
        // Physics constants and configuration
        this.palletDimensions = {
            length: 12.0,    // 1200mm in our coordinate system
            width: 8.0,      // 800mm in our coordinate system
            centerX: 0,      // Pallet center X coordinate
            centerZ: 0       // Pallet center Z coordinate
        };
        
        // Calculation state
        this.currentCenterOfMass = {
            x: 0,            // X coordinate of center of mass
            z: 0,            // Z coordinate of center of mass (we ignore Y for top-down analysis)
            totalWeight: 0,  // Total weight of all boxes
            deviation: 0,    // Distance from pallet center
            boxCount: 0      // Number of boxes included in calculation
        };
        
        // Debug and analysis data
        this.calculationHistory = [];
        this.isDebugMode = false;
        
        console.log('CenterOfMassCalculator initialized with pallet dimensions:', this.palletDimensions);
    }
    
    /**
     * Calculate center of mass for all boxes currently in the scene
     * This is the main method that performs the physics calculation
     * 
     * @param {Array} boxes - Array of Three.js box meshes with userData containing weight
     * @returns {Object} Center of mass information including coordinates and deviation
     */
    calculateCenterOfMass(boxes) {
        console.log('=== Starting Center of Mass Calculation ===');
        
        // Validate input
        if (!boxes || boxes.length === 0) {
            console.log('No boxes provided for calculation');
            return this.getEmptyResult();
        }
        
        // Initialize calculation variables
        let weightedSumX = 0;    // Sum of (weight × x-position) for all boxes
        let weightedSumZ = 0;    // Sum of (weight × z-position) for all boxes
        let totalWeight = 0;     // Total weight of all boxes
        let validBoxCount = 0;   // Count of boxes with valid weight data
        
        // Debug information
        if (this.isDebugMode) {
            console.log(`Calculating center of mass for ${boxes.length} boxes`);
        }
        
        // Process each box in the calculation
        for (let i = 0; i < boxes.length; i++) {
            const box = boxes[i];
            
            // Extract weight from box metadata (stored when box was created)
            const weight = this.extractBoxWeight(box);
            
            if (weight <= 0) {
                console.warn(`Box ${i} has invalid weight: ${weight}. Skipping.`);
                continue; // Skip boxes with invalid weight
            }
            
            // Get box position in world coordinates
            const position = this.getBoxPosition(box);
            
            // Add this box's contribution to the weighted sums
            // Physics formula: Center = Σ(mass_i × position_i) / Σ(mass_i)
            weightedSumX += weight * position.x;
            weightedSumZ += weight * position.z;
            totalWeight += weight;
            validBoxCount++;
            
            // Debug output for individual boxes
            if (this.isDebugMode) {
                console.log(`Box ${i}: pos(${position.x.toFixed(2)}, ${position.z.toFixed(2)}), weight=${weight}, contribution_x=${(weight * position.x).toFixed(2)}, contribution_z=${(weight * position.z).toFixed(2)}`);
            }
        }
        
        // Validate that we have valid data for calculation
        if (totalWeight <= 0 || validBoxCount === 0) {
            console.warn('No valid boxes found for center of mass calculation');
            return this.getEmptyResult();
        }
        
        // Calculate final center of mass coordinates
        // This is the weighted average: total weighted sum / total weight
        const centerX = weightedSumX / totalWeight;
        const centerZ = weightedSumZ / totalWeight;
        
        // Calculate deviation from pallet center
        // Using Pythagorean theorem: distance = √(x² + z²)
        const deviation = Math.sqrt(centerX * centerX + centerZ * centerZ);
        
        // Store results
        this.currentCenterOfMass = {
            x: centerX,
            z: centerZ,
            totalWeight: totalWeight,
            deviation: deviation,
            boxCount: validBoxCount
        };
        
        // Store in history for analysis
        this.calculationHistory.push({
            timestamp: Date.now(),
            result: { ...this.currentCenterOfMass },
            boxCount: validBoxCount
        });
        
        // Log completion
        console.log(`✓ Center of mass calculated: (${centerX.toFixed(3)}, ${centerZ.toFixed(3)}) with deviation ${deviation.toFixed(3)} from center`);
        console.log(`Total weight: ${totalWeight}kg across ${validBoxCount} boxes`);
        
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
        result.deviationCm = this.currentCenterOfMass.deviation * 100; // Convert to centimeters
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
        if (this.currentCenterOfMass.deviation === 0) return 0;
        
        // Calculate deviation relative to pallet diagonal
        const palletDiagonal = Math.sqrt(
            this.palletDimensions.length * this.palletDimensions.length +
            this.palletDimensions.width * this.palletDimensions.width
        ) / 2;
        
        return (this.currentCenterOfMass.deviation / palletDiagonal) * 100;
    }
    
    /**
     * Calculate a stability rating based on center of mass deviation
     * @returns {string} Stability rating (Excellent, Good, Fair, Poor)
     */
    calculateStabilityRating() {
        const deviationCm = this.currentCenterOfMass.deviation * 100;
        
        if (deviationCm <= 5) return 'Excellent';
        if (deviationCm <= 15) return 'Good';
        if (deviationCm <= 30) return 'Fair';
        return 'Poor';
    }
    
    /**
     * Check if center of mass is within safe operating zone
     * @returns {boolean} True if within safe zone
     */
    isWithinSafeZone() {
        const deviationCm = this.currentCenterOfMass.deviation * 100;
        return deviationCm <= 25; // 25cm deviation considered safe
    }
    
    /**
     * Get formatted deviation string for display
     * @returns {string} Formatted deviation for UI display
     */
    getFormattedDeviation() {
        const deviationCm = this.currentCenterOfMass.deviation * 100;
        return `${deviationCm.toFixed(1)}cm`;
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
        
        return {
            summary: {
                centerOfMass: { x: result.x, z: result.z },
                deviation: result.deviationCm,
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
     * Generate recommendations based on center of mass analysis
     * @param {Object} result - Center of mass calculation result
     * @returns {Array} Array of recommendation strings
     */
    generateRecommendations(result) {
        const recommendations = [];
        
        if (result.deviationCm > 25) {
            recommendations.push('Consider redistributing heavier boxes closer to pallet center');
        }
        
        if (result.deviationCm > 15) {
            recommendations.push('Monitor stability during transport');
        }
        
        if (result.stabilityRating === 'Excellent') {
            recommendations.push('Excellent load distribution - optimal for transport');
        }
        
        if (result.boxCount < 5) {
            recommendations.push('Low box count - center of mass calculation may be less reliable');
        }
        
        return recommendations;
    }
    
    /**
     * Visualize center of mass data in console (for debugging)
     */
    visualizeInConsole() {
        const result = this.getCurrentResult();
        
        console.log('=== CENTER OF MASS ANALYSIS ===');
        console.log(`Position: (${result.x.toFixed(3)}, ${result.z.toFixed(3)})`);
        console.log(`Deviation: ${result.deviationCm.toFixed(1)}cm`);
        console.log(`Stability: ${result.stabilityRating}`);
        console.log(`Total Weight: ${result.totalWeight}kg`);
        console.log(`Box Count: ${result.boxCount}`);
        console.log('===============================');
    }
}

// Export the class to make it available globally
// This enables other files to create instances and use the functionality
window.CenterOfMassCalculator = CenterOfMassCalculator;