// src/services/specSheetService.js
import axios from 'axios';
import { apiurl } from '../../enviroments/local.js'; // Ajusta la ruta si es necesario

const SPEC_SHEET_API_URL = `${apiurl}/specSheet`; // Usar 'apiurl'

const specSheetService = {
    getAllSpecSheets: async (params = {}) => {
        try {
            const response = await axios.get(SPEC_SHEET_API_URL, { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching spec sheets:', error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    getSpecSheetById: async (idSpecSheet) => {
        try {
            const response = await axios.get(`${SPEC_SHEET_API_URL}/${idSpecSheet}`);
            return response.data; // El backend debería devolver la ficha con sus detalles (insumos y procesos)
        } catch (error) {
            console.error(`Error fetching spec sheet ID ${idSpecSheet}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    createSpecSheet: async (specSheetData) => {
        // specSheetData debe incluir: idProduct, startDate, quantityBase, y arrays para 'supplies' y 'processes'
        try {
            const response = await axios.post(SPEC_SHEET_API_URL, specSheetData);
            return response.data;
        } catch (error) {
            console.error('Error creating spec sheet:', error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    updateSpecSheet: async (idSpecSheet, specSheetData) => {
        try {
            const response = await axios.put(`${SPEC_SHEET_API_URL}/${idSpecSheet}`, specSheetData);
            return response.data;
        } catch (error) {
            console.error(`Error updating spec sheet ID ${idSpecSheet}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    deleteSpecSheet: async (idSpecSheet) => {
        try {
            await axios.delete(`${SPEC_SHEET_API_URL}/${idSpecSheet}`);
            return { message: "Ficha técnica eliminada exitosamente." };
        } catch (error) {
            console.error(`Error deleting spec sheet ID ${idSpecSheet}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    changeSpecSheetStatus: async (idSpecSheet, status) => {
        try {
            // Ruta del backend /specSheet/:idSpecSheet/status
            const response = await axios.patch(`${SPEC_SHEET_API_URL}/${idSpecSheet}/status`, { status });
            return response.data;
        } catch (error) {
            console.error(`Error changing status for spec sheet ID ${idSpecSheet}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    getSpecSheetsByProductId: async (idProduct) => {
        try {
            // Ruta del backend /specSheet/by-product/:idProduct
            const response = await axios.get(`${SPEC_SHEET_API_URL}/by-product/${idProduct}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching spec sheets for product ID ${idProduct}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    }
};

export default specSheetService;