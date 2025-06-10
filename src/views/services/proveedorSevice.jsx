import axiosInstance from './axiosConfig'; // <- CAMBIO

const API_ENDPOINT = '/provider'; // <- CAMBIO

const proveedorService = {
    getAllProveedores: async () => {
        try {
            const response = await axiosInstance.get(API_ENDPOINT); // <- CAMBIO
            return Array.isArray(response.data.rows) ? response.data.rows : (Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error("[Service Error] Fetching all providers failed:", error.response?.data || error.message);
            return [];
        }
    },

    createProveedor: async (proveedorData) => {
        try {
            const response = await axiosInstance.post(API_ENDPOINT, proveedorData);
            return response.data;
        } catch (error) {
            console.error("[Service Error] Creating provider failed:", error.response?.data || error.message);
            throw error;
        }
    },

    getProveedorById: async (idProvider) => {
        try {
            const response = await axiosInstance.get(`${API_ENDPOINT}/${idProvider}`);
            return response.data;
        } catch (error) {
            console.error(`[Service Error] Fetching provider ID ${idProvider} failed:`, error.response?.data || error.message);
            throw error;
        }
    },

    updateProveedor: async (idProvider, proveedorData) => {
        try {
            const response = await axiosInstance.put(`${API_ENDPOINT}/${idProvider}`, proveedorData);
            return response.data;
        } catch (error) {
            console.error(`[Service Error] Updating provider ID ${idProvider} failed:`, error.response?.data || error.message);
            throw error;
        }
    },

    deleteProveedor: async (idProvider) => {
        try {
            await axiosInstance.delete(`${API_ENDPOINT}/${idProvider}`);
        } catch (error) {
            console.error(`[Service Error] Deleting provider ID ${idProvider} failed:`, error.response?.data || error.message);
            throw error;
        }
    },

    changeStateProveedor: async (idProvider, status) => {
        try {
            const response = await axiosInstance.patch(`${API_ENDPOINT}/${idProvider}`, { status });
            return response.data;
        } catch (error) {
            console.error(`[Service Error] Changing status for provider ID ${idProvider} failed:`, error.response?.data || error.message);
            throw error;
        }
    },

    isProviderAssociatedWithPurchases: async (idProvider) => {
        try {
            const response = await axiosInstance.get(`${API_ENDPOINT}/${idProvider}/is-associated`);
            if (response.data && typeof response.data.isAssociated === 'boolean') {
                return response.data.isAssociated;
            }
            return false;
        } catch (error) {
            if (error.response && error.response.status === 404) {
                return false;
            }
            console.error(`[Service Error] Checking provider association failed for ID ${idProvider}:`, error.response?.data || error.message);
            throw new Error("Association check failed");
        }
    }
};

export default proveedorService;