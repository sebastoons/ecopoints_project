import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PlusCircle, Recycle, Shirt, ShoppingBag, Check } from 'lucide-react';
import Header from '../components/Header'; // Importar

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/tasks/').then(res => setTasks(res.data)).catch(err => console.log(err));
  }, []);

  const getIcon = (title) => {
      if(title.includes('botellas') || title.includes('cajas')) return <Recycle size={24} />;
      if(title.includes('ropa')) return <Shirt size={24} />;
      return <ShoppingBag size={24} />;
  };

  return (
    <>
      <Header title="Tareas" />
      <div className="page-content">
        <div className="tasks-list">
            {tasks.map(task => (
                <div key={task.id} className="card list-item" style={{ padding: '16px', borderRadius: '16px', display:'flex', alignItems:'center' }}>
                    <div className="item-icon" style={{ background: 'var(--primary-light)', borderRadius: '12px', width: '48px', height: '48px', marginRight:'16px' }}>
                            {getIcon(task.title)}
                    </div>
                    <div style={{flex:1}}>
                        <div className="item-title" style={{ fontSize: '1rem' }}>{task.title}</div>
                        <div className="item-subtitle">★ {task.points} Puntos</div>
                    </div>
                    {task.completed ? (
                        <div style={{ color: '#9ca3af', display: 'flex', alignItems: 'center', fontSize: '0.9rem' }}><Check size={16} style={{ marginRight: '4px' }}/> Listo</div>
                    ) : (
                        <button className="btn" style={{ width: 'auto', padding: '8px 16px', background: 'var(--primary-dark)', color: 'white', fontSize: '0.85rem' }}>
                            <PlusCircle size={16} style={{ marginRight: '4px' }}/> Completar
                        </button>
                    )}
                </div>
            ))}
        </div>
      </div>
    </>
  );
};
export default Tasks;