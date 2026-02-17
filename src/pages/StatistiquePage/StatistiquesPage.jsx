import React, { useState, useEffect } from 'react';
import donService from '../../services/donService';
import { FaChartBar, FaWallet, FaUsers, FaDonate, FaCalendarAlt } from 'react-icons/fa';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, Legend 
} from 'recharts';

const StatistiquesPage = () => {
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [stats, setStats] = useState({
        totalMontant: 0,
        nombreDons: 0,
        nombreDonateurs: 0,
        repartitionParType: [],
        evolutionMensuelle: []
    });

    const MOIS_NOMS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jui", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
    const COLORS = ['#0d6efd', '#198754', '#ffc107', '#6c757d']; // Bleu, Vert, Jaune, Gris

    useEffect(() => {
        loadData();
    }, [selectedYear]);

    // ============================================================
    // LA FONCTION LOADDATA 
    // ============================================================
    const loadData = async () => {
        setLoading(true);
        try {
            const response = await donService.getAll();
            const allDons = response.data || [];

            // 1. Filtrer par année
            const donsAnnee = allDons.filter(d => 
                new Date(d.dateDon).getFullYear() === parseInt(selectedYear)
            );

            // 2. Initialiser le dictionnaire de regroupement strict
            const typesMap = {
                'MOBILE MONEY': { name: 'MOBILE MONEY', value: 0, count: 0 },
                'MAHARITRA': { name: 'MAHARITRA', value: 0, count: 0 },
                'TSOTRA': { name: 'TSOTRA', value: 0, count: 0 },
                'AUTRE': { name: 'AUTRE', value: 0, count: 0 }
            };

            const typesPrincipaux = ['MOBILE MONEY', 'MAHARITRA', 'TSOTRA'];

            // 3. Calculer la répartition et les totaux
            let totalCumule = 0;
            const setDonateurs = new Set();

            donsAnnee.forEach(d => {
                const montant = parseFloat(d.montant) || 0;
                totalCumule += montant;
                if (d.idPersonne) setDonateurs.add(d.idPersonne);

                // Récupération du libellé propre (Backend : libelleType ou TypeDon.libelle)
                let libelleSource = (d.libelleType || (d.TypeDon && d.TypeDon.libelle) || "AUTRE")
                    .toUpperCase().trim();

                // Logique de bascule vers "AUTRE"
                let categorieFinale = typesPrincipaux.includes(libelleSource) ? libelleSource : 'AUTRE';

                typesMap[categorieFinale].value += montant;
                typesMap[categorieFinale].count += 1;
            });

            // 4. Évolution Mensuelle
            const evolution = MOIS_NOMS.map((nom, index) => {
                const montantMois = donsAnnee
                    .filter(d => new Date(d.dateDon).getMonth() === index)
                    .reduce((acc, d) => acc + (parseFloat(d.montant) || 0), 0);
                return { name: nom, montant: montantMois };
            });

            // 5. Mise à jour de l'état
            setStats({
                totalMontant: totalCumule,
                nombreDons: donsAnnee.length,
                nombreDonateurs: setDonateurs.size,
                // On transforme l'objet en tableau pour Recharts
                repartitionParType: Object.values(typesMap).filter(t => t.count > 0 || t.name === 'AUTRE'),
                evolutionMensuelle: evolution
            });

        } catch (error) {
            console.error("Erreur lors du chargement des statistiques:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="text-center mt-5"><div className="spinner-border text-primary"></div></div>;

    return (
        <div className="container-fluid mt-4 pb-5">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="h3 text-primary"><FaChartBar className="me-2"/>Tableau de Bord {selectedYear}</h1>
                <select className="form-select w-auto" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                    {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>

            {/* Cartes KPI */}
            <div className="row g-3 mb-4">
                <div className="col-md-4">
                    <div className="card bg-primary text-white p-3 shadow-sm border-0">
                        <small className="fw-bold opacity-75">TOTAL RÉCOLTÉ</small>
                        <h2 className="mb-0">{stats.totalMontant.toLocaleString()} Ar</h2>
                        <FaWallet className="position-absolute end-0 bottom-0 m-3 fs-1 opacity-25"/>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card bg-success text-white p-3 shadow-sm border-0">
                        <small className="fw-bold opacity-75">NOMBRE DE DONS</small>
                        <h2 className="mb-0">{stats.nombreDons}</h2>
                        <FaDonate className="position-absolute end-0 bottom-0 m-3 fs-1 opacity-25"/>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card bg-info text-white p-3 shadow-sm border-0">
                        <small className="fw-bold opacity-75">DONATEURS ACTIFS</small>
                        <h2 className="mb-0">{stats.nombreDonateurs}</h2>
                        <FaUsers className="position-absolute end-0 bottom-0 m-3 fs-1 opacity-25"/>
                    </div>
                </div>
            </div>

            <div className="row g-4">
                {/* Graphique Evolution Mensuelle */}
                <div className="col-lg-8">
                    <div className="card border-0 shadow-sm p-4">
                        <h5 className="fw-bold mb-4 text-secondary">Évolution Mensuelle</h5>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <BarChart data={stats.evolutionMensuelle}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip formatter={(v) => `${v.toLocaleString()} Ar`} />
                                    <Bar dataKey="montant" fill="#0d6efd" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Graphique Répartition (Le Donut) */}
                <div className="col-lg-4">
                    <div className="card border-0 shadow-sm p-4">
                        <h5 className="fw-bold mb-4 text-secondary">Répartition par Type</h5>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={stats.repartitionParType}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {stats.repartitionParType.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(v) => `${v.toLocaleString()} Ar`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatistiquesPage;