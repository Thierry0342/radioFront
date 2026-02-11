import axios from "axios";
import { API_URL } from "../config/root/modules";
import axiosInstance from "./axios-instance";

const typeDonService = {
  getAll() {
    return axios.get(`${API_URL}/api/typedon`);
  },

  getById(id) {
    return axios.get(`${API_URL}/api/typedon/${id}`);
  },

  post(data) {
    return axiosInstance.post(`${API_URL}/api/typedon`, data);
  },

  delete(id) {
    return axiosInstance.delete(`${API_URL}/api/typedon/${id}`);
  },
};

export default typeDonService;
