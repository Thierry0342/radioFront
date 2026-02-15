import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Important pour la navigation
import './TopBar.css';
import { FaSearch, FaBell, FaCog, FaUserCircle, FaListUl } from 'react-icons/fa';
import donService from '../../services/donService'; 

const TopBar = ({ title }) => {
    const navigate = useNavigate();
    
    const [showNotifs, setShowNotifs] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    
    // On stocke l'ID du dernier don consulté (pour savoir ce qui est "nouveau")
    const [lastSeenId, setLastSeenId] = useState(() => {
        return parseInt(localStorage.getItem('lastSeenDonId')) || 0;
    });

    const loadNotifications = async () => {
        try {
            const response = await donService.getAll();
            const allDons = response.data;

            if (allDons && allDons.length > 0) {
                // Tri décroissant (plus récent en premier)
                const sortedDons = [...allDons].sort((a, b) => b.idDon - a.idDon);
                const latestDons = sortedDons.slice(0, 5);
                const currentLatestId = sortedDons[0].idDon;

                // Calculer le nombre de dons plus grands que le dernier vu
                const newDonsCount = sortedDons.filter(d => d.idDon > lastSeenId).length;
                setUnreadCount(newDonsCount);

                // Formater pour l'affichage
                const formatted = latestDons.map(don => ({
                    id: don.idDon,
                    message: `${don.nomDonateur} a fait un don de ${don.montant.toLocaleString()} Ar`,
                    type: don.libelleType,
                    isNew: don.idDon > lastSeenId // Marqueur pour le style
                }));

                setNotifications(formatted);
            }
        } catch (error) {
            console.error("Erreur chargement notifs:", error);
        }
    };

    useEffect(() => {
        loadNotifications();
        const interval = setInterval(loadNotifications, 15000); // Check toutes les 15s
        return () => clearInterval(interval);
    }, [lastSeenId]); // Relance si l'ID vu change

    const handleBellClick = () => {
        setShowNotifs(!showNotifs);
        // On ne remet pas le compteur à 0 tout de suite, seulement quand on va voir l'historique
        // ou on peut le faire ici si tu préfères.
    };

    const handleViewHistory = () => {
        // 1. On sauvegarde l'ID le plus récent comme étant "vu"
        if (notifications.length > 0) {
            const newestId = notifications[0].id;
            localStorage.setItem('lastSeenDonId', newestId);
            setLastSeenId(newestId);
        }
        
        // 2. On redirige vers l'historique en passant l'ancien ID pour le surlignage
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
                                {/* Le bouton qui redirige */}
                                <div className="notif-footer" onClick={handleViewHistory}>
                                    Voir tout l'historique
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <FaCog className="topbar-icon" />
                </div>

                <div className="admin-profile">
                    <div className="admin-info text-end me-2 d-none d-md-block">
                        <p className="admin-name mb-0">Admin</p>
                    </div>
                    <FaUserCircle className="admin-avatar-icon" />
                </div>
            </div>
        </header>
    );
};

export default TopBar;