import axiosInstance from './axiosConfig'; // <- CAMBIO

const API_ENDPOINT = '/specificConceptSpent'; // <- CAMBIO

const SpecificConceptSpentService = {
  getAllSpecificConceptSpents: async (filters = {}) => {
    try {
      const params = { ...filters };
      if (params.hasOwnProperty('idExpenseType')) {
          params.expenseCategoryId = params.idExpenseType;
          delete params.idExpenseType;
      }
      const response = await axiosInstance.get(API_ENDPOINT, { params }); // <- CAMBIO
      return response.data;
    } catch (error) {
      console.error("Error fetching specific concept spents:", error.response || error.message);
      throw { message: error.response?.data?.message || "Error al obtener los conceptos de gasto específicos", status: error.response?.status || 500 };
    }
  },

  // ... (se aplica el mismo patrón al resto de funciones)
  getSpecificConceptSpentById: async (idSpecificConcept) => {
    try {
      const response = await axiosInstance.get(`${API_ENDPOINT}/${idSpecificConcept}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching specific concept spent by ID:", error.response || error.message);
      throw { message: error.response?.data?.message || "Error al obtener el concepto por ID", status: error.response?.status || 500 };
    }
  },

  createSpecificConceptSpent: async (conceptData) => {
    try {
      if (conceptData.idExpenseCategory !== undefined) {
        conceptData.idExpenseCategory = parseInt(conceptData.idExpenseCategory, 10);
      }
      const response = await axiosInstance.post(API_ENDPOINT, conceptData);
      return response.data;
    } catch (error) {
      console.error("Error creating specific concept spent:", error.response || error.message);
      const errors = error.response?.data?.errors;
      let detailedMessage = errors ? errors.map(e => e.msg).join(', ') : (error.response?.data?.message || "Error al crear concepto");
      throw { message: detailedMessage, status: error.response?.status || 500 };
    }
  },

  updateSpecificConceptSpent: async (idSpecificConcept, conceptData) => {
    try {
      if (conceptData.hasOwnProperty('idExpenseCategory')) {
        conceptData.idExpenseCategory = parseInt(conceptData.idExpenseCategory, 10);
      }
      const response = await axiosInstance.put(`${API_ENDPOINT}/${idSpecificConcept}`, conceptData);
      return response.data;
    } catch (error) {
      console.error("Error updating specific concept spent:", error.response || error.message);
      const errors = error.response?.data?.errors;
      let detailedMessage = errors ? errors.map(e => e.msg).join(', ') : (error.response?.data?.message || "Error al actualizar concepto");
      throw { message: detailedMessage, status: error.response?.status || 500 };
    }
  },

  deleteSpecificConceptSpent: async (idSpecificConcept) => {
    try {
      await axiosInstance.delete(`${API_ENDPOINT}/${idSpecificConcept}`);
    } catch (error) {
      console.error("Error deleting specific concept spent:", error.response || error.message);
      throw { message: error.response?.data?.message || "Error al eliminar concepto", status: error.response?.status || 500 };
    }
  },

  changeStateSpecificConceptSpent: async (idSpecificConcept, status) => {
    try {
      const response = await axiosInstance.put(`${API_ENDPOINT}/${idSpecificConcept}`, { status });
      return response.data;
    } catch (error) {
      console.error(`Error changing status for specific concept spent ${idSpecificConcept}:`, error.response || error.message);
      throw { message: error.response?.data?.message || "Error al cambiar estado", status: error.response?.status || 500 };
    }
  }
};

export default SpecificConceptSpentService;