/**
 * Bottom Metrics Calculator for Palletization Simulator
 * Calculates Load Stability Index (LSI) and Box Density Score
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
            
            boxDensity: {
                value: 0,
                score: 0,
                efficiency: 'Low'
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
        
        // Calculate Box Density Score
        const densityResult = this.calculateBoxDensityScore(boxes);
        
        // Store results
        this.currentMetrics.lsi = lsiResult;
        this.currentMetrics.boxDensity = densityResult;
             
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
     * Calculate Box Density Score
     * Measures boxes per square meter + utilization efficiency
     * 
     * @param {Array} boxes - Array of boxes
     * @returns {Object} Box density calculation result
     */
    calculateBoxDensityScore(boxes) {
        if (!boxes || boxes.length === 0) {
            return {
                value: 0,
                score: 0,
                efficiency: 'Empty'
            };
        }
        
        // 1. Calculate raw density (boxes per m²)
        const palletAreaM2 = this.palletDimensions.baseArea / 100; // Convert to m²
        const rawDensity = boxes.length / palletAreaM2;
        
        // 2. Calculate efficiency score
        // Based on industrial benchmarks: 30-50 boxes/m² is typical for mixed pallets
        const benchmarks = {
            minimum: 10,    // Minimum acceptable density
            good: 30,       // Good density
            excellent: 50   // Excellent density
        };
        
        let efficiencyScore = 0;
        if (rawDensity >= benchmarks.excellent) {
            efficiencyScore = 100;
        } else if (rawDensity >= benchmarks.good) {
            // Linear between good and excellent
            const ratio = (rawDensity - benchmarks.good) / (benchmarks.excellent - benchmarks.good);
            efficiencyScore = 70 + (ratio * 30); // 70-100%
        } else if (rawDensity >= benchmarks.minimum) {
            // Linear between minimum and good
            const ratio = (rawDensity - benchmarks.minimum) / (benchmarks.good - benchmarks.minimum);
            efficiencyScore = 30 + (ratio * 40); // 30-70%
        } else {
            // Below minimum
            efficiencyScore = Math.max(0, (rawDensity / benchmarks.minimum) * 30);
        }
        
        // 3. Determine efficiency rating
        const efficiency = this.getDensityEfficiencyRating(efficiencyScore);
        
        return {
            value: rawDensity,
            score: efficiencyScore,
            efficiency: efficiency,
            benchmarks: benchmarks
        };
    }

    /**
     * Determine efficiency rating based on density score
     * @param {number} efficiencyScore - Efficiency score (0-100%)
     * @returns {string} Efficiency rating
     */
    getDensityEfficiencyRating(efficiencyScore) {
        if (efficiencyScore >= 85) return 'Excellent';
        if (efficiencyScore >= 70) return 'Good';
        if (efficiencyScore >= 50) return 'Fair';
        if (efficiencyScore >= 30) return 'Poor';
        if (efficiencyScore > 0) return 'Low';
        return 'Empty';
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
     * Get safety limits information
     * @returns {Object} Safety limits information
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
                conservative: 'For fragile products or sensitive transport',
                standard: 'For normal industrial applications (recommended)',
                liberal: 'For very stable loads and careful transport'
            }
        };
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
            boxDensity: {
                value: 0,
                score: 0,
                efficiency: 'Empty'
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
            safetyInfo: this.getSafetyInfo()
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
            boxDensity: {
                display: `${current.boxDensity.value.toFixed(1)} boxes/m²`,
                rating: current.boxDensity.efficiency,
                color: this.getDensityColor(current.boxDensity.score)
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
     * Get density color based on animation state
     */
    getDensityColor(densityScore) {
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
            boxDensity: {
                value: 0,
                score: 0,
                efficiency: 'Empty'
            }
        };
    }
    
    /**
     * Clean up resources
     */
    dispose() {
        this.currentMetrics = null;
    }
}

// Export for global access
window.BottomMetricsCalculator = BottomMetricsCalculator;