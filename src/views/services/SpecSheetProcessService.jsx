// src/services/specSheetProcessService.js
import axios from 'axios';
import { apiurl } from '../../enviroments/local'; // CORREGIDO

const SPEC_SHEET_PROCESS_API_URL = `${apiurl}/spec-sheet-processes`; // CORREGIDO

// ... resto del código del servicio (sin cambios en la lógica interna) ...
const specSheetProcessService = {
    createSpecSheetProcess: async (processData) => {
        try {
            const response = await axios.post(SPEC_SHEET_PROCESS_API_URL, processData);
            return response.data;
        } catch (error) {
            console.error("Error creating spec sheet process:", error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    getAllProcessesBySpecSheetId: async (idSpecSheet) => {
        try {
            const response = await axios.get(`${SPEC_SHEET_PROCESS_API_URL}/by-spec-sheet/${idSpecSheet}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching processes for spec sheet ID ${idSpecSheet}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    getSpecSheetProcessById: async (idSpecSheetProcess) => {
        try {
            const response = await axios.get(`${SPEC_SHEET_PROCESS_API_URL}/${idSpecSheetProcess}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching spec sheet process ID ${idSpecSheetProcess}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    updateSpecSheetProcess: async (idSpecSheetProcess, processUpdateData) => {
        try {
            const response = await axios.put(`${SPEC_SHEET_PROCESS_API_URL}/${idSpecSheetProcess}`, processUpdateData);
            return response.data;
        } catch (error) {
            console.error(`Error updating spec sheet process ID ${idSpecSheetProcess}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    deleteSpecSheetProcess: async (idSpecSheetProcess) => {
        try {
            await axios.delete(`${SPEC_SHEET_PROCESS_API_URL}/${idSpecSheetProcess}`);
            return { message: "Proceso de ficha técnica eliminado exitosamente." };
        } catch (error) {
            console.error(`Error deleting spec sheet process ID ${idSpecSheetProcess}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    }
};

export default specSheetProcessService;