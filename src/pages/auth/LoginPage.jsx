import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import Swal from 'sweetalert2';
import { FaUser, FaLock, FaEye, FaEyeSlash, FaArrowRight, FaUserPlus, FaUserTie } from 'react-icons/fa';
import './LoginPage.css';

const LoginPage = () => {
    const [isRegisterMode, setIsRegisterMode] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState('CONSULTANT');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    const navigate = useNavigate();

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
        if (password !== confirmPassword) {
            return Swal.fire({ icon: 'warning', title: 'Attention', text: 'Les mots de passe ne correspondent pas' });
        }
        setIsLoading(true);
        try {
            await authService.register(username, password, role); 
            Swal.fire({ 
                icon: 'success', 
                title: 'Compte créé !', 
                text: 'Votre demande est en attente de validation par l\'administrateur.' 
            });
            setIsRegisterMode(false);
            setPassword('');
            setConfirmPassword('');
        } catch (error) {
            Swal.fire({ 
                icon: 'error', 
                title: 'Erreur', 
                text: error.response?.data?.error || 'Impossible de créer le compte' 
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-wrapper">
            <div className={`login-container ${isRegisterMode ? 'register-active' : ''}`}>
                
                {/* --- PANNEAU IMAGE AVEC FOND DYNAMIQUE --- */}
                <div 
                    className="login-image-section"
                    style={{ 
                        backgroundImage: `url('/images/radio.jpg')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                >
                    <div className="image-overlay"></div> {/* Voile pour la lisibilité */}
                    <div className="overlay-text">
       
                        <h3>Radio Maria Madagasikara</h3>
                        <p>{isRegisterMode ? "Rejoignez notre équipe d'administration." : "Plateforme de gestion des dons et donateurs."}</p>
                        <button type="button" className="btn-outline" onClick={() => setIsRegisterMode(!isRegisterMode)}>
                            {isRegisterMode ? "J'ai déjà un compte" : "Créer un compte"}
                        </button>
                    </div>
                </div>
                
                {/* --- PANNEAU FORMULAIRES --- */}
                <div className="login-form-section">
                    <div className="form-content">
                        {!isRegisterMode ? (
                            <form onSubmit={handleLogin} className="login-form animate-fade">
                                <div className="form-header">
                                    <h2>Bon retour !</h2>
                                    <p>Connectez-vous pour accéder au panel</p>
                                </div>
                                <div className="input-group">
                                    <label><FaUser /> Utilisateur</label>
                                    <input type="text" placeholder="Votre pseudo" value={username} onChange={(e) => setUsername(e.target.value)} required />
                                </div>
                                <div className="input-group">
                                    <label><FaLock /> Mot de passe</label>
                                    <div className="password-wrapper">
                                        <input type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                                        <span className="toggle-password" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <FaEyeSlash /> : <FaEye />}</span>
                                    </div>
                                </div>
                                <button type="submit" className="btn-login" disabled={isLoading}>
                                    {isLoading ? "Connexion..." : <>Se connecter <FaArrowRight /></>}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleRegister} className="login-form animate-fade">
                                <div className="form-header">
                                    <h2>Nouveau Compte</h2>
                                    <p>Remplissez les détails ci-dessous</p>
                                </div>
                                <div className="input-group">
                                    <label><FaUser /> Nom d'utilisateur</label>
                                    <input type="text" placeholder="Pseudo" value={username} onChange={(e) => setUsername(e.target.value)} required />
                                </div>
                                <div className="input-group">
                                    <label><FaUserTie /> Rôle souhaité</label>
                                    <select value={role} onChange={(e) => setRole(e.target.value)} className="role-select" required>
                                        <option value="CONSULTANT">Consultant</option>
                                        <option value="ADMIN">Administrateur</option>
                                    </select>
                                </div>
                                <div className="input-row">
                                    <div className="input-group flex-1">
                                        <label><FaLock /> Password</label>
                                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                                    </div>
                                    <div className="input-group flex-1">
                                        <label><FaLock /> Confirm</label>
                                        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                                    </div>
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