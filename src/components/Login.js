import React, { useState } from 'react';

function Login({ onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false); // Toggle state between Login and Sign Up
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Determine target URL based on whether we are signing in or signing up
    const endpoint = isSignUp ? '/api/users/signup' : '/api/users/login';
    
    const payload = {
      username: username.trim(),
      passwordHash: password // Passing plain password to match existing baseline validation
    };

    fetch(`http://localhost:8080${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then((res) => {
      if (!res.ok) {
        return res.text().then(text => { throw new Error(text) });
      }
      return res.json();
    })
    .then((userProfile) => {
      if (isSignUp) {
        setSuccessMessage("Account created successfully! You can now log in.");
        setIsSignUp(false); // Switch back to login view automatically
        setPassword('');
      } else {
        onLoginSuccess(userProfile); // Log the user into the main dashboard panel
      }
    })
    .catch((err) => {
      setErrorMessage(err.message || "Connection failed. Is the backend running?");
    });
  };

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '24px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff' }}>
      <h2 style={{ textAlign: 'center', color: '#1e3a8a', marginBottom: '20px' }}>
        {isSignUp ? 'Create ShieldWall Account' : 'ShieldWall Command Portal'}
      </h2>

      {errorMessage && <p style={{ color: '#ef4444', fontSize: '13px', background: '#fef2f2', padding: '8px', borderRadius: '4px' }}>{errorMessage}</p>}
      {successMessage && <p style={{ color: '#10b981', fontSize: '13px', background: '#ecfdf5', padding: '8px', borderRadius: '4px' }}>{successMessage}</p>}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 'bold' }}>Username</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="Enter username..." />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 'bold' }}>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Enter password..." />
        </div>

        <button type="submit" style={{ width: '100%', background: '#1e3a8a', color: 'white', padding: '10px', borderRadius: '6px', cursor: 'pointer' }}>
          {isSignUp ? 'Sign Up' : 'Log In'}
        </button>
      </form>

      {/* Switch Link Toggle Option */}
      <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: '#64748b' }}>
        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
        <span 
          onClick={() => { setIsSignUp(!isSignUp); setErrorMessage(''); setSuccessMessage(''); }} 
          style={{ color: '#2563eb', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}
        >
          {isSignUp ? 'Log In here' : 'Sign Up here'}
        </span>
      </p>
    </div>
  );
}

export default Login;