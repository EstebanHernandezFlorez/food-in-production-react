// service/conceptSpent.service.js
import axios from 'axios';

const API_URL = 'http://localhost:3000/conceptSpent';

const ConceptSpentService = {
  getAllConceptSpents: async () => {
    try {
      const response = await axios.get(API_URL);
      return response.data;
    } catch (error) {
      console.error("Error fetching concept spents:", error);
      // Devuelve un objeto de error estandarizado
      throw {
        message: error.response?.data?.message || "Error al obtener los conceptos de gasto",
        status: error.response?.status || 500
      };
    }
  },

  getConceptSpentById: async (idExpenseType) => {
    try {
      const response = await axios.get(`${API_URL}/${idExpenseType}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching concept spent by ID:", error);
      throw {
        message: error.response?.data?.message || "Error al obtener el concepto de gasto por ID",
        status: error.response?.status || 500
      };
    }
  },

  createConceptSpent: async (conceptSpentData) => {
    try {
      const response = await axios.post(API_URL, conceptSpentData);
      return response.data;
    } catch (error) {
      console.error("Error creating concept spent:", error);
      throw {
        message: error.response?.data?.message || "Error al crear el concepto de gasto",
        status: error.response?.status || 500
      };
    }
  },

  updateConceptSpent: async (idExpenseType, conceptSpentData) => {
    try {
      const response = await axios.put(`${API_URL}/${idExpenseType}`, conceptSpentData);
      return response.data;
    } catch (error) {
      console.error("Error updating concept spent:", error);
      throw {
        message: error.response?.data?.message || "Error al actualizar el concepto de gasto",
        status: error.response?.status || 500
      };
    }
  },

  deleteConceptSpent: async (idExpenseType) => {
    try {
      await axios.delete(`${API_URL}/${idExpenseType}`);
    } catch (error) {
      console.error("Error deleting concept spent:", error);
      throw {
        message: error.response?.data?.message || "Error al eliminar el concepto de gasto",
        status: error.response?.status || 500
      };
    }
  },

  changeStateConceptSpent: async (idExpenseType, status) => {
    try {
      const response = await axios.patch(`${API_URL}/${idExpenseType}`, { status });
      return response.data;
    } catch (error) {
      console.error(`Error changing status concept spent with id ${idExpenseType}:`, error);
      throw {
        message: error.response?.data?.message || `Error al cambiar el estado del concepto de gasto con ID ${idExpenseType}`,
        status: error.response?.status || 500
      };
    }
  }
};

export default ConceptSpentService;