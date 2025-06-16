import axiosInstance from './axiosConfig'; // <- CAMBIO 1

const DETAILS_ENDPOINT = '/production-order-details'; // <- CAMBIO 2

const productionOrderDetailService = {
  addStepToOrder: async (idProductionOrder, stepData) => {
    try {
      // CAMBIO 3: Usar axiosInstance y el endpoint relativo
      const response = await axiosInstance.post(`${DETAILS_ENDPOINT}/production-orders/${idProductionOrder}/steps`, stepData);
      return response.data;
    } catch (error) {
      console.error(`Error adding step to order ID ${idProductionOrder}:`, error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  getStepsByOrderId: async (idProductionOrder) => {
    try {
      const response = await axiosInstance.get(`${DETAILS_ENDPOINT}/production-orders/${idProductionOrder}/steps`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching steps for order ID ${idProductionOrder}:`, error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  getStepById: async (idProductionOrderDetail) => {
    try {
      const response = await axiosInstance.get(`${DETAILS_ENDPOINT}/${idProductionOrderDetail}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching production order detail ID ${idProductionOrderDetail}:`, error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  deleteStep: async (idProductionOrderDetail) => {
    try {
      await axiosInstance.delete(`${DETAILS_ENDPOINT}/${idProductionOrderDetail}`);
      return { message: "Paso de orden de producción eliminado exitosamente." };
    } catch (error) {
      console.error(`Error deleting production order detail ID ${idProductionOrderDetail}:`, error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  getStepsByEmployeeId: async (idEmployee) => {
    try {
      const response = await axiosInstance.get(`${DETAILS_ENDPOINT}/employee/${idEmployee}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching steps for employee ID ${idEmployee}:`, error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  getActiveStepsOverall: async () => {
    try {
      const response = await axiosInstance.get(`${DETAILS_ENDPOINT}/status/active`);
      return response.data;
    } catch (error) {
      console.error("Error fetching all active production order steps:", error.response?.data || error.message);
      throw error.response?.data || error;
    }
  }
};

export default productionOrderDetailService;