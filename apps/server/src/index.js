const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const os = require('os');
require('dotenv').config();

const logFile = path.join(os.homedir(), 'Desktop', 'ServerCrashLog.txt');
process.on('uncaughtException', (err) => {
  try { fs.appendFileSync(logFile, `\n[FATAL ERROR] ${new Date().toISOString()}\n${err.message}\n${err.stack}\n`); } catch(e){}
  process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
  try { fs.appendFileSync(logFile, `\n[UNHANDLED REJECTION] ${new Date().toISOString()}\n${reason}\n`); } catch(e){}
});

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ limit: '2mb', extended: true }));

// Socket.io connection
io.on('connection', (socket) => {
  console.log('A client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Attach io to request for use in routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
const productRoutes = require('./routes/productRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const salesRoutes = require('./routes/salesRoutes');
const syncRoutes = require('./routes/syncRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const customerRoutes = require('./routes/customerRoutes');

app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/customers', customerRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running on port ${PORT}`);
  const cloudSyncService = require('./services/cloudSyncService');
  cloudSyncService.startWorker();
});
