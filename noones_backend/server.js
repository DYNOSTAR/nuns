const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

// Import routes
const captureRoutes = require('./routes/capture');
const adminRoutes = require('./routes/admin');

const app = express();

// Middleware - FIX CORS for Vercel
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.FRONTEND_URL, // e.g. https://noones-frontend.onrender.com
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // allow server-to-server / curl requests (no origin)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS: ' + origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('*', cors());


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize data file if it doesn't exist
const dataFile = path.join(dataDir, 'capturedData.json');
if (!fs.existsSync(dataFile)) {
  fs.writeFileSync(dataFile, JSON.stringify([], null, 2));
}

// Initialize global storage
global.capturedData = [];

// Load existing data from file
try {
  const existingData = fs.readFileSync(dataFile, 'utf8');
  global.capturedData = JSON.parse(existingData);
  console.log(`📂 Loaded ${global.capturedData.length} existing records`);
} catch (error) {
  console.log('No existing data file, starting fresh');
}

// Routes
app.use('/api/capture', captureRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'NoOnes Backend API',
    records: global.capturedData.length
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'NoOnes Backend API',
    version: '1.0.0',
    endpoints: {
      capture: 'POST /api/capture',
      admin_data: 'GET /api/admin/data',
      admin_stats: 'GET /api/admin/stats',
      health: 'GET /health'
    }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ NoOnes Backend running on port ${PORT}`);
  console.log(`📁 Data directory: ${dataDir}`);
  console.log(`📊 Current records: ${global.capturedData.length}`);
  console.log(`🌐 CORS enabled for Vercel deployments`);
});
