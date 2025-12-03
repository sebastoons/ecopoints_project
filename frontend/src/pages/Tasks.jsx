import React, { useState, useEffect } from 'react';
import api from '../api';
import { PlusCircle, Recycle, Shirt, ShoppingBag, Check } from 'lucide-react';
import Header from '../components/Header';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  
  useEffect(() => {
    api.get('/api/tasks/')
       .then(res => setTasks(res.data))
       .catch(err => console.error(err));
  }, []);

  const getIcon = (title) => {
      const t = title.toLowerCase();
      if(t.includes('botella') || t.includes('caja')) return <Recycle size={24} />;
      if(t.includes('ropa')) return <Shirt size={24} />;
      return <ShoppingBag size={24} />;
  };

  return (
    <>
      <Header title="Tareas" />
      <div className="page-content">
       <div className="tasks-list">
           {tasks.length > 0 ? tasks.map(task => (
               <div key={task.id} className="card list-item" style={{ padding: '16px', borderRadius: '16px', display:'flex', alignItems:'center' }}>
                   <div className="item-icon" style={{ background: 'var(--primary-light)', borderRadius: '12px', width: '48px', height: '48px', marginRight:'16px' }}>
                        {getIcon(task.title)}
                   </div>
                   <div style={{flex:1}}>
                       <div className="item-title" style={{ fontSize: '1rem' }}>{task.title}</div>
                       <div className="item-subtitle">★ {task.points} Puntos</div>
                   </div>
                    <button 
                      className="btn btn-task-action" // Agregamos una clase específica
                      style={{ width: 'auto', background: 'var(--primary-dark)', color: 'white', fontSize: '0.85rem' }}
                    >
                      <PlusCircle size={16} /> {/* Quitamos el margin inline aquí, lo manejaremos con CSS */}
                      <span className="btn-text">Completar</span>
                    </button>
               </div>
           )) : (
             <p style={{textAlign: 'center', color: '#999'}}>No hay tareas disponibles.</p>
           )}
       </div>
      </div>
    </>
  );
};
export default Tasks;