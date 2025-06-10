import axiosInstance from './axiosConfig'; // <- CAMBIO

const API_ENDPOINT = '/spec-sheet-supplies'; // <- CAMBIO

const specSheetSupplyService = {
    addSupplyToSpecSheet: async (supplyData) => {
        try {
            const response = await axiosInstance.post(API_ENDPOINT, supplyData); // <- CAMBIO
            return response.data;
        } catch (error) {
            console.error('Error adding supply to spec sheet:', error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },
    // ... (el resto de funciones sigue el mismo patrón) ...
    getSuppliesBySpecSheetId: async (idSpecSheet) => {
        try {
            const response = await axiosInstance.get(`${API_ENDPOINT}/by-spec-sheet/${idSpecSheet}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching supplies for spec sheet ID ${idSpecSheet}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },
    getSpecSheetSupplyById: async (idSpecSheetSupply) => {
        try {
            const response = await axiosInstance.get(`${API_ENDPOINT}/${idSpecSheetSupply}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching spec sheet supply ID ${idSpecSheetSupply}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },
    updateSupplyInSpecSheet: async (idSpecSheetSupply, supplyUpdateData) => {
        try {
            const response = await axiosInstance.put(`${API_ENDPOINT}/${idSpecSheetSupply}`, supplyUpdateData);
            return response.data;
        } catch (error) {
            console.error(`Error updating supply in spec sheet (ID: ${idSpecSheetSupply}):`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },
    removeSupplyFromSpecSheet: async (idSpecSheetSupply) => {
        try {
            await axiosInstance.delete(`${API_ENDPOINT}/${idSpecSheetSupply}`);
            return { message: "Insumo eliminado de la ficha técnica exitosamente." };
        } catch (error) {
            console.error(`Error removing supply from spec sheet (ID: ${idSpecSheetSupply}):`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },
    getSpecSheetsBySupplyId: async (idSupply) => {
        try {
            const response = await axiosInstance.get(`${API_ENDPOINT}/by-supply/${idSupply}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching spec sheets using supply ID ${idSupply}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    }
};

export default specSheetSupplyService;