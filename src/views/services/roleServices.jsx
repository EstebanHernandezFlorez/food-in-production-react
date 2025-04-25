// src/services/roleService.js
import axiosInstance from './axiosConfig'; // Verifica ruta

// --- CORREGIDO: Ruta base para el API de roles ---
const API_URL = '/role'; // Cambiado de '/role' a '/roles'

const roleService = {
    /** GET /roles */
    getAllRoles: async () => {
        try {
            console.log(`[roleService] GET ${API_URL}`); // Log corregido
            const response = await axiosInstance.get(API_URL);
            console.log(`[roleService] GET ${API_URL} response:`, response.status);
            return response.data;
        } catch (error) {
            console.error(`[roleService] GET ${API_URL} error:`, error.response?.data || error.message);
            throw error;
        }
    },

    /** GET /roles/:idRole */
    getRoleById: async (idRole) => {
        try {
            console.log(`[roleService] GET ${API_URL}/${idRole}`);
            const response = await axiosInstance.get(`${API_URL}/${idRole}`);
             console.log(`[roleService] GET ${API_URL}/${idRole} response:`, response.status);
            return response.data;
        } catch (error) {
            console.error(`[roleService] GET ${API_URL}/${idRole} error:`, error.response?.data || error.message);
            throw error;
        }
    },

    /** POST /roles - Crea rol Y sus asignaciones */
    createRole: async (roleData) => {
        // roleData = { roleName, status, rolePrivileges: [{ idPermission, idPrivilege }] }
        try {
            console.log(`[roleService] POST ${API_URL} with data:`, roleData); // Log corregido
            const response = await axiosInstance.post(API_URL, roleData);
             console.log(`[roleService] POST ${API_URL} response:`, response.status);
            return response.data;
        } catch (error) {
            console.error(`[roleService] POST ${API_URL} error:`, error.response?.data || error.message);
            throw error;
        }
    },

     /** PUT /roles/:idRole - Actualiza solo nombre/estado (NO privilegios) */
     // *** AÑADIDO/CORREGIDO: Falta un método para actualizar solo el rol base ***
     updateRole: async (idRole, roleData) => {
         // roleData debe ser { roleName, status }
         const endpoint = `${API_URL}/${idRole}`;
         try {
             console.log(`[roleService] PUT ${endpoint} with data:`, roleData);
             const response = await axiosInstance.put(endpoint, roleData);
             console.log(`[roleService] PUT ${endpoint} response:`, response.status);
             // PUT usualmente devuelve 200 OK con el recurso actualizado o 204 No Content
             return response.data; // O simplemente no devolver nada si es 204
         } catch (error) {
              console.error(`[roleService] PUT ${endpoint} error:`, error.response?.data || error.message);
             throw error;
         }
     },


    /** DELETE /roles/:idRole */
    deleteRole: async (idRole) => {
        try {
            console.log(`[roleService] DELETE ${API_URL}/${idRole}`);
            const response = await axiosInstance.delete(`${API_URL}/${idRole}`);
             console.log(`[roleService] DELETE ${API_URL}/${idRole} response:`, response.status);
            // No devuelve contenido (204)
        } catch (error) {
            console.error(`[roleService] DELETE ${API_URL}/${idRole} error:`, error.response?.data || error.message);
            throw error;
        }
    },

    /** PATCH /roles/:idRole/state - Cambia estado */
    changeRoleState: async (idRole, status) => {
        // --- CORREGIDO: Endpoint según las rutas refactorizadas ---
        const endpoint = `${API_URL}/${idRole}/state`;
        try {
            console.log(`[roleService] PATCH ${endpoint} with status: ${status}`);
            const response = await axiosInstance.patch(endpoint, { status });
             console.log(`[roleService] PATCH ${endpoint} response:`, response.status);
             // No devuelve contenido (204)
        } catch (error) {
            console.error(`[roleService] PATCH ${endpoint} error:`, error.response?.data || error.message);
            throw error;
        }
    },

    // --- RolePrivileges (ahora a través de la API de Roles) ---

    /** GET /roles/:idRole/privileges - Obtiene asignaciones existentes (solo IDs) */
    getRolePrivilegesByIds: async (idRole) => {
        // --- CORREGIDO: Endpoint ---
        const endpoint = `${API_URL}/${idRole}/privileges`;
        try {
            console.log(`[roleService] GET ${endpoint}`);
            const response = await axiosInstance.get(endpoint);
            console.log(`[roleService] GET ${endpoint} response:`, response.status);
            // Devuelve array: [{idPermission, idPrivilege}, ...] según el backend refactorizado
            return response.data;
        } catch (error) {
            console.error(`[roleService] GET ${endpoint} error:`, error.response?.status, error.response?.data || error.message);
            if (error.response?.status === 404) {
                console.log(`[roleService] GET ${endpoint} returned 404, returning empty array.`);
                return []; // Correcto: rol existe pero no tiene privilegios
            }
            throw error;
        }
    },

    /** PUT /roles/:idRole/privileges - Reemplaza TODAS las asignaciones */
    assignRolePrivileges: async (idRole, rolePrivilegesData) => {
        // rolePrivilegesData es el array [{ idPermission, idPrivilege }, ...]
        // --- CORREGIDO: Endpoint ---
        const endpoint = `${API_URL}/${idRole}/privileges`;
        try {
            console.log(`[roleService] PUT ${endpoint} with data:`, rolePrivilegesData);

            // --- CORREGIDO: Payload envuelto en un objeto ---
            // El backend (validación y servicio) ahora espera un objeto
            // con una clave que contiene el array. Usamos 'rolePrivileges'
            // porque así se llama en la validación del backend.
            const payload = { rolePrivileges: rolePrivilegesData };
            console.log(`[roleService] PUT ${endpoint} sending payload:`, payload);

            const response = await axiosInstance.put(endpoint, payload ); // Enviar el objeto payload
             console.log(`[roleService] PUT ${endpoint} response:`, response.status);
            return response.data; // El backend devuelve { message: "..." }
        } catch (error) {
             console.error(`[roleService] PUT ${endpoint} error:`, error.response?.data || error.message);
            throw error;
        }
    }
};

export default roleService;