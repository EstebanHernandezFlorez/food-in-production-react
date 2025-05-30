// src/services/productService.js
import axios from 'axios';
import { apiurl } from '../../enviroments/local'; // CORREGIDO

const PRODUCT_API_URL = `${apiurl}/product`; // CORREGIDO

// ... resto del código del servicio (sin cambios en la lógica interna) ...
const productService = {
    getAllProducts: async (params = {}) => {
        try {
            const response = await axios.get(PRODUCT_API_URL, { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching products:', error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    getProductById: async (idProduct) => {
        try {
            const response = await axios.get(`${PRODUCT_API_URL}/${idProduct}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching product ID ${idProduct}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    createProduct: async (productData) => {
        try {
            const response = await axios.post(PRODUCT_API_URL, productData);
            return response.data;
        } catch (error) {
            console.error('Error creating product:', error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    updateProduct: async (idProduct, productData) => {
        try {
            const response = await axios.put(`${PRODUCT_API_URL}/${idProduct}`, productData);
            return response.data;
        } catch (error) {
            console.error(`Error updating product ID ${idProduct}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    deleteProduct: async (idProduct) => {
        try {
            const response = await axios.delete(`${PRODUCT_API_URL}/${idProduct}`);
            return response.data;
        } catch (error) {
            console.error(`Error deleting product ID ${idProduct}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    changeProductStatus: async (idProduct, status) => {
        try {
            const response = await axios.patch(`${PRODUCT_API_URL}/${idProduct}/status`, { status });
            return response.data;
        } catch (error) {
            console.error(`Error changing status for product ID ${idProduct}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    }
};

export default productService;