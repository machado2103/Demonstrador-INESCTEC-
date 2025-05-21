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
        1: parseInt(document.getElementById('counter-1').textContent) || 0,
        2: parseInt(document.getElementById('counter-2').textContent) || 0,
        3: parseInt(document.getElementById('counter-3').textContent) || 0,
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
            
            // Redirecionar para a próxima página
            // Note: Esta linha será modificada posteriormente quando a próxima página estiver pronta
            console.log('Advancing to the next step with the following nº of boxes:', counters);
            // window.location.href = '../next_page/index.html';
            alert('Numa implementação completa, aqui avançaria para a próxima etapa.');
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
        
        // Remover a notificação após 2 segundos
        setTimeout(function() {
            notification.classList.remove('show');
        }, 2000);
    }
    
    console.log('Box selection page initialized successfully!');
});