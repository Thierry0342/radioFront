import React, { useState, useEffect } from 'react';
// ⚠️ Assurez-vous que les chemins d'importation sont corrects
import typeDonService from '../../services/typeDonService'; 
import personneService from '../../services/personeService'; 
import donService from '../../services/donService'; 
import donMensuelService from '../../services/donMensuelService'; 

import { 
    FaCheckCircle, FaClock, FaCalendarPlus, FaPlusCircle, 
    FaTimes, FaDonate, FaSearch, FaChevronRight, FaChevronLeft,
    FaTrashAlt, FaPen, FaListAlt,FaHeart,FaPlus,FaLayerGroup,
} from 'react-icons/fa';

// Liste des mois 
const MOIS_LIST = [
    "JAN", "FEV", "MAR", "AVR", "MAI", "JUI", "JUIL", 
    "AOU", "SEP", "OCT", "NOV", "DEC"
];


// Fonction utilitaire pour mapper les paiements existants à l'état du formulaire
const mapExistingPaymentsToStatus = (existingPayments = []) => {
    let status = MOIS_LIST.map(mois => ({ 
        mois: mois, 
        statut: 'PENDING', 
        montantPaye: 0, 
        paiements: [] 
    }));
    
    existingPayments.forEach(p => {
        const index = status.findIndex(s => s.mois === p.mois);
        if (index !== -1) {
            const montantPaiement = parseFloat(p.montant || 0);
            
            status[index].montantPaye += montantPaiement;
            
            status[index].paiements.push({
                idMensuel: p.idMensuel ? parseInt(p.idMensuel) : null,
                montant: montantPaiement,
                datePaiement: p.datePaiement
            });
        }
    });
    
    status.forEach(s => {
        if (s.montantPaye > 0) { 
             s.statut = 'PAID'; 
        }
    });

    return status;
};

const DonPage = () => {
    //section serie de don
    const [showBatchSection, setShowBatchSection] = useState(false);
    const [tempDonations, setTempDonations] = useState([]); 
    const [batchPersonne, setBatchPersonne] = useState({ nom: '', contact: '', adresse: '' });
    const [batchDon, setBatchDon] = useState({ montant: '', idType: '' });
    const [donationTypes, setDonationTypes] = useState([]); 
    const [existingDonors, setExistingDonors] = useState([]); 
    const [recentDons, setRecentDons] = useState([]); 
    
    const [isModalOpen, setIsModalOpen] = useState(false); 
    const [isDonorModalOpen, setIsDonorModalOpen] = useState(false); 
    
    const [personne, setPersonne] = useState({ 
        idPersonne: 0, 
        nom: '', 
        contact: '', 
        adresse: '' 
    });
    const [selectedPersonId, setSelectedPersonId] = useState(0); 
    
    const [don, setDon] = useState({ 
        montant: '', 
        dateDon: new Date().toISOString().substring(0, 10), 
        idType: null 
    });

    const maharitraType = donationTypes.find(t => t.libelle === 'MAHARITRA');
    const isMaharitra = parseInt(don.idType) === maharitraType?.id; 

    const [maharitraCommitment, setMaharitraCommitment] = useState({ 
        annee: new Date().getFullYear().toString(), 
    });
    
    const [amountToRecord, setAmountToRecord] = useState(''); 
    const [paymentsToRecord, setPaymentsToRecord] = useState([]); 
    const [monthlyStatus, setMonthlyStatus] = useState(mapExistingPaymentsToStatus()); 
    const [isLoading, setIsLoading] = useState(false);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false); 
    const [monthToEdit, setMonthToEdit] = useState(null); 
    const [refreshTrigger, setRefreshTrigger] = useState(0); 

    // 🎯 ÉTATS POUR LA MODIFICATION
    const [isEditing, setIsEditing] = useState(false); 
    const [donToEditId, setDonToEditId] = useState(null); 
 // pour priorise les types 
 // Liste des types à mettre en évidence (en majuscules pour la comparaison)
 const priorityLabels = ["MAHARITRA", "TSOTRA", "MOBILE MONEY", "NOUVEAU_TYPE_FREQUENT"];

// 1. Les types prioritaires
const mainTypes = donationTypes.filter(t => 
    priorityLabels.includes(t.libelle.toUpperCase())
);

// 2. Tous les autres types
const otherTypes = donationTypes.filter(t => 
    !priorityLabels.includes(t.libelle.toUpperCase())
);
// 1. Ajoutez cet état en haut de votre composant
const [searchTerm, setSearchTerm] = useState("");

// 2. Filtrez les "autres types" en fonction de la recherche
const filteredOtherTypes = otherTypes.filter(t => 
    t.libelle.toLowerCase().includes(searchTerm.toLowerCase())
);
const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
const [isSelectionTypeModalOpen, setIsSelectionTypeModalOpen] = useState(false);
const [searchTypeTerm, setSearchTypeTerm] = useState("");

// Vérifier si le type sélectionné est un type "hors priorité"
const isExtraTypeSelected = donationTypes.find(t => 
    t.id == don.idType && !priorityLabels.includes(t.libelle.toUpperCase())
);
const selectedExtraType = isExtraTypeSelected ? donationTypes.find(t => t.id == don.idType) : null;
// 3. Trouver le libellé du type actuellement sélectionné pour le bouton
const selectedTypeLabel = donationTypes.find(t => t.id == don.idType)?.libelle || "TYPE NON DÉFINI";

    // --- Fonction de Réinitialisation ---
    const resetForm = () => {
        setPersonne({ idPersonne: 0, nom: '', contact: '', adresse: '' });
        setSelectedPersonId(0);
        
        const defaultType = donationTypes.find(t => t.libelle === 'TSOTRA') || donationTypes[0];

        setDon({ 
            montant: '', 
            dateDon: new Date().toISOString().substring(0, 10), 
            idType: defaultType ? defaultType.id.toString() : null 
        });
        setMaharitraCommitment({ annee: new Date().getFullYear().toString() });
        setAmountToRecord('50000');
        setPaymentsToRecord([]);
        setMonthlyStatus(mapExistingPaymentsToStatus()); 
        
        // Réinitialisation du mode édition
        setIsEditing(false);
        setDonToEditId(null);
        
        setRefreshTrigger(prev => prev + 1); 
    };
    
    // --- Fonction pour charger la liste des dons récents ---
    const fetchRecentDons = async () => {
        try {
            const response = await donService.getRecentDons(10); 
            setRecentDons(response.data || []);
        } catch (error) {
            console.error("Erreur lors du chargement des dons récents:", error);
        }
    };
//ajouter autre type 
const [isAddingNewType, setIsAddingNewType] = useState(false);
const [newTypeLibelle, setNewTypeLibelle] = useState("");
//sauvegarde
const handleAddNewType = async () => {
    if (!newTypeLibelle.trim()) return;

    try {
        // On utilise l'API pour créer le type
        const response = await typeDonService.post({ libelle: newTypeLibelle.toUpperCase() });
        
        if (response.data) {
            const createdType = response.data; // Supposons que l'API renvoie { idType: 10, libelle: '...' }
            
            // 1. On crée le format d'objet attendu par votre application
            const newFormattedType = { 
                id: createdType.idType, 
                libelle: createdType.libelle 
            };

            // 2. On met à jour l'état SOURCE (donationTypes)
            setDonationTypes(prev => [...prev, newFormattedType]);

            // 3. On sélectionne automatiquement ce nouveau type
            handleTypeDonCardClick(newFormattedType.id);

            // 4. Nettoyage de l'interface
            setNewTypeLibelle("");
            setIsAddingNewType(false);
            setIsSelectionTypeModalOpen(false);
            
            alert(`Nouveau type "${newFormattedType.libelle}" ajouté avec succès !`);
        }
    } catch (error) {
        console.error("Erreur lors de l'ajout du type:", error);
        alert("Erreur lors de la création du type.");
    }
};
    // --- EFFECT 1 : Chargement Initial des Données (Types, Donateurs, et Dons Récents) ---
    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true);
            try {
                // Chargement des dépendances
                const [typesRes, personnesRes] = await Promise.all([
                    typeDonService.getAll(), 
                    personneService.getAll()
                ]);

                // Types
                const fetchedTypes = typesRes.data.map(t => ({ id: t.idType, libelle: t.libelle }));
                setDonationTypes(fetchedTypes);
                if (fetchedTypes.length > 0) {
                    const defaultType = fetchedTypes.find(t => t.libelle === 'TSOTRA') || fetchedTypes[0];
                    setDon(prev => ({ ...prev, idType: defaultType.id.toString() }));
                }

                // Personnes
                setExistingDonors(personnesRes.data);
                
                // Chargement initial des dons récents
                await fetchRecentDons();

            } catch (error) {
                console.error("Erreur lors du chargement initial des données:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitialData();
    }, []); 

    // --- EFFECT 2 : Chargement du Statut Mensuel ---
    useEffect(() => {
        const fetchMonthlyStatus = async () => {
            if (selectedPersonId === 0 || !isMaharitra) {
                setMonthlyStatus(mapExistingPaymentsToStatus());
                setPaymentsToRecord([]); 
                return;
            }
            
            setIsLoading(true);
            try {
                const response = await donMensuelService.getMaharitraStatus(
                    selectedPersonId, 
                    maharitraCommitment.annee
                );
                
                const fetchedPayments = response.data || []; 
                setMonthlyStatus(mapExistingPaymentsToStatus(fetchedPayments));
                
            } catch (error) {
                console.error("Erreur lors du chargement du statut Maharitra:", error);
                setMonthlyStatus(mapExistingPaymentsToStatus()); 
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchMonthlyStatus();
        
    }, [selectedPersonId, maharitraCommitment.annee, isMaharitra, refreshTrigger]); 


    // --- Gestion de la sélection depuis la Modale ---
    const handleDonorSelect = (selectedDonor) => {
        setPersonne({
            idPersonne: selectedDonor.idPersonne, 
            nom: selectedDonor.nom,
            contact: selectedDonor.contact || '',
            adresse: selectedDonor.adresse || '',
        });
        setSelectedPersonId(selectedDonor.idPersonne);
        setIsDonorModalOpen(false); 
        setRefreshTrigger(prev => prev + 1); 
    };
    
    // --- Gestion des changements manuels de la Personne ---
    const handlePersonChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'nom' && selectedPersonId !== 0) {
             // Si l'utilisateur modifie le nom d'un donateur sélectionné, 
             // on revient en mode nouveau donateur (idPersonne: 0)
             setPersonne({ 
                idPersonne: 0, 
                nom: value, 
                contact: '', 
                adresse: '' 
             });
             setSelectedPersonId(0);
        } else {
            setPersonne(prev => ({ ...prev, [name]: value }));
        }
    };
    
    // --- Gestion des changements simples (Don, MaharitraCommitment) ---
    const handleChange = (e, stateSetter) => {
        const { name, value } = e.target;
        stateSetter(prev => ({ ...prev, [name]: value }));
    };

    // --- Clic sur la carte Type de Don ---
    const handleTypeDonCardClick = (idType) => {
        setDon(prev => ({ ...prev, idType: idType.toString() }));
        setPaymentsToRecord([]); 
    };

    // --- Logique Maharitra : Sélection/Édition des Mois ---
    const handleMonthToggle = (mois) => {
        
        const monthStatus = monthlyStatus.find(m => m.mois === mois);
        
        // 1. Si le mois est DÉJÀ PAYÉ: Ouvrir la modale d'édition/consultation
        if (monthStatus && monthStatus.statut === 'PAID') {
            setMonthToEdit(monthStatus);
            setIsEditModalOpen(true);
            return; 
        }

        // 2. Si le mois est PENDING: Permettre la sélection pour un NOUVEAU PAIEMENT
        const existingIndex = paymentsToRecord.findIndex(p => p.mois === mois);
        
        if (!amountToRecord || parseFloat(amountToRecord) <= 0) {
            alert("Veuillez saisir un Montant de Paiement Mensuel supérieur à zéro avant de sélectionner un mois.");
            return;
        }

        if (existingIndex > -1) {
            setPaymentsToRecord(prev => prev.filter(p => p.mois !== mois));
        } else {
            setPaymentsToRecord(prev => [...prev, { 
                mois: mois, 
                montant: amountToRecord, 
                datePaiement: don.dateDon, 
                statut: 'PAID' 
            }]);
        }
    };
    
    // --- Ajout de Type de Don via l'API ---
    const handleAddDonationType = async (newLibelle) => {
        if (!newLibelle.trim()) return;

        try {
            setIsLoading(true);
            const response = await typeDonService.post({ 
                libelle: newLibelle.trim().toUpperCase() 
            });
            
            const newType = response.data; 
            
            if (newType && newType.idType) {
                const newTypeFormatted = { id: newType.idType, libelle: newType.libelle };
                setDonationTypes(prev => [...prev, newTypeFormatted]);
                setDon(prev => ({ ...prev, idType: newTypeFormatted.id.toString() })); 
                setIsModalOpen(false); 
                alert(`Type de don "${newTypeFormatted.libelle}" ajouté!`);
            } else {
                throw new Error("L'API n'a pas retourné l'ID du nouveau Type de Don.");
            }
            
        } catch (error) {
            console.error("Erreur lors de l'ajout du Type de Don:", error.response?.data || error);
            alert(`Erreur: Impossible d'ajouter le Type de Don. ${error.response?.data?.message || error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Fonction de Création (Post) ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const currentType = donationTypes.find(t => t.id == don.idType);
        if (!currentType) return alert("Veuillez sélectionner un Type de Don valide.");
        if (!personne.nom) return alert("Veuillez saisir le nom du donateur.");
        
        const isNewPerson = selectedPersonId === 0;

        if (!isMaharitra && (!don.montant || parseFloat(don.montant) <= 0)) {
            return alert("Veuillez saisir un montant de don TSOTRA valide.");
        }
        if (isMaharitra && paymentsToRecord.length === 0) {
             return alert("Veuillez sélectionner au moins un mois à payer.");
        }
        
        const personnePayload = isNewPerson ? personne : { idPersonne: selectedPersonId };

        const montantTotalDon = isMaharitra 
            ? paymentsToRecord.reduce((acc, p) => acc + parseFloat(p.montant), 0).toFixed(2).toString()
            : don.montant;
        
        const payload = {
            personne: personnePayload,
            don: {
                montant: montantTotalDon, 
                dateDon: don.dateDon,
                idType: parseInt(don.idType),
            },
        };

        if (isMaharitra) {
            payload.maharitraDetails = {
                annee: maharitraCommitment.annee,
                mensuels: paymentsToRecord.map(p => ({
                    mois: p.mois,
                    montant: p.montant,
                    datePaiement: don.dateDon,
                })),
            };
        }
        
        try {
            setIsLoading(true);
            await donService.post(payload);
            
            alert(`✅ Succès! Don de type ${currentType.libelle} enregistré pour ${personne.nom}.`);
            
            await fetchRecentDons();

            if (isMaharitra) {
                setPaymentsToRecord([]);
                setRefreshTrigger(prev => prev + 1); 
            } else {
                resetForm(); 
            }
            
        } catch (error) {
            console.error("Erreur lors de l'enregistrement du Don:", error.response?.data || error);
            alert(`❌ Erreur: Impossible d'enregistrer le Don. Détail: ${error.response?.data?.details || error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Fonction de Mise à Jour (Update) ---
    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!donToEditId) return alert("Erreur: ID du don à modifier non trouvé.");
        
        const currentType = donationTypes.find(t => t.id == don.idType);
        if (!currentType) return alert("Veuillez sélectionner un Type de Don valide.");
        if (!personne.nom) return alert("Veuillez saisir le nom du donateur.");
        
        // Préparation du payload de mise à jour
        const payload = {
            idDon: donToEditId, 
            personne: {
                // Utiliser l'ID existant de la personne
                idPersonne: selectedPersonId,
                nom: personne.nom,
                contact: personne.contact,
                adresse: personne.adresse,
            },
            don: {
                // Le montant sera mis à jour seulement pour les dons TSOTRA ici
                montant: don.montant, 
                dateDon: don.dateDon,
                idType: parseInt(don.idType),
            },
        };

        if (isMaharitra) {
            // En modification Maharitra, on n'ajoute que les NOUVEAUX paiements mensuels sélectionnés
            if (paymentsToRecord.length > 0) {
                payload.maharitraDetails = {
                    annee: maharitraCommitment.annee,
                    mensuels: paymentsToRecord.map(p => ({
                        mois: p.mois,
                        montant: p.montant,
                        datePaiement: don.dateDon,
                    })),
                };
            }
            // Retirer le montant principal si on n'ajoute pas de paiement (évite d'écraser le montant total)
            if (paymentsToRecord.length === 0) {
                 delete payload.don.montant;
            }
        }
        
        try {
            setIsLoading(true);
            await donService.update(payload); 
            
            alert(`✅ Succès! Don ID ${donToEditId} mis à jour.`);
            
            await fetchRecentDons();
            resetForm(); // Retour au mode création après la mise à jour
            
        } catch (error) {
            console.error("Erreur lors de la mise à jour du Don:", error.response?.data || error);
            alert(`❌ Erreur: Impossible de mettre à jour le Don. Détail: ${error.response?.data?.details || error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Fonction pour charger un Don à éditer ---
    const handleEditDon = async (donData) => {
        
        // 1. Définir le mode d'édition
        setIsEditing(true);
        setDonToEditId(donData.idDon);
        
        // 2. Charger les informations de la personne
        setPersonne({
            idPersonne: donData.idPersonne || 0, 
            nom: donData.nomDonateur || '',
            contact: donData.contact || '',
            adresse: donData.adresse || '',
        });
        setSelectedPersonId(donData.idPersonne || 0);
        
        // 3. Charger les détails du don
        const typeDon = donationTypes.find(t => t.libelle === donData.libelleType);
        
        setDon({
            montant: donData.montant.toString(),
            dateDon: new Date(donData.dateDon).toISOString().substring(0, 10),
            idType: typeDon ? typeDon.id.toString() : null,
        });
        
        // 4. Gérer le cas MAHARITRA (assumer l'année du don comme année d'engagement à éditer)
        if (donData.libelleType === 'MAHARITRA') {
            const annee = new Date(donData.dateDon).getFullYear().toString(); 
            setMaharitraCommitment({ annee }); 
            
            // Lancement d'un rafraîchissement pour charger le statut mensuel de cette personne/année
            setRefreshTrigger(prev => prev + 1); 
            
        } else {
            // Réinitialiser les états Maharitra
            setMaharitraCommitment({ annee: new Date().getFullYear().toString() });
            setMonthlyStatus(mapExistingPaymentsToStatus());
            setPaymentsToRecord([]); 
        }
    };


    // --- Suppression d'un Don (Utilisé dans le tableau des dons récents) ---
    const handleDeleteDon = async (idDon, nomDonateur) => {
        if (!window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement le Don ID ${idDon} fait par ${nomDonateur} ?`)) {
            return;
        }

        setIsLoading(true);
        try {
            await donService.delete(idDon); 
            alert(`✅ Succès! Don ID ${idDon} supprimé.`);
            
            await fetchRecentDons();

        } catch (error) {
            console.error("Erreur lors de la suppression du Don:", error.response?.data || error);
            alert(`❌ Erreur: Impossible de supprimer le Don. Détail: ${error.response?.data?.details || error.message}`);
        } finally {
            setIsLoading(false);
        }
    };
// --- FONCTIONS POUR LA GESTION DE LA SÉRIE ---

const addToTempList = () => {
    if (!batchPersonne.nom || !batchDon.montant || !batchDon.idType) {
        alert("Veuillez remplir le nom, le montant et le type.");
        return;
    }

    const typeObj = donationTypes.find(t => t.id == batchDon.idType);
    
    const newItem = {
        idTemp: Date.now(),
        personne: { 
            nom: batchPersonne.nom.toUpperCase(),
            contact: batchPersonne.contact || '',
            adresse: batchPersonne.adresse || '' // 👈 On récupère l'adresse ici
        },
        don: { 
            montant: batchDon.montant,
            idType: parseInt(batchDon.idType),
            dateDon: new Date().toISOString().substring(0, 10)
        },
        typeLibelle: typeObj ? typeObj.libelle : "TYPE"
    };

    setTempDonations([...tempDonations, newItem]);

    // Réinitialisation : On vide le nom et le montant, 
    // mais on peut laisser l'adresse et le type si vous saisissez plusieurs personnes du même endroit
    setBatchPersonne({ ...batchPersonne, nom: '' }); 
    setBatchDon({ ...batchDon, montant: '' });
};

const removeFromTempList = (id) => {
    setTempDonations(tempDonations.filter(item => item.idTemp !== id));
};

const saveAllTempDonations = async () => {
    if (tempDonations.length === 0) return;
    
    setIsLoading(true);
    try {
        // On boucle sur la liste temporaire pour enregistrer chaque don
        for (const item of tempDonations) {
            const payload = {
                personne: item.personne,
                don: {
                    montant: item.don.montant,
                    dateDon: item.don.dateDon,
                    idType: parseInt(item.don.idType)
                }
            };
            await donService.post(payload);
        }
        
        alert("✅ Série de dons enregistrée avec succès !");
        setTempDonations([]); // Vider la liste
        setShowBatchSection(false); // Fermer la section
        await fetchRecentDons(); // Rafraîchir la table des dons récents
        
    } catch (error) {
        console.error("Erreur lors de l'enregistrement de la série:", error);
        alert("❌ Une erreur est survenue lors de l'enregistrement groupé.");
    } finally {
        setIsLoading(false);
    }
};

    return (
        <div className="container-fluid mt-4">
            <h1 className="mb-4 text-primary">
                {isEditing ? `Modification du Don ID ${donToEditId}` : `Saisie d'un Nouveau Don`}
            </h1>
            
            {isLoading && <div className="alert alert-warning">Opération en cours...</div>}
            
            <form onSubmit={isEditing ? handleUpdate : handleSubmit} style={{ opacity: isLoading ? 0.6 : 1 }}>
                
                <div className="row g-4"> 
                    
                    {/* Section 1: Informations du Donateur */}
                    <div className="col-lg-6 col-md-12">
                        <div className="card shadow-sm">
                            <div className="card-header bg-secondary text-white">
                                <h2>Donateur (Personne)</h2>
                            </div>
                            <div className="card-body">
                                
                                {/* Sélecteur de Donateur */}
                                {selectedPersonId === 0 || isEditing ? (
                                    <button 
                                        type="button" 
                                        className="btn btn-outline-info w-100 mb-3"
                                        onClick={() => setIsDonorModalOpen(true)}
                                        disabled={isEditing && selectedPersonId !== 0}
                                    >
                                        <FaSearch className="me-2" /> Chercher et Sélectionner un Donateur Existant
                                    </button>
                                ) : (
                                    <div className="alert alert-success d-flex justify-content-between align-items-center">
                                        <span>
                                            <FaCheckCircle className="me-2" /> 
                                            **Sélectionné : {personne.nom}** (ID: {selectedPersonId})
                                        </span>
                                        <button 
                                            type="button" 
                                            className="btn btn-sm btn-outline-secondary"
                                            onClick={resetForm} 
                                        >
                                            <FaTimes /> Changer
                                        </button>
                                    </div>
                                )}

                                <div className="mb-3">
                                    <label className="form-label">Nom Complet *</label>
                                    <input 
                                        type="text" 
                                        name="nom" 
                                        placeholder="Nom Complet *" 
                                        value={personne.nom} 
                                        onChange={handlePersonChange} 
                                        className="form-control"
                                        required 
                                        disabled={selectedPersonId !== 0 && !isEditing} 
                                    />
                                </div>
                                
                                {/* ... (autres champs contact/adresse) ... */}
                                <div className="mb-3">
                                    <label className="form-label">Contact</label>
                                    <input 
                                        type="text" 
                                        name="contact" 
                                        placeholder="Contact (téléphone, email)" 
                                        value={personne.contact} 
                                        onChange={handlePersonChange} 
                                        className="form-control"
                                        disabled={selectedPersonId !== 0 && !isEditing}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Adresse</label>
                                    <textarea 
                                        name="adresse" 
                                        placeholder="Adresse Complète" 
                                        value={personne.adresse} 
                                        onChange={handlePersonChange} 
                                        className="form-control"
                                        disabled={selectedPersonId !== 0 && !isEditing}
                                    />
                                </div>
                                
                                {selectedPersonId === 0 && !isEditing && (
                                     <div className="alert alert-warning mt-3">
                                        <FaPlusCircle className="me-2" /> 
                                        **Nouveau Donateur** (Création de la fiche)
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Détails du Don */}
                    <div className="col-lg-6 col-md-12">
                        <div className="card shadow-sm">
                            <div className="card-header bg-secondary text-white">
                                <h2 className="mb-0">Détails du Don</h2>
                            </div>
                            <div className="card-body">
                                    <label className="form-label fw-bold">Type de Don *</label>
                                    
                                    <div className="d-flex flex-wrap gap-2 mb-3">
                                        {/* 1. LES TYPES PRIORITAIRES */}
                                        {mainTypes.map(type => (
                                            <button 
                                                key={type.id} type="button"
                                                className={`btn ${type.id == don.idType ? 'btn-primary' : 'btn-outline-primary'}`}
                                                onClick={() => handleTypeDonCardClick(type.id)}
                                                disabled={isEditing}
                                            >
                                                {type.libelle}
                                            </button>
                                        ))}

                                        {/* 2. LE TYPE "EXTRA" (S'affiche seulement s'il est sélectionné dans le modal) */}
                                        {selectedExtraType && (
                                            <button 
                                                type="button"
                                                className="btn btn-primary shadow-sm animate__animated animate__fadeIn"
                                                onClick={() => handleTypeDonCardClick(selectedExtraType.id)}
                                            >
                                                <FaDonate className="me-1" /> {selectedExtraType.libelle}
                                            </button>
                                        )}

                                        {/* 3. BOUTON POUR OUVRIR LE MODAL */}
                                        <button 
                                    type="button" 
                                    className="btn btn-outline-secondary border-dashed"
                                    onClick={() => { setSearchTypeTerm(""); setIsSelectionTypeModalOpen(true); }}
                                    disabled={isEditing}
                                >
                                    <FaSearch className="me-1" /> Plus...
                                </button>
                                    </div>


                                {/* ... reste de vos champs (Montant, Date) ... */}
                                <div className="mb-3">
                                    {!isMaharitra && (
                                        <>
                                            <label className="form-label">Montant du Don (Ar) *</label>
                                            <input type="number" name="montant" placeholder="Montant du Don (Ar)"
                                                value={don.montant} onChange={(e) => handleChange(e, setDon)} required
                                                className="form-control" 
                                            />
                                        </>
                                    )}
                                </div>
                                
                                <div className="mb-3">
                                    <label className="form-label">Date du Don / Paiement *</label>
                                    <input type="date" name="dateDon" value={don.dateDon} onChange={(e) => handleChange(e, setDon)} required 
                                        className="form-control" 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
                
                {/* --- Section 3: Champs MAHARITRA --- */}
                {isMaharitra && (
                    <div className="row mt-4">
                        <div className="col-12">
                            <div className="card shadow-sm">
                                <div className="card-header bg-info text-white">
                                    <h2>Engagement Annuel (MAHARITRA)</h2>
                                </div>
                                <div className="card-body">

                                    <div className="row mb-3">
                                        <div className="col-md-6 mb-3 mb-md-0">
                                            <label className="form-label">Année de l'Engagement *</label>
                                            <input type="number" name="annee" placeholder="Année"
                                                value={maharitraCommitment.annee} onChange={(e) => handleChange(e, setMaharitraCommitment)} required
                                                className="form-control"
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Montant du Paiement Mensuel à Enregistrer (Ar) *</label>
                                            <input type="number" name="amountToRecord" placeholder="Montant par Mois"
                                                value={amountToRecord} onChange={(e) => setAmountToRecord(e.target.value)} required
                                                className="form-control"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="row row-cols-2 row-cols-md-4 row-cols-lg-6 g-3 mb-3">
                                        {monthlyStatus.map(month => {
                                            const isBeingRecorded = paymentsToRecord.some(p => p.mois === month.mois);
                                            const isPaidInDB = month.statut === 'PAID'; 
                                            
                                            let badgeClass = 'bg-secondary text-white';
                                            let icon = <FaClock className="me-1" />;
                                            let titleText = "À payer";
                                            
                                            if (isPaidInDB) {
                                                badgeClass = 'bg-success';
                                                icon = <FaPen className="me-1" />;
                                                titleText = `Payé: ${month.montantPaye.toLocaleString('fr-FR')} Ar (Cliquez pour éditer)`;
                                            } else if (isBeingRecorded) {
                                                badgeClass = 'bg-warning';
                                                icon = <FaCalendarPlus className="me-1" />;
                                                titleText = `Sélectionné: ${parseFloat(amountToRecord).toLocaleString('fr-FR')} Ar`;
                                            }

                                            return (
                                                <div className="col" key={month.mois}>
                                                    <div 
                                                        className={`card h-100 text-center shadow-sm ${isPaidInDB ? 'border-success' : isBeingRecorded ? 'border-warning' : 'border-light'}`}
                                                        onClick={() => handleMonthToggle(month.mois)} 
                                                        style={{ cursor: 'pointer' }} 
                                                        title={titleText}
                                                    >
                                                        <div className={`card-header p-2 fw-bold text-dark ${isPaidInDB ? 'bg-success-subtle' : isBeingRecorded ? 'bg-warning-subtle' : 'bg-light'}`}>
                                                            {month.mois}
                                                        </div>
                                                        <div className="card-body p-2 d-flex flex-column justify-content-center">
                                                            <span className={`badge ${badgeClass} mb-1`}>{icon} {isPaidInDB ? 'Payé' : isBeingRecorded ? 'Sélectionné' : 'En attente'}</span>
                                                            <small className="text-muted">
                                                                {isPaidInDB ? month.montantPaye.toLocaleString('fr-FR') + ' Ar' : '-'}
                                                            </small>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    
                                    <div className="alert alert-info text-center mt-3">
                                        **Récapitulatif de l'Enregistrement :** {paymentsToRecord.length} mois sélectionnés pour un total de 
                                        <span className="fw-bold text-primary ms-2">
                                            {(paymentsToRecord.reduce((acc, p) => acc + parseFloat(p.montant), 0)).toLocaleString('fr-FR')} Ar
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Bouton de Soumission */}
                <div className="row mt-4">
                    <div className="col-12">
                        
                        {isEditing && (
                             <div className="alert alert-warning text-center mb-3">
                                <FaPen className="me-2" /> 
                                **Mode Modification** du Don ID: {donToEditId}
                            </div>
                        )}
                        
                       {/* --- TON BOUTON EXISTANT --- */}
                        <button 
                            type="submit" 
                            className={`btn btn-lg w-100 shadow-sm ${isEditing ? 'btn-warning' : 'btn-primary'}`} 
                            disabled={isLoading}
                        >
                            {isLoading 
                                ? 'Opération en cours...' 
                                : isEditing 
                                    ? <><FaPen className="me-2" /> Modifier le Don ({selectedTypeLabel})</> 
                                    : <><FaHeart className="me-2" /> Enregistrer le Don ({selectedTypeLabel})</>
                            }
                        </button>

                        {isEditing && (
                            <button 
                                type="button" 
                                className="btn btn-sm btn-outline-secondary w-100 mt-2" 
                                onClick={resetForm}
                            >
                                <FaTimes className="me-1" /> Annuler la Modification
                            </button>
                        )}

                        {/* --- LE NOUVEAU BOUTON POUR LA SÉRIE --- */}
                        {!isEditing && (
                            <div className="mt-3">
                                <div className="d-flex align-items-center my-3">
                                    <hr className="flex-grow-1" />
                                    <span className="mx-2 text-muted small fw-bold text-uppercase">Ou</span>
                                    <hr className="flex-grow-1" />
                                </div>
                                
                                <button 
                                    type="button" 
                                    className={`btn w-100 py-2 border-dashed shadow-sm d-flex align-items-center justify-content-center gap-2 ${showBatchSection ? 'btn-dark' : 'btn-outline-info'}`}
                                    style={{ borderStyle: 'dashed', borderWidth: '2px' }}
                                    onClick={() => {
                                        setShowBatchSection(!showBatchSection);
                                        // Optionnel : scroller vers le bas automatiquement
                                        if(!showBatchSection) setTimeout(() => window.scrollTo({top: document.body.scrollHeight, behavior: 'smooth'}), 100);
                                    }}
                                >
                                    <FaLayerGroup /> 
                                    {showBatchSection ? "Fermer la saisie en série" : "Ouvrir la saisie en série"}
                                    {tempDonations.length > 0 && (
                                        <span className="badge bg-danger ms-2">{tempDonations.length}</span>
                                    )}
                                </button>
                            </div>
                        )}
                     
                    </div>
                </div>
            </form>

            {/* --- LISTE DES DONS RÉCENTS --- */}
            <div className="row mt-5">
                <div className="col-12">
                    <h2 className="mb-3"><FaListAlt /> 10 Derniers Dons Enregistrés</h2>
                    
                    {recentDons.length === 0 && !isLoading ? (
                        <div className="alert alert-info">Aucun don récent trouvé.</div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-striped table-hover table-sm">
                                <thead className="table-dark">
                                    <tr>
                                        <th>Date</th>
                                        <th>Nom Donateur</th>
                                        <th>Contact</th>
                                        <th>Type de Don</th>
                                        <th>Montant</th>
                                        <th className="text-center" style={{ width: '200px' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentDons.map(don => (
                                        <tr key={don.idDon}>
                                            <td>{don.dateDon ? new Date(don.dateDon).toLocaleDateString('fr-FR') : 'N/A'}</td>
                                            {/* Nom Donateur est maintenant présent grâce à la correction API */}
                                            <td>{don.nomDonateur || 'N/A'}</td> 
                                            <td>{don.contact || 'N/A'}</td>
                                            <td>
                                                {don.libelleType || 'N/A'}
                                                {/* Affichage des mois payés Maharitra */}
                                                {don.libelleType === 'MAHARITRA' && don.moisPayes && don.moisPayes.length > 0 && (
                                                    <span className="badge bg-primary ms-2" style={{ fontSize: '0.75em' }}>
                                                        ({don.moisPayes})
                                                    </span>
                                                )}
                                            </td>
                                            <td className="fw-bold">{parseFloat(don.montant || 0).toLocaleString('fr-FR')} Ar</td>
                                            <td className="text-center">
                                                <div className="btn-group btn-group-sm" role="group">
                                                    <button 
                                                        className="btn btn-outline-warning" 
                                                        onClick={() => handleEditDon(don)}
                                                        title="Modifier le don"
                                                        disabled={isLoading || isEditing}
                                                    >
                                                        <FaPen />
                                                    </button>
                                                    <button 
                                                        className="btn btn-outline-danger" 
                                                        onClick={() => handleDeleteDon(don.idDon, don.nomDonateur)}
                                                        title="Supprimer le don"
                                                        disabled={isLoading || isEditing}
                                                    >
                                                        <FaTrashAlt />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
            {showBatchSection && (
    <div className="mt-5 pt-4 border-top animate__animated animate__fadeIn">
        <div className="d-flex align-items-center mb-4">
            <div className="bg-info p-2 rounded-3 me-3 text-white">
                <FaLayerGroup size={24} />
            </div>
            <div>
                <h3 className="mb-0 text-dark fw-bold">Saisie de Dons en Série</h3>
                <p className="text-muted mb-0">Ajoutez plusieurs donateurs à la liste avant de tout valider d'un coup.</p>
            </div>
        </div>

        <div className="row g-4">
            {/* COLONNE GAUCHE : FORMULAIRE RAPIDE */}
            <div className="col-lg-4">
                <div className="card shadow-sm border-0 bg-light">
                    <div className="card-body">
                        <div className="mb-3">
                            <label className="form-label fw-bold small text-uppercase">Type</label>
                            <div className="input-group">
                                <select 
                                    className="form-select border-primary-subtle"
                                    value={batchDon.idType || ""}
                                    onChange={(e) => setBatchDon({...batchDon, idType: e.target.value})}
                                >
                                    <option value="">Choisir...</option>
                                    {donationTypes.map(t => <option key={t.id} value={t.id}>{t.libelle}</option>)}
                                </select>
                                <button className="btn btn-primary" onClick={() => setIsSelectionTypeModalOpen(true)}>
                                    <FaSearch />
                                </button>
                            </div>
                        </div>

                        <div className="mb-3">
                            <label className="form-label fw-bold small text-uppercase">Nom du Donateur</label>
                            <input 
                                type="text" 
                                className="form-control" 
                                placeholder="NOM COMPLET"
                                value={batchPersonne.nom}
                                onChange={(e) => setBatchPersonne({...batchPersonne, nom: e.target.value.toUpperCase()})}
                            />
                        </div>

                        {/* AJOUT DU CHAMP ADRESSE ICI */}
                        <div className="mb-3">
                            <label className="form-label fw-bold small text-uppercase">Adresse</label>
                            <input 
                                type="text" 
                                className="form-control" 
                                placeholder="LOT OU QUARTIER"
                                value={batchPersonne.adresse}
                                onChange={(e) => setBatchPersonne({...batchPersonne, adresse: e.target.value})}
                            />
                        </div>

                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label fw-bold small text-uppercase">Montant (Ar)</label>
                                <input 
                                    type="number" 
                                    className="form-control fw-bold text-primary" 
                                    value={batchDon.montant}
                                    onChange={(e) => setBatchDon({...batchDon, montant: e.target.value})}
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label fw-bold small text-uppercase">Contact</label>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    placeholder="03x xx xxx xx"
                                    value={batchPersonne.contact}
                                    onChange={(e) => setBatchPersonne({...batchPersonne, contact: e.target.value})}
                                />
                            </div>
                        </div>

                        <button className="btn btn-success w-100 fw-bold shadow-sm mt-2" onClick={addToTempList}>
                            <FaPlus className="me-2" /> Ajouter à la liste
                        </button>
                    </div>
                </div>
            </div>

            {/* COLONNE DROITE : TABLEAU TEMPORAIRE MODIFIÉ */}
            <div className="col-lg-8">
                <div className="card shadow-sm border-0 h-100">
                    <div className="card-header bg-white py-3">
                        <div className="d-flex justify-content-between align-items-center">
                            <span className="fw-bold">Liste temporaire</span>
                            <span className="badge bg-primary px-3 py-2">
                                Total : {tempDonations.reduce((sum, item) => sum + parseFloat(item.don.montant || 0), 0).toLocaleString()} Ar
                            </span>
                        </div>
                    </div>
                    <div className="table-responsive" style={{minHeight: '200px'}}>
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Donateur</th>
                                    <th>Adresse</th> {/* NOUVELLE COLONNE */}
                                    <th>Type</th>
                                    <th>Montant</th>
                                    <th className="text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tempDonations.length === 0 ? (
                                    <tr><td colSpan="5" className="text-center py-5 text-muted italic">Aucun don dans la série.</td></tr>
                                ) : (
                                    tempDonations.map((item) => (
                                        <tr key={item.idTemp}>
                                            <td>
                                                <div className="fw-bold">{item.personne.nom}</div>
                                                <div className="small text-muted">{item.personne.contact}</div>
                                            </td>
                                            {/* AFFICHAGE DE L'ADRESSE DANS LA LISTE */}
                                            <td className="small text-muted">{item.personne.adresse || "---"}</td>
                                            <td><span className="badge bg-info-subtle text-info border border-info-subtle">{item.typeLibelle}</span></td>
                                            <td className="text-primary fw-bold">{parseFloat(item.don.montant).toLocaleString()} Ar</td>
                                            <td className="text-center">
                                                <button className="btn btn-link text-danger p-0" onClick={() => removeFromTempList(item.idTemp)}>
                                                    <FaTrashAlt />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="card-footer bg-white border-0 p-3">
                        <button 
                            className="btn btn-primary btn-lg w-100 fw-bold" 
                            disabled={tempDonations.length === 0 || isLoading}
                            onClick={saveAllTempDonations}
                        >
                            {isLoading ? "Enregistrement groupé..." : `VALIDER ET ENREGISTRER LA SÉRIE (${tempDonations.length})`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
)}      
            {/* --- MODAL DE SÉLECTION DE TYPE --- */}
            {isSelectionTypeModalOpen && (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}>
        <div className="modal-dialog modal-dialog-centered shadow-lg">
            <div className="modal-content border-0">
                <div className="modal-header bg-light">
                    <h5 className="modal-title fw-bold text-primary">
                        <FaSearch className="me-2"/>Choisir ou créer un type
                    </h5>
                    <button type="button" className="btn-close" onClick={() => { setIsSelectionTypeModalOpen(false); setIsAddingNewType(false); }}></button>
                </div>
                
                <div className="modal-body" style={{ maxHeight: '450px', overflowY: 'auto' }}>
                    
                    {/* --- ZONE D'AJOUT RAPIDE --- */}
                    {!isAddingNewType ? (
                        <div className="d-flex gap-2 mb-3 sticky-top bg-white pt-1">
                            <div className="input-group">
                                <span className="input-group-text bg-white border-end-0"><FaSearch className="text-muted"/></span>
                                <input 
                                    type="text" 
                                    className="form-control border-start-0" 
                                    placeholder="Rechercher..."
                                    value={searchTypeTerm}
                                    onChange={(e) => setSearchTypeTerm(e.target.value)}
                                />
                            </div>
                            <button 
                                className="btn btn-success" 
                                onClick={() => setIsAddingNewType(true)}
                                title="Ajouter un nouveau type"
                            >
                                <FaPlus />
                            </button>
                        </div>
                    ) : (
                        <div className="card card-body bg-light mb-3 border-success animate__animated animate__fadeInDown">
                            <label className="form-label fw-bold">Nouveau type de don :</label>
                            <div className="input-group">
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    placeholder="Ex: DON EN NATURE"
                                    value={newTypeLibelle}
                                    autoFocus
                                    onChange={(e) => setNewTypeLibelle(e.target.value)}
                                />
                                <button className="btn btn-primary" onClick={handleAddNewType}>Enregistrer</button>
                                <button className="btn btn-outline-secondary" onClick={() => setIsAddingNewType(false)}>Annuler</button>
                            </div>
                        </div>
                    )}

                    {/* --- LISTE DES TYPES --- */}
                    <div className="list-group list-group-flush">
                        {otherTypes
                            .filter(t => t.libelle.toLowerCase().includes(searchTypeTerm.toLowerCase()))
                            .map(type => (
                                <button 
                                    key={type.id}
                                    type="button"
                                    className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${don.idType == type.id ? 'bg-light fw-bold text-primary' : ''}`}
                                    onClick={() => {
                                        handleTypeDonCardClick(type.id);
                                        setIsSelectionTypeModalOpen(false);
                                    }}
                                >
                                    {type.libelle}
                                    {don.idType == type.id && <span className="badge bg-primary rounded-pill">Actif</span>}
                                </button>
                            ))
                        }
                    </div>
                </div>
            </div>
        </div>
    </div>
)}
            {/* --- MODALES (inchangées) --- */}
            {isModalOpen && (
                <AddTypeDonModal 
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleAddDonationType}
                />
            )}
            
            {isDonorModalOpen && (
                <SelectDonorModal
                    donors={existingDonors}
                    onClose={() => setIsDonorModalOpen(false)}
                    onSelect={handleDonorSelect}
                />
            )}

            {isEditModalOpen && monthToEdit && (
                <EditMaharitraPaymentModal
                    monthData={monthToEdit}
                    annee={maharitraCommitment.annee}
                    onClose={(shouldRefresh = false) => { 
                        setIsEditModalOpen(false);
                        setMonthToEdit(null);
                        
                        if (shouldRefresh) {
                            setRefreshTrigger(prev => prev + 1); 
                            fetchRecentDons(); 
                        }
                    }}
                    donMensuelService={donMensuelService}
                />
            )}
        </div>
    );
};


// ------------------------------------------------------------------
// COMPOSANTS MODAUX (Non modifiés)
// ------------------------------------------------------------------

const AddTypeDonModal = ({ onClose, onSave }) => {
    // ... (Code de la modale AddTypeDonModal)
    const [libelle, setLibelle] = useState('');
    const handleSubmit = (e) => {
        e.preventDefault();
        if (libelle.trim()) onSave(libelle);
    };

    return (
        <div className="modal fade show d-block" tabIndex="-1" onClick={onClose} style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
            <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="modal-content">
                    <div className="modal-header bg-primary text-white">
                        <h5 className="modal-title">Ajouter un Nouveau Type de Don</h5>
                        <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                            <div className="mb-3">
                                <label htmlFor="libelleTypeDon" className="form-label">Libellé du Type de Don</label>
                                <input
                                    id="libelleTypeDon"
                                    type="text"
                                    placeholder="Ex: Soutien Événementiel"
                                    value={libelle}
                                    onChange={(e) => setLibelle(e.target.value)}
                                    className="form-control"
                                    required
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" onClick={onClose} className="btn btn-secondary">Annuler</button>
                            <button type="submit" className="btn btn-success" disabled={!libelle.trim()}>
                                Enregistrer
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

const SelectDonorModal = ({ donors, onClose, onSelect }) => {
    // ... (Code de la modale SelectDonorModal)
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const donorsPerPage = 10; 

    const filteredDonors = donors.filter(donor => 
        donor.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (donor.contact && donor.contact.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (donor.adresse && donor.adresse.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    const totalPages = Math.ceil(filteredDonors.length / donorsPerPage);
    const startIndex = (currentPage - 1) * donorsPerPage;
    const currentDonors = filteredDonors.slice(startIndex, startIndex + donorsPerPage);

    const paginate = (pageNumber) => {
        if (pageNumber > 0 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);


    return (
        <div className="modal fade show d-block" tabIndex="-1" onClick={onClose} style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
            <div className="modal-dialog modal-xl" onClick={(e) => e.stopPropagation()}>
                <div className="modal-content">
                    <div className="modal-header bg-primary text-white">
                        <h5 className="modal-title"><FaSearch /> Rechercher un Donateur Existant</h5>
                        <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
                    </div>
                    
                    <div className="modal-body">
                        <input
                            type="text"
                            placeholder="Rechercher par Nom, Contact ou Adresse..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="form-control mb-3"
                        />

                        <div className="table-responsive">
                            {currentDonors.length === 0 ? (
                                <div className="alert alert-warning">
                                    {searchTerm ? `Aucun donateur trouvé pour "${searchTerm}".` : "Chargement des donateurs..."}
                                </div>
                            ) : (
                                <>
                                    <table className="table table-striped table-hover table-sm">
                                        <thead className="table-light">
                                            <tr>
                                                <th>ID</th>
                                                <th>Nom</th>
                                                <th>Contact</th>
                                                <th>Adresse</th>
                                                <th style={{ width: '120px' }}>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentDonors.map(donor => (
                                                <tr key={donor.idPersonne}>
                                                    <td>{donor.idPersonne}</td>
                                                    <td>{donor.nom}</td>
                                                    <td>{donor.contact || 'N/A'}</td>
                                                    <td>{donor.adresse || 'N/A'}</td>
                                                    <td>
                                                        <button 
                                                            type="button" 
                                                            className="btn btn-sm btn-success w-100"
                                                            onClick={() => onSelect(donor)}
                                                        >
                                                            Sélectionner
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    
                                    <div className="d-flex justify-content-between align-items-center mt-3">
                                        <button 
                                            type="button" 
                                            onClick={() => paginate(currentPage - 1)} 
                                            disabled={currentPage === 1}
                                            className="btn btn-sm btn-outline-secondary"
                                        >
                                            <FaChevronLeft /> Précédent
                                        </button>
                                        <span className="text-muted">Page {currentPage} sur {totalPages}</span>
                                        <button 
                                            type="button" 
                                            onClick={() => paginate(currentPage + 1)} 
                                            disabled={currentPage === totalPages}
                                            className="btn btn-sm btn-outline-secondary"
                                        >
                                            Suivant <FaChevronRight />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn btn-secondary">Fermer</button>
                    </div>
                </div>
            </div>
            
        </div>
    );
};

const EditMaharitraPaymentModal = ({ monthData, annee, onClose, donMensuelService }) => {
    // ... (Code de la modale EditMaharitraPaymentModal)
    const { mois, montantPaye, paiements } = monthData;
    const [isLoadingEdit, setIsLoadingEdit] = useState(false);

    const handleDeletePayment = async (idMensuel) => {
        if (!idMensuel) {
            alert("Erreur: ID du paiement manquant.");
            return;
        }

        if (!window.confirm(`Êtes-vous sûr de vouloir SUPPRIMER ce paiement (Montant: ${paiements.find(p => p.idMensuel === idMensuel)?.montant.toLocaleString('fr-FR') || 'N/A'} Ar) ? Cette action est irréversible.`)) {
            return;
        }

        setIsLoadingEdit(true);
        try {
            await donMensuelService.deleteMensuel(idMensuel); 
            
            alert(`✅ Succès! Paiement ID ${idMensuel} supprimé. La liste Maharitra sera mise à jour.`);
            
            onClose(true); // Fermer la modale et déclencher le refresh
            
        } catch (error) {
            console.error("Erreur lors de la suppression du paiement mensuel:", error.response?.data || error);
            alert(`❌ Erreur: Impossible de supprimer le paiement. Détail: ${error.response?.data?.details || error.message}`);
        } finally {
            setIsLoadingEdit(false);
        }
    };
    
    return (
        <div className="modal fade show d-block" tabIndex="-1" onClick={() => onClose()} style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
            <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
                <div className="modal-content">
                    <div className="modal-header bg-info text-white">
                        <h5 className="modal-title"><FaPen /> Historique des Paiements pour {mois} {annee}</h5>
                        <button type="button" className="btn-close btn-close-white" onClick={() => onClose()} disabled={isLoadingEdit} aria-label="Close"></button>
                    </div>
                    
                    <div className="modal-body">
                        {isLoadingEdit && <div className="alert alert-warning">Opération en cours...</div>}
                        <p className="lead text-center fw-bold">
                            Montant total Payé : {montantPaye.toLocaleString('fr-FR')} Ar
                        </p>
                        
                        {paiements.length === 0 ? (
                            <div className="alert alert-info">Aucun détail de paiement trouvé.</div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-striped table-sm">
                                    <thead className="table-light">
                                        <tr>
                                            <th>ID Mensuel</th>
                                            <th>Montant</th>
                                            <th>Date Paiement</th>
                                            <th style={{ width: '150px' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paiements.map(p => (
                                            <tr key={p.idMensuel || `${p.mois}-${p.datePaiement}-${p.montant}`}>
                                                <td>{p.idMensuel || 'N/A'}</td>
                                                <td>{p.montant.toLocaleString('fr-FR')} Ar</td>
                                                <td>{(p.datePaiement && new Date(p.datePaiement).toLocaleDateString('fr-FR')) || 'N/A'}</td>
                                                <td>
                                                    {p.idMensuel ? (
                                                        <button 
                                                            type="button" 
                                                            className="btn btn-sm btn-danger w-100"
                                                            onClick={() => handleDeletePayment(p.idMensuel)}
                                                            disabled={isLoadingEdit}
                                                        >
                                                            <FaTrashAlt /> Supprimer
                                                        </button>
                                                    ) : (
                                                        <span className="text-muted">ID manquant</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                    
                    <div className="modal-footer">
                        <button type="button" onClick={() => onClose(false)} className="btn btn-secondary" disabled={isLoadingEdit}>Fermer</button>
                    </div>
                </div>
            </div>
 
        </div>
        
    );
};


export default DonPage;