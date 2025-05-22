// GUI.js - JavaScript para a interface da GUI
document.addEventListener('DOMContentLoaded', function() {
    console.log('GUI interface initialized successfully!');
    
    // Recuperar dados das caixas selecionadas na página anterior
    const boxSelections = JSON.parse(localStorage.getItem('boxSelections')) || {};
    console.log('Dados das caixas recebidos:', boxSelections);
    
    // Inicializar interface com dados simulados
    initializeInterface(boxSelections);
    
    // Iniciar cronômetro em tempo real
    startRealTimeTimer();
    
    // Iniciar animações e atualizações de dados simulados
    startDataSimulation();
});

// Variáveis globais para o cronômetro
let startTime = Date.now();
let timerInterval = null;

function startRealTimeTimer() {
    // Guardar o momento de início
    startTime = Date.now();
    
    // Atualizar o timer a cada 100ms (10 FPS - fluido mas eficiente)
    timerInterval = setInterval(updateTimer, 100);
    
    console.log('Cronômetro iniciado às:', new Date(startTime).toLocaleTimeString());
}

function updateTimer() {
    const currentTime = Date.now();
    const elapsedTime = (currentTime - startTime) / 1000; // Converter para segundos
    
    // Formatar o tempo com 1 casa decimal
    const formattedTime = elapsedTime.toFixed(1);
    
    // Atualizar o elemento HTML usando o ID
    const executionTimeElement = document.getElementById('execution-time');
    
    if (executionTimeElement) {
        executionTimeElement.textContent = formattedTime + 's';
    }
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
        console.log('Cronômetro parado');
    }
}

function resetTimer() {
    stopTimer();
    startRealTimeTimer();
    console.log('Cronômetro reiniciado');
}

function getElapsedTime() {
    const currentTime = Date.now();
    return (currentTime - startTime) / 1000;
}

function initializeInterface(boxData) {
    // Calcular total de caixas baseado na seleção anterior
    const totalBoxes = Object.values(boxData).reduce((sum, count) => sum + count, 0);
    
    // Atualizar informações da visualização
    updateVisualizationInfo(totalBoxes);
    
    // Atualizar métricas com dados simulados baseados na seleção
    updateMetrics(boxData);
    
    console.log('Interface inicializada com', totalBoxes, 'caixas');
}

function updateVisualizationInfo(totalBoxes) {
    // Atualizar número de caixas colocadas
    const boxesPlacedElement = document.getElementById('boxes-placed');
    if (boxesPlacedElement) {
        boxesPlacedElement.textContent = totalBoxes;
    }
    
    // Simular altura baseada no número de caixas
    const estimatedHeight = Math.round(totalBoxes * 12.5); // ~12.5cm por caixa
    const currentHeightElement = document.getElementById('current-height');
    if (currentHeightElement) {
        currentHeightElement.textContent = estimatedHeight + 'cm';
    }
    
    // O tempo será atualizado pelo cronômetro em tempo real
}

function updateMetrics(boxData) {
    // Atualizar pie chart com eficiência dinâmica primeiro
    const efficiency = updatePieChart(boxData);
    
    // Atualizar métricas da barra inferior usando a mesma eficiência
    updateBottomMetrics(boxData, efficiency);
    
    // As outras métricas visuais (gráficos) são estáticas por enquanto
}

function updatePieChart(boxData) {
    const totalBoxes = Object.values(boxData).reduce((sum, count) => sum + count, 0);
    
    // Calcular eficiência baseada no número de caixas (simulação)
    // Fórmula: base de 75% + bônus baseado no número de caixas
    let occupiedPercentage = Math.min(98, 75 + (totalBoxes * 2) + Math.random() * 5);
    occupiedPercentage = Math.round(occupiedPercentage * 10) / 10; // Arredondar para 1 casa decimal
    
    const freePercentage = Math.round((100 - occupiedPercentage) * 10) / 10;
    
    // Atualizar os textos no HTML
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
    
    // Atualizar o visual do pie chart
    updatePieChartVisual(occupiedPercentage);
    
    // Retornar a eficiência para usar na Global Efficiency
    return occupiedPercentage;
}

function updatePieChartVisual(occupiedPercentage) {
    const pieChartElement = document.querySelector('.pie-chart');
    
    if (pieChartElement) {
        // Converter percentagem para graus (360deg = 100%)
        const occupiedDegrees = (occupiedPercentage / 100) * 360;
        
        // Atualizar o background com conic-gradient dinâmico
        const gradientStyle = `conic-gradient(
            var(--primary-color) 0deg ${occupiedDegrees}deg, 
            #e0e0e0 ${occupiedDegrees}deg 360deg
        )`;
        
        pieChartElement.style.background = gradientStyle;
        
        console.log(`Pie chart atualizado: ${occupiedPercentage}% (${occupiedDegrees}deg) ocupado, ${(100-occupiedPercentage)}% livre`);
    }
}

function updateBottomMetrics(boxData, globalEfficiency) {
    const totalBoxes = Object.values(boxData).reduce((sum, count) => sum + count, 0);
    
    // Simular desvio do centro de massa
    const massDeviation = (Math.random() * 5).toFixed(1);
    const massDeviationElement = document.getElementById('mass-deviation');
    if (massDeviationElement) {
        massDeviationElement.textContent = massDeviation + 'cm';
    }
    
    // Simular número de colisões (geralmente 0 para um bom algoritmo)
    const collisions = Math.floor(Math.random() * 2); // 0 ou 1
    const collisionsElement = document.getElementById('collisions');
    if (collisionsElement) {
        collisionsElement.textContent = collisions;
    }
    
    // Usar a mesma eficiência do pie chart para Global Efficiency
    const globalEfficiencyElement = document.getElementById('global-efficiency');
    if (globalEfficiencyElement && globalEfficiency !== undefined) {
        globalEfficiencyElement.textContent = globalEfficiency + '%';
    }
}

// Função para simular variações na eficiência do pie chart
function simulatePieChartVariations() {
    const pieEfficiencyElement = document.getElementById('pie-efficiency');
    const occupiedElement = document.getElementById('occupied-percentage');
    const freeElement = document.getElementById('free-percentage');
    const globalEfficiencyElement = document.getElementById('global-efficiency');
    
    if (pieEfficiencyElement && occupiedElement && freeElement && globalEfficiencyElement) {
        // Obter valor atual e aplicar pequena variação
        const currentOccupied = parseFloat(pieEfficiencyElement.textContent);
        const variation = (Math.random() - 0.5) * 2; // ±1%
        let newOccupied = Math.max(70, Math.min(98, currentOccupied + variation));
        newOccupied = Math.round(newOccupied * 10) / 10;
        
        const newFree = Math.round((100 - newOccupied) * 10) / 10;
        
        // Atualizar textos do pie chart
        pieEfficiencyElement.textContent = newOccupied + '%';
        occupiedElement.textContent = newOccupied + '%';
        freeElement.textContent = newFree + '%';
        
        // Atualizar Global Efficiency com o mesmo valor
        globalEfficiencyElement.textContent = newOccupied + '%';
        
        // Atualizar visual
        updatePieChartVisual(newOccupied);
    }
}

function startDataSimulation() {
    // Simular atualizações periódicas de dados (a cada 5 segundos para não interferir com o timer)
    setInterval(function() {
        // Pequenas variações nos valores para simular um sistema em tempo real
        simulateDataVariations();
    }, 5000);
    
    // Animar barras do gráfico ao carregar
    animateBarChart();
}

function simulateDataVariations() {
    // Não mais atualizar o tempo de execução aqui - ele é atualizado pelo cronômetro
    
    // Simular pequenas variações no desvio do centro de massa
    const massDeviationElement = document.getElementById('mass-deviation');
    if (massDeviationElement) {
        const currentDeviation = parseFloat(massDeviationElement.textContent);
        const newDeviation = Math.max(0, currentDeviation + (Math.random() - 0.5) * 0.5).toFixed(1);
        massDeviationElement.textContent = newDeviation + 'cm';
    }
    
    // Simular variações no pie chart
    simulatePieChartVariations();
}

function animateBarChart() {
    // Animar as barras do gráfico ao carregar a página
    const bars = document.querySelectorAll('.bar');
    bars.forEach((bar, index) => {
        const originalHeight = bar.style.height;
        bar.style.height = '0%';
        setTimeout(() => {
            bar.style.height = originalHeight;
        }, 500 + index * 200);
    });
}

// Função para logging de debug (pode ser removida em produção)
function logInterfaceStatus() {
    console.log('=== Status da Interface GUI ===');
    console.log('Tempo decorrido:', getElapsedTime().toFixed(1) + 's');
    console.log('Caixas colocadas:', document.getElementById('boxes-placed')?.textContent);
    console.log('Altura atual:', document.getElementById('current-height')?.textContent);
    console.log('Desvio centro de massa:', document.getElementById('mass-deviation')?.textContent);
    console.log('Colisões:', document.getElementById('collisions')?.textContent);
    console.log('Eficiência global:', document.getElementById('global-efficiency')?.textContent);
}

// Executar log de status após 2 segundos para debug
setTimeout(logInterfaceStatus, 2000);

// Funções utilitárias expostas globalmente para debug/controle
window.timerControls = {
    stop: stopTimer,
    reset: resetTimer,
    getElapsed: getElapsedTime
};

// Parar o cronômetro quando a página for fechada ou o usuário sair
window.addEventListener('beforeunload', function() {
    stopTimer();
});