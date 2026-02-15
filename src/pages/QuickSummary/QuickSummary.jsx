import React, { useState, useEffect } from 'react';
import donService from '../../services/donService';
import { FaWallet, FaUsers, FaLayerGroup, FaClock, FaTag } from 'react-icons/fa';
import './QuickSummary.css';

const QuickSummary = () => {
    const [data, setData] = useState({
        totalGlobal: 0,
        totalDonateurs: 0,
        groupes: [], // Contiendra tous les types détectés
        loading: true
    });

    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        const fetchDynamicStats = async () => {
            try {
                const res = await donService.getAll();
                // 1. Filtrer les dons du jour
                const todayDons = res.data.filter(d => d.dateDon && d.dateDon.startsWith(today));

                // 2. Calculer le total global
                const global = todayDons.reduce((sum, d) => {
                    const val = parseFloat(String(d.montant).replace(/\s/g, '').replace(',', '.')) || 0;
                    return sum + val;
                }, 0);

                // 3. Grouper par type de façon dynamique
                const analyzeTypes = todayDons.reduce((acc, d) => {
                    const typeName = (d.libelleType || "NON DÉFINI").toUpperCase();
                    const val = parseFloat(String(d.montant).replace(/\s/g, '').replace(',', '.')) || 0;

                    if (!acc[typeName]) {
                        acc[typeName] = { total: 0, count: 0 };
                    }
                    acc[typeName].total += val;
                    acc[typeName].count += 1;
                    return acc;
                }, {});

                // Convertir l'objet en tableau pour le map()
                const groupesArray = Object.keys(analyzeTypes).map(name => ({
                    name,
                    total: analyzeTypes[name].total,
                    count: analyzeTypes[name].count
                }));

                setData({
                    totalGlobal: global,
                    totalDonateurs: todayDons.length,
                    groupes: groupesArray,
                    loading: false
                });
            } catch (err) {
                console.error("Erreur:", err);
                setData(s => ({ ...s, loading: false }));
            }
        };

        fetchDynamicStats();
        const timer = setInterval(fetchDynamicStats, 30000);
        return () => clearInterval(timer);
    }, [today]);

    if (data.loading) return <div className="loader">Analyse des dons du jour...</div>;

    return (
        <div className="summary-page">
            <div className="summary-header">
                <h1>Tableau de Bord Live</h1>
                <div className="date-badge">
                    <FaClock /> {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                </div>
            </div>

            {/* --- LIGNE DU HAUT : RÉSUMÉ GLOBAL --- */}
            <div className="top-stats">
                <div className="main-stat-card">
                    <FaWallet className="icon-bg" />
                    <div className="stat-label">TOTAL GÉNÉRAL DU JOUR</div>
                    <div className="stat-value">{data.totalGlobal.toLocaleString()} Ar</div>
                </div>
                <div className="main-stat-card donor-card">
                    <FaUsers className="icon-bg" />
                    <div className="stat-label">NOMBRE DE DONATEURS</div>
                    <div className="stat-value">{data.totalDonateurs}</div>
                </div>
            </div>

            <h2 className="section-title"><FaLayerGroup /> Détails par Type de Don</h2>

            {/* --- GRILLE DYNAMIQUE : TOUS LES TYPES --- */}
            <div className="dynamic-grid">
                {data.groupes.length > 0 ? (
                    data.groupes.map((g, index) => (
                        <div key={index} className="type-card">
                            <div className="type-header">
                                <span className="type-name">{g.name}</span>
                                <FaTag className="type-icon" />
                            </div>
                            <div className="type-body">
                                <div className="type-total">{g.total.toLocaleString()} Ar</div>
                                <div className="type-count">{g.count} don(s) reçu(s)</div>
                            </div>
                            <div className="progress-bar-container">
                                <div 
                                    className="progress-bar" 
                                    style={{ width: `${(g.total / data.totalGlobal) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="no-data">Aucun don enregistré pour le moment aujourd'hui.</div>
                )}
            </div>
        </div>
    );
};

export default QuickSummary;