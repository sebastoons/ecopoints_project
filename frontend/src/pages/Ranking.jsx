import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Filter } from 'lucide-react';
import Header from '../components/Header'; // Importar

const Ranking = () => {
    const [users, setUsers] = useState([]);
    useEffect(() => {
        axios.get('http://127.0.0.1:8000/api/ranking/').then(res => setUsers(res.data)).catch(err => console.log(err));
    }, []);

    return (
        <>
            <Header title="Ranking Global" />
            <div className="page-content">
                <div style={{display:'flex', justifyContent:'flex-end', marginBottom:'10px'}}>
                    <Filter size={20} color="#9ca3af" style={{ cursor: 'pointer' }}/>
                </div>
                <div className="ranking-list">
                    {users.map((user, index) => (
                        <div key={user.id} className="card list-item" style={{ padding: '12px 16px', borderRadius: '16px', marginBottom: '10px' }}>
                            <div className="ranking-pos">{index + 1}</div>
                            <div style={{ margin: '0 10px', fontSize: '1.2rem', minWidth:'25px', textAlign:'center' }}>
                                {index === 0 && '🏆'} {index === 1 && '🥈'} {index === 2 && '🥉'} {index > 2 && '⭐'}
                            </div>
                            <div className="avatar"><img src={`https://ui-avatars.com/api/?name=${user.name}&background=random`} alt={user.name} /></div>
                            <div className="item-content">
                                <div className="item-title">{user.name}</div>
                                <div className="item-subtitle">{user.points.toLocaleString()} EcoPoints</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};
export default Ranking;