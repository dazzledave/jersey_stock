const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const serve = require('electron-serve');

const isDev = process.env.NODE_ENV === 'development';
const { spawn } = require('child_process');
let serverProcess;

function startServer() {
  const logStream = fs.createWriteStream(path.join(app.getPath('userData'), 'server.log'));
  
  // Try to find the server in multiple possible locations
  let serverPath = path.join(process.resourcesPath, 'app.asar.unpacked/server_dist/src/index.js');
  
  if (isDev) {
    serverPath = path.join(__dirname, '../../server/src/index.js');
  }

  logStream.write(`Attempting to start server at: ${serverPath}\n`);
  logStream.write(`Working Directory: ${process.cwd()}\n`);
  logStream.write(`Resources Path: ${process.resourcesPath}\n`);

  const dbPath = path.join(process.resourcesPath, 'app.asar.unpacked/server_dist/dev.db');
  
  serverProcess = spawn('node', [serverPath], {
    env: { 
      ...process.env, 
      PORT: 4000, 
      NODE_ENV: 'production',
      DATABASE_URL: `file:${dbPath}`
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  serverProcess.stdout.pipe(logStream);
  serverProcess.stderr.pipe(logStream);

  serverProcess.on('error', (err) => {
    logStream.write(`Failed to start server process: ${err.message}\n`);
  });
}

// Setup the static file server for production
const loadURL = serve({ directory: path.join(__dirname, '../out') });

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: "Awards Centre Inventory system",
    icon: path.join(__dirname, '../public/logo.png')
  });

  if (isDev) {
    win.loadURL('http://localhost:3000');
  } else {
    // Use the custom app:// protocol to load the exported files
    loadURL(win);
  }

  const template = [
    {
      label: 'File',
      submenu: [{ role: 'quit' }]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  startServer();
  createWindow();
});

app.on('will-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
