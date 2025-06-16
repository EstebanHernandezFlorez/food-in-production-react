// CORREGIDO: Importamos la instancia centralizada.
import axiosInstance from './axiosConfig'; 

// CORREGIDO: Ya no importamos 'apiurl' de un archivo de entorno.
// Solo definimos el path del endpoint.
const MASTER_PROCESS_API_ENDPOINT = '/process'; 

const masterProcessService = {
    createMasterProcess: async (processData) => {
        try {
            // CORREGIDO: Usar axiosInstance
            const response = await axiosInstance.post(MASTER_PROCESS_API_ENDPOINT, processData);
            return response.data;
        } catch (error) {
            console.error("Error creating master process:", error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    getAllMasterProcesses: async (params = {}) => {
        try {
            // CORREGIDO: Usar axiosInstance
            const response = await axiosInstance.get(MASTER_PROCESS_API_ENDPOINT, { params });
            return response.data;
        } catch (error) {
            console.error("Error fetching master processes:", error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    getMasterProcessById: async (idProcess) => {
        try {
            // CORREGIDO: Usar axiosInstance y el endpoint relativo
            const response = await axiosInstance.get(`${MASTER_PROCESS_API_ENDPOINT}/${idProcess}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching master process ID ${idProcess}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    // ... y así sucesivamente para el resto de métodos (update, delete, etc.)
    // Simplemente reemplaza `axios` por `axiosInstance` y la URL completa por el endpoint.
    
    updateMasterProcess: async (idProcess, processData) => {
        try {
            const response = await axiosInstance.put(`${MASTER_PROCESS_API_ENDPOINT}/${idProcess}`, processData);
            return response.data;
        } catch (error) {
            console.error(`Error updating master process ID ${idProcess}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    deleteMasterProcess: async (idProcess) => {
        try {
            await axiosInstance.delete(`${MASTER_PROCESS_API_ENDPOINT}/${idProcess}`);
            return { message: "Proceso maestro eliminado exitosamente." };
        } catch (error) {
            console.error(`Error deleting master process ID ${idProcess}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    changeMasterProcessStatus: async (idProcess, status) => {
        try {
            const response = await axiosInstance.patch(`${MASTER_PROCESS_API_ENDPOINT}/${idProcess}/status`, { status });
            return response.data;
        } catch (error) {
            console.error(`Error changing status for master process ID ${idProcess}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    searchMasterProcesses: async (searchTerm) => {
        try {
            const response = await axiosInstance.get(`${MASTER_PROCESS_API_ENDPOINT}/search`, { params: { term: searchTerm } });
            return response.data;
        } catch (error) {
            console.error(`Error searching master processes:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    }
};

export default masterProcessService;