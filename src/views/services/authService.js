import axios from "axios";
import { apiurl } from '../../enviroments/local';

const LOGIN_URL = `${apiurl}/api/auth/login`;

export const authService = {
  login: async ({ email, password }) => {
    try {
      const response = await axios.post(LOGIN_URL, { email, password });

      if (!response.data || !response.data.token) {
        throw new Error("Respuesta inválida del servidor o falta token.");
      }

      authService.setTokens(response.data.token);
      return response.data; // { user, token }
    } catch (error) {
      console.error("Error during login:", error.response?.data?.message || error.message);
      throw error;
    }
  },

  logout: () => {
    authService.clearSession();
  },

  setTokens: (accessToken) => {
    localStorage.setItem("token", accessToken);
  },

  getAccessToken: () => {
    return localStorage.getItem("token");
  },

  clearSession: () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  }
};
