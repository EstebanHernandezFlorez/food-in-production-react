// src/services/proveedorService.jsx
import axios from 'axios';

const API_URL = 'http://localhost:3000/provider';

const proveedorService = {
    getAllProveedores: async () => {
        try {
            const response = await axios.get(API_URL);
            return response.data;
        } catch (error) {
            console.error("Error fetching proveedores:", error);
            throw error; // Re-throw the error to be handled by the component
        }
    },

    createProveedor: async (proveedorData) => {
        try {
            const response = await axios.post(API_URL, proveedorData);
            return response.data;
        } catch (error) {
            console.error("Error creating proveedor:", error);
            throw error;
        }
    },

    getProveedorById: async (idProvider) => {
        try {
            const response = await axios.get(`${API_URL}/${idProvider}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching proveedor with id ${idProvider}:`, error);
            throw error;
        }
    },

    updateProveedor: async (idProvider, proveedorData) => {
        try {
            const response = await axios.put(`${API_URL}/${idProvider}`, proveedorData);
            return response.data;
        } catch (error) {
            console.error(`Error updating proveedor with id ${idProvider}:`, error);
            throw error;
        }
    },

    deleteProveedor: async (idProvider) => {
        try {
            await axios.delete(`${API_URL}/${idProvider}`);
        } catch (error) {
            console.error(`Error deleting proveedor with id ${idProvider}:`, error);
            throw error;
        }
    },

    changeStateProveedor: async (idProvider, status) => { // new function
        try {
            const response = await axios.patch(`${API_URL}/${idProvider}`, { status }); // send status as request body
            return response.data;
        } catch (error) {
            console.error(`Error changing status proveedor with id ${idProvider}:`, error);
            throw error;
        }
    }
};

export default proveedorService;