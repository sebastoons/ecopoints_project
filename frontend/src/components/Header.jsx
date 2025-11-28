import React from 'react';
import { Bell } from 'lucide-react';

const Header = ({ title }) => {
  return (
    <div className="app-header">
      <div className="header-left">
        {/* CAMBIA EL NOMBRE DEL ARCHIVO ABAJO 
           La ruta comienza con / porque está en la carpeta public
        */}
        <img 
          src="../../logos/logo_simple.svg" 
          alt="EcoPoints Logo" 
          className="header-logo" 
        />
        
        {title && <h1 className="header-title">{title}</h1>}
      </div>
      <div className="header-right">
        <div className="notification-btn">
            <Bell size={20} />
            <span className="notification-dot"></span>
        </div>
      </div>
    </div>
  );
};

export default Header;