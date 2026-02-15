import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom'; // Pour récupérer le state envoyé par TopBar
import donService from '../../services/donService';
import { FaSearch, FaHistory, FaUser, FaCalendarAlt, FaCheckCircle } from 'react-icons/fa';
import './DonHistory.css';

const DonHistory = () => {
    const location = useLocation();
    const [dons, setDons] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    // On récupère l'ID envoyé par la TopBar (s'il existe)
    // "lastId" correspond au dernier ID que l'utilisateur avait vu AVANT de cliquer
    const lastSeenId = location.state?.lastId || 0;

    useEffect(() => {
        const fetchDons = async () => {
            try {
                const response = await donService.getAll();
                // Tri décroissant
                const sortedData = response.data.sort((a, b) => b.idDon - a.idDon);
                setDons(sortedData);
            } catch (error) {
                console.error("Erreur historique:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDons();
    }, []);

    // Filtre de recherche locale
    const filteredDons = dons.filter(don => 
        don.nomDonateur.toLowerCase().includes(searchTerm.toLowerCase()) ||
        don.libelleType.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatMoney = (amount) => {
        return new Intl.NumberFormat('fr-FR').format(amount) + " Ar";
    };

    return (
        <div className="history-container">
            <div className="history-header">
                <div className="header-title">
                    <FaHistory className="header-icon" />
                    <h2>Historique des Dons</h2>
                </div>
            </div>

            <div className="history-filters">
                <div className="search-box">
                    <FaSearch className="search-icon-inner" />
                    <input 
                        type="text" 
                        placeholder="Rechercher donateur, type..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-info">
                    {lastSeenId > 0 && <span className="badge-new-info">Nouveaux dons surlignés</span>}
                </div>
            </div>

            <div className="table-wrapper">
                {loading ? (
                    <div className="loader">Chargement...</div>
                ) : (
                    <table className="history-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Donateur</th>
                                <th>Type</th>
                                <th>Date</th>
                                <th className="text-end">Montant</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDons.length > 0 ? (
                                filteredDons.map((don) => {
                                    // LOGIQUE DE SURLIGNAGE : Si l'ID est plus grand que le dernier vu
                                    const isNew = don.idDon > lastSeenId;
                                    
                                    return (
                                        <tr key={don.idDon} className={isNew ? 'row-highlight-new' : ''}>
                                            <td>
                                                <span className="id-cell">#{don.idDon}</span>
                                                {isNew && <span className="new-tag">NOUVEAU</span>}
                                            </td>
                                            <td className="fw-bold">
                                                <FaUser className="me-2 text-muted" />
                                                {don.nomDonateur}
                                            </td>
                                            <td>
                                                <span className={`badge-type ${don.libelleType?.toLowerCase()}`}>
                                                    {don.libelleType}
                                                </span>
                                            </td>
                                            <td>
                                                <FaCalendarAlt className="me-1 text-muted" />
                                                {new Date(don.dateDon).toLocaleDateString('fr-FR')}
                                            </td>
                                            <td className="text-end amount-cell">
                                                {formatMoney(don.montant)}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="5" className="text-center py-4">Aucun résultat trouvé.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default DonHistory;