import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

const productoInsumoService = {
    // Obtener todos los productos
    getAllProducts: async () => {
        try {
            const response = await axios.get(`${BASE_URL}/product`);
            return response.data;
        } catch (error) {
            console.error('Error al obtener productos:', error);
            throw error;
        }
    },
    
   
    // Crear un nuevo producto
    createProduct: async (productData) => {
        try {
            const response = await axios.post(`${BASE_URL}/product`, productData);
            return response.data;
        } catch (error) {
            console.error('Error al crear producto:', error);
            throw error;
        }
    },

    // Actualizar un producto
    updateProduct: async (idProduct, productData) => {
        try {
            const response = await axios.put(`${BASE_URL}/product/${idProduct}`, productData);
            return response.data;
        } catch (error) {
            console.error('Error al actualizar producto:', error);
            throw error;
        }
    },

    // Eliminar un producto
    deleteProduct: async (idProduct) => {
        try {
            const response = await axios.delete(`${BASE_URL}/product/${idProduct}`);
            return response.data;
        } catch (error) {
            console.error('Error al eliminar producto:', error);
            throw error;
        }
    },

    // Cambiar el estado de un producto
    changeStateProduct: async (idProduct, status) => {
        try {
            const response = await axios.patch(`${BASE_URL}/product/${idProduct}`, { status });
            return response.data;
        } catch (error) {
            console.error('Error al actualizar estado del producto:', error);
            throw error;
        }
    }
};

export default productoInsumoService;