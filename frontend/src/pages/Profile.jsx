import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Save, LogOut } from 'lucide-react';
import Header from '../components/Header';
import { useToast } from '../context/ToastContext';

const Profile = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({
    first_name: '',
    email: '',
    profile: { points: 0, level: '' }
  });

  const currentUserEmail = localStorage.getItem('user');

  useEffect(() => {
    if (!currentUserEmail) { navigate('/'); return; }
    
    api.get(`/api/profile/?email=${currentUserEmail}`)
      .then(res => {
        setUserData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [currentUserEmail, navigate]);

  const handleChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put('/api/profile/', {
        username: currentUserEmail, 
        first_name: userData.first_name,
        email: userData.email
      });
      
      if (res.data.success) {
        showToast("Perfil actualizado correctamente", "success");
        if (userData.email !== currentUserEmail) {
            localStorage.setItem('user', userData.email);
        }
      }
    } catch (err) {
      console.error(err); // VARIABLE USADA AQUÍ
      showToast('Error al actualizar perfil', "error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  if (loading) return <div className="page-content">Cargando perfil...</div>;

  return (
    <>
      <Header title="Mi Perfil" />
      <div className="page-content">
        <div className="profile-avatar-section">
            <img 
                src={`https://ui-avatars.com/api/?name=${userData.first_name || 'User'}&background=1ea880&color=fff&size=128`} 
                alt="Profile" 
                className="profile-img-large"
            />
            <h2 className="profile-name">{userData.first_name}</h2>
            <span className="level-badge" style={{marginTop: '8px'}}>{userData.profile?.level || 'Eco-Iniciado'}</span>
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
                        />
                    </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{marginTop: '10px'}}>
                    <Save size={18} /> Guardar Cambios
                </button>
            </form>
        </div>

        <button onClick={handleLogout} className="btn btn-danger">
            <LogOut size={18} /> Cerrar Sesión
        </button>
      </div>
    </>
  );
};

export default Profile;