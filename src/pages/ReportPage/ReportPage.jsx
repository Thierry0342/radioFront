import React, { useState, useEffect } from 'react';
import donService from '../../services/donService';
import { FaFilePdf, FaFileExcel, FaCalendarAlt,FaArrowLeft,FaCoins ,FaUser   } from 'react-icons/fa';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import './ReportPage.css';

const ReportPage = () => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [dons, setDons] = useState([]);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        fetchData();
    }, [selectedDate]);

    const fetchData = async () => {
        setIsLoaded(false);
        try {
            const res = await donService.getAll();
            const filtered = res.data.filter(d => d.dateDon && d.dateDon.startsWith(selectedDate));
            setDons(filtered);
            setTimeout(() => setIsLoaded(true), 300); // Animation fluide
        } catch (err) {
            console.error("Erreur de chargement:", err);
        }
    };

    // --- LOGIQUE DE NETTOYAGE ET FORMATAGE ---
    const cleanAmount = (val) => {
        if (!val) return 0;
        if (typeof val === 'number') return Math.floor(val);
        let str = String(val).replace(/\s/g, '').replace(',', '.');
        let num = parseFloat(str);
        return isNaN(num) ? 0 : Math.floor(num);
    };

    const formatMoney = (amount) => {
        return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    };

    const formatDateMaj = (dateStr) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateStr).toLocaleDateString('fr-FR', options).toUpperCase();
    };

    // --- FONCTION D'AGRÉGATION (Additionner si même personne et même type) ---
    const aggregateData = (dataList) => {
        const grouped = dataList.reduce((acc, current) => {
            // Clé unique : Nom + Adresse + Type de don
            const key = `${(current.nomDonateur || "").trim().toUpperCase()}-${(current.adresse || "").trim().toUpperCase()}-${(current.libelleType || "").toUpperCase()}`;
            
            if (!acc[key]) {
                acc[key] = { 
                    ...current, 
                    montant: cleanAmount(current.montant),
                    count: 1 // Optionnel: pour savoir combien de dons ont été fusionnés
                };
            } else {
                acc[key].montant += cleanAmount(current.montant);
                acc[key].count += 1;
            }
            return acc;
        }, {});
        return Object.values(grouped);
    };

    // --- PRÉPARATION DES DONNÉES PAR GROUPES ---
    const prepareData = () => {
        // 1. Catégorisation initiale
        const rawTsotraMaharitra = dons.filter(d => {
            const lib = (d.libelleType || "").toUpperCase();
            return lib.includes("TSOTRA") || lib.includes("MAHARITRA");
        });

        const rawMobileDons = dons.filter(d => {
            const lib = (d.libelleType || "").toUpperCase();
            const isTM = lib.includes("TSOTRA") || lib.includes("MAHARITRA");
            return lib.includes("MOBILE") || lib.includes("MVOLA") || lib.includes("ORANGE") || lib.includes("AIRTEL");
        });

        const rawAutresDons = dons.filter(d => {
            const lib = (d.libelleType || "").toUpperCase();
            const isTM = lib.includes("TSOTRA") || lib.includes("MAHARITRA");
            const isMobile = lib.includes("MOBILE") || lib.includes("MVOLA") || lib.includes("ORANGE");
            return !isTM && !isMobile;
        });

        // 2. Application de l'addition (Agrégation)
        const tsotraMaharitra = aggregateData(rawTsotraMaharitra);
        const mobileDons = aggregateData(rawMobileDons);
        
        const groupedAutres = aggregateData(rawAutresDons).reduce((acc, don) => {
            const key = (don.libelleType || "AUTRES").toUpperCase();
            if (!acc[key]) acc[key] = [];
            acc[key].push(don);
            return acc;
        }, {});

        return { tsotraMaharitra, mobileDons, groupedAutres };
    };

    const { tsotraMaharitra, mobileDons, groupedAutres } = prepareData();
    const grandTotalGlobal = dons.reduce((s, d) => s + cleanAmount(d.montant), 0);

    // --- EXPORT PDF ---
    const exportPDF = () => {
        const doc = new jsPDF();
        doc.setFillColor(240, 240, 240);
        doc.rect(0, 0, 210, 297, 'F');
        doc.setFontSize(20);
        doc.setTextColor(220, 38, 38);
        doc.setFont(undefined, 'bold');
        doc.text(`TOLO TANANA RMM DU ${formatDateMaj(selectedDate)}`, 105, 15, { align: 'center' });

        let tableRows = [];
        let currentGrandTotal = 0;

        const addRowsToTable = (items, title = null) => {
            let subTotal = 0;
            if (title) {
                tableRows.push([{ content: title, colSpan: 4, styles: { textColor: [124, 58, 237], fontStyle: 'bold', fillColor: [255, 255, 255] } }]);
            }
            items.forEach((d, idx) => {
                const mt = d.montant;
                subTotal += mt;
                currentGrandTotal += mt;
                const isMaharitra = (d.libelleType || "").toUpperCase().includes("MAHARITRA");
                tableRows.push([
                    idx + 1, 
                    d.nomDonateur || "", 
                    `${d.adresse || ""}${isMaharitra ? " TM" : ""}`,
                    { content: formatMoney(mt), styles: { fontStyle: mt > 10000 ? 'bold' : 'normal' } }
                ]);
            });
            tableRows.push([{ content: `FITAMBARANY : ${formatMoney(subTotal)} Ar`, colSpan: 4, styles: { halign: 'center', fontStyle: 'bold', textColor: [124, 58, 237] } }]);
        };

        if (tsotraMaharitra.length > 0) addRowsToTable(tsotraMaharitra);
        Object.keys(groupedAutres).forEach(k => addRowsToTable(groupedAutres[k], k));
        if (mobileDons.length > 0) addRowsToTable(mobileDons, "IREO MOBILE MONEY VOARAY ANIO");

        autoTable(doc, {
            startY: 25,
            head: [['N°', 'ANARANA', 'ADIRESY/FIANGONANA', 'TOLOTRA']],
            body: tableRows,
            theme: 'grid',
            styles: { fontSize: 13, cellPadding: 2 },
            headStyles: { fillColor: [255, 255, 255], textColor: [124, 58, 237] },
            columnStyles: { 0: { cellWidth: 10 }, 3: { halign: 'right', cellWidth: 35 } }
        });

        doc.setFontSize(15);
        doc.text(`TOTALY BE : ${formatMoney(currentGrandTotal)} AR`, 205, doc.lastAutoTable.finalY + 15, { align: 'right' });
        doc.save(`RMM_${selectedDate}.pdf`);
    };

    // --- EXPORT EXCEL ---
// --- EXPORT EXCEL ---
const exportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporting');
    
    // Configuration de la page pour l'impression (comme un PDF)
    worksheet.pageSetup.margins = { left: 0.5, right: 0.5, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 };
    worksheet.pageSetup.orientation = 'portrait';

    // --- STYLES DE BASE ---
    const borderStyle = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
    };
    
    const purpleHex = 'FF7C3AED'; // La couleur violette de ton PDF (approximatif)
    const redHex = 'FFDC2626';    // Le rouge de ton titre

    // --- TITRE PRINCIPAL ---
    const titleRow = worksheet.addRow([`TOLO TANANA RMM DU ${formatDateMaj(selectedDate)}`]);
    worksheet.mergeCells('A1:D1');
    titleRow.getCell(1).font = { name: 'Arial', size: 18, bold: true, color: { argb: redHex } };
    titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.addRow([]); // Ligne vide

    // --- EN-TÊTE DU TABLEAU ---
    const headerRow = worksheet.addRow(['N°', 'ANARANA', 'ADIRESY/FIANGONANA', 'TOLOTRA']);
    headerRow.eachCell((cell) => {
        cell.font = { name: 'Arial', size: 12, bold: true, color: { argb: purpleHex } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = borderStyle;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }; // Fond blanc
    });

    // --- CONFIGURATION DES COLONNES ---
    worksheet.columns = [
        { width: 8 },  // N°
        { width: 35 }, // Anarana
        { width: 35 }, // Adiresy
        { width: 20 }  // Tolotra
    ];

    let currentRowNumber = 4; // On commence à écrire les données à la ligne 4
    let currentGrandTotal = 0;

    // --- FONCTION DE REMPLISSAGE ---
    const fillExcel = (items, title = null) => {
        let subTotal = 0;

        // Ajout du titre de section (ex: AUTRES, MOBILE MONEY)
        if (title) {
            const tr = worksheet.addRow([title]);
            worksheet.mergeCells(`A${currentRowNumber}:D${currentRowNumber}`);
            const cell = tr.getCell(1);
            cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: purpleHex } };
            cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
            cell.border = borderStyle;
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } }; // Fond gris clair
            currentRowNumber++;
        }

        // Ajout des lignes de données
        items.forEach((d, i) => {
            const mt = d.montant;
            subTotal += mt;
            currentGrandTotal += mt;

            const isMaharitra = (d.libelleType || "").toUpperCase().includes("MAHARITRA");
            const adiresy = `${d.adresse || ""} ${isMaharitra ? " TM" : ""}`.trim();

            const row = worksheet.addRow([i + 1, d.nomDonateur || "", adiresy, mt]);
            
            row.eachCell((cell, colNumber) => {
                cell.border = borderStyle;
                cell.font = { name: 'Arial', size: 11 };
                cell.alignment = { vertical: 'middle' };
                
                // Centrer le N°
                if (colNumber === 1) cell.alignment = { horizontal: 'center', vertical: 'middle' };
                
                // Formater le montant (et le mettre en gras si > 10000)
                if (colNumber === 4) {
                    cell.numFmt = '#,##0 "Ar"';
                    cell.alignment = { horizontal: 'right', vertical: 'middle' };
                    if (mt > 10000) cell.font = { name: 'Arial', size: 11, bold: true };
                }
            });
            currentRowNumber++;
        });

        // Ajout du sous-total
        const subTotalRow = worksheet.addRow([`FITAMBARANY : ${formatMoney(subTotal)} Ar`]);
        worksheet.mergeCells(`A${currentRowNumber}:D${currentRowNumber}`);
        const stCell = subTotalRow.getCell(1);
        stCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: purpleHex } };
        stCell.alignment = { horizontal: 'center', vertical: 'middle' };
        stCell.border = borderStyle;
        stCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
        currentRowNumber++;
    };

    // --- EXÉCUTION DU REMPLISSAGE ---
    if (tsotraMaharitra.length > 0) fillExcel(tsotraMaharitra);
    Object.keys(groupedAutres).forEach(k => fillExcel(groupedAutres[k], k));
    if (mobileDons.length > 0) fillExcel(mobileDons, "IREO MOBILE MONEY VOARAY ANIO");

    // --- GRAND TOTAL ---
    worksheet.addRow([]); // Espace avant le total
    currentRowNumber++;
    
    const totalRow = worksheet.addRow(['', '', 'TOTALY BE :', currentGrandTotal]);
    totalRow.getCell(3).font = { name: 'Arial', size: 14, bold: true };
    totalRow.getCell(3).alignment = { horizontal: 'right', vertical: 'middle' };
    
    const grandTotalCell = totalRow.getCell(4);
    grandTotalCell.font = { name: 'Arial', size: 14, bold: true };
    grandTotalCell.numFmt = '#,##0 "Ar"';
    grandTotalCell.alignment = { horizontal: 'right', vertical: 'middle' };
    
    // Bordures spéciales pour le total
    totalRow.getCell(3).border = borderStyle;
    totalRow.getCell(4).border = borderStyle;

    // --- GÉNÉRATION DU FICHIER ---
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `RMM_${selectedDate}.xlsx`);
};

return (
    <div className="report-page-wrapper">
        {/* BARRE D'ACTIONS FIXE */}
        <div className="report-controls shadow-sm">
            <div className="controls-left">
                
                <div>
                    <h1>Rapport Quotidien</h1>
                    <p className="text-muted">Gestion des entrées financières</p>
                </div>
            </div>

            <div className="controls-right">
                <div className="date-picker-custom">
                    <FaCalendarAlt className="icon" />
                    <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                </div>
                <div className="btn-group">
                <button className="btn-pdf" onClick={exportPDF}>
                    <FaFilePdf style={{ color: 'white', marginRight: '8px' }} /> PDF
                </button>
                <button className="btn-excel" onClick={exportExcel}>
                    <FaFileExcel style={{ color: '#22c55e', marginRight: '8px' }} /> EXCEL
                </button>
            </div>
            </div>
        </div>

        <div className={`report-content-area ${isLoaded ? 'fade-in' : 'loading'}`}>
            {/* RÉSUMÉ RAPIDE (CARDS) */}
            <div className="summary-grid">
                <div className="stat-card">
                    <div className="stat-icon purple"><FaCoins /></div>
                    <div className="stat-info">
                        <span className="label">Total Général</span>
                        <h3 className="value">{formatMoney(grandTotalGlobal)} <small>Ar</small></h3>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon blue"><FaUser /></div>
                    <div className="stat-info">
                        <span className="label">Nombre de Dons</span>
                        <h3 className="value">{dons.length}</h3>
                    </div>
                </div>
            </div>

            {/* LA FEUILLE DE RAPPORT (STYLE PAPIER) */}
            <div className="paper-report shadow-lg">
                <div className="paper-header">
                    <div className="logo-placeholder">RMM</div>
                    <div className="report-title-section">
                        <h2 className="red-title">TOLO TANANA RMM</h2>
                        <span className="badge-date">EDITION DU {formatDateMaj(selectedDate)}</span>
                    </div>
                </div>

                <table className="modern-table">
                    <thead>
                        <tr>
                            <th width="50">N°</th>
                            <th>NOM DU DONATEUR</th>
                            <th>ADRESSE / FIANGONANA</th>
                            <th className="text-end">MONTANT</th>
                        </tr>
                    </thead>

                    {/* SECTION TSOTRA / MAHARITRA */}
                    {tsotraMaharitra.length > 0 && (
                        <tbody className="section-group">
                            <tr className="group-divider"><td colSpan="4">DONS CLASSIQUES & MAHARITRA</td></tr>
                            {tsotraMaharitra.map((d, i) => (
                                <tr key={`tm-${i}`} className={d.montant > 50000 ? 'high-value' : ''}>
                                    <td className="text-center text-muted">{i + 1}</td>
                                    <td className="fw-semibold">{d.nomDonateur}</td>
                                    <td>{d.adresse} {d.libelleType?.includes("MAHARITRA") && <span className="tm-badge">TM</span>}</td>
                                    <td className="text-end amount">{formatMoney(d.montant)}</td>
                                </tr>
                            ))}
                        </tbody>
                    )}

                    {/* AUTRES SECTIONS (Même structure) */}
                    {Object.keys(groupedAutres).map(type => (
                        <tbody key={type} className="section-group">
                            <tr className="group-divider"><td colSpan="4">{type}</td></tr>
                            {groupedAutres[type].map((d, i) => (
                                <tr key={`at-${i}`}>
                                    <td className="text-center text-muted">{i + 1}</td>
                                    <td className="fw-semibold">{d.nomDonateur}</td>
                                    <td>{d.adresse}</td>
                                    <td className="text-end amount">{formatMoney(d.montant)}</td>
                                </tr>
                            ))}
                        </tbody>
                    ))}
                    {mobileDons.length > 0 && (
                        <tbody className="section-group">
                            <tr className="group-divider">
                                <td colSpan="4">IREO MOBILE MONEY VOARAY ANIO</td>
                            </tr>
                            {mobileDons.map((d, i) => (
                                <tr key={`mb-${i}`} className="mobile-row">
                                    <td className="text-center text-muted">{i + 1}</td>
                                    <td className="fw-semibold">{d.nomDonateur}</td>
                                    <td>{d.adresse} <small className="text-muted">({d.libelleType})</small></td>
                                    <td className="text-end amount">{formatMoney(d.montant)}</td>
                                </tr>
                            ))}
                            <tr className="subtotal-row">
                                <td colSpan="3" className="text-end fw-bold">FITAMBARANY MOBILE :</td>
                                <td className="text-end fw-bold">
                                    {formatMoney(mobileDons.reduce((s, d) => s + d.montant, 0))} Ar
                                </td>
                            </tr>
                        </tbody>
                    )}

                    {/* FOOTER TABLEAU */}
                    <tfoot>
                        <tr className="grand-total-row">
                            <td colSpan="3">TOTAL GÉNÉRAL DU JOUR</td>
                            <td className="text-end">{formatMoney(grandTotalGlobal)} Ar</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    </div>
);
};
export default ReportPage;