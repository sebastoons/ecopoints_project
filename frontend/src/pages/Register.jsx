import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { useToast } from '../context/ToastContext';
import { User, Mail, Lock, Check, X } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [passError, setPassError] = useState('');

  const validatePassword = (pwd) => {
      // Mínimo 8 caracteres, 1 Mayúscula, 1 Número
      const regex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
      if(!regex.test(pwd)) {
          setPassError("Debe tener: 8 caracteres, 1 mayúscula y 1 número.");
          return false;
      }
      setPassError("");
      return true;
  };

  const handleChange = (e) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
      if(e.target.name === 'password') validatePassword(e.target.value);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      showToast("Las contraseñas no coinciden", "error");
      return;
    }
    if(passError || !formData.password) {
        showToast("La contraseña no es segura", "error");
        return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/register/', {
        name: formData.name, email: formData.email, password: formData.password
      });
      if (response.data.success) {
        showToast("Cuenta creada. Revisa tu correo.", "success");
        navigate('/'); // Redirige al login inmediatamente
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al registrar usuario.';
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="logo-area" style={{marginBottom: '20px'}}>
        <img src="/logos/logo-auth.png" alt="EcoPoints" className="auth-logo-img" />
        <p style={{color: '#666', marginTop: '10px'}}>Crea tu cuenta para empezar a reciclar.</p>
      </div>
      <form onSubmit={handleRegister}>
        <div className="form-group">
            <label className="form-label">Nombre completo</label>
            <div className="input-wrapper">
                <User className="input-icon" size={20} />
                <input type="text" name="name" className="form-input" onChange={handleChange} required />
            </div>
        </div>
        <div className="form-group">
            <label className="form-label">Correo electrónico</label>
            <div className="input-wrapper">
                <Mail className="input-icon" size={20} />
                <input type="email" name="email" className="form-input" onChange={handleChange} required />
            </div>
        </div>
        <div className="form-group">
            <label className="form-label">Contraseña</label>
            <div className="input-wrapper">
                <Lock className="input-icon" size={20} />
                <input type="password" name="password" className="form-input" onChange={handleChange} required />
            </div>
            {passError && (
                <div style={{color:'var(--danger)', fontSize:'0.75rem', marginTop:'4px', display:'flex', alignItems:'center'}}>
                    <X size={12} style={{marginRight:'4px'}}/> {passError}
                </div>
            )}
            {!passError && formData.password && (
                <div style={{color:'green', fontSize:'0.75rem', marginTop:'4px', display:'flex', alignItems:'center'}}>
                    <Check size={12} style={{marginRight:'4px'}}/> Contraseña segura
                </div>
            )}
        </div>
        <div className="form-group">
            <label className="form-label">Confirmar contraseña</label>
            <div className="input-wrapper">
                <Lock className="input-icon" size={20} />
                <input type="password" name="confirmPassword" className="form-input" onChange={handleChange} required />
            </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading || passError} style={{marginTop: '10px'}}>
            {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
        </button>
      </form>
      <div className="auth-footer">
        <p>¿Ya tienes una cuenta? <Link to="/" className="link">Inicia Sesión</Link></p>
      </div>
    </div>
  );
};
export default Register;