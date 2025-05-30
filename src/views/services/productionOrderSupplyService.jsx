// src/services/productionOrderSupplyService.js
import axios from 'axios';
import { apiurl } from '../../enviroments/local'; // CORREGIDO

const POS_API_URL = `${apiurl}/production-order-supplies`; // CORREGIDO

// ... resto del código del servicio (sin cambios en la lógica interna) ...
const productionOrderSupplyService = {
    addConsumedSuppliesToOrder: async (idProductionOrder, consumedSuppliesData) => {
        try {
            const response = await axios.post(`${POS_API_URL}/production-orders/${idProductionOrder}/supplies`, consumedSuppliesData);
            return response.data;
        } catch (error) {
            console.error(`Error adding consumed supplies to order ID ${idProductionOrder}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    getConsumedSuppliesByOrderId: async (idProductionOrder) => {
        try {
            const response = await axios.get(`${POS_API_URL}/production-orders/${idProductionOrder}/supplies`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching consumed supplies for order ID ${idProductionOrder}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    getConsumedSupplyRecordById: async (idProductionOrderSupply) => {
        try {
            const response = await axios.get(`${POS_API_URL}/production-order-supplies/${idProductionOrderSupply}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching consumed supply record ID ${idProductionOrderSupply}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    updateConsumedSupplyRecord: async (idProductionOrder, idProductionOrderSupply, dataToUpdate) => {
        try {
            const response = await axios.put(`${POS_API_URL}/production-orders/${idProductionOrder}/supplies/${idProductionOrderSupply}`, dataToUpdate);
            return response.data;
        } catch (error) {
            console.error(`Error updating consumed supply record ID ${idProductionOrderSupply} for order ${idProductionOrder}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    deleteConsumedSupplyRecord: async (idProductionOrder, idProductionOrderSupply) => {
        try {
            await axios.delete(`${POS_API_URL}/production-orders/${idProductionOrder}/supplies/${idProductionOrderSupply}`);
            return { message: "Registro de consumo eliminado exitosamente." };
        } catch (error) {
            console.error(`Error deleting consumed supply record ID ${idProductionOrderSupply} for order ${idProductionOrder}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    }
};

export default productionOrderSupplyService;