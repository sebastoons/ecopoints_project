import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, ListChecks, PlusCircle, Trophy, User, LayoutDashboard, Users, ListTodo, Shield } from 'lucide-react';
import Login from './pages/Login';
import Register from './pages/Register';
import Recovery from './pages/Recovery';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Ranking from './pages/Ranking';
import Profile from './pages/Profile';
import AddCustomTask from './pages/AddCustomTask';
// Nuevas Vistas Admin
import AdminDashboard from './pages/AdminDashboard';
import AdminTasks from './pages/AdminTasks';
import AdminUsers from './pages/AdminUsers';

import { ToastProvider, useToast } from './context/ToastContext';
import './App.css';

// --- COMPONENTE DE CIERRE AUTOMÁTICO (SEGURIDAD) ---
const AutoLogoutHandler = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();

    useEffect(() => {
        let timer;

        const logout = () => {
            // Limpiamos credenciales
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            localStorage.removeItem('isAdmin');
            
            showToast("Sesión cerrada por inactividad (15 min)", "info");
            navigate('/');
        };

        const resetTimer = () => {
            if (timer) clearTimeout(timer);
            
            // Solo activamos el timer si hay un usuario logueado (tiene token)
            if (localStorage.getItem('token')) {
                // 15 minutos = 15 * 60 * 1000 milisegundos
                timer = setTimeout(logout, 15 * 60 * 1000); 
            }
        };

        const handleActivity = () => resetTimer();

        // Eventos que consideramos "actividad"
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

        // Escuchamos los eventos
        events.forEach(event => window.addEventListener(event, handleActivity));
        
        // Iniciamos el timer al montar
        resetTimer();

        // Limpieza al desmontar
        return () => {
            if (timer) clearTimeout(timer);
            events.forEach(event => window.removeEventListener(event, handleActivity));
        };
    }, [navigate, showToast]); // Dependencias correctas

    return null; 
};

// --- BARRA DE NAVEGACIÓN ---
const BottomNav = () => {
  const location = useLocation();
  const hideNavPaths = ['/', '/register', '/recovery'];
  const isAdmin = localStorage.getItem('isAdmin') === 'true'; // Verificamos si es admin
  
  if (hideNavPaths.includes(location.pathname)) return null;

  // --- MENÚ PARA ADMINISTRADOR ---
  if (isAdmin) {
      return (
        <div className="bottom-nav">
          <Link to="/admin-dashboard" className={`nav-item ${location.pathname === '/admin-dashboard' ? 'active' : ''}`}>
            <LayoutDashboard size={24} /> <span>Panel</span>
          </Link>
          <Link to="/admin-tasks" className={`nav-item ${location.pathname === '/admin-tasks' ? 'active' : ''}`}>
            <ListTodo size={24} /> <span>Tareas</span>
          </Link>
          <Link to="/admin-users" className={`nav-item ${location.pathname === '/admin-users' ? 'active' : ''}`}>
            <Users size={24} /> <span>Usuarios</span>
          </Link>
          <Link to="/ranking" className={`nav-item ${location.pathname === '/ranking' ? 'active' : ''}`}>
            <Trophy size={24} /> <span>Global</span>
          </Link>
          <Link to="/profile" className={`nav-item ${location.pathname === '/profile' ? 'active' : ''}`}>
            <User size={24} /> <span>Perfil</span>
          </Link>
        </div>
      );
  }

  // --- MENÚ PARA USUARIO NORMAL ---
  return (
    <div className="bottom-nav">
      <Link to="/dashboard" className={`nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}>
        <Home size={24} /> <span>Inicio</span>
      </Link>
      <Link to="/tasks" className={`nav-item ${location.pathname === '/tasks' ? 'active' : ''}`}>
        <ListChecks size={24} /> <span>Tareas</span>
      </Link>
      
      {/* Botón Central para Usuario */}
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
    const containerClass = isAuthPage ? 'auth-mode' : 'app-mode with-nav';

    return (
        <div className={`app-container ${containerClass}`}>
            <AutoLogoutHandler /> {/* Inyectamos el vigilante de inactividad */}
            
            <Routes>
                {/* Públicas */}
                <Route path="/" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/recovery" element={<Recovery />} />
                
                {/* Rutas Protegidas - Usuario Normal */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/ranking" element={<Ranking />} />
                <Route path="/add" element={<AddCustomTask />} /> 
                <Route path="/profile" element={<Profile />} />
                
                {/* Rutas Protegidas - Administrador */}
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                <Route path="/admin-tasks" element={<AdminTasks />} />
                <Route path="/admin-users" element={<AdminUsers />} />
            </Routes>
            
            <BottomNav />
        </div>
    );
};

function App() {
  return (
    <ToastProvider> 
      <Router>
        <AppContent />
      </Router>
    </ToastProvider>
  );
}
export default App;