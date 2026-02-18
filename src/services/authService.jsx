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

    // 🎯 AJOUTE CETTE FONCTION ICI
    async register(username, password) {
        const response = await axios.post(`${API_URL}/api/auth/register`, { username, password });
        return response.data;
    },

    // 2. Déconnexion
    logout() {
        localStorage.removeItem("user");
    },

    // 3. Récupérer les infos de l'utilisateur actuel
    getCurrentUser() {
        const user = localStorage.getItem("user");
        return user ? JSON.parse(user) : null;
    }
};

export default authService;