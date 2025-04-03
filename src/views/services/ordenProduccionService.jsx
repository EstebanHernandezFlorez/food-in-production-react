import axios from 'axios';

const API_URL = 'http://localhost:3000/productionOrder';

const productionOrderService = {
    getAllOrders: async () => {
        try {
            const response = await axios.get(API_URL);
            return response.data;
        } catch (error) {
            console.error("Error fetching production orders:", error);
            throw error;
        }
    },

    createOrder: async (orderData) => {
        try {
            const response = await axios.post(API_URL, orderData);
            return response.data;
        } catch (error) {
            console.error("Error creating production order:", error);
            throw error;
        }
    },

    getOrderById: async (idOrder) => {
        try {
            const response = await axios.get(`${API_URL}/${idOrder}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching production order with id ${idOrder}:`, error);
            throw error;
        }
    },

    updateOrder: async (idOrder, orderData) => {
        try {
            const response = await axios.put(`${API_URL}/${idOrder}`, orderData);
            return response.data;
        } catch (error) {
            console.error(`Error updating production order with id ${idOrder}:`, error);
            throw error;
        }
    },

    deleteOrder: async (idOrder) => {
        try {
            await axios.delete(`${API_URL}/${idOrder}`);
        } catch (error) {
            console.error(`Error deleting production order with id ${idOrder}:`, error);
            throw error;
        }
    },

    changeOrderState: async (idOrder, status) => {
        try {
            const response = await axios.patch(`${API_URL}/${idOrder}`, { status });
            return response.data;
        } catch (error) {
            console.error(`Error changing status of production order with id ${idOrder}:`, error);
            throw error;
        }
    }
};

export default productionOrderService;
