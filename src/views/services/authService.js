// src/services/authService.js
import axiosInstance from './axiosConfig'; // Asume que axiosConfig.js está en la misma carpeta (src/services/)

// 1. Definir y exportar AUTH_STORAGE_KEYS
// Asegúrate de que estas claves coincidan con cómo quieres que se almacenen en localStorage
// y cómo AuthProvider las espera.
export const AUTH_STORAGE_KEYS = {
  token: 'token', // La clave que ya estás usando para el token
  user: 'authUser', // Clave para la información del usuario
  permissions: 'effectivePermissions' // Clave para los permisos
};

const LOGIN_ENDPOINT = '/auth/login';
const LOGOUT_ENDPOINT = '/auth/logout';

export const authService = {
  login: async ({ email, password }) => {
    try {
      const response = await axiosInstance.post(LOGIN_ENDPOINT, { email, password });

      if (!response.data || !response.data.token) {
        const errorMessage = response.data?.message || "Respuesta inválida del servidor o falta token.";
        throw new Error(errorMessage);
      }

      // Guarda el token usando la clave de AUTH_STORAGE_KEYS
      authService.setToken(response.data.token);
      // AuthProvider se encargará de guardar response.data.user en localStorage
      // usando AUTH_STORAGE_KEYS.user
      return response.data; // Debería devolver { user, token }
    } catch (error) {
      console.error("Error during login (authService):", error.response?.data?.message || error.message);
      throw error;
    }
  },

  logoutBackend: async () => {
    try {
      await axiosInstance.post(LOGOUT_ENDPOINT);
      console.log("authService: Petición de logout al backend enviada.");
    } catch (error) {
      console.error("authService: Error en la petición de logout al backend:", error.response?.data?.message || error.message);
      // No bloquear, AuthProvider limpiará localmente de todas formas
    }
  },

  setToken: (accessToken) => {
    if (accessToken) {
      // Usar la clave de AUTH_STORAGE_KEYS
      localStorage.setItem(AUTH_STORAGE_KEYS.token, accessToken);
    } else {
      // Usar la clave de AUTH_STORAGE_KEYS
      localStorage.removeItem(AUTH_STORAGE_KEYS.token);
    }
  },

  getAccessToken: () => {
    // Usar la clave de AUTH_STORAGE_KEYS
    return localStorage.getItem(AUTH_STORAGE_KEYS.token);
  },

  // Función que tu AuthProvider usa para verificar la existencia del token
  isAuthenticatedFromToken: () => {
    // Usar la clave de AUTH_STORAGE_KEYS
    return !!localStorage.getItem(AUTH_STORAGE_KEYS.token);
  },

  clearClientSession: () => {
    console.log("authService: Limpiando sesión del cliente (token, authUser, effectivePermissions).");
    // Usar las claves de AUTH_STORAGE_KEYS
    localStorage.removeItem(AUTH_STORAGE_KEYS.token);
    localStorage.removeItem(AUTH_STORAGE_KEYS.user);
    localStorage.removeItem(AUTH_STORAGE_KEYS.permissions);
    // Opcional: limpiar cabeceras de axiosInstance si no se maneja bien por interceptores al borrar token
    // delete axiosInstance.defaults.headers.common['Authorization'];
  }
};

// Nota: Si authService fuera un objeto muy grande o tuviera funciones que no necesitan
// estar dentro del objeto principal, podrías exportarlas individualmente.
// Pero para este caso, exportar el objeto authService y AUTH_STORAGE_KEYS es lo correcto
// basado en cómo lo importas en AuthProvider.jsx:
// import { authService, AUTH_STORAGE_KEYS } from '../services/authService';