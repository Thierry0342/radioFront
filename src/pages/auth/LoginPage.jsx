import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import Swal from 'sweetalert2';
import { FaUser, FaLock, FaEye, FaEyeSlash, FaArrowRight, FaArrowLeft, FaUserPlus } from 'react-icons/fa';
import './LoginPage.css';

const LoginPage = () => {
    const [isRegisterMode, setIsRegisterMode] = useState(false); // Gère le basculement
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    // Redirection automatique si déjà connecté
    useEffect(() => {
        if (authService.getCurrentUser()) {
            navigate('/dashboard');
        }
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await authService.login(username, password);
            navigate('/dashboard');
            window.location.reload(); 
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Erreur', text: 'Identifiants incorrects' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // ⚠️ VÉRIFIE CETTE LIGNE : Elle doit appeler le service
            const response = await authService.register(username, password); 
            
            console.log("Réponse du serveur:", response); // Debug
    
            Swal.fire({ icon: 'success', title: 'Compte créé !' });
            setIsRegisterMode(false); 
        } catch (error) {
            console.error("Erreur register:", error);
            Swal.fire({ icon: 'error', title: 'Erreur', text: 'Échec de création' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-wrapper">
            <div className={`login-container ${isRegisterMode ? 'register-active' : ''}`}>
                
                {/* --- PANNEAU IMAGE / LOGO --- */}
                <div className="login-image-section">
                    <div className="overlay-text">
                        <h1>Radio Maria</h1>
                        <p>{isRegisterMode ? "Rejoignez notre équipe d'administration." : "Plateforme de gestion des dons et donateurs."}</p>
                        <button className="btn-outline" onClick={() => setIsRegisterMode(!isRegisterMode)}>
                            {isRegisterMode ? "J'ai déjà un compte" : "Créer un compte"}
                        </button>
                    </div>
                </div>
                
                {/* --- PANNEAU FORMULAIRES --- */}
                <div className="login-form-section">
                    <div className="form-content">
                        
                        {/* FORMULAIRE LOGIN */}
                        {!isRegisterMode ? (
                            <form onSubmit={handleLogin} className="login-form animate-fade">
                                <h2>Bon retour !</h2>
                                <div className="input-group">
                                    <label><FaUser /> Utilisateur</label>
                                    <input type="text" placeholder="Admin" value={username} onChange={(e) => setUsername(e.target.value)} required />
                                </div>
                                <div className="input-group">
                                    <label><FaLock /> Mot de passe</label>
                                    <div className="password-wrapper">
                                        <input type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                                        <span onClick={() => setShowPassword(!showPassword)}>{showPassword ? <FaEyeSlash /> : <FaEye />}</span>
                                    </div>
                                </div>
                                <button type="submit" className="btn-login" disabled={isLoading}>
                                    {isLoading ? "Connexion..." : <>Se connecter <FaArrowRight /></>}
                                </button>
                            </form>
                        ) : (
                            /* FORMULAIRE CREATION */
                            <form onSubmit={handleRegister} className="login-form animate-fade">
                                <h2>Nouveau Compte</h2>
                                <div className="input-group">
                                    <label><FaUser /> Nom d'utilisateur</label>
                                    <input type="text" placeholder="Nouvel admin" value={username} onChange={(e) => setUsername(e.target.value)} required />
                                </div>
                                <div className="input-group">
                                    <label><FaLock /> Mot de passe</label>
                                    <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                                </div>
                                <div className="input-group">
                                    <label><FaLock /> Confirmer</label>
                                    <input type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                                </div>
                                <button type="submit" className="btn-register" disabled={isLoading}>
                                    {isLoading ? "Création..." : <>Créer le compte <FaUserPlus /></>}
                                </button>
                            </form>
                        )}
                        
                    </div>
                </div>

            </div>
        </div>
    );
};

export default LoginPage;