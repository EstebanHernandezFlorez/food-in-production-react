import axiosInstance from './axiosConfig'; // <- CAMBIO

const API_ENDPOINT = '/spec-sheet-processes'; // <- CAMBIO

const specSheetProcessService = {
    createSpecSheetProcess: async (processData) => {
        try {
            const response = await axiosInstance.post(API_ENDPOINT, processData); // <- CAMBIO
            return response.data;
        } catch (error) {
            console.error("Error creating spec sheet process:", error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    getAllProcessesBySpecSheetId: async (idSpecSheet) => {
        try {
            const response = await axiosInstance.get(`${API_ENDPOINT}/by-spec-sheet/${idSpecSheet}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching processes for spec sheet ID ${idSpecSheet}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    // ... (el resto de funciones sigue el mismo patrón) ...
    getSpecSheetProcessById: async (idSpecSheetProcess) => {
        try {
            const response = await axiosInstance.get(`${API_ENDPOINT}/${idSpecSheetProcess}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching spec sheet process ID ${idSpecSheetProcess}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    updateSpecSheetProcess: async (idSpecSheetProcess, processUpdateData) => {
        try {
            const response = await axiosInstance.put(`${API_ENDPOINT}/${idSpecSheetProcess}`, processUpdateData);
            return response.data;
        } catch (error) {
            console.error(`Error updating spec sheet process ID ${idSpecSheetProcess}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    deleteSpecSheetProcess: async (idSpecSheetProcess) => {
        try {
            await axiosInstance.delete(`${API_ENDPOINT}/${idSpecSheetProcess}`);
            return { message: "Proceso de ficha técnica eliminado exitosamente." };
        } catch (error) {
            console.error(`Error deleting spec sheet process ID ${idSpecSheetProcess}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    }
};

export default specSheetProcessService;