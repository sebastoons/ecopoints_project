import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Globe } from 'lucide-react';
import api from '../api';
import { useToast } from '../context/ToastContext';

const Recovery = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        const res = await api.post('/api/recover/', { email });
        if (res.data.success) {
            showToast("Correo de recuperación enviado. Revisa tu bandeja.", "success");
        }
    } catch (err) {
        console.error(err);
        showToast("No encontramos una cuenta con ese correo.", "error");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="logo-area">
        <img src="/logos/logo-auth.png" alt="EcoPoints" className="auth-logo-img" />
        <h2 className="page-title">Recuperar Contraseña</h2>
        <p className="page-subtitle">Ingresa tu correo para recibir una contraseña temporal.</p>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
            <div className="input-wrapper">
                <Mail className="input-icon" size={20} />
                <input type="email" placeholder="Correo electrónico" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading} style={{marginTop: '20px'}}>
            {loading ? 'Enviando...' : 'Enviar Código'}
        </button>
      </form>
      <div className="auth-footer">
        <p>¿Recordaste tu contraseña? <Link to="/" className="link">Volver al inicio</Link></p>
      </div>
    </div>
  );
};
export default Recovery;