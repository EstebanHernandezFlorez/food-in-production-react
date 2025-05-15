import axios from 'axios';

const BASE_URL = 'http://localhost:3000'; // Asegúrate de que esta URL sea correcta

const fichaTecnicaService = {
    getAllSpecSheets: async () => {
        try {
            const response = await axios.get(`${BASE_URL}/specSheet`);
            return response.data;
        } catch (error) {
            console.error('Error al obtener fichas técnicas:', error);
            throw error; // Re-lanza el error para que el componente que llama a la función pueda manejarlo
        }
    },
    
    getSpecSheetById: async (id) => {
        try {
            const response = await axios.get(`${BASE_URL}/specSheet/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error al obtener ficha técnica:', error);
            throw error; // Re-lanza el error
        }
    },

    createSpecSheet: async (data) => {
        try {
            // ESTA VALIDACIÓN EN EL SERVICIO ES UN POCO EXTRAÑA.
            // Si 'measurementUnit' es realmente opcional para el backend o se valida de otra forma,
            // esta línea podría causar un error ANTES de llegar al backend.
            // Tu validación en el componente (validateForm) ya verifica 'measurementUnit'.
            // Considera si esta validación en el servicio es necesaria o si es mejor dejar
            // que el backend maneje todas las validaciones de datos.
            if (!data.measurementUnit) {
                throw new Error('La unidad de medida es requerida'); // Si esto se lanza, error.response no existirá.
            }
    
            const response = await axios.post(`${BASE_URL}/specSheet`, {
                ...data,
                // Estás sobreescribiendo measurementUnit con su versión trim().
                // Si measurementUnit es un select, trim() no es necesario.
                // Si es un input de texto, está bien.
                measurementUnit: data.measurementUnit.trim()
            });
            return response.data;
        } catch (error) {
            console.error('Error en createSpecSheet:', error);
            throw error;
        }
    },

    updateSpecSheet: async (id, specSheetData) => {
        try {
            const response = await axios.put(`${BASE_URL}/specSheet/${id}`, specSheetData);
            return response.data;
        } catch (error) {
            console.error('Error al actualizar ficha técnica:', error);
            throw error; // Re-lanza el error
        }
    },

    deleteSpecSheet: async (id) => {
        try {
            const response = await axios.delete(`${BASE_URL}/specSheet/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error al eliminar ficha técnica:', error);
            throw error; // Re-lanza el error
        }
    },

    changeStateSpecSheet: async (id, status) => {
        try {
            const response = await axios.patch(`${BASE_URL}/specSheet/${id}/status`, { status }); // Cambiado para que coincida con la convención de REST
            return response.data;
        } catch (error) {
            console.error('Error al cambiar estado de la ficha técnica:', error);
            throw error; // Re-lanza el error
        }

    },
    
    getSpecSheetsByProduct: async (idProduct) => {
        try {
            console.log('Consultando fichas técnicas para producto:', idProduct);
            const response = await axios.get(`${BASE_URL}/specSheet/product/${idProduct}`);
            console.log('Respuesta completa:', response);
            console.log('Datos de la respuesta:', response.data);
            
            // Verificar si la respuesta es exitosa
            if (response.data.success === false) {
                throw new Error(response.data.message);
            }

            // Si los datos vienen dentro de una propiedad específica
            const fichas = Array.isArray(response.data) ? response.data : [];
            console.log('Fichas procesadas:', fichas);
            
            return fichas;
        } catch (error) {
            console.error('Error completo:', error);
            console.error('Detalles del error:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            throw error;
        }
    },
};

export default fichaTecnicaService;