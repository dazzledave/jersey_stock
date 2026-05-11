const { app, BrowserWindow, Menu, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const serve = require('electron-serve');

// FIX: Disable hardware acceleration to prevent 'ghosting' input locks on Windows
app.disableHardwareAcceleration();

const isDev = process.env.NODE_ENV === 'development';
const { spawn } = require('child_process');
let serverProcess;

function startServer() {
  const userDataPath = app.getPath('userData');
  const logStream = fs.createWriteStream(path.join(userDataPath, 'server.log'));
  
  // Database persistence logic
  const dbName = 'jersey_stock.db';
  const targetDbPath = path.join(userDataPath, dbName);
  const templateDbPath = path.join(process.resourcesPath, 'app.asar.unpacked/server_dist/dev.db');

  // Copy database template to AppData on first run
  if (!fs.existsSync(targetDbPath) && fs.existsSync(templateDbPath)) {
    try {
      fs.copyFileSync(templateDbPath, targetDbPath);
      logStream.write(`Initial database created at: ${targetDbPath}\n`);
    } catch (err) {
      logStream.write(`Failed to create initial database: ${err.message}\n`);
    }
  }

  // Try to find the server in multiple possible locations
  let serverPath = path.join(process.resourcesPath, 'app.asar.unpacked/server_dist/src/index.js');
  
  if (isDev) {
    serverPath = path.join(__dirname, '../../server/src/index.js');
  }

  logStream.write(`Attempting to start server at: ${serverPath}\n`);
  
  const internalNodePath = path.join(process.resourcesPath, 'app.asar.unpacked/server_dist/node.exe');
  const nodeExe = (isDev || !fs.existsSync(internalNodePath)) ? 'node' : internalNodePath;

  serverProcess = spawn(nodeExe, [serverPath], {
    cwd: path.dirname(serverPath),
    env: { 
      ...process.env, 
      PORT: 4000, 
      NODE_ENV: 'production',
      NODE_PATH: path.join(path.dirname(serverPath), '../server_lib'),
      DATABASE_URL: isDev ? process.env.DATABASE_URL : `file:///${targetDbPath.replace(/\\/g, '/')}`
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  const desktopLogPath = path.join(app.getPath('home'), 'Desktop', 'POS_Server_Diagnostic.txt');
  fs.appendFileSync(desktopLogPath, `\n--- NEW LAUNCH ---\nTarget DB: ${targetDbPath}\n`);

  serverProcess.stdout.on('data', (data) => {
    logStream.write(data);
    fs.appendFileSync(desktopLogPath, data.toString());
  });
  
  serverProcess.stderr.on('data', (data) => {
    logStream.write(data);
    fs.appendFileSync(desktopLogPath, `[STDERR] ${data.toString()}`);
  });

  serverProcess.on('error', (err) => {
    logStream.write(`Failed to start server process: ${err.message}\n`);
    fs.appendFileSync(desktopLogPath, `[SPAWN ERROR] ${err.message}\n`);
    const { dialog } = require('electron');
    dialog.showErrorBox('Critical Server Failure', `The background server failed to start: ${err.message}\n\nPlease ensure your Antivirus is not blocking the application.`);
  });

  serverProcess.on('exit', (code, signal) => {
    logStream.write(`Server exited with code ${code} and signal ${signal}\n`);
    fs.appendFileSync(desktopLogPath, `[EXIT] Code: ${code}, Signal: ${signal}\n`);
    if (code !== 0 && code !== null) {
      const { dialog } = require('electron');
      dialog.showErrorBox('Server Crashed', `The backend server crashed unexpectedly with exit code ${code}.\n\nA diagnostic log has been saved to your Desktop as POS_Server_Diagnostic.txt. Please send this file to the developer.`);
    }
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

  // FIX: Force focus restoration whenever the window is activated
  win.on('focus', () => {
    win.webContents.focus();
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
