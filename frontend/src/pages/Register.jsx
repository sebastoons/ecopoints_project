import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { User, Mail, Lock } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/register/', {
        name: formData.name, email: formData.email, password: formData.password
      });
      if (response.data.success) {
        alert('Cuenta creada exitosamente.');
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar usuario.');
    }
  };

  return (
    <div className="auth-container">
      <div className="logo-area" style={{marginBottom: '20px'}}>
        {/* LOGO REGISTRO */}
        <img 
          src="../../logos/logo-auth.png" 
          alt="EcoPoints" 
          className="auth-logo-img" 
        />
        <p style={{color: '#666', marginTop: '10px'}}>Crea tu cuenta para empezar a reciclar y ganar puntos.</p>
      </div>
      <form onSubmit={handleRegister}>
        <div className="form-group">
            <label className="form-label">Nombre completo</label>
            <div className="input-wrapper">
                <User className="input-icon" size={20} />
                <input type="text" name="name" placeholder="Introduce tu nombre" className="form-input" onChange={handleChange} required />
            </div>
        </div>
        <div className="form-group">
            <label className="form-label">Correo electrónico</label>
            <div className="input-wrapper">
                <Mail className="input-icon" size={20} />
                <input type="email" name="email" placeholder="Introduce tu correo" className="form-input" onChange={handleChange} required />
            </div>
        </div>
        <div className="form-group">
            <label className="form-label">Contraseña</label>
            <div className="input-wrapper">
                <Lock className="input-icon" size={20} />
                <input type="password" name="password" placeholder="Crea una contraseña" className="form-input" onChange={handleChange} required />
            </div>
        </div>
        <div className="form-group">
            <label className="form-label">Confirmar contraseña</label>
            <div className="input-wrapper">
                <Lock className="input-icon" size={20} />
                <input type="password" name="confirmPassword" placeholder="Confirma tu contraseña" className="form-input" onChange={handleChange} required />
            </div>
        </div>
        {error && <div style={{color: '#ef4444', fontSize: '0.9rem', marginBottom: '10px'}}>{error}</div>}
        <button type="submit" className="btn btn-primary" style={{marginTop: '10px'}}>Crear Cuenta</button>
      </form>
      <div className="auth-footer">
        <p>¿Ya tienes una cuenta? <Link to="/" className="link">Inicia Sesión</Link></p>
      </div>
    </div>
  );
};
export default Register;