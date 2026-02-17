import React, { useState, useEffect, useMemo } from 'react';
import { 
    FaSearch, FaCalendarAlt, FaCheckCircle, FaUserTie, 
    FaUsers, FaHandHoldingHeart, FaChartLine, FaFileExcel, FaChartPie 
} from 'react-icons/fa';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, Legend 
} from 'recharts';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import './Maharitra.css';
import donMensuelService from '../../services/donMensuelService';

const Maharitra = () => {
    const [donorsData, setDonorsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const MONTH_KEYS = ['JAN', 'FEV', 'MAR', 'AVR', 'MAI', 'JUI', 'JUIL', 'AOU', 'SEP', 'OCT', 'NOV', 'DEC'];
    const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57', '#fa8072', '#00ced1'];

    useEffect(() => {
        fetchData();
    }, [selectedYear]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await donMensuelService.getAllMaharitraStats(selectedYear);
            const rawData = response.data || [];
            const grouped = {};

            rawData.forEach(item => {
                const person = item.DonMaharitra?.Don?.Personne;
                if (!person) return;

                const idPers = person.idPersonne || item.DonMaharitra?.Don?.idPersonne;
                
                if (!grouped[idPers]) {
                    grouped[idPers] = {
                        id: idPers,
                        nom: person.nom,
                        total: 0,
                        donationCount: 0,
                        months: {} 
                    };
                }

                const montant = parseFloat(item.montant) || 0;
                const moisCle = item.mois;

                grouped[idPers].months[moisCle] = (grouped[idPers].months[moisCle] || 0) + montant;
                grouped[idPers].total += montant;
                grouped[idPers].donationCount += 1;
            });

            setDonorsData(Object.values(grouped));
        } catch (error) {
            console.error("Erreur chargement stats:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatMoney = (val) => `${val.toLocaleString('fr-FR')} Ar`;

    // --- FILTRAGE ---
    const filteredDonors = useMemo(() => {
        return donorsData.filter(d => 
            d.nom.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [donorsData, searchTerm]);

    // --- CALCULS STATISTIQUES ---
    const stats = useMemo(() => ({
        nbDonateurs: filteredDonors.length,
        totalRecette: filteredDonors.reduce((sum, d) => sum + d.total, 0),
        nbTotalDons: filteredDonors.reduce((sum, d) => sum + d.donationCount, 0),
        moyenneParDonateur: filteredDonors.length > 0 
            ? Math.round(filteredDonors.reduce((sum, d) => sum + d.total, 0) / filteredDonors.length) 
            : 0
    }), [filteredDonors]);

    // --- PRÉPARATION DES DONNÉES GRAPHIQUES ---
    const chartData = useMemo(() => {
        return MONTH_KEYS.map((mKey, index) => {
            const totalMois = filteredDonors.reduce((sum, donor) => sum + (donor.months[mKey] || 0), 0);
            return { name: MONTH_LABELS[index], montant: totalMois };
        });
    }, [filteredDonors]);

    const pieData = useMemo(() => chartData.filter(d => d.montant > 0), [chartData]);

    // --- EXPORT EXCEL ---
    const exportToExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(`Maharitra ${selectedYear}`);

        const columns = [
            { header: 'DONATEUR', key: 'nom', width: 30 },
            ...MONTH_LABELS.map((label, i) => ({ header: label, key: MONTH_KEYS[i], width: 15 })),
            { header: 'TOTAL', key: 'total', width: 20 }
        ];
        worksheet.columns = columns;

        filteredDonors.forEach(d => {
            const rowValue = { nom: d.nom, total: d.total };
            MONTH_KEYS.forEach(mKey => { rowValue[mKey] = d.months[mKey] || 0; });
            const row = worksheet.addRow(rowValue);
            row.eachCell((cell, colNumber) => {
                if (colNumber > 1) cell.numFmt = '#,##0 "Ar"';
            });
        });

        worksheet.getRow(1).font = { bold: true };
        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), `Suivi_Maharitra_${selectedYear}.xlsx`);
    };

    if (loading) return <div className="p-5 text-center">Chargement des données...</div>;

    return (
        <div className="maharitra-container p-4 bg-light">
            
            {/* 1. CARTES STATISTIQUES */}
            <div className="row g-3 mb-4">
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm p-3 border-start border-primary border-4 h-100">
                        <div className="d-flex align-items-center">
                            <div className="rounded-circle bg-primary bg-opacity-10 p-3 me-3"><FaUsers className="text-primary" size={24} /></div>
                            <div>
                                <div className="text-muted small">Donateurs Actifs</div>
                                <div className="h4 mb-0 fw-bold">{stats.nbDonateurs}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm p-3 border-start border-success border-4 h-100">
                        <div className="d-flex align-items-center">
                            <div className="rounded-circle bg-success bg-opacity-10 p-3 me-3"><FaChartLine className="text-success" size={24} /></div>
                            <div>
                                <div className="text-muted small">Recette Totale</div>
                                <div className="h4 mb-0 fw-bold text-success">{formatMoney(stats.totalRecette)}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm p-3 border-start border-info border-4 h-100">
                        <div className="d-flex align-items-center">
                            <div className="rounded-circle bg-info bg-opacity-10 p-3 me-3"><FaHandHoldingHeart className="text-info" size={24} /></div>
                            <div>
                                <div className="text-muted small">Total Versements</div>
                                <div className="h4 mb-0 fw-bold">{stats.nbTotalDons}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm p-3 border-start border-warning border-4 h-100">
                        <div className="d-flex align-items-center">
                            <div className="rounded-circle bg-warning bg-opacity-10 p-3 me-3"><FaUserTie className="text-warning" size={24} /></div>
                            <div>
                                <div className="text-muted small">Moyenne / Donateur</div>
                                <div className="h4 mb-0 fw-bold">{formatMoney(stats.moyenneParDonateur)}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. SECTION GRAPHIQUES */}
            <div className="row g-3 mb-4">
                <div className="col-lg-8">
                    <div className="card border-0 shadow-sm p-4">
                        <h6 className="fw-bold mb-3"><FaChartLine className="me-2 text-primary"/>Évolution Mensuelle des Dons</h6>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `${val/1000}k`} />
                                    <Tooltip formatter={(value) => formatMoney(value)} cursor={{fill: '#f8f9fc'}} />
                                    <Bar dataKey="montant" fill="#4e73df" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
                <div className="col-lg-4">
                    <div className="card border-0 shadow-sm p-4 text-center">
                        <h6 className="fw-bold mb-3"><FaChartPie className="me-2 text-info"/>Répartition par Mois</h6>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="montant">
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => formatMoney(value)} />
                                    <Legend iconType="circle" wrapperStyle={{fontSize: '12px'}} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. FILTRES ET ACTIONS */}
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
                <div className="d-flex gap-2">
                    <div className="input-group shadow-sm" style={{maxWidth: '300px'}}>
                        <span className="input-group-text bg-white border-end-0"><FaSearch className="text-muted" /></span>
                        <input type="text" className="form-control border-start-0" placeholder="Rechercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="input-group shadow-sm" style={{width: '150px'}}>
                        <span className="input-group-text bg-white border-end-0"><FaCalendarAlt className="text-success" /></span>
                        <select className="form-select border-start-0 fw-bold" value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
                            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>
                <button className="btn btn-outline-success shadow-sm d-flex align-items-center gap-2" onClick={exportToExcel}>
                    <FaFileExcel /> Exporter Excel
                </button>
            </div>

            {/* 4. TABLEAU */}
            <div className="card border-0 shadow-sm overflow-hidden">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-dark">
                            <tr>
                                <th className="ps-4">DONATEUR</th>
                                {MONTH_LABELS.map(m => <th key={m} className="text-center" style={{fontSize: '0.75rem'}}>{m.toUpperCase()}</th>)}
                                <th className="text-end pe-4">TOTAL</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDonors.map(donor => (
                                <tr key={donor.id}>
                                    <td className="ps-4">
                                        <div className="fw-bold text-dark">{donor.nom}</div>
                                        <div className="text-muted small">ID: {donor.id} • {donor.donationCount} fois</div>
                                    </td>
                                    {MONTH_KEYS.map(mKey => {
                                        const val = donor.months[mKey];
                                        return (
                                            <td key={mKey} className="text-center">
                                                {val ? (
                                                    <div className="badge bg-success bg-opacity-10 text-success p-2 w-100">
                                                        <FaCheckCircle className="me-1" />{val.toLocaleString()}
                                                    </div>
                                                ) : <span className="text-muted opacity-25">-</span>}
                                            </td>
                                        );
                                    })}
                                    <td className="text-end pe-4 fw-bold text-primary">{formatMoney(donor.total)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Maharitra;