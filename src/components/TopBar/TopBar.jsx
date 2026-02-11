import React from 'react';
import './TopBar.css';
import { FaSearch, FaBell, FaCog, FaUserCircle } from 'react-icons/fa';

const TopBar = ({ title }) => {
    return (
        <header className="topbar">
            {/* Titre dynamique de la page */}
            <h2 className="topbar-title">{title}</h2>

            <div className="topbar-right">
                {/* Barre de Recherche */}
                <div className="search-container">
                    <input type="text" placeholder="Search" className="search-input" />
                    <FaSearch className="search-icon" />
                </div>

                {/* Icônes de Notification/Paramètres */}
                <div className="icon-group">
                    <FaBell className="topbar-icon" />
                    <FaCog className="topbar-icon" />
                </div>

                {/* Profil de l'administrateur */}
                <div className="admin-profile">
                    <span className="admin-name">admin@domain.com</span>
                    <FaUserCircle className="admin-avatar-icon" />
                </div>
            </div>
        </header>
    );
};

export default TopBar;