// src/services/userService.js

// import axios from 'axios'; // <-- ELIMINADO
import axiosInstance from './axiosConfig'; // <-- AÑADIDO (¡Verifica que la ruta './axiosInstance' sea correcta!)

const PROFILE_API_URL = '/users/profile/me';
// Usa la ruta relativa
const API_URL = '/users';

const userService = {

    getUserProfile: async () => {
        try {
            // Llama a la ruta específica del perfil en tu backend
            const response = await axiosInstance.get(PROFILE_API_URL);
            // Asume que response.data contiene el objeto del usuario con su 'role'
            return response.data;
        } catch (error) {
            console.error("Error fetching user profile:", error);
            // Podrías querer manejar errores específicos de autenticación aquí
            // (ej. si el token es inválido/expirado y recibes un 401 o 403)
            throw error;
        }
    },

    getAllUsers: async () => {
        try {
            // Usa axiosInstance
            const response = await axiosInstance.get(API_URL);
            return response.data;
        } catch (error) {
            console.error("Error fetching users:", error);
            throw error;
        }
    },

    // Cambié el parámetro en la URL a 'id' para coincidir con tus rutas de Express (:id)
    getUserById: async (id) => { // El nombre del argumento puede ser cualquiera (id, idUsers, etc.)
        try {
            // Usa axiosInstance
            const response = await axiosInstance.get(`${API_URL}/${id}`); // Usa 'id' en la URL
            return response.data;
        } catch (error) {
            console.error(`Error fetching user with id ${id}:`, error);
            throw error;
        }
    },

    createUser: async (userData) => {
        try {
             // Usa axiosInstance
            const response = await axiosInstance.post(API_URL, userData);
            return response.data;
        } catch (error) {
            console.error("Error creating user:", error);
            throw error;
        }
    },

    // Cambié el parámetro en la URL a 'id'
    updateUser: async (id, userData) => { // Recibe 'id'
        try {
             // Usa axiosInstance
            const response = await axiosInstance.put(`${API_URL}/${id}`, userData); // Usa 'id' en la URL
            return response.data;
        } catch (error) {
            console.error(`Error updating user with id ${id}:`, error);
            throw error;
        }
    },

    // Cambié el parámetro en la URL a 'id'
    deleteUser: async (id) => { // Recibe 'id'
        try {
             // Usa axiosInstance
            await axiosInstance.delete(`${API_URL}/${id}`); // Usa 'id' en la URL
        } catch (error) {
            console.error(`Error deleting user with id ${id}:`, error);
            throw error;
        }
    },

    // Cambié el parámetro en la URL a 'id'
    changeStateUser: async (id, status) => { // Recibe 'id'
        try {
             // Usa axiosInstance
            const response = await axiosInstance.patch(`${API_URL}/${id}`, { status }); // Usa 'id' en la URL
            return response.data;
        } catch (error) {
            console.error(`Error changing status user with id ${id}:`, error);
            throw error;
        }
    }
};

export default userService;