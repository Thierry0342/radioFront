import axios from "axios";
import { API_URL } from "../config/root/modules";
import axiosInstance from "./axios-instance";

const donService = {
  
  // ===================================================================
  // OPÉRATIONS CRUD DE BASE
  // ===================================================================
  
  getAll() {
    return axios.get(`${API_URL}/api/don`);
  },

  getByPersonne(idPersonne) {
    return axios.get(`${API_URL}/api/don/personne/${idPersonne}`);
  },

  post(data) {
    return axiosInstance.post(`${API_URL}/api/don`, data);
  },
  
  getRecentDons: (limit = 10) => {
    return axios.get(`${API_URL}/api/don/recent`, { params: { limit } });
  },

  delete(id) {
    return axiosInstance.delete(`${API_URL}/api/don/${id}`);
  },
  getAllDonorsWithStats: () => {
    return axios.get(`${API_URL}/api/don/donors-stats`);
  },

  getDonStatsByType: () => {
    return axiosInstance.get(`${API_URL}/api/don/stats-by-type`);
  },
  
  getStats: (year) => {
    return axiosInstance.get(`${API_URL}/stats/${year}`);
},
  // ===================================================================
  // 🎯 NOUVELLES OPÉRATIONS D'UPDATE (POUR DonPage.jsx)
  // ===================================================================
  
  /**
   * Met à jour le Don principal (PUT /api/don/:id).
   * Utilisé pour les dons TSOTRA ou pour ajouter de nouveaux paiements MAHARITRA.
   * Le payload doit inclure l'idDon et toutes les données à jour (personne, don, maharitraDetails).
   */
  update: (payload) => {
    // Le Back-end attend l'ID dans le chemin de l'URL
    const idDon = payload.idDon;
    return axiosInstance.put(`${API_URL}/api/don/${idDon}`, payload);
  },

  // ===================================================================
  // GESTION DES PAIEMENTS MENSUELS (MAHARITRA)
  // ===================================================================

  /**
   * Récupère le statut des paiements mensuels pour une personne et une année données.
   * Correspond à GET /api/don/maharitra/status/:idPersonne/:annee
   */
  getMaharitraStatus: (idPersonne, annee) => {
    return axios.get(`${API_URL}/api/don/maharitra/status/${idPersonne}/${annee}`);
  },

  /**
   * Met à jour un paiement mensuel spécifique (Montant ou Date).
   * Correspond à PUT /api/don/mensuel/:idMensuel
   */
  updateMensuel: (idMensuel, data) => {
    return axiosInstance.put(`${API_URL}/api/don/mensuel/${idMensuel}`, data);
  },

  /**
   * Supprime un paiement mensuel spécifique (lors de l'édition en modale).
   * Correspond à DELETE /api/don/mensuel/:idMensuel
   */
  deleteMensuel: (idMensuel) => {
    return axiosInstance.delete(`${API_URL}/api/don/mensuel/${idMensuel}`);
  },
  // Dans donService.js:
update: (payload) => {
  const idDon = payload.idDon;
  // 🚨 VÉRIFIEZ CE CHEMIN EXACT !
  return axiosInstance.put(`${API_URL}/api/don/${idDon}`, payload);
},
getDonStatsByType: () => {
  return axiosInstance.get(`${API_URL}/api/don/stats-by-type`);
}
};

export default donService;