import React, { useState } from 'react';
import './Sidebar.css';
import { NavLink } from 'react-router-dom'; 
import { 
    FaThLarge,           // Pour Dashboard
    FaHandHoldingHeart,  // Pour le Don 
    FaUsers,             // Pour les Donateurs
    FaTags,              // Pour les Types de Don
    FaChartLine,         // Pour les Statistiques
    FaFileInvoice,       // Pour les Rapports/Reports
    FaChevronRight,
    FaChevronLeft,
    FaCalendarAlt,
    FaMoneyBill
} from 'react-icons/fa';

// On garde tous les items ici, on les filtrera plus bas selon le rôle
const navItems = [
    { name: 'DASHBOARD', icon: <FaThLarge />, path: '/dashboard' },
    { name: 'DON', icon: <FaHandHoldingHeart />, path: '/saisie-don', requireAdmin: true },
    { name: 'DONNATEURS', icon: <FaUsers />, path: '/donateur' },
    { name: 'TYPE DON', icon: <FaTags />, path: '/type-don', requireAdmin: true },
    { name: 'STAT', icon: <FaChartLine />, path: '/statistique' },
    { name: 'REPORTS', icon: <FaFileInvoice />, path: '/Report' },
];

const Sidebar = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    // 1. Récupérer les informations de l'utilisateur connecté
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const userRole = currentUser?.user?.role || 'CONSULTANT';
    const userName = currentUser?.user?.username || 'Utilisateur';

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };

    // 2. Filtrer le menu principal : si 'requireAdmin' est true, seul l'ADMIN le voit
    const filteredNavItems = navItems.filter(item => {
        if (item.requireAdmin && userRole !== 'ADMIN') {
            return false; // On cache ce menu
        }
        return true; // On affiche le reste
    });

    return (
        <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                {!isCollapsed && <h1 className="logo">RADIO MARIA</h1>}
                <button className="toggle-btn" onClick={toggleSidebar}>
                    {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
                </button>
            </div>

            <div className="sidebar-profile">
                {/* Image par défaut si pas d'avatar */}
                <img 
                    src="/images/radio.jpg"
                    alt={userName} 
                    className="profile-avatar" 
                />
                {!isCollapsed && (
                    <div className="profile-info">
                        <p className="profile-name">{userName}</p>
                        <p className="profile-role" style={{ 
                            color: userRole === 'ADMIN' ? '#48bb78' : '#a0aec0',
                            fontWeight: 'bold',
                            fontSize: '0.8rem'
                        }}>
                            {userRole}
                        </p>
                    </div>
                )}
            </div>

            <nav className="sidebar-nav">
                {!isCollapsed && <p className="nav-title">APPS</p>}
                
                {/* 3. On affiche les items filtrés selon le rôle */}
                {filteredNavItems.map((item, index) => (
                    <NavLink 
                        key={index} 
                        to={item.path} 
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        title={isCollapsed ? item.name : ''}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        {!isCollapsed && <span className="link-text">{item.name}</span>}
                    </NavLink>
                ))}
            </nav>

            <nav className="sidebar-widgets">
                {!isCollapsed && <p className="nav-title">COMPONENTS</p>}
                
                {/* 4. Ces menus sont VISIBLES PAR TOUT LE MONDE (Consultant & Admin) */}
                <NavLink to="/QuickSummary" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <span className="nav-icon"><FaCalendarAlt /></span> 
                    {!isCollapsed && <span className="link-text">Resumé rapide</span>}
                </NavLink>
                
                <NavLink to="/Maharitra" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <span className="nav-icon"><FaMoneyBill /></span> 
                    {!isCollapsed && <span className="link-text">Tolotanana Maharitra</span>}
                </NavLink>
            </nav>
        </div>
    );
};

export default Sidebar;