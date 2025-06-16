// src/services/roleService.js (FRONTEND)
import axiosInstance from './axiosConfig'; // Tu instancia de Axios

// La ruta base para el API de roles en el backend es '/roles' según tu roleRoutes.js
const API_BASE_URL = '/role';

const roleService = {
    /** GET /roles */
    getAllRoles: async () => {
        const endpoint = API_BASE_URL;
        try {
            console.log(`[Frontend roleService] GET ${endpoint}`);
            const response = await axiosInstance.get(endpoint);
            console.log(`[Frontend roleService] GET ${endpoint} response status:`, response.status);
            return response.data;
        } catch (error) {
            const errorData = error.response?.data || { message: error.message || "Error desconocido al obtener roles." };
            console.error(`[Frontend roleService] GET ${endpoint} error:`, errorData);
            throw new Error(errorData.message);
        }
    },

    /** GET /roles/:idRole */
    getRoleById: async (idRole) => {
        const endpoint = `${API_BASE_URL}/${idRole}`;
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

    /** POST /roles - Crea rol Y sus asignaciones */
    createRole: async (roleData) => {
        const endpoint = API_BASE_URL;
        try {
            console.log(`[Frontend roleService] POST ${endpoint} con datos:`, JSON.stringify(roleData, null, 2));
            const response = await axiosInstance.post(endpoint, roleData);
            console.log(`[Frontend roleService] POST ${endpoint} response status:`, response.status, "Data:", response.data);
            return response.data;
        } catch (error) {
            const errorData = error.response?.data || { message: error.message || "Error desconocido al crear el rol." };
            console.error(`[Frontend roleService] POST ${endpoint} error:`, errorData);
            throw new Error(errorData.message);
        }
    },

    /** PUT /roles/:idRole - Actualiza solo nombre/estado (NO privilegios) */
    updateRole: async (idRole, roleData) => {
        const endpoint = `${API_BASE_URL}/${idRole}`;
        try {
            console.log(`[Frontend roleService] PUT ${endpoint} con datos:`, roleData);
            const response = await axiosInstance.put(endpoint, roleData);
            console.log(`[Frontend roleService] PUT ${endpoint} response status:`, response.status);
            return response.data;
        } catch (error) {
            const errorData = error.response?.data || { message: error.message || `Error desconocido al actualizar el rol ID ${idRole}.` };
            console.error(`[Frontend roleService] PUT ${endpoint} error:`, errorData);
            throw new Error(errorData.message);
        }
    },

    /** DELETE /roles/:idRole */
    deleteRole: async (idRole) => {
        const endpoint = `${API_BASE_URL}/${idRole}`;
        try {
            console.log(`[Frontend roleService] DELETE ${endpoint}`);
            const response = await axiosInstance.delete(endpoint);
            console.log(`[Frontend roleService] DELETE ${endpoint} response status:`, response.status);
            return response.data || { message: "Rol eliminado correctamente." };
        } catch (error) {
            const errorData = error.response?.data || { message: error.message || `Error desconocido al eliminar el rol ID ${idRole}.` };
            console.error(`[Frontend roleService] DELETE ${endpoint} error:`, errorData);
            throw new Error(errorData.message);
        }
    },

    /** PATCH /roles/:idRole/state - Cambia estado */
    changeRoleState: async (idRole, status) => {
        const endpoint = `${API_BASE_URL}/${idRole}/state`; // Esta ruta parece correcta según tu backend
        try {
            console.log(`[Frontend roleService] PATCH ${endpoint} con status: ${status}`);
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

    /** GET /roles/:idRole/privileges - Obtiene asignaciones existentes (formato para FormPermissions.jsx) */
    getRolePrivilegeAssignments: async (idRole) => { // Cambié el nombre para mayor claridad
        const endpoint = `${API_BASE_URL}/${idRole}/privileges`; // Esta ruta parece correcta
        if (!idRole || (typeof idRole !== 'number' && typeof idRole !== 'string')) {
            const msg = `ID de rol inválido para obtener asignaciones de privilegios: ${idRole}`;
            console.error(`[Frontend roleService] GET ${endpoint} - ${msg}`);
            throw new Error(msg);
        }
        try {
            console.log(`[Frontend roleService] GET ${endpoint}`);
            const response = await axiosInstance.get(endpoint);
            console.log(`[Frontend roleService] GET ${endpoint} response status:`, response.status);
            if (!Array.isArray(response.data)) {
                console.warn(`[Frontend roleService] GET ${endpoint} - Respuesta inesperada, se esperaba un array. Data:`, response.data);
                return []; // Devolver array vacío si no es el formato esperado
            }
            return response.data;
        } catch (error) {
            const status = error.response?.status;
            const errorData = error.response?.data || { message: error.message || `Error desconocido al obtener asignaciones de privilegios del rol ID ${idRole}.` };
            if (status === 404) {
                console.warn(`[Frontend roleService] GET ${endpoint} - No se encontraron asignaciones para el rol (404).`);
                return []; // Es válido que un rol no tenga asignaciones
            }
            console.error(`[Frontend roleService] GET ${endpoint} error:`, errorData);
            throw new Error(errorData.message);
        }
    },

    /** PUT /roles/:idRole/privileges - Reemplaza TODAS las asignaciones */
    assignRolePrivileges: async (idRole, privilegeAssignmentsData) => { // Cambié el nombre del segundo parámetro
        const endpoint = `${API_BASE_URL}/${idRole}/privileges`; // Esta ruta parece correcta
        try {
            console.log(`[Frontend roleService] PUT ${endpoint} con datos:`, JSON.stringify(privilegeAssignmentsData, null, 2));
            const response = await axiosInstance.put(endpoint, privilegeAssignmentsData);
            console.log(`[Frontend roleService] PUT ${endpoint} response status:`, response.status);
            return response.data;
        } catch (error) {
            const errorData = error.response?.data || { message: error.message || `Error desconocido al asignar privilegios al rol ID ${idRole}.` };
            console.error(`[Frontend roleService] PUT ${endpoint} error:`, errorData);
            throw new Error(errorData.message);
        }
    },

    /** GET /roles/:idRole/effective-permissions - Obtiene permisos en formato para AuthProvider */
    getRoleEffectivePermissions: async (idRole) => {
        const endpoint = `${API_BASE_URL}/${idRole}/effective-permissions`; // Esta ruta es la clave y parece correcta
        if (!idRole || (typeof idRole !== 'number' && typeof idRole !== 'string')) {
            const msg = `ID de rol inválido para permisos efectivos: ${idRole}`;
            console.error(`[Frontend roleService] GET ${endpoint} - ${msg}`);
            throw new Error(msg);
        }
        try {
            console.log(`[Frontend roleService] GET ${endpoint}`);
            const response = await axiosInstance.get(endpoint);
            console.log(`[Frontend roleService] GET ${endpoint} response status: ${response.status}, data:`, JSON.stringify(response.data));
            return response.data; // Esto DEBERÍA ser {"permissionKey": ["privilegeKey", ...]}
        } catch (error) {
            const errorData = error.response?.data || { message: error.message || `Error desconocido al obtener permisos efectivos del rol ID ${idRole}.` };
            console.error(`[Frontend roleService] GET ${endpoint} error:`, errorData);
            // Podrías querer devolver un objeto vacío o algo específico si es un 404
            // para que AuthProvider no falle completamente si un rol legítimamente no tiene permisos.
            if (error.response?.status === 404) {
                console.warn(`[Frontend roleService] GET ${endpoint} - No se encontraron permisos efectivos para el rol (404), devolviendo objeto vacío.`);
                return {};
            }
            throw new Error(errorData.message);
        }
    }
};

export default roleService;