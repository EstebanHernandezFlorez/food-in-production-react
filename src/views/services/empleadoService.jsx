// src/services/empleadoService.js
// Servicio para manejar todas las peticiones a la API relacionadas con empleados

import axios from 'axios';

// URL base para los endpoints de empleados
const API_URL = 'http://localhost:3000/employee';

/**
 * Servicio con métodos para interactuar con la API de empleados.
 */
const empleadoService = {
    /**
     * Obtiene todos los empleados desde la API.
     * @returns {Promise<Array>} Promesa que resuelve a un array de objetos empleado.
     * @throws {Error} Si la petición API falla.
     */
    getAllEmpleados: async () => {
        try {
            console.log(`[Service] GET ${API_URL}`);
            const response = await axios.get(API_URL);
            return response.data;
        } catch (error) {
            console.error("[Service Error] Fetching all employees failed:", error.response?.data || error.message);
            throw error; // Re-lanzar para manejo a nivel de componente
        }
    },

    /**
     * Crea un nuevo empleado.
     * @param {object} empleadoData - Los datos para el nuevo empleado.
     * @returns {Promise<object>} Promesa que resuelve al objeto del empleado creado.
     * @throws {Error} Si la petición API falla.
     */
    createEmpleado: async (empleadoData) => {
        try {
            console.log(`[Service] POST ${API_URL} with data:`, empleadoData);
            const response = await axios.post(API_URL, empleadoData);
            return response.data;
        } catch (error) {
            console.error("[Service Error] Creating employee failed:", error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Obtiene un solo empleado por su ID.
     * @param {string|number} idEmployee - El ID del empleado a obtener.
     * @returns {Promise<object>} Promesa que resuelve al objeto empleado.
     * @throws {Error} Si la petición API falla o el empleado no se encuentra.
     */
    getEmpleadoById: async (idEmployee) => {
        const url = `${API_URL}/${idEmployee}`;
        try {
            console.log(`[Service] GET ${url}`);
            const response = await axios.get(url);
            return response.data;
        } catch (error) {
            console.error(`[Service Error] Fetching employee ID ${idEmployee} failed:`, error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Actualiza un empleado existente.
     * @param {string|number} idEmployee - El ID del empleado a actualizar.
     * @param {object} empleadoData - Objeto con los campos a actualizar.
     * @returns {Promise<object>} Promesa que resuelve al objeto empleado actualizado.
     * @throws {Error} Si la petición API falla.
     */
    updateEmpleado: async (idEmployee, empleadoData) => {
        const url = `${API_URL}/${idEmployee}`;
        try {
            console.log(`[Service] PUT ${url} with data:`, empleadoData);
            const response = await axios.put(url, empleadoData);
            return response.data;
        } catch (error) {
            console.error(`[Service Error] Updating employee ID ${idEmployee} failed:`, error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Elimina un empleado por su ID.
     * @param {string|number} idEmployee - El ID del empleado a eliminar.
     * @returns {Promise<void>} Promesa que se resuelve cuando la eliminación es exitosa.
     * @throws {Error} Si la petición API falla.
     */
    deleteEmpleado: async (idEmployee) => {
        const url = `${API_URL}/${idEmployee}`;
        try {
            console.log(`[Service] DELETE ${url}`);
            await axios.delete(url);
            // No se necesita valor de retorno para una eliminación exitosa
        } catch (error) {
            console.error(`[Service Error] Deleting employee ID ${idEmployee} failed:`, error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Cambia el estado (activo/inactivo) de un empleado.
     * @param {string|number} idEmployee - El ID del empleado a actualizar.
     * @param {boolean} status - El nuevo valor de estado (true para activo, false para inactivo).
     * @returns {Promise<object>} Promesa que resuelve al objeto empleado actualizado (o respuesta relevante de la API).
     * @throws {Error} Si la petición API falla.
     */
    changeStateEmpleado: async (idEmployee, status) => {
        const url = `${API_URL}/${idEmployee}`;
        try {
            console.log(`[Service] PATCH ${url} with status:`, { status });
            // PATCH es común para actualizaciones parciales como cambio de estado
            const response = await axios.patch(url, { status });
            return response.data;
        } catch (error) {
            console.error(`[Service Error] Changing status for employee ID ${idEmployee} failed:`, error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Verifica si un empleado está asociado con alguna entidad crítica (como ventas, proyectos, etc.)
     * Nota: Necesitarías implementar el endpoint backend correspondiente para esto.
     * @param {string|number} idEmployee - El ID del empleado a verificar.
     * @returns {Promise<boolean>} True si está asociado, false en caso contrario.
     * @throws {Error} Si la verificación falla.
     */
    isEmployeeAssociated: async (idEmployee) => {
        // Ajusta esta URL para que coincida con tu endpoint real en el backend
        const checkUrl = `${API_URL}/${idEmployee}/is-associated`;
        console.log(`[Service] GET ${checkUrl} (Checking association)`);

        try {
            // Asume que el backend devuelve algo como { isAssociated: true/false }
            const response = await axios.get(checkUrl);

            // Adapta según la estructura de respuesta de tu API
            if (response.data && typeof response.data.isAssociated === 'boolean') {
                console.log(`[Service] Association check result for ID ${idEmployee}:`, response.data.isAssociated);
                return response.data.isAssociated;
            } else {
                console.warn(`[Service Warn] Unexpected association check response format for ID ${idEmployee}:`, response.data);
                // Devuelve false asumiendo que no está asociado si el formato es incorrecto
                return false;
            }
        } catch (error) {
            // Maneja errores específicos si es necesario (ej., 404 podría significar "no encontrado" -> no asociado)
            if (error.response && error.response.status === 404) {
                console.log(`[Service] Association check for ID ${idEmployee}: Resource not found (assuming not associated).`);
                return false; // Trata un 404 como no asociado
            }

            console.error(`[Service Error] Checking employee association failed for ID ${idEmployee}:`, error.response?.data || error.message);
            throw new Error("Association check failed");
        }
    }
};

export default empleadoService;