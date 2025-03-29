// src/services/supplierService.jsx
import axios from 'axios';

const API_URL = 'http://localhost:3000/supplier'; // Replace with your actual API endpoint

const supplierService = {
    getAllSuppliers: async () => {
        try {
            const response = await axios.get(API_URL);
            return response.data;
        } catch (error) {
            console.error("Error fetching suppliers:", error);
            throw error;
        }
    },

    getSupplierById: async (idSupplier) => {
        try {
            const response = await axios.get(`${API_URL}/${idSupplier}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching supplier with id ${idSupplier}:`, error);
            throw error;
        }
    },

    createSupplier: async (supplierData) => {
        try {
            const response = await axios.post(API_URL, supplierData);
            return response.data;
        } catch (error) {
            console.error("Error creating supplier:", error);
            throw error;
        }
    },

    updateSupplier: async (idSupplier, supplierData) => {
        try {
            const response = await axios.put(`${API_URL}/${idSupplier}`, supplierData);
            return response.data;
        } catch (error) {
            console.error(`Error updating supplier with id ${idSupplier}:`, error);
            throw error;
        }
    },

    deleteSupplier: async (idSupplier) => {
        try {
            await axios.delete(`${API_URL}/${idSupplier}`);
        } catch (error) {
            console.error(`Error deleting supplier with id ${idSupplier}:`, error);
            throw error;
        }
    },

    changeStateSupplier: async (idSupplier, status) => {
        try {
            const response = await axios.patch(`${API_URL}/${idSupplier}`, { status });
            return response.data;
        } catch (error) {
            console.error(`Error changing status supplier with id ${idSupplier}:`, error);
            throw error;
        }
    }
};

export default supplierService;