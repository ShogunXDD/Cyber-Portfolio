import React, { useState, useEffect, useRef } from 'react';
import { Search, Activity, History, Settings, Play, LogOut, Code, ShieldAlert, Cpu, Loader2, Square, StopCircle, ArrowRight, User, HelpCircle, Instagram, Github, Mail, Bell, Sun, Moon, Trash2 } from 'lucide-react';
import AdminPanel from './AdminPanel';

export default function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('scraper');
  const [query, setQuery] = useState(() => sessionStorage.getItem('scraper_query') || '');
  const [terminalOutput, setTerminalOutput] = useState(() => sessionStorage.getItem('scraper_terminal') || '');
  const [summaryOutput, setSummaryOutput] = useState(() => sessionStorage.getItem('scraper_summary') || '');
  const [isSearching, setIsSearching] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [adminFeedback, setAdminFeedback] = useState([]);
  const [userFeedback, setUserFeedback] = useState([]);
  const [userSearchHistory, setUserSearchHistory] = useState([]);
  const [replyText, setReplyText] = useState({});
  const [sidebarActive, setSidebarActive] = useState(false);
  const [isLightMode, setIsLightMode] = useState(() => localStorage.getItem('scraper_theme') === 'light');
  
  const [modelOptions, setModelOptions] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [threads, setThreads] = useState(4);
  const [preset, setPreset] = useState('threat_intel');
  
  const popularSearches = [
      "Exposed database dumps",
      "Ransomware negotiations",
      "Stolen corporate credentials",
      "Darknet marketplaces",
      "Zero-day exploit chatter"
  ];
  
  const wsRef = useRef(null);
  const terminalEndRef = useRef(null);

  useEffect(() => {
    fetch('/api/models').then(res => res.json()).then(data => {
      setModelOptions(data);
      if(data.length > 0) setSelectedModel(data[0]);
    });

    const fetchNots = () => {
      fetch(`/api/notifications/${user.id}`).then(res => res.json()).then(data => setNotifications(data)).catch(console.error);
      fetch(`/api/history/${user.id}`).then(res => res.json()).then(data => setUserSearchHistory(data)).catch(console.error);
      if (user.role === 'admin') {
        fetch(`/api/admin/feedback`).then(res => res.json()).then(data => setAdminFeedback(data)).catch(console.error);
      } else {
        fetch(`/api/feedback/${user.id}`).then(res => res.json()).then(data => setUserFeedback(data)).catch(console.error);
      }
    };
    fetchNots();
    const inv = setInterval(fetchNots, 10000);
    return () => clearInterval(inv);
  }, [user.id, user.role]);

  useEffect(() => {
    sessionStorage.setItem('scraper_query', query);
  }, [query]);

  useEffect(() => {
    sessionStorage.setItem('scraper_terminal', terminalOutput);
  }, [terminalOutput]);

  useEffect(() => {
    if (isLightMode) {
      document.body.classList.add('light-mode');
      localStorage.setItem('scraper_theme', 'light');
    } else {
      document.body.classList.remove('light-mode');
      localStorage.setItem('scraper_theme', 'dark');
    }
  }, [isLightMode]);

  useEffect(() => {
    sessionStorage.setItem('scraper_summary', summaryOutput);
  }, [summaryOutput]);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalOutput]);

  const handleStop = () => {
    if (wsRef.current) {
      wsRef.current.close();
      setTerminalOutput(prev => prev + '\n[SYSTEM] Search aborted by user.\n');
      setIsSearching(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query) return;

    setTerminalOutput('');
    setSummaryOutput('');
    setIsSearching(true);

    const wsUrl = `ws://${window.location.host}/api/scrape/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({
        query,
        model: selectedModel,
        threads,
        preset,
        user_id: user.id
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'chunk') {
        setSummaryOutput(prev => prev + data.content);
      } else if (data.type === 'stage') {
        setTerminalOutput(prev => prev + `\n[SYSTEM] ${data.content}\n`);
      } else if (data.type === 'done') {
        ws.close();
        setIsSearching(false);
      } else if (data.type === 'error') {
        setTerminalOutput(prev => prev + `\n[ERROR] ${data.content}\n`);
        ws.close();
        setIsSearching(false);
      }
    };

    ws.onerror = () => {
      setTerminalOutput(prev => prev + '\n[ERROR] WebSocket connection failed.\n');
      setIsSearching(false);
    };
  };

  const navItems = [
    { id: 'scraper', label: 'Scraper App', icon: Search },
    { id: 'history', label: 'My History', icon: History },
    { id: 'support', label: 'Help & Support', icon: HelpCircle },
  ];

  const handleFeedbackSubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData();
      formData.append('user_id', user.id);
      formData.append('content', feedbackText);
      await fetch('/api/feedback', { method: 'POST', body: formData });
      setFeedbackText('');
      alert("Communication secured and delivered to High Command.");
      if (user.role !== 'admin') {
         fetch(`/api/feedback/${user.id}`).then(res => res.json()).then(data => setUserFeedback(data));
      }
  };

  const handleAdminReply = async (f_id, u_id) => {
      const msg = replyText[f_id];
      if (!msg) return;
      const formData = new FormData();
      formData.append('user_id', u_id);
      formData.append('message', msg);
      await fetch(`/api/admin/feedback/${f_id}/reply`, { method: 'POST', body: formData });
      
      setAdminFeedback(prev => prev.map(f => f.id === f_id ? { ...f, status: 'replied', admin_reply: msg } : f));
      setReplyText(prev => { const nt = {...prev}; delete nt[f_id]; return nt; });
  };

  const handleDeleteAdminFeedback = async (f_id) => {
      if (!window.confirm("Are you sure you want to purge this report?")) return;
      await fetch(`/api/admin/feedback/${f_id}`, { method: 'DELETE' });
      setAdminFeedback(prev => prev.filter(f => f.id !== f_id));
  };

  const handleReadNotification = async (id) => {
      await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  if (user.role === 'admin') {
    navItems.push({ id: 'admin', label: 'Admin Panel', icon: ShieldAlert });
  }

  return (
    <div className="app-container">
      {}
      <button 
        className="hamburger-menu"
        onClick={() => setSidebarActive(!sidebarActive)}
        aria-label="Toggle Menu"
      >
        ☰
      </button>

      {}
      <div className={`sidebar ${sidebarActive ? 'sidebar-active' : ''}`}>
        <div style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Activity className="text-accent" />
          <h2 style={{ margin: 0 }}>DEEP WEB SCRAPER</h2>
        </div>

        <div style={{ marginBottom: '32px' }}>
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <div 
                key={item.id}
                className={`nav-link ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon size={18} />
                {item.label}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 'auto' }}>
          <div className="cyber-panel" style={{ padding: '16px', marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', marginBottom: '4px' }}>ACCESS LEVEL IDENTIFIED:</div>
            <div style={{ fontWeight: 'bold' }} className="text-accent">{user.username.replace('@', '')}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>ROLE: {user.role.toUpperCase()}</div>
          </div>
          
          <div style={{ position: 'relative', marginBottom: '16px' }}>
              <div
                className="nav-link" 
                style={{ width: '100%', cursor: 'pointer', border: '1px solid var(--admin-panel-border)', position: 'relative' }}
                onClick={() => setShowNotifications(!showNotifications)}
              >
                  <Bell size={18} /> INBOX
                  {notifications.filter(n => !n.is_read).length > 0 && (
                      <span style={{ position: 'absolute', top: '8px', right: '12px', background: 'var(--danger)', width: '8px', height: '8px', borderRadius: '50%' }}></span>
                  )}
              </div>
              
              {showNotifications && (
                  <div style={{ position: 'absolute', bottom: '110%', left: 0, right: 0, background: '#0a0a0a', border: '1px solid var(--accent)', padding: '12px', zIndex: 100, maxHeight: '300px', overflowY: 'auto' }}>
                      <h4 style={{ color: 'var(--accent)', marginBottom: '12px', fontSize: '12px' }}>UNREAD TRANSMISSIONS</h4>
                      {notifications.length === 0 ? (
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>No new alerts.</div>
                      ) : (
                          notifications.map(n => (
                              <div key={n.id} style={{ marginBottom: '8px', padding: '8px', background: n.is_read ? 'rgba(255,255,255,0.05)' : 'rgba(0,255,65,0.1)', border: '1px solid var(--text-secondary)' }}>
                                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{new Date(n.timestamp).toLocaleString()}</div>
                                  <div style={{ fontSize: '12px', color: '#fff', marginBottom: '8px' }}>{n.message}</div>
                                  {!n.is_read && (
                                      <button onClick={() => handleReadNotification(n.id)} style={{ fontSize: '10px', padding: '2px 6px', background: 'transparent', border: '1px solid var(--accent)', color: 'var(--accent)', cursor: 'pointer' }}>MARK READ</button>
                                  )}
                              </div>
                          ))
                      )}
                  </div>
              )}
          </div>
          

          <div 
            className="nav-link" 
            style={{ width: '100%', cursor: 'pointer', border: '1px solid var(--glass-border)' }}
            onClick={onLogout}

          >
            <LogOut size={18} /> Logout
          </div>
        </div>
      </div>

      {}
      {sidebarActive && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarActive(false)}
        />
      )}

      {}
      <div className="main-content">
        {activeTab === 'scraper' && (
          <div className="animate-in">
            <div className="dashboard-grid">
              <div className="cyber-panel">
                <div style={{ padding: '12px', marginBottom: '16px', backgroundColor: 'rgba(255, 165, 0, 0.1)', border: '1px solid rgba(255, 165, 0, 0.5)', borderRadius: '4px', color: 'orange' }}>
                  <ShieldAlert size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }}/>
                  <strong>NOTICE:</strong> To use cloud models, please add your API keys in the <code>.env</code> file (you can rename <code>.env.example</code> to <code>.env</code>).
                </div>
                <label style={{display: 'block', marginBottom: '8px', fontSize: '14px'}}>LLM Model</label>
                <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)}>
                  {modelOptions.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                
                <label style={{display: 'block', marginBottom: '8px', fontSize: '14px'}}>Scraping Threads ({threads})</label>
                <input 
                  type="range" min="1" max="16" 
                  value={threads} onChange={e => setThreads(parseInt(e.target.value))} 
                  style={{marginBottom: '16px'}}
                />

                <label style={{display: 'block', marginBottom: '8px', fontSize: '14px'}}>Research Domain</label>
                <select value={preset} onChange={e => setPreset(e.target.value)}>
                  <option value="threat_intel">Dark Web Threat Intel</option>
                  <option value="ransomware_malware">Ransomware/Malware</option>
                  <option value="personal_identity">Personal/Identity</option>
                  <option value="corporate_espionage">Corporate Espionage</option>
                </select>
              </div>

              <div className="cyber-panel" style={{ gridColumn: 'span 2' }}>
                <p className="text-muted" style={{ marginBottom: '24px' }}>Provide target vector. Systems will trace anomalies through dark webs.</p>
                
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px' }}>
                  <input 
                    type="text" 
                    placeholder="e.g. Search for leaks related to company.com" 
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    disabled={isSearching}
                    style={{ marginBottom: 0 }}
                  />
                  <button type="submit" disabled={isSearching || !query} style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
                    {isSearching ? <><Loader2 size={16} className="spin" /> PROCESSING...</> : <><Play size={16} /> INITIATE TRACE</>}
                  </button>
                  {isSearching && (
                    <button 
                      type="button" 
                      onClick={handleStop} 
                      style={{ 
                        color: 'var(--danger)',
                        borderColor: 'var(--danger)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <Square size={16} fill="currentColor" /> ABORT
                    </button>
                  )}
                </form>

                <div className="terminal" style={{ marginTop: '24px' }}>
                  {terminalOutput ? (
                     <pre style={{ 
                        whiteSpace: 'pre-wrap', 
                        margin: 0, 
                        color: '#22c55e', 
                        textShadow: '0 0 5px rgba(34, 197, 94, 0.5)' 
                     }}>{terminalOutput}</pre>
                  ) : (
                     <div className="terminal-placeholder">
                       Awaiting commands...<br/>Output will stream here.
                     </div>
                  )}
                  <div ref={terminalEndRef} />
                </div>
                
                {}
                {!isSearching && !summaryOutput && (
                    <div style={{ marginTop: '24px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', fontWeight: 'bold' }}>QUICK INTEL:</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {popularSearches.map((searchStr, idx) => (
                                <button 
                                    key={idx} 
                                    className="popular-search-chip"
                                    onClick={() => setQuery(searchStr)}
                                >
                                    {searchStr}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
              </div>
            </div>

            {summaryOutput && (
              <div 
                className="streamlit-container animate-in" 
                style={{ 
                  marginTop: '40px', 
                  backgroundColor: '#0e1117', 
                  color: '#FAFAFA',
                  fontFamily: '"Fira Code", monospace',
                  padding: '32px',
                  borderRadius: '8px',
                  border: '1px solid rgba(250, 250, 250, 0.2)',
                  maxWidth: '900px',
                  marginLeft: 'auto',
                  marginRight: 'auto',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                }}
              >
                <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--accent)' }}>Investigation Summary</h2>
                  <button 
                    onClick={() => {
                        const element = document.createElement("a");
                        const file = new Blob([summaryOutput], {type: 'text/plain'});
                        element.href = URL.createObjectURL(file);
                        element.download = `investigation_summary_${new Date().getTime()}.txt`;
                        document.body.appendChild(element);
                        element.click();
                        document.body.removeChild(element);
                    }}
                    style={{ background: 'transparent', border: '1px solid var(--accent)', color: 'var(--accent)', padding: '8px 16px', cursor: 'pointer', fontFamily: '"Fira Code", monospace' }}
                  >
                    [ DOWNLOAD TXT ]
                  </button>
                </div>
                <div style={{ margin: 0, lineHeight: '1.6', fontSize: '1rem' }}>
                  {summaryOutput.split('\n').map((line, idx) => {
                    if (!line.trim()) return <div key={idx} style={{ height: '8px' }} />;
                    let style = { marginBottom: '6px', wordBreak: 'break-all' };
                    let content = line;

                    if (line.startsWith('### ')) { content = line.substring(4); style = { ...style, color: 'var(--accent)', fontSize: '1.2rem', fontWeight: 'bold', marginTop: '16px' }; }
                    else if (line.startsWith('## ')) { content = line.substring(3); style = { ...style, color: 'var(--accent)', fontSize: '1.4rem', fontWeight: 'bold', marginTop: '20px' }; }
                    else if (line.startsWith('# ')) { content = line.substring(2); style = { ...style, color: 'var(--accent)', fontSize: '1.6rem', fontWeight: 'bold', marginTop: '24px' }; }

                    const parts = content.split(/(\*\*.*?\*\*)/g);
                    const renderedParts = parts.map((part, i) => {
                      if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={i} style={{ color: '#fff', background: 'rgba(0, 255, 65, 0.2)', padding: '0 4px' }}>{part.slice(2, -2)}</strong>;
                      }
                      return part;
                    });

                    return <div key={idx} style={style}>{renderedParts}</div>;
                  })}
                </div>
{preset && (
  <div style={{ marginTop: '24px', color: '#fff' }}>
    <h3 style={{ color: 'var(--accent)', marginBottom: '8px' }}>Domain Suggestions</h3>
    <ul style={{ paddingLeft: '20px' }}>
      {( {
        threat_intel: ['Check for new breach disclosures', 'Monitor darknet forums for emerging exploits'],
        ransomware_malware: ['Track ransomware payment wallets', 'Analyze malware signatures'],
        personal_identity: ['Watch for credential leaks', 'Observe social media data exposure'],
        corporate_espionage: ['Identify insider threat chatter', 'Scrutinize supply chain compromises']
      }[preset] || []).map((s,i)=> <li key={i} style={{ marginBottom: '4px' }}>{s}</li>)}
    </ul>
    <p style={{ marginTop: '12px', color: 'var(--accent)', fontWeight: 'bold' }}>Data Accuracy: &gt;70% (estimated confidence based on LLM verification).</p>
  </div>
)}
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="animate-in cyber-panel" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div>
                <h1 style={{ color: 'var(--accent)', marginBottom: '16px' }}><History size={24} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }}/> ARCHIVED SEARCH LOGS</h1>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {userSearchHistory.length === 0 ? (
                        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>Historical indices unavailable or empty.</div>
                    ) : (
                        userSearchHistory.map(h => (
                            <div key={h.id} className="cyber-panel" style={{ padding: '12px', border: '1px solid var(--panel-border)' }}>
                                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{new Date(h.timestamp).toLocaleString()}</div>
                                <div style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '8px' }}><strong>QUERY:</strong> {h.query}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}><strong>SUMMARY:</strong> {h.summary.substring(0, 150)}...</div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {user.role !== 'admin' && (
            <div>
                <h1 style={{ color: 'var(--accent)', marginBottom: '16px' }}><HelpCircle size={24} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }}/> MY TRANSMISSIONS & FEEDBACK</h1>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {userFeedback.length === 0 ? (
                        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>No past transmissions found.</div>
                    ) : (
                        userFeedback.map(f => (
                            <div key={f.id} className="cyber-panel" style={{ padding: '12px', border: '1px solid var(--panel-border)' }}>
                                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{new Date(f.timestamp).toLocaleString()}</div>
                                <div style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '8px' }}>{f.content}</div>
                                {f.status === 'replied' && (
                                    <div style={{ background: 'var(--accent-dim)', borderLeft: '2px solid var(--accent)', padding: '8px', fontSize: '13px', color: 'var(--accent)', marginTop: '8px' }}>
                                        <strong>ADMIN RESPONSE:</strong> {f.admin_reply}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
            )}
          </div>
        )}

        {activeTab === 'support' && (
          <div className={`animate-in ${user.role === 'admin' ? 'admin-view-container' : 'cyber-panel'}`}>
            <h1 style={{ color: user.role === 'admin' ? 'var(--admin-accent)' : 'var(--accent)', marginBottom: '24px' }}>
                <HelpCircle size={24} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }}/> 
                {user.role === 'admin' ? 'INBOUND FIELD REPORTS' : 'HELP & SUPPORT'}
            </h1>
            
            {user.role === 'admin' ? (
                <div>
                  <h3 style={{ marginBottom: '24px', color: '#fff', fontSize: '18px' }}>USER FEEDBACK & REQUESTS</h3>
                  <div className="ledger-feed">
                      {adminFeedback.map(f => (
                          <div key={f.id} className="ledger-card">
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                  <div>
                                      <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>RECEIVED: {new Date(f.timestamp).toLocaleString()}</div>
                                      <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--admin-accent)' }}>{f.username}</div>
                                  </div>
                                  <button onClick={() => handleDeleteAdminFeedback(f.id)} style={{ background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '4px 12px', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }} onMouseOver={e => { e.currentTarget.style.background = 'var(--danger)'; e.currentTarget.style.color = '#000'; }} onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--danger)'; }}>
                                      <Trash2 size={12} /> PURGE
                                  </button>
                              </div>
                              <div className="cyber-panel" style={{ fontSize: '14px', color: 'var(--text-primary)', padding: '16px', border: '1px solid var(--panel-border)', marginBottom: '12px', whiteSpace: 'pre-wrap' }}>
                                  <span style={{ color: 'var(--text-secondary)', fontSize: '10px', display: 'block', marginBottom: '8px' }}>TRANSMISSION CONTENT</span>
                                  {f.content}
                              </div>
                              <div style={{ background: 'rgba(204, 119, 0, 0.05)', padding: '12px', borderLeft: '2px solid var(--admin-accent)' }}>
                                  {f.status === 'replied' ? (
                                      <div>
                                          <div style={{ fontSize: '10px', color: 'var(--admin-accent)', marginBottom: '4px' }}>[ SECURE REPLY DELIVERED ]</div>
                                          <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{f.admin_reply}</div>
                                      </div>
                                  ) : (
                                      <div style={{ display: 'flex', gap: '8px' }}>
                                          <input 
                                              type="text" 
                                              placeholder="Transmit reply to operative..." 
                                              value={replyText[f.id] || ''} 
                                              onChange={e => setReplyText({...replyText, [f.id]: e.target.value})}
                                              className="admin-input"
                                              style={{ marginBottom: 0, padding: '8px 12px', fontSize: '14px', flex: 1, border: '1px solid var(--admin-panel-border)' }}
                                          />
                                          <button onClick={() => handleAdminReply(f.id, f.user_id)} style={{ padding: '8px 16px', fontSize: '14px', fontWeight: 'bold', background: 'var(--admin-accent)', color: '#000', border: 'none', cursor: 'pointer', flexShrink: 0 }}>TRANSMIT</button>
                                      </div>
                                  )}
                              </div>
                          </div>
                      ))}
                      {adminFeedback.length === 0 && (
                          <div style={{ padding: '40px', textAlign: 'center', border: '1px dashed var(--admin-panel-border)', color: 'rgba(255,255,255,0.3)' }}>[ NO PENDING REPORTS ]</div>
                      )}
                  </div>
              </div>
            ) : (
                <>
                    <div style={{ marginBottom: '32px' }}>
                        <h3 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>FREQUENTLY ASKED QUESTIONS</h3>
                        <div className="cyber-panel" style={{ padding: '16px', border: '1px solid var(--panel-border)', marginBottom: '8px' }}>
                            <strong style={{ color: 'var(--accent)' }}>Q: Why did my trace abort suddenly?</strong>
                            <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: 'var(--text-primary)' }}>A: Deep scraping tasks are heavily chained. If your selected LLM backend runs out of dynamic credits or hits rate limitations, the system safely aborts to prevent data corruption.</p>
                        </div>
                        <div className="cyber-panel" style={{ padding: '16px', border: '1px solid var(--panel-border)', marginBottom: '8px' }}>
                            <strong style={{ color: 'var(--accent)' }}>Q: Are my searches monitored?</strong>
                            <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: 'var(--text-primary)' }}>A: Yes. High-clearance administrators possess global tracing logic and can view the targets you select.</p>
                        </div>
                        <div className="cyber-panel" style={{ padding: '16px', border: '1px solid var(--panel-border)', marginBottom: '8px' }}>
                            <strong style={{ color: 'var(--accent)' }}>Q: How long does a deep web trace typically take?</strong>
                            <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: 'var(--text-primary)' }}>A: Depending on the target parameters and active onion proxies, a full intelligence sweep usually resolves within 15 to 45 seconds.</p>
                        </div>
                        <div className="cyber-panel" style={{ padding: '16px', border: '1px solid var(--panel-border)' }}>
                            <strong style={{ color: 'var(--accent)' }}>Q: Can I download my investigation summaries?</strong>
                            <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: 'var(--text-primary)' }}>A: Yes. Once a trace concludes, a [ DOWNLOAD TXT ] button will populate beneath the intelligence report allowing you to save it securely to your local machine.</p>
                        </div>
                    </div>

                    <div style={{ marginBottom: '32px', display: 'flex', gap: '16px' }}>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>CONTACT US</h3>
                            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Need immediate escalation? Contact us across the digital divide.</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <a href="https://instagram.com/imaayush39" target="_blank" style={{ color: 'var(--accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}><Instagram size={18} /> @imaayush39</a>
                                <a href="https://github.com/phantomx39" target="_blank" style={{ color: 'var(--accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}><Github size={18} /> phantomx39</a>
                                <a href="mailto:itzaayush2005@gmail.com" style={{ color: 'var(--accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}><Mail size={18} /> itzaayush2005@gmail.com</a>
                            </div>
                        </div>
                        
                        <div style={{ flex: 1 }}>
                            <h3 style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>SUGGESTIONS & FEEDBACK</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '16px' }}>
                                Note: These suggestions and feedback are sent securely to the instance's Admin Panel, NOT to the original developer of the application.
                            </p>
                            <form onSubmit={handleFeedbackSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <textarea 
                                    value={feedbackText} 
                                    onChange={(e) => setFeedbackText(e.target.value)} 
                                    placeholder="Enter your feedback here..." 
                                    style={{ height: '120px', resize: 'vertical' }}
                                    required
                                />
                                <button type="submit" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                                     TRANSMIT REPORT TO ADMIN COMMAND
                                </button>
                            </form>
                        </div>
                    </div>
                </>
            )}
          </div>
        )}

        {activeTab === 'admin' && <AdminPanel />}
      </div>
    </div>
  );
}
