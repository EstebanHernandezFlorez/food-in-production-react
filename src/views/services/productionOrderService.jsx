// RUTA: /services/productionOrderService.jsx (o tu ruta equivalente)
// VERSIÓN TOTALMENTE COMPLETA Y FINAL

import axiosInstance from './axiosConfig';

const API_ENDPOINT = '/production-orders';

const productionOrderService = {
  /**
   * Obtiene todas las órdenes de producción, con opción de filtros y paginación.
   * @param {object} params - Parámetros de consulta (ej. { status: 'PENDING', page: 1 }).
   * @returns {Promise<Array>} Una lista de órdenes de producción.
   */
  getAllProductionOrders: async (params = {}) => {
    try {
      const response = await axiosInstance.get(API_ENDPOINT, { params });
      // Manejo flexible de la respuesta del backend
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
      return []; // Devolver array vacío en caso de error para no romper la UI.
    }
  },
  
  /**
   * Crea una nueva orden de producción.
   * @param {object} orderData - Los datos para crear la orden.
   * @returns {Promise<object>} La orden de producción creada.
   */
  createProductionOrder: async (orderData) => {
    try {
      const response = await axiosInstance.post(API_ENDPOINT, orderData);
      return response.data;
    } catch (error) {
      console.error("Error creating production order:", error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  /**
   * Obtiene una orden de producción específica por su ID.
   * @param {string|number} idOrder - El ID de la orden.
   * @returns {Promise<object>} Los detalles de la orden de producción.
   */
  getProductionOrderById: async (idOrder) => {
    try {
      const response = await axiosInstance.get(`${API_ENDPOINT}/${idOrder}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching production order ID ${idOrder}:`, error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  /**
   * Actualiza los datos de una orden de producción existente.
   * @param {string|number} idOrder - El ID de la orden a actualizar.
   * @param {object} orderData - Los datos a modificar.
   * @returns {Promise<object>} La orden actualizada.
   */
  updateProductionOrder: async (idOrder, orderData) => {
    try {
      const response = await axiosInstance.put(`${API_ENDPOINT}/${idOrder}`, orderData);
      return response.data;
    } catch (error) {
      console.error(`Error updating production order ID ${idOrder}:`, error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  /**
   * Actualiza un paso específico dentro de una orden de producción.
   * @param {string|number} idOrder - El ID de la orden.
   * @param {string|number} idStep - El ID del paso a actualizar.
   * @param {object} stepData - Los datos del paso a modificar.
   * @returns {Promise<object>} La orden completa actualizada.
   */
  updateProductionOrderStep: async (idOrder, idStep, stepData) => {
    try {
      const response = await axiosInstance.patch(`${API_ENDPOINT}/${idOrder}/steps/${idStep}`, stepData);
      return response.data;
    } catch (error) {
      console.error(`Error updating step ID ${idStep} for order ID ${idOrder}:`, error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  /**
   * Elimina una orden de producción.
   * @param {string|number} idOrder - El ID de la orden a eliminar.
   * @returns {Promise<object>} Un mensaje de confirmación.
   */
  deleteProductionOrder: async (idOrder) => {
    try {
      await axiosInstance.delete(`${API_ENDPOINT}/${idOrder}`);
      return { message: "Orden de producción eliminada exitosamente." };
    } catch (error) {
      console.error(`Error deleting production order ID ${idOrder}:`, error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },
  
  /**
   * Cambia el estado de una orden (ej. Pausar, Cancelar).
   * @param {string|number} idOrder - El ID de la orden.
   * @param {string} status - El nuevo estado.
   * @param {string} [observations] - Observaciones opcionales para el cambio.
   * @returns {Promise<object>} La orden actualizada.
   */
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

  /**
   * Finaliza una orden de producción, registrando la cantidad final.
   * @param {string|number} idOrder - El ID de la orden.
   * @param {object} finalizeData - Datos de finalización.
   * @returns {Promise<object>} La orden finalizada.
   */
  finalizeProductionOrder: async (idOrder, finalizeData) => {
    try {
      const response = await axiosInstance.post(`${API_ENDPOINT}/${idOrder}/finalize`, finalizeData);
      return response.data;
    } catch (error) {
      console.error(`Error finalizing production order ID ${idOrder}:`, error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  /**
   * Verifica si existe una orden de producción activa para un producto específico.
   * @param {string|number} productId - El ID del producto.
   * @returns {Promise<object>} Un objeto indicando si hay orden activa.
   */
  checkActiveOrderForProduct: async (productId) => {
    try {
      const response = await axiosInstance.get(`${API_ENDPOINT}/check-active/${productId}`);
      return response.data; 
    } catch (error) {
      console.error(`Error checking active order for product ${productId}:`, error);
      return { hasActiveOrder: false }; 
    }
  },

  /**
   * Inicia el proceso de producción para una orden y descuenta los insumos del inventario.
   * @param {string|number} idOrder - El ID de la orden de producción.
   * @param {object} startData - Datos para el inicio, como { idEmployeeAssigned }.
   * @returns {Promise<object>} La orden de producción actualizada.
   */
  startProductionAndDeductSupplies: async (idOrder, startData) => {
    try {
      const response = await axiosInstance.post(`${API_ENDPOINT}/${idOrder}/start`, startData);
      return response.data;
    } catch (error) {
      console.error(`Error starting production for order ID ${idOrder}:`, error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },
  
  // --- NUEVA FUNCIÓN PARA VERIFICAR EL STOCK DISPONIBLE ---
  /**
   * Verifica si hay suficiente stock de insumos para producir una cantidad específica según una ficha técnica.
   * @param {object} payload - Un objeto que contiene { idSpecSheet, initialAmount }.
   * @returns {Promise<object>} Un objeto con el resultado de la verificación: { sufficient: boolean, message: string, details: Array }.
   */
  checkStockAvailability: async (payload) => {
    try {
      // Llama al nuevo endpoint del backend
      const response = await axiosInstance.post(`${API_ENDPOINT}/check-stock`, payload);
      return response.data;
    } catch (error) {
      console.error("Error al verificar el stock:", error.response?.data || error.message);
      // Devuelve una respuesta de error consistente para que la UI no falle
      return { 
          sufficient: false, 
          message: error.response?.data?.message || "No se pudo verificar el stock disponible.",
          details: []
      };
    }
  },
};

export default productionOrderService;