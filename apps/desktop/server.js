require('dotenv').config();
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

// Enable TypeScript loading in production for background services
if (process.env.NODE_ENV === 'production' || process.env.ELECTRON_RUN_AS_NODE) {
  try {
    require('tsx/register');
    console.log('[SERVER] TypeScript registration successful.');
  } catch (err) {
    console.error('[SERVER] Failed to register TS loader:', err.message);
  }
}

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Attach socket.io
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('A client connected:', socket.id);
    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  // Make io available globally so Next.js API routes can access it if needed
  global.io = io;

  server.once('error', (err) => {
    console.error(err);
    process.exit(1);
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    
    // Start background sync worker
    try {
      const isDev = process.env.NODE_ENV !== 'production';
      // In production, we need to handle the fact that we might not have a TS loader
      const workerPath = isDev 
        ? './src/lib/services/cloudSyncService' 
        : './src/lib/services/cloudSyncService'; // We'll ensure this is accessible
        
      const { cloudSyncService } = require(workerPath);
      if (cloudSyncService && cloudSyncService.startWorker) {
        cloudSyncService.startWorker();
        console.log('[SERVER] Background sync worker started.');
      }
    } catch (err) {
      console.error('Failed to start sync worker:', err.message);
    }
  });
});
