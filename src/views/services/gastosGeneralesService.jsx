    // service/monthlyOverallExpense.service.js
    import axios from 'axios';

    const API_URL = 'http://localhost:3000/monthlyOverallExpense';

    const MonthlyOverallExpenseService = {
    getAllMonthlyOverallExpenses : async () => {
        try {
            console.log("Intentando obtener gastos...");
            const response = await axios.get(`${API_URL}`);
            console.log("Respuesta completa del servicio:", response);
            return response.data;
        } catch (error) {
            console.error("Error detallado al obtener gastos:", error);
            throw error;
        }
    },

        getMonthlyOverallExpenseById: async (idOverallMonth) => {
            try {
                const response = await axios.get(`${API_URL}/${idOverallMonth}`);
                return response.data;
            } catch (error) {
                console.error(`Error fetching monthly overall expense with id ${idOverallMonth}:`, error);
                throw {
                    message: error.response?.data?.message || "Error al obtener el gasto mensual por ID",
                    status: error.response?.status || 500
                };
            }
        },

        createMonthlyOverallExpense: async (expenseData) => {
            try {
                const response = await axios.post(API_URL, expenseData);
                return response.data;
            } catch (error) {
                console.error("Error creating monthly overall expense:", error);
                // Retorna un objeto de error con la información del error
                throw {
                    message: error.response?.data?.errors?.[0]?.msg || error.response?.data?.message || "Error al crear el gasto mensual",
                    status: error.response?.status || 500
                };
            }
        },

        updateMonthlyOverallExpense: async (idOverallMonth, expenseData) => {
            try {
                const response = await axios.put(`${API_URL}/${idOverallMonth}`, expenseData);
                return response.data;
            } catch (error) {
                console.error(`Error updating monthly overall expense with id ${idOverallMonth}:`, error);
                // Retorna un objeto de error con la información del error
                throw {
                    message: error.response?.data?.errors?.[0]?.msg || error.response?.data?.message || `Error al actualizar el gasto mensual con ID ${idOverallMonth}`,
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
                const response = await axios.patch(`${API_URL}/${idOverallMonth}`, { status });
                return response.data;
            } catch (error) {
                console.error(`Error changing status of monthly overall expense with id ${idOverallMonth}:`, error);
                throw {
                    message: error.response?.data?.message || `Error al cambiar el estado del gasto mensual con ID ${idOverallMonth}`,
                    status: error.response?.status || 500
                };
            }
        },

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
    };

    export default MonthlyOverallExpenseService;