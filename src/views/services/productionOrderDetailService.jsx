// src/services/productionOrderDetailService.js
import axios from 'axios';
import { apiurl } from '../../enviroments/local.js'; // Ruta a tu archivo de configuración de URL base

// El backend fue montado con app.use("/production-order-details", productionOrderDetailRoutes);
// Las rutas internas de productionOrderDetailRoutes.js son relativas a este punto de montaje,
// pero algunas de ellas ya contienen /production-orders/...
// por lo que se formarán URLs como /production-order-details/production-orders/...
const PRODUCTION_ORDER_DETAILS_BASE_URL = `${apiurl}/production-order-details`;

const productionOrderDetailService = {
    /**
     * Añade un nuevo paso (detalle) a una orden de producción existente.
     * @param {string|number} idProductionOrder - El ID de la orden de producción.
     * @param {object} stepData - Datos del paso a crear (ej. { idProcess, processOrder, processNameSnapshot, ... }).
     * @returns {Promise<object>} El paso creado.
     */
    addStepToOrder: async (idProductionOrder, stepData) => {
        try {
            // Ruta del backend: POST /production-order-details/production-orders/:idProductionOrder/steps
            // Esta ruta es larga debido a cómo se montó en app.js.
            // Si refactorizaras el backend, podría ser directamente POST /production-orders/:idProductionOrder/steps
            // y este servicio llamaría a `${apiurl}/production-orders/${idProductionOrder}/steps`.
            // Pero con el montaje actual en app.js, la URL completa es necesaria aquí.
            const response = await axios.post(`${PRODUCTION_ORDER_DETAILS_BASE_URL}/production-orders/${idProductionOrder}/steps`, stepData);
            return response.data;
        } catch (error) {
            console.error(`Error adding step to order ID ${idProductionOrder}:`, error.response?.data || error.message);
            throw error.response?.data || error; // Propagar el error para manejo en el componente
        }
    },

    /**
     * Obtiene todos los pasos (detalles) de una orden de producción específica.
     * @param {string|number} idProductionOrder - El ID de la orden de producción.
     * @returns {Promise<Array<object>>} Un array con los pasos de la orden.
     */
    getStepsByOrderId: async (idProductionOrder) => {
        try {
            // Ruta del backend: GET /production-order-details/production-orders/:idProductionOrder/steps
            const response = await axios.get(`${PRODUCTION_ORDER_DETAILS_BASE_URL}/production-orders/${idProductionOrder}/steps`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching steps for order ID ${idProductionOrder}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    /**
     * Obtiene un paso (detalle) específico de una orden de producción por su ID de detalle.
     * @param {string|number} idProductionOrderDetail - El ID del detalle de la orden de producción (PK de ProductionOrderDetail).
     * @returns {Promise<object>} El objeto del paso.
     */
    getStepById: async (idProductionOrderDetail) => {
        try {
            // Ruta del backend: GET /production-order-details/:idProductionOrderDetail
            const response = await axios.get(`${PRODUCTION_ORDER_DETAILS_BASE_URL}/${idProductionOrderDetail}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching production order detail ID ${idProductionOrderDetail}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    /**
     * Elimina un paso (detalle) específico de una orden de producción.
     * NOTA: La ACTUALIZACIÓN de un paso (asignar empleado, cambiar estado, fechas)
     * se maneja a través de productionOrderService.updateProductionOrderStep.
     * Este método es para eliminar el registro del paso por completo.
     * @param {string|number} idProductionOrderDetail - El ID del detalle de la orden de producción a eliminar.
     * @returns {Promise<object>} Un objeto con un mensaje de éxito.
     */
    deleteStep: async (idProductionOrderDetail) => {
        try {
            // Ruta del backend: DELETE /production-order-details/:idProductionOrderDetail
            // Opcionalmente, si la ruta del backend requiere el ID de la orden:
            // DELETE /production-order-details/production-orders/:idProductionOrder/steps/:idProductionOrderDetail
            // En ese caso, necesitarías pasar idProductionOrder a esta función también.
            await axios.delete(`${PRODUCTION_ORDER_DETAILS_BASE_URL}/${idProductionOrderDetail}`);
            return { message: "Paso de orden de producción eliminado exitosamente." };
        } catch (error) {
            console.error(`Error deleting production order detail ID ${idProductionOrderDetail}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    // --- Rutas de Reporte o Vistas Específicas ---

    /**
     * Obtiene todos los pasos (detalles) asignados a un empleado específico.
     * @param {string|number} idEmployee - El ID del empleado.
     * @returns {Promise<Array<object>>} Un array con los pasos asignados al empleado.
     */
    getStepsByEmployeeId: async (idEmployee) => {
        try {
            // Ruta del backend: GET /production-order-details/employee/:idEmployee
            const response = await axios.get(`${PRODUCTION_ORDER_DETAILS_BASE_URL}/employee/${idEmployee}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching steps for employee ID ${idEmployee}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    /**
     * Obtiene todos los pasos (detalles) que están actualmente activos en el sistema.
     * (La definición de "activo" la determina el backend, ej. status 'IN_PROGRESS').
     * @returns {Promise<Array<object>>} Un array con todos los pasos activos.
     */
    getActiveStepsOverall: async () => {
        try {
            // Ruta del backend: GET /production-order-details/status/active
            const response = await axios.get(`${PRODUCTION_ORDER_DETAILS_BASE_URL}/status/active`);
            return response.data;
        } catch (error) {
            console.error("Error fetching all active production order steps:", error.response?.data || error.message);
            throw error.response?.data || error;
        }
    }
};

export default productionOrderDetailService;