// services/productService.js
// --- VERSIÓN COMPLETA Y FINAL ---

import axiosInstance from './axiosConfig';

const API_ENDPOINT = '/product';

const productService = {
    getAllProducts: async (params = {}) => {
        try {
            const response = await axiosInstance.get(API_ENDPOINT, { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching products:', error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    getProductById: async (idProduct) => {
        try {
            const response = await axiosInstance.get(`${API_ENDPOINT}/${idProduct}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching product ID ${idProduct}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    createProduct: async (productData) => {
        try {
            const response = await axiosInstance.post(API_ENDPOINT, productData);
            return response.data;
        } catch (error) {
            console.error('Error creating product:', error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    updateProduct: async (idProduct, productData) => {
        try {
            const response = await axiosInstance.put(`${API_ENDPOINT}/${idProduct}`, productData);
            return response.data;
        } catch (error) {
            console.error(`Error updating product ID ${idProduct}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    deleteProduct: async (idProduct) => {
        try {
            const response = await axiosInstance.delete(`${API_ENDPOINT}/${idProduct}`);
            return response.data;
        } catch (error) {
            console.error(`Error deleting product ID ${idProduct}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    adjustStock: async (idProduct, data) => {
        try {
            const response = await axiosInstance.post(`${API_ENDPOINT}/${idProduct}/adjust-stock`, data);
            return response.data;
        } catch (error) {
            console.error(`Error adjusting supply stock for product ID ${idProduct}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },
    
    // --- NUEVA FUNCIÓN PARA AJUSTAR STOCK DE VENTA ---
    adjustStockBySale: async (idProduct, data) => {
        try {
            const response = await axiosInstance.post(`${API_ENDPOINT}/${idProduct}/adjust-sale-stock`, data);
            return response.data;
        } catch (error) {
            console.error(`Error adjusting sale stock for product ID ${idProduct}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    // Ajustar stock producido (cuando finaliza una orden de producción)
    adjustProducedStock: async (idProduct, data) => {
        try {
            const response = await axiosInstance.post(`${API_ENDPOINT}/${idProduct}/adjust-produced-stock`, data);
            return response.data;
        } catch (error) {
            console.error(`Error adjusting produced stock for product ID ${idProduct}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    // Corregido: El nombre de la función para coincidir con el componente
    changeStateProduct: async (idProduct, newStatus) => {
        try {
            const response = await axiosInstance.patch(`${API_ENDPOINT}/${idProduct}/status`, { status: newStatus });
            return response.data;
        } catch (error) {
            console.error(`Error changing status for product ID ${idProduct}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    }
};

export default productService;