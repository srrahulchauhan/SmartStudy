import React, { useState } from 'react';
import { User, Mail, Lock, AlertCircle, Sparkles } from 'lucide-react';
import { auth, createUserWithEmailAndPassword } from '../../firebase';
import './styles.css';

const Register = ({ onToggleMode, onRegisterSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }
    setError('');
    return true;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('User registered:', userCredential.user);
      if (onRegisterSuccess) onRegisterSuccess(userCredential.user);
    } catch (err) {
      setError('Registration failed. This email might already be in use.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-bg-orb-1"></div>
      <div className="auth-bg-orb-2"></div>

      <div className="auth-glass-card">
        <div className="auth-header">
          <div className="auth-logo-icon">
            <Sparkles size={32} />
          </div>
          <h2>Join the Elite</h2>
          <p>Create your profile to start tracking.</p>
        </div>

        {error && (
          <div className="general-error">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleRegister}>
          <div className="input-group">
            <label htmlFor="name">FULL NAME</label>
            <div className="input-wrapper">
              <User className="input-icon" />
              <input
                id="name"
                type="text"
                className={`auth-input ${error && !name ? 'error' : ''}`}
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="register-email">EMAIL ADDRESS</label>
            <div className="input-wrapper">
              <Mail className="input-icon" />
              <input
                id="register-email"
                type="email"
                className={`auth-input ${error && !email ? 'error' : ''}`}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="register-password">PASSWORD</label>
            <div className="input-wrapper">
              <Lock className="input-icon" />
              <input
                id="register-password"
                type="password"
                className={`auth-input ${error && (!password || password.length < 6) ? 'error' : ''}`}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="confirm-password">CONFIRM PASSWORD</label>
            <div className="input-wrapper">
              <Lock className="input-icon" />
              <input
                id="confirm-password"
                type="password"
                className={`auth-input ${error && password !== confirmPassword ? 'error' : ''}`}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="primary-btn" 
            disabled={isLoading}
          >
            {isLoading ? <div className="spinner" /> : 'Create Profile'}
          </button>
        </form>

        <div className="auth-footer">
          Already a member? 
          <button type="button" className="auth-link" onClick={() => onToggleMode('login')}>
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;
