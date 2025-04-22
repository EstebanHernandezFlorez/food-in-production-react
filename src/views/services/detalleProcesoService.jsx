import axios from 'axios';

const API_URL = 'http://localhost:3000/api/process-detail';

const detalleProcesoService = {
    createProcessDetail: async (processDetailData) => {
        try {
            const response = await axios.post(API_URL, processDetailData);
            return response.data;
        } catch (error) {
            console.error("Error creating process detail:", error);
            throw error;
        }
    },

    getAllProcessDetails: async () => {
        try {
            const response = await axios.get(API_URL);
            return response.data;
        } catch (error) {
            console.error("Error fetching process details:", error);
            throw error;
        }
    },

    getProcessDetailById: async (id) => {
        try {
            const response = await axios.get(`${API_URL}/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching process detail with id ${id}:`, error);
            throw error;
        }
    },

    updateProcessDetail: async (id, processDetailData) => {
        try {
            const response = await axios.put(`${API_URL}/${id}`, processDetailData);
            return response.data;
        } catch (error) {
            console.error(`Error updating process detail with id ${id}:`, error);
            throw error;
        }
    },

    deleteProcessDetail: async (id) => {
        try {
            await axios.delete(`${API_URL}/${id}`);
        } catch (error) {
            console.error(`Error deleting process detail with id ${id}:`, error);
            throw error;
        }
    },

    changeStateProcessDetail: async (id, status) => {
        try {
            const response = await axios.patch(`${API_URL}/${id}/status`, { status });
            return response.data;
        } catch (error) {
            console.error(`Error changing status for process detail ${id}:`, error);
            throw error;
        }
    },

    getProcessDetailsByProcess: async (idProcess) => {
        try {
            const response = await axios.get(`${API_URL}/process/${idProcess}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching process details for process ${idProcess}:`, error);
            throw error;
        }
    },

    getProcessDetailsBySpecSheet: async (idSpecSheet) => {
        try {
            const response = await axios.get(`${API_URL}/spec-sheet/${idSpecSheet}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching process details for spec sheet ${idSpecSheet}:`, error);
            throw error;
        }
    },

    getProcessDetailsByEmployee: async (idEmployee) => {
        try {
            const response = await axios.get(`${API_URL}/employee/${idEmployee}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching process details for employee ${idEmployee}:`, error);
            throw error;
        }
    },

    getActiveProcessDetails: async () => {
        try {
            const response = await axios.get(`${API_URL}/active`);
            return response.data;
        } catch (error) {
            console.error("Error fetching active process details:", error);
            throw error;
        }
    }
};

export default detalleProcesoService;
