import React, { useEffect, useState } from 'react';
import api from '../api';
import Header from '../components/Header';
import { Globe, Cloud, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

const AdminDashboard = () => {
  const [data, setData] = useState({ total_points: 0, total_co2: 0, chart_data: [] });

  useEffect(() => {
    api.get('/api/admin/dashboard/')
       .then(res => setData(res.data))
       .catch(err => console.error(err));
  }, []);

  return (
    <>
      <Header title="Dashboard Global" />
      <div className="page-content">
        
        {/* TARJETAS DE TOTALES */}
        <div className="stats-row">
            <div className="card stat-item" style={{marginRight:'10px', padding:'20px'}}>
                <Globe size={32} color="var(--primary)" />
                <span className="stat-number">{data.total_points.toLocaleString()}</span>
                <span style={{fontSize:'0.8rem', color:'#666'}}>Puntos Totales</span>
            </div>
            <div className="card stat-item" style={{marginLeft:'10px', padding:'20px'}}>
                <Cloud size={32} color="#3b82f6" />
                <span className="stat-number">{data.total_co2}kg</span>
                <span style={{fontSize:'0.8rem', color:'#666'}}>CO2 Evitado</span>
            </div>
        </div>

        {/* GRÁFICO DE ACTIVIDAD */}
        <div className="card">
            <div className="section-title" style={{fontSize:'1.1rem'}}>
                <BarChart2 size={20}/> Métricas Diarias (Últimos 7 días)
            </div>
            <div className="chart-container" style={{height:'300px'}}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.chart_data} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{fontSize: 12}} />
                        <YAxis tick={{fontSize: 12}} />
                        <Tooltip 
                            contentStyle={{borderRadius:'8px', border:'none', boxShadow:'0 4px 10px rgba(0,0,0,0.1)'}}
                            cursor={{fill: 'transparent'}}
                        />
                        <Legend />
                        {/* Barra de Puntos */}
                        <Bar dataKey="points" name="Puntos Generados" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={20} />
                        {/* Barra de CO2 */}
                        <Bar dataKey="co2" name="CO2 Evitado (kg)" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <p style={{textAlign:'center', fontSize:'0.8rem', color:'#999', marginTop:'10px'}}>
                Comparativa de impacto global diario
            </p>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;