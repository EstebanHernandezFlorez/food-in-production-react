// src/data/sampleData.js

// --- DATOS SIMULADOS (Reemplazar con API eventualmente) ---

export const sampleSuppliers = [
    { id: 'sup1', name: 'Proveedor A', contact: 'contactoA@example.com' },
    { id: 'sup2', name: 'Proveedor B', contact: 'contactoB@example.com' },
    { id: 'sup3', name: 'Proveedor C', contact: 'contactoC@example.com' },
  ];
  
  // **NECESARIO para SupplierView y EmployeeView hasta tener servicio de Insumos**
  export const sampleProducts = [
    { id: 'prod1', name: 'Insumo X', unit: 'kg' },
    { id: 'prod2', name: 'Insumo Y', unit: 'litros' },
    { id: 'prod3', name: 'Componente Z', unit: 'unidades' },
  ];
  
  // Datos de compras (ejemplo, serán reemplazados por API)
  export const samplePurchases = [
    { id: 'pur1', supplierId: 'sup1', productId: 'prod1', date: '2024-01-15', quantity: 100, pricePerUnit: 5.50, totalCost: 550 },
    { id: 'pur2', supplierId: 'sup2', productId: 'prod1', date: '2024-01-20', quantity: 120, pricePerUnit: 5.30, totalCost: 636 },
    { id: 'pur3', supplierId: 'sup1', productId: 'prod2', date: '2024-02-10', quantity: 50, pricePerUnit: 12.00, totalCost: 600 },
    // ... más datos si quieres
  ];
  
  // Datos de gastos (ejemplo, serán reemplazados por API)
  export const sampleExpenses = [
      { id: 'exp1', category: 'Salarios', date: '2024-01-30', amount: 15000 },
      { id: 'exp2', category: 'Alquiler', date: '2024-01-31', amount: 2500 },
      { id: 'exp3', category: 'Insumos', date: '2024-01-31', amount: 1186 },
      { id: 'exp4', category: 'Salarios', date: '2024-02-28', amount: 15200 },
      // ... más datos si quieres
  ];
  
  // Datos de empleados (ejemplo, serán reemplazados por API)
  export const sampleEmployees = [
    { id: 'emp1', name: 'Ana García' },
    { id: 'emp2', name: 'Luis Fernández' },
    { id: 'emp3', name: 'Carlos Martín' },
  ];
  
  // **NECESARIO para EmployeeView hasta tener servicio de Procesos**
  export const sampleProcesses = [
      { id: 'proc1', name: 'Proceso A (Insumo X)', unit: 'kg', steps: ['Paso 1: Mezcla', 'Paso 2: Calentamiento', 'Paso 3: Enfriamiento'] },
      { id: 'proc2', name: 'Proceso B (Componente Z)', unit: 'unidades', steps: ['Paso 1: Ensamblaje', 'Paso 2: Verificación'] },
  ];
  
  // **NECESARIO para EmployeeView hasta tener servicio de Registros**
  export const sampleProductionRecords = [
    { id: 'rec1', employeeId: 'emp1', processId: 'proc1', productId: 'prod1', date: '2024-01-22', inputConsumed: 5.2, unit: 'kg', outputProduced: 5.0, timeTakenMin: 65 },
    { id: 'rec2', employeeId: 'emp2', processId: 'proc1', productId: 'prod1', date: '2024-01-23', inputConsumed: 5.5, unit: 'kg', outputProduced: 5.1, timeTakenMin: 70 },
    { id: 'rec3', employeeId: 'emp1', processId: 'proc1', productId: 'prod1', date: '2024-02-15', inputConsumed: 5.1, unit: 'kg', outputProduced: 4.9, timeTakenMin: 62 },
    { id: 'rec4', employeeId: 'emp3', processId: 'proc2', productId: 'prod3', date: '2024-03-20', inputConsumed: 20, unit: 'unidades', outputProduced: 19, timeTakenMin: 30 },
    { id: 'rec5', employeeId: 'emp2', processId: 'proc1', productId: 'prod1', date: '2024-03-25', inputConsumed: 5.3, unit: 'kg', outputProduced: 5.0, timeTakenMin: 68 },
    { id: 'rec6', employeeId: 'emp1', processId: 'proc2', productId: 'prod3', date: '2024-04-02', inputConsumed: 22, unit: 'unidades', outputProduced: 20, timeTakenMin: 35 },
    // ... más registros si quieres
  ];
  
  
  // --- FUNCIONES DE AYUDA (Helpers) ---
  
  /**
   * Obtiene el nombre del mes (capitalizado) y el año de una cadena de fecha ISO (YYYY-MM-DD).
   * @param {string} dateString - La fecha en formato 'YYYY-MM-DD' o similar.
   * @returns {{month: string, year: number}} Objeto con el mes y el año.
   */
  export const getMonthYear = (dateString) => {
      try {
          const date = new Date(dateString);
          // getMonth() devuelve 0-11, pero toLocaleString funciona bien
          const month = date.toLocaleString('es-ES', { month: 'long' }); // 'enero', 'febrero', etc.
          const year = date.getFullYear();
          if (isNaN(year)) throw new Error("Invalid date"); // Manejo básico de error
          return { month: month.charAt(0).toUpperCase() + month.slice(1), year }; // Capitaliza el mes
      } catch (error) {
          console.warn(`[getMonthYear] Error parsing date "${dateString}":`, error);
          // Devolver valores por defecto o manejar como prefieras
          const now = new Date();
          const month = now.toLocaleString('es-ES', { month: 'long' });
          return { month: month.charAt(0).toUpperCase() + month.slice(1), year: now.getFullYear() };
      }
  };
  
  /**
   * Obtiene el nombre del mes y el año anteriores al mes y año dados.
   * @param {number} year - El año actual.
   * @param {string} month - El nombre del mes actual (ej. "Marzo", "Enero").
   * @returns {{month: string, year: number}} Objeto con el mes y año anteriores.
   */
  export const getPreviousMonth = (year, month) => {
      const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
      const monthIndex = monthNames.indexOf(month);
  
      if (monthIndex === -1) {
          console.warn(`[getPreviousMonth] Invalid month name: "${month}"`);
          // Devolver el mes anterior al actual como fallback
          const fallbackDate = new Date();
          fallbackDate.setMonth(fallbackDate.getMonth() - 1);
          const prevMonth = fallbackDate.toLocaleString('es-ES', { month: 'long' });
          const prevYear = fallbackDate.getFullYear();
          return { month: prevMonth.charAt(0).toUpperCase() + prevMonth.slice(1), year: prevYear };
      }
  
      const date = new Date(year, monthIndex, 1); // Crea fecha del primer día del mes/año dados
      date.setMonth(date.getMonth() - 1); // Retrocede un mes
  
      const prevMonthName = date.toLocaleString('es-ES', { month: 'long' });
      const prevYear = date.getFullYear();
      return { month: prevMonthName.charAt(0).toUpperCase() + prevMonthName.slice(1), year: prevYear };
  };