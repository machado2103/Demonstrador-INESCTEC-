// GUI.js - JavaScript for the GUI interface
document.addEventListener('DOMContentLoaded', function() {
    console.log('GUI interface initialized successfully!');
    
    // Retrieve box selection data from previous page
    const boxSelections = JSON.parse(localStorage.getItem('boxSelections')) || {};
    console.log('Box data received:', boxSelections);
    
    // Initialize interface with simulated data
    initializeInterface(boxSelections);
    
    // Start real-time timer
    startRealTimeTimer();
    
    // Start animations and simulated data updates
    startDataSimulation();
});

// Global variables for the timer
let startTime = Date.now();
let timerInterval = null;

function startRealTimeTimer() {
    // Store the start moment
    startTime = Date.now();
    
    // Update timer every 100ms (10 FPS - fluid but efficient)
    timerInterval = setInterval(updateTimer, 100);
    
    console.log('Timer started at:', new Date(startTime).toLocaleTimeString());
}

function updateTimer() {
    const currentTime = Date.now();
    const elapsedTime = (currentTime - startTime) / 1000; // Convert to seconds
    
    // Format time with 1 decimal place
    const formattedTime = elapsedTime.toFixed(1);
    
    // Update HTML element using ID
    const executionTimeElement = document.getElementById('execution-time');
    
    if (executionTimeElement) {
        executionTimeElement.textContent = formattedTime + 's';
    }
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
        console.log('Timer stopped');
    }
}

function resetTimer() {
    stopTimer();
    startRealTimeTimer();
    console.log('Timer reset');
}

function getElapsedTime() {
    const currentTime = Date.now();
    return (currentTime - startTime) / 1000;
}

function initializeInterface(boxData) {
    // Calculate total boxes based on previous selection
    const totalBoxes = Object.values(boxData).reduce((sum, count) => sum + count, 0);
    
    // Update visualization information
    updateVisualizationInfo(totalBoxes);
    
    // Update metrics with simulated data based on selection
    updateMetrics(boxData);
    
    console.log('Interface initialized with', totalBoxes, 'boxes');
}

function updateVisualizationInfo(totalBoxes) {
    // Update number of placed boxes
    const boxesPlacedElement = document.getElementById('boxes-placed');
    if (boxesPlacedElement) {
        boxesPlacedElement.textContent = totalBoxes;
    }
    
    // Simulate height based on number of boxes
    const estimatedHeight = Math.round(totalBoxes * 12.5); // ~12.5cm per box
    const currentHeightElement = document.getElementById('current-height');
    if (currentHeightElement) {
        currentHeightElement.textContent = estimatedHeight + 'cm';
    }
    
    // Time will be updated by real-time timer
}

function updateMetrics(boxData) {
    // Update pie chart with dynamic efficiency first
    const efficiency = updatePieChart(boxData);
    
    // Update bottom metrics using the same efficiency
    updateBottomMetrics(boxData, efficiency);
    
    // Other visual metrics (charts) are static for now
}

function updatePieChart(boxData) {
    const totalBoxes = Object.values(boxData).reduce((sum, count) => sum + count, 0);
    
    // Calculate efficiency based on number of boxes (simulation)
    // Formula: 75% base + bonus based on number of boxes
    let occupiedPercentage = Math.min(98, 75 + (totalBoxes * 2) + Math.random() * 5);
    occupiedPercentage = Math.round(occupiedPercentage * 10) / 10; // Round to 1 decimal place
    
    const freePercentage = Math.round((100 - occupiedPercentage) * 10) / 10;
    
    // Update HTML text elements
    const pieEfficiencyElement = document.getElementById('pie-efficiency');
    const occupiedElement = document.getElementById('occupied-percentage');
    const freeElement = document.getElementById('free-percentage');
    
    if (pieEfficiencyElement) {
        pieEfficiencyElement.textContent = occupiedPercentage + '%';
    }
    
    if (occupiedElement) {
        occupiedElement.textContent = occupiedPercentage + '%';
    }
    
    if (freeElement) {
        freeElement.textContent = freePercentage + '%';
    }
    
    // Update pie chart visual representation
    updatePieChartVisual(occupiedPercentage);
    
    // Return efficiency for use in Global Efficiency
    return occupiedPercentage;
}

function updatePieChartVisual(occupiedPercentage) {
    const pieChartElement = document.querySelector('.pie-chart');
    
    if (pieChartElement) {
        // Convert percentage to degrees (360deg = 100%)
        const occupiedDegrees = (occupiedPercentage / 100) * 360;
        
        // Update background with dynamic conic-gradient
        const gradientStyle = `conic-gradient(
            var(--primary-color) 0deg ${occupiedDegrees}deg, 
            #e0e0e0 ${occupiedDegrees}deg 360deg
        )`;
        
        pieChartElement.style.background = gradientStyle;
        
        console.log(`Pie chart updated: ${occupiedPercentage}% (${occupiedDegrees}deg) occupied, ${(100-occupiedPercentage)}% free`);
    }
}

function updateBottomMetrics(boxData, globalEfficiency) {
    const totalBoxes = Object.values(boxData).reduce((sum, count) => sum + count, 0);
    
    // Simulate center of mass deviation
    const massDeviation = (Math.random() * 5).toFixed(1);
    const massDeviationElement = document.getElementById('mass-deviation');
    if (massDeviationElement) {
        massDeviationElement.textContent = massDeviation + 'cm';
    }
    
    // Simulate number of collisions (usually 0 for a good algorithm)
    const collisions = Math.floor(Math.random() * 2); // 0 or 1
    const collisionsElement = document.getElementById('collisions');
    if (collisionsElement) {
        collisionsElement.textContent = collisions;
    }
    
    // Use same efficiency from pie chart for Global Efficiency
    const globalEfficiencyElement = document.getElementById('global-efficiency');
    if (globalEfficiencyElement && globalEfficiency !== undefined) {
        globalEfficiencyElement.textContent = globalEfficiency + '%';
    }
}

// Function to simulate variations in pie chart efficiency
function simulatePieChartVariations() {
    const pieEfficiencyElement = document.getElementById('pie-efficiency');
    const occupiedElement = document.getElementById('occupied-percentage');
    const freeElement = document.getElementById('free-percentage');
    const globalEfficiencyElement = document.getElementById('global-efficiency');
    
    if (pieEfficiencyElement && occupiedElement && freeElement && globalEfficiencyElement) {
        // Get current value and apply small variation
        const currentOccupied = parseFloat(pieEfficiencyElement.textContent);
        const variation = (Math.random() - 0.5) * 2; // ±1%
        let newOccupied = Math.max(70, Math.min(98, currentOccupied + variation));
        newOccupied = Math.round(newOccupied * 10) / 10;
        
        const newFree = Math.round((100 - newOccupied) * 10) / 10;
        
        // Update pie chart text elements
        pieEfficiencyElement.textContent = newOccupied + '%';
        occupiedElement.textContent = newOccupied + '%';
        freeElement.textContent = newFree + '%';
        
        // Update Global Efficiency with same value
        globalEfficiencyElement.textContent = newOccupied + '%';
        
        // Update visual representation
        updatePieChartVisual(newOccupied);
    }
}

function startDataSimulation() {
    // Simulate periodic data updates (every 5 seconds to not interfere with timer)
    setInterval(function() {
        // Small variations in values to simulate a real-time system
        simulateDataVariations();
    }, 5000);
    
    // Animate bar chart on load
    animateBarChart();
}

function simulateDataVariations() {
    // No longer update execution time here - it's updated by the timer
    
    // Simulate small variations in center of mass deviation
    const massDeviationElement = document.getElementById('mass-deviation');
    if (massDeviationElement) {
        const currentDeviation = parseFloat(massDeviationElement.textContent);
        const newDeviation = Math.max(0, currentDeviation + (Math.random() - 0.5) * 0.5).toFixed(1);
        massDeviationElement.textContent = newDeviation + 'cm';
    }
    
    // Simulate pie chart variations
    simulatePieChartVariations();
}

function animateBarChart() {
    // Animate chart bars when page loads
    const bars = document.querySelectorAll('.bar');
    bars.forEach((bar, index) => {
        const originalHeight = bar.style.height;
        bar.style.height = '0%';
        setTimeout(() => {
            bar.style.height = originalHeight;
        }, 500 + index * 200);
    });
}

// Debug logging function (can be removed in production)
function logInterfaceStatus() {
    console.log('=== GUI Interface Status ===');
    console.log('Elapsed time:', getElapsedTime().toFixed(1) + 's');
    console.log('Boxes placed:', document.getElementById('boxes-placed')?.textContent);
    console.log('Current height:', document.getElementById('current-height')?.textContent);
    console.log('Center of mass deviation:', document.getElementById('mass-deviation')?.textContent);
    console.log('Collisions:', document.getElementById('collisions')?.textContent);
    console.log('Global efficiency:', document.getElementById('global-efficiency')?.textContent);
}

// Execute status log after 2 seconds for debugging
setTimeout(logInterfaceStatus, 2000);

// Utility functions exposed globally for debug/control
window.timerControls = {
    stop: stopTimer,
    reset: resetTimer,
    getElapsed: getElapsedTime
};

// Stop timer when page is closed or user navigates away
window.addEventListener('beforeunload', function() {
    stopTimer();
});