import axiosInstance from './axiosConfig'; // <- CAMBIO 1: Importar la instancia configurada

// CAMBIO 2: Definir solo el endpoint relativo
const EXPENSE_CATEGORY_ENDPOINT = '/conceptSpent'; 

const ExpenseCategoryService = {
  getAllExpenseCategories: async () => {
    try {
      // CAMBIO 3: Usar axiosInstance y el endpoint
      const response = await axiosInstance.get(EXPENSE_CATEGORY_ENDPOINT);
      return response.data;
    } catch (error) {
      console.error("Error fetching expense categories:", error);
      throw {
        message: error.response?.data?.message || "Error al obtener las categorías de gasto",
        status: error.response?.status || 500
      };
    }
  },

  getExpenseCategoryById: async (idExpenseCategory) => {
    try {
      const response = await axiosInstance.get(`${EXPENSE_CATEGORY_ENDPOINT}/${idExpenseCategory}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching expense category by ID:", error);
      throw {
        message: error.response?.data?.message || "Error al obtener la categoría de gasto por ID",
        status: error.response?.status || 500
      };
    }
  },

  createExpenseCategory: async (categoryData) => {
    try {
      const response = await axiosInstance.post(EXPENSE_CATEGORY_ENDPOINT, categoryData);
      return response.data;
    } catch (error) {
      console.error("Error creating expense category:", error);
      const errors = error.response?.data?.errors;
      let detailedMessage = "Error al crear la categoría de gasto";
      if (errors && Array.isArray(errors) && errors.length > 0) {
          detailedMessage = errors.map(e => e.msg).join(', ');
      } else if (error.response?.data?.message) {
          detailedMessage = error.response.data.message;
      }
      throw { message: detailedMessage, status: error.response?.status || 500 };
    }
  },

  updateExpenseCategory: async (idExpenseCategory, categoryData) => {
    try {
      const response = await axiosInstance.put(`${EXPENSE_CATEGORY_ENDPOINT}/${idExpenseCategory}`, categoryData);
      return response.data;
    } catch (error) {
      console.error("Error updating expense category:", error);
      const errors = error.response?.data?.errors;
      let detailedMessage = "Error al actualizar la categoría de gasto";
      if (errors && Array.isArray(errors) && errors.length > 0) {
          detailedMessage = errors.map(e => e.msg).join(', ');
      } else if (error.response?.data?.message) {
          detailedMessage = error.response.data.message;
      }
      throw { message: detailedMessage, status: error.response?.status || 500 };
    }
  },

  deleteExpenseCategory: async (idExpenseCategory) => {
    try {
      await axiosInstance.delete(`${EXPENSE_CATEGORY_ENDPOINT}/${idExpenseCategory}`);
    } catch (error) {
      console.error("Error deleting expense category:", error);
      throw {
        message: error.response?.data?.message || "Error al eliminar la categoría de gasto",
        status: error.response?.status || 500
      };
    }
  },

  changeStateExpenseCategory: async (idExpenseCategory, status) => {
    try {
      const response = await axiosInstance.patch(`${EXPENSE_CATEGORY_ENDPOINT}/${idExpenseCategory}/status`, { status });
      return response.data;
    } catch (error) {
      console.error(`Error changing status for expense category ${idExpenseCategory}:`, error);
      throw {
        message: error.response?.data?.message || `Error al cambiar el estado de la categoría de gasto`,
        status: error.response?.status || 500
      };
    }
  }
};

export default ExpenseCategoryService;