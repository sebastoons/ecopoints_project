import React, { useEffect, useState } from 'react';
import api from '../api';
import { Globe, Cloud, CheckCircle, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Header from '../components/Header';

const Dashboard = () => {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    const user = localStorage.getItem('user');
    // Enviamos el usuario para obtener SUS datos
    api.get(`/api/dashboard/?username=${user}`)
         .then(res => setData(res.data))
         .catch(err => {
            console.error("Error cargando dashboard:", err);
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

        <div className="card">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '15px' }}>Impacto Semanal</h3>
            <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%" debounce={50}>
                    <BarChart data={data.weekly_data} barGap={8}>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                        <Bar dataKey="points" fill="#eb7856" radius={[4, 4, 0, 0]} barSize={16} name="Puntos" />
                        <Bar dataKey="co2" fill="#4ade80" radius={[4, 4, 0, 0]} barSize={16} name="CO2" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>
    </>
  );
};
export default Dashboard;