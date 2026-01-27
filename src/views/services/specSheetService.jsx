import axiosInstance from './axiosConfig'; // <- CAMBIO

const API_ENDPOINT = '/specSheet'; // <- CAMBIO

const specSheetService = {
    getAllSpecSheets: async (params = {}) => {
        try {
            const response = await axiosInstance.get(API_ENDPOINT, { params }); // <- CAMBIO
            if (response.data && Array.isArray(response.data.data)) return response.data.data;
            if (Array.isArray(response.data)) return response.data;
            console.warn("La respuesta de getAllSpecSheets no es un array. Se devuelve un array vacío.", response.data);
            return [];
        } catch (error) {
            console.error('Error fetching spec sheets:', error.response?.data || error.message);
            return [];
        }
    },

    // ... (el resto de funciones sigue el mismo patrón) ...
    getSpecSheetById: async (idSpecSheet) => {
        try {
            const response = await axiosInstance.get(`${API_ENDPOINT}/${idSpecSheet}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching spec sheet ID ${idSpecSheet}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    createSpecSheet: async (specSheetData) => {
        try {
            const response = await axiosInstance.post(API_ENDPOINT, specSheetData);
            return response.data;
        } catch (error) {
            console.error('Error creating spec sheet:', error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    updateSpecSheet: async (idSpecSheet, specSheetData) => {
        try {
            const response = await axiosInstance.put(`${API_ENDPOINT}/${idSpecSheet}`, specSheetData);
            return response.data;
        } catch (error) {
            console.error(`Error updating spec sheet ID ${idSpecSheet}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    deleteSpecSheet: async (idSpecSheet) => {
        try {
            await axiosInstance.delete(`${API_ENDPOINT}/${idSpecSheet}`);
            return { message: "Ficha técnica eliminada exitosamente." };
        } catch (error) {
            console.error(`Error deleting spec sheet ID ${idSpecSheet}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    changeSpecSheetStatus: async (idSpecSheet, status) => {
        try {
            const response = await axiosInstance.patch(`${API_ENDPOINT}/${idSpecSheet}/status`, { status });
            return response.data;
        } catch (error) {
            console.error(`Error changing status for spec sheet ID ${idSpecSheet}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    getSpecSheetsByProductId: async (idProduct) => {
        try {
            const response = await axiosInstance.get(`${API_ENDPOINT}/by-product/${idProduct}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching spec sheets for product ID ${idProduct}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    getAllSpecSheetsWithCosts: async () => {
        try {
            // Esta URL debe coincidir con la que definiste en tus rutas del backend
            const response = await axiosInstance.get(`${API_ENDPOINT}/with-costs`); 
            return response.data;
        } catch (error) {
            console.error('Error fetching spec sheets with costs:', error.response?.data || error.message);
            throw error.response?.data || error;
        }
    }
};

export default specSheetService;