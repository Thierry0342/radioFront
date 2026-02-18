import React, { useState, useEffect } from 'react';
import { FaTag, FaPlus, FaEdit, FaTrash, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import typeDonService from '../../services/typeDonService';
import Swal from 'sweetalert2'; // On garde l'usage de SweetAlert2 pour la cohérence
import './TypeDonPage.css';

const TypeDonPage = () => {
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newType, setNewType] = useState({ libelle: '', description: '' });

    // Configuration du Toast
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
    });

    useEffect(() => {
        loadTypes();
    }, []);

    const loadTypes = async () => {
        setLoading(true);
        try {
            // Assure-toi que ton service renvoie aussi le nombre de dons par type (ex: countDons)
            const response = await typeDonService.getAll();
            setTypes(response.data);
        } catch (error) {
            console.error("Erreur lors du chargement des types:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddType = async (e) => {
        e.preventDefault();
        if (!newType.libelle) return;
        
        try {
            await typeDonService.post(newType);
            Toast.fire({ icon: 'success', title: 'Type ajouté avec succès' });
            setNewType({ libelle: '', description: '' });
            loadTypes();
        } catch (error) {
            console.error("Erreur d'ajout:", error);
            Toast.fire({ icon: 'error', title: "Erreur lors de l'ajout" });
        }
    };

    // --- LOGIQUE DE SUPPRESSION SÉCURISÉE ---
    const handleDelete = async (target) => {
        // 1. On détermine si 'target' est l'objet complet ou juste l'ID
        const isObject = typeof target === 'object' && target !== null;
        const id = isObject ? target.idType : target;
        const libelle = isObject ? target.libelle : "ce type";
        const countDons = isObject ? parseInt(target.countDons || 0) : 0;
    
        // Sécurité : Si pas d'ID, on s'arrête
        if (!id) {
            console.error("ID manquant pour la suppression", target);
            return;
        }
    
        // 2. Vérification du compteur de dons
        if (countDons > 0) {
            Swal.fire({
                icon: 'error',
                title: 'Suppression impossible',
                text: `Ce type est lié à ${countDons} don(s).`,
                confirmButtonColor: '#3085d6'
            });
            return;
        }
    
        // 3. Confirmation SweetAlert2
        const result = await Swal.fire({
            title: 'Êtes-vous sûr ?',
            text: `Le type "${libelle}" sera définitivement supprimé.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Oui, supprimer',
            cancelButtonText: 'Annuler'
        });
    
        if (result.isConfirmed) {
            try {
                // Appel au service avec l'ID propre
                await typeDonService.delete(id);
                
                Toast.fire({ icon: 'success', title: 'Type supprimé' });
                
                // Recharger la liste pour mettre à jour l'affichage
                loadTypes(); 
            } catch (error) {
                console.error("Erreur de suppression:", error);
                const serverMsg = error.response?.data?.error || 'Erreur lors de la suppression';
                Toast.fire({ icon: 'error', title: serverMsg });
            }
        }
    };

    return (
        <div className="type-don-container">
            <header className="premium-header">
                <div className="header-top">
                    <div className="brand-section">
                        <div className="brand-icon"><FaTag /></div>
                        <div className="brand-text">
                            <h1>Configurations</h1>
                            <p>Définissez les catégories de collectes réelles</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="type-don-content">
                <div className="config-card add-card">
                    <h3><FaPlus /> Nouveau Type</h3>
                    <form onSubmit={handleAddType}>
                        <div className="form-group-ui">
                            <label>Nom du type</label>
                            <input 
                                type="text" 
                                placeholder="ex: Dîme, Construction..." 
                                value={newType.libelle}
                                onChange={(e) => setNewType({...newType, libelle: e.target.value})}
                                required
                            />
                        </div>
                        <div className="form-group-ui">
                            <label>Description</label>
                            <textarea 
                                placeholder="Détails du projet..." 
                                value={newType.description}
                                onChange={(e) => setNewType({...newType, description: e.target.value})}
                            ></textarea>
                        </div>
                        <button type="submit" className="btn-save">Enregistrer dans la DB</button>
                    </form>
                </div>

                <div className="config-card list-card">
                    <h3>Types enregistrés ({types.length})</h3>
                    {loading ? (
                        <div className="loader-box"><FaSpinner className="spin" /> Chargement...</div>
                    ) : (
                        <div className="types-list">
                            {types.map(t => {
                                const isUsed = t.countDons > 0;
                                return (
                                    <div key={t.idTypeDon || t.id} className={`type-item-ui ${isUsed ? 'is-locked' : ''}`}>
                                        <div className="type-info">
                                            <FaCheckCircle className="check-icon" />
                                            <div>
                                                <strong>{t.libelle}</strong>
                                                <p>{t.description || 'Aucune description fournie'}</p>
                                                {isUsed && <small className="lock-text">Utilisé par {t.countDons} dons</small>}
                                            </div>
                                        </div>
                                        <div className="type-actions">
                                            <button className="btn-edit" title="Modifier"><FaEdit /></button>
                                            <button 
                                                className={`btn-delete ${isUsed ? 'disabled' : ''}`} 
                                                onClick={() => handleDelete(t.idType)}
                                                title={isUsed ? "Impossible de supprimer" : "Supprimer"}
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TypeDonPage;