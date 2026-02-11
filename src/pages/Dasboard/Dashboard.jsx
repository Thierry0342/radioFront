import React, { useState, useEffect } from 'react';
import StatsCard from '../../components/Dashboard/StatsCard';
import donService from '../../services/donService';
import { 
    FaEuroSign, 
    FaUsers, 
    FaCalendarAlt, 
    FaHandHoldingHeart,
    FaChartLine,
    FaClock,
    FaSmile
} from 'react-icons/fa';
import './Dashboard.css';

// =========================================================================
// FONCTIONS UTILITAIRES POUR L'AFFICHAGE
// =========================================================================

/**
 * Attribue une icône en fonction du libellé du type de don.
 */
const getIconForType = (typeLibelle) => {
    if (!typeLibelle) return <FaEuroSign />;
    
    const libelleLower = typeLibelle.toLowerCase();

    if (libelleLower.includes('mensuel') || libelleLower.includes('maharitra')) {
        return <FaCalendarAlt />;
    }
    if (libelleLower.includes('ponctuel') || libelleLower.includes('unique')) {
        return <FaHandHoldingHeart />;
    }
    // Icône par défaut pour tout autre type
    return <FaEuroSign />;
};

/**
 * Attribue un thème de couleur cyclique aux cartes.
 */
const getThemeForIndex = (index) => {
    // Liste des thèmes disponibles dans votre CSS
    const themes = ['blue', 'red', 'purple', 'dark-blue', 'green-light', 'orange-light', 'teal-light', 'red-light'];
    return themes[index % themes.length];
};


// =========================================================================
// COMPOSANT PRINCIPAL
// =========================================================================

const Dashboard = () => {
    const [dynamicStats, setDynamicStats] = useState([]);
    const [otherStats, setOtherStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // 1. Récupération des statistiques par Type de Don (dynamique)
                const response = await donService.getDonStatsByType();
                
                const fetchedStats = response.data.map((stat, index) => ({
                    // Le titre est généré à partir du libellé du type de don
                    title: `Total ${stat.title}`, 
                    // Formater la valeur monétaire
                    value: `€${parseFloat(stat.totalMontant).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, 
                    subtitle: `(${stat.totalDons} dons)`,
                    icon: getIconForType(stat.title),
                    theme: getThemeForIndex(index) 
                }));
                
                setDynamicStats(fetchedStats);

                // 2. Définition des autres métriques (statiques ou calculées localement)
                // Ces métriques nécessiteraient d'autres appels API pour être vraiment dynamiques.
                // Pour l'exemple, elles sont statiques :
                setOtherStats([
                    { title: 'Total Donateurs Actifs', value: '4.2K', icon: <FaUsers />, theme: 'green-light' },
                    { title: 'Paiements Mensuels en Attente', value: '25', icon: <FaClock />, theme: 'orange-light' },
                    { title: 'Progression Annuelle', value: '+12%', icon: <FaChartLine />, theme: 'teal-light' },
                    { title: 'Taux de Fidélité', value: '98%', icon: <FaSmile />, theme: 'blue-light' },
                ]);

                setError(null);

            } catch (err) {
                console.error("Erreur lors du chargement des statistiques de dons:", err);
                setError("Impossible de charger les statistiques. Vérifiez le serveur et l'API.");
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []); 
    
    return (
        <>
            <h2 className="welcome-message">Bienvenue, Valerie. 👋</h2>
            
            <h3 className="section-title" style={{ marginTop: '20px' }}>
                📊 Statistiques par Type de Don
            </h3>

            {loading && (
                <div className="stats-grid">
                    <p>Chargement des données...</p>
                </div>
            )}
            
            {error && (
                <div className="stats-grid">
                    <p className="error-message" style={{ color: 'red' }}>{error}</p>
                </div>
            )}

            {/* Grille supérieure (Dons par Type, chargés dynamiquement) */}
            {!loading && dynamicStats.length > 0 && (
                <div className="stats-grid">
                    {dynamicStats.slice(0, 4).map((stat, index) => (
                        // Utilise l'ID du type de don comme clé si disponible, sinon l'index
                        <StatsCard key={stat.idType || index} {...stat} />
                    ))}
                </div>
            )}
            
            {/* Si plus de 4 types de dons, ils pourraient continuer ici. */}
            {/* Grille inférieure (Autres Métriques Clés, actuellement statiques) */}
            {!loading && otherStats.length > 0 && (
                <div className="stats-grid" style={{ marginTop: '20px' }}>
                    {otherStats.map((stat, index) => (
                        <StatsCard key={`other-${index}`} {...stat} /> 
                    ))}
                </div>
            )}
            
            {/* SECTION: Liste des Dernières Transactions */}
            <div style={{ marginTop: '40px', marginBottom: '40px' }}>
                <h3 className="section-title">Liste des Dernières Transactions</h3>
                <div className="card-container">
                    {/* Le composant de la table des derniers dons ira ici */}
                    <p style={{ padding: '20px', border: '1px solid #eee', borderRadius: '8px', textAlign: 'center' }}>
                        [Composant `RecentDonsTable` à implémenter ici]
                    </p>
                </div>
            </div>
        </>
    );
};

export default Dashboard;