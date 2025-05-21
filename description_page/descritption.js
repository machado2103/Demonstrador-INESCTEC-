// JavaScript of the description page

document.addEventListener('DOMContentLoaded', function() {
    // Button to Start the Simulation Reference
    const startSimulationBtn = document.getElementById('start-simulation-btn');
    
    // Adicionar evento de clique ao botão
    if (startSimulationBtn) {
        startSimulationBtn.addEventListener('click', function() {
            // For now it only will show a message
            alert('Starting simulation...\nThis feature will be implemented soon.');
            
            // No futuro:
            // Redirecionar para a página de simulação
            // window.location.href = '../simulacao/index.html';

            // OUUUU

            // Enviar uma mensagem para o processo principal do Electron
            // Para iniciar a simulação robótica real
            // if (window.electronAPI) {
            //     window.electronAPI.startSimulation();
            // }
        });
    }
    
    console.log('Description page initialized succesfully');
});