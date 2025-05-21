// main.js - Electron main process (updated)
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Desabilitar sandbox e uso de shared memory para evitar erros no Linux
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-dev-shm-usage');

let mainWindow;

// Criar a janela principal
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Carregar a página HTML
  mainWindow.loadFile('index.html');
  
  // Descomentar esta linha para abrir o DevTools para debugging
  //mainWindow.webContents.openDevTools();
}

// Inicializar o aplicativo
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    // No macOS, recreate a window quando o ícone do dock é clicado e não há outras janelas abertas
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Manipular evento de navegação
ipcMain.on('navigate', (event, pagePath) => {
  console.log('Evento de navegação recebido:', pagePath);
  if (mainWindow) {
    const fullPath = path.join(__dirname, pagePath);
    console.log('Carregando arquivo:', fullPath);
    mainWindow.loadFile(fullPath);
  }
});

// Sair quando todas as janelas estiverem fechadas (exceto no macOS)
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});