import React, { useState, useEffect } from 'react';
import StatsCard from '../../components/Dashboard/StatsCard';
import donService from '../../services/donService';
import typeDonService from '../../services/typeDonService';
import { 
    FaFilter, FaUser, FaMapMarkerAlt, FaClock, 
    FaMobileAlt, FaHandHoldingHeart, FaEllipsisH, FaSyncAlt,
    FaChevronLeft, FaChevronRight, FaCalendarAlt, FaInfoCircle, FaListUl, FaTimes,
    FaUsers // <--- Ajout de l'icône utilisateurs
} from 'react-icons/fa';
import './Dashboard.css';

const Dashboard = () => {
    // --- ÉTATS DES DONNÉES ---
    const [mainStats, setMainStats] = useState({ tsotra: null, maharitra: null, mobile: null, autres: null });
    const [extraStats, setExtraStats] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [allDons, setAllDons] = useState([]);          
    const [filteredDons, setFilteredDons] = useState([]); 
    
    // --- ÉTATS DES FILTRES ---
    const [donationTypes, setDonationTypes] = useState([]); 
    const [selectedTypeId, setSelectedTypeId] = useState('');
    const [donorSearch, setDonorSearch] = useState('');      
    const [startDate, setStartDate] = useState(''); 
    const [endDate, setEndDate] = useState('');     
    const [totalFiltered, setTotalFiltered] = useState(0);

    // --- ÉTATS UI ---
    const [showModal, setShowModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    // Initialisation des données
    useEffect(() => {
        const initDashboard = async () => {
            try {
                setLoading(true);
                const [statsRes, typesRes, donsRes] = await Promise.all([
                    donService.getDonStatsByType(),
                    typeDonService.getAll(),
                    donService.getAll() 
                ]);

                const rawDons = donsRes.data || []; // On récupère les dons bruts ici
                
                setDonationTypes(typesRes.data || []);
                setAllDons(rawDons);
                setFilteredDons(rawDons);
                
                // IMPORTANT : On passe rawDons directement à la fonction pour le calcul immédiat
                organizeStats(statsRes.data || [], rawDons);
                
                calculateTotal(rawDons);
            } catch (err) {
                console.error("Erreur initialisation:", err);
            } finally {
                setLoading(false);
            }
        };
        initDashboard();
    }, []);

    // Application des filtres
    useEffect(() => {
        let result = [...allDons];

        if (selectedTypeId) {
            const typeObj = donationTypes.find(t => t.idType == selectedTypeId);
            result = result.filter(d => d.libelleType === (typeObj?.libelle || ""));
        }
        if (donorSearch) {
            result = result.filter(d => (d.nomDonateur || "").toLowerCase().includes(donorSearch.toLowerCase()));
        }
        if (startDate) {
            result = result.filter(d => new Date(d.dateDon) >= new Date(startDate));
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59);
            result = result.filter(d => new Date(d.dateDon) <= end);
        }

        setFilteredDons(result);
        calculateTotal(result);
        setCurrentPage(1); 
    }, [selectedTypeId, donorSearch, startDate, endDate, allDons]);

    const calculateTotal = (list) => {
        const total = list.reduce((sum, item) => sum + parseFloat(item.montant || 0), 0);
        setTotalFiltered(total);
    };

    // MODIFICATION : Ajout du paramètre currentDons pour être sûr d'avoir les données
const organizeStats = (statsData, currentDons) => {
        let stats = { 
            tsotra: { total: 0, count: 0, donors: new Set() }, 
            maharitra: { total: 0, count: 0, donors: new Set() }, 
            mobile: { total: 0, count: 0, donors: new Set() }, 
            autres: { total: 0, count: 0, donors: new Set() } 
        };
        
        let donorsBySpecificType = {};

        // 1. Calcul des donateurs uniques
        currentDons.forEach(don => {
            const lib = (don.libelleType || "").toUpperCase();
            const nom = don.nomDonateur;

            if (!donorsBySpecificType[lib]) donorsBySpecificType[lib] = new Set();
            donorsBySpecificType[lib].add(nom);

            if (lib.includes('MOBILE') || lib.includes('MVOLA') || lib.includes('ORANGE')) { 
                stats.mobile.donors.add(nom); 
            }
            else if (lib.includes('MAHARITRA')) { stats.maharitra.donors.add(nom); }
            else if (lib.includes('TSOTRA')) { stats.tsotra.donors.add(nom); }
            else { stats.autres.donors.add(nom); }
        });

        let othersList = [];
        
        // 2. Traitement des montants
        statsData.forEach(stat => {
            const lib = (stat.title || "").toUpperCase();
            const m = parseFloat(stat.totalMontant || 0);
            const c = parseInt(stat.totalDons || 0);

            if (lib.includes('MOBILE') || lib.includes('MVOLA') || lib.includes('ORANGE')) { 
                stats.mobile.total += m; stats.mobile.count += c; 
            }
            else if (lib.includes('MAHARITRA')) { stats.maharitra.total += m; stats.maharitra.count += c; }
            else if (lib.includes('TSOTRA')) { stats.tsotra.total += m; stats.tsotra.count += c; }
            else { 
                stats.autres.total += m; stats.autres.count += c; 
                othersList.push({ 
                    title: lib, 
                    value: m, 
                    count: c,
                    donorCount: donorsBySpecificType[lib] ? donorsBySpecificType[lib].size : 0
                });
            }
        });

        setExtraStats(othersList);

        // FONCTION DE RENDU DIRECTEMENT ICI (plus sûr)
        // Utilisation des classes CSS définies plus haut
        const createSubtitle = (count, donorsCount) => (
            <div className="stats-badges-row">
                <span className="badge-pill badge-dons">
                    {count} dons
                </span>
                <span className="badge-pill badge-donateurs">
                    <FaUsers className="icon-tiny"/> {donorsCount} donateurs
                </span>
            </div>
        );

        setMainStats({
            tsotra: { 
                title: 'TOTAL TSOTRA', 
                value: stats.tsotra.total, 
                subtitle: createSubtitle(stats.tsotra.count, stats.tsotra.donors.size),
                icon: <FaHandHoldingHeart />, 
                theme: 'blue' 
            },
            maharitra: { 
                title: 'TOTAL MAHARITRA', 
                value: stats.maharitra.total, 
                subtitle: createSubtitle(stats.maharitra.count, stats.maharitra.donors.size),
                icon: <FaClock />, 
                theme: 'green' 
            },
            mobile: { 
                title: 'MOBILE MONEY', 
                value: stats.mobile.total, 
                subtitle: createSubtitle(stats.mobile.count, stats.mobile.donors.size), 
                icon: <FaMobileAlt />, 
                theme: 'orange' 
            },
            autres: { 
                title: 'AUTRES DONS', 
                value: stats.autres.total, 
                // Celui-ci marchait déjà, on le garde
                subtitle: (
                    <div className="stats-badges-row">
                         <span className="badge-pill badge-more" style={{background:'#f3e5f5', color:'#7b1fa2', cursor:'pointer'}}>
                            Voir détails <FaChevronRight style={{fontSize: 10}}/>
                         </span>
                    </div>
                ),
                icon: <FaEllipsisH />, 
                theme: 'purple' 
            }
        });
    };

    const resetFilters = () => {
        setSelectedTypeId(''); setDonorSearch(''); setStartDate(''); setEndDate('');
        setCurrentPage(1);
    };

    const formatMoney = (val) => `${parseFloat(val || 0).toLocaleString()} Ar`;

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredDons.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredDons.length / itemsPerPage);

    return (
        <div className="dashboard-container p-4">
            <h2 className="welcome-message mb-4">Tableau de Bord 👋</h2>

            {/* --- CARTES STATS --- */}
            <div className="stats-grid mb-4">
                {!loading && mainStats.tsotra && (
                    <>
                        <StatsCard {...mainStats.tsotra} value={formatMoney(mainStats.tsotra.value)} />
                        <StatsCard {...mainStats.maharitra} value={formatMoney(mainStats.maharitra.value)} />
                        <StatsCard {...mainStats.mobile} value={formatMoney(mainStats.mobile.value)} />
                        <div onClick={() => setShowModal(true)} style={{ cursor: 'pointer' }}>
                            <StatsCard {...mainStats.autres} value={formatMoney(mainStats.autres.value)} />
                        </div>
                    </>
                )}
            </div>

            {/* --- MODAL PERSONNALISÉE --- */}
            {showModal && (
                <div className="custom-modal-overlay">
                    <div className="custom-modal-content">
                        <div className="modal-header-custom">
                            <h5><FaInfoCircle className="me-2 text-purple"/> Détails des autres collectes</h5>
                            <button className="close-btn" onClick={() => setShowModal(false)}><FaTimes/></button>
                        </div>
                        <div className="modal-body-custom">
                            <div className="row g-3">
                                {extraStats.length > 0 ? extraStats.map((item, idx) => {
                                    const colors = ['purple', 'pink', 'teal', 'indigo', 'orange', 'cyan'];
                                    const colorClass = colors[idx % colors.length];
                                    return (
                                        <div className="col-md-6" key={idx}>
                                            <div className={`detail-card border-${colorClass}`}>
                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                    <span className={`detail-title text-${colorClass}`}>{item.title}</span>
                                                    {/* Badge Donateurs dans la Modal */}
                                                    <span className={`modal-donor-badge bg-${colorClass}-light text-${colorClass}`}>
                                                        <FaUsers className="me-1"/>{item.donorCount}
                                                    </span>
                                                </div>
                                                <div className="detail-footer">
                                                    <span className="detail-value">{formatMoney(item.value)}</span>
                                                    <span className={`detail-badge badge-${colorClass}`}>{item.count} dons</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }) : <p className="text-center w-100 py-4">Aucun autre type de don.</p>}
                            </div>
                        </div>
                        <div className="text-end mt-4">
                            <button className="btn btn-secondary btn-sm px-4" onClick={() => setShowModal(false)}>Fermer</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- TABLEAU ET FILTRES (Reste du code inchangé) --- */}
            <div className="card shadow-sm border-0 p-4 bg-white">
                <div className="row g-2 align-items-center mb-4">
                    <div className="col-md-12 mb-2">
                        <h3 className="section-title fs-5 fw-bold"><FaListUl className="me-2 text-primary" /> Historique des Dons</h3>
                    </div>
                    <div className="col-md-2">
                        <select className="form-select form-select-sm" value={selectedTypeId} onChange={(e) => setSelectedTypeId(e.target.value)}>
                            <option value="">-- Types --</option>
                            {donationTypes.map(t => <option key={t.idType} value={t.idType}>{t.libelle}</option>)}
                        </select>
                    </div>
                    <div className="col-md-2">
                        <input type="text" className="form-control form-control-sm" placeholder="Nom..." value={donorSearch} onChange={(e) => setDonorSearch(e.target.value)} />
                    </div>
                    <div className="col-md-2">
                        <input type="date" className="form-control form-control-sm" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    </div>
                    <div className="col-md-2">
                        <input type="date" className="form-control form-control-sm" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </div>
                    <div className="col-md-1">
                        <select className="form-select form-select-sm" value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))}>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                    </div>
                    <div className="col-md-3 d-flex gap-2">
                        <div className="badge bg-primary fs-6 p-2 flex-grow-1 d-flex align-items-center justify-content-center">Total: {formatMoney(totalFiltered)}</div>
                        <button className="btn btn-sm btn-outline-secondary" onClick={resetFilters}><FaSyncAlt /></button>
                    </div>
                </div>

                <div className="table-responsive border rounded">
                    <table className="table table-hover align-middle mb-0">
                        {/* CHANGEMENT ICI : On remplace table-light par custom-thead */}
                        <thead className="custom-thead text-uppercase small fw-bold">
                            <tr>
                                <th className="py-3 px-4">Donateur</th>
                                <th>Localisation</th>
                                <th>Type</th>
                                <th>Date</th>
                                <th className="text-end px-4">Montant</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.length > 0 ? currentItems.map((item, idx) => (
                                <tr key={idx}>
                                    <td className="fw-bold px-4"><FaUser className="me-2 text-muted" />{item.nomDonateur}</td>
                                    <td>
                                        <div className="small text-dark"><FaMapMarkerAlt className="text-danger me-1"/>{item.adresse || '---'}</div>
                                    </td>
                                    <td><span className="badge bg-light text-primary border">{item.libelleType}</span></td>
                                    <td className="text-muted small">{new Date(item.dateDon).toLocaleDateString()}</td>
                                    <td className="text-end fw-bold text-primary px-4">{formatMoney(item.montant)}</td>
                                </tr>
                            )) : <tr><td colSpan="5" className="text-center py-5">Aucun résultat.</td></tr>}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION */}
                <div className="d-flex justify-content-between align-items-center mt-4">
                    <div className="text-muted small">Total: <b>{filteredDons.length}</b> dons</div>
                    <nav>
                        <ul className="pagination pagination-sm mb-0">
                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                <button className="page-link" onClick={() => setCurrentPage(c => c - 1)}><FaChevronLeft/></button>
                            </li>
                            <li className="page-item active"><span className="page-link">{currentPage} / {totalPages || 1}</span></li>
                            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                <button className="page-link" onClick={() => setCurrentPage(c => c + 1)}><FaChevronRight/></button>
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;