import React, { useState, useEffect } from 'react';
import api from '../api';
import Header from '../components/Header';
import { useToast } from '../context/ToastContext';
import { CheckCircle, XCircle, Trash2 } from 'lucide-react';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const { showToast } = useToast();

  useEffect(() => {
    api.get('/api/admin/users/').then(res => setUsers(res.data));
  }, []);

  const toggleUser = async (id) => {
      try {
          const res = await api.put('/api/admin/users/', { user_id: id, action: 'toggle_active' });
          if(res.data.success) {
              showToast(res.data.message, "success");
              setUsers(users.map(u => u.id === id ? {...u, is_active: !u.is_active} : u));
          }
      } catch { showToast("Error al cambiar estado", "error"); }
  };

  const deleteUser = async (id) => {
      if(!window.confirm("¿ESTÁS SEGURO? Esta acción es permanente.")) return;
      try {
          const res = await api.delete(`/api/admin/users/${id}/`);
          if(res.data.success) {
              showToast("Usuario eliminado correctamente", "success");
              setUsers(users.filter(u => u.id !== id));
          }
      } catch (err) {
          showToast(err.response?.data?.error || "Error al eliminar", "error");
      }
  };

  return (
    <>
      <Header title="Usuarios Registrados" />
      <div className="page-content">
        <div className="card" style={{padding:'0'}}>
            <table style={{width:'100%', borderCollapse:'collapse'}}>
                <tbody>
                    {users.map(u => (
                        <tr key={u.id} style={{borderBottom:'1px solid #eee'}}>
                            <td style={{padding:'15px'}}>
                                <div style={{fontWeight:'bold'}}>{u.name}</div>
                                <div style={{fontSize:'0.8rem', color:'#666'}}>{u.email}</div>
                                <span className="level-badge" style={{fontSize:'0.6rem', padding:'2px 6px'}}>{u.level}</span>
                            </td>
                            <td style={{padding:'15px', textAlign:'right', display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'5px'}}>
                                <button 
                                    onClick={() => toggleUser(u.id)}
                                    className="btn"
                                    style={{
                                        width:'80px', padding:'6px', fontSize:'0.7rem',
                                        background: u.is_active ? '#fee2e2' : '#dcfce7',
                                        color: u.is_active ? '#dc2626' : '#166534'
                                    }}
                                >
                                    {u.is_active ? 'Suspender' : 'Activar'}
                                </button>
                                <button 
                                    onClick={() => deleteUser(u.id)}
                                    className="btn"
                                    style={{
                                        width:'80px', padding:'6px', fontSize:'0.7rem',
                                        background: '#1f2937', color: 'white'
                                    }}
                                >
                                    <Trash2 size={12} style={{marginRight:'4px'}}/> Eliminar
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </>
  );
};
export default AdminUsers;