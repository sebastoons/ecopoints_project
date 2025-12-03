import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Mail, Save, LogOut, Lock, AlertTriangle } from 'lucide-react';
import Header from '../components/Header';
import { useToast } from '../context/ToastContext';

const Profile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({ first_name: '', email: '', profile: { points: 0, level: '' }});
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // CORRECCIÓN: Inicializamos el estado leyendo la URL directamente.
  // Esto soluciona el error de la línea 25 y evita el renderizado en cascada.
  const [forceChange, setForceChange] = useState(() => {
      const params = new URLSearchParams(location.search);
      return params.get('forceChange') === 'true';
  });

  const currentUserEmail = localStorage.getItem('user');

  useEffect(() => {
    if (!currentUserEmail) { navigate('/'); return; }
    
    // La lógica de detección de 'forceChange' ya se manejó en el useState inicial.
    // Aquí solo cargamos los datos del perfil.

    api.get(`/api/profile/?email=${currentUserEmail}`)
      .then(res => { setUserData(res.data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, [currentUserEmail, navigate]);

  const handleSave = async (e) => {
    e.preventDefault();
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
      if (newPassword) payload.new_password = newPassword;

      const res = await api.put('/api/profile/', payload);
      
      if (res.data.success) {
        showToast("Perfil actualizado correctamente", "success");
        setNewPassword(''); setConfirmPassword('');
        setForceChange(false); // Quitamos la alerta visualmente
        // Limpiamos el parámetro de la URL sin recargar la página
        navigate('/profile', { replace: true });
      }
    } catch (err) {
      console.error(err);
      showToast('Error al actualizar perfil', "error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('isAdmin');
    navigate('/');
  };

  if (loading) return <div className="page-content">Cargando...</div>;

  return (
    <>
      <Header title="Mi Perfil" />
      <div className="page-content">
        
        {/* ALERTA DE SEGURIDAD */}
        {forceChange && (
            <div style={{background:'#fff7ed', border:'1px solid #fdba74', padding:'15px', borderRadius:'12px', marginBottom:'20px', display:'flex', gap:'10px', alignItems:'center'}}>
                <AlertTriangle color="#c2410c" />
                <div style={{color:'#9a3412', fontSize:'0.9rem'}}>
                    <strong>Acción Requerida:</strong> Por tu seguridad, debes cambiar tu contraseña temporal ahora.
                </div>
            </div>
        )}

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
                        <input type="text" className="form-input" value={userData.first_name} onChange={(e) => setUserData({...userData, first_name: e.target.value})} disabled={forceChange} />
                    </div>
                </div>
                <div className="form-group">
                    <label className="form-label">Correo</label>
                    <div className="input-wrapper">
                        <Mail className="input-icon" size={20} />
                        <input type="email" className="form-input" value={userData.email} onChange={(e) => setUserData({...userData, email: e.target.value})} disabled={forceChange} />
                    </div>
                </div>

                <hr style={{margin: '20px 0', borderTop: '1px solid #eee'}}/>
                <h3 className="section-title" style={{fontSize: '1rem', marginBottom:'10px', color: forceChange ? '#c2410c' : 'inherit'}}>Cambiar Contraseña</h3>

                <div className="form-group">
                    <div className="input-wrapper">
                        <Lock className="input-icon" size={20} />
                        <input type="password" placeholder="Nueva contraseña" className="form-input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required={forceChange} style={forceChange ? {borderColor:'#fdba74', background:'#fff7ed'} : {}} />
                    </div>
                </div>
                <div className="form-group">
                    <div className="input-wrapper">
                        <Lock className="input-icon" size={20} />
                        <input type="password" placeholder="Confirmar nueva contraseña" className="form-input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required={forceChange} style={forceChange ? {borderColor:'#fdba74', background:'#fff7ed'} : {}} />
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