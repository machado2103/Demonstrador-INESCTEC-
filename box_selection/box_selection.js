// box_selection.js - JavaScript para a página de seleção de caixas
document.addEventListener('DOMContentLoaded', function() {
    // Constantes
    const MAX_BOXES = 5;
    const MIN_BOXES = 0;
    
    // Elementos da UI
    const decrementButtons = document.querySelectorAll('.decrement');
    const incrementButtons = document.querySelectorAll('.increment');
    const nextButton = document.getElementById('next-step-btn');
    const notification = document.getElementById('max-boxes-notification');
    
    // Inicializar contadores
    const counters = {
        1: parseInt(document.getElementById('counter-1').textContent) || 1,
        2: parseInt(document.getElementById('counter-2').textContent) || 1,
        3: parseInt(document.getElementById('counter-3').textContent) || 2,
        4: parseInt(document.getElementById('counter-4').textContent) || 0
    };
    
    // Adicionar evento de clique nos botões de decremento
    decrementButtons.forEach(button => {
        button.addEventListener('click', function() {
            const boxType = this.getAttribute('data-box');
            decrementCounter(boxType);
        });
    });
    
    // Adicionar evento de clique nos botões de incremento
    incrementButtons.forEach(button => {
        button.addEventListener('click', function() {
            const boxType = this.getAttribute('data-box');
            incrementCounter(boxType);
        });
    });
    
    // Adicionar evento de clique no botão de próxima etapa
    if (nextButton) {
        nextButton.addEventListener('click', function() {
            // Salvar contadores no localStorage para uso posterior
            localStorage.setItem('boxSelections', JSON.stringify(counters));
            
            // Redirecionar para a GUI
            console.log('Avançando para a GUI com as seguintes caixas:', counters);
            window.location.href = '../GUI/index.html';
        });
    }
    
    // Função para decrementar o contador
    function decrementCounter(boxType) {
        if (counters[boxType] > MIN_BOXES) {
            counters[boxType]--;
            updateCounterDisplay(boxType);
        }
    }
    
    // Função para incrementar o contador
    function incrementCounter(boxType) {
        if (counters[boxType] < MAX_BOXES) {
            counters[boxType]++;
            updateCounterDisplay(boxType);
        } else {
            showMaxBoxesNotification();
        }
    }
    
    // Função para atualizar a exibição do contador
    function updateCounterDisplay(boxType) {
        const counterElement = document.getElementById(`counter-${boxType}`);
        if (counterElement) {
            counterElement.textContent = counters[boxType];
        }
    }
    
    // Função para mostrar a notificação de número máximo de caixas
    function showMaxBoxesNotification() {
        notification.classList.add('show');
        
        // Remover a notificação após 2.5 segundos
        setTimeout(function() {
            notification.classList.remove('show');
        }, 2500);
    }
    
    console.log('Box selection page initialized successfully!');
});