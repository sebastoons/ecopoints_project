import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Save, LogOut, Lock } from 'lucide-react';
import Header from '../components/Header';
import { useToast } from '../context/ToastContext';

const Profile = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({ first_name: '', email: '', profile: { points: 0, level: '' }});
  
  // Estados para contraseña
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const currentUserEmail = localStorage.getItem('user');

  useEffect(() => {
    if (!currentUserEmail) { navigate('/'); return; }
    api.get(`/api/profile/?email=${currentUserEmail}`)
      .then(res => { setUserData(res.data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, [currentUserEmail, navigate]);

  const handleSave = async (e) => {
    e.preventDefault();
    
    // Validación de contraseña
    if (newPassword && newPassword !== confirmPassword) {
        showToast("Las nuevas contraseñas no coinciden", "error");
        return;
    }

    try {
      const payload = {
          username: currentUserEmail,
          first_name: userData.first_name,
          email: userData.email,
      };
      // Solo enviamos password si el usuario escribió algo
      if (newPassword) payload.new_password = newPassword;

      const res = await api.put('/api/profile/', payload);
      
      if (res.data.success) {
        showToast("Perfil actualizado correctamente", "success");
        setNewPassword(''); setConfirmPassword(''); // Limpiar campos
        if (userData.email !== currentUserEmail) localStorage.setItem('user', userData.email);
      }
    } catch (err) {
      console.error(err);
      showToast('Error al actualizar perfil', "error");
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
            <img src={`https://ui-avatars.com/api/?name=${userData.first_name || 'User'}&background=1ea880&color=fff&size=128`} alt="Profile" className="profile-img-large"/>
            <h2 className="profile-name">{userData.first_name}</h2>
            <span className="level-badge" style={{marginTop: '8px'}}>{userData.profile?.level || 'Eco-Iniciado'}</span>
        </div>

        <div className="card">
            <h3 className="section-title" style={{fontSize: '1.1rem'}}>Datos Personales</h3>
            <form onSubmit={handleSave}>
                <div className="form-group">
                    <label className="form-label">Nombre</label>
                    <div className="input-wrapper">
                        <User className="input-icon" size={20} />
                        <input type="text" className="form-input" value={userData.first_name} onChange={(e) => setUserData({...userData, first_name: e.target.value})} />
                    </div>
                </div>
                <div className="form-group">
                    <label className="form-label">Correo</label>
                    <div className="input-wrapper">
                        <Mail className="input-icon" size={20} />
                        <input type="email" className="form-input" value={userData.email} onChange={(e) => setUserData({...userData, email: e.target.value})} />
                    </div>
                </div>

                <hr style={{margin: '20px 0', borderTop: '1px solid #eee'}}/>
                <h3 className="section-title" style={{fontSize: '1rem', marginBottom:'10px'}}>Cambiar Contraseña</h3>

                <div className="form-group">
                    <div className="input-wrapper">
                        <Lock className="input-icon" size={20} />
                        <input type="password" placeholder="Nueva contraseña" className="form-input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                    </div>
                </div>
                <div className="form-group">
                    <div className="input-wrapper">
                        <Lock className="input-icon" size={20} />
                        <input type="password" placeholder="Confirmar nueva contraseña" className="form-input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
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