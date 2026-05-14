const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');
const Database = require('better-sqlite3');

let mainWindow;
let serverProcess;
const SERVER_URL = 'http://localhost:3000';

// THE FULL METAL JACKET: 100% Mirror of schema.prisma
const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS "categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "categories_name_key" ON "categories"("name");

CREATE TABLE IF NOT EXISTS "products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "basePrice" REAL NOT NULL,
    "costPrice" REAL NOT NULL DEFAULT 0,
    "categoryId" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "product_variants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "size" TEXT,
    "color" TEXT,
    "sku" TEXT,
    "barcode" TEXT,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "product_variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "product_variants_sku_key" ON "product_variants"("sku");
CREATE UNIQUE INDEX IF NOT EXISTS "product_variants_barcode_key" ON "product_variants"("barcode");

CREATE TABLE IF NOT EXISTS "inventory" (
    "variantId" TEXT NOT NULL PRIMARY KEY,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "reorderLevel" INTEGER NOT NULL DEFAULT 5,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "inventory_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "StockMovement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "variantId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockMovement_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STAFF',
    "recoveryKey" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "users_username_key" ON "users"("username");

CREATE TABLE IF NOT EXISTS "customers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "customers_phone_key" ON "customers"("phone");
CREATE UNIQUE INDEX IF NOT EXISTS "customers_email_key" ON "customers"("email");

CREATE TABLE IF NOT EXISTS "sales" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "totalAmount" REAL NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "userId" TEXT,
    "soldBy" TEXT,
    "debtorName" TEXT,
    "debtorPhone" TEXT,
    "authorizer" TEXT,
    "customerId" TEXT,
    "payments" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sales_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "sales_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "sale_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "saleId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sale_items_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sale_items_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "settings" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "sync_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entity" TEXT,
    "entityId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`;

function initializeDatabase(dbPath, logStream) {
  try {
    logStream.write(`[FOUNDATION] Initializing database at: ${dbPath}\n`);
    const db = new Database(dbPath);
    
    // 1. Create tables if they don't exist
    db.exec(SCHEMA_SQL);
    
    // 2. THE AGGRESSIVE UPGRADE ENGINE: Mirrored from schema.prisma
    const updates = [
      { t: 'products', c: 'brand', d: 'TEXT' },
      { t: 'products', c: 'basePrice', d: 'REAL NOT NULL DEFAULT 0' },
      { t: 'products', c: 'costPrice', d: 'REAL NOT NULL DEFAULT 0' },
      { t: 'products', c: 'imageUrl', d: 'TEXT' },
      { t: 'product_variants', c: 'size', d: 'TEXT' },
      { t: 'product_variants', c: 'color', d: 'TEXT' },
      { t: 'inventory', c: 'reorderLevel', d: 'INTEGER NOT NULL DEFAULT 5' },
      { t: 'users', c: 'recoveryKey', d: 'TEXT' },
      { t: 'sync_logs', c: 'message', d: 'TEXT' },
      { t: 'sync_logs', c: 'error', d: 'TEXT' },
      { t: 'sales', c: 'totalAmount', d: 'REAL NOT NULL DEFAULT 0' },
      { t: 'sales', c: 'debtorName', d: 'TEXT' },
      { t: 'sales', c: 'debtorPhone', d: 'TEXT' },
      { t: 'sales', c: 'authorizer', d: 'TEXT' },
      { t: 'sales', c: 'payments', d: 'TEXT' }
    ];

    updates.forEach(({ t, c, d }) => {
      try {
        const info = db.prepare(`PRAGMA table_info(${t})`).all();
        if (!info.some(col => col.name === c)) {
          logStream.write(`[UPGRADE] Adding missing column '${c}' to table '${t}'...\n`);
          db.exec(`ALTER TABLE ${t} ADD COLUMN ${c} ${d}`);
        }
      } catch (err) {
        logStream.write(`[UPGRADE] Warning on ${t}.${c}: ${err.message}\n`);
      }
    });

    db.close();
    logStream.write(`[FOUNDATION] Database verified and fully upgraded.\n`);
  } catch (err) {
    logStream.write(`[FOUNDATION] ERROR: ${err.message}\n`);
  }
}

function startServer() {
  const appData = process.env.APPDATA || (process.platform === 'darwin' ? path.join(process.env.HOME || '', 'Library', 'Application Support') : path.join(process.env.HOME || '', '.config'));
  const folderName = 'awards-centre-pos';
  const userDataPath = path.join(appData, folderName);
  
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }

  const logStream = fs.createWriteStream(path.join(userDataPath, 'server.log'));
  const targetDbPath = path.join(userDataPath, 'jersey_stock.db');
  
  initializeDatabase(targetDbPath, logStream);

  const isDev = !app.isPackaged;
  let serverPath = isDev 
    ? path.join(__dirname, '../server.js')
    : path.join(process.resourcesPath, 'app/dist-server/index.js');

  serverProcess = spawn(process.execPath, [serverPath], {
    cwd: isDev ? path.dirname(serverPath) : path.join(process.resourcesPath, 'app'),
    env: { 
      ...process.env, 
      PORT: 3000, 
      NODE_ENV: isDev ? 'development' : 'production',
      ELECTRON_RUN_AS_NODE: '1', 
      DATABASE_PATH: targetDbPath 
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  serverProcess.stdout.on('data', (data) => logStream.write(`[STDOUT] ${data.toString()}`));
  serverProcess.stderr.on('data', (data) => logStream.write(`[STDERR] ${data.toString()}`));
}

function pollServer(callback) {
  const request = http.get(SERVER_URL, (res) => {
    if (res.statusCode === 200) callback();
    else setTimeout(() => pollServer(callback), 500);
  });
  request.on('error', () => setTimeout(() => pollServer(callback), 500));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200, height: 800,
    webPreferences: { nodeIntegration: true, contextIsolation: false },
    title: "Awards Centre POS",
    autoHideMenuBar: true,
    show: false,
    backgroundColor: '#0f172a'
  });
  mainWindow.loadURL(SERVER_URL);
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });
  mainWindow.on('closed', () => { mainWindow = null; });
}

app.on('ready', () => {
  startServer();
  pollServer(() => createWindow());
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (serverProcess) serverProcess.kill();
    app.quit();
  }
});
