// src/env/env.js

const DEFAULT_IP = "http://localhost:4000"; // <-- l'IP de  backend accessible
const savedIP = localStorage.getItem("CUSTOM_IP");

export const ENV_MODE = "prod"; // ou "dev"
//export const IP = savedIP || DEFAULT_IP; // Utilise une IP par défaut si aucune IP personnalisée n'est encore définie
export const IP =  DEFAULT_IP;
export const IMAGE_PATH = IP + "/data/uploads";
export const API_URL = "http://localhost:4000";
