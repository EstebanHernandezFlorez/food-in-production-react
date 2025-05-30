// services/ExpenseCategoryService.js (NUEVO NOMBRE DE ARCHIVO)
import axios from 'axios';

// Endpoint para las Categorías de Gasto
// Asegúrate que esta API_URL coincida con la ruta base que definiste para expenseCategoryRoutes en tu app.js del backend
// Por ejemplo, si es 'http://localhost:3000/api/expense-categories'
const API_URL = 'http://localhost:3000/conceptSpent'; // <<--- AJUSTA ESTA RUTA BASE

const ExpenseCategoryService = {
  getAllExpenseCategories: async () => { // <<--- Nombre de método actualizado
    try {
      const response = await axios.get(API_URL);
      return response.data;
    } catch (error) {
      console.error("Error fetching expense categories:", error);
      throw {
        message: error.response?.data?.message || "Error al obtener las categorías de gasto",
        status: error.response?.status || 500
      };
    }
  },

  getExpenseCategoryById: async (idExpenseCategory) => { // <<--- Nombre de param actualizado
    try {
      const response = await axios.get(`${API_URL}/${idExpenseCategory}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching expense category by ID:", error);
      throw {
        message: error.response?.data?.message || "Error al obtener la categoría de gasto por ID",
        status: error.response?.status || 500
      };
    }
  },

  createExpenseCategory: async (categoryData) => { // <<--- Nombre de método y param actualizados
    try {
      const response = await axios.post(API_URL, categoryData);
      return response.data;
    } catch (error) {
      console.error("Error creating expense category:", error);
      // Manejo de errores de validación del backend si vienen en un array 'errors'
      const errors = error.response?.data?.errors;
      let detailedMessage = "Error al crear la categoría de gasto";
      if (errors && Array.isArray(errors) && errors.length > 0) {
          detailedMessage = errors.map(e => e.msg).join(', ');
      } else if (error.response?.data?.message) {
          detailedMessage = error.response.data.message;
      }
      throw {
        message: detailedMessage,
        status: error.response?.status || 500
      };
    }
  },

  updateExpenseCategory: async (idExpenseCategory, categoryData) => { // <<--- Nombres actualizados
    try {
      const response = await axios.put(`${API_URL}/${idExpenseCategory}`, categoryData);
      return response.data; // Asumiendo que el backend devuelve el objeto actualizado
    } catch (error) {
      console.error("Error updating expense category:", error);
      const errors = error.response?.data?.errors;
      let detailedMessage = "Error al actualizar la categoría de gasto";
      if (errors && Array.isArray(errors) && errors.length > 0) {
          detailedMessage = errors.map(e => e.msg).join(', ');
      } else if (error.response?.data?.message) {
          detailedMessage = error.response.data.message;
      }
      throw {
        message: detailedMessage,
        status: error.response?.status || 500
      };
    }
  },

  deleteExpenseCategory: async (idExpenseCategory) => { // <<--- Nombre actualizado
    try {
      await axios.delete(`${API_URL}/${idExpenseCategory}`);
      // Delete no devuelve contenido, así que no hay response.data
    } catch (error) {
      console.error("Error deleting expense category:", error);
      throw {
        message: error.response?.data?.message || "Error al eliminar la categoría de gasto",
        status: error.response?.status || 500
      };
    }
  },

  changeStateExpenseCategory: async (idExpenseCategory, status) => { // <<--- Nombres actualizados
    try {
      // La ruta en tu backend para cambiar estado es PATCH /:idExpenseCategory/status
      const response = await axios.patch(`${API_URL}/${idExpenseCategory}/status`, { status });
      return response.data; // Asumiendo que el backend devuelve el objeto actualizado
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