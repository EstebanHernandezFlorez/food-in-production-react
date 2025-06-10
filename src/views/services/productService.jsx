import axiosInstance from './axiosConfig'; // <- CAMBIO 1: Importar la instancia central

const API_ENDPOINT = '/product'; // <- CAMBIO 2: Definir solo el endpoint relativo

const productService = {
    getAllProducts: async (params = {}) => {
        try {
            // CAMBIO 3: Usar axiosInstance y el endpoint
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

    changeProductStatus: async (idProduct, status) => {
        try {
            const response = await axiosInstance.patch(`${API_ENDPOINT}/${idProduct}/status`, { status });
            return response.data;
        } catch (error) {
            console.error(`Error changing status for product ID ${idProduct}:`, error.response?.data || error.message);
            throw error.response?.data || error;
        }
    }
};

export default productService;