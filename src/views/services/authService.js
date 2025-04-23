// frontend/services/authService.js
import axios from "axios";
// Asegúrate que esto importa la URL correcta de TU backend
// Ejemplo: export const apiurl = 'http://localhost:3000/api';
import { apiurl } from '../../enviroments/local'; // Verifica esta ruta e importación

// Construye la URL completa del login
const LOGIN_URL = `${apiurl}/auth/login`; // Ajusta '/auth/login' si tu ruta es diferente

export const authService = {
    login: async (email, password) => {
        try {
            // Usa la URL completa y correcta
            const response = await axios.post(LOGIN_URL, { email, password });
            // console.log("Login service response:", response.data); // Debug
            if (!response.data || !response.data.token) { // Verifica respuesta básica
                throw new Error("Respuesta inválida del servidor o falta token.");
            }
            // Guarda el token al hacer login
            authService.setTokens(response.data.token);
            return response.data; // Devuelve { user, token }
        } catch (error) {
            console.error("Error during login:", error.response?.data?.message || error.message);
            // Lanza el error para que AuthProvider/Login lo manejen
            throw error;
        }
    },

    // Logout ahora solo llama a clearSession
    logout: () => {
        authService.clearSession();
    },

    setTokens: (accessToken) => {
        localStorage.setItem("token", accessToken);
        // console.log("Token guardado en localStorage:", accessToken); // Debug
    },

    getAccessToken: () => {
        return localStorage.getItem("token");
    },

    // clearSession ya redirige
    clearSession: () => {
        localStorage.removeItem("token");
        window.location.href = "/"; // Redirige a la página de login
    }
}