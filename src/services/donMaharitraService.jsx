import axios from "axios";
import { API_URL } from "../config/root/modules";
import axiosInstance from "./axios-instance";

const donMaharitraService = {
  getAll() {
    return axios.get(`${API_URL}/api/don-maharitra`);
  },

  post(data) {
    return axiosInstance.post(`${API_URL}/api/don-maharitra`, data);
  },
};

export default donMaharitraService;
