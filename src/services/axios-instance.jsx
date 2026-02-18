import axios from 'axios';
import { API_URL } from "../config/root/modules";

const axiosInstance = axios.create({
  baseURL: API_URL,
});

// Intercepteur pour ajouter le Token JWT et l'userId
axiosInstance.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem("user"));
  
  if (user) {
    // 1. On ajoute le Token JWT (Standard de sécurité)
    if (user.token) {
      config.headers['Authorization'] = `Bearer ${user.token}`;
    }

    // 2. On garde ton userId si tu en as besoin pour tes requêtes spécifiques
    if (user.id || user.idUser) {
      config.headers['x-user-id'] = user.id || user.idUser;
    }
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Optionnel : Gérer l'expiration du token (si le serveur répond 401)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Si le token est expiré ou invalide, on déconnecte l'user
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;