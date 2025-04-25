// src/services/privilegeService.js
import axiosInstance from './axiosConfig'; // Verifica ruta

const API_URL = '/privilege';

const privilegeService = {
    /** GET /privilege */
    getAll: async () => {
        try {
            console.log("[privilegeService] GET /privilege");
            const response = await axiosInstance.get(API_URL);
            console.log("[privilegeService] GET /privilege response:", response.status);
            return response.data;
        } catch (error) {
            console.error("[privilegeService] GET /privilege error:", error.response?.data || error.message);
            throw error;
        }
    },

    /** GET /privilege/:idPrivilege */
    getById: async (idPrivilege) => {
        try {
            console.log(`[privilegeService] GET ${API_URL}/${idPrivilege}`);
            const response = await axiosInstance.get(`${API_URL}/${idPrivilege}`);
            console.log(`[privilegeService] GET ${API_URL}/${idPrivilege} response:`, response.status);
            return response.data;
        } catch (error) {
            console.error(`[privilegeService] GET ${API_URL}/${idPrivilege} error:`, error.response?.data || error.message);
            throw error;
        }
    },

     /** POST /privilege */
    create: async (privilegeData) => {
        try {
             console.log("[privilegeService] POST /privilege with data:", privilegeData);
            const response = await axiosInstance.post(API_URL, privilegeData);
            console.log("[privilegeService] POST /privilege response:", response.status);
            return response.data;
        } catch (error) {
            console.error("[privilegeService] POST /privilege error:", error.response?.data || error.message);
            throw error;
        }
    },

    /** PUT /privilege/:idPrivilege */
    update: async (idPrivilege, privilegeData) => {
        try {
            console.log(`[privilegeService] PUT ${API_URL}/${idPrivilege} with data:`, privilegeData);
            const response = await axiosInstance.put(`${API_URL}/${idPrivilege}`, privilegeData);
             console.log(`[privilegeService] PUT ${API_URL}/${idPrivilege} response:`, response.status);
            return true; // Asumiendo 204 o similar
        } catch (error) {
            console.error(`[privilegeService] PUT ${API_URL}/${idPrivilege} error:`, error.response?.data || error.message);
            throw error;
        }
    },

    /** DELETE /privilege/:idPrivilege */
    delete: async (idPrivilege) => {
        try {
             console.log(`[privilegeService] DELETE ${API_URL}/${idPrivilege}`);
            const response = await axiosInstance.delete(`${API_URL}/${idPrivilege}`);
            console.log(`[privilegeService] DELETE ${API_URL}/${idPrivilege} response:`, response.status);
            return true; // Asumiendo 204 o similar
        } catch (error) {
            console.error(`[privilegeService] DELETE ${API_URL}/${idPrivilege} error:`, error.response?.data || error.message);
            throw error;
        }
    },
};

export default privilegeService;