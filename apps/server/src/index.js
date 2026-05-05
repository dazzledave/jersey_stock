const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

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

app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
