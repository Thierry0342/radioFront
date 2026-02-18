import axios from 'axios';
import { API_URL } from "../config/root/modules";
const adminService = {
    getPendingUsers: () => {
        const token = JSON.parse(localStorage.getItem("user"))?.token;
        return axios.get(`${API_URL}/api/auth/pending`, {
            headers: { Authorization: `Bearer ${token}` }
        });
    },

    validateUser: (idUser, status) => {
        const token = JSON.parse(localStorage.getItem("user"))?.token;
        return axios.post(`${API_URL}/api/auth/validate`, { idUser, status }, {
            headers: { Authorization: `Bearer ${token}` }
        });
    }
};

export default adminService;