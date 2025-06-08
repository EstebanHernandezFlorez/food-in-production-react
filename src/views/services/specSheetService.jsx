// RUTA: src/services/specSheetService.js

import axios from 'axios';
import { apiurl } from '../../enviroments/local.js';

const SPEC_SHEET_API_URL = `${apiurl}/specSheet`;

const specSheetService = {
    // <<<--- CORRECCIÓN: Asegurar que siempre devuelva un array --- >>>
    getAllSpecSheets: async (params = {}) => {
        try {
            const response = await axios.get(SPEC_SHEET_API_URL, { params });
            // Verificación defensiva para asegurar que se devuelve un array
            if (response.data && Array.isArray(response.data.data)) {
                return response.data.data;
            }
            if (Array.isArray(response.data)) {
                return response.data;
            }
            console.warn("La respuesta de getAllSpecSheets no es un array. Se devuelve un array vacío.", response.data);
            return [];
        } catch (error) {
            console.error('Error fetching spec sheets:', error.response?.data || error.message);
            return []; // Devuelve array vacío en caso de error
        }
    },

    getSpecSheetById: async (idSpecSheet) => {
        try {
            const response = await axios.get(`${SPEC_SHEET_API_URL}/${idSpecSheet}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching spec sheet ID ${idSpecSheet}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    createSpecSheet: async (specSheetData) => {
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
            const response = await axios.patch(`${SPEC_SHEET_API_URL}/${idSpecSheet}/status`, { status });
            return response.data;
        } catch (error) {
            console.error(`Error changing status for spec sheet ID ${idSpecSheet}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    getSpecSheetsByProductId: async (idProduct) => {
        try {
            const response = await axios.get(`${SPEC_SHEET_API_URL}/by-product/${idProduct}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching spec sheets for product ID ${idProduct}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    }
};

export default specSheetService;