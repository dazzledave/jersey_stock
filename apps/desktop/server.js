// No-op for env in production to prevent conflicts
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
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
  const isProd = process.env.NODE_ENV === 'production' || process.env.ELECTRON_RUN_AS_NODE;
  if (!isProd) return;

  const dbPath = process.env.DATABASE_PATH;
  console.log(`[HEALTH CHECK] Verifying database at: ${dbPath}`);
  
  try {
    const { prisma } = require('./src/lib/prisma');
    // Test the database
    await prisma.user.count();
    console.log('[HEALTH CHECK] Database is healthy.');
  } catch (err) {
    console.log('[HEALTH CHECK] Database incomplete. Running Master Constructor...');
    
    try {
      // Find the Prisma CLI inside the packaged app
      const prismaBinary = path.join(process.resourcesPath, 'app/node_modules/prisma/build/index.js');
      const schemaPath = path.join(process.resourcesPath, 'app/prisma/schema.prisma');
      
      console.log(`[CONSTRUCTOR] Using schema: ${schemaPath}`);
      
      // Force the schema onto the database
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
const hostname = 'localhost';
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

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    try {
      const { cloudSyncService } = require('./src/lib/services/cloudSyncService');
      if (cloudSyncService?.startWorker) cloudSyncService.startWorker();
    } catch (err) {}
  });
});
