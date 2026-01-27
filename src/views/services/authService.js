// src/services/authService.js

import axiosInstance from './axiosConfig';

export const AUTH_STORAGE_KEYS = {
  token: 'token',
  user: 'authUser',
  permissions: 'effectivePermissions'
};

const LOGIN_ENDPOINT = '/auth/login';
const LOGOUT_ENDPOINT = '/auth/logout';
const FORGOT_PASSWORD_ENDPOINT = '/auth/forgot-password'; // <-- Nuevo
const VERIFY_CODE_ENDPOINT = '/auth/verify-code';         // <-- Nuevo

export const authService = {
  login: async ({ email, password }) => {
    try {
      console.log("[Frontend authService] Attempting login with:", email);
      const response = await axiosInstance.post(LOGIN_ENDPOINT, { email, password });

      if (!response.data || !response.data.token || !response.data.user || typeof response.data.effectivePermissions === 'undefined') {
        const errorMessage = response.data?.message || "Respuesta inválida del servidor o faltan datos (token, user, o permissions).";
        console.error("[Frontend authService] Login failed due to incomplete server response:", response.data);
        throw new Error(errorMessage);
      }

      const { token, user, effectivePermissions } = response.data;

      localStorage.setItem(AUTH_STORAGE_KEYS.token, token);
      localStorage.setItem(AUTH_STORAGE_KEYS.user, JSON.stringify(user));
      localStorage.setItem(AUTH_STORAGE_KEYS.permissions, JSON.stringify(effectivePermissions));

      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      console.log("[Frontend authService] Login successful. Token, user, and permissions stored.");
      return { token, user, effectivePermissions };

    } catch (error) {
      console.error("Error during login (authService):", error.response?.data?.message || error.message);
      authService.clearClientSession();
      throw error;
    }
  },

  forgotPassword: async ({ email }) => {
    try {
      console.log("[Frontend authService] Requesting password reset for:", email);
      const response = await axiosInstance.post(FORGOT_PASSWORD_ENDPOINT, { email });
      return response.data; // Esperamos { message: '...' }
    } catch (error) {
      console.error("Error during forgotPassword (authService):", error.response?.data?.message || error.message);
      throw error;
    }
  },

  verifyCodeAndResetPassword: async ({ email, code, newPassword }) => {
    try {
      console.log("[Frontend authService] Verifying code and resetting password for:", email);
      const response = await axiosInstance.post(VERIFY_CODE_ENDPOINT, { email, code, newPassword });
      return response.data; // Esperamos { message: '...' }
    } catch (error) {
      console.error("Error during verifyCode (authService):", error.response?.data?.message || error.message);
      throw error;
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
    delete axiosInstance.defaults.headers.common['Authorization'];
  }
};