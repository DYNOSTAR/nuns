const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

// Import routes
const captureRoutes = require('./routes/capture');
const adminRoutes = require('./routes/admin');

const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',  // Local development
    'https://noones.vercel.app', // Your Vercel frontend
    'https://noones-*.vercel.app' // All Vercel preview deployments
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
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

// Routes
app.use('/api/capture', captureRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint (CRITICAL for Render)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'NoOnes Backend API'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'NoOnes Backend API',
    version: '1.0.0',
    endpoints: {
      capture: '/api/capture',
      admin: '/api/admin',
      health: '/health'
    }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ NoOnes Backend running on port ${PORT}`);
  console.log(`📁 Data directory: ${dataDir}`);
  console.log(`🌐 CORS enabled for frontend deployment`);
});