import axios from 'axios';

const API_URL = 'http://localhost:3000/product';

const productService = {
    // Obtener todos los productos
    getAllProducts: async () => {
        const response = await axios.get(`${API_URL}`);
        return response.data;
    },

    // Crear un nuevo producto
    createProduct: async (productData) => {
        const response = await axios.post(`${API_URL}`, productData);
        return response.data;
    },

    // Actualizar un producto existente
    updateProduct: async (id, productData) => {
        const response = await axios.put(`${API_URL}/${id}`, productData);
        return response.data;
    },

    // Eliminar un producto
    deleteProduct: async (id) => {
        const response = await axios.delete(`${API_URL}/${id}`);
        return response.data;
    },

    // Cambiar el estado de un producto
    changeStateProduct: async (id, status) => {
        const response = await axios.patch(`${API_URL}/${id}`, { status });
        return response.data;
    },

    // Obtener producto con detalles
    getProductWithDetails: async (idProduct) => {
        try {
            // 1. Obtener la información del producto
            const productResponse = await axios.get(`${API_URL}/${idProduct}`);
            const product = productResponse.data;

            // 2. Obtener la ficha técnica (SpecSheet) asociada al producto
            const specSheetResponse = await axios.get(`${API_URL}/specsheet/product/${idProduct}`);
            const specSheet = specSheetResponse.data;

            // 3. Obtener los detalles del proceso asociados a la ficha técnica
            const processDetailsResponse = await axios.get(`${API_URL}/processdetail/specsheet/${specSheet.idSpecsheet}`);
            const processDetails = processDetailsResponse.data;

            // 4. Obtener la información del insumo (proveedor) (usando ProductSheet)
            let insumo = null;
            if (specSheet && specSheet.idSpecsheet) { // Verifica que exista specSheet
                const productSheetResponse = await axios.get(`${API_URL}/productsheet/specsheet/${specSheet.idSpecsheet}`);  // Necesitamos un endpoint en el backend
                const productSheet = productSheetResponse.data;

                if (productSheet && productSheet.idSupplier) {
                    const insumoResponse = await axios.get(`${API_URL}/supplier/${productSheet.idSupplier}`);  // Necesitamos un endpoint en el backend
                    insumo = insumoResponse.data;
                }
            }

            // 5. Combinar la información
            const productWithDetails = {
                ...product,
                specSheet: specSheet,
                processDetails: processDetails,
                insumo: insumo // Agregar el insumo (proveedor) al objeto
            };

            return productWithDetails;

        } catch (error) {
            console.error(`Error fetching details for product with id ${idProduct}:`, error);
            throw error;
        }
    },
};

export default productService;