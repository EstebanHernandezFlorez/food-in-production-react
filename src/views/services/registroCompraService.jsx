// src/services/registerPurchaseService.jsx
import axios from 'axios';

const API_URL = 'http://localhost:3000/registerPurchase'; // Replace with your actual API endpoint

const registerPurchaseService = {
    getAllRegisterPurchases: async () => {
        try {
            // Idealmente, pide al backend que incluya proveedor y detalles
            // Podría ser con query params: /register-purchase?include=provider,details
            const response = await axios.get(API_URL); // Ajusta si necesitas params
            return response.data;
        } catch (error) {
            console.error("Error fetching purchases:", error.response?.data || error.message);
            throw error;
        }
    },

    getRegisterPurchaseById: async (id) => {
        try {
           // Pide explícitamente los detalles si no vienen por defecto en GET /:id
           const response = await axios.get(`${API_URL}/${id}?include=provider,details,insumos`); // Ajusta param
           return response.data;
       } catch (error) {
           console.error(`Error fetching purchase ${id}:`, error.response?.data || error.message);
           throw error;
       }
   },

    createRegisterPurchase: async (purchaseData) => {
        try {
            const response = await axios.post(API_URL, purchaseData);
            return response.data;
        } catch (error) {
            console.error("Error creating purchase:", error.response?.data || error.message);
            throw error;
        }
    },

    updateRegisterPurchase: async (idPurchase, purchaseData) => {
        try {
            const response = await axios.put(`${API_URL}/${idPurchase}`, purchaseData);
            return response.data;
        } catch (error) {
            console.error(`Error updating register purchase with id ${idPurchase}:`, error);
            throw error;
        }
    },

    deleteRegisterPurchase: async (idPurchase) => {
        try {
            await axios.delete(`${API_URL}/${idPurchase}`);
        } catch (error) {
            console.error(`Error deleting register purchase with id ${idPurchase}:`, error);
            throw error;
        }
    },

    changeStateRegisterPurchase: async (idPurchase, status) => {
        try {
            const response = await axios.patch(`${API_URL}/${idPurchase}`, { status });
            return response.data;
        } catch (error) {
            console.error(`Error changing status register purchase with id ${idPurchase}:`, error);
            throw error;
        }
    }
};

export default registerPurchaseService;