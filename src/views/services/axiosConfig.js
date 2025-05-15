// src/services/axiosConfig.js
import axios from 'axios';
import { authService } from './authService'; // Ruta relativa correcta dentro de /services

const axiosInstance = axios.create({
    baseURL: 'http://localhost:3000', // <-- CORREGIDO: Prefijo /api/ añadido a la baseURL
});

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

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.warn('axiosConfig.js: Respuesta no autorizada (401). Limpiando sesión.');
            authService.clearClientSession(); // Asegúrate que authService esté completamente inicializado

            // Redirigir a login para evitar que el usuario se quede en una página protegida sin sesión
            // Evita bucles si ya está en login o si la petición 401 vino de la propia página de login
            const nonAuthPaths = ['/login', '/register']; // Añade otras rutas públicas si es necesario
            if (!nonAuthPaths.includes(window.location.pathname)) {
                 window.location.href = '/login'; // Recarga completa para asegurar estado limpio
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;