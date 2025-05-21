// JavaScript para a página de descrição
document.addEventListener('DOMContentLoaded', function() {
    // Referência ao botão de iniciar simulação
    const startSimulationBtn = document.getElementById('start-simulation-btn');
    
    // Adicionar evento de clique ao botão se ele existir
    if (startSimulationBtn) {
        startSimulationBtn.addEventListener('click', function() {
            console.log('Botão de navegação clicado!');
            // Usar a API do Electron para navegação
            if (window.electronAPI) {
                console.log('Usando API do Electron para navegação');
                window.electronAPI.navigateTo('box_selection/index.html');
            } else {
                console.log('API do Electron não encontrada, usando navegação padrão');
                // Navegação para a página de seleção de caixas usando caminho absoluto
                const baseUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/'));
                const parentUrl = baseUrl.substring(0, baseUrl.lastIndexOf('/'));
                const newUrl = parentUrl + '/box_selection/index.html';
                console.log('Navegando para:', newUrl);
                window.location.href = newUrl;
            }
        });
    } else {
        console.error('Botão start-simulation-btn não encontrado!');
    }
    
    console.log('Description page initialized successfully');
});