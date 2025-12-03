import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api'; 
import { useToast } from '../context/ToastContext';
import { User, Lock, Mail, ShieldCheck } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [role, setRole] = useState('user'); // Solo visual, el backend decide el rol real
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/api/login/', formData);
      
      if (response.data.success) {
        // 1. Guardamos DATOS CRÍTICOS
        localStorage.setItem('token', response.data.access); // El JWT
        localStorage.setItem('user', response.data.username);
        
        // 2. Verificamos si es Admin real (viene del backend)
        const isAdmin = response.data.is_staff;
        localStorage.setItem('isAdmin', isAdmin); 

        showToast(`¡Hola de nuevo, ${response.data.name || 'Administrador'}!`, "success");
        
        // 3. Redirección Inteligente
        if (isAdmin && role === 'admin') {
            navigate('/admin-dashboard'); // <--- CAMBIO AQUÍ (antes /admin-panel)
        } else {
            navigate('/dashboard');
        }
      }
    } catch (err) {
      console.error(err);
      showToast("Credenciales incorrectas. Intenta de nuevo.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="logo-area">
        <img src="/logos/logo_completo.svg" alt="EcoPoints" className="auth-logo-img" />
        <h1 className="app-title">Iniciar Sesión</h1>
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
        
        <button type="submit" className="btn btn-primary" disabled={loading} style={{marginTop: '10px'}}>
          {loading ? 'Ingresando...' : 'Iniciar Sesión'}
        </button>
      </form>

      <div className="auth-footer">
        <p style={{marginBottom: '10px'}}>¿Olvidaste tu contraseña? <Link to="/recovery" className="link">Recuperar</Link></p>
        <p>¿No tienes una cuenta? <Link to="/register" className="link">Registrarse</Link></p>
      </div>
    </div>
  );
};
export default Login;