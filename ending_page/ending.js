// ending.js - JavaScript for the ending page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Ending page initialized - Starting countdown...');
    
    // Initialize countdown timer
    startCountdown();
    
    // Add optional visual effects and interactions
    initializePageEffects();
});

// Global variables for countdown functionality
let countdownValue = 10;
let countdownInterval = null;

function startCountdown() {
    const countdownElement = document.getElementById('countdown');
    
    if (!countdownElement) {
        console.error('Countdown element not found!');
        return;
    }
    
    // Update initial display
    countdownElement.textContent = countdownValue;
    
    // Start 1-second interval timer
    countdownInterval = setInterval(function() {
        countdownValue--;
        countdownElement.textContent = countdownValue;
        
        // Debug logging
        console.log(`Redirecting in ${countdownValue} seconds...`);
        
        // Add visual effect when few seconds remain
        if (countdownValue <= 3) {
            countdownElement.style.color = '#e74c3c';
            countdownElement.style.fontSize = '1.4rem';
        }
        
        // When reaching 0s, redirect to home
        if (countdownValue <= 0) {
            clearInterval(countdownInterval);
            redirectToHome();
        }
    }, 1000);
    
    console.log('Countdown started - 10 seconds to redirect');
}

function redirectToHome() {
    console.log('Redirecting to home page...');
    
    // Add fade out effect before redirect
    const container = document.querySelector('.ending-container');
    if (container) {
        container.style.transition = 'opacity 0.5s ease-out';
        container.style.opacity = '0';
    }
    
    // Redirect after half second (fade out duration)
    setTimeout(function() {
        window.location.href = '../index.html';
    }, 500);
}

function initializePageEffects() {
    // Add smooth entrance effect for entire page
    const container = document.querySelector('.ending-container');
    if (container) {
        container.style.opacity = '0';
        container.style.transition = 'opacity 0.8s ease-in';
        
        // Fade in after small delay
        setTimeout(function() {
            container.style.opacity = '1';
        }, 100);
    }
    
    // interactive hover effect to logo
    const logo = document.getElementById('app-logo');
    if (logo) {
        logo.addEventListener('click', function() {
            // click logo to return immediately
            if (confirm('Return to home immediately?')) {
                clearInterval(countdownInterval);
                redirectToHome();
            }
        });
    }
    
    // CONFETIIII particle effect
    createConfettiEffect();
}

function createConfettiEffect() {
    // Simulate confetti effect (using CSS animations)
    for (let i = 0; i < 15; i++) {
        setTimeout(function() {
            createConfettiPiece();
        }, i * 200);
    }
}

function createConfettiPiece() {
    const confetti = document.createElement('div');
    confetti.style.cssText = `
        position: fixed;
        top: -10px;
        left: ${Math.random() * 100}%;
        width: 8px;
        height: 8px;
        background: ${getRandomColor()};
        animation: confettiFall ${3 + Math.random() * 2}s linear forwards;
        z-index: 1000;
        border-radius: 2px;
    `;
    
    document.body.appendChild(confetti);
    
    // Remove element after animation finishes
    setTimeout(function() {
        if (confetti.parentNode) {
            confetti.parentNode.removeChild(confetti);
        }
    }, 5000);
}

function getRandomColor() {
    const colors = ['#3498db', '#e74c3c', '#f39c12', '#2ecc71', '#9b59b6', '#e67e22'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Dynamically inject confetti animation CSS
const confettiCSS = `
    @keyframes confettiFall {
        0% {
            transform: translateY(-10px) rotate(0deg);
            opacity: 1;
        }
        100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
        }
    }
`;

const style = document.createElement('style');
style.textContent = confettiCSS;
document.head.appendChild(style);


                // DEBBUGGING //


// Function to stop countdown (useful for debugging)
function stopCountdown() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
        console.log('Countdown stopped');
    }
}

// Function to reset countdown (useful for debugging)
function resetCountdown() {
    stopCountdown();
    countdownValue = 10;
    startCountdown();
    console.log('Countdown reset');
}

// Expose utility functions for debug console access
window.endingPageControls = {
    stop: stopCountdown,
    reset: resetCountdown,
    redirectNow: redirectToHome
};

// Clean up intervals when page is closed
window.addEventListener('beforeunload', function() {
    stopCountdown();
});

console.log('Ending page script loaded successfully!');