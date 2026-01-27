// Archivo nuevo: frontend/src/services/DashboardService.js

import axiosInstance from './axiosConfig';

const API_ENDPOINT = '/dashboard';

const DashboardService = {
  /**
   * Obtiene los items de gasto de mano de obra para un periodo.
   * La respuesta del backend ya está formateada.
   */
  getLaborExpenseItems: async (filters = {}) => {
    try {
      const response = await axiosInstance.get(`${API_ENDPOINT}/labor-expenses`, {
        params: filters, // { year, month, idExpenseCategory }
      });
      return response.data || [];
    } catch (error) {
      console.error("Error fetching labor expense items for dashboard:", error);
      return []; // Devolver array vacío en caso de error para no romper el dashboard
    }
  },
};

export default DashboardService;