// CORREGIDO: Importamos la instancia de Axios ya configurada, no la librería base.
import axiosInstance from './axiosConfig';

// CORREGIDO: Definimos solo el "endpoint" o la ruta relativa, no la URL completa.
const EMPLOYEE_API_ENDPOINT = '/employee';

const empleadoService = {
    getAllEmpleados: async () => {
        try {
            // CORREGIDO: Usamos axiosInstance y el endpoint relativo.
            const response = await axiosInstance.get(EMPLOYEE_API_ENDPOINT);
            return response.data;
        } catch (error) {
            console.error("[Service Error] Fetching all employees failed:", error.response?.data || error.message);
            throw error;
        }
    },

    getActiveEmployeeCountByMonth: async (year, month) => {
        try {
          const response = await axiosInstance.get(`${EMPLOYEE_API_ENDPOINT}/count`, { 
            params: { year, month } // El backend ya sabe que es para activos por defecto
          });

          // ✅ CAMBIO 1: Devolver el objeto completo que viene del backend
          if (response.data && typeof response.data.count === 'number') {
            return response.data; // Devuelve el objeto { count: 42 }
          }
          
          console.warn("El endpoint /employee/count no devolvió un formato esperado.");
          
          // ✅ CAMBIO 2: Devolver un objeto por defecto
          return { count: 0 }; 

        } catch (error) {
          console.error("[Service Error] Fetching active employee count failed:", error.response?.data || error.message);
          
          // ✅ CAMBIO 3: Devolver un objeto en caso de error
          return { count: 0 };
        }
    },

    createEmpleado: async (empleadoData) => {
        try {
            // CORREGIDO: Usamos axiosInstance.
            const response = await axiosInstance.post(EMPLOYEE_API_ENDPOINT, empleadoData);
            return response.data;
        } catch (error) {
            console.error("[Service Error] Creating employee failed:", error.response?.data || error.message);
            throw error;
        }
    },

    getEmpleadoById: async (idEmployee) => {
        try {
            // CORREGIDO: Usamos axiosInstance y construimos la URL a partir del endpoint.
            const response = await axiosInstance.get(`${EMPLOYEE_API_ENDPOINT}/${idEmployee}`);
            return response.data;
        } catch (error) {
            console.error(`[Service Error] Fetching employee ID ${idEmployee} failed:`, error.response?.data || error.message);
            throw error;
        }
    },

    updateEmpleado: async (idEmployee, empleadoData) => {
        try {
            // CORREGIDO: Usamos axiosInstance.
            const response = await axiosInstance.put(`${EMPLOYEE_API_ENDPOINT}/${idEmployee}`, empleadoData);
            return response.data;
        } catch (error) {
            console.error(`[Service Error] Updating employee ID ${idEmployee} failed:`, error.response?.data || error.message);
            throw error;
        }
    },

    deleteEmpleado: async (idEmployee) => {
        try {
            // CORREGIDO: Usamos axiosInstance.
            await axiosInstance.delete(`${EMPLOYEE_API_ENDPOINT}/${idEmployee}`);
        } catch (error) {
            console.error(`[Service Error] Deleting employee ID ${idEmployee} failed:`, error.response?.data || error.message);
            throw error;
        }
    },

    changeStateEmpleado: async (idEmployee, status) => {
        try {
            // CORREGIDO: Usamos axiosInstance.
            const response = await axiosInstance.patch(`${EMPLOYEE_API_ENDPOINT}/${idEmployee}`, { status });
            return response.data;
        } catch (error) {
            console.error(`[Service Error] Changing status for employee ID ${idEmployee} failed:`, error.response?.data || error.message);
            throw error;
        }
    },
    
    // La lógica de isEmployeeAssociated ya usa axios.get con una URL construida,
    // solo necesita cambiar a axiosInstance.
    isEmployeeAssociated: async (idEmployee) => {
        const checkUrl = `${EMPLOYEE_API_ENDPOINT}/${idEmployee}/is-associated`;
        try {
            // CORREGIDO: Usamos axiosInstance.
            const response = await axiosInstance.get(checkUrl);
            if (response.data && typeof response.data.isAssociated === 'boolean') {
                return response.data.isAssociated;
            }
            return false;
        } catch (error) {
            if (error.response && error.response.status === 404) {
                return false;
            }
            console.error(`[Service Error] Checking employee association failed for ID ${idEmployee}:`, error.response?.data || error.message);
            throw new Error("Association check failed");
        }
    }
};

export default empleadoService;