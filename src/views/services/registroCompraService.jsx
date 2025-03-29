// src/services/registerPurchaseService.jsx
import axios from 'axios';

const API_URL = 'http://localhost:3000/registerPurchase'; // Replace with your actual API endpoint

const registerPurchaseService = {
    getAllRegisterPurchases: async () => {
        try {
            const response = await axios.get(API_URL);
            return response.data;
        } catch (error) {
            console.error("Error fetching register purchases:", error);
            throw error;
        }
    },

    getRegisterPurchaseById: async (idPurchase) => {
        try {
            const response = await axios.get(`${API_URL}/${idPurchase}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching register purchase with id ${idPurchase}:`, error);
            throw error;
        }
    },

    createRegisterPurchase: async (purchaseData) => {
        try {
            const response = await axios.post(API_URL, purchaseData);
            return response.data;
        } catch (error) {
            console.error("Error creating register purchase:", error);
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