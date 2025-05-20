const { ipcRenderer, contextBridge } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  request: (options) => ipcRenderer.invoke('api-request', options),
});

const response = await window.api.request({ method: 'GET', endpoint: '/status' });
