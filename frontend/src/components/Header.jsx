import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, LogOut } from 'lucide-react';
import api from '../api';

const Header = ({ title }) => {
  const navigate = useNavigate();
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);

  const handleLogout = () => {
    sessionStorage.clear(); // Limpiamos sesión
    navigate('/');
  };

  const toggleHistory = async () => {
      if (!showHistory) {
          try {
              const res = await api.get('/api/history/');
              setHistory(res.data);
          } catch(err) { console.error(err); }
      }
      setShowHistory(!showHistory);
  };

  return (
    <div className="app-header">
      <div className="header-left">
        <img src="/logos/logo_simple.svg" alt="EcoPoints Logo" className="header-logo" />
        {title ? <h1 className="header-title">{title}</h1> : <span className="header-title" style={{color: 'var(--primary)'}}>EcoPoints</span>}
      </div>
      
      <div className="header-right" style={{display: 'flex', gap: '10px', position:'relative'}}>
        {/* Campanita Historial */}
        <div className="notification-btn" onClick={toggleHistory}>
            <Bell size={20} />
            {/* Opcional: mostrar punto rojo si hay historial no visto */}
            <span className="notification-dot"></span>
        </div>

        {/* Dropdown Historial */}
        {showHistory && (
            <div className="card" style={{
                position:'absolute', top:'50px', right:'0', width:'280px', 
                padding:'10px', maxHeight:'300px', overflowY:'auto',
                boxShadow:'0 4px 20px rgba(0,0,0,0.2)', zIndex:200
            }}>
                <h4 style={{margin:'0 0 10px 0', fontSize:'0.9rem', borderBottom:'1px solid #eee', paddingBottom:'5px'}}>Historial Reciente</h4>
                {history.length === 0 ? <p style={{fontSize:'0.8rem', color:'#999'}}>Sin actividad reciente</p> : 
                 history.map((h, i) => (
                    <div key={i} style={{fontSize:'0.8rem', marginBottom:'8px', display:'flex', justifyContent:'space-between'}}>
                        <span style={{maxWidth:'70%', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{h.title}</span>
                        <span style={{color:'var(--primary)', fontWeight:'bold'}}>+{h.points}</span>
                    </div>
                 ))
                }
            </div>
        )}

        {/* Botón Salir */}
        <div 
            className="notification-btn" 
            onClick={handleLogout} 
            style={{backgroundColor: '#fee2e2', color: '#ef4444', cursor:'pointer'}}
        >
            <LogOut size={20} />
        </div>
      </div>
    </div>
  );
};

export default Header;