// services/specificConceptSpent.service.js
// Este servicio maneja los CONCEPTOS DE GASTO ESPECÍFICOS (ej: "Sueldo Empleado Aux")
import axios from 'axios';

// Asegúrate que este endpoint coincida con cómo montaste specificConceptSpentRoutes en tu app.js del backend
// Si tu backend usa /api/specificConcepts, cámbialo aquí.
const API_URL = 'http://localhost:3000/specificConceptSpent';

const SpecificConceptSpentService = {
  /**
   * Obtiene todos los conceptos de gasto específicos.
   * Puede filtrar por idExpenseType (tipo general), status, y requiresEmployeeCalculation.
   * Ejemplo: getAllSpecificConceptSpents({ idExpenseType: 1, status: true })
   */
  getAllSpecificConceptSpents: async (filters = {}) => {
    try {
      const response = await axios.get(API_URL, { params: filters });
      return response.data;
    } catch (error) {
      console.error("Error fetching specific concept spents:", error);
      throw {
        message: error.response?.data?.message || "Error al obtener los conceptos de gasto específicos",
        status: error.response?.status || 500
      };
    }
  },

  getSpecificConceptSpentById: async (idSpecificConcept) => {
    try {
      const response = await axios.get(`${API_URL}/${idSpecificConcept}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching specific concept spent by ID:", error);
      throw {
        message: error.response?.data?.message || "Error al obtener el concepto de gasto específico por ID",
        status: error.response?.status || 500
      };
    }
  },

  createSpecificConceptSpent: async (conceptData) => {
    // conceptData debería tener: idExpenseType, name, requiresEmployeeCalculation, [description], [status]
    try {
      const response = await axios.post(API_URL, conceptData);
      return response.data;
    } catch (error) {
      console.error("Error creating specific concept spent:", error);
      throw {
        message: error.response?.data?.message || "Error al crear el concepto de gasto específico",
        status: error.response?.status || 500
      };
    }
  },

  updateSpecificConceptSpent: async (idSpecificConcept, conceptData) => {
    try {
      const response = await axios.put(`${API_URL}/${idSpecificConcept}`, conceptData);
      return response.data; // Asumiendo que el backend devuelve el objeto actualizado
    } catch (error) {
      console.error("Error updating specific concept spent:", error);
      throw {
        message: error.response?.data?.message || "Error al actualizar el concepto de gasto específico",
        status: error.response?.status || 500
      };
    }
  },

  deleteSpecificConceptSpent: async (idSpecificConcept) => {
    try {
      await axios.delete(`${API_URL}/${idSpecificConcept}`);
    } catch (error) {
      console.error("Error deleting specific concept spent:", error);
      throw {
        message: error.response?.data?.message || "Error al eliminar el concepto de gasto específico",
        status: error.response?.status || 500
      };
    }
  },

  changeStateSpecificConceptSpent: async (idSpecificConcept, status) => {
    try {
      // Asumiendo que tu backend usa PATCH en la raíz del recurso y espera { status } en el body
      // Si la ruta es /status, ajústala: `${API_URL}/${idSpecificConcept}/status`
      const response = await axios.patch(`${API_URL}/${idSpecificConcept}/status`, { status }); // Ajustado a la ruta sugerida /status
      return response.data;
    } catch (error) {
      console.error(`Error changing status for specific concept spent ${idSpecificConcept}:`, error);
      throw {
        message: error.response?.data?.message || `Error al cambiar el estado del concepto de gasto específico`,
        status: error.response?.status || 500
      };
    }
  }
};

export default SpecificConceptSpentService;