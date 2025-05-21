// preload.js - versão atualizada
const { contextBridge, ipcRenderer } = require('electron');

// Expõe uma API para o processo de renderização
contextBridge.exposeInMainWorld('electronAPI', {
  // Funções serão adicionadas aqui conforme necessário
  appVersion: '1.0.0',
  
  // Função para navegação entre páginas
  navigateTo: (page) => {
    console.log('Solicitando navegação para:', page);
    ipcRenderer.send('navigate', page);
  }
});