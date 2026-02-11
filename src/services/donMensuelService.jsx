import axios from "axios";
import { API_URL } from "../config/root/modules";
import axiosInstance from "./axios-instance";

const donMensuelService = {
  
  // Fonction existante pour récupérer les mois d'un engagement spécifique
  getByMaharitra(idMaharitra) {
    return axios.get(`${API_URL}/api/don-mensuel/${idMaharitra}`);
  },

  // Fonction existante pour marquer un mois comme payé (update)
  payMonth(idMensuel, datePaiement) {
    return axiosInstance.put(`${API_URL}/api/don-mensuel/pay/${idMensuel}`, { datePaiement });
  },
  
  // ----------------------------------------------------------------
  // AJOUT CRUCIAL : Fonction pour récupérer le statut d'un donateur
  // ----------------------------------------------------------------
  getMaharitraStatus(idPersonne, annee) {
    // Appel à l'endpoint /status que nous avons configuré côté serveur
    return axios.get(`${API_URL}/api/don-mensuel/status`, {
      params: {
        idPersonne: idPersonne,
        annee: annee
      }
    });
  },
  deleteMensuel: (idMensuel) => { 
    // Utilise une requête DELETE pour l'endpoint correspondant
    // Nous allons configurer l'endpoint /api/don-mensuel/:idMensuel en DELETE côté backend
    return axiosInstance.delete(`${API_URL}/api/don/mensuel/${idMensuel}`);
  },
};

export default donMensuelService;