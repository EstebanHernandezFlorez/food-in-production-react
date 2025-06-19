// Archivo nuevo: src/services/ProductionAnalyticsService.js

import { format, getMonth, getYear, parseISO } from 'date-fns';
import productionOrderService from './productionOrderService'; // Importa tu servicio existente

const ProductionAnalyticsService = {
  /**
   * Obtiene las órdenes de producción finalizadas en un rango de fechas y las agrupa por mes.
   */
  getMonthlySummary: async (startDate, endDate) => {
    try {
      // 1. Preparamos los filtros para llamar a tu servicio existente
      // Tu servicio ya soporta estos filtros, ¡perfecto!
      const params = {
        status: 'COMPLETED', // Usamos el estado en inglés como en tu servicio
        // Asumimos que tu backend puede filtrar por un campo de fecha de finalización
        // Si el campo se llama `dateCompleted`, esto funcionará. Ajústalo si se llama diferente.
        dateCompleted_gte: format(startDate, 'yyyy-MM-dd'),
        dateCompleted_lte: format(endDate, 'yyyy-MM-dd'),
        limit: 1000 // Pedimos un límite alto para asegurar que traemos todos los datos del periodo
      };

      // 2. Usamos tu `getAllProductionOrders`
      const finalizedOrders = await productionOrderService.getAllProductionOrders(params);
      
      if (!Array.isArray(finalizedOrders)) {
        console.warn("getMonthlySummary no recibió un array de órdenes.");
        return [];
      }

      // 3. Procesamos los datos para agruparlos por mes
      const summary = finalizedOrders.reduce((acc, order) => {
        // Asegúrate que tus objetos de orden tengan 'dateCompleted' y 'finalQuantityProduct'
        const dateString = order.dateCompleted; // o el campo que corresponda
        const quantity = order.finalQuantityProduct; // o el campo de cantidad final

        if (!dateString || quantity == null) {
          return acc;
        }
        
        const date = parseISO(dateString);
        const year = getYear(date);
        const month = getMonth(date) + 1; // getMonth es 0-indexado
        const key = `${year}-${month}`;

        if (!acc[key]) {
          acc[key] = { year, month, unitsProduced: 0 };
        }
        
        acc[key].unitsProduced += Number(quantity) || 0;
        
        return acc;
      }, {});

      return Object.values(summary);

    } catch (error) {
      console.error("Error creating production monthly summary:", error);
      return []; // Devolver array vacío en caso de error
    }
  },
};

export default ProductionAnalyticsService;