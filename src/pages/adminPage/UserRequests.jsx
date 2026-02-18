import React, { useState, useEffect } from 'react';
import { FaUserClock, FaCheck, FaTimes, FaUserShield, FaSpinner } from 'react-icons/fa';
import adminService from '../../services/adminService';
import Swal from 'sweetalert2';
import './UserRequests.css'; // Crée un petit fichier CSS pour le look

const UserRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
    });

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await adminService.getPendingUsers();
            setRequests(res.data);
        } catch (error) {
            console.error("Erreur chargement requêtes", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDecision = async (user, status) => {
        const actionText = status === 'APPROVED' ? 'approuver' : 'rejeter';
        
        const result = await Swal.fire({
            title: `Voulez-vous ${actionText} cet utilisateur ?`,
            text: `Utilisateur : ${user.username}`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: status === 'APPROVED' ? '#48bb78' : '#e53e3e',
            confirmButtonText: status === 'APPROVED' ? 'Oui, valider' : 'Oui, rejeter',
            cancelButtonText: 'Annuler'
        });

        if (result.isConfirmed) {
            try {
                await adminService.validateUser(user.idUser, status);
                Toast.fire({ icon: 'success', title: `Utilisateur ${actionText} avec succès` });
                fetchRequests(); // Rafraîchir la liste
            } catch (error) {
                Toast.fire({ icon: 'error', title: "Erreur lors de l'opération" });
            }
        }
    };

    return (
        <div className="admin-requests-container">
            <header className="premium-header">
                <div className="brand-section">
                    <div className="brand-icon"><FaUserShield /></div>
                    <div className="brand-text">
                        <h1>Validation des comptes</h1>
                        <p>Approuvez ou refusez les demandes d'accès à la plateforme</p>
                    </div>
                </div>
            </header>

            <div className="requests-content">
                {loading ? (
                    <div className="loader-box"><FaSpinner className="spin" /> Chargement des demandes...</div>
                ) : (
                    <div className="requests-table-wrapper">
                        <table className="requests-table">
                            <thead>
                                <tr>
                                    <th>Date de demande</th>
                                    <th>Nom d'utilisateur</th>
                                    <th>Rôle demandé</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="empty-msg">
                                            <FaUserClock size={40} style={{opacity: 0.3, marginBottom: '10px'}} />
                                            <p>Aucune demande en attente pour le moment.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    requests.map(req => (
                                        <tr key={req.idUser}>
                                            <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                                            <td className="username-cell">{req.username}</td>
                                            <td><span className="role-tag">{req.role}</span></td>
                                            <td className="actions-cell">
                                                <button 
                                                    className="btn-approve" 
                                                    onClick={() => handleDecision(req, 'APPROVED')}
                                                    title="Approuver"
                                                >
                                                    <FaCheck /> Valider
                                                </button>
                                                <button 
                                                    className="btn-reject" 
                                                    onClick={() => handleDecision(req, 'REJECTED')}
                                                    title="Rejeter"
                                                >
                                                    <FaTimes /> Rejeter
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserRequests;