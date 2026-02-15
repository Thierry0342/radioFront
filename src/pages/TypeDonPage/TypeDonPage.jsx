import React, { useState, useEffect } from 'react';
import { FaTag, FaPlus, FaEdit, FaTrash, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import typeDonService from '../../services/typeDonService'; // Import de ton service
import './TypeDonPage.css';

const TypeDonPage = () => {
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newType, setNewType] = useState({ libelle: '', description: '' });

    // 1. Charger les types existants depuis la DB
    useEffect(() => {
        loadTypes();
    }, []);

    const loadTypes = async () => {
        setLoading(true);
        try {
            const response = await typeDonService.getAll();
            setTypes(response.data);
        } catch (error) {
            console.error("Erreur lors du chargement des types:", error);
        } finally {
            setLoading(false);
        }
    };

    // 2. Ajouter un nouveau type
    const handleAddType = async (e) => {
        e.preventDefault();
        if (!newType.libelle) return;
        
        try {
            await typeDonService.post(newType);
            setNewType({ libelle: '', description: '' });
            loadTypes(); // Recharger la liste
        } catch (error) {
            console.error("Erreur d'ajout:", error);
        }
    };

    // 3. Supprimer un type
    const handleDelete = async (id) => {
        if (window.confirm("Voulez-vous vraiment supprimer ce type de don ?")) {
            try {
                await typeDonService.delete(id);
                loadTypes();
            } catch (error) {
                console.error("Erreur de suppression:", error);
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
                            {types.map(t => (
                                <div key={t.idTypeDon || t.id} className="type-item-ui">
                                    <div className="type-info">
                                        <FaCheckCircle className="check-icon" />
                                        <div>
                                            <strong>{t.libelle}</strong>
                                            <p>{t.description || 'Aucune description fournie'}</p>
                                        </div>
                                    </div>
                                    <div className="type-actions">
                                        <button className="btn-edit"><FaEdit /></button>
                                        <button 
                                            className="btn-delete" 
                                            onClick={() => handleDelete(t.idTypeDon || t.id)}
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TypeDonPage;