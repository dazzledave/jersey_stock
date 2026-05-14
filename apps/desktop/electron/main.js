const { app, BrowserWindow, Menu, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Removed disableHardwareAcceleration to fix input locks on Windows

const isDev = process.env.NODE_ENV === 'development';
const { spawn } = require('child_process');
let serverProcess;

function startServer() {
  const userDataPath = app.getPath('userData');
  const logStream = fs.createWriteStream(path.join(userDataPath, 'server.log'));
  
  // Database persistence logic
  const dbName = 'jersey_stock.db';
  const targetDbPath = path.join(userDataPath, dbName);
  const templateDbPath = path.join(process.resourcesPath, 'prisma/dev.db');

  if (!fs.existsSync(targetDbPath) && fs.existsSync(templateDbPath)) {
    try {
      fs.copyFileSync(templateDbPath, targetDbPath);
      logStream.write(`Initial database created at: ${targetDbPath}\n`);
    } catch (err) {
      logStream.write(`Failed to create initial database: ${err.message}\n`);
    }
  }

  let serverPath = path.join(process.resourcesPath, 'app/server.js');
  
  if (isDev) {
    serverPath = path.join(__dirname, '../server.js');
  }

  logStream.write(`Attempting to start standalone server at: ${serverPath}\n`);
  
  // Use Electron's own executable as the Node runner
  const nodeExe = process.execPath;

  serverProcess = spawn(nodeExe, [serverPath], {
    cwd: isDev ? path.dirname(serverPath) : path.join(process.resourcesPath, 'app'),
    env: { 
      ...process.env, 
      PORT: 3000, 
      NODE_ENV: isDev ? 'development' : 'production',
      ELECTRON_RUN_AS_NODE: '1', // This is the magic key!
      DATABASE_URL: `file:///${targetDbPath.replace(/\\/g, '/')}`
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
  });

  serverProcess.on('exit', (code, signal) => {
    logStream.write(`Server exited with code ${code} and signal ${signal}\n`);
  });
}

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

  win.on('focus', () => {
    win.webContents.focus();
  });

  // Always load from localhost:3000 as we are running a dynamic Next.js server
  win.loadURL('http://localhost:3000');

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
