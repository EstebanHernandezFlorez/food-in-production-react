// src/services/roleService.js (FRONTEND)
import axiosInstance from './axiosConfig';

const API_URL = '/role'; // Ruta base para el API de roles en el backend

const roleService = {
    /** GET /role */
    getAllRoles: async () => {
        try {
            console.log(`[Frontend roleService] GET ${API_URL}`);
            const response = await axiosInstance.get(API_URL);
            console.log(`[Frontend roleService] GET ${API_URL} response status:`, response.status);
            return response.data;
        } catch (error) {
            const errorData = error.response?.data || { message: error.message || "Error desconocido al obtener roles." };
            console.error(`[Frontend roleService] GET ${API_URL} error:`, errorData);
            throw new Error(errorData.message); // Lanzar un objeto Error
        }
    },

    /** GET /role/:idRole */
    getRoleById: async (idRole) => {
        const endpoint = `${API_URL}/${idRole}`;
        try {
            console.log(`[Frontend roleService] GET ${endpoint}`);
            const response = await axiosInstance.get(endpoint);
            console.log(`[Frontend roleService] GET ${endpoint} response status:`, response.status);
            return response.data;
        } catch (error) {
            const errorData = error.response?.data || { message: error.message || `Error desconocido al obtener el rol ID ${idRole}.` };
            console.error(`[Frontend roleService] GET ${endpoint} error:`, errorData);
            throw new Error(errorData.message);
        }
    },

    /** POST /role - Crea rol Y sus asignaciones */
    createRole: async (roleData) => {
        try {
            console.log('[Frontend roleService] EXACT DATA BEING SENT TO POST /role:', JSON.stringify(roleData, null, 2));
            const response = await axiosInstance.post(API_URL, roleData);
            console.log(`[Frontend roleService] POST ${API_URL} response status:`, response.status, "Data:", response.data);
            return response.data; // Devolver los datos de la respuesta (ej. el rol creado o mensaje de éxito)
        } catch (error) {
            // error.response.data debería contener { message: "Error al crear el rol: Cannot read properties of undefined (reading 'uuid')" }
            const errorData = error.response?.data || { message: error.message || "Error desconocido al crear el rol." };
            console.error(`[Frontend roleService] POST ${API_URL} error:`, errorData);
            // Asegúrate de que siempre se lance un objeto Error con un .message
            throw new Error(errorData.message);
        }
    },

    /** PUT /role/:idRole - Actualiza solo nombre/estado (NO privilegios) */
    updateRole: async (idRole, roleData) => {
        const endpoint = `${API_URL}/${idRole}`;
        try {
            console.log(`[Frontend roleService] PUT ${endpoint} with data:`, roleData);
            const response = await axiosInstance.put(endpoint, roleData);
            console.log(`[Frontend roleService] PUT ${endpoint} response status:`, response.status);
            return response.data;
        } catch (error) {
            const errorData = error.response?.data || { message: error.message || `Error desconocido al actualizar el rol ID ${idRole}.` };
            console.error(`[Frontend roleService] PUT ${endpoint} error:`, errorData);
            throw new Error(errorData.message);
        }
    },

    /** DELETE /role/:idRole */
    deleteRole: async (idRole) => {
        const endpoint = `${API_URL}/${idRole}`;
        try {
            console.log(`[Frontend roleService] DELETE ${endpoint}`);
            const response = await axiosInstance.delete(endpoint);
            console.log(`[Frontend roleService] DELETE ${endpoint} response status:`, response.status);
            // DELETE exitoso puede no tener body, o tener un mensaje
            return response.data || { message: "Rol eliminado correctamente." };
        } catch (error) {
            const errorData = error.response?.data || { message: error.message || `Error desconocido al eliminar el rol ID ${idRole}.` };
            console.error(`[Frontend roleService] DELETE ${endpoint} error:`, errorData);
            throw new Error(errorData.message);
        }
    },

    /** PATCH /role/:idRole/state - Cambia estado */
    changeRoleState: async (idRole, status) => {
        const endpoint = `${API_URL}/${idRole}/state`;
        try {
            console.log(`[Frontend roleService] PATCH ${endpoint} with status: ${status}`);
            const response = await axiosInstance.patch(endpoint, { status });
            console.log(`[Frontend roleService] PATCH ${endpoint} response status:`, response.status);
            return response.data || { message: "Estado del rol actualizado correctamente." };
        } catch (error) {
            const errorData = error.response?.data || { message: error.message || `Error desconocido al cambiar estado del rol ID ${idRole}.` };
            console.error(`[Frontend roleService] PATCH ${endpoint} error:`, errorData);
            throw new Error(errorData.message);
        }
    },

    // --- Métodos para Privilegios del Rol ---

    /** GET /role/:idRole/privileges - Obtiene asignaciones existentes (solo IDs {idPermission, idPrivilege}) */
    getRolePrivilegesByIds: async (idRole) => {
        const endpoint = `${API_URL}/${idRole}/privileges`;
        if (!idRole || (typeof idRole !== 'number' && typeof idRole !== 'string')) {
            const msg = `ID de rol inválido para obtener privilegios: ${idRole}`;
            console.error(`[Frontend roleService] GET ${endpoint} - ${msg}`);
            throw new Error(msg);
        }
        try {
            console.log(`[Frontend roleService] GET ${endpoint}`);
            const response = await axiosInstance.get(endpoint);
            console.log(`[Frontend roleService] GET ${endpoint} response status:`, response.status);
            if (!Array.isArray(response.data)) {
                console.warn(`[Frontend roleService] GET ${endpoint} - Respuesta inesperada, se esperaba un array. Data:`, response.data);
                return [];
            }
            return response.data;
        } catch (error) {
            const status = error.response?.status;
            const errorData = error.response?.data || { message: error.message || `Error desconocido al obtener privilegios del rol ID ${idRole}.` };
            if (status === 404) {
                console.warn(`[Frontend roleService] GET ${endpoint} - No se encontraron privilegios para el rol (404).`);
                return [];
            }
            console.error(`[Frontend roleService] GET ${endpoint} error:`, errorData);
            throw new Error(errorData.message);
        }
    },

    /** PUT /role/:idRole/privileges - Reemplaza TODAS las asignaciones */
    assignRolePrivileges: async (idRole, rolePrivilegesData) => {
        const endpoint = `${API_URL}/${idRole}/privileges`;
        try {
            console.log(`[Frontend roleService] PUT ${endpoint} with data:`, JSON.stringify(rolePrivilegesData, null, 2));
            const response = await axiosInstance.put(endpoint, rolePrivilegesData);
            console.log(`[Frontend roleService] PUT ${endpoint} response status:`, response.status);
            return response.data;
        } catch (error) {
            const errorData = error.response?.data || { message: error.message || `Error desconocido al asignar privilegios al rol ID ${idRole}.` };
            console.error(`[Frontend roleService] PUT ${endpoint} error:`, errorData);
            throw new Error(errorData.message);
        }
    },

    /** GET /role/:idRole/effective-permissions */
    getRoleEffectivePermissions: async (idRole) => {
        const endpoint = `${API_URL}/${idRole}/effective-permissions`;
        if (!idRole || (typeof idRole !== 'number' && typeof idRole !== 'string')) {
            const msg = `ID de rol inválido para permisos efectivos: ${idRole}`;
            console.error(`[Frontend roleService] GET ${endpoint} - ${msg}`);
            throw new Error(msg);
        }
        try {
            console.log(`[Frontend roleService] GET ${endpoint}`);
            const response = await axiosInstance.get(endpoint);
            console.log(`[Frontend roleService] GET ${endpoint} response status:`, response.status);
            return response.data;
        } catch (error) {
            const errorData = error.response?.data || { message: error.message || `Error desconocido al obtener permisos efectivos del rol ID ${idRole}.` };
            console.error(`[Frontend roleService] GET ${endpoint} error:`, errorData);
            throw new Error(errorData.message);
        }
    }
};

export default roleService;