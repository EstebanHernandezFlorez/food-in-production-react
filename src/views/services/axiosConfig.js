import axios from 'axios';
import { authService } from './authService';

// LEE LA URL BASE DESDE LAS VARIABLES DE ENTORNO DE VITE
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

console.log(`[axiosConfig] La API está configurada para apuntar a: ${baseURL}`);

const axiosInstance = axios.create({
    baseURL: baseURL,
});

// Interceptor para añadir el token de autorización a cada petición
axiosInstance.interceptors.request.use(
    (config) => {
        const token = authService.getAccessToken();
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor para manejar errores 401 (No autorizado) de forma global
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.warn('axiosConfig: Respuesta 401 (No autorizado). Limpiando sesión del cliente.');
            authService.clearClientSession();

            // Redirigir a login para evitar bucles o quedarse en una página protegida
            if (window.location.pathname !== '/login') {
                 window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;