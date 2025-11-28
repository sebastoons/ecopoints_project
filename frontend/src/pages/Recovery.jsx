import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Globe } from 'lucide-react';

const Recovery = () => {
  const [email, setEmail] = useState('');
  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Se ha enviado un código de acceso temporal a: ${email}`);
  };

  return (
    <div className="auth-container">
      <div className="logo-area">
        {/* LOGO RECUPERACION */}
        <img 
          src="../../logos/logo-auth.png" 
          alt="EcoPoints" 
          className="auth-logo-img" 
        />
        <h2 className="page-title">Recuperar Contraseña</h2>
        <p className="page-subtitle">Ingrese su correo electrónico asociado a la cuenta para enviarle una contraseña temporal.</p>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
            <div className="input-wrapper">
                <Mail className="input-icon" size={20} />
                <input type="email" placeholder="Correo electrónico" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
        </div>
        <button type="submit" className="btn btn-primary" style={{marginTop: '20px'}}>Enviar Código de Acceso</button>
      </form>
      <div className="auth-footer">
        <p>¿Recordaste tu contraseña? <Link to="/" className="link">Volver al inicio</Link></p>
      </div>
    </div>
  );
};
export default Recovery;