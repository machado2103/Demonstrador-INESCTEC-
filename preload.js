// preload.js - versão simplificada
const { contextBridge } = require('electron');

// Expõe uma API mínima para o processo de renderização
contextBridge.exposeInMainWorld('electronAPI', {
  // Funções serão adicionadas aqui conforme necessário
  appVersion: '1.0.0'
});