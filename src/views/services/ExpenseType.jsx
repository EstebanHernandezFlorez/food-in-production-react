// services/ExpenseTypeService.js
import axios from 'axios';

// Endpoint para los Tipos de Gasto Generales
// Si tu backend NO usa /api y para los tipos generales usa /conceptSpent, esta URL es correcta.
// Si usa /api/expenseTypes, cámbiala.
const API_URL = 'http://localhost:3000/conceptSpent'; // O la ruta que hayas configurado en app.js para ExpenseType

const ExpenseTypeService = {
  // Corresponde a getAllConceptSpents en tu componente
  getAllExpenseTypes: async () => {
    try {
      const response = await axios.get(API_URL);
      return response.data;
    } catch (error) {
      console.error("Error fetching expense types:", error);
      throw {
        message: error.response?.data?.message || "Error al obtener los tipos de gasto generales",
        status: error.response?.status || 500
      };
    }
  },

  // Corresponde a getConceptSpentById en tu componente
  getExpenseTypeById: async (idExpenseType) => {
    try {
      const response = await axios.get(`${API_URL}/${idExpenseType}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching expense type by ID:", error);
      throw {
        message: error.response?.data?.message || "Error al obtener el tipo de gasto general por ID",
        status: error.response?.status || 500
      };
    }
  },

  // Corresponde a createConceptSpent en tu componente
  createExpenseType: async (expenseTypeData) => {
    try {
      const response = await axios.post(API_URL, expenseTypeData);
      return response.data;
    } catch (error) {
      console.error("Error creating expense type:", error);
      throw {
        message: error.response?.data?.message || "Error al crear el tipo de gasto general",
        status: error.response?.status || 500
      };
    }
  },

  // Corresponde a updateConceptSpent en tu componente
  updateExpenseType: async (idExpenseType, expenseTypeData) => {
    try {
      const response = await axios.put(`${API_URL}/${idExpenseType}`, expenseTypeData);
      // El backend puede devolver 200 con el objeto actualizado o 204 sin contenido.
      // Si es 204, response.data será undefined. El controlador del backend debería devolver el objeto actualizado.
      return response.data;
    } catch (error) {
      console.error("Error updating expense type:", error);
      throw {
        message: error.response?.data?.message || "Error al actualizar el tipo de gasto general",
        status: error.response?.status || 500
      };
    }
  },

  // Corresponde a deleteConceptSpent en tu componente
  deleteExpenseType: async (idExpenseType) => {
    try {
      await axios.delete(`${API_URL}/${idExpenseType}`);
    } catch (error) {
      console.error("Error deleting expense type:", error);
      throw {
        message: error.response?.data?.message || "Error al eliminar el tipo de gasto general",
        status: error.response?.status || 500
      };
    }
  },

  // Corresponde a changeStateConceptSpent en tu componente
  changeStateExpenseType: async (idExpenseType, status) => {
    try {
      // La ruta en tu backend para cambiar estado es PATCH /:idExpenseType/status
      const response = await axios.patch(`${API_URL}/${idExpenseType}/status`, { status });
      return response.data;
    } catch (error) {
      console.error(`Error changing status for expense type ${idExpenseType}:`, error);
      throw {
        message: error.response?.data?.message || `Error al cambiar el estado del tipo de gasto general`,
        status: error.response?.status || 500
      };
    }
  }
  // Opcional: si necesitas verificar asociaciones antes de eliminar
  // isExpenseTypeAssociated: async (idExpenseType) => { ... }
};

export default ExpenseTypeService;