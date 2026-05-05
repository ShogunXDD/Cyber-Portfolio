import React, { useState } from 'react';
import { Shield, User, Lock, ArrowRight } from 'lucide-react';
import MatrixRain from './MatrixRain';

export default function Login({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);
      formData.append('is_admin', isAdmin);

      const res = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Authentication failed');
      }

      if (isLogin) {
        onLogin(data);
      } else {
        setIsLogin(true);
        setError('Registration successful. Please login.');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <MatrixRain />
      <div className="app-container login-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="cyber-panel animate-in" style={{ width: '400px', maxWidth: '90%', background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(4px)', position: 'relative', zIndex: 10 }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Shield size={48} className="text-accent" style={{ margin: '0 auto 16px' }} />
          <h2>[ DEEP WEB SCRAPER ]</h2>
          <p className="text-muted">:: SYSTEM AUTHENTICATION REQUIRED ::</p>
        </div>

        <div className="tabs">
          <button 
            className={`tab ${!isAdmin ? 'active' : ''}`} 
            type="button"
            onClick={() => setIsAdmin(false)}
            style={{flex: 1}}
          >User</button>
          <button 
            className={`tab ${isAdmin ? 'active' : ''}`} 
            type="button"
            onClick={() => setIsAdmin(true)}
            style={{flex: 1}}
          >Admin</button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div style={{ color: error.includes('successful') ? '#4ade80' : 'var(--accent)', marginBottom: '16px', fontSize: '14px', textAlign: 'center' }}>{error}</div>}
          
          <div style={{ position: 'relative' }}>
            <User size={20} className="text-muted" style={{ position: 'absolute', top: '14px', left: '12px' }} />
            <input 
              type="text" 
              placeholder="Username" 
              style={{ paddingLeft: '40px' }} 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock size={20} className="text-muted" style={{ position: 'absolute', top: '14px', left: '12px' }} />
            <input 
              type="password" 
              placeholder="Password" 
              style={{ paddingLeft: '40px' }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            [ {isLogin ? 'INITIATE LOGIN' : 'ESTABLISH LINK'} ] <ArrowRight size={18} />
          </button>
        </form>

        {!isAdmin && (
          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <span className="text-muted" style={{ fontSize: '14px', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? "> NEW ID? REGISTER" : "> EXISTING ID? AUTHENTICATE"}
            </span>
          </div>
        )}
        </div>
      </div>
    </>
  );
}
