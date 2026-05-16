// FORCE ENV LOADING: In portable mode, we must load the bundled .env
const isPackaged = process.resourcesPath && !process.env.NEXT_RUNTIME;
if (isPackaged) {
  const path = require('path');
  const fs = require('fs');
  const envPath = path.join(process.resourcesPath, '.env');
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
    console.log('[SERVER] Loaded bundled .env from resources.');
  }
} else {
  // IDE MODE: Smart Discovery
  const path = require('path');
  const fs = require('fs');
  
  // Try local .env, then apps/desktop/.env, then root .env
  const possiblePaths = [
    path.join(process.cwd(), '.env'),
    path.join(process.cwd(), 'apps/desktop/.env'),
    path.join(__dirname, '.env'),
    path.join(__dirname, '../../.env')
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      require('dotenv').config({ path: p });
      if (process.env.SUPABASE_URL) {
        console.log(`[SERVER] Found keys at: ${p}`);
        break;
      }
    }
  }
}
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Enable TypeScript loading in DEV ONLY
if (process.env.NODE_ENV !== 'production' && !process.env.ELECTRON_RUN_AS_NODE) {
  try { require('tsx/register'); } catch (err) {}
}

// THE MASTER CONSTRUCTOR: Forces the database to match the schema exactly
async function ensureDatabaseHealth() {
  const isDev = process.env.NODE_ENV === 'development';
  const dbPath = process.env.DATABASE_PATH || path.join(process.env.APPDATA || process.env.HOME, 'awards-centre-pos', 'jersey_stock.db');
  
  console.log(`[HEALTH CHECK] Mode: ${isDev ? 'DEV' : 'PROD'} | DB: ${dbPath}`);
  
  try {
    const { prisma } = require('./src/lib/prisma');
    await prisma.user.count();
    console.log('[HEALTH CHECK] Database is healthy.');
  } catch (err) {
    console.log('[HEALTH CHECK] Database incomplete. Running Master Constructor...');
    
    try {
      // SMART PATH DETECTION:
      let prismaBinary;
      if (isDev) {
        // Try local node_modules first, then parent node_modules (monorepo root)
        const localPrisma = path.join(__dirname, 'node_modules/prisma/build/index.js');
        const rootPrisma = path.join(__dirname, '../../node_modules/prisma/build/index.js');
        prismaBinary = fs.existsSync(localPrisma) ? localPrisma : rootPrisma;
      } else {
        prismaBinary = path.join(process.resourcesPath, 'app/node_modules/prisma/build/index.js');
      }
        
      const schemaPath = isDev
        ? path.join(__dirname, 'prisma/schema.prisma')
        : path.join(process.resourcesPath, 'app/prisma/schema.prisma');
      
      console.log(`[CONSTRUCTOR] Using schema: ${schemaPath}`);
      
      execSync(`node "${prismaBinary}" db push --schema="${schemaPath}" --accept-data-loss`, {
        env: { ...process.env, DATABASE_URL: `file:${dbPath}` },
        stdio: 'inherit'
      });
      
      console.log('[CONSTRUCTOR] Database repaired and synchronized.');
    } catch (repairErr) {
      console.error('[CONSTRUCTOR] FATAL: Could not repair database.', repairErr.message);
    }
  }
}

const dev = process.env.NODE_ENV !== 'production';
const hostname = '127.0.0.1';
const port = parseInt(process.env.PORT || '3000', 10);
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  await ensureDatabaseHealth();

  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new Server(server, { cors: { origin: "*" } });
  io.on('connection', (socket) => {
    socket.on('new-sale', (data) => io.emit('sale-updated', data));
  });

  server.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    try {
      console.log('[SYNC] Activating Cloud Sync Worker...');
      // Use absolute path and try multiple extensions for dev/prod flexibility
      const servicePath = path.join(__dirname, 'src/lib/services/cloudSyncService');
      const { cloudSyncService } = require(servicePath);
      cloudSyncService.startWorker();
    } catch (err) {
      console.error('[SYNC] Failed to start worker:', err.message);
    }
  });
});
