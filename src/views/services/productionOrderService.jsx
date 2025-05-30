// src/services/productionOrderService.js
import axios from 'axios';
// Asegúrate que la ruta relativa '../enviroments/local.js' sea correcta
// desde la ubicación de productionOrderService.js
import { apiurl } from '../../enviroments/local.js'; // Cambia la ruta según tu estructura de carpetas

// Ahora usas 'apiurl' que importaste
const PRODUCTION_ORDER_API_URL = `${apiurl}/production-orders`;

const productionOrderService = {
    getAllProductionOrders: async (params = {}) => {
        try {
            const response = await axios.get(PRODUCTION_ORDER_API_URL, { params });
            return response.data;
        } catch (error) {
            console.error("Error fetching production orders:", error.response?.data || error.message);
            throw error.response?.data || error;
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

    updateProductionOrderGeneral: async (idOrder, orderData) => {
        try {
            const response = await axios.put(`${PRODUCTION_ORDER_API_URL}/${idOrder}`, orderData);
            return response.data;
        } catch (error) {
            console.error(`Error updating general info for production order ID ${idOrder}:`, error.response?.data || error.message);
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

    changeProductionOrderStatus: async (idOrder, newStatus) => {
        try {
            const response = await axios.patch(`${PRODUCTION_ORDER_API_URL}/${idOrder}/status`, { status: newStatus });
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
    }
};

export default productionOrderService;