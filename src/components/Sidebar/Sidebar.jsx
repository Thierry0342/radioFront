import React, { useState } from 'react';
import './Sidebar.css';
// 1. Importer NavLink
import { NavLink } from 'react-router-dom'; 
import { 
    FaTruck, FaShoppingCart, FaWarehouse, FaFileAlt, FaChartBar, FaCalendarAlt, FaEnvelope,
    FaChevronLeft, FaChevronRight 
} from 'react-icons/fa';

const navItems = [
    { name: 'DASHBOARD', icon: <FaTruck />, path: '/dashboard' },
    { name: 'DON', icon: <FaShoppingCart />, path: '/saisie-don' },
    { name: 'DONNATEURS', icon: <FaWarehouse />, path: '/donateur' },
    { name: 'TYPE DON', icon: <FaWarehouse />, path: '/type-don' },
    { name: 'STAT', icon: <FaChartBar />, path: '/statistique' },
    { name: 'REPORTS', icon: <FaFileAlt />, path: '/Report' },
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
                <NavLink to="/mail" className="nav-item">
                    <span className="nav-icon"><FaEnvelope /></span> 
                    {!isCollapsed && <span className="link-text">Mail</span>}
                </NavLink>
            </nav>
        </div>
    );
};

export default Sidebar;