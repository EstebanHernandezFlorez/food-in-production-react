import axios from 'axios';

const API_URL = 'http://localhost:3000/productsheet';

const productoFichaService = {
    createProductSheet: async (productSheetData) => {
        try {
            const response = await axios.post(API_URL, productSheetData);
            return response.data;
        } catch (error) {
            console.error("Error creating product sheet:", error);
            throw error;
        }
    },

    getAllProductSheets: async () => {
        try {
            const response = await axios.get(API_URL);
            return response.data;
        } catch (error) {
            console.error("Error fetching product sheets:", error);
            throw error;
        }
    },

    getProductSheetById: async (id) => {
        try {
            const response = await axios.get(`${API_URL}/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching product sheet with id ${id}:`, error);
            throw error;
        }
    },

    updateProductSheet: async (id, productSheetData) => {
        try {
            const response = await axios.put(`${API_URL}/${id}`, productSheetData);
            return response.data;
        } catch (error) {
            console.error(`Error updating product sheet with id ${id}:`, error);
            throw error;
        }
    },

    deleteProductSheet: async (id) => {
        try {
            await axios.delete(`${API_URL}/${id}`);
        } catch (error) {
            console.error(`Error deleting product sheet with id ${id}:`, error);
            throw error;
        }
    },

    getProductSheetsBySpecSheet: async (idSpecSheet) => {
        try {
            const response = await axios.get(`${API_URL}/spec-sheet/${idSpecSheet}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching product sheets for spec sheet ${idSpecSheet}:`, error);
            throw error;
        }
    },

    getProductSheetsBySupplier: async (idSupplier) => {
        try {
            const response = await axios.get(`${API_URL}/supplier/${idSupplier}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching product sheets for supplier ${idSupplier}:`, error);
            throw error;
        }
    }
};

export default productoFichaService;
