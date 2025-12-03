import React, { useState, useEffect } from 'react';
import api from '../api';
import Header from '../components/Header';
import { useToast } from '../context/ToastContext';
import { Plus, Trash2, Edit2, Save, X, Recycle } from 'lucide-react';

const AdminTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [isEditing, setIsEditing] = useState(null); // ID de la tarea que se está editando
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Formulario (usado tanto para crear como para editar)
  const [formData, setFormData] = useState({ title: '', points: '', description: '', icon_type: 'recycle' });
  
  const { showToast } = useToast();

  // 1. IMPORTANTE: Definimos la función ANTES de usarla en useEffect
  const loadTasks = () => {
      api.get('/api/tasks/')
         .then(res => setTasks(res.data))
         .catch(err => {
             console.error("Error cargando tareas:", err);
         });
  };

  // 2. Ahora sí podemos llamarla, porque ya existe en la línea anterior
  useEffect(() => { 
      loadTasks();  
  }, []);

  // --- CREAR ---
  const handleCreate = async (e) => {
      e.preventDefault();
      try {
          await api.post('/api/admin/tasks/create/', formData);
          showToast("Tarea creada exitosamente", "success");
          setShowCreateForm(false);
          setFormData({ title: '', points: '', description: '', icon_type: 'recycle' }); // Resetear formulario
          loadTasks(); // Recargar lista
      } catch (err) { 
          console.error(err);
          showToast("Error al crear la tarea", "error"); 
      }
  };

  // --- BORRAR ---
  const handleDelete = async (id) => {
      if(!window.confirm("¿Estás seguro de eliminar esta tarea global?")) return;
      try {
          await api.delete(`/api/admin/tasks/${id}/`);
          showToast("Tarea eliminada", "success");
          loadTasks(); // Recargar lista
      } catch (err) { 
          console.error(err);
          showToast("Error al eliminar la tarea", "error"); 
      }
  };

  // --- INICIAR EDICIÓN ---
  const startEdit = (task) => {
      setIsEditing(task.id);
      setFormData({
          title: task.title,
          points: task.points,
          description: task.description,
          icon_type: task.icon_type
      });
      setShowCreateForm(true); // Reutilizamos el formulario visualmente
  };

  // --- GUARDAR EDICIÓN ---
  const handleUpdate = async (e) => {
      e.preventDefault(); // Prevenir recarga del form
      try {
          await api.put(`/api/admin/tasks/${isEditing}/`, formData);
          showToast("Tarea actualizada correctamente", "success");
          setIsEditing(null);
          setShowCreateForm(false);
          setFormData({ title: '', points: '', description: '', icon_type: 'recycle' }); // Limpiar
          loadTasks(); // Recargar lista
      } catch (err) { 
          console.error(err);
          showToast("Error al actualizar la tarea", "error"); 
      }
  };

  // --- CANCELAR ---
  const handleCancel = () => {
      setShowCreateForm(false);
      setIsEditing(null);
      setFormData({ title: '', points: '', description: '', icon_type: 'recycle' });
  };

  return (
    <>
      <Header title="Gestión de Tareas" />
      <div className="page-content">
        
        {/* BOTÓN PARA ABRIR FORMULARIO DE CREACIÓN */}
        {!showCreateForm && (
            <button className="btn btn-primary" onClick={() => setShowCreateForm(true)} style={{marginBottom:'20px'}}>
                <Plus size={20}/> Crear Nueva Tarea
            </button>
        )}

        {/* FORMULARIO (CREAR O EDITAR) */}
        {showCreateForm && (
            <div className="card" style={{border:'2px solid var(--primary)', marginBottom:'20px'}}>
                <h3 style={{marginTop:0, fontSize:'1.1rem'}}>{isEditing ? 'Editar Tarea' : 'Nueva Tarea'}</h3>
                <form>
                    <div className="form-group">
                        <label className="form-label">Título</label>
                        <input 
                            className="form-input" 
                            value={formData.title} 
                            onChange={e => setFormData({...formData, title: e.target.value})} 
                            placeholder="Ej: Reciclar Pilas"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Descripción</label>
                        <input 
                            className="form-input" 
                            value={formData.description} 
                            onChange={e => setFormData({...formData, description: e.target.value})} 
                            placeholder="Ej: Fácil, Medio, Difícil"
                        />
                    </div>
                    <div style={{display:'flex', gap:'10px'}}>
                        <div className="form-group" style={{flex:1}}>
                            <label className="form-label">Puntos</label>
                            <input 
                                type="number" 
                                className="form-input" 
                                value={formData.points} 
                                onChange={e => setFormData({...formData, points: e.target.value})} 
                            />
                        </div>
                        <div className="form-group" style={{flex:1}}>
                            <label className="form-label">Icono</label>
                            <select 
                                className="form-input select-input" 
                                value={formData.icon_type} 
                                onChange={e => setFormData({...formData, icon_type: e.target.value})}
                            >
                                <option value="recycle">♻️ General</option>
                                <option value="plastic">🧴 Plástico</option>
                                <option value="glass">🍾 Vidrio</option>
                                <option value="can">🥫 Lata</option>
                                <option value="box">📦 Caja</option>
                                <option value="shirt">👕 Ropa</option>
                                <option value="bag">🛍️ Bolsa</option>
                            </select>
                        </div>
                    </div>
                    <div style={{display:'flex', gap:'10px', marginTop:'10px'}}>
                        <button className="btn btn-primary" onClick={isEditing ? handleUpdate : handleCreate}>
                            <Save size={18}/> {isEditing ? 'Actualizar' : 'Guardar'}
                        </button>
                        <button className="btn" style={{background:'#f3f4f6', color:'#374151'}} onClick={handleCancel}>
                            <X size={18}/> Cancelar
                        </button>
                    </div>
                </form>
            </div>
        )}

        {/* LISTA DE TAREAS EXISTENTES */}
        <div className="tasks-list">
            {tasks.length > 0 ? (
                tasks.map(task => (
                    <div key={task.id} className="card list-item" style={{padding:'16px', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                        <div style={{display:'flex', alignItems:'center', flex:1}}>
                            <div className="item-icon" style={{marginRight:'12px'}}>
                                <Recycle size={20}/>
                            </div>
                            <div>
                                <div className="item-title" style={{fontWeight:'bold'}}>{task.title}</div>
                                <div className="item-subtitle" style={{fontSize:'0.85rem', color:'#666'}}>
                                    {task.points} pts • {task.description} • {task.icon_type}
                                </div>
                            </div>
                        </div>
                        <div style={{display:'flex', gap:'8px'}}>
                            <button 
                                onClick={() => startEdit(task)} 
                                style={{background:'none', border:'none', color:'#2563eb', cursor:'pointer', padding:'4px'}}
                                title="Editar"
                            >
                                <Edit2 size={20}/>
                            </button>
                            <button 
                                onClick={() => handleDelete(task.id)} 
                                style={{background:'none', border:'none', color:'#dc2626', cursor:'pointer', padding:'4px'}}
                                title="Eliminar"
                            >
                                <Trash2 size={20}/>
                            </button>
                        </div>
                    </div>
                ))
            ) : (
                <p style={{textAlign:'center', color:'#999', marginTop:'20px'}}>No hay tareas registradas.</p>
            )}
        </div>
      </div>
    </>
  );
};
export default AdminTasks;