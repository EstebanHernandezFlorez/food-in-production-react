// services/SpecificConceptSpentService.js
import axios from 'axios';

// Asegúrate que este endpoint coincida con cómo montaste specificConceptSpentRoutes en tu app.js del backend
// Por ejemplo, si es 'http://localhost:3000/api/specific-concepts'
const API_URL = 'http://localhost:3000/specificConceptSpent'; // <<--- AJUSTA ESTA RUTA BASE SI ES NECESARIO

const SpecificConceptSpentService = {
  /**
   * Obtiene todos los conceptos de gasto específicos.
   * Puede filtrar por expenseCategoryId, status, requiresEmployeeCalculation, isBimonthly.
   * Ejemplo: getAllSpecificConceptSpents({ expenseCategoryId: 1, status: true })
   */
  getAllSpecificConceptSpents: async (filters = {}) => {
    try {
      const params = { ...filters };
      // Adaptación por si alguna parte del frontend aún envía idExpenseType por error
      if (params.hasOwnProperty('idExpenseType')) {
          params.expenseCategoryId = params.idExpenseType;
          delete params.idExpenseType;
      }
      const response = await axios.get(API_URL, { params });
      // Se espera que cada concepto en la respuesta tenga 'expenseCategoryDetails' (u tu alias)
      return response.data;
    } catch (error) {
      console.error("Error fetching specific concept spents:", error.response || error.message);
      throw {
        message: error.response?.data?.message || "Error al obtener los conceptos de gasto específicos",
        status: error.response?.status || 500,
        data: error.response?.data // Para más detalles si están disponibles
      };
    }
  },

  getSpecificConceptSpentById: async (idSpecificConcept) => {
    try {
      const response = await axios.get(`${API_URL}/${idSpecificConcept}`);
      // El backend ahora devuelve el concepto con 'expenseCategoryDetails'
      return response.data;
    } catch (error) {
      console.error("Error fetching specific concept spent by ID:", error.response || error.message);
      throw {
        message: error.response?.data?.message || "Error al obtener el concepto de gasto específico por ID",
        status: error.response?.status || 500,
        data: error.response?.data
      };
    }
  },

  /**
   * Crea un nuevo concepto de gasto específico.
   * @param {Object} conceptData - Datos del concepto.
   * @param {string} conceptData.name - Nombre del concepto.
   * @param {number} conceptData.idExpenseCategory - ID de la categoría de gasto asociada.
   * @param {string} [conceptData.description] - Descripción.
   * @param {boolean} conceptData.requiresEmployeeCalculation - Si requiere cálculo por empleado.
   * @param {boolean} conceptData.isBimonthly - Si es bimestral.
   * @param {boolean} [conceptData.status=true] - Estado.
   */
  createSpecificConceptSpent: async (conceptData) => {
    // conceptData ahora debe tener: name, idExpenseCategory (singular), description, ...
    try {
      // Asegurarse de que idExpenseCategory sea un número si está presente
      if (conceptData.idExpenseCategory !== undefined && typeof conceptData.idExpenseCategory !== 'number') {
        conceptData.idExpenseCategory = parseInt(conceptData.idExpenseCategory, 10);
        if (isNaN(conceptData.idExpenseCategory)) {
             throw new Error("idExpenseCategory debe ser un número válido.");
        }
      }

      const response = await axios.post(API_URL, conceptData);
      return response.data;
    } catch (error) {
      console.error("Error creating specific concept spent:", error.response || error.message);
      const errors = error.response?.data?.errors;
      let detailedMessage = error.message; // Usar el mensaje de error base si no hay más detalles
      if (errors && Array.isArray(errors) && errors.length > 0) {
          detailedMessage = errors.map(e => e.msg).join(', ');
      } else if (error.response?.data?.message) {
          detailedMessage = error.response.data.message;
      }
      throw {
        message: detailedMessage,
        status: error.response?.status || 500,
        data: error.response?.data
      };
    }
  },

  /**
   * Actualiza un concepto de gasto específico.
   * @param {number} idSpecificConcept - ID del concepto.
   * @param {Object} conceptData - Datos a actualizar (puede incluir idExpenseCategory para cambiar la categoría).
   */
  updateSpecificConceptSpent: async (idSpecificConcept, conceptData) => {
    try {
      // Asegurarse de que idExpenseCategory sea un número si se está actualizando
      if (conceptData.hasOwnProperty('idExpenseCategory') && typeof conceptData.idExpenseCategory !== 'number') {
         if (conceptData.idExpenseCategory === null || conceptData.idExpenseCategory === '') {
            // Si se quiere desasociar (aunque con allowNull:false en backend no debería pasar)
            // O si se envía un valor vacío que debería ser un número.
            // Decide cómo manejarlo, aquí lo convertimos a null o lo validamos
         } else {
            conceptData.idExpenseCategory = parseInt(conceptData.idExpenseCategory, 10);
            if (isNaN(conceptData.idExpenseCategory)) {
                throw new Error("Si se provee idExpenseCategory, debe ser un número válido.");
            }
         }
      }

      const response = await axios.put(`${API_URL}/${idSpecificConcept}`, conceptData);
      return response.data; // Asumiendo que el backend devuelve el objeto actualizado con su categoría
    } catch (error) {
      console.error("Error updating specific concept spent:", error.response || error.message);
      const errors = error.response?.data?.errors;
      let detailedMessage = error.message;
      if (errors && Array.isArray(errors) && errors.length > 0) {
          detailedMessage = errors.map(e => e.msg).join(', ');
      } else if (error.response?.data?.message) {
          detailedMessage = error.response.data.message;
      }
      throw {
        message: detailedMessage,
        status: error.response?.status || 500,
        data: error.response?.data
      };
    }
  },

  deleteSpecificConceptSpent: async (idSpecificConcept) => {
    try {
      await axios.delete(`${API_URL}/${idSpecificConcept}`);
      // No se devuelve nada en un DELETE exitoso (204 No Content)
    } catch (error) {
      console.error("Error deleting specific concept spent:", error.response || error.message);
      throw {
        message: error.response?.data?.message || "Error al eliminar el concepto de gasto específico",
        status: error.response?.status || 500,
        data: error.response?.data
      };
    }
  },

  changeStateSpecificConceptSpent: async (idSpecificConcept, status) => {
    try {
      // La ruta en tu backend para cambiar estado es PATCH /:idSpecificConcept/status o PUT /:idSpecificConcept con el campo status
      // Ajusta según tu implementación exacta. Usaré PUT al endpoint principal con el campo status.
      // Si tienes una ruta específica como /status, úsala:
      // const response = await axios.patch(`${API_URL}/${idSpecificConcept}/status`, { status });
      const response = await axios.put(`${API_URL}/${idSpecificConcept}`, { status }); // Asumiendo que update maneja solo el cambio de estado
      return response.data;
    } catch (error) {
      console.error(`Error changing status for specific concept spent ${idSpecificConcept}:`, error.response || error.message);
      throw {
        message: error.response?.data?.message || `Error al cambiar el estado del concepto de gasto específico`,
        status: error.response?.status || 500,
        data: error.response?.data
      };
    }
  }
};

export default SpecificConceptSpentService;