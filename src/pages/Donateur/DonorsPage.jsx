import React, { useState, useEffect } from 'react';
import donService from '../../services/donService';
import { 
    FaUser, FaSearch, FaEnvelope, FaMapMarkerAlt, 
    FaInfoCircle, FaTimes, FaEuroSign, FaCalendarAlt 
} from 'react-icons/fa';
import './DonorsPage.css';

const DonorsPage = () => {
    const [donors, setDonors] = useState([]);
    const [filteredDonors, setFilteredDonors] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    // --- ÉTATS POUR LE MODAL ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDonor, setSelectedDonor] = useState(null);
    const [donorHistory, setDonorHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    useEffect(() => {
        fetchDonors();
    }, []);

    const fetchDonors = async () => {
        try {
            const response = await donService.getAllDonorsWithStats();
            setDonors(response.data);
            setFilteredDonors(response.data);
        } catch (error) {
            console.error("Erreur chargement donateurs:", error);
        } finally {
            setLoading(false);
        }
    };

    // --- LOGIQUE DU MODAL ---
    const handleOpenHistory = async (donor) => {
        setSelectedDonor(donor);
        setIsModalOpen(true);
        setLoadingHistory(true);
        try {
            // On utilise ton service existant getByPersonne
            const response = await donService.getByPersonne(donor.idPersonne);
            setDonorHistory(response.data);
        } catch (error) {
            console.error("Erreur chargement historique:", error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedDonor(null);
        setDonorHistory([]);
    };

    useEffect(() => {
        const results = donors.filter(donor =>
            donor.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (donor.adresse && donor.adresse.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        setFilteredDonors(results);
    }, [searchTerm, donors]);

    return (
        <div className="donors-page">
            <div className="page-header">
                <div>
                    <h2><FaUser /> Gestion des Donateurs</h2>
                    <p>Liste de toutes les personnes ayant effectué au moins un don.</p>
                </div>
                <div className="donor-stats-summary">
                    <div className="stat-item">
                        <span className="stat-value">{donors.length}</span>
                        <span className="stat-label">Donateurs au total</span>
                    </div>
                </div>
            </div>

            <div className="search-container">
                <div className="search-box">
                    <FaSearch className="search-icon" />
                    <input 
                        type="text" 
                        placeholder="Rechercher un donateur par nom ou adresse..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="loading-state">Chargement des donateurs...</div>
            ) : (
                <div className="donors-grid">
                    {filteredDonors.map(donor => (
                        <div key={donor.idPersonne} className="donor-card">
                            <div className="donor-card-header">
                                <div className="avatar">
                                    {donor.nom.charAt(0).toUpperCase()}
                                </div>
                                <div className="donor-info">
                                    <h3>{donor.nom}</h3>
                                    <p><FaMapMarkerAlt /> {donor.adresse || 'Adresse non renseignée'}</p>
                                </div>
                            </div>
                            
                            <div className="donor-card-body">
                                <div className="card-stat">
                                    <span className="label">Total versé</span>
                                    <span className="value highlighting">
                                        {parseFloat(donor.totalVerse || 0).toLocaleString('fr-FR')} Ar
                                    </span>
                                </div>
                                <div className="card-stat">
                                    <span className="label">Dons effectués</span>
                                    <span className="value">{donor.nombreDons}</span>
                                </div>
                                <div className="card-stat">
                                    <span className="label">Dernier don</span>
                                    <span className="value">
                                        {donor.dernierDon ? new Date(donor.dernierDon).toLocaleDateString('fr-FR') : 'N/A'}
                                    </span>
                                </div>
                            </div>

                            <div className="donor-card-footer">
                                {/* BOUTON MODIFIÉ ICI */}
                                <button className="btn-view-details" onClick={() => handleOpenHistory(donor)}>
                                    <FaInfoCircle /> Historique détaillé
                                </button>
                                <button className="btn-contact">
                                    <FaEnvelope /> Contacter
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ========================================================== */}
            {/* 🏁 STRUCTURE DU MODAL */}
            {/* ========================================================== */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="history-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3><FaCalendarAlt /> Historique : {selectedDonor?.nom}</h3>
                            <button className="close-btn" onClick={handleCloseModal}><FaTimes /></button>
                        </div>
                        
                        <div className="modal-body">
                            {loadingHistory ? (
                                <div className="modal-loading">Chargement des transactions...</div>
                            ) : donorHistory.length > 0 ? (
                                <table className="history-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Type de Don</th>
                                            <th>Montant</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {donorHistory.map((don, idx) => (
                                            <tr key={don.idDon || idx}>
                                                <td>{new Date(don.dateDon).toLocaleDateString('fr-FR')}</td>
                                                <td>{don.TypeDon?.libelle || 'Don ponctuel'}</td>
                                                <td className="amount-col">{don.montant} €</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="no-history">Aucun don trouvé pour ce donateur.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {!loading && filteredDonors.length === 0 && (
                <div className="empty-state">
                    <p>Aucun donateur trouvé pour "{searchTerm}"</p>
                </div>
            )}
        </div>
    );
};

export default DonorsPage;