import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Globe, Cloud, CheckCircle, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Header from '../components/Header';

const Dashboard = () => {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    // Intentamos cargar datos del backend
    axios.get('http://127.0.0.1:8000/api/dashboard/')
         .then(res => setData(res.data))
         .catch(err => {
            console.log("Usando datos de respaldo por error de conexión:", err);
            // Datos fallback para que no se rompa si el backend falla
            setData({
                points: 0, 
                co2: 0, 
                level: "Cargando...", 
                progress: 0,
                weekly_data: []
            });
         });
  }, []);

  if (!data) return <div className="page-content">Cargando...</div>;

  return (
    <>
      <Header />
      <div className="page-content">
        <div className="section-title" style={{justifyContent: 'space-between'}}>
          <span>Tus Logros</span> <CheckCircle color="#9ca3af" />
        </div>

        {/* Tarjeta de Estadísticas */}
        <div className="card">
            <div className="stats-row">
            <div className="stat-item">
                <Globe color="var(--primary)" size={32} style={{ marginBottom: '8px' }} />
                <span className="stat-number">{data.points}</span>
                <span style={{ fontSize: '0.8rem', color: '#666' }}>Puntos Planeta</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
                <Cloud color="var(--primary)" size={32} style={{ marginBottom: '8px' }} />
                <span className="stat-number">{data.co2}</span>
                <span style={{ fontSize: '0.8rem', color: '#666' }}>CO2 Evitado (kg)</span>
            </div>
            </div>
            <div>
            <div style={{ fontSize: '0.9rem', color: '#555' }}>Progreso del Mes:</div>
            <div className="progress-container">
                <div className="progress-bar" style={{ width: `${data.progress}%` }}></div>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize: '0.8rem', color: '#999' }}>
                <span>0%</span><span>{data.progress}%</span>
            </div>
            </div>
            <div style={{ marginTop: '15px' }}><span className="level-badge">Nivel: {data.level}</span></div>
        </div>

        {/* Gráfico de Impacto (CORREGIDO) */}
        <div className="card">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '15px' }}>Impacto Semanal</h3>
            
            {/* Usamos la clase CSS chart-container para forzar dimensiones */}
            <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%" debounce={50}>
                    <BarChart data={data.weekly_data} barGap={8}>
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 12, fill: '#9ca3af' }} 
                        />
                        <Tooltip 
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                        />
                        <Bar dataKey="points" fill="#eb7856" radius={[4, 4, 0, 0]} barSize={16} name="Puntos" />
                        <Bar dataKey="co2" fill="#4ade80" radius={[4, 4, 0, 0]} barSize={16} name="CO2" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Tareas Pendientes */}
        <div className="card" style={{ padding: '0' }}>
            <div style={{ padding: '20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Tareas Pendientes</h3>
                <div style={{ color: 'var(--primary)', fontSize: '0.9rem', cursor: 'pointer', display:'flex', alignItems:'center' }}>
                    Ver todas <ArrowRight size={16} style={{ marginLeft: '4px' }}/>
                </div>
            </div>
            <div style={{paddingBottom: '10px'}}>
                <div className="list-item" style={{padding: '10px 20px'}}>
                    <div className="item-icon" style={{width:'32px', height:'32px'}}><Globe size={18} /></div>
                    <div className="item-content"><div className="item-title" style={{fontSize:'0.9rem'}}>Reciclar botellas</div></div>
                    <span style={{ background: '#f3f4f6', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>Fácil</span>
                </div>
                <div className="list-item" style={{padding: '10px 20px'}}>
                    <div className="item-icon" style={{width:'32px', height:'32px'}}><Cloud size={18} /></div>
                    <div className="item-content"><div className="item-title" style={{fontSize:'0.9rem'}}>Separar cartón</div></div>
                    <span style={{ background: '#f3f4f6', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>Fácil</span>
                </div>
            </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;