// RUTA: src/services/productionOrderService.js
import axios from 'axios';
import { apiurl } from '../../enviroments/local.js';

const PRODUCTION_ORDER_API_URL = `${apiurl}/production-orders`;

const productionOrderService = {
    getAllProductionOrders: async (params = {}) => {
        try {
            const response = await axios.get(PRODUCTION_ORDER_API_URL, { params });

            // <<<--- CORRECCIÓN PRINCIPAL: Manejar la estructura de paginación de Sequelize { count, rows } --- >>>
            // Esta es la primera y más probable estructura que encontraremos.
            if (response.data && Array.isArray(response.data.rows)) {
                return response.data.rows; // Devolvemos el array que está dentro de la propiedad 'rows'.
            }

            // Fallback 1: Manejar una estructura { data: [...] } si alguna otra ruta la usa.
            if (response.data && Array.isArray(response.data.data)) {
                return response.data.data;
            }

            // Fallback 2: Manejar una respuesta que es directamente un array.
            if (Array.isArray(response.data)) {
                return response.data;
            }

            // Si ninguna de las estructuras conocidas coincide, advertimos y devolvemos un array vacío.
            console.warn("La respuesta de getAllProductionOrders no tiene un formato de array esperado ({rows: []} o {data: []}). Se devuelve un array vacío.", response.data);
            return [];
        } catch (error) {
            console.error("Error fetching production orders:", error.response?.data || error.message);
            // En caso de error, también devolvemos un array vacío para proteger el componente.
            return [];
        }
    },

    createProductionOrder: async (orderData) => {
        try {
            const response = await axios.post(PRODUCTION_ORDER_API_URL, orderData);
            return response.data;
        } catch (error) {
            console.error("Error creating production order:", error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    getProductionOrderById: async (idOrder) => {
        try {
            const response = await axios.get(`${PRODUCTION_ORDER_API_URL}/${idOrder}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching production order ID ${idOrder}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    updateProductionOrder: async (idOrder, orderData) => {
        try {
            const response = await axios.put(`${PRODUCTION_ORDER_API_URL}/${idOrder}`, orderData);
            return response.data;
        } catch (error) {
            console.error(`Error updating production order ID ${idOrder}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    updateProductionOrderStep: async (idOrder, idStep, stepData) => {
        try {
            const response = await axios.patch(`${PRODUCTION_ORDER_API_URL}/${idOrder}/steps/${idStep}`, stepData);
            return response.data;
        } catch (error) {
            console.error(`Error updating step ID ${idStep} for order ID ${idOrder}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    deleteProductionOrder: async (idOrder) => {
        try {
            await axios.delete(`${PRODUCTION_ORDER_API_URL}/${idOrder}`);
            return { message: "Orden de producción eliminada exitosamente." };
        } catch (error) {
            console.error(`Error deleting production order ID ${idOrder}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },
    
    changeProductionOrderStatus: async (idOrder, status, observations) => {
        try {
            const payload = { status, observations };
            const response = await axios.patch(`${PRODUCTION_ORDER_API_URL}/${idOrder}/status`, payload);
            return response.data;
        } catch (error) {
            console.error(`Error changing status for production order ID ${idOrder}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    finalizeProductionOrder: async (idOrder, finalizeData) => {
        try {
            const response = await axios.post(`${PRODUCTION_ORDER_API_URL}/${idOrder}/finalize`, finalizeData);
            return response.data;
        } catch (error) {
            console.error(`Error finalizing production order ID ${idOrder}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    checkActiveOrderForProduct: async (productId) => {
        try {
            const response = await axios.get(`${PRODUCTION_ORDER_API_URL}/check-active/${productId}`);
            return response.data; 
        } catch (error) {
            console.error(`Error checking active order for product ${productId}:`, error);
            return { hasActiveOrder: false }; 
        }
    },
};

export default productionOrderService;