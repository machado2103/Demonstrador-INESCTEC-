const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const axios = require('axios');

// Cria a janela principal
function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile('index.html');
}

// Inicializa a app
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Sai completamente ao fechar tudo
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});


// ======= Comunicação com o backend FastAPI =======
ipcMain.handle('api-request', async (event, options) => {
  try {
    const baseUrl = 'http://localhost:5000'; // ou 127.0.0.1:5000
    const response = await axios({
      method: options.method,
      url: `${baseUrl}${options.endpoint}`,
      data: options.data || {}, // POST/PUT data
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  } catch (error) {
    console.error('API request error:', error.message);
    return { success: false, error: error.message };
  }
});
