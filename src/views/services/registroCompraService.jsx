import axiosInstance from './axiosConfig'; // <- CAMBIO

const API_ENDPOINT = '/registerPurchase'; // <- CAMBIO

const registerPurchaseService = {
    getAllRegisterPurchasesWithDetails: async () => {
        try {
            const response = await axiosInstance.get(API_ENDPOINT); // <- CAMBIO
            if (!Array.isArray(response.data)) {
                console.warn("La respuesta de la API no fue un array. Se devuelve un array vacío.", response.data);
                return [];
            }
            return response.data;
        } catch (error) {
            console.error(`Error al llamar a GET ${API_ENDPOINT}:`, error.response?.data || error.message);
            throw error;
        }
    },

    getRegisterPurchaseById: async (idPurchase) => {
        try {
            const response = await axiosInstance.get(`${API_ENDPOINT}/${idPurchase}`);
            return response.data;
        } catch (error) {
            console.error(`Error al llamar a GET ${API_ENDPOINT}/${idPurchase}:`, error.response?.data || error.message);
            throw error;
        }
    },

    getMeatCategoryProviders: async () => {
        try {
            const response = await axiosInstance.get(`${API_ENDPOINT}/providers/meat`);
            return Array.isArray(response.data) ? response.data : [];
        } catch (error) {
            console.error('Error al obtener proveedores de categoría carne:', error.response?.data || error.message);
            throw error;
        }
    },

    createRegisterPurchase: async (purchaseData) => {
        try {
            const response = await axiosInstance.post(API_ENDPOINT, purchaseData);
            return response.data;
        } catch (error) {
            let errorMessage = "Error al crear el registro de compra.";
            if (error.response) { errorMessage = `Error ${error.response.status}: ` + (error.response.data?.message || JSON.stringify(error.response.data)); }
            else if (error.request) { errorMessage = 'No se recibió respuesta del servidor.'; }
            else { errorMessage = `Error al configurar la solicitud: ${error.message}`; }
            throw new Error(errorMessage);
        }
    },

    updateRegisterPurchaseHeader: async (idPurchase, purchaseData) => {
        try {
            const response = await axiosInstance.put(`${API_ENDPOINT}/${idPurchase}`, purchaseData);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || `Error actualizando compra ${idPurchase}.`);
        }
    },

    deleteRegisterPurchase: async (idPurchase) => {
        try {
            await axiosInstance.delete(`${API_ENDPOINT}/${idPurchase}`);
        } catch (error) {
            throw new Error(error.response?.data?.message || `Error al eliminar la compra ${idPurchase}.`);
        }
    },

    updatePurchaseStatus: async (idPurchase, statusUpdate) => {
        try {
            if (!statusUpdate || (statusUpdate.status === undefined && statusUpdate.paymentStatus === undefined)) {
                throw new Error("Se debe proporcionar un estado para actualizar.");
            }
            const response = await axiosInstance.patch(`${API_ENDPOINT}/${idPurchase}/status`, statusUpdate);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || `Error al cambiar el estado de la compra ${idPurchase}.`);
        }
    },
};

export default registerPurchaseService;