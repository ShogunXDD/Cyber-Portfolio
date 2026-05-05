import { useState, useEffect } from 'react';
import { Users, Trash2, FileText, Plus, ShieldAlert, Cpu, Save, MessageSquare } from 'lucide-react';

export default function AdminPanel() {
    const [users, setUsers] = useState([]);
    const [history, setHistory] = useState([]);
    const [newUser, setNewUser] = useState({ username: '', password: '' });
    const [currentView, setCurrentView] = useState('users');
    const [modelConfig, setModelConfig] = useState({ all_available: [], enabled: [] });
    const [selectedSummary, setSelectedSummary] = useState(null);

    const fetchData = async () => {
        try {
            const uRes = await fetch(`/api/admin/users`);
            const uData = await uRes.json();
            setUsers(uData);

            const hRes = await fetch(`/api/admin/history`);
            const hData = await hRes.json();
            setHistory(hData);

            const mRes = await fetch(`/api/admin/models`);
            const mData = await mRes.json();
            setModelConfig(mData);
        } catch (err) {
            console.error("Admin fetch error:", err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateUser = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('username', newUser.username);
        formData.append('password', newUser.password);
        await fetch(`/api/admin/users`, { method: 'POST', body: formData });
        setNewUser({ username: '', password: '' });
        fetchData();
    };

    const handleDeleteUser = async (id) => {
        if (window.confirm("CRITICAL WARNING: Are you sure you want to permanently delete this user? This action cannot be undone.")) {
            await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
            fetchData();
        }
    };

    const handleDeleteHistory = async (id) => {
        if (window.confirm("CRITICAL WARNING: Are you sure you want to permanently scrub this intelligence event?")) {
            await fetch(`/api/admin/history/${id}`, { method: 'DELETE' });
            fetchData();
        }
    };

    const handleToggleModel = (model) => {
        const currentlyEnabled = modelConfig.enabled.includes(model);
        const newEnabled = currentlyEnabled 
            ? modelConfig.enabled.filter(m => m !== model)
            : [...modelConfig.enabled, model];
        setModelConfig({ ...modelConfig, enabled: newEnabled });
    };

    const handleSaveModels = async () => {
        const formData = new FormData();
        formData.append('models_json', JSON.stringify(modelConfig.enabled));
        await fetch(`/api/admin/models`, { method: 'POST', body: formData });
        alert("LLM Permissions Synced to Mainframe.");
    };

    return (
        <div className="admin-view-container animate-in">
          <div className="admin-header" style={{ marginBottom: '32px', display: 'flex', gap: '16px', borderBottom: '1px solid var(--admin-panel-border)', paddingBottom: '16px' }}>
            <button 
              onClick={() => setCurrentView('users')}
              className={currentView === 'users' ? 'admin-tab active' : 'admin-tab'}
            >
              <Users size={18} /> [ OPERATIVES ]
            </button>
            <button 
              onClick={() => setCurrentView('history')}
              className={currentView === 'history' ? 'admin-tab active' : 'admin-tab'}
            >
              <FileText size={18} /> [ GLOBAL LEDGER ]
            </button>
            <button 
              onClick={() => setCurrentView('llms')}
              className={currentView === 'llms' ? 'admin-tab active' : 'admin-tab'}
            >
              <Cpu size={18} /> [ LLM CONFIG ]
            </button>
          </div>

          {currentView === 'users' && (
              <div>
                  <div className="cyber-panel" style={{ marginBottom: '32px', padding: '24px', border: '1px solid rgba(255, 184, 0, 0.3)' }}>
                      <h3 style={{ color: 'var(--admin-accent)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><ShieldAlert size={18}/> ENROLL NEW OPERATIVE</h3>
                      <form onSubmit={handleCreateUser} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <input className="admin-input" placeholder="Alias Username" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} required style={{ marginBottom: 0, flex: 1, border: '1px solid rgba(255,184,0,0.4)' }} />
                          <input className="admin-input" type="password" placeholder="Passcode Encryption" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} required style={{ marginBottom: 0, flex: 1, border: '1px solid rgba(255,184,0,0.4)' }} />
                          <button type="submit" className="admin-btn" style={{ whiteSpace: 'nowrap', fontWeight: 'bold' }}><Plus size={18}/> GENERATE CREDENTIALS</button>
                      </form>
                  </div>

                  <div>
                      <h3 style={{ color: 'var(--admin-accent)', marginBottom: '24px', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={20}/> ACTIVE OPERATIVES DIRECTORY</h3>
                      <div className="admin-grid">
                          {users.map(u => (
                              <div key={u.id} className="operative-card">
                                  <div className="operative-id-watermark">#{u.id}</div>
                                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px' }}>{u.username}</div>
                                  <div style={{ fontSize: '12px', color: u.role === 'admin' ? 'var(--danger)' : 'var(--admin-accent)', marginBottom: '16px' }}>[{u.role.toUpperCase()} CLEARANCE]</div>
                                  
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', marginBottom: '20px' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>REG TIME</span> <span>{u.created_at}</span></div>
                                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>GEO-LOC</span> <span>{u.last_location || 'UNKNOWN'}</span></div>
                                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>USER-AGENT</span> <span style={{ textAlign: 'right', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.device_type || 'UNKNOWN'}</span></div>
                                  </div>
                                  
                                  {u.role !== 'admin' && (
                                      <button onClick={() => handleDeleteUser(u.id)} style={{ width: '100%', padding: '8px', background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onMouseOver={e => { e.currentTarget.style.background = 'var(--danger)'; e.currentTarget.style.color = '#000'; }} onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--danger)'; }}>
                                          <Trash2 size={14}/> PURGE OPERATIVE
                                      </button>
                                  )}
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          )}

          {currentView === 'history' && (
              <div>
                  <h3 style={{ color: 'var(--admin-accent)', marginBottom: '24px', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><FileText size={20}/> GLOBAL INTELLIGENCE LEDGER</h3>
                  
                  {selectedSummary ? (
                      <div className="cyber-panel animate-in" style={{ padding: '32px', border: '1px solid var(--admin-accent)' }}>
                          <button onClick={() => setSelectedSummary(null)} style={{ background: 'transparent', border: '1px solid var(--admin-accent)', color: 'var(--admin-accent)', padding: '8px 16px', cursor: 'pointer', marginBottom: '24px' }}>[ RETURN TO FEED ]</button>
                          <h4 style={{ color: 'var(--admin-accent)', marginBottom: '16px', fontSize: '18px', borderBottom: '1px solid rgba(255,184,0,0.3)', paddingBottom: '8px' }}>DECRYPTED REPORT LOG</h4>
                          <div style={{ margin: 0, lineHeight: '1.6', fontSize: '14px', fontFamily: '"Fira Code", monospace', color: 'var(--text-primary)' }}>
                              {selectedSummary.split('\n').map((line, idx) => {
                                  if (!line.trim()) return <div key={idx} style={{ height: '8px' }} />;
                                  let style = { marginBottom: '6px', wordBreak: 'break-all' };
                                  let content = line;

                                  if (line.startsWith('### ')) { content = line.substring(4); style = { ...style, color: 'var(--admin-accent)', fontSize: '1.2rem', fontWeight: 'bold', marginTop: '16px' }; }
                                  else if (line.startsWith('## ')) { content = line.substring(3); style = { ...style, color: 'var(--admin-accent)', fontSize: '1.4rem', fontWeight: 'bold', marginTop: '20px' }; }
                                  else if (line.startsWith('# ')) { content = line.substring(2); style = { ...style, color: 'var(--admin-accent)', fontSize: '1.6rem', fontWeight: 'bold', marginTop: '24px' }; }

                                  const parts = content.split(/(\*\*.*?\*\*)/g);
                                  const renderedParts = parts.map((part, i) => {
                                      if (part.startsWith('**') && part.endsWith('**')) {
                                          return <strong key={i} style={{ color: '#fff', background: 'rgba(255, 184, 0, 0.2)', padding: '0 4px', borderLeft: '2px solid var(--admin-accent)' }}>{part.slice(2, -2)}</strong>;
                                      }
                                      return part;
                                  });

                                  return <div key={idx} style={style}>{renderedParts}</div>;
                              })}
                          </div>
                      </div>
                  ) : (
                      <div className="ledger-feed">
                          {history.map(h => (
                               <div key={h.id} className="ledger-card">
                                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                       <div>
                                           <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px' }}>LOG TIMESTAMP: {new Date(h.timestamp).toLocaleString()}</div>
                                           <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--admin-accent)' }}>{h.username}</div>
                                       </div>
                                       <div style={{ display: 'flex', gap: '8px' }}>
                                           <button onClick={() => setSelectedSummary(h.summary || "No summary available.")} style={{ background: 'transparent', border: '1px solid var(--admin-accent)', color: 'var(--admin-accent)', padding: '4px 12px', fontSize: '10px', cursor: 'pointer' }} onMouseOver={e => { e.currentTarget.style.background = 'var(--admin-accent)'; e.currentTarget.style.color = '#000'; }} onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--admin-accent)'; }}>EXAMINE</button>
                                           <button onClick={() => handleDeleteHistory(h.id)} style={{ background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '4px 12px', fontSize: '10px', cursor: 'pointer' }} onMouseOver={e => { e.currentTarget.style.background = 'var(--danger)'; e.currentTarget.style.color = '#000'; }} onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--danger)'; }}><Trash2 size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }}/>SCRUB</button>
                                       </div>
                                   </div>
                                   <div className="cyber-panel" style={{ fontSize: '14px', color: 'var(--text-primary)', padding: '12px' }}>
                                       <span style={{ color: 'var(--text-secondary)', fontSize: '10px', display: 'block', marginBottom: '4px' }}>QUERY VECTOR</span>
                                       {h.query}
                                   </div>
                               </div>
                          ))}
                          {history.length === 0 && (
                              <div style={{ padding: '40px', textAlign: 'center', border: '1px dashed var(--admin-panel-border)', color: 'rgba(255,255,255,0.3)' }}>[ NO INTELLIGENCE EVENTS LOGGED ]</div>
                          )}
                      </div>
                  )}
              </div>
          )}

          {currentView === 'llms' && (
              <div>
                  <h3 style={{ color: 'var(--admin-accent)', marginBottom: '16px', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><Cpu size={20}/> LLM AVAILABILITY PROTOCOLS</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '14px' }}>Select which intelligence models are actively connected to the mainframe.</p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                      {modelConfig.all_available.map(model => {
                          const isEnabled = modelConfig.enabled.includes(model);
                          return (
                              <div key={model} className={`llm-switch ${isEnabled ? 'enabled' : ''}`} onClick={() => handleToggleModel(model)}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: isEnabled ? 'var(--admin-accent)' : '#333', boxShadow: isEnabled ? '0 0 10px var(--admin-accent)' : 'none' }}></div>
                                      <span style={{ color: isEnabled ? 'var(--text-primary)' : 'var(--text-secondary)', fontFamily: 'Fira Code', fontWeight: isEnabled ? 'bold' : 'normal', fontSize: '14px' }}>{model}</span>
                                  </div>
                                  <div style={{ fontSize: '10px', padding: '4px 8px', background: isEnabled ? 'rgba(255,184,0,0.2)' : 'rgba(128,128,128,0.1)', color: isEnabled ? 'var(--admin-accent)' : 'var(--text-secondary)' }}>
                                      {isEnabled ? 'ONLINE' : 'OFFLINE'}
                                  </div>
                              </div>
                          );
                      })}
                      {modelConfig.all_available.length === 0 && (
                          <div style={{ padding: '24px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', border: '1px dashed #333' }}>NO WORKING MODELS FOUND. Check API Keys.</div>
                      )}
                  </div>

                  <button onClick={handleSaveModels} style={{ width: '100%', padding: '16px', background: 'var(--admin-accent)', color: '#000', fontWeight: 'bold', fontSize: '16px', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: 'all 0.2s ease' }} onMouseOver={e => e.currentTarget.style.boxShadow = '0 0 20px rgba(255,184,0,0.4)'} onMouseOut={e => e.currentTarget.style.boxShadow = 'none'}>
                      <Save size={20} /> COMMIT PROTOCOLS
                  </button>
              </div>
          )}
        </div>
    );
}
