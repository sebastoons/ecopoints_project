import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { User, Mail, Lock, Check, X } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0); // 0-4

  // Regex para validación: 8 caracteres, 1 mayúscula, 1 número
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

  const checkStrength = (pass) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/\d/.test(pass)) score++;
    if (/[!@#$%^&*]/.test(pass)) score++; // Bonus por caracter especial
    return score;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === 'password') {
        setPasswordStrength(checkStrength(value));
    }
  };

  const getStrengthLabel = () => {
    if (formData.password.length === 0) return { text: '', color: '#e5e7eb' };
    if (passwordStrength < 2) return { text: 'Débil', color: '#ef4444' };
    if (passwordStrength === 2) return { text: 'Media', color: '#eab308' };
    return { text: 'Fuerte', color: '#22c55e' };
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    // Validación estricta
    if (!passwordRegex.test(formData.password)) {
        setError('La contraseña debe tener al menos 8 caracteres, una mayúscula y un número.');
        return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    try {
      const response = await api.post('/api/register/', {
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

  const strengthInfo = getStrengthLabel();

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
                <input type="text" name="name" placeholder="Tu nombre" className="form-input" onChange={handleChange} required />
            </div>
        </div>
        <div className="form-group">
            <label className="form-label">Correo electrónico</label>
            <div className="input-wrapper">
                <Mail className="input-icon" size={20} />
                <input type="email" name="email" placeholder="tucorreo@ejemplo.com" className="form-input" onChange={handleChange} required />
            </div>
        </div>
        
        <div className="form-group">
            <label className="form-label">Contraseña</label>
            <div className="input-wrapper">
                <Lock className="input-icon" size={20} />
                <input type="password" name="password" placeholder="Mín 8 carácteres, 1 Mayúscula, 1 Número" className="form-input" onChange={handleChange} required />
            </div>
            
            {/* Medidor de Fuerza */}
            {formData.password && (
                <div style={{marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem'}}>
                    <div style={{flex: 1, height: '4px', background: '#e5e7eb', borderRadius: '2px'}}>
                        <div style={{
                            width: `${Math.min((passwordStrength / 3) * 100, 100)}%`, 
                            background: strengthInfo.color, 
                            height: '100%', 
                            borderRadius: '2px',
                            transition: 'all 0.3s'
                        }}></div>
                    </div>
                    <span style={{color: strengthInfo.color, fontWeight: '600'}}>{strengthInfo.text}</span>
                </div>
            )}
            <div style={{fontSize: '0.75rem', color: '#666', marginTop: '4px'}}>
                Requisito: 8+ chars, Mayúscula y Número.
            </div>
        </div>

        <div className="form-group">
            <label className="form-label">Confirmar contraseña</label>
            <div className="input-wrapper">
                <Lock className="input-icon" size={20} />
                <input type="password" name="confirmPassword" placeholder="Repite tu contraseña" className="form-input" onChange={handleChange} required />
            </div>
        </div>

        {error && <div style={{color: '#ef4444', fontSize: '0.9rem', marginBottom: '10px', background: '#fee2e2', padding: '8px', borderRadius: '8px', display:'flex', alignItems:'center', gap:'5px'}}>
            <X size={16}/> {error}
        </div>}
        
        <button type="submit" className="btn btn-primary" style={{marginTop: '10px'}}>Crear Cuenta</button>
      </form>
      <div className="auth-footer">
        <p>¿Ya tienes una cuenta? <Link to="/" className="link">Inicia Sesión</Link></p>
      </div>
    </div>
  );
};
export default Register;