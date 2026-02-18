import React, { useState, useEffect } from 'react';
import StatsCard from '../../components/Dashboard/StatsCard';
import donService from '../../services/donService';
import typeDonService from '../../services/typeDonService';
import TopBar from '../../components/TopBar/TopBar';

import { 
    FaFilter, FaUser, FaMapMarkerAlt, FaClock, 
    FaMobileAlt, FaHandHoldingHeart, FaEllipsisH, FaSyncAlt,
    FaChevronLeft, FaChevronRight, FaCalendarAlt, FaInfoCircle, FaListUl, FaTimes,
    FaUsers, FaFilePdf 
} from 'react-icons/fa';
import './Dashboard.css';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Dashboard = () => {
    const [mainStats, setMainStats] = useState({ tsotra: null, maharitra: null, mobile: null, autres: null });
    const [extraStats, setExtraStats] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [allDons, setAllDons] = useState([]);          
    const [filteredDons, setFilteredDons] = useState([]); 
    
    const [donationTypes, setDonationTypes] = useState([]); 
    const [selectedTypeId, setSelectedTypeId] = useState('');
    const [donorSearch, setDonorSearch] = useState('');      
    const [startDate, setStartDate] = useState(''); 
    const [endDate, setEndDate] = useState('');     
    const [totalFiltered, setTotalFiltered] = useState(0);

    const [typeSearchTerm, setTypeSearchTerm] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [modalSearchTerm, setModalSearchTerm] = useState(''); 
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    // 🎯 LA SOLUTION EST ICI : Cette fonction nettoie les erreurs de frappe (espaces, slash, lettres...)
    const parseMontant = (val) => {
        if (!val) return 0;
        // 1. Convertir en texte
        let cleanVal = String(val);
        // 2. Supprimer les slashs (/), les espaces, les apostrophes, et les lettres
        cleanVal = cleanVal.replace(/[\s/'a-zA-Z]/g, '');
        // 3. Remplacer une éventuelle virgule par un point
        cleanVal = cleanVal.replace(',', '.');
        // 4. Convertir en nombre pur
        return parseFloat(cleanVal) || 0;
    };

    // 🎯 On utilise la fonction de nettoyage ici
    const formatMoney = (val) => `${parseMontant(val).toLocaleString('fr-FR')} Ar`;

    useEffect(() => {
        const initDashboard = async () => {
            try {
                setLoading(true);
                const [statsRes, typesRes, donsRes] = await Promise.all([
                    donService.getDonStatsByType(),
                    typeDonService.getAll(),
                    donService.getAll() 
                ]);

                const rawDons = donsRes.data || []; 
                
                setDonationTypes(typesRes.data || []);
                setAllDons(rawDons);
                setFilteredDons(rawDons);
                
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
    }, [selectedTypeId, donorSearch, startDate, endDate, allDons, donationTypes]);

    const calculateTotal = (list) => {
        // 🎯 On nettoie le montant de chaque ligne avant de faire la somme
        const total = list.reduce((sum, item) => sum + parseMontant(item.montant), 0);
        setTotalFiltered(total);
    };

    const organizeStats = (statsData, currentDons) => {
        let stats = { 
            tsotra: { total: 0, count: 0, donors: new Set() }, 
            maharitra: { total: 0, count: 0, donors: new Set() }, 
            mobile: { total: 0, count: 0, donors: new Set() }, 
            autres: { total: 0, count: 0, donors: new Set() } 
        };
        
        let donorsBySpecificType = {};

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
        
        statsData.forEach(stat => {
            const lib = (stat.title || "").toUpperCase();
            // 🎯 On sécurise les statistiques qui viennent du backend
            const m = parseMontant(stat.totalMontant);
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

        const createSubtitle = (count, donorsCount) => (
            <div className="stats-badges-row">
                <span className="badge-pill badge-dons">{count} dons</span>
                <span className="badge-pill badge-donateurs">
                    <FaUsers className="icon-tiny"/> {donorsCount} donateurs
                </span>
            </div>
        );

        setMainStats({
            tsotra: { title: 'TOTAL TSOTRA', value: stats.tsotra.total, subtitle: createSubtitle(stats.tsotra.count, stats.tsotra.donors.size), icon: <FaHandHoldingHeart />, theme: 'blue' },
            maharitra: { title: 'TOTAL MAHARITRA', value: stats.maharitra.total, subtitle: createSubtitle(stats.maharitra.count, stats.maharitra.donors.size), icon: <FaClock />, theme: 'green' },
            mobile: { title: 'MOBILE MONEY', value: stats.mobile.total, subtitle: createSubtitle(stats.mobile.count, stats.mobile.donors.size), icon: <FaMobileAlt />, theme: 'orange' },
            autres: { title: 'AUTRES DONS', value: stats.autres.total, subtitle: (
                    <div className="stats-badges-row">
                         <span className="badge-pill badge-more" style={{background:'#f3e5f5', color:'#7b1fa2', cursor:'pointer'}}>
                            Voir détails <FaChevronRight style={{fontSize: 10}}/>
                         </span>
                    </div>
                ), icon: <FaEllipsisH />, theme: 'purple' 
            }
        });
    };

    const resetFilters = () => {
        setSelectedTypeId(''); setDonorSearch(''); setStartDate(''); setEndDate('');
        setCurrentPage(1);
    };

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredDons.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredDons.length / itemsPerPage);

    const handleCloseModal = () => {
        setShowModal(false);
        setModalSearchTerm('');
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        
        const formatForPDF = (num) => {
            const cleaned = parseMontant(num);
            return new Intl.NumberFormat('fr-FR', {
                useGrouping: true,
            }).format(cleaned).replace(/\s/g, ' ') + " Ar";
        };
    
        doc.setFontSize(18);
        doc.setTextColor(124, 58, 237);
        doc.text("RAPPORT RÉSUMÉ DES DONS", 14, 20);
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        let filterText = "Période : " + (startDate ? new Date(startDate).toLocaleDateString() : "Début") + " au " + (endDate ? new Date(endDate).toLocaleDateString() : "Aujourd'hui");
        if (selectedTypeId) {
            const typeName = donationTypes.find(t => t.idType == selectedTypeId)?.libelle;
            filterText += ` | Type : ${typeName}`;
        }
        doc.text(filterText, 14, 28);
    
        // --- LOGIQUE CALCUL RÉSUMÉ (AVEC NOMBRE DE DONATEURS) ---
        const typeStats = {};
        filteredDons.forEach(d => {
            const t = d.libelleType || 'Autre';
            if (!typeStats[t]) {
                typeStats[t] = { total: 0, donateurs: new Set() };
            }
            typeStats[t].total += parseMontant(d.montant);
            // On utilise un Set pour compter les donateurs uniques (par leur nom ou ID)
            typeStats[t].donateurs.add(d.nomDonateur); 
        });
        
        const summaryBody = Object.keys(typeStats).map(k => [
            k, 
            typeStats[k].donateurs.size + " Pers.", // Nombre de donateurs uniques
            formatForPDF(typeStats[k].total) 
        ]);
        
        // --- TABLEAU RÉSUMÉ PAR TYPE ---
        autoTable(doc, {
            startY: 35,
            head: [['Type de Don', 'Donateurs', 'Total']],
            body: summaryBody,
            theme: 'grid',
            headStyles: { fillColor: [124, 58, 237] },
            styles: { fontSize: 10 },
            margin: { left: 14, right: 14 }
        });
    
        // --- TABLEAU DÉTAILLÉ AVEC NUMÉRO D'ORDRE ---
        const tableBody = filteredDons.map((item, index) => [
            index + 1, // 🎯 Numéro d'ordre (index + 1)
            item.nomDonateur,
            item.adresse || '---',
            item.libelleType,
            new Date(item.dateDon).toLocaleDateString(),
            formatForPDF(item.montant)
        ]);
    
        autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 15,
            // Ajout de '#' dans l'en-tête
            head: [['#', 'Donateur', 'Localisation', 'Type', 'Date', 'Montant']], 
            body: tableBody,
            theme: 'striped',
            headStyles: { fillColor: [41, 128, 185] },
            styles: { fontSize: 8 }, // Légère réduction pour faire tenir la nouvelle colonne
            columnStyles: {
                0: { cellWidth: 10 }, // Largeur fixe pour la colonne #
            }
        });
    
        // --- TOTAL GÉNÉRAL ---
        doc.setFontSize(14);
        doc.setTextColor(220, 38, 38);
        const finalTotalText = `Total Général : ${formatForPDF(totalFiltered)}`;
        doc.text(finalTotalText, 14, doc.lastAutoTable.finalY + 15);
    
        doc.save(`Rapport_Dashboard_${new Date().toISOString().split('T')[0]}.pdf`);
    };
    return (
        <div className="dashboard-container p-4">
            <h2 className="welcome-message mb-4">Tableau de Bord 👋</h2>

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

            {showModal && (
                <div className="custom-modal-overlay">
                    <div className="custom-modal-content">
                        <div className="modal-header-custom">
                            <h5><FaInfoCircle className="me-2 text-purple"/> Détails des autres collectes</h5>
                            <button className="close-btn" onClick={handleCloseModal}><FaTimes/></button>
                        </div>
                        <div className="modal-body-custom">
                            <div className="mb-4">
                                <input 
                                    type="text" 
                                    className="form-control form-control-sm" 
                                    placeholder="Rechercher une collecte..." 
                                    value={modalSearchTerm}
                                    onChange={(e) => setModalSearchTerm(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="row g-3">
                                {extraStats.filter(item => item.title.toLowerCase().includes(modalSearchTerm.toLowerCase())).length > 0 ? 
                                    extraStats.filter(item => item.title.toLowerCase().includes(modalSearchTerm.toLowerCase())).map((item, idx) => {
                                    const colors = ['purple', 'pink', 'teal', 'indigo', 'orange', 'cyan'];
                                    const colorClass = colors[idx % colors.length];
                                    return (
                                        <div className="col-md-6" key={idx}>
                                            <div className={`detail-card border-${colorClass}`}>
                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                    <span className={`detail-title text-${colorClass}`}>{item.title}</span>
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
                                }) : (
                                    <p className="text-center w-100 py-4 text-muted">
                                        Aucun résultat trouvé.
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="text-end mt-4 pt-3 border-top">
                            <button className="btn btn-secondary btn-sm px-4" onClick={handleCloseModal}>Fermer</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="card shadow-sm border-0 p-4 bg-white">
                <div className="row g-2 align-items-center mb-4">
                    <div className="col-md-12 mb-2">
                        <h3 className="section-title fs-5 fw-bold"><FaListUl className="me-2 text-primary" /> Historique des Dons</h3>
                    </div>
                    
                    <div className="col-md-2">
                        <input 
                            list="typesDonData" 
                            className="form-control form-control-sm" 
                            placeholder="Chercher type..." 
                            // 1. On utilise le terme de recherche pour permettre la saisie libre
                            value={typeSearchTerm}
                            onChange={(e) => {
                                const val = e.target.value;
                                setTypeSearchTerm(val); // Permet de voir ce qu'on tape

                                // 2. On cherche si la saisie correspond à un libellé existant
                                const type = donationTypes.find(t => t.libelle === val);
                                if (type) {
                                    setSelectedTypeId(type.idType);
                                } else if (val === '') {
                                    setSelectedTypeId('');
                                }
                            }}
                        />
                        <datalist id="typesDonData">
                            {donationTypes.map(t => (
                                <option key={t.idType} value={t.libelle} />
                            ))}
                        </datalist>
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
                    
                    <div className="col-md-4 d-flex gap-2">
                        <div className="badge bg-primary fs-6 px-3 flex-grow-1 d-flex align-items-center justify-content-center">
                            Total: {formatMoney(totalFiltered)}
                        </div>
                        <button className="btn btn-sm btn-danger text-white d-flex align-items-center gap-1" onClick={exportToPDF} title="Exporter en PDF">
                            <FaFilePdf /> PDF
                        </button>
                        <button className="btn btn-sm btn-outline-secondary" onClick={resetFilters} title="Réinitialiser les filtres">
                            <FaSyncAlt />
                        </button>
                    </div>
                </div>

                <div className="table-responsive border rounded">
                    <table className="table table-hover align-middle mb-0">
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

                <div className="d-flex justify-content-between align-items-center mt-4">
                    <div className="d-flex align-items-center gap-3">
                        <div className="text-muted small">Total: <b>{filteredDons.length}</b> dons</div>
                        <select className="form-select form-select-sm w-auto" value={itemsPerPage} onChange={(e) => {setItemsPerPage(Number(e.target.value)); setCurrentPage(1);}}>
                            <option value={10}>10 / page</option>
                            <option value={20}>20 / page</option>
                            <option value={50}>50 / page</option>
                        </select>
                    </div>
                    <nav>
                        <ul className="pagination pagination-sm mb-0">
                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                <button className="page-link" onClick={() => setCurrentPage(c => c - 1)}><FaChevronLeft/></button>
                            </li>
                            <li className="page-item active"><span className="page-link">{currentPage} / {totalPages || 1}</span></li>
                            <li className={`page-item ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}`}>
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