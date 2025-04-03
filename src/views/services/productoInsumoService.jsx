import axios from 'axios';

const API_URL = 'http://localhost:3000/product';

const productService = {
    getAllProducts: async () => {
        try {
            const response = await axios.get(API_URL);
            return response.data;
        } catch (error) {
            console.error("Error fetching products:", error);
            throw error;
        }
    },

    getProductById: async (idProduct) => {
        try {
            const response = await axios.get(`${API_URL}/${idProduct}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching product with id ${idProduct}:`, error);
            throw error;
        }
    },

    createProduct: async (productData) => {
        try {
            const response = await axios.post(API_URL, productData);
            return response.data;
        } catch (error) {
            console.error("Error creating product:", error);
            throw error;
        }
    },

    updateProduct: async (idProduct, productData) => {
        try {
            const response = await axios.put(`${API_URL}/${idProduct}`, productData);
            return response.data;
        } catch (error) {
            console.error(`Error updating product with id ${idProduct}:`, error);
            throw error;
        }
    },

    deleteProduct: async (idProduct) => {
        try {
            await axios.delete(`${API_URL}/${idProduct}`);
        } catch (error) {
            console.error(`Error deleting product with id ${idProduct}:`, error);
            throw error;
        }
    },

    changeStateProduct: async (idProduct, status) => {
        try {
            const response = await axios.patch(`${API_URL}/${idProduct}`, { status });
            return response.data;
        } catch (error) {
            console.error(`Error changing status of product with id ${idProduct}:`, error);
            throw error;
        }
    },

    getProductsBySupplier: async (idSupplier) => {
        try {
            const response = await axios.get(`${API_URL}/supplier/${idSupplier}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching products for supplier with id ${idSupplier}:`, error);
            throw error;
        }
    }
};

export default productService;
