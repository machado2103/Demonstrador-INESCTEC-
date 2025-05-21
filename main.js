// main.js - Electron main process
const { app, BrowserWindow } = require('electron');
const path = require('path');

// Desabilitar sandbox e uso de shared memory para evitar erros no Linux
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-dev-shm-usage');

// Criar a janela principal
function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Carregar a página HTML
  win.loadFile('index.html');
  
  // Descomentar esta linha para abrir o DevTools para debugging
  win.webContents.openDevTools();
}

// Inicializar o aplicativo
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    // No macOS, recreate a window quando o ícone do dock é clicado e não há outras janelas abertas
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Sair quando todas as janelas estiverem fechadas (exceto no macOS)
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});