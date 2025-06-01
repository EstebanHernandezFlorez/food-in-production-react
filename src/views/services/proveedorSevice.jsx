// src/services/proveedorService.js
import axios from 'axios';

// Ajusta esta URL si es diferente.
const API_URL = 'http://localhost:3000/provider';

const proveedorService = {
    getAllProveedores: async () => {
        try {
            const response = await axios.get(API_URL);
            // Se espera que cada proveedor tenga al menos: idProvider, company, status
            return response.data;
        } catch (error) {
            console.error("[Service Error] Fetching all providers failed:", error.response?.data || error.message);
            throw error;
        }
    },

    createProveedor: async (proveedorData) => {
        try {
            const response = await axios.post(API_URL, proveedorData);
            return response.data;
        } catch (error) {
            console.error("[Service Error] Creating provider failed:", error.response?.data || error.message);
            throw error;
        }
    },

    getProveedorById: async (idProvider) => {
        const url = `${API_URL}/${idProvider}`;
        try {
            const response = await axios.get(url);
            return response.data;
        } catch (error) {
            console.error(`[Service Error] Fetching provider ID ${idProvider} failed:`, error.response?.data || error.message);
            throw error;
        }
    },

    updateProveedor: async (idProvider, proveedorData) => {
        const url = `${API_URL}/${idProvider}`;
        try {
            const response = await axios.put(url, proveedorData);
            return response.data;
        } catch (error) {
            console.error(`[Service Error] Updating provider ID ${idProvider} failed:`, error.response?.data || error.message);
            throw error;
        }
    },

    deleteProveedor: async (idProvider) => {
        const url = `${API_URL}/${idProvider}`;
        try {
            await axios.delete(url);
        } catch (error) {
            console.error(`[Service Error] Deleting provider ID ${idProvider} failed:`, error.response?.data || error.message);
            throw error;
        }
    },

    changeStateProveedor: async (idProvider, status) => {
        const url = `${API_URL}/${idProvider}`;
        try {
            const response = await axios.patch(url, { status });
            return response.data;
        } catch (error) {
            console.error(`[Service Error] Changing status for provider ID ${idProvider} failed:`, error.response?.data || error.message);
            throw error;
        }
    },

    isProviderAssociatedWithPurchases: async (idProvider) => {
        const checkUrl = `${API_URL}/${idProvider}/is-associated`;
        try {
            const response = await axios.get(checkUrl);
            if (response.data && typeof response.data.isAssociated === 'boolean') {
                return response.data.isAssociated;
            }
            console.warn(`[Service Warn] Unexpected association check response format for ID ${idProvider}:`, response.data);
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