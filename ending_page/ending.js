// ending.js - JavaScript para a página de finalização
document.addEventListener('DOMContentLoaded', function() {
    console.log('Ending page initialized - Starting countdown...');
    
    // Iniciar o contador regressivo
    startCountdown();
    
    // Adicionar efeitos sonoros ou visuais opcionais
    initializePageEffects();
});

// Variáveis globais para o countdown
let countdownValue = 10;
let countdownInterval = null;

function startCountdown() {
    const countdownElement = document.getElementById('countdown');
    
    if (!countdownElement) {
        console.error('Elemento countdown não encontrado!');
        return;
    }
    
    // Atualizar display inicial
    countdownElement.textContent = countdownValue;
    
    // Iniciar o intervalo de 1 segundo
    countdownInterval = setInterval(function() {
        countdownValue--;
        countdownElement.textContent = countdownValue;
        
        // Log para debug
        console.log(`Redirecting in ${countdownValue} seconds...`);
        
        // Adicionar efeito visual quando restam poucos segundos
        if (countdownValue <= 3) {
            countdownElement.style.color = '#e74c3c';
            countdownElement.style.fontSize = '1.4rem';
        }
        
        // Quando chegar a 0, redirecionar
        if (countdownValue <= 0) {
            clearInterval(countdownInterval);
            redirectToHome();
        }
    }, 1000);
    
    console.log('Countdown started - 10 seconds to redirect');
}

function redirectToHome() {
    console.log('Redirecting to home page...');
    
    // Adicionar efeito de fade out antes do redirect
    const container = document.querySelector('.ending-container');
    if (container) {
        container.style.transition = 'opacity 0.5s ease-out';
        container.style.opacity = '0';
    }
    
    // Redirecionar após meio segundo (tempo do fade out)
    setTimeout(function() {
        window.location.href = '../index.html';
    }, 500);
}

function initializePageEffects() {
    // Adicionar efeito de entrada suave para toda a página
    const container = document.querySelector('.ending-container');
    if (container) {
        container.style.opacity = '0';
        container.style.transition = 'opacity 0.8s ease-in';
        
        // Fade in após um pequeno delay
        setTimeout(function() {
            container.style.opacity = '1';
        }, 100);
    }
    
    // Adicionar hover effect no logo
    const logo = document.getElementById('app-logo');
    if (logo) {
        logo.addEventListener('click', function() {
            // Easter egg: clique no logo para voltar imediatamente
            if (confirm('Return to home immediately?')) {
                clearInterval(countdownInterval);
                redirectToHome();
            }
        });
    }
    
    // Adicionar efeito de partículas de confetti (opcional)
    createConfettiEffect();
}

function createConfettiEffect() {
    // Simular efeito de confetti simples com CSS
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
    
    // Remover o elemento após a animação
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

// Adicionar CSS da animação de confetti dinamicamente
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

// Função para parar o countdown (útil para debug)
function stopCountdown() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
        console.log('Countdown stopped');
    }
}

// Função para resetar o countdown (útil para debug)
function resetCountdown() {
    stopCountdown();
    countdownValue = 10;
    startCountdown();
    console.log('Countdown reset');
}

// Expor funções para debug no console
window.endingPageControls = {
    stop: stopCountdown,
    reset: resetCountdown,
    redirectNow: redirectToHome
};

// Limpar intervalos se a página for fechada
window.addEventListener('beforeunload', function() {
    stopCountdown();
});

console.log('Ending page script loaded successfully!');