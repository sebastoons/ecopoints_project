import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, ListChecks, PlusCircle, Trophy, User } from 'lucide-react';
import Login from './pages/Login';
import Register from './pages/Register';
import Recovery from './pages/Recovery';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Ranking from './pages/Ranking';
import Profile from './pages/Profile';
import AddCustomTask from './pages/AddCustomTask'; // <--- IMPORTAR NUEVA PÁGINA
import './App.css';

const BottomNav = () => {
  const location = useLocation();
  const hideNavPaths = ['/', '/register', '/recovery'];
  
  if (hideNavPaths.includes(location.pathname)) return null;

  return (
    <div className="bottom-nav">
      <Link to="/dashboard" className={`nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}>
        <Home size={24} /> <span>Inicio</span>
      </Link>
      <Link to="/tasks" className={`nav-item ${location.pathname === '/tasks' ? 'active' : ''}`}>
        <ListChecks size={24} /> <span>Tareas</span>
      </Link>
      
      {/* Botón Central Actualizado: Lleva a /add */}
      <Link to="/add" className="nav-item">
        <div className="nav-fab">
          <PlusCircle size={32} />
        </div>
      </Link>

      <Link to="/ranking" className={`nav-item ${location.pathname === '/ranking' ? 'active' : ''}`}>
        <Trophy size={24} /> <span>Ranking</span>
      </Link>
      <Link to="/profile" className={`nav-item ${location.pathname === '/profile' ? 'active' : ''}`}>
        <User size={24} /> <span>Perfil</span>
      </Link>
    </div>
  );
};

const AppContent = () => {
    const location = useLocation();
    const isAuthPage = ['/', '/register', '/recovery'].includes(location.pathname);

    return (
        <div className={`app-container ${!isAuthPage ? 'with-nav' : ''}`}>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/recovery" element={<Recovery />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/ranking" element={<Ranking />} />
                
                {/* Nueva Ruta para el botón + */}
                <Route path="/add" element={<AddCustomTask />} /> 
                
                <Route path="/profile" element={<Profile />} />
            </Routes>
            <BottomNav />
        </div>
    );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;