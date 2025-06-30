/**
 * Bottom Metrics Calculator for Palletization Simulator
 * Calculates Load Stability Index (LSI) and Total Weight
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
        
        // Safety limits configuration
        this.safetyLimits = {
            conservative: 20,       // 20cm - For sensitive products
            standard: 30,           // 30cm - For normal industrial applications
            liberal: 40,            // 40cm - For very stable loads
            current: 30             // Active limit (can be changed dynamically)
        };
        
        // Current metrics state
        this.currentMetrics = {
            lsi: {
                value: 100,
                centerOfMassScore: 100,
                weightDistributionScore: 100,
                stabilityRating: 'Excellent'
            },
            
            totalWeight: {
                value: 0,              // Total weight in kg
                formattedValue: '0 kg' // Formatted display value
            }
        };
    }
    
    /**
     * Calculate all bottom metrics
     * @param {Array} boxes - Array of Three.js box objects
     * @param {Object} centerOfMassResult - Center of mass calculation result
     * @returns {Object} Calculated metrics
     */
    calculateBottomMetrics(boxes, centerOfMassResult = null) {
        if (!boxes || boxes.length === 0) {
            return this.getEmptyMetrics();
        }
        
        // Calculate Load Stability Index
        const lsiResult = this.calculateLoadStabilityIndex(boxes, centerOfMassResult);
        
        // Calculate Total Weight
        const weightResult = this.calculateTotalWeight(boxes);
        
        // Store results
        this.currentMetrics.lsi = lsiResult;
        this.currentMetrics.totalWeight = weightResult;
             
        return this.getCurrentMetrics();
    }
    
    /**
     * Calculate Load Stability Index (LSI)
     * Formula: LSI = (Center_of_Mass_Score × 0.6) + (Weight_Distribution_Score × 0.4)
     * 
     * @param {Array} boxes - Array of boxes
     * @param {Object} centerOfMassResult - Center of mass result
     * @returns {Object} LSI calculation result
     */
    calculateLoadStabilityIndex(boxes, centerOfMassResult) {
        // 1. Center of mass score (60% of LSI)
        let centerOfMassScore = 100; // Default when no deviation
        
        if (centerOfMassResult && typeof centerOfMassResult.deviationCm === 'number') {
            const deviationCm = centerOfMassResult.deviationCm;
            const safeLimit = this.safetyLimits.current;
            
            // Calculate score based on deviation relative to safe limit
            if (deviationCm <= safeLimit) {
                // Linear decay: 100% when deviation = 0, 0% when deviation = limit
                centerOfMassScore = Math.max(0, (1 - deviationCm / safeLimit) * 100);
            } else {
                // Severe penalty for deviations above limit
                centerOfMassScore = 0;
            }
        }
        
        // 2. Weight distribution score (40% of LSI)
        const weightDistributionScore = this.calculateWeightDistributionScore(boxes);
        
        // 3. Calculate final LSI
        const lsiValue = (centerOfMassScore * 0.6) + (weightDistributionScore * 0.4);
        
        // 4. Determine stability rating
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
     * Calculate weight distribution score
     * Analyzes how weight is distributed across the pallet
     * 
     * @param {Array} boxes - Array of boxes
     * @returns {number} Weight distribution score (0-100%)
     */
    calculateWeightDistributionScore(boxes) {
        if (boxes.length <= 1) return 100; // One or no boxes = perfect distribution
        
        // Divide pallet into 4 quadrants
        const quadrants = [0, 0, 0, 0]; // [Q1, Q2, Q3, Q4]
        let totalWeight = 0;
        
        boxes.forEach(box => {
            const weight = box.userData.weight || 0;
            const x = box.position.x;
            const z = box.position.z;
            
            // Determine quadrant based on position
            let quadrant = 0;
            if (x >= 0 && z >= 0) quadrant = 0; // Q1: +x, +z
            else if (x < 0 && z >= 0) quadrant = 1; // Q2: -x, +z
            else if (x < 0 && z < 0) quadrant = 2; // Q3: -x, -z
            else quadrant = 3; // Q4: +x, -z
            
            quadrants[quadrant] += weight;
            totalWeight += weight;
        });
        
        if (totalWeight === 0) return 100;
        
        // Calculate percentages per quadrant
        const percentages = quadrants.map(weight => (weight / totalWeight) * 100);
        
        // Calculate standard deviation of percentages
        const mean = 25; // Perfect distribution = 25% per quadrant
        const variance = percentages.reduce((sum, percentage) => {
            return sum + Math.pow(percentage - mean, 2);
        }, 0) / 4;
        const standardDeviation = Math.sqrt(variance);
        
        // Convert standard deviation to score (0-100%)
        // SD = 0 (perfect) → 100%, SD = 25 (terrible) → 0%
        const maxSD = 25; // Maximum possible deviation
        const score = Math.max(0, (1 - standardDeviation / maxSD) * 100);
        
        return score;
    }
    
    /**
     * Determine stability rating based on LSI
     * @param {number} lsiValue - LSI value (0-100%)
     * @returns {string} Stability rating
     */
    getLSIRating(lsiValue) {
        if (lsiValue >= 85) return 'Excellent';
        if (lsiValue >= 70) return 'Good';
        if (lsiValue >= 55) return 'Fair';
        if (lsiValue >= 40) return 'Poor';
        return 'Critical';
    }
    
    /**
     * Calculate Total Weight of all boxes on pallet
     * Sums the weight of all boxes currently placed
     * NOTE: Assumes input weights are in GRAMS and converts to KILOGRAMS
     * 
     * @param {Array} boxes - Array of boxes
     * @returns {Object} Total weight calculation result
     */
    calculateTotalWeight(boxes) {
        if (!boxes || boxes.length === 0) {
            return {
                value: 0,
                formattedValue: '0 kg',
                boxCount: 0
            };
        }
        
        // 1. Calculate total weight by summing all box weights (convert grams to kg)
        let totalWeightGrams = 0;
        let validBoxCount = 0;
        
        boxes.forEach(box => {
            const weightGrams = box.userData.weight || 0;
            if (weightGrams > 0) {
                totalWeightGrams += weightGrams;
                validBoxCount++;
            }
        });
        
        // Convert grams to kilograms
        const totalWeightKg = totalWeightGrams / 1000;
        
        // 2. Format the weight for display
        const formattedValue = this.formatWeight(totalWeightKg);
        
        return {
            value: totalWeightKg,           // Weight in kilograms
            valueGrams: totalWeightGrams,   // Original weight in grams
            formattedValue: formattedValue,
            boxCount: validBoxCount,
            averageBoxWeight: validBoxCount > 0 ? (totalWeightKg / validBoxCount) : 0
        };
    }

    /**
     * Format weight value for display
     * @param {number} weightKg - Weight in kilograms
     * @returns {string} Formatted weight string
     */
    formatWeight(weightKg) {
        if (weightKg === 0) {
            return '0 kg';
        } else if (weightKg < 1000) {
            return `${weightKg.toFixed(1)} kg`;
        } else {
            const weightTons = weightKg / 1000;
            return `${weightTons.toFixed(2)} t`;
        }
    }
    
    /**
     * Set custom safety limit
     * @param {number} limitCm - Limit in centimeters
     */
    setSafetyLimit(limitCm) {
        if (limitCm > 0 && limitCm <= 60) {
            this.safetyLimits.current = limitCm;
        } else {
            console.warn(`Invalid safety limit: ${limitCm}cm. Must be between 1-60cm.`);
        }
    }
    
    /**
     * Use predefined safety profile
     * @param {string} profile - 'conservative', 'standard', or 'liberal'
     */
    setSafetyProfile(profile) {
        if (this.safetyLimits.hasOwnProperty(profile) && profile !== 'current') {
            this.safetyLimits.current = this.safetyLimits[profile];
        } else {
            console.warn(`Invalid safety profile: ${profile}. Available: conservative, standard, liberal`);
        }
    }
    
    /**
     * Get empty metrics (when no data available)
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
            totalWeight: {
                value: 0,
                formattedValue: '0 kg',
                boxCount: 0
            }
        };
    }
    
    /**
     * Get current metrics with additional information
     */
    getCurrentMetrics() {
        return {
            ...this.currentMetrics,
            timestamp: Date.now(),
        };
    }
    
    /**
     * Get formatted values for UI display
     */
    getFormattedMetrics() {
        const current = this.currentMetrics;
        
        return {
            lsi: {
                display: `${current.lsi.value.toFixed(1)}%`,
                rating: current.lsi.stabilityRating,
                color: this.getLSIColor(current.lsi.value)
            },
            totalWeight: {
                display: current.totalWeight.formattedValue,
                color: this.getWeightColor(current.totalWeight.value)
            }
        };
    }
    
    /**
     * Get LSI color based on animation state
     */
    getLSIColor(lsiValue) {
        if (window.palletApp && window.palletApp.animationState.isCompleted) {
            return '#27ae60'; // Green when animation complete
        } else {
            return '#3498db'; // Blue during animation
        }
    }
    
    /**
     * Get weight color based on animation state and weight value
     */
    getWeightColor(weightValue) {
        if (window.palletApp && window.palletApp.animationState.isCompleted) {
            return '#27ae60'; // Green when animation complete
        } else {
            return '#3498db'; // Blue during animation
        }
    }
    
    /**
     * Reset metrics to initial state
     */
    reset() {
        this.currentMetrics = {
            lsi: {
                value: 100,
                centerOfMassScore: 100,
                weightDistributionScore: 100,
                stabilityRating: 'No Load',
                safetyLimit: this.safetyLimits.current
            },
            totalWeight: {
                value: 0,
                formattedValue: '0 kg',
                boxCount: 0
            }
        };
    }
    
    /**
     * Clean up resources
     */
    dispose() {
        this.currentMetrics = null;
    }

    // ============================================
    // BACKWARD COMPATIBILITY METHODS
    // These maintain compatibility with existing code that expects boxDensity
    // ============================================
    
    /**
     * @deprecated Use totalWeight instead
     * Maintains backward compatibility
     */
    get boxDensity() {
        console.warn('boxDensity is deprecated, use totalWeight instead');
        return {
            value: this.currentMetrics.totalWeight.value,
            score: Math.min(100, this.currentMetrics.totalWeight.value / 10), // Simple mapping
            efficiency: 'N/A'
        };
    }
}

// Export for global access
window.BottomMetricsCalculator = BottomMetricsCalculator;