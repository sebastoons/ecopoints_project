import React, { useState, useEffect } from 'react';
import api from '../api';
import Header from '../components/Header';
import { Users, CheckCircle, XCircle, Plus, Shield } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para nueva tarea
  const [newTask, setNewTask] = useState({ 
    title: '', 
    points: 10, 
    description: 'Fácil', 
    icon_type: 'recycle' 
  });
  
  const { showToast } = useToast();

  const fetchUsers = async () => {
    try {
        const res = await api.get('/api/admin/users/');
        setUsers(res.data);
    } catch (error) {
        console.error("Error fetching users:", error);
        showToast("Error cargando datos. Verifica que seas administrador.", "error");
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleUserStatus = async (userId) => {
      try {
          // No necesitamos 'currentStatus' aquí, el backend lo invierte (toggle)
          const res = await api.put('/api/admin/users/', { user_id: userId, action: 'toggle_active' });
          if(res.data.success) {
              showToast(res.data.message, "success");
              fetchUsers(); // Recargar lista para ver cambios
          }
      } catch(err) {
          const msg = err.response?.data?.error || "Error al cambiar estado";
          showToast(msg, "error");
      }
  };

  const handleCreateTask = async (e) => {
      e.preventDefault();
      try {
          await api.post('/api/admin/tasks/create/', newTask);
          showToast("¡Tarea creada exitosamente!", "success");
          // Resetear formulario
          setNewTask({ title: '', points: 10, description: 'Fácil', icon_type: 'recycle' }); 
      } catch(err) {
          console.error(err);
          showToast("Error al crear tarea", "error");
      }
  };

  if (loading) return <div className="page-content">Cargando Panel de Administración...</div>;

  return (
    <>
      <Header title="Administración" />
      <div className="page-content">
        
        {/* --- SECCIÓN 1: CREAR TAREAS --- */}
        <div className="card">
            <div className="section-title" style={{fontSize:'1.2rem', display:'flex', alignItems:'center', gap:'10px'}}>
                <Plus size={24} color="var(--primary)"/> Crear Nueva Tarea
            </div>
            <p style={{fontSize:'0.85rem', color:'#666', marginBottom:'15px'}}>
                Agrega tareas globales al sistema para que los usuarios las realicen.
            </p>
            
            <form onSubmit={handleCreateTask}>
                <div className="form-group">
                    <label className="form-label">Título de la Tarea</label>
                    <input 
                        type="text" 
                        placeholder="Ej: Reciclar Pilas" 
                        className="form-input" 
                        value={newTask.title} 
                        onChange={(e) => setNewTask({...newTask, title: e.target.value})} 
                        required 
                    />
                </div>
                <div style={{display:'flex', gap:'10px'}}>
                    <div className="form-group" style={{flex:1}}>
                        <label className="form-label">Puntos</label>
                        <input 
                            type="number" 
                            placeholder="10" 
                            className="form-input" 
                            value={newTask.points} 
                            onChange={(e) => setNewTask({...newTask, points: e.target.value})} 
                            required 
                        />
                    </div>
                    <div className="form-group" style={{flex:1}}>
                        <label className="form-label">Icono</label>
                        <select 
                            className="form-input select-input" 
                            value={newTask.icon_type} 
                            onChange={(e) => setNewTask({...newTask, icon_type: e.target.value})}
                        >
                            <option value="recycle">♻️ General</option>
                            <option value="plastic">🧴 Plástico</option>
                            <option value="glass">🍾 Vidrio</option>
                            <option value="paper">📦 Papel</option>
                            <option value="can">🥫 Lata</option>
                            <option value="shirt">👕 Ropa</option>
                        </select>
                    </div>
                </div>
                <button type="submit" className="btn btn-primary">Guardar Tarea</button>
            </form>
        </div>

        {/* --- SECCIÓN 2: GESTIÓN DE USUARIOS --- */}
        <div className="card" style={{marginTop:'20px'}}>
            <div className="section-title" style={{fontSize:'1.2rem', display:'flex', alignItems:'center', gap:'10px'}}>
                <Shield size={24} color="var(--primary)"/> Integridad de Usuarios
            </div>
            <div style={{overflowX: 'auto'}}>
                <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem'}}>
                    <thead>
                        <tr style={{textAlign:'left', borderBottom:'2px solid #eee', color:'var(--text-secondary)'}}>
                            <th style={{padding:'8px'}}>Usuario</th>
                            <th style={{padding:'8px'}}>Estado</th>
                            <th style={{padding:'8px', textAlign:'right'}}>Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id} style={{borderBottom:'1px solid #f9f9f9'}}>
                                <td style={{padding:'12px 8px'}}>
                                    <div style={{fontWeight:'bold', color:'var(--text-main)'}}>{u.name || 'Sin nombre'}</div>
                                    <div style={{fontSize:'0.75rem', color:'#999'}}>{u.email}</div>
                                    <span className="level-badge" style={{fontSize:'0.65rem', padding:'2px 6px'}}>{u.level}</span>
                                </td>
                                <td style={{padding:'8px'}}>
                                    {u.is_active ? 
                                        <span style={{color:'green', display:'flex', alignItems:'center', gap:'4px', fontWeight:'600'}}><CheckCircle size={14}/> Activo</span> : 
                                        <span style={{color:'red', display:'flex', alignItems:'center', gap:'4px', fontWeight:'600'}}><XCircle size={14}/> Susp.</span>
                                    }
                                </td>
                                <td style={{padding:'8px', textAlign:'right'}}>
                                    <button 
                                        onClick={() => toggleUserStatus(u.id)}
                                        style={{
                                            padding:'6px 12px', 
                                            fontSize:'0.75rem', 
                                            borderRadius:'8px',
                                            border:'none',
                                            cursor:'pointer',
                                            fontWeight:'600',
                                            background: u.is_active ? '#fee2e2' : '#dcfce7', 
                                            color: u.is_active ? '#dc2626' : '#166534'
                                        }}
                                    >
                                        {u.is_active ? 'Suspender' : 'Activar'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

      </div>
    </>
  );
};

export default AdminPanel;