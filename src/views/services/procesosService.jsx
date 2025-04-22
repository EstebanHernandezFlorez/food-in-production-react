import axios from 'axios';

const API_URL = 'http://localhost:3000/api/process';

const procesoService = {
    createProcess: async (processData) => {
        try {
            const response = await axios.post(API_URL, processData);
            return response.data;
        } catch (error) {
            console.error("Error creating process:", error);
            throw error;
        }
    },

    getAllProcesses: async () => {
        try {
            const response = await axios.get(API_URL);
            return response.data;
        } catch (error) {
            console.error("Error fetching processes:", error);
            throw error;
        }
    },

    getProcessById: async (id) => {
        try {
            const response = await axios.get(`${API_URL}/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching process with id ${id}:`, error);
            throw error;
        }
    },

    updateProcess: async (id, processData) => {
        try {
            const response = await axios.put(`${API_URL}/${id}`, processData);
            return response.data;
        } catch (error) {
            console.error(`Error updating process with id ${id}:`, error);
            throw error;
        }
    },

    deleteProcess: async (id) => {
        try {
            await axios.delete(`${API_URL}/${id}`);
        } catch (error) {
            console.error(`Error deleting process with id ${id}:`, error);
            throw error;
        }
    },

    changeStateProcess: async (id, status) => {
        try {
            const response = await axios.patch(`${API_URL}/${id}/status`, { status });
            return response.data;
        } catch (error) {
            console.error(`Error changing status for process ${id}:`, error);
            throw error;
        }
    },

    searchProcesses: async (searchTerm) => {
        try {
            const response = await axios.get(`${API_URL}/search?term=${searchTerm}`);
            return response.data;
        } catch (error) {
            console.error(`Error searching processes:`, error);
            throw error;
        }
    }
};

export default procesoService;
