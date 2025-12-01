import React, { useState, useEffect } from 'react';
import { Filter, Trophy, Medal } from 'lucide-react';
import Header from '../components/Header';
import api from '../api';

const Ranking = () => {
    const [users, setUsers] = useState([]);
    // Ahora esta variable SÍ se utiliza para identificar al usuario logueado
    const currentUserEmail = localStorage.getItem('user');

    useEffect(() => {
        api.get('/api/ranking/')
           .then(res => setUsers(res.data))
           .catch(err => console.log(err));
    }, []);

    const getRankIcon = (index) => {
        if (index === 0) return <Trophy size={24} color="#FFD700" />; // Oro
        if (index === 1) return <Medal size={24} color="#C0C0C0" />;  // Plata
        if (index === 2) return <Medal size={24} color="#CD7F32" />;  // Bronce
        return <span style={{fontWeight:'bold', color:'#666'}}>#{index + 1}</span>;
    };

    return (
        <>
            <Header title="Ranking Global" />
            <div className="page-content">
                <div style={{display:'flex', justifyContent:'flex-end', marginBottom:'15px'}}>
                    <div style={{fontSize:'0.9rem', color:'#666', display:'flex', alignItems:'center', gap:'5px'}}>
                        <Filter size={16} /> Top Recicladores
                    </div>
                </div>

                <div className="ranking-list">
                    {users.map((user, index) => {
                        // AQUÍ CORREGIMOS EL ERROR: Usamos la variable para comparar
                        const isMe = user.username === currentUserEmail;

                        return (
                            <div key={user.id} className="card list-item" 
                                 style={{ 
                                     padding: '15px', 
                                     borderRadius: '16px', 
                                     marginBottom: '10px',
                                     display: 'flex',
                                     alignItems: 'center',
                                     // Estilo condicional si soy yo
                                     border: isMe ? '2px solid var(--primary)' : '1px solid #f0f0f0',
                                     backgroundColor: isMe ? 'var(--primary-light)' : 'white',
                                     transform: isMe ? 'scale(1.02)' : 'none',
                                     transition: 'all 0.2s'
                                 }}>
                                
                                <div style={{width:'40px', display:'flex', justifyContent:'center'}}>
                                    {getRankIcon(index)}
                                </div>

                                <div className="avatar" style={{margin:'0 15px'}}>
                                    <img 
                                        src={`https://ui-avatars.com/api/?name=${user.name}&background=random&color=fff`} 
                                        alt={user.name} 
                                    />
                                </div>

                                <div className="item-content" style={{flex:1}}>
                                    <div className="item-title" style={{fontWeight:'bold', color: isMe ? 'var(--primary-dark)' : 'var(--text-main)'}}>
                                        {user.name} {isMe && '(Tú)'}
                                    </div>
                                    <div className="item-subtitle" style={{fontSize:'0.85rem', color:'#666'}}>
                                        {user.level || 'Eco-Iniciado'}
                                    </div>
                                </div>

                                <div style={{fontWeight:'bold', color:'var(--primary)', fontSize:'1.1rem'}}>
                                    {user.points} <span style={{fontSize:'0.7rem'}}>pts</span>
                                </div>
                            </div>
                        );
                    })}
                    
                    {users.length === 0 && (
                        <div style={{textAlign:'center', padding:'20px', color:'#666'}}>
                            Cargando ranking...
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};
export default Ranking;