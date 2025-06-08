// RUTA: services/MonthlyOverallExpenseService.js

import axios from 'axios';
import { apiurl } from '../../enviroments/local';

const API_URL = `${apiurl}/monthlyOverallExpense`;

const MonthlyOverallExpenseService = {
  // ... (todas las funciones existentes sin cambios) ...
  getAllMonthlyOverallExpenses: async (filters = {}) => {
    try {
      const params = { ...filters };
      if (params.idExpenseType && !params.idExpenseCategory) {
          params.idExpenseCategory = params.idExpenseType;
          delete params.idExpenseType;
      }
      const response = await axios.get(API_URL, { params });
      // Manejar la estructura de paginación { count, rows }
      if(response.data && Array.isArray(response.data.rows)) {
        return response.data.rows;
      }
      // Manejar respuesta de array directo
      if(Array.isArray(response.data)) {
        return response.data;
      }
      console.warn("La respuesta de getAllMonthlyOverallExpenses no es un array. Se devuelve array vacío.");
      return [];
    } catch (error) {
      console.error("Error detallado al obtener gastos mensuales:", error);
      return []; // Devolver array vacío en caso de error
    }
},

  getMonthlyOverallExpenseById: async (idOverallMonth) => {
    try {
      const response = await axios.get(`${API_URL}/${idOverallMonth}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching monthly overall expense with id ${idOverallMonth}:`, error);
      throw { message: error.response?.data?.message || "Error al obtener el gasto mensual por ID", status: error.response?.status || 500 };
    }
  },

  createMonthlyOverallExpense: async (expensePayload) => {
    try {
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
      if (errors && Array.isArray(errors) && errors.length > 0) { detailedMessage = errors.map(e => e.msg).join(', '); } 
      else if (error.response?.data?.message) { detailedMessage = error.response.data.message; }
      throw { message: detailedMessage, status: error.response?.status || 500 };
    }
  },

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
      if (errors && Array.isArray(errors) && errors.length > 0) { detailedMessage = errors.map(e => e.msg).join(', '); } 
      else if (error.response?.data?.message) { detailedMessage = error.response.data.message; }
      throw { message: detailedMessage, status: error.response?.status || 500 };
    }
  },

  deleteMonthlyOverallExpense: async (idOverallMonth) => {
    try {
      await axios.delete(`${API_URL}/${idOverallMonth}`);
    } catch (error) {
      console.error(`Error deleting monthly overall expense with id ${idOverallMonth}:`, error);
      throw { message: error.response?.data?.message || "Error al eliminar el gasto mensual", status: error.response?.status || 500 };
    }
  },

  changeStateMonthlyOverallExpense: async (idOverallMonth, status) => {
    try {
      const response = await axios.patch(`${API_URL}/${idOverallMonth}/status`, { status });
      return response.data;
    } catch (error) {
      console.error(`Error changing status of monthly overall expense with id ${idOverallMonth}:`, error);
      throw { message: error.response?.data?.message || `Error al cambiar el estado del gasto mensual`, status: error.response?.status || 500 };
    }
  },

  getTotalExpenseByMonth: async (year, month) => {
    try {
      const response = await axios.get(`${API_URL}/total/by-month/${year}/${month}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching total expense by month:", error);
      throw { message: error.response?.data?.message || "Error al obtener el total de gastos por mes", status: error.response?.status || 500 };
    }
  },

  // <<<--- CORRECCIÓN 1: Se añade la función que faltaba --- >>>
  getTotalExpenseByTypeAndMonth: async (year, month, idExpenseType) => {
    try {
      // Nota: Asegúrate de tener esta ruta en tu backend. Ejemplo: GET /api/monthlyOverallExpense/total/by-type/2023/11/1
      const response = await axios.get(`${API_URL}/total/by-type/${year}/${month}/${idExpenseType}`);
      return response.data; // Se espera que devuelva algo como { totalExpense: 12345.67 }
    } catch (error) {
      console.error(`Error fetching total expense for type ${idExpenseType} in ${year}-${month}:`, error);
      // Devuelve un valor por defecto para no romper el dashboard
      return { totalExpense: 0 };
    }
  }
};

export default MonthlyOverallExpenseService;