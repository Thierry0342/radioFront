import React, { useState, useEffect } from 'react';
import donService from '../../services/donService';
import { 
    FaUser, FaSearch, FaEnvelope, FaMapMarkerAlt, 
    FaInfoCircle, FaTimes, FaCrown, FaGem, FaMedal 
} from 'react-icons/fa';
import './DonorsPage.css';

const DonorsPage = () => {
    const [donors, setDonors] = useState([]);
    const [filteredDonors, setFilteredDonors] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

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
            const sorted = response.data.sort((a, b) => b.totalVerse - a.totalVerse);
            setDonors(sorted);
            setFilteredDonors(sorted);
        } catch (error) {
            console.error("Erreur:", error);
        } finally {
            setLoading(false);
        }
    };

    const getRankDetails = (total) => {
        if (total >= 1000000) return { label: 'Platine', class: 'platine', icon: <FaGem /> };
        if (total >= 500000) return { label: 'Or', class: 'gold', icon: <FaCrown /> };
        return { label: 'Donateur', class: 'standard', icon: <FaMedal /> };
    };

    const handleOpenHistory = async (donor) => {
        setSelectedDonor(donor);
        setIsModalOpen(true);
        setLoadingHistory(true);
        try {
            const response = await donService.getByPersonne(donor.idPersonne);
            setDonorHistory(response.data);
        } catch (error) { console.error(error); }
        finally { setLoadingHistory(false); }
    };

    useEffect(() => {
        const results = donors.filter(d =>
            d.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (d.adresse && d.adresse.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        setFilteredDonors(results);
    }, [searchTerm, donors]);

    return (
        <div className="donors-wrapper">
          <header className="premium-header">
        <div className="header-top">
            <div className="brand-section">
                <div className="brand-icon">
                    <FaUser />
                </div>
                <div className="brand-text">
                    <h1>Communauté</h1>
                    <p>Gestion des donateurs et contributeurs</p>
                </div>
            </div>
            <div className="header-stats">
                <div className="stat-pill">
                    <span className="pill-label">Total</span>
                    <span className="pill-value">{donors.length}</span>
                </div>
            </div>
        </div>

        <div className="header-actions-bar">
            <div className="search-container-modern">
                <FaSearch className="search-icon-inner" />
                <input 
                    type="text" 
                    placeholder="Rechercher un membre, une ville..." 
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            {/* On peut ajouter d'autres boutons ici plus tard */}
            <button className="btn-refresh" onClick={fetchDonors} title="Actualiser">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
            </button>
        </div>
    </header>

            <div className="search-box-premium">
                <FaSearch className="s-icon" />
                <input 
                    type="text" 
                    placeholder="Rechercher par nom ou localisation..." 
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="donors-grid-modern">
                {filteredDonors.map(donor => {
                    const rank = getRankDetails(donor.totalVerse);
                    return (
                        <div key={donor.idPersonne} className="donor-card-premium">
                            <div className="card-top-inner">
                                <div className={`rank-badge-ui ${rank.class}`}>
                                    {rank.icon} {rank.label}
                                </div>
                                <div className="donor-avatar-gradient">
                                    {donor.nom.charAt(0)}
                                </div>
                                <div className="donor-main-info">
                                    <h3>{donor.nom}</h3>
                                    <span className="location-pill"><FaMapMarkerAlt /> {donor.adresse || 'Localisation N.C'}</span>
                                </div>
                            </div>
                            
                            <div className="card-stats-compact">
                                <div className="stat-unit-ui">
                                    <span className="u-label">Contribution</span>
                                    <span className="u-value accent">{parseFloat(donor.totalVerse).toLocaleString()} Ar</span>
                                </div>
                                <div className="stat-unit-ui">
                                    <span className="u-label">Dons</span>
                                    <span className="u-value">{donor.nombreDons}</span>
                                </div>
                            </div>

                            <div className="card-actions-ui">
                                <button className="btn-details-modern" onClick={() => handleOpenHistory(donor)}>
                                    <FaInfoCircle /> Voir Historique
                                </button>
                                <button className="btn-icon-only"><FaEnvelope /></button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* MODAL SYSTÈME */}
            {isModalOpen && (
                <div className="modal-portal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-window-solid" onClick={e => e.stopPropagation()}>
                        <div className="modal-header-ui">
                            <div className="modal-user-info">
                                <div className="mini-avatar">{selectedDonor?.nom.charAt(0)}</div>
                                <div>
                                    <h4>{selectedDonor?.nom}</h4>
                                    <p>Journal des transactions</p>
                                </div>
                            </div>
                            <button className="modal-close-ui" onClick={() => setIsModalOpen(false)}><FaTimes /></button>
                        </div>
                        <div className="modal-content-scroll">
                            {loadingHistory ? (
                                <div className="loading-msg">Récupération des données...</div>
                            ) : (
                                <table className="history-table-premium">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Libellé</th>
                                            <th className="text-right">Montant</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {donorHistory.map((h, i) => (
                                          <tr key={i}>
                                          <td>{new Date(h.dateDon).toLocaleDateString('fr-FR')}</td>
                                          <td>
                                              {/* Affichage du type de don avec une couleur dynamique si nécessaire */}
                                              <span className={`tag-type type-${h.TypeDon?.libelle?.toLowerCase().replace(/\s/g, '-') || 'default'}`}>
                                                  {h.TypeDon?.libelle || 'Don standard'}
                                              </span>
                                          </td>
                                          <td className="amount-text">{parseFloat(h.montant).toLocaleString()} Ar</td>
                                      </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DonorsPage;