import axios from 'axios';
import { API_URL } from "../config/root/modules";

const axiosInstance = axios.create({
  baseURL: API_URL,
});

// Intercepteur pour ajouter l'userId à toutes les requêtes
axiosInstance.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (user?.id) {
    config.headers['x-user-id'] = user.id;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default axiosInstance;
