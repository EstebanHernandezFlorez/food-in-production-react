// src/services/userService.jsx

import axiosInstance from './axiosConfig'; // Verifica que la ruta sea correcta

const API_URL = '/users'; // Base URL para la mayoría de las operaciones de usuario
const PROFILE_API_URL = `${API_URL}/profile/me`; // URL completa para el perfil

const userService = {
    getUserProfile: async () => {
        try {
            const response = await axiosInstance.get(PROFILE_API_URL);
            return response.data;
        } catch (error) {
            console.error("Error fetching user profile:", error.response?.data || error.message);
            throw error;
        }
    },

    getAllUsers: async () => {
        try {
            const response = await axiosInstance.get(API_URL);
            return response.data;
        } catch (error) {
            console.error("Error fetching users:", error.response?.data || error.message);
            throw error;
        }
    },

    getUserById: async (id) => {
        try {
            const response = await axiosInstance.get(`${API_URL}/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching user with id ${id}:`, error.response?.data || error.message);
            throw error;
        }
    },

    createUser: async (userData) => {
        try {
            const response = await axiosInstance.post(API_URL, userData);
            return response.data;
        } catch (error) {
            console.error("Error creating user:", error.response?.data || error.message);
            throw error;
        }
    },

    updateUser: async (id, userData) => {
        try {
            const response = await axiosInstance.put(`${API_URL}/${id}`, userData);
            return response.data;
        } catch (error) {
            console.error(`Error updating user with id ${id}:`, error.response?.data || error.message);
            throw error;
        }
    },

    deleteUser: async (id) => {
        try {
            // DELETE exitoso usualmente devuelve 204 No Content, axios puede no tener `response.data`
            await axiosInstance.delete(`${API_URL}/${id}`);
            // No es necesario devolver nada o puedes devolver un objeto de éxito si lo prefieres
            return { success: true, message: "Usuario eliminado" };
        } catch (error) {
            console.error(`Error deleting user with id ${id}:`, error.response?.data || error.message);
            throw error;
        }
    },

    changeStateUser: async (id, status) => {
        try {
            // *** CORRECCIÓN AQUÍ para que coincida con la ruta del backend ***
            const response = await axiosInstance.patch(`${API_URL}/${id}/state`, { status });
            return response.data;
        } catch (error) {
            console.error(`Error changing status for user with id ${id}:`, error.response?.data || error.message);
            throw error;
        }
    }
};

export default userService;