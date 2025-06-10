import axios from 'axios';
import {apiurl} from '../../enviroments/local';
const API_URL = `${apiurl}/api/aditionalServices`;

/**
 * @param {object} backendService 
 * @returns {object} 
 */
const mapToFrontend = (backendService) => {
    if (!backendService) return null;
    return {
        id: backendService.idAditionalServices,
        Nombre: backendService.name,
        Estado: backendService.status ? 'Activo' : 'Inactivo', 
    };
};

/**
 * Mapea los datos del frontend al formato esperado por el backend.
 * @param {object} frontendService 
 * @returns {object} 
 */
const mapToBackend = (frontendService) => {
    return {
        name: frontendService.Nombre,
        status: frontendService.Estado === 'Activo',
    };
};


const serviciosService = {
    /**
     * Obtiene todos los servicios y los mapea al formato del frontend.
     * @returns {Promise<Array>} 
     */
    getAllServicios: async () => {
        try {
            const response = await axios.get(API_URL);
            
            return response.data.map(mapToFrontend);
        } catch (error) {
            console.error("Error fetching servicios:", error);
            throw error;
        }
    },

    /**
     * Crea un nuevo servicio.
     * @param {object} servicioDataFrontend 
     * @returns {Promise<object>} 
     */
    createServicio: async (servicioDataFrontend) => {
        try {
            const dataToSend = mapToBackend(servicioDataFrontend); 
            const response = await axios.post(API_URL, dataToSend);
            return mapToFrontend(response.data); 
        } catch (error) {
            console.error("Error creating servicio:", error);
            throw error;
        }
    },

    /**
     * Obtiene un servicio específico por su ID y lo mapea al formato del frontend.
     * @param {number|string} idServicio 
     * @returns {Promise<object>} 
     */
    getServicioById: async (idServicio) => {
        try {
            const response = await axios.get(`${API_URL}/${idServicio}`);
            return mapToFrontend(response.data);
        } catch (error) {
            console.error(`Error fetching servicio with id ${idServicio}:`, error);
            throw error;
        }
    },

    /**
     * Actualiza un servicio existente.
     
     * @param {number|string} idServicio 
     * @param {object} servicioDataFrontend 
     * @returns {Promise<void>} 
     */
    updateServicio: async (idServicio, servicioDataFrontend) => {
        try {
            const dataToSend = mapToBackend(servicioDataFrontend); 
            await axios.put(`${API_URL}/${idServicio}`, dataToSend);
        } catch (error) {
            console.error(`Error updating servicio with id ${idServicio}:`, error);
            throw error;
        }
    },

    /**
     * Elimina un servicio por su ID.
     * @param {number|string} idServicio 
     * @returns {Promise<void>} 
     */
    deleteServicio: async (idServicio) => {
        try {
            await axios.delete(`${API_URL}/${idServicio}`);
        } catch (error) {
            console.error(`Error deleting servicio with id ${idServicio}:`, error);
            throw error;
        }
    },

    /**
     * Cambia el estado (Activo/Inactivo) de un servicio usando PATCH.
     
     * @param {number|string} idServicio 
     * @param {string} nuevoEstadoFrontend 
     * @returns {Promise<void>} 
     */
    changeStateServicio: async (idServicio, nuevoEstadoFrontend) => {
      try {
       
          const dataToSend = { status: nuevoEstadoFrontend === 'Activo' };
    

          console.log('Enviando PATCH con:', dataToSend); 
          await axios.patch(`${API_URL}/${idServicio}`, dataToSend);
          
      } catch (error) {
          console.error(`Error changing estado servicio with id ${idServicio}:`, error);
          throw error;
      }
  }
}
export default serviciosService;