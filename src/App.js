import React, { useState } from 'react';
import './App.css';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

function App() {
  // Application routing simulated through reactive user profile context tracking state
  const [sessionUser, setSessionUser] = useState(null);

  const handleLogin = (authenticatedUser) => {
    setSessionUser(authenticatedUser);
  };

  const handleLogout = () => {
    setSessionUser(null);
  };

  return (
    <div className="App">
      {sessionUser == null ? (
        <Login onLoginSuccess={handleLogin} />
      ) : (
        <Dashboard user={sessionUser} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;