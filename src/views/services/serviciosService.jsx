// src/services/serviciosService.js
import axios from 'axios';

// --- ¡CONFIRMA ESTA URL BASE! ---
// Debe coincidir con cómo montaste aditionalServicesRoutes en tu app principal
const API_URL = 'http://localhost:3000/aditionalServices';

/**
 * Mapea los datos del backend al formato del frontend.
 * @param {object} backendService - Objeto del backend { idAditionalServices, name, status }
 * @returns {object} Objeto del frontend { id, Nombre, Estado }
 */
const mapToFrontend = (backendService) => {
    if (!backendService) return null;
    return {
        id: backendService.idAditionalServices,
        Nombre: backendService.name,
        Estado: backendService.status ? 'Activo' : 'Inactivo', // Mapea boolean a string
    };
};

/**
 * Mapea los datos del frontend al formato esperado por el backend.
 * @param {object} frontendService - Objeto del frontend { Nombre, Estado }
 * @returns {object} Objeto para el backend { name, status }
 */
const mapToBackend = (frontendService) => {
    return {
        name: frontendService.Nombre,
        status: frontendService.Estado === 'Activo', // Mapea string a boolean
    };
};


const serviciosService = {
    /**
     * Obtiene todos los servicios y los mapea al formato del frontend.
     * @returns {Promise<Array>} Una promesa que resuelve a un array de servicios en formato frontend.
     */
    getAllServicios: async () => {
        try {
            const response = await axios.get(API_URL);
            // Mapea cada servicio en la respuesta
            return response.data.map(mapToFrontend);
        } catch (error) {
            console.error("Error fetching servicios:", error);
            throw error;
        }
    },

    /**
     * Crea un nuevo servicio.
     * @param {object} servicioDataFrontend - Datos del servicio en formato frontend { Nombre, Estado }.
     * @returns {Promise<object>} Una promesa que resuelve al objeto del servicio creado, mapeado al formato frontend.
     */
    createServicio: async (servicioDataFrontend) => {
        try {
            const dataToSend = mapToBackend(servicioDataFrontend); // Mapea al formato del backend
            const response = await axios.post(API_URL, dataToSend);
            return mapToFrontend(response.data); // Mapea la respuesta al formato frontend
        } catch (error) {
            console.error("Error creating servicio:", error);
            // Puedes añadir manejo específico si la API devuelve errores claros
            // if (error.response && error.response.status === 409) { throw new Error("El servicio ya existe"); }
            throw error;
        }
    },

    /**
     * Obtiene un servicio específico por su ID y lo mapea al formato del frontend.
     * @param {number|string} idServicio - El ID del servicio (el mismo que usa el backend).
     * @returns {Promise<object>} Una promesa que resuelve al objeto del servicio encontrado, en formato frontend.
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
     * NOTA: La API devuelve 204 No Content, por lo que no se devuelve el objeto actualizado.
     * @param {number|string} idServicio - El ID del servicio a actualizar.
     * @param {object} servicioDataFrontend - Los nuevos datos en formato frontend { id, Nombre, Estado }.
     * @returns {Promise<void>} Una promesa que se resuelve si la actualización es exitosa.
     */
    updateServicio: async (idServicio, servicioDataFrontend) => {
        try {
            const dataToSend = mapToBackend(servicioDataFrontend); // Mapea al formato del backend
            await axios.put(`${API_URL}/${idServicio}`, dataToSend);
            // No hay datos en la respuesta (204), simplemente resolvemos
        } catch (error) {
            console.error(`Error updating servicio with id ${idServicio}:`, error);
            throw error;
        }
    },

    /**
     * Elimina un servicio por su ID.
     * @param {number|string} idServicio - El ID del servicio a eliminar.
     * @returns {Promise<void>} Una promesa que se resuelve cuando la eliminación es exitosa.
     */
    deleteServicio: async (idServicio) => {
        try {
            await axios.delete(`${API_URL}/${idServicio}`);
            // La API devuelve un mensaje, pero no necesitamos procesarlo aquí
        } catch (error) {
            console.error(`Error deleting servicio with id ${idServicio}:`, error);
            // Puedes verificar error.response.data.message si quieres mostrar el mensaje específico
            throw error;
        }
    },

    /**
     * Cambia el estado (Activo/Inactivo) de un servicio usando PATCH.
     * NOTA: La API devuelve 204 No Content.
     * @param {number|string} idServicio - El ID del servicio cuyo estado se cambiará.
     * @param {string} nuevoEstadoFrontend - El nuevo estado en formato frontend ('Activo' o 'Inactivo').
     * @returns {Promise<void>} Una promesa que se resuelve si el cambio de estado es exitoso.
     */
    changeStateServicio: async (idServicio, nuevoEstadoFrontend) => {
      try {
          // *** CORRECCIÓN AQUÍ ***
          // Asegúrate de enviar 'state' como clave, que es lo que el backend (middleware corregido) debería esperar.
          const dataToSend = { status: nuevoEstadoFrontend === 'Activo' };
          // *** FIN CORRECCIÓN ***

          console.log('Enviando PATCH con:', dataToSend); // Log para verificar
          await axios.patch(`${API_URL}/${idServicio}`, dataToSend);
           // No hay datos en la respuesta (204), simplemente resolvemos
      } catch (error) {
          console.error(`Error changing estado servicio with id ${idServicio}:`, error);
          throw error;
      }
  }
}
export default serviciosService;