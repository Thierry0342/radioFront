import React, { useState } from 'react';
import './Sidebar.css';
// 1. Importer NavLink
import { NavLink } from 'react-router-dom'; 
import { 
    FaThLarge,           // Pour Dashboard
    FaHandHoldingHeart, // Pour le Don (plus chaleureux)
    FaUsers,            // Pour les Donateurs
    FaTags,             // Pour les Types de Don
    FaChartLine,        // Pour les Statistiques
    FaFileInvoice    ,   // Pour les Rapports/Reports
    FaChevronRight,
    FaChevronLeft,
    FaCalendarAlt,
    FaMoneyBill


} from 'react-icons/fa';

const navItems = [
    { name: 'DASHBOARD', icon: <FaThLarge />, path: '/dashboard' },
    { name: 'DON', icon: <FaHandHoldingHeart />, path: '/saisie-don' },
    { name: 'DONNATEURS', icon: <FaUsers />, path: '/donateur' },
    { name: 'TYPE DON', icon: <FaTags />, path: '/type-don' },
    { name: 'STAT', icon: <FaChartLine />, path: '/statistique' },
    { name: 'REPORTS', icon: <FaFileInvoice />, path: '/Report' },
];

const profile = {
    name: 'Radio Maria',
    role: 'Admin',
    avatar: ''
};

const Sidebar = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };

    return (
        <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                {!isCollapsed && <h1 className="logo">RADIO MARIA</h1>}
                <button className="toggle-btn" onClick={toggleSidebar}>
                    {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
                </button>
            </div>

            <div className="sidebar-profile">
                <img src={profile.avatar} alt={profile.name} className="profile-avatar" />
                {!isCollapsed && (
                    <div className="profile-info">
                        <p className="profile-name">{profile.name}</p>
                        <p className="profile-role">{profile.role}</p>
                    </div>
                )}
            </div>

            <nav className="sidebar-nav">
                {!isCollapsed && <p className="nav-title">APPS</p>}
                {navItems.map((item, index) => (
                    // 2. Remplacer <a> par <NavLink>
                    <NavLink 
                        key={index} 
                        to={item.path} // Utiliser 'to' au lieu de 'href'
                        // 3. Gestion automatique de la classe active
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
                {/* Pour les liens simples, utilisez aussi NavLink ou Link */}
                <NavLink to="/QuickSummary" className="nav-item">
                    <span className="nav-icon"><FaCalendarAlt /></span> 
                    {!isCollapsed && <span className="link-text">Resumé rapide</span>}
                </NavLink>
                <NavLink to="/Maharitra" className="nav-item">
                    <span className="nav-icon"><FaMoneyBill /></span> 
                    {!isCollapsed && <span className="link-text">Tolotanana Maharitra</span>}
                </NavLink>
            </nav>
        </div>
    );
};

export default Sidebar;