import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './TopBar.css';
import { FaSearch, FaBell, FaCog, FaUserCircle, FaListUl, FaSignOutAlt, FaUserCheck } from 'react-icons/fa';
import donService from '../../services/donService'; 
import authService from '../../services/authService'; 

const TopBar = ({ title }) => {
    const navigate = useNavigate();
    
    const [showNotifs, setShowNotifs] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    
    // Récupérer l'utilisateur connecté et son rôle
    const currentUser = authService.getCurrentUser();
    const isAdmin = currentUser?.user?.role === 'ADMIN';

    const [lastSeenId, setLastSeenId] = useState(() => {
        return parseInt(localStorage.getItem('lastSeenDonId')) || 0;
    });

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    // --- Redirection vers l'approbation ---
    const handleApprovalNavigation = () => {
        navigate('/validation-comptes'); // L'URL que nous avons définie dans App.js
    };

    const loadNotifications = async () => {
        try {
            const response = await donService.getAll();
            const allDons = response.data;
            if (allDons && allDons.length > 0) {
                const sortedDons = [...allDons].sort((a, b) => b.idDon - a.idDon);
                const latestDons = sortedDons.slice(0, 5);
                const newDonsCount = sortedDons.filter(d => d.idDon > lastSeenId).length;
                setUnreadCount(newDonsCount);
                const formatted = latestDons.map(don => ({
                    id: don.idDon,
                    message: `${don.nomDonateur} a fait un don de ${don.montant.toLocaleString()} Ar`,
                    type: don.libelleType,
                    isNew: don.idDon > lastSeenId
                }));
                setNotifications(formatted);
            }
        } catch (error) {
            console.error("Erreur chargement notifs:", error);
        }
    };

    useEffect(() => {
        loadNotifications();
        const interval = setInterval(loadNotifications, 15000);
        return () => clearInterval(interval);
    }, [lastSeenId]);

    const handleBellClick = () => {
        setShowNotifs(!showNotifs);
        setShowProfileMenu(false); 
    };

    const handleViewHistory = () => {
        if (notifications.length > 0) {
            const newestId = notifications[0].id;
            localStorage.setItem('lastSeenDonId', newestId);
            setLastSeenId(newestId);
        }
        navigate('/historique', { state: { lastId: lastSeenId } });
        setShowNotifs(false);
        setUnreadCount(0);
    };

    return (
        <header className="topbar">
            <div className="topbar-left">
                <h2 className="topbar-title">{title}</h2>
            </div>

            <div className="topbar-right">
                <div className="search-container">
                    <input type="text" placeholder="Rechercher..." className="search-input" />
                    <FaSearch className="search-icon" />
                </div>

                <div className="icon-group">
                    <div className="notification-container">
                        <FaBell className="topbar-icon" onClick={handleBellClick} />
                        {unreadCount > 0 && (
                            <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                        )}
                        
                        {showNotifs && (
                            <div className="notif-dropdown">
                                <div className="notif-header">
                                    <FaListUl className="me-2" /> Dernières activités
                                </div>
                                <div className="notif-list">
                                    {notifications.length > 0 ? (
                                        notifications.map((n) => (
                                            <div key={n.id} className={`notif-item ${n.isNew ? 'bg-blue-light' : ''}`}>
                                                <div className="notif-info">
                                                    <span className="notif-msg">{n.message}</span>
                                                    <span className="notif-category">{n.type}</span>
                                                </div>
                                                {n.isNew && <span className="dot-new"></span>}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="notif-empty">Aucun don récent</div>
                                    )}
                                </div>
                                <div className="notif-footer" onClick={handleViewHistory}>
                                    Voir tout l'historique
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* --- Icône Paramètres avec accès Approbation --- */}
                    <FaCog 
                        className="topbar-icon" 
                        onClick={isAdmin ? handleApprovalNavigation : () => navigate('/settings')}
                        title={isAdmin ? "Approbation des comptes" : "Paramètres"}
                    />
                </div>

                <div className="admin-profile-container">
                    <div className="admin-profile" onClick={() => {setShowProfileMenu(!showProfileMenu); setShowNotifs(false);}}>
                        <div className="admin-info text-end me-2 d-none d-md-block">
                            <p className="admin-name mb-0">{currentUser?.user?.username || 'Admin'}</p>
                        </div>
                        <FaUserCircle className="admin-avatar-icon" />
                    </div>

                    {showProfileMenu && (
                        <div className="profile-dropdown">
                            <div className="dropdown-item" onClick={() => navigate('/profile')}>
                                <FaUserCircle className="me-2" /> Mon Profil
                            </div>
                            
                            {/* Option d'approbation visible seulement pour l'admin dans le menu profil aussi */}
                            {isAdmin && (
                                <div className="dropdown-item" onClick={handleApprovalNavigation}>
                                    <FaUserCheck className="me-2 text-primary" /> Valider Comptes
                                </div>
                            )}

                            <div className="dropdown-item" onClick={() => navigate('/settings')}>
                                <FaCog className="me-2" /> Paramètres
                            </div>
                            <hr />
                            <div className="dropdown-item logout-item" onClick={handleLogout}>
                                <FaSignOutAlt className="me-2" /> Déconnexion
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default TopBar;