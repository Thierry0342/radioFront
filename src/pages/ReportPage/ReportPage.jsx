import React, { useState, useEffect } from 'react';
import donService from '../../services/donService';
import { FaFilePdf, FaFileExcel, FaCalendarAlt } from 'react-icons/fa';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import './ReportPage.css';

const ReportPage = () => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [dons, setDons] = useState([]);

    useEffect(() => {
        fetchData();
    }, [selectedDate]);

    const fetchData = async () => {
        try {
            const res = await donService.getAll();
            const filtered = res.data.filter(d => d.dateDon && d.dateDon.startsWith(selectedDate));
            setDons(filtered);
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
            return !isTM && (lib.includes("MOBILE") || lib.includes("MVOLA") || lib.includes("ORANGE"));
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
    const exportExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Reporting');
        const allBorders = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };

        worksheet.addRow([`TOLO TANANA RMM DU ${formatDateMaj(selectedDate)}`]);
        worksheet.mergeCells('A1:D1');
        const hRow = worksheet.addRow(['N°', 'ANARANA', 'ADIRESY/FIANGONANA', 'TOLOTRA']);

        const fillExcel = (items, title = null) => {
            let subTotal = 0;
            if (title) {
                const tr = worksheet.addRow([title]);
                worksheet.mergeCells(`A${tr.number}:D${tr.number}`);
            }
            items.forEach((d, i) => {
                subTotal += d.montant;
                const r = worksheet.addRow([i + 1, d.nomDonateur, d.adresse, d.montant]);
                r.getCell(4).numFmt = '#,##0 "Ar"';
            });
            worksheet.addRow([`FITAMBARANY : ${formatMoney(subTotal)} Ar`]);
        };

        if (tsotraMaharitra.length > 0) fillExcel(tsotraMaharitra);
        Object.keys(groupedAutres).forEach(k => fillExcel(groupedAutres[k], k));
        if (mobileDons.length > 0) fillExcel(mobileDons, "IREO MOBILE MONEY VOARAY ANIO");

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), `RMM_${selectedDate}.xlsx`);
    };

    return (
        <div className="report-container">
            <header className="report-header">
                <div className="title-box">
                    <h1 className="red-title">TOLO TANANA RMM</h1>
                    <p className="subtitle">Edition du {formatDateMaj(selectedDate)}</p>
                </div>
                <div className="report-actions">
                    <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="date-input" />
                    <div className="btn-group">
                        <button className="btn-pdf" onClick={exportPDF}><FaFilePdf /> PDF</button>
                        <button className="btn-excel" onClick={exportExcel}><FaFileExcel /> EXCEL</button>
                    </div>
                </div>
            </header>

            <main className="report-view card shadow p-2">
                <table className="report-table font-14">
                    <thead>
                        <tr className="purple-header">
                            <th>N°</th><th>ANARANA</th><th>ADIRESY / FIANGONANA</th><th className="text-end">TOLOTRA</th>
                        </tr>
                    </thead>
                    
                    {/* Section TSOTRA / MAHARITRA */}
                    {tsotraMaharitra.length > 0 && (
                        <tbody>
                            {tsotraMaharitra.map((d, i) => (
                                <tr key={`tm-${i}`}>
                                    <td>{i + 1}</td>
                                    <td>{d.nomDonateur}</td>
                                    <td>{d.adresse} {(d.libelleType || "").toUpperCase().includes("MAHARITRA") ? "TM" : ""}</td>
                                    <td className={`text-end ${d.montant > 10000 ? 'fw-bold' : ''}`}>{formatMoney(d.montant)}</td>
                                </tr>
                            ))}
                            <tr className="subtotal-row">
                                <td colSpan="4" className="text-center">
                                    FITAMBARANY : {formatMoney(tsotraMaharitra.reduce((s, d) => s + d.montant, 0))} Ar
                                </td>
                            </tr>
                        </tbody>
                    )}

                    {/* Section AUTRES (Groupés par type) */}
                    {Object.keys(groupedAutres).map(type => (
                        <tbody key={type}>
                            <tr className="group-title-row"><td colSpan="4">{type}</td></tr>
                            {groupedAutres[type].map((d, i) => (
                                <tr key={`at-${i}`}>
                                    <td>{i + 1}</td><td>{d.nomDonateur}</td><td>{d.adresse}</td>
                                    <td className={`text-end ${d.montant > 10000 ? 'fw-bold' : ''}`}>{formatMoney(d.montant)}</td>
                                </tr>
                            ))}
                            <tr className="subtotal-row">
                                <td colSpan="4" className="text-center">
                                    FITAMBARANY {type} : {formatMoney(groupedAutres[type].reduce((s, d) => s + d.montant, 0))} Ar
                                </td>
                            </tr>
                        </tbody>
                    ))}

                    {/* Section MOBILE MONEY */}
                    {mobileDons.length > 0 && (
                        <tbody>
                            <tr className="group-title-row"><td colSpan="4">IREO MOBILE MONEY VOARAY ANIO</td></tr>
                            {mobileDons.map((d, i) => (
                                <tr key={`mb-${i}`}>
                                    <td>{i + 1}</td><td>{d.nomDonateur}</td><td>{d.adresse}</td>
                                    <td className={`text-end ${d.montant > 10000 ? 'fw-bold' : ''}`}>{formatMoney(d.montant)}</td>
                                </tr>
                            ))}
                            <tr className="subtotal-row">
                                <td colSpan="4" className="text-center">
                                    FITAMBARANY MOBILE : {formatMoney(mobileDons.reduce((s, d) => s + d.montant, 0))} Ar
                                </td>
                            </tr>
                        </tbody>
                    )}

                    <tfoot>
                        <tr className="purple-total">
                            <td colSpan="3" className="text-end">TOTALY BE</td>
                            <td className="text-end">{formatMoney(grandTotalGlobal)} Ar</td>
                        </tr>
                    </tfoot>
                </table>
            </main>
        </div>
    );
};

export default ReportPage;