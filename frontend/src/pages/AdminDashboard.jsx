import React, { useEffect, useState } from 'react';
import api from '../api';
import Header from '../components/Header';
import { Globe, Cloud, BarChart2 } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  Legend 
} from 'recharts';

const AdminDashboard = () => {
  const [data, setData] = useState({ total_points: 0, total_co2: 0, chart_data: [] });

  useEffect(() => {
    api.get('/api/admin/dashboard/')
       .then(res => setData(res.data))
       .catch(err => console.error("Error cargando dashboard admin:", err));
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

        {/* GRÁFICO DE ACTIVIDAD (DOBLE BARRA) */}
        <div className="card">
            <div className="section-title" style={{fontSize:'1.1rem'}}>
                <BarChart2 size={20}/> Impacto Diario (Puntos vs CO2)
            </div>
            <div className="chart-container" style={{height:'350px'}}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.chart_data} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{fontSize: 12}} />
                        
                        {/* EJE Y IZQUIERDO (Puntos) */}
                        <YAxis yAxisId="left" orientation="left" stroke="var(--primary)" fontSize={12} />
                        
                        {/* EJE Y DERECHO (CO2) */}
                        <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" fontSize={12} />
                        
                        <Tooltip 
                            contentStyle={{borderRadius:'8px', border:'none', boxShadow:'0 4px 10px rgba(0,0,0,0.1)'}}
                            cursor={{fill: 'transparent'}}
                        />
                        <Legend />
                        
                        {/* BARRA 1: Puntos (Vinculada al eje izquierdo) */}
                        <Bar 
                            yAxisId="left"
                            dataKey="points" 
                            name="Puntos" 
                            fill="var(--primary)" 
                            radius={[4, 4, 0, 0]} 
                            barSize={20} 
                        />
                        
                        {/* BARRA 2: CO2 (Vinculada al eje derecho) */}
                        <Bar 
                            yAxisId="right"
                            dataKey="co2" 
                            name="CO2 (kg)" 
                            fill="#3b82f6" 
                            radius={[4, 4, 0, 0]} 
                            barSize={20} 
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <p style={{textAlign:'center', fontSize:'0.8rem', color:'#999', marginTop:'15px'}}>
                Comparativa de los últimos 7 días
            </p>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;