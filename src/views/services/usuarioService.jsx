// src/services/userService.js
import axios from 'axios';

const API_URL = 'http://localhost:3000/user'; // Endpoint para usuarios

const userService = {
    getAllUsers: async () => {
        try {
            const response = await axios.get(API_URL);
            return response.data;
        } catch (error) {
            console.error("Error fetching users:", error);
            throw error;
        }
    },

    getUserById: async (idUsers) => {
        try {
            const response = await axios.get(`${API_URL}/${idUsers}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching user with id ${idUsers}:`, error);
            throw error;
        }
    },

    createUser: async (userData) => {
        try {
            const response = await axios.post(API_URL, userData);
            return response.data;
        } catch (error) {
            console.error("Error creating user:", error);
            throw error;
        }
    },

    updateUser: async (idUsers, userData) => {
        try {
            const response = await axios.put(`${API_URL}/${idUsers}`, userData);
            return response.data;
        } catch (error) {
            console.error(`Error updating user with id ${idUsers}:`, error);
            throw error;
        }
    },

    deleteUser: async (idUsers) => {
        try {
            await axios.delete(`${API_URL}/${idUsers}`);
        } catch (error) {
            console.error(`Error deleting user with id ${idUsers}:`, error);
            throw error;
        }
    },

    changeStateUser: async (idUsers, status) => {
        try {
            const response = await axios.patch(`${API_URL}/${idUsers}`, { status });
            return response.data;
        } catch (error) {
            console.error(`Error changing status user with id ${idUsers}:`, error);
            throw error;
        }
    }
};

export default userService;