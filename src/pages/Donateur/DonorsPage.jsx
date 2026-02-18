import React, { useState, useEffect } from 'react';
import donService from '../../services/donService';
import personneService from '../../services/personeService';
import { 
    FaUser, FaSearch, FaEnvelope, FaMapMarkerAlt, 
    FaInfoCircle, FaTimes, FaCrown, FaGem, FaMedal, FaTrash, FaLock 
} from 'react-icons/fa';
import Swal from 'sweetalert2';
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

    // 1. Récupération du rôle de l'utilisateur
    const user = JSON.parse(localStorage.getItem('user'));
    const isAdmin = user?.user?.role === 'ADMIN';

    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
    });

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

    const handleDeleteDonor = async (donor) => {
        // 2. Sécurité : Vérifier si l'utilisateur est ADMIN
        if (!isAdmin) {
            Swal.fire({
                icon: 'error',
                title: 'Accès refusé',
                text: 'Seul un administrateur peut supprimer un membre de la communauté.',
            });
            return;
        }

        if (donor.nombreDons > 0) {
            Toast.fire({
                icon: 'error',
                title: 'Action impossible',
                text: 'Ce donateur possède un historique.'
            });
            return;
        }

        const result = await Swal.fire({
            title: 'Êtes-vous sûr ?',
            text: `Le profil de ${donor.nom} sera définitivement supprimé.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Oui, supprimer !',
            cancelButtonText: 'Annuler'
        });

        if (result.isConfirmed) {
            try {
                await personneService.delete(donor.idPersonne);
                Toast.fire({
                    icon: 'success',
                    title: 'Donateur supprimé'
                });
                fetchDonors();
            } catch (error) {
                Toast.fire({
                    icon: 'error',
                    title: 'Erreur lors de la suppression'
                });
            }
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

    if (loading) return <div className="p-5 text-center">Chargement de la communauté...</div>;

    return (
        <div className="donors-wrapper">
            <header className="premium-header">
                <div className="header-top">
                    <div className="brand-section">
                        <div className="brand-icon"><FaUser /></div>
                        <div className="brand-text">
                            <h1>Communauté</h1>
                            <p>Gestion des donateurs {!isAdmin && <span className="badge-consultant"><FaLock /> Lecture seule</span>}</p>
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
                    <button className="btn-refresh" onClick={fetchDonors} title="Actualiser">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
                    </button>
                </div>
            </header>

            <div className="donors-grid-modern">
                {filteredDonors.map(donor => {
                    const rank = getRankDetails(donor.totalVerse);
                    // 3. Le bouton supprimer ne s'affiche que si c'est un ADMIN ET qu'il n'y a pas de dons
                    const showDeleteBtn = isAdmin && donor.nombreDons === 0;

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
                                    <FaInfoCircle /> Historique
                                </button>
                                
                                {/* ✅ Rendu conditionnel du bouton supprimer */}
                                {showDeleteBtn ? (
                                    <button 
                                        className="btn-delete-modern" 
                                        onClick={() => handleDeleteDonor(donor)}
                                        title="Supprimer"
                                    >
                                        <FaTrash />
                                    </button>
                                ) : (
                                    /* Optionnel : On peut mettre une enveloppe grise ou rien du tout */
                                    isAdmin && donor.nombreDons > 0 && <span className="btn-lock-info" title="Donateur actif"><FaLock /></span>
                                )}
                                
                                <button className="btn-icon-only"><FaEnvelope /></button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* MODAL SYSTÈME (Historique) */}
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