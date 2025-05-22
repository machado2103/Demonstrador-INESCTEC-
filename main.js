// main.js - Electron main process
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const cowsay = require('cowsay');

// Desabilitar sandbox e uso de shared memory para evitar erros no Linux
//app.commandLine.appendSwitch('no-sandbox');
//app.commandLine.appendSwitch('disable-dev-shm-usage');


let mainWindow;

// Create main window
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

  // Load HTML file
  mainWindow.loadFile('index.html');
  
  //Descomentar esta linha para abrir o DevTools para debugging
  //-------------------------------------------------------------
  //mainWindow.webContents.openDevTools();                      |
  //-------------------------------------------------------------

}

// Initialize the App
app.whenReady().then(() => {
  const startupMessage = cowsay.say({
    text: "Mooooooo",
    e: "oO",  // olhos da vaca (opcional)
    T: "U "   // língua da vaca (opcional)
  });
    
  console.log(startupMessage);

  createWindow();


  app.on('activate', function () {
    // No macOS, recreate a window quando o ícone do dock é clicado e não há outras janelas abertas
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Manipulates the navigation event
ipcMain.on('navigate', (event, pagePath) => {
  console.log('Evento de navegação recebido:', pagePath);
  if (mainWindow) {
    const fullPath = path.join(__dirname, pagePath);
    console.log('Carregando arquivo:', fullPath);
    mainWindow.loadFile(fullPath);
  }
});

// Exits when all windows are closed (Note: except on macOS)
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});