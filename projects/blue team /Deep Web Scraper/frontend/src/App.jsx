import React, { useState, useEffect } from 'react'
import Login from './components/Login'
import Dashboard from './components/Dashboard'

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('bt_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('bt_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('bt_user');
  };

  if (!user) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <>
      <Dashboard user={user} onLogout={handleLogout} />
      <div style={{
        position: 'fixed',
        bottom: '10px',
        right: '20px',
        fontSize: '11px',
        color: 'var(--accent)',
        opacity: 0.6,
        zIndex: 9999,
        fontFamily: '"Fira Code", monospace',
        textAlign: 'right',
        background: 'var(--panel-bg)',
        padding: '6px 12px',
        borderRadius: '4px',
        border: '1px solid var(--accent)',
        boxShadow: '0 0 10px rgba(0, 255, 65, 0.1)'
      }}>
        <strong>Write to: </strong> <a href="https://instagram.com/imaayush39" target="_blank" rel="noreferrer" style={{color: 'inherit', textDecoration: 'none'}}>imaayush39</a> | <a href="https://github.com/phantomx39" target="_blank" rel="noreferrer" style={{color: 'inherit', textDecoration: 'none'}}>phantomx39</a> | <a href="mailto:itzaayush2005@gmail.com" style={{color: 'inherit', textDecoration: 'none'}}>itzaayush2005@gmail.com</a>
      </div>
    </>
  )
}

export default App
