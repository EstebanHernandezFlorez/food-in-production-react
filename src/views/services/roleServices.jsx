import axios from 'axios';

const API_URL = 'http://localhost:3000/role'; 

const roleService = {
    getAllRoles: async () => {
        try {
            const response = await axios.get(API_URL);
            return response.data;
        } catch (error) {
            console.error("Error fetching roles:", error);
            throw error;
        }
    },

    getRoleById: async (idRole) => {
        try {
            const response = await axios.get(`${API_URL}/${idRole}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching role with id ${idRole}:`, error);
            throw error;
        }
    },

    createRole: async (roleData) => {
        try {
            const response = await axios.post(API_URL, roleData);
            return response.data;
        } catch (error) {
            console.error("Error creating role:", error);
            throw error;
        }
    },

    updateRole: async (idRole, roleData) => {
        try {
            const response = await axios.put(`${API_URL}/${idRole}`, roleData);
            return response.data;
        } catch (error) {
            console.error(`Error updating role with id ${idRole}:`, error);
            throw error;
        }
    },

    deleteRole: async (idRole) => {
        try {
            await axios.delete(`${API_URL}/${idRole}`);
        } catch (error) {
            console.error(`Error deleting role with id ${idRole}:`, error);
            throw error;
        }
    },

    changeRoleState: async (idRole, status) => {
        try {
            const response = await axios.patch(`${API_URL}/${idRole}`, { status });
            return response.data;
        } catch (error) {
            console.error(`Error changing state of role with id ${idRole}:`, error);
            throw error;
        }
    }
};

export default roleService;
