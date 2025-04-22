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
            // Asegurarse que measurementUnit no esté vacío
            if (!data.measurementUnit) {
                throw new Error('La unidad de medida es requerida');
            }

            const response = await axios.post(`${BASE_URL}/specSheet`, {
                ...data,
                measurementUnit: data.measurementUnit.trim() // Asegurarse que no haya espacios en blanco
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
            console.log('Consultando fichas para el producto:', idProduct);
            const response = await axios.get(`${BASE_URL}/specSheet/product/${idProduct}`); // Corregida la ruta para coincidir con el backend
            console.log('Respuesta del servidor:', response.data);
            return Array.isArray(response.data) ? response.data : [];
        } catch (error) {
            console.error('Error completo:', error);
            console.error('URL intentada:', `${BASE_URL}/specSheet/product/${idProduct}`);
            throw error;
        }
    },
};

export default fichaTecnicaService;