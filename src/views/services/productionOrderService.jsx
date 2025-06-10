import axiosInstance from './axiosConfig'; // <- CAMBIO 1

const API_ENDPOINT = '/production-orders'; // <- CAMBIO 2

const productionOrderService = {
  getAllProductionOrders: async (params = {}) => {
    try {
      const response = await axiosInstance.get(API_ENDPOINT, { params }); // <- CAMBIO 3
      // ... el resto de la lógica de paginación se mantiene igual
      if (response.data && Array.isArray(response.data.rows)) {
        return response.data.rows;
      }
      if (response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      if (Array.isArray(response.data)) {
        return response.data;
      }
      console.warn("La respuesta de getAllProductionOrders no tiene un formato de array esperado. Se devuelve array vacío.", response.data);
      return [];
    } catch (error) {
      console.error("Error fetching production orders:", error.response?.data || error.message);
      return [];
    }
  },
  
  // Aplicar el mismo patrón al resto de las funciones...
  createProductionOrder: async (orderData) => {
    try {
      const response = await axiosInstance.post(API_ENDPOINT, orderData);
      return response.data;
    } catch (error) {
      console.error("Error creating production order:", error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  getProductionOrderById: async (idOrder) => {
    try {
      const response = await axiosInstance.get(`${API_ENDPOINT}/${idOrder}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching production order ID ${idOrder}:`, error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  updateProductionOrder: async (idOrder, orderData) => {
    try {
      const response = await axiosInstance.put(`${API_ENDPOINT}/${idOrder}`, orderData);
      return response.data;
    } catch (error) {
      console.error(`Error updating production order ID ${idOrder}:`, error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  updateProductionOrderStep: async (idOrder, idStep, stepData) => {
    try {
      const response = await axiosInstance.patch(`${API_ENDPOINT}/${idOrder}/steps/${idStep}`, stepData);
      return response.data;
    } catch (error) {
      console.error(`Error updating step ID ${idStep} for order ID ${idOrder}:`, error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  deleteProductionOrder: async (idOrder) => {
    try {
      await axiosInstance.delete(`${API_ENDPOINT}/${idOrder}`);
      return { message: "Orden de producción eliminada exitosamente." };
    } catch (error) {
      console.error(`Error deleting production order ID ${idOrder}:`, error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },
  
  changeProductionOrderStatus: async (idOrder, status, observations) => {
    try {
      const payload = { status, observations };
      const response = await axiosInstance.patch(`${API_ENDPOINT}/${idOrder}/status`, payload);
      return response.data;
    } catch (error) {
      console.error(`Error changing status for production order ID ${idOrder}:`, error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  finalizeProductionOrder: async (idOrder, finalizeData) => {
    try {
      const response = await axiosInstance.post(`${API_ENDPOINT}/${idOrder}/finalize`, finalizeData);
      return response.data;
    } catch (error) {
      console.error(`Error finalizing production order ID ${idOrder}:`, error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  checkActiveOrderForProduct: async (productId) => {
    try {
      const response = await axiosInstance.get(`${API_ENDPOINT}/check-active/${productId}`);
      return response.data; 
    } catch (error) {
      console.error(`Error checking active order for product ${productId}:`, error);
      return { hasActiveOrder: false }; 
    }
  },
};

export default productionOrderService;