import axios from "axios";
import { API_URL } from "../config/root/modules";
import axiosInstance from "./axios-instance";

const personneService = {
  getAll() {
    return axios.get(`${API_URL}/api/personne`);
  },

  getById(id) {
    return axios.get(`${API_URL}/api/personne/${id}`);
  },

  post(data) {
    return axiosInstance.post(`${API_URL}/api/personne`, data);
  },

  delete(id) {
    return axiosInstance.delete(`${API_URL}/api/personne/${id}`);
  },
      getAll() {
        return axios.get(`${API_URL}/api/personne`); // <-- Cette fonction est nommée getAll()
      },
};

export default personneService;
