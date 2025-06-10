import axiosInstance from './axiosConfig'; // <- CAMBIO 1

const API_ENDPOINT = '/production-order-supplies'; // <- CAMBIO 2

const productionOrderSupplyService = {
  addConsumedSuppliesToOrder: async (idProductionOrder, consumedSuppliesData) => {
    try {
      // <- CAMBIO 3: Usar axiosInstance y el endpoint
      const response = await axiosInstance.post(`${API_ENDPOINT}/production-orders/${idProductionOrder}/supplies`, consumedSuppliesData);
      return response.data;
    } catch (error) {
      console.error(`Error adding consumed supplies to order ID ${idProductionOrder}:`, error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  getConsumedSuppliesByOrderId: async (idProductionOrder) => {
    try {
      const response = await axiosInstance.get(`${API_ENDPOINT}/production-orders/${idProductionOrder}/supplies`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching consumed supplies for order ID ${idProductionOrder}:`, error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  getConsumedSupplyRecordById: async (idProductionOrderSupply) => {
    try {
      const response = await axiosInstance.get(`${API_ENDPOINT}/${idProductionOrderSupply}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching consumed supply record ID ${idProductionOrderSupply}:`, error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  updateConsumedSupplyRecord: async (idProductionOrder, idProductionOrderSupply, dataToUpdate) => {
    try {
      const response = await axiosInstance.put(`${API_ENDPOINT}/production-orders/${idProductionOrder}/supplies/${idProductionOrderSupply}`, dataToUpdate);
      return response.data;
    } catch (error) {
      console.error(`Error updating consumed supply record ID ${idProductionOrderSupply} for order ${idProductionOrder}:`, error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  deleteConsumedSupplyRecord: async (idProductionOrder, idProductionOrderSupply) => {
    try {
      await axiosInstance.delete(`${API_ENDPOINT}/production-orders/${idProductionOrder}/supplies/${idProductionOrderSupply}`);
      return { message: "Registro de consumo eliminado exitosamente." };
    } catch (error) {
      console.error(`Error deleting consumed supply record ID ${idProductionOrderSupply} for order ${idProductionOrder}:`, error.response?.data || error.message);
      throw error.response?.data || error;
    }
  }
};

export default productionOrderSupplyService;