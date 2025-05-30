// services/MonthlyOverallExpenseService.js
import axios from 'axios';

// Asegúrate que este endpoint coincida con cómo montaste monthlyOverallExpenseRoutes en tu app.js del backend
// Por ejemplo, si es 'http://localhost:3000/api/monthly-overall-expenses'
const API_URL = 'http://localhost:3000/monthlyOverallExpense'; // <<--- AJUSTA ESTA RUTA BASE

const MonthlyOverallExpenseService = {
  getAllMonthlyOverallExpenses: async (filters = {}) => { // Añadido filters
    try {
      const params = { ...filters };
      if (params.idExpenseType && !params.idExpenseCategory) { // Adaptación
          params.idExpenseCategory = params.idExpenseType;
          delete params.idExpenseType;
      }
      const response = await axios.get(API_URL, { params });
      return response.data;
    } catch (error) {
      console.error("Error detallado al obtener gastos mensuales:", error);
      throw {
        message: error.response?.data?.message || "Error al obtener los gastos mensuales",
        status: error.response?.status || 500
      };
    }
  },

  getMonthlyOverallExpenseById: async (idOverallMonth) => {
    try {
      const response = await axios.get(`${API_URL}/${idOverallMonth}`);
      // El backend debería devolver el gasto con su 'categoryDetails'
      return response.data;
    } catch (error) {
      console.error(`Error fetching monthly overall expense with id ${idOverallMonth}:`, error);
      throw {
        message: error.response?.data?.message || "Error al obtener el gasto mensual por ID",
        status: error.response?.status || 500
      };
    }
  },

  /**
   * Crea un nuevo registro de gasto mensual.
   * @param {Object} expensePayload - El objeto del gasto.
   * @param {number} expensePayload.idExpenseCategory - ID de la Categoría de Gasto. <<--- CAMBIO
   * @param {string} expensePayload.dateOverallExp - Fecha en formato YYYY-MM-DD.
   * @param {string} [expensePayload.noveltyExpense] - Novedades (camelCase).
   * @param {boolean} [expensePayload.status=true] - Estado.
   * @param {Array<Object>} [expensePayload.expenseItems] - Array de ítems de gasto (opcional en la creación de la cabecera).
   */
  createMonthlyOverallExpense: async (expensePayload) => {
    try {
      // Asegurar que se envíe idExpenseCategory
      const payloadToBackend = { ...expensePayload };
      if (payloadToBackend.idExpenseType && !payloadToBackend.idExpenseCategory) {
          payloadToBackend.idExpenseCategory = payloadToBackend.idExpenseType;
          delete payloadToBackend.idExpenseType;
      }
      if (payloadToBackend.novelty_expense && !payloadToBackend.noveltyExpense) {
          payloadToBackend.noveltyExpense = payloadToBackend.novelty_expense;
          delete payloadToBackend.novelty_expense;
      }

      const response = await axios.post(API_URL, payloadToBackend);
      return response.data;
    } catch (error) {
      console.error("Error creating monthly overall expense:", error);
      const errors = error.response?.data?.errors;
      let detailedMessage = "Error al crear el gasto mensual";
      if (errors && Array.isArray(errors) && errors.length > 0) {
          detailedMessage = errors.map(e => e.msg).join(', ');
      } else if (error.response?.data?.message) {
          detailedMessage = error.response.data.message;
      }
      throw {
        message: detailedMessage,
        status: error.response?.status || 500
      };
    }
  },

  /**
   * Actualiza la cabecera de un gasto mensual existente.
   * @param {number} idOverallMonth - ID del gasto mensual.
   * @param {Object} expenseHeaderData - Datos (puede incluir idExpenseCategory).
   */
  updateMonthlyOverallExpense: async (idOverallMonth, expenseHeaderData) => {
    try {
      const payloadToBackend = { ...expenseHeaderData };
      if (payloadToBackend.idExpenseType && !payloadToBackend.idExpenseCategory) {
          payloadToBackend.idExpenseCategory = payloadToBackend.idExpenseType;
          delete payloadToBackend.idExpenseType;
      }
       if (payloadToBackend.novelty_expense && !payloadToBackend.noveltyExpense) {
          payloadToBackend.noveltyExpense = payloadToBackend.novelty_expense;
          delete payloadToBackend.novelty_expense;
      }

      const response = await axios.put(`${API_URL}/${idOverallMonth}`, payloadToBackend);
      return response.data;
    } catch (error) {
      console.error(`Error updating monthly overall expense with id ${idOverallMonth}:`, error);
      const errors = error.response?.data?.errors;
      let detailedMessage = "Error al actualizar el gasto mensual";
      if (errors && Array.isArray(errors) && errors.length > 0) {
          detailedMessage = errors.map(e => e.msg).join(', ');
      } else if (error.response?.data?.message) {
          detailedMessage = error.response.data.message;
      }
      throw {
        message: detailedMessage,
        status: error.response?.status || 500
      };
    }
  },

  deleteMonthlyOverallExpense: async (idOverallMonth) => {
    try {
      await axios.delete(`${API_URL}/${idOverallMonth}`);
    } catch (error) {
      console.error(`Error deleting monthly overall expense with id ${idOverallMonth}:`, error);
      throw {
        message: error.response?.data?.message || "Error al eliminar el gasto mensual",
        status: error.response?.status || 500
      };
    }
  },

  changeStateMonthlyOverallExpense: async (idOverallMonth, status) => {
    try {
      const response = await axios.patch(`${API_URL}/${idOverallMonth}/status`, { status });
      return response.data;
    } catch (error) {
      console.error(`Error changing status of monthly overall expense with id ${idOverallMonth}:`, error);
      throw {
        message: error.response?.data?.message || `Error al cambiar el estado del gasto mensual`,
        status: error.response?.status || 500
      };
    }
  },

  getTotalExpenseByMonth: async (year, month) => {
    try {
      const response = await axios.get(`${API_URL}/total/by-month/${year}/${month}`); // Ruta ajustada
      return response.data;
    } catch (error) {
      console.error("Error fetching total expense by month:", error);
      throw {
        message: error.response?.data?.message || "Error al obtener el total de gastos por mes",
        status: error.response?.status || 500
      };
    }
  }
};

export default MonthlyOverallExpenseService;