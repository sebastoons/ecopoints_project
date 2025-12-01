import React, { useEffect, useState } from 'react';
import { Globe, Cloud, CheckCircle, ArrowRight, PlayCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Header from '../components/Header';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api'; // Usamos nuestra api configurada

const Dashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  
  // Obtenemos el usuario real logueado
  const currentUserEmail = localStorage.getItem('user');

  useEffect(() => {
    if (!currentUserEmail) {
        navigate('/');
        return;
    }

    // Petición al backend enviando el usuario
    api.get(`/api/dashboard/?username=${currentUserEmail}`)
         .then(res => setData(res.data))
         .catch(err => {
            console.error(err);
            // Fallback en caso de error
            setData({ points: 0, co2: 0, level: "Cargando...", progress: 0, weekly_data: [] });
         });
  }, [currentUserEmail, navigate]);

  if (!data) return <div className="page-content">Cargando estadísticas...</div>;

  // Si tiene 0 puntos, es usuario nuevo (o sin actividad)
  const isNewUser = data.points === 0;

  return (
    <>
      <Header />
      <div className="page-content">
        <div className="section-title" style={{justifyContent: 'space-between'}}>
          <span>{isNewUser ? '¡Hola, Reciclador!' : 'Tus Logros'}</span> 
          <CheckCircle color="#9ca3af" />
        </div>

        {/* --- TARJETA DE ESTADÍSTICAS --- */}
        {/* Siempre visible, pero con "0" si es nuevo */}
        <div className="card">
            <div className="stats-row">
            <div className="stat-item">
                <Globe color="var(--primary)" size={32} style={{ marginBottom: '8px' }} />
                <span className="stat-number">{data.points}</span>
                {/* CAMBIO: Nombre oficial EcoPoints */}
                <span style={{ fontSize: '0.8rem', color: '#666' }}>EcoPoints</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
                <Cloud color="var(--primary)" size={32} style={{ marginBottom: '8px' }} />
                <span className="stat-number">{data.co2}</span>
                <span style={{ fontSize: '0.8rem', color: '#666' }}>CO2 Evitado (kg)</span>
            </div>
            </div>
            
            {/* Barra de progreso: Mostrar incluso si es 0% para motivar */}
            <div>
            <div style={{ fontSize: '0.9rem', color: '#555', marginBottom:'5px' }}>
                Nivel Actual: <span style={{fontWeight:'bold', color:'var(--primary-dark)'}}>{data.level}</span>
            </div>
            <div className="progress-container">
                <div className="progress-bar" style={{ width: `${data.progress}%` }}></div>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize: '0.8rem', color: '#999' }}>
                <span>Progreso Nivel</span><span>{data.progress}%</span>
            </div>
            </div>
        </div>

        {/* --- GRÁFICO O MENSAJE DE BIENVENIDA --- */}
        {isNewUser ? (
            // Mensaje para usuarios con 0 puntos (Oculta gráfico)
            <div className="card" style={{textAlign: 'center', padding: '30px 20px', backgroundColor: 'var(--primary-light)', border: '1px solid var(--primary)'}}>
                <div style={{background: 'white', width: '60px', height: '60px', borderRadius: '50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 15px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)'}}>
                    <PlayCircle size={32} color="var(--primary)"/>
                </div>
                <h3 style={{margin: '0 0 10px 0', color: 'var(--primary-dark)', fontSize: '1.1rem'}}>Empieza a sumar EcoPoints</h3>
                <p style={{color: '#555', fontSize: '0.9rem', marginBottom: '20px', lineHeight:'1.5'}}>
                    Tu gráfico de impacto aparecerá aquí cuando completes tu primera tarea.
                </p>
                <Link to="/tasks" className="btn btn-primary" style={{width: 'auto', display: 'inline-flex', padding: '10px 25px'}}>
                    Comenzar Ahora
                </Link>
            </div>
        ) : (
            // Gráfico para usuarios con actividad
            <div className="card">
                <h3 style={{ fontSize: '1.1rem', marginBottom: '15px' }}>Tu Impacto Semanal</h3>
                <div className="chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.weekly_data} barGap={8}>
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                            <Bar dataKey="points" fill="#eb7856" radius={[4, 4, 0, 0]} barSize={16} name="EcoPoints" />
                            <Bar dataKey="co2" fill="#4ade80" radius={[4, 4, 0, 0]} barSize={16} name="CO2" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        )}

        {/* Tareas Sugeridas */}
        <div className="card" style={{ padding: '0' }}>
            <div style={{ padding: '20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Tareas Disponibles</h3>
                <Link to="/tasks" style={{ color: 'var(--primary)', fontSize: '0.9rem', cursor: 'pointer', display:'flex', alignItems:'center', textDecoration: 'none' }}>
                    Ver todas <ArrowRight size={16} style={{ marginLeft: '4px' }}/>
                </Link>
            </div>
            <div style={{paddingBottom: '10px'}}>
                <div className="list-item" style={{padding: '10px 20px'}}>
                    <div className="item-icon" style={{width:'32px', height:'32px'}}><Globe size={18} /></div>
                    <div className="item-content">
                        <div className="item-title" style={{fontSize:'0.9rem'}}>Reciclar botellas</div>
                        <div className="item-subtitle" style={{fontSize:'0.8rem', color: '#666'}}>Plástico PET</div>
                    </div>
                    <span style={{ background: '#f3f4f6', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight:'600', color:'var(--primary)' }}>+10 pts</span>
                </div>
            </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;