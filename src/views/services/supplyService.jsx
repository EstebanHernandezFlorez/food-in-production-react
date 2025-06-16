import axiosInstance from './axiosConfig'; // <- CAMBIO

const API_ENDPOINT = '/supplies'; // <- CAMBIO

const supplyService = {
    getAllSupplies: async (params = {}) => {
        try {
            const response = await axiosInstance.get(API_ENDPOINT, { params }); // <- CAMBIO
            return response.data;
        } catch (error) {
            console.error('Error fetching supplies:', error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },
    // ... (el resto de funciones sigue el mismo patrón) ...
    getSupplyById: async (idSupply) => {
        try {
            const response = await axiosInstance.get(`${API_ENDPOINT}/${idSupply}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching supply ID ${idSupply}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },
    createSupply: async (supplyData) => {
        try {
            const response = await axiosInstance.post(API_ENDPOINT, supplyData);
            return response.data;
        } catch (error) {
            console.error('Error creating supply:', error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },
    updateSupply: async (idSupply, supplyData) => {
        try {
            const response = await axiosInstance.put(`${API_ENDPOINT}/${idSupply}`, supplyData);
            return response.data;
        } catch (error) {
            console.error(`Error updating supply ID ${idSupply}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },
    deleteSupply: async (idSupply) => {
        try {
            await axiosInstance.delete(`${API_ENDPOINT}/${idSupply}`);
            return { message: "Insumo eliminado exitosamente." };
        } catch (error) {
            console.error(`Error deleting supply ID ${idSupply}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },
    changeSupplyStatus: async (idSupply, status) => {
        try {
            const response = await axiosInstance.patch(`${API_ENDPOINT}/${idSupply}/status`, { status });
            return response.data;
        } catch (error) {
            console.error(`Error changing status for supply ID ${idSupply}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    }
};

export default supplyService;