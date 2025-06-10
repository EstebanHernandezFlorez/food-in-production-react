import axiosInstance from './axiosConfig'; // <- CAMBIO 1

const API_ENDPOINT = '/monthlyOverallExpense'; // <- CAMBIO 2

const MonthlyOverallExpenseService = {
  getAllMonthlyOverallExpenses: async (filters = {}) => {
    try {
      // ... (lógica interna de params sin cambios)
      const params = { ...filters };
      if (params.idExpenseType && !params.idExpenseCategory) {
          params.idExpenseCategory = params.idExpenseType;
          delete params.idExpenseType;
      }
      const response = await axiosInstance.get(API_ENDPOINT, { params }); // <- CAMBIO 3
      if(response.data && Array.isArray(response.data.rows)) {
        return response.data.rows;
      }
      if(Array.isArray(response.data)) {
        return response.data;
      }
      console.warn("La respuesta de getAllMonthlyOverallExpenses no es un array. Se devuelve array vacío.");
      return [];
    } catch (error) {
      console.error("Error detallado al obtener gastos mensuales:", error);
      return [];
    }
  },

  getMonthlyOverallExpenseById: async (idOverallMonth) => {
    try {
      const response = await axiosInstance.get(`${API_ENDPOINT}/${idOverallMonth}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching monthly overall expense with id ${idOverallMonth}:`, error);
      throw { message: error.response?.data?.message || "Error al obtener el gasto mensual por ID", status: error.response?.status || 500 };
    }
  },

  // ... Se aplica el mismo patrón (usar axiosInstance) para el resto de funciones ...
  
  createMonthlyOverallExpense: async (expensePayload) => {
      // ... lógica interna sin cambios
      try {
        const payloadToBackend = { ...expensePayload };
        if (payloadToBackend.idExpenseType && !payloadToBackend.idExpenseCategory) {
            payloadToBackend.idExpenseCategory = payloadToBackend.idExpenseType;
            delete payloadToBackend.idExpenseType;
        }
        if (payloadToBackend.novelty_expense && !payloadToBackend.noveltyExpense) {
            payloadToBackend.noveltyExpense = payloadToBackend.novelty_expense;
            delete payloadToBackend.novelty_expense;
        }
        const response = await axiosInstance.post(API_ENDPOINT, payloadToBackend);
        return response.data;
      } catch (error) {
        console.error("Error creating monthly overall expense:", error);
        const errors = error.response?.data?.errors;
        let detailedMessage = "Error al crear el gasto mensual";
        if (errors && Array.isArray(errors) && errors.length > 0) { detailedMessage = errors.map(e => e.msg).join(', '); } 
        else if (error.response?.data?.message) { detailedMessage = error.response.data.message; }
        throw { message: detailedMessage, status: error.response?.status || 500 };
      }
  },

  updateMonthlyOverallExpense: async (idOverallMonth, expenseHeaderData) => {
      // ... lógica interna sin cambios
      try {
        const payloadToBackend = { ...expenseHeaderData };
        if (payloadToBackend.idExpenseType && !payloadToBackend.idExpenseCategory) {
            payloadToBackend.idExpenseCategory = payloadToBackend.idExpenseType;
            delete payloadToBackend.idExpenseType;
        }
         if (payloadToBackend.novelty_expense && !payloadToBackend.noveltyExpense) {
            payloadToBackend.noveltyExpense = payloadToBackend.novelty_expense;
            delete payloadToBackend.novelty_expense;
        }
        const response = await axiosInstance.put(`${API_ENDPOINT}/${idOverallMonth}`, payloadToBackend);
        return response.data;
      } catch (error) {
        console.error(`Error updating monthly overall expense with id ${idOverallMonth}:`, error);
        const errors = error.response?.data?.errors;
        let detailedMessage = "Error al actualizar el gasto mensual";
        if (errors && Array.isArray(errors) && errors.length > 0) { detailedMessage = errors.map(e => e.msg).join(', '); } 
        else if (error.response?.data?.message) { detailedMessage = error.response.data.message; }
        throw { message: detailedMessage, status: error.response?.status || 500 };
      }
  },
  
  deleteMonthlyOverallExpense: async (idOverallMonth) => {
      try {
        await axiosInstance.delete(`${API_ENDPOINT}/${idOverallMonth}`);
      } catch (error) {
        console.error(`Error deleting monthly overall expense with id ${idOverallMonth}:`, error);
        throw { message: error.response?.data?.message || "Error al eliminar el gasto mensual", status: error.response?.status || 500 };
      }
  },
  
  changeStateMonthlyOverallExpense: async (idOverallMonth, status) => {
      try {
        const response = await axiosInstance.patch(`${API_ENDPOINT}/${idOverallMonth}/status`, { status });
        return response.data;
      } catch (error) {
        console.error(`Error changing status of monthly overall expense with id ${idOverallMonth}:`, error);
        throw { message: error.response?.data?.message || `Error al cambiar el estado del gasto mensual`, status: error.response?.status || 500 };
      }
  },

  getTotalExpenseByMonth: async (year, month) => {
    try {
      const response = await axiosInstance.get(`${API_ENDPOINT}/total/by-month/${year}/${month}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching total expense by month:", error);
      throw { message: error.response?.data?.message || "Error al obtener el total de gastos por mes", status: error.response?.status || 500 };
    }
  },
  
  getTotalExpenseByTypeAndMonth: async (year, month, idExpenseType) => {
    try {
      const response = await axiosInstance.get(`${API_ENDPOINT}/total/by-type/${year}/${month}/${idExpenseType}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching total expense for type ${idExpenseType} in ${year}-${month}:`, error);
      return { totalExpense: 0 };
    }
  }
};

export default MonthlyOverallExpenseService;