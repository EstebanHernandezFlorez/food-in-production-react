// src/services/masterProcessService.js
import axios from 'axios';
import { apiurl } from '../../enviroments/local'; // CORREGIDO

const MASTER_PROCESS_API_URL = `${apiurl}/process`; // CORREGIDO (o /master-processes si cambiaste)

// ... resto del código del servicio (sin cambios en la lógica interna) ...
const masterProcessService = {
    createMasterProcess: async (processData) => {
        try {
            const response = await axios.post(MASTER_PROCESS_API_URL, processData);
            return response.data;
        } catch (error) {
            console.error("Error creating master process:", error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    getAllMasterProcesses: async (params = {}) => {
        try {
            const response = await axios.get(MASTER_PROCESS_API_URL, { params });
            return response.data;
        } catch (error) {
            console.error("Error fetching master processes:", error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    getMasterProcessById: async (idProcess) => {
        try {
            const response = await axios.get(`${MASTER_PROCESS_API_URL}/${idProcess}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching master process ID ${idProcess}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    updateMasterProcess: async (idProcess, processData) => {
        try {
            const response = await axios.put(`${MASTER_PROCESS_API_URL}/${idProcess}`, processData);
            return response.data;
        } catch (error) {
            console.error(`Error updating master process ID ${idProcess}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    deleteMasterProcess: async (idProcess) => {
        try {
            await axios.delete(`${MASTER_PROCESS_API_URL}/${idProcess}`);
            return { message: "Proceso maestro eliminado exitosamente." };
        } catch (error) {
            console.error(`Error deleting master process ID ${idProcess}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    changeMasterProcessStatus: async (idProcess, status) => {
        try {
            // Ruta del backend /process/:idProcess/status
            const response = await axios.patch(`${MASTER_PROCESS_API_URL}/${idProcess}/status`, { status });
            return response.data;
        } catch (error) {
            console.error(`Error changing status for master process ID ${idProcess}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    searchMasterProcesses: async (searchTerm) => { // Si tienes esta funcionalidad
        try {
            const response = await axios.get(`${MASTER_PROCESS_API_URL}/search`, { params: { term: searchTerm } });
            return response.data;
        } catch (error) {
            console.error(`Error searching master processes:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    }
};

export default masterProcessService;