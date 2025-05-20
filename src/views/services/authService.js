// src/services/authService.js (FRONTEND)
import axiosInstance from './axiosConfig';

export const AUTH_STORAGE_KEYS = {
  token: 'token', // O 'authToken' si prefieres ser más explícito
  user: 'authUser',
  permissions: 'effectivePermissions'
};

const LOGIN_ENDPOINT = '/auth/login'; // Ajusta si tu endpoint es diferente, ej. /api/auth/login
const LOGOUT_ENDPOINT = '/auth/logout'; // Ajusta si es diferente

export const authService = {
  login: async ({ email, password }) => {
    try {
      console.log("[Frontend authService] Attempting login with:", email);
      // Esperamos que la respuesta del backend sea { token, user, effectivePermissions }
      const response = await axiosInstance.post(LOGIN_ENDPOINT, { email, password });

      if (!response.data || !response.data.token || !response.data.user || typeof response.data.effectivePermissions === 'undefined') {
        const errorMessage = response.data?.message || "Respuesta inválida del servidor o faltan datos (token, user, o permissions).";
        console.error("[Frontend authService] Login failed due to incomplete server response:", response.data);
        throw new Error(errorMessage);
      }

      const { token, user, effectivePermissions } = response.data;

      // Guardar todo en localStorage
      localStorage.setItem(AUTH_STORAGE_KEYS.token, token);
      localStorage.setItem(AUTH_STORAGE_KEYS.user, JSON.stringify(user));
      localStorage.setItem(AUTH_STORAGE_KEYS.permissions, JSON.stringify(effectivePermissions));

      // Configurar el token en la instancia de Axios para futuras peticiones
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      console.log("[Frontend authService] Login successful. Token, user, and permissions stored.");
      return { token, user, effectivePermissions }; // Devolver el objeto completo

    } catch (error) {
      console.error("Error during login (authService):", error.response?.data?.message || error.message);
      // Limpiar cualquier dato parcial que se haya podido guardar antes del error.
      authService.clearClientSession(); // Asegura que no queden restos de una sesión fallida
      throw error; // Re-lanzar para que el componente que llama (AuthProvider) pueda manejarlo
    }
  },

  logoutBackend: async () => {
    try {
      await axiosInstance.post(LOGOUT_ENDPOINT);
      console.log("authService: Petición de logout al backend enviada.");
    } catch (error) {
      console.error("authService: Error en la petición de logout al backend (ignorado, limpieza local procederá):", error.response?.data?.message || error.message);
    }
  },

  // setToken ya no es necesaria externamente si login y clearClientSession manejan el token
  // pero la mantenemos por si se usa en otro lado o para claridad interna.
  // _setTokenInternal: (accessToken) => { ... } // Podría ser interna

  getAccessToken: () => {
    return localStorage.getItem(AUTH_STORAGE_KEYS.token);
  },

  isAuthenticatedFromToken: () => {
    return !!localStorage.getItem(AUTH_STORAGE_KEYS.token);
  },

  clearClientSession: () => {
    console.log("authService: Limpiando sesión del cliente (token, authUser, effectivePermissions).");
    localStorage.removeItem(AUTH_STORAGE_KEYS.token);
    localStorage.removeItem(AUTH_STORAGE_KEYS.user);
    localStorage.removeItem(AUTH_STORAGE_KEYS.permissions);
    delete axiosInstance.defaults.headers.common['Authorization']; // Muy importante
  }
};