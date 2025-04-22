import axios from "axios";
import { apiurl } from "../enviroments/local";
import { authService } from "./authService";

// Crear una instancia de Axios
const axiosInstance = axios.create({
  baseURL: apiurl.local, // URL base de la API
});

// Interceptor para solicitudes
axiosInstance.interceptors.request.use(
  (config) => {
    const token = authService.getAccessToken(); // Obtener el token del almacenamiento local
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Agregar el token al encabezado
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para respuestas
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      authService.clearSession()
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
