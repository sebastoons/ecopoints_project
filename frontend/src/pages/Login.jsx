import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { User, Lock, Mail, ShieldCheck } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState('user');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/login/', formData);
      if (response.data.success) {
        localStorage.setItem('user', response.data.username);
        navigate('/dashboard');
      }
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      setError('Correo o contraseña incorrectos.');
    }
  };

  return (
    <div className="auth-container">
      <div className="logo-area">
        {/* LOGO GRANDE DEL LOGIN */}
        <img 
          src="../../logos/logo_completo.svg" 
          alt="EcoPoints Logo" 
          className="auth-logo-img" 
        />
        <h1 className="app-title">Iniciar Sesión<span style={{color: 'var(--accent)'}}></span></h1>
      </div>

      <div className="btn-toggle-group">
        <button className={`btn-toggle ${role === 'admin' ? 'active-outline' : ''}`} onClick={() => setRole('admin')}>
          <ShieldCheck size={18}/> Administrador
        </button>
        <button className={`btn-toggle ${role === 'user' ? 'active' : ''}`} onClick={() => setRole('user')}>
          <User size={18}/> Usuario
        </button>
      </div>

      <form onSubmit={handleLogin}>
        <div className="form-group">
            <div className="input-wrapper">
                <Mail className="input-icon" size={20} />
                <input type="email" name="email" placeholder="Correo electrónico" className="form-input" onChange={handleChange} required />
            </div>
        </div>
        <div className="form-group">
            <div className="input-wrapper">
                <Lock className="input-icon" size={20} />
                <input type="password" name="password" placeholder="Contraseña" className="form-input" onChange={handleChange} required />
            </div>
        </div>
        {error && <div style={{color: '#ef4444', fontSize: '0.9rem', marginBottom: '10px', textAlign: 'center'}}>{error}</div>}
        <button type="submit" className="btn btn-primary" style={{marginTop: '10px'}}>Iniciar Sesión</button>
      </form>

      <div className="auth-footer">
        <p style={{marginBottom: '10px'}}>¿Olvidaste tu contraseña? <Link to="/recovery" className="link">Recuperar</Link></p>
        <p>¿No tienes una cuenta? <Link to="/register" className="link">Registrarse</Link></p>
      </div>
    </div>
  );
};
export default Login;