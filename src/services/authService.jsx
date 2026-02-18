import axios from "axios";
import { API_URL } from "../config/root/modules";

const authService = {
    // 1. Connexion
    async login(username, password) {
        const response = await axios.post(`${API_URL}/api/auth/login`, { username, password });
        if (response.data.token) {
            localStorage.setItem("user", JSON.stringify(response.data));
        }
        return response.data;
    },

    // 2. Création de compte (AVEC LE RÔLE)
    async register(username, password, role) {
        const response = await axios.post(`${API_URL}/api/auth/register`, { 
            username, 
            password, 
            role 
        });
        return response.data;
    },

    // 3. Déconnexion
    logout() {
        localStorage.removeItem("user");
        localStorage.removeItem("lastSeenDonId"); // Optionnel : nettoyer les notifs
    },

    // 4. Récupérer l'utilisateur actuel
    getCurrentUser() {
        const user = localStorage.getItem("user");
        return user ? JSON.parse(user) : null;
    }
};

export default authService;