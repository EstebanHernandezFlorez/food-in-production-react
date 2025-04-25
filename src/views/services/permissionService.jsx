// src/services/permissionService.js
import axiosInstance from './axiosConfig'; // Verifica ruta

const API_URL = '/permission';

const permissionService = {
    /** GET /permission */
    getAll: async () => {
        try {
            console.log("[permissionService] GET /permission");
            const response = await axiosInstance.get(API_URL);
            console.log("[permissionService] GET /permission response:", response.status);
            return response.data;
        } catch (error) {
            console.error("[permissionService] GET /permission error:", error.response?.data || error.message);
            throw error;
        }
    },

    /** GET /permission/:idPermission */
    getById: async (idPermission) => {
        try {
             console.log(`[permissionService] GET ${API_URL}/${idPermission}`);
            const response = await axiosInstance.get(`${API_URL}/${idPermission}`);
            console.log(`[permissionService] GET ${API_URL}/${idPermission} response:`, response.status);
            return response.data;
        } catch (error) {
            console.error(`[permissionService] GET ${API_URL}/${idPermission} error:`, error.response?.data || error.message);
            throw error;
        }
    },

    /** POST /permission */
    create: async (permissionData) => {
        try {
             console.log("[permissionService] POST /permission with data:", permissionData);
            const response = await axiosInstance.post(API_URL, permissionData);
             console.log("[permissionService] POST /permission response:", response.status);
            return response.data;
        } catch (error) {
            console.error("[permissionService] POST /permission error:", error.response?.data || error.message);
            throw error;
        }
    },

    /** PUT /permission/:idPermission */
    update: async (idPermission, permissionData) => {
        try {
            console.log(`[permissionService] PUT ${API_URL}/${idPermission} with data:`, permissionData);
            const response = await axiosInstance.put(`${API_URL}/${idPermission}`, permissionData);
             console.log(`[permissionService] PUT ${API_URL}/${idPermission} response:`, response.status);
            return true; // Asumiendo 204 o similar
        } catch (error) {
            console.error(`[permissionService] PUT ${API_URL}/${idPermission} error:`, error.response?.data || error.message);
            throw error;
        }
    },

    /** DELETE /permission/:idPermission */
    delete: async (idPermission) => {
        try {
             console.log(`[permissionService] DELETE ${API_URL}/${idPermission}`);
            const response = await axiosInstance.delete(`${API_URL}/${idPermission}`);
            console.log(`[permissionService] DELETE ${API_URL}/${idPermission} response:`, response.status);
            return true; // Asumiendo 204 o similar
        } catch (error) {
            console.error(`[permissionService] DELETE ${API_URL}/${idPermission} error:`, error.response?.data || error.message);
            throw error;
        }
    },

    /** PATCH /permission/:idPermission */
    changeState: async (idPermission, status) => {
         try {
            console.log(`[permissionService] PATCH ${API_URL}/${idPermission} with status: ${status}`);
            const response = await axiosInstance.patch(`${API_URL}/${idPermission}`, { status });
            console.log(`[permissionService] PATCH ${API_URL}/${idPermission} response:`, response.status);
            return true; // Asumiendo 204 o similar
        } catch (error) {
            console.error(`[permissionService] PATCH ${API_URL}/${idPermission} error:`, error.response?.data || error.message);
            throw error;
        }
    }
};

export default permissionService;