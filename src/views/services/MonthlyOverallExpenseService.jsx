// services/monthlyOverallExpense.service.js
import axios from 'axios';

// Asegúrate que este endpoint coincida con cómo montaste monthlyOverallExpenseRoutes en tu app.js del backend
// Si tu backend usa /api/monthlyExpenses, cámbialo aquí.
const API_URL = 'http://localhost:3000/monthlyOverallExpense';

const MonthlyOverallExpenseService = {
  getAllMonthlyOverallExpenses: async () => {
    try {
      // console.log("Intentando obtener gastos...");
      const response = await axios.get(API_URL); // Ruta base para obtener todos
      // console.log("Respuesta completa del servicio:", response);
      return response.data; // El backend ya debería incluir los items y detalles
    } catch (error) {
      console.error("Error detallado al obtener gastos mensuales:", error);
      throw {
        message: error.response?.data?.message || "Error al obtener los gastos mensuales",
        status: error.response?.status || 500
      };
    }
  },

  getMonthlyOverallExpenseById: async (idOverallMonth) => {
    try {
      const response = await axios.get(`${API_URL}/${idOverallMonth}`);
      return response.data; // El backend ya debería incluir los items y detalles
    } catch (error) {
      console.error(`Error fetching monthly overall expense with id ${idOverallMonth}:`, error);
      throw {
        message: error.response?.data?.message || "Error al obtener el gasto mensual por ID",
        status: error.response?.status || 500
      };
    }
  },

  /**
   * Crea un nuevo registro de gasto mensual con sus ítems.
   * @param {Object} expensePayload - El objeto del gasto.
   * @param {number} expensePayload.idExpenseType - ID del Tipo de Gasto General.
   * @param {string} expensePayload.dateOverallExp - Fecha en formato YYYY-MM-DD.
   * @param {string} expensePayload.novelty_expense - Novedades.
   * @param {boolean} [expensePayload.status=true] - Estado.
   * @param {Array<Object>} expensePayload.expenseItems - Array de ítems de gasto.
   * @param {number} expensePayload.expenseItems[].idSpecificConcept - ID del Concepto Específico.
   * @param {number} expensePayload.expenseItems[].price - Precio final del ítem.
   * @param {number} [expensePayload.expenseItems[].baseSalary] - Sueldo base (si aplica).
   * @param {number} [expensePayload.expenseItems[].numEmployees] - Número de empleados (si aplica).
   * @param {boolean} [expensePayload.expenseItems[].addBonus] - Si se añade bonificación (frontend, se mapea a hasBonus en backend).
   * @param {number} [expensePayload.expenseItems[].bonusAmount] - Monto de la bonificación (si aplica).
   */
  createMonthlyOverallExpense: async (expensePayload) => {
    try {
      const response = await axios.post(API_URL, expensePayload);
      return response.data;
    } catch (error) {
      console.error("Error creating monthly overall expense:", error);
      throw {
        message: error.response?.data?.errors?.[0]?.msg || error.response?.data?.message || "Error al crear el gasto mensual",
        status: error.response?.status || 500
      };
    }
  },

  /**
   * Actualiza la cabecera de un gasto mensual existente (fecha, novedad, estado).
   * NO actualiza los ítems. Para eso se necesitaría una lógica/endpoint diferente.
   * @param {number} idOverallMonth - ID del gasto mensual a actualizar.
   * @param {Object} expenseHeaderData - Datos de la cabecera (ej. dateOverallExp, novelty_expense, status).
   */
  updateMonthlyOverallExpense: async (idOverallMonth, expenseHeaderData) => {
    try {
      const response = await axios.put(`${API_URL}/${idOverallMonth}`, expenseHeaderData);
      return response.data; // Asumiendo que el backend devuelve el objeto actualizado
    } catch (error) {
      console.error(`Error updating monthly overall expense with id ${idOverallMonth}:`, error);
      throw {
        message: error.response?.data?.errors?.[0]?.msg || error.response?.data?.message || `Error al actualizar el gasto mensual`,
        status: error.response?.status || 500
      };
    }
  },

  deleteMonthlyOverallExpense: async (idOverallMonth) => {
    try {
      await axios.delete(`${API_URL}/${idOverallMonth}`);
    } catch (error) {
      console.error(`Error deleting monthly overall expense with id ${idOverallMonth}:`, error);
      throw {
        message: error.response?.data?.message || "Error al eliminar el gasto mensual",
        status: error.response?.status || 500
      };
    }
  },

  changeStateMonthlyOverallExpense: async (idOverallMonth, status) => {
    try {
      // Verifica que tu backend espere PATCH en /:idOverallMonth/status con { status } en el body,
      // o PATCH en /:idOverallMonth con { status } en el body.
      // La ruta que te sugerí en el backend fue /:idOverallMonth/status
      const response = await axios.patch(`${API_URL}/${idOverallMonth}/status`, { status });
      return response.data;
    } catch (error) {
      console.error(`Error changing status of monthly overall expense with id ${idOverallMonth}:`, error);
      throw {
        message: error.response?.data?.message || `Error al cambiar el estado del gasto mensual`,
        status: error.response?.status || 500
      };
    }
  },

  // Los métodos getTotal... no deberían cambiar mucho, ya que operan sobre el total del gasto
  // y el idExpenseType (que es el tipo general).
  getTotalExpenseByMonth: async (year, month) => {
    try {
      const response = await axios.get(`${API_URL}/total/${year}/${month}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching total expense by month:", error);
      throw {
        message: error.response?.data?.message || "Error al obtener el total de gastos por mes",
        status: error.response?.status || 500
      };
    }
  },

  getTotalExpenseByTypeAndMonth: async (year, month, idExpenseType) => {
    try {
      // idExpenseType aquí es el ID del Tipo de Gasto General
      const response = await axios.get(`${API_URL}/total/${year}/${month}/${idExpenseType}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching total expense by type and month:", error);
      throw {
        message: error.response?.data?.message || "Error al obtener el total de gastos por tipo y mes",
        status: error.response?.status || 500
      };
    }
  }
  // Si necesitas la funcionalidad de actualizar un ítem individual, se añadiría aquí un nuevo método.
  // Por ejemplo: updateMonthlyItem: async (idOverallMonth, idMonthlyExpenseItem, itemData) => { ... }
};

export default MonthlyOverallExpenseService;