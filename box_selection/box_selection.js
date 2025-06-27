// box_selection.js - JavaScript for the box selection page
document.addEventListener('DOMContentLoaded', function() {
    // Application constants
    const MAX_BOXES = 5;
    const MIN_BOXES = 0;
    
    // UI element references
    const decrementButtons = document.querySelectorAll('.decrement');
    const incrementButtons = document.querySelectorAll('.increment');
    const nextButton = document.getElementById('next-step-btn');
    const notification = document.getElementById('max-boxes-notification');
    
    // Initialize counter state with default values
    const counters = {
        1: parseInt(document.getElementById('counter-1').textContent) || 0,
        2: parseInt(document.getElementById('counter-2').textContent) || 0,
        3: parseInt(document.getElementById('counter-3').textContent) || 0,
        4: parseInt(document.getElementById('counter-4').textContent) || 0
    };
    
    // Attach event listeners to decrement buttons
    decrementButtons.forEach(button => {
        button.addEventListener('click', function() {
            const boxType = this.getAttribute('data-box');
            decrementCounter(boxType);
        });
    });
    
    // Attach event listeners to increment buttons
    incrementButtons.forEach(button => {
        button.addEventListener('click', function() {
            const boxType = this.getAttribute('data-box');
            incrementCounter(boxType);
        });
    });
    
    // Handle navigation to the next page
    if (nextButton) {
        nextButton.addEventListener('click', function() {
            // Persist box selections in localStorage for next page
            localStorage.setItem('boxSelections', JSON.stringify(counters));
            
            // Navigate to main GUI interface
            console.log('Advancing to GUI with selected boxes:', counters);
            window.location.href = '../GUI/index.html';
        });
    }
    
    // Decrements the counter for specified box type
    function decrementCounter(boxType) {
        if (counters[boxType] > MIN_BOXES) {
            counters[boxType]--;
            updateCounterDisplay(boxType);
        }
    }
    
    // Increments the counter for specified box type with validation
    function incrementCounter(boxType) {
        if (counters[boxType] < MAX_BOXES) {
            counters[boxType]++;
            updateCounterDisplay(boxType);
        } else {
            showMaxBoxesNotification();
        }
    }
    
    // Updates the counter display element in the DOM
    function updateCounterDisplay(boxType) {
        const counterElement = document.getElementById(`counter-${boxType}`);
        if (counterElement) {
            counterElement.textContent = counters[boxType];
        }
    }
    
    // Displays notification when maximum box limit is reached
    function showMaxBoxesNotification() {
        notification.classList.add('show');
        
        // Auto-hide notification after 2.5s
        setTimeout(function() {
            notification.classList.remove('show');
        }, 2500);
    }


    const prevButton = document.getElementById('prev-step-btn');
    if (prevButton) {
        prevButton.addEventListener('click', function() {
            // Navigate back to description page
            console.log('Returning to description page');
            window.location.href = '../description_page/index.html';
        });
    }
    
    console.log('Box selection page initialized successfully!');


});

