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

    // --- PRÉPARATION DES DONNÉES PAR GROUPES ---
    const prepareData = () => {
        const tsotraMaharitra = dons.filter(d => {
            const lib = (d.libelleType || "").toUpperCase();
            return lib.includes("TSOTRA") || lib.includes("MAHARITRA");
        });

        const mobileDons = dons.filter(d => {
            const lib = (d.libelleType || "").toUpperCase();
            return !tsotraMaharitra.includes(d) && (lib.includes("MOBILE") || lib.includes("MVOLA") || lib.includes("ORANGE"));
        });

        const autresDons = dons.filter(d => !tsotraMaharitra.includes(d) && !mobileDons.includes(d));
        const groupedAutres = autresDons.reduce((acc, don) => {
            const key = (don.libelleType || "AUTRES").toUpperCase();
            if (!acc[key]) acc[key] = [];
            acc[key].push(don);
            return acc;
        }, {});

        return { tsotraMaharitra, mobileDons, groupedAutres };
    };

    // --- EXPORT PDF ---
    const exportPDF = () => {
        const doc = new jsPDF();
        const { tsotraMaharitra, mobileDons, groupedAutres } = prepareData();
        
        // Fond gris léger sur toute la page
        doc.setFillColor(240, 240, 240);
        doc.rect(0, 0, 210, 297, 'F');

        doc.setFontSize(22);
        doc.setTextColor(220, 38, 38); // Rouge
        doc.setFont(undefined, 'bold');
        doc.text(`TOLO TANANA RMM DU ${formatDateMaj(selectedDate)}`, 105, 15, { align: 'center' });

        let tableRows = [];
        let grandTotal = 0;

        const addRowsToTable = (items, title = null) => {
            let subTotal = 0;
            if (title) {
                tableRows.push([{ content: title, colSpan: 4, styles: { textColor: [124, 58, 237], fontStyle: 'bold', fillColor: [255, 255, 255] } }]);
            }
            items.forEach(d => {
                const mt = cleanAmount(d.montant);
                subTotal += mt; grandTotal += mt;
                const isMaharitra = (d.libelleType || "").toUpperCase().includes("MAHARITRA");
                tableRows.push([
                    d.idDon || "", d.nomDonateur || "", `${d.adresse || ""}${isMaharitra ? " TM" : ""}`,
                    { content: formatMoney(mt), styles: { fontStyle: mt > 10000 ? 'bold' : 'normal' } }
                ]);
            });
            tableRows.push([{ content: `FITAMBARANY : ${formatMoney(subTotal)} Ar`, colSpan: 4, styles: { halign: 'center', fontStyle: 'bold', textColor: [124, 58, 237], fillColor: [255, 255, 255] } }]);
        };

        if (tsotraMaharitra.length > 0) addRowsToTable(tsotraMaharitra);
        Object.keys(groupedAutres).forEach(k => addRowsToTable(groupedAutres[k], k));
        if (mobileDons.length > 0) addRowsToTable(mobileDons, "IREO MOBILE MONEY VOARAY ANIO");

        autoTable(doc, {
            startY: 25,
            head: [['N°', 'ANARANA', 'ADIRESY/FIANGONANA', 'TOLOTRA']],
            body: tableRows,
            theme: 'grid',
            margin: { left: 5, right: 5 },
            styles: { fontSize: 14, cellPadding: 2, fillColor: [255, 255, 255], textColor: [0, 0, 0] },
            headStyles: { textColor: [124, 58, 237], fontStyle: 'bold', fillColor: [255, 255, 255], lineWidth: 0.1 },
            columnStyles: { 0: { cellWidth: 15 }, 3: { halign: 'right', cellWidth: 40 } }
        });

        doc.setFontSize(16);
        doc.setTextColor(124, 58, 237);
        doc.text(`TOTALY BE : ${formatMoney(grandTotal)} AR`, 205, doc.lastAutoTable.finalY + 15, { align: 'right' });
        doc.save(`RMM_${selectedDate}.pdf`);
    };

    // --- EXPORT EXCEL (Copie conforme) ---
    const exportExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Reporting');
        const { tsotraMaharitra, mobileDons, groupedAutres } = prepareData();
        const allBorders = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };

        // 1. Titre
        worksheet.mergeCells('A1:D1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = `TOLO TANANA RMM DU ${formatDateMaj(selectedDate)}`;
        titleCell.font = { size: 18, bold: true, color: { argb: 'FFFF0000' } };
        titleCell.alignment = { horizontal: 'center' };
        titleCell.fill = { type: 'pattern', pattern:'solid', fgColor:{argb:'FFF5F5F5'} };
        titleCell.border = allBorders;

        // 2. En-tête
        const hRow = worksheet.addRow(['N°', 'ANARANA', 'ADIRESY/FIANGONANA', 'TOLOTRA']);
        hRow.eachCell(c => {
            c.font = { bold: true, color: { argb: 'FF7C3AED' }, size: 14 };
            c.border = allBorders;
            c.alignment = { horizontal: 'center' };
        });

        let grandTotal = 0;
        const fillExcel = (items, title = null) => {
            let subTotal = 0;
            if (title) {
                const tr = worksheet.addRow([title]);
                worksheet.mergeCells(`A${tr.number}:D${tr.number}`);
                tr.getCell(1).font = { bold: true, color: { argb: 'FF7C3AED' }, size: 14 };
                tr.getCell(1).border = allBorders;
                tr.getCell(1).fill = { type: 'pattern', pattern:'solid', fgColor:{argb:'FFF0F0F0'} };
            }
            items.forEach(d => {
                const mt = cleanAmount(d.montant);
                subTotal += mt; grandTotal += mt;
                const r = worksheet.addRow([d.idDon, d.nomDonateur, d.adresse, mt]);
                r.eachCell((c, i) => {
                    c.border = allBorders;
                    c.font = { size: 14, bold: (i === 4 && mt > 10000) };
                    if (i === 4) c.numFmt = '#,##0 "Ar"';
                });
            });
            const sr = worksheet.addRow([`FITAMBARANY : ${formatMoney(subTotal)} Ar`]);
            worksheet.mergeCells(`A${sr.number}:D${sr.number}`);
            sr.getCell(1).alignment = { horizontal: 'center' };
            sr.getCell(1).font = { bold: true, color: { argb: 'FF7C3AED' }, size: 14 };
            sr.getCell(1).border = allBorders;
        };

        if (tsotraMaharitra.length > 0) fillExcel(tsotraMaharitra);
        Object.keys(groupedAutres).forEach(k => fillExcel(groupedAutres[k], k));
        if (mobileDons.length > 0) fillExcel(mobileDons, "IREO MOBILE MONEY VOARAY ANIO");

        const gr = worksheet.addRow(['', '', 'TOTALY BE', grandTotal]);
        gr.getCell(3).font = { bold: true, size: 16, color: { argb: 'FF7C3AED' } };
        gr.getCell(4).font = { bold: true, size: 16, color: { argb: 'FF7C3AED' } };
        gr.getCell(4).numFmt = '#,##0 "Ar"';
        gr.getCell(3).border = allBorders; gr.getCell(4).border = allBorders;

        worksheet.getColumn(1).width = 12; worksheet.getColumn(2).width = 35;
        worksheet.getColumn(3).width = 45; worksheet.getColumn(4).width = 25;

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), `RMM_${selectedDate}.xlsx`);
    };

    const { tsotraMaharitra, mobileDons, groupedAutres } = prepareData();

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
                    
                    {tsotraMaharitra.length > 0 && (
                        <tbody>
                            {tsotraMaharitra.map((d, i) => (
                                <tr key={`tm-${i}`}>
                                    <td>{d.idDon}</td><td>{d.nomDonateur}</td>
                                    <td>{d.adresse} {(d.libelleType || "").toUpperCase().includes("MAHARITRA") ? "TM" : ""}</td>
                                    <td className={`text-end ${cleanAmount(d.montant) > 10000 ? 'fw-bold' : ''}`}>{formatMoney(cleanAmount(d.montant))}</td>
                                </tr>
                            ))}
                            <tr className="subtotal-row"><td colSpan="4" className="text-center">FITAMBARANY : {formatMoney(tsotraMaharitra.reduce((s, d) => s + cleanAmount(d.montant), 0))} Ar</td></tr>
                        </tbody>
                    )}

                    {Object.keys(groupedAutres).map(type => (
                        <tbody key={type}>
                            <tr className="group-title-row"><td colSpan="4">{type}</td></tr>
                            {groupedAutres[type].map((d, i) => (
                                <tr key={`at-${i}`}>
                                    <td>{d.idDon}</td><td>{d.nomDonateur}</td><td>{d.adresse}</td>
                                    <td className={`text-end ${cleanAmount(d.montant) > 10000 ? 'fw-bold' : ''}`}>{formatMoney(cleanAmount(d.montant))}</td>
                                </tr>
                            ))}
                            <tr className="subtotal-row"><td colSpan="4" className="text-center">FITAMBARANY {type} : {formatMoney(groupedAutres[type].reduce((s, d) => s + cleanAmount(d.montant), 0))} Ar</td></tr>
                        </tbody>
                    ))}

                    {mobileDons.length > 0 && (
                        <tbody>
                            <tr className="group-title-row"><td colSpan="4">IREO MOBILE MONEY VOARAY ANIO</td></tr>
                            {mobileDons.map((d, i) => (
                                <tr key={`mb-${i}`}>
                                    <td>{d.idDon}</td><td>{d.nomDonateur}</td><td>{d.adresse}</td>
                                    <td className={`text-end ${cleanAmount(d.montant) > 10000 ? 'fw-bold' : ''}`}>{formatMoney(cleanAmount(d.montant))}</td>
                                </tr>
                            ))}
                            <tr className="subtotal-row"><td colSpan="4" className="text-center">FITAMBARANY MOBILE : {formatMoney(mobileDons.reduce((s, d) => s + cleanAmount(d.montant), 0))} Ar</td></tr>
                        </tbody>
                    )}

                    <tfoot>
                        <tr className="purple-total">
                            <td colSpan="3" className="text-end">TOTALY BE</td>
                            <td className="text-end">{formatMoney(dons.reduce((s, d) => s + cleanAmount(d.montant), 0))} Ar</td>
                        </tr>
                    </tfoot>
                </table>
            </main>
        </div>
    );
};

export default ReportPage;