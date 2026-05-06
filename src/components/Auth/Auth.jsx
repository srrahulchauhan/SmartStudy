import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';

const Auth = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState('login'); // 'login' or 'register'

  const handleToggleMode = (newMode) => {
    setMode(newMode);
  };

  if (mode === 'login') {
    return <Login onToggleMode={handleToggleMode} onLoginSuccess={onAuthSuccess} />;
  }

  return <Register onToggleMode={handleToggleMode} onRegisterSuccess={onAuthSuccess} />;
};

export default Auth;
