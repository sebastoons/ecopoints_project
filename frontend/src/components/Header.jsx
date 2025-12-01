import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, LogOut } from 'lucide-react';

const Header = ({ title }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="app-header">
      <div className="header-left">
        {/* LOGO */}
        <img 
          src="/logos/logo_simple.svg" 
          alt="EcoPoints Logo" 
          className="header-logo" 
        />
        
        {title ? (
            <h1 className="header-title">{title}</h1>
        ) : (
            <span className="header-title" style={{color: 'var(--primary)'}}>EcoPoints</span>
        )}
      </div>
      
      <div className="header-right" style={{display: 'flex', gap: '10px'}}>
        {/* Campana movida a la izquierda del botón salir */}
        <div className="notification-btn">
            <Bell size={20} />
            <span className="notification-dot"></span>
        </div>

        {/* Botón Salir (Exit / X) */}
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