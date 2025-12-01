import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Save, Lock, CheckCircle, LogOut } from 'lucide-react';
import Header from '../components/Header';
import api from '../api'; // Usamos nuestra instancia configurada

const Profile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({
    first_name: '',
    email: '',
    password: '',
    profile: { points: 0, level: 'Cargando...' }
  });

  // Identificador actual
  const currentUserEmail = localStorage.getItem('user');

  useEffect(() => {
    // Si no hay usuario, redirigir
    if (!currentUserEmail) {
      navigate('/');
      return;
    }

    // Definimos la función DENTRO del efecto para evitar errores de dependencias
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/api/profile/?email=${currentUserEmail}`);
        setUserData({ ...res.data, password: '' });
        setLoading(false);
      } catch (err) {
        console.error("Error cargando perfil", err);
        setLoading(false);
      }
    };

    fetchProfile();
  }, [currentUserEmail, navigate]);

  const handleChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        username: currentUserEmail,
        first_name: userData.first_name,
        email: userData.email,
      };

      if (userData.password && userData.password.length > 0) {
        payload.password = userData.password;
      }

      const res = await api.put('/api/profile/', payload);
      
      if (res.data.success) {
        alert('Perfil actualizado correctamente.');
        if (userData.email !== currentUserEmail) {
            localStorage.setItem('user', userData.email);
        }
        setUserData(prev => ({ ...prev, password: '' }));
        // Recargar página para reflejar cambios frescos
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
      alert('Error al actualizar: ' + (err.response?.data?.error || 'Intente nuevamente'));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  if (loading) return <div className="page-content">Cargando...</div>;

  return (
    <>
      <Header title="Mi Perfil" />
      <div className="page-content">
        
        <div className="profile-avatar-section">
            <img 
                src={`https://ui-avatars.com/api/?name=${userData.first_name || 'User'}&background=1ea880&color=fff&size=128&bold=true`} 
                alt="Profile" 
                className="profile-img-large"
            />
            <h2 className="profile-name">{userData.first_name}</h2>
            <div className="level-badge" style={{marginTop: '8px', display:'flex', alignItems:'center', gap:'5px'}}>
                <CheckCircle size={14}/> {userData.profile?.level}
            </div>
            <p style={{color: '#666', marginTop:'5px'}}>{userData.profile?.points} EcoPoints</p>
        </div>

        <div className="card">
            <h3 className="section-title" style={{fontSize: '1.1rem'}}>Editar Información</h3>
            <form onSubmit={handleSave}>
                <div className="form-group">
                    <label className="form-label">Nombre Completo</label>
                    <div className="input-wrapper">
                        <User className="input-icon" size={20} />
                        <input 
                            type="text" 
                            name="first_name" 
                            className="form-input" 
                            value={userData.first_name} 
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Correo Electrónico</label>
                    <div className="input-wrapper">
                        <Mail className="input-icon" size={20} />
                        <input 
                            type="email" 
                            name="email" 
                            className="form-input" 
                            value={userData.email} 
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Nueva Contraseña (Opcional)</label>
                    <div className="input-wrapper">
                        <Lock className="input-icon" size={20} />
                        <input 
                            type="password" 
                            name="password" 
                            className="form-input" 
                            placeholder="Dejar en blanco para mantener actual"
                            value={userData.password} 
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{marginTop: '10px'}}>
                    <Save size={18} /> Guardar Cambios
                </button>
            </form>
        </div>

        <button onClick={handleLogout} className="btn btn-danger" style={{marginBottom:'20px'}}>
            <LogOut size={18} /> Cerrar Sesión
        </button>

      </div>
    </>
  );
};

export default Profile;