import React, { useState, useEffect, useMemo } from 'react';
import {
    DollarSign, Users, Truck, PackageCheck, Clock, Calendar, Award, BarChart2, PieChart as LucidePieChart, TrendingUp, TrendingDown,
    Cog, BookOpen, UserCheck, Edit3, MoreHorizontal, FileText, Users2, Home, Car, Laptop, Bike, CreditCard, Percent, Utensils, UserCog, LineChart, ListChecks, Briefcase, TrendingUpIcon, BarChartHorizontalBig
} from 'lucide-react';

// --- Componentes Separados ---
import StatCardFinance from './StatCardFinance';
import ChartPlaceholder from './ChartPlaceholder';
import ProgressBar from './ProgressBar';

// --- Servicios ---
import clientesService from '../../services/clientesService'; // Para tipo de cliente en reservas
import proveedorService from '../../services/proveedorSevice';
import registerPurchaseService from '../../services/registroCompraService';
import reservasService from '../../services/reservasService';
// import ConceptSpentService from '../../services/conceptSpent.service'; // Podría usarse para nombres de categorías de gastos
import MonthlyOverallExpenseService from '../../services/gastosGeneralesService'; // Para gastos

// Asumimos que tienes un servicio de empleados para obtener la lista y categorías, si no, lo simulamos
// import empleadoService from '../../services/empleadoService';

import '../../../assets/css/dashboard.css'; // CSS Principal

const Dashboard = () => {
  const [userName, setUserName] = useState("Usuario"); // Puedes obtener esto de tu auth context
  const [selectedSection, setSelectedSection] = useState('labor'); // O 'bonus' si quieres que esa sea la vista inicial
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para los datos de cada módulo
  const [bonusData, setBonusData] = useState(null);
  const [laborData, setLaborData] = useState(null);
  const [reservasData, setReservasData] = useState(null);
  const [proveedoresData, setProveedoresData] = useState(null);

  // Para nombres de categorías de gastos (si los tienes por ID)
  // const [expenseConcepts, setExpenseConcepts] = useState([]);

  const availableYears = useMemo(() => Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 2 + i).toString()), []);
  const availableMonths = useMemo(() => [
    { value: 1, label: 'Ene' }, { value: 2, label: 'Feb' }, { value: 3, label: 'Mar' },
    { value: 4, label: 'Abr' }, { value: 5, label: 'May' }, { value: 6, label: 'Jun' },
    { value: 7, label: 'Jul' }, { value: 8, label: 'Ago' }, { value: 9, label: 'Sep' },
    { value: 10, label: 'Oct' }, { value: 11, label: 'Nov' }, { value: 12, label: 'Dic' }
  ], []);

  // --- FUNCIONES DE PROCESAMIENTO DE DATOS ---
  const processBonusData = async (year, month) => {
    try {
      // 1. Ventas del mes (NECESITAS UN SERVICIO PARA ESTO)
      const ventasMesActual = 75000; // Placeholder - Reemplazar con llamada real
      
      // 2. Costo de mano de obra (Asumimos un ID de tipo de gasto para "Mano de Obra")
      //    Necesitarías mapear "Mano de Obra" a un idExpenseType
      const ID_TIPO_GASTO_MANO_OBRA = 1; // Placeholder - Reemplaza con el ID real
      let costoManoObraMesActual = 0;
      try {
        const moData = await MonthlyOverallExpenseService.getTotalExpenseByTypeAndMonth(year, month, ID_TIPO_GASTO_MANO_OBRA);
        costoManoObraMesActual = moData.totalExpense || 0;
      } catch (e) { console.warn("No se pudo obtener costo de MO para bonus:", e); }

      // 3. Número total de reservas
      const allReservations = await reservasService.getAllReservations(); // O un endpoint que cuente por mes/año
      const reservasMesActual = allReservations.filter(r => {
        const resDate = new Date(r.dateTime);
        return resDate.getFullYear() === parseInt(year) && (resDate.getMonth() + 1) === parseInt(month);
      }).length;

      // 4. Costo total en insumos (Asumimos un ID de tipo de gasto para "Insumos/Compras")
      const ID_TIPO_GASTO_INSUMOS = 2; // Placeholder - Reemplaza con el ID real
      let costoInsumosMesActual = 0;
      try {
        const insumosData = await MonthlyOverallExpenseService.getTotalExpenseByTypeAndMonth(year, month, ID_TIPO_GASTO_INSUMOS);
        costoInsumosMesActual = insumosData.totalExpense || 0;
      } catch (e) { console.warn("No se pudo obtener costo de insumos para bonus:", e); }
      
      // 5. Índice de eficiencia operativa (Placeholder - Requiere datos específicos)
      const eficienciaOperativa = 92.5; // Placeholder

      return {
        ventasMesActual,
        costoManoObraPct: ventasMesActual > 0 ? (costoManoObraMesActual / ventasMesActual) * 100 : 0,
        numeroTotalReservas: reservasMesActual,
        costoTotalInsumos: costoInsumosMesActual,
        eficienciaOperativa,
      };
    } catch (err) {
      console.error("Error procesando datos de Bonus:", err);
      return { error: "No se pudieron cargar los indicadores generales." };
    }
  };
  
  const processLaborData = async (year, month) => {
    try {
        const ID_TIPO_GASTO_MANO_OBRA = 1; // Placeholder
        const currentMonthExpenses = await MonthlyOverallExpenseService.getTotalExpenseByTypeAndMonth(year, month, ID_TIPO_GASTO_MANO_OBRA).catch(() => ({ totalExpense: 0 }));
        
        const prevMonth = month === 1 ? 12 : month - 1;
        const prevYear = month === 1 ? year - 1 : year;
        const previousMonthExpenses = await MonthlyOverallExpenseService.getTotalExpenseByTypeAndMonth(prevYear, prevMonth, ID_TIPO_GASTO_MANO_OBRA).catch(() => ({ totalExpense: 0 }));
        
        const gastoMensualTotal = currentMonthExpenses.totalExpense;
        const gastoMesAnteriorTotal = previousMonthExpenses.totalExpense;
        let gastoMesAnteriorPct = 0;
        if (gastoMesAnteriorTotal > 0) {
            gastoMesAnteriorPct = ((gastoMensualTotal - gastoMesAnteriorTotal) / gastoMesAnteriorTotal) * 100;
        } else if (gastoMensualTotal > 0) {
            gastoMesAnteriorPct = 100; // Si antes era 0 y ahora hay gasto, es 100% de aumento
        }

        // Gasto Bimestral Promedio (mes actual y anterior)
        const gastoBimestralPromedio = (gastoMensualTotal + gastoMesAnteriorTotal) / 2;

        // Comparativa vs Ingresos (Necesitas ventas)
        const ventasMesActual = bonusData?.ventasMesActual || 75000; // Usar del bonus o placeholder
        const gastoVsIngresosPct = ventasMesActual > 0 ? (gastoMensualTotal / ventasMesActual) * 100 : 0;

        // Distribución por categoría (NECESITAS DETALLE DE GASTOS DE MO POR CATEGORÍA)
        // Esto es un placeholder. MonthlyOverallExpenseService.getAllMonthlyOverallExpenses y filtrar por tipo MO
        // luego agrupar por sub-categoría si tu modelo de datos lo permite.
        const distribucionCategoria = [
            { categoria: 'Cocina', porcentaje: 60, color: 'var(--accent-purple-finance)' },
            { categoria: 'Meseros', porcentaje: 30, color: 'var(--accent-blue-finance)' },
            { categoria: 'Limpieza', porcentaje: 10, color: 'var(--accent-teal-finance)' },
        ];
        
        // Rendimiento Empleados (PLACEHOLDER - REQUIERE SERVICIO ESPECÍFICO)
        const rendimientoEmpleados = [
            { id: 1, nombre: 'Ana Pérez', productosManejados: 'Tomates, Cebollas', tiempoPromedio: 15, precisionPorciones: 95 },
            { id: 2, nombre: 'Luis Gómez', productosManejados: 'Carnes, Pollo', tiempoPromedio: 12, precisionPorciones: 98 },
        ];

        return {
            gastoMensualTotal,
            gastoMesAnteriorPct,
            gastoBimestralPromedio,
            gastoVsIngresosPct,
            distribucionCategoria,
            rendimientoEmpleados,
        };
    } catch (err) {
        console.error("Error procesando datos de Mano de Obra:", err);
        return { error: "No se pudieron cargar los datos de mano de obra." };
    }
  };

  const processReservasData = async (year, month) => {
    try {
        const allReservations = await reservasService.getAllReservations();
        const allClientes = await clientesService.getAllClientes(); // Para segmentación

        const clienteMap = new Map(allClientes.map(c => [c.id, c]));

        const reservationsInPeriod = allReservations.filter(r => {
            const resDate = new Date(r.dateTime);
            return resDate.getFullYear() === parseInt(year); // Podrías filtrar por mes también si es mucho dato
        });

        // Reservas por Mes (últimos 6 meses contando hacia atrás desde el mes seleccionado)
        const reservasPorMes = Array(6).fill(null).map((_, i) => {
            let targetMonth = parseInt(month) - i;
            let targetYear = parseInt(year);
            if (targetMonth <= 0) {
                targetMonth += 12;
                targetYear -= 1;
            }
            const count = reservationsInPeriod.filter(r => {
                const resDate = new Date(r.dateTime);
                return resDate.getFullYear() === targetYear && (resDate.getMonth() + 1) === targetMonth;
            }).length;
            return { mes: availableMonths.find(m => m.value === targetMonth)?.label || 'N/A', cantidad: count, color: 'var(--accent-blue-finance)' };
        }).reverse();
        
        const currentMonthReservations = reservationsInPeriod.filter(r => {
            const resDate = new Date(r.dateTime);
            return (resDate.getMonth() + 1) === parseInt(month) && resDate.getFullYear() === parseInt(year);
        });
        const prevMonthDate = new Date(year, month - 2, 1); // Mes anterior al actual
        const prevMonthReservationsCount = reservationsInPeriod.filter(r => {
             const resDate = new Date(r.dateTime);
             return resDate.getFullYear() === prevMonthDate.getFullYear() && (resDate.getMonth() + 1) === (prevMonthDate.getMonth() + 1);
        }).length;

        let crecimientoReservasPct = 0;
        if (prevMonthReservationsCount > 0) {
            crecimientoReservasPct = ((currentMonthReservations.length - prevMonthReservationsCount) / prevMonthReservationsCount) * 100;
        } else if (currentMonthReservations.length > 0) {
            crecimientoReservasPct = 100;
        }


        // Tipo de Cliente
        const tiposClienteCounts = currentMonthReservations.reduce((acc, r) => {
            const cliente = clienteMap.get(r.idCustomers);
            const categoria = cliente?.CategoriaCliente || 'Desconocido';
            acc[categoria] = (acc[categoria] || 0) + 1;
            return acc;
        }, {});
        const totalClientesMes = currentMonthReservations.length;
        const tiposCliente = Object.entries(tiposClienteCounts).map(([tipo, count], idx) => ({
            tipo,
            porcentaje: totalClientesMes > 0 ? (count / totalClientesMes) * 100 : 0,
            // Asignar colores dinámicamente o tener una paleta predefinida
            color: ['var(--accent-purple-finance)', 'var(--accent-green-finance)', 'var(--accent-orange-finance)', 'var(--accent-pink-finance)'][idx % 4]
        }));

        // Reservas Activas Hoy
        const today = new Date();
        today.setHours(0,0,0,0);
        const endOfWeek = new Date(today);
        endOfWeek.setDate(today.getDate() + 6); // Próximos 7 días
        endOfWeek.setHours(23,59,59,999);

        const listaReservasActivas = currentMonthReservations.filter(r => {
            const resDate = new Date(r.dateTime);
            return resDate >= today && resDate <= endOfWeek && (r.status === true || r.status === 'confirmada' || r.status === 'en_proceso'); // Ajusta según tu lógica de status
        }).sort((a,b) => new Date(a.dateTime) - new Date(b.dateTime))
        .map(r => ({
             id: r.idReservations, // Asegúrate de tener un ID único
             cliente: clienteMap.get(r.idCustomers)?.NombreCompleto || `Cliente ID: ${r.idCustomers}`,
             personas: r.numberPeople,
             hora: new Date(r.dateTime).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit'}),
             fecha: new Date(r.dateTime).toLocaleDateString('es-CO')
        }));
        
        const reservasActivasHoyCount = listaReservasActivas.filter(r => new Date(r.fecha).toDateString() === today.toDateString()).length;


        // Capacidad Reservada (Necesitas la capacidad total del restaurante)
        const CAPACIDAD_TOTAL_RESTAURANTE = 100; // Placeholder - Número de personas
        const personasEnReservasActivasHoy = listaReservasActivas
            .filter(r => new Date(r.fecha).toDateString() === today.toDateString())
            .reduce((sum, r) => sum + r.personas, 0);
        const capacidadReservadaPct = CAPACIDAD_TOTAL_RESTAURANTE > 0 ? (personasEnReservasActivasHoy / CAPACIDAD_TOTAL_RESTAURANTE) * 100 : 0;

        return {
            reservasPorMes,
            crecimientoReservasPct,
            tiposCliente,
            reservasActivasHoy: reservasActivasHoyCount, // O listaReservasActivas.length si es para la semana
            capacidadReservadaPct,
            listaReservasActivas, // Para mostrar las próximas
        };
    } catch (err) {
        console.error("Error procesando datos de Reservas:", err);
        return { error: "No se pudieron cargar los datos de reservas." };
    }
  };

  const processProveedoresData = async (year, month) => {
    try {
        const allProviders = await proveedorService.getAllProveedores();
        const allPurchases = await registerPurchaseService.getAllRegisterPurchasesWithDetails(); // Asume que trae todas

        // Filtra compras por el periodo seleccionado (año y mes)
        const purchasesInPeriod = allPurchases.filter(p => {
            const purchaseDate = new Date(p.date); // Asumiendo que 'p.date' es la fecha de la compra
            return purchaseDate.getFullYear() === parseInt(year) && (purchaseDate.getMonth() + 1) === parseInt(month);
        });

        const proveedoresActivos = allProviders.map(provider => {
            const providerPurchases = purchasesInPeriod.filter(p => p.provider?.idProvider === provider.idProvider);
            let ultimaCompra = null;
            let costoTotalItems = 0;
            let cantidadItems = 0;

            if (providerPurchases.length > 0) {
                ultimaCompra = providerPurchases.sort((a, b) => new Date(b.date) - new Date(a.date))[0].date;
                providerPurchases.forEach(purchase => {
                    purchase.purchaseDetails?.forEach(detail => { // purchaseDetails es un array
                        costoTotalItems += (detail.quantity * detail.unitPrice);
                        cantidadItems += detail.quantity; // O contar detalles si costoPromedioItem es por tipo de item diferente
                    });
                });
            }
            return {
                id: provider.idProvider,
                nombre: provider.name, // Asume 'name', ajusta a tu modelo de proveedor
                tipo: provider.providerType || 'Varios', // Asume 'providerType'
                ultimaCompra: ultimaCompra ? new Date(ultimaCompra).toLocaleDateString('es-CO') : 'N/A',
                frecuencia: provider.billingCycle || 'Según Pedido', // Asume 'billingCycle' o similar
                costoPromedioItem: cantidadItems > 0 ? costoTotalItems / cantidadItems : 0,
            };
        }).filter(p => p.ultimaCompra !== 'N/A'); // Solo proveedores con compras en el periodo

        // Historial de Insumo Destacado (Ej: Tomate)
        // Necesitarías un input para seleccionar el insumo, o elegir uno por defecto
        const INSUMO_DESTACADO_NOMBRE = "Tomate"; // Placeholder
        const historialInsumoDestacado = {
            nombreInsumo: INSUMO_DESTACADO_NOMBRE,
            datos: []
        };
        // Simular variación de precios para el gráfico de línea (requiere procesar 'allPurchases' para el insumo específico a lo largo del tiempo)
        // Esto es un placeholder para el gráfico de variación de precios.
        // Deberías agrupar las compras del INSUMO_DESTACADO_NOMBRE por mes/fecha y sacar el precio promedio.
        const allPurchasesForInsumo = allPurchases.flatMap(p => 
            p.purchaseDetails
             .filter(d => d.insumo?.name === INSUMO_DESTACADO_NOMBRE) // Asume que insumo tiene 'name'
             .map(d => ({ date: new Date(p.date), cost: d.unitPrice}))
        ).sort((a,b) => a.date - b.date);

        // Para el gráfico, podríamos agrupar por mes de los últimos 6 meses
        historialInsumoDestacado.datos = Array(6).fill(null).map((_, i) => {
            let targetMonth = parseInt(month) - i;
            let targetYear = parseInt(year);
            if (targetMonth <= 0) { targetMonth += 12; targetYear -= 1; }
            
            const purchasesInMonthForInsumo = allPurchasesForInsumo.filter(p => 
                p.date.getFullYear() === targetYear && (p.date.getMonth() + 1) === targetMonth
            );
            const avgCost = purchasesInMonthForInsumo.length > 0 
                ? purchasesInMonthForInsumo.reduce((sum, p) => sum + p.cost, 0) / purchasesInMonthForInsumo.length
                : null;

            return { fecha: availableMonths.find(m => m.value === targetMonth)?.label || 'N/A', costo: avgCost, color: 'var(--accent-orange-finance)' };
        }).reverse().filter(d => d.costo !== null);


        // Historial Compras Insumo (ejemplo: las últimas compras del insumo destacado)
        const historialComprasTabla = allPurchases
            .filter(p => p.purchaseDetails?.some(d => d.insumo?.name === INSUMO_DESTACADO_NOMBRE))
            .slice(0, 5) // Tomar las últimas 5 compras que contengan el insumo
            .map(p => {
                const detail = p.purchaseDetails.find(d => d.insumo?.name === INSUMO_DESTACADO_NOMBRE);
                return {
                    id: p.idPurchase, // O un ID único de la línea de detalle
                    fecha: new Date(p.date).toLocaleDateString('es-CO'),
                    cantidad: detail?.quantity || 0,
                    costoU: detail?.unitPrice || 0,
                    total: (detail?.quantity || 0) * (detail?.unitPrice || 0),
                    proveedor: p.provider?.name // Asume que el provider está en la compra
                };
            });


        return {
            activos: proveedoresActivos,
            historialInsumoDestacado,
            historialComprasTabla // Para la tabla de ejemplo
        };
    } catch (err) {
        console.error("Error procesando datos de Proveedores:", err);
        return { error: "No se pudieron cargar los datos de proveedores." };
    }
  };


  // --- Carga de Datos ---
  useEffect(() => {
    const loadAllDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      let bonusRes, laborRes, reservasRes, proveedoresRes;

      // Cargar datos para el Bonus primero si es necesario para otros módulos
      bonusRes = await processBonusData(selectedYear, selectedMonth);
      setBonusData(bonusRes);

      // Cargar datos para los módulos principales
      // Usar Promise.allSettled para que todas las llamadas se intenten
      const results = await Promise.allSettled([
        processLaborData(selectedYear, selectedMonth),
        processReservasData(selectedYear, selectedMonth),
        processProveedoresData(selectedYear, selectedMonth),
        // ConceptSpentService.getAllConceptSpents() // Si necesitas los nombres de los conceptos
      ]);

      laborRes = results[0].status === 'fulfilled' ? results[0].value : { error: results[0].reason?.message || "Error Labor" };
      reservasRes = results[1].status === 'fulfilled' ? results[1].value : { error: results[1].reason?.message || "Error Reservas" };
      proveedoresRes = results[2].status === 'fulfilled' ? results[2].value : { error: results[2].reason?.message || "Error Proveedores"};
      
      // if (results[3].status === 'fulfilled') setExpenseConcepts(results[3].value);

      setLaborData(laborRes);
      setReservasData(reservasRes);
      setProveedoresData(proveedoresRes);
      
      // Verificar si hubo algún error global para mostrar un mensaje genérico
      if (bonusRes?.error || laborRes?.error || reservasRes?.error || proveedoresRes?.error) {
          setError("Error al cargar algunos datos del dashboard. Algunos módulos pueden no mostrar información completa.");
      }

      setIsLoading(false);
    };

    loadAllDashboardData();
  }, [selectedYear, selectedMonth]); // Recargar si cambian año/mes

  // --- Utilidades de Formato (sin cambios) ---
  const formatCurrency = (value, decimals = 0) => value != null ? `$${Number(value).toLocaleString('es-CO', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}` : '$0';
  const formatNumber = (value) => value != null ? Number(value).toLocaleString('es-CO') : '0';
  const formatPercentage = (value, addPlusSign = false, decimals = 1) => {
    if (value == null) return '0%';
    const numValue = Number(value);
    const sign = addPlusSign && numValue > 0 ? '+' : '';
    return `${sign}${numValue.toFixed(decimals)}%`;
  }

  // --- Navegación ---
  const navigationTabs = [
    { id: 'labor', label: 'Mano de Obra', icon: UserCog },
    { id: 'reservas', label: 'Reservas', icon: Calendar },
    { id: 'proveedores', label: 'Proveedores', icon: Truck },
  ];

  // --- RENDERIZADO DE SECCIONES ---

  const renderBonusSection = () => {
    if (!bonusData || bonusData.error) return <div className="content-card-finance text-center py-5 text-red-500">{bonusData?.error || "Cargando indicadores..."}</div>;
    
    const { ventasMesActual, costoManoObraPct, numeroTotalReservas, costoTotalInsumos, eficienciaOperativa } = bonusData;

    return (
      <div className="mb-[var(--content-padding-finance)] animate-fadeIn">
        <div className="page-header-finance mb-2"> {/* Menos margen inferior para el header del bonus */}
          <h1 className="text-xl">¡Bienvenido de nuevo, {userName}!</h1>
          <p className="text-sm">Resumen general del restaurante para {availableMonths.find(m=>m.value===parseInt(selectedMonth))?.label} {selectedYear}.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-[var(--element-padding-finance)]"> {/* Ajustado a 5 o 3 */}
          <StatCardFinance title="Ventas del Mes" value={formatCurrency(ventasMesActual)} icon={DollarSign} />
          <StatCardFinance title="Costo M.O." value={formatPercentage(costoManoObraPct)} icon={Percent} />
          <StatCardFinance title="Nº Reservas" value={formatNumber(numeroTotalReservas)} icon={Calendar} />
          <StatCardFinance title="Costo Insumos" value={formatCurrency(costoTotalInsumos)} icon={PackageCheck} />
          <StatCardFinance title="Eficiencia Op." value={formatPercentage(eficienciaOperativa)} icon={Award} />
        </div>
      </div>
    );
  };

  const renderLaborSection = () => {
    if (!laborData) return <ChartPlaceholder text="Cargando datos de mano de obra..." />;
    if (laborData.error) return <div className="content-card-finance text-center py-5 text-red-500">{laborData.error}</div>;

    const { gastoMensualTotal, gastoMesAnteriorPct, gastoBimestralPromedio, gastoVsIngresosPct, distribucionCategoria = [], rendimientoEmpleados = [] } = laborData;
    
    // const empleadosOrdenadosPorPrecision = [...rendimientoEmpleados].sort((a, b) => b.precisionPorciones - a.precisionPorciones);
    const empleadosOrdenadosPorTiempo = [...rendimientoEmpleados].sort((a, b) => a.tiempoPromedio - b.tiempoPromedio);


    return (
      <div className="animate-fadeIn">
        <div className="page-header-finance">
          <h1>Módulo: Mano de Obra</h1>
          <p>Eficiencia operativa y control de costos de personal.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[var(--content-padding-finance)]">
          <StatCardFinance title="Gasto Mensual M.O." value={formatCurrency(gastoMensualTotal, 2)} changePercent={formatPercentage(gastoMesAnteriorPct, true)} changeDirection={gastoMesAnteriorPct > 0 ? 'down' : 'up'} >
            <p className="text-xs text-text-tertiary-finance mt-1">Promedio Bimestral: {formatCurrency(gastoBimestralPromedio,0)}</p>
          </StatCardFinance>
          
          <StatCardFinance title="M.O. vs Ingresos" value={formatPercentage(gastoVsIngresosPct)} icon={Percent}>
             <ChartPlaceholder text="Mini-gráfico de tendencia M.O vs Ingresos" />
          </StatCardFinance>

          <StatCardFinance title="Distribución Gastos M.O." icon={LucidePieChart}>
            {distribucionCategoria.length > 0 ? (
                <>
                    <ChartPlaceholder text="Gráfico de Pastel: Distribución por Categoría" />
                    <div className="chart-legend-finance mt-2">
                    {distribucionCategoria.map(cat => (
                        <span key={cat.categoria} className="chart-legend-item"><span className="legend-dot" style={{backgroundColor: cat.color}}></span>{cat.categoria} ({formatPercentage(cat.porcentaje)})</span>
                    ))}
                    </div>
                </>
            ) : <p className="text-xs text-text-tertiary-finance">No hay datos de distribución.</p>}
          </StatCardFinance>
        </div>
        {/* Sección de Rendimiento de Empleados */}
        <div className="content-card-finance mt-[var(--content-padding-finance)]">
            <h3 className="text-lg font-semibold text-text-primary-finance mb-3">Rendimiento de Empleados</h3>
            <p className="text-sm text-text-secondary-finance mb-4"> (Datos de ejemplo. Se requiere un servicio backend para información real sobre manejo de insumos, tiempos y precisión)</p>
            
            <div className="overflow-x-auto mb-6">
                <table className="dashboard-table-finance w-full">
                    <thead><tr><th>Empleado</th><th>Productos/Insumos Clave</th><th>Tiempo Prom. Prep.</th><th>Precisión Porciones</th></tr></thead>
                    <tbody>
                        {rendimientoEmpleados.length > 0 ? rendimientoEmpleados.map(e =>(
                            <tr key={e.id}>
                                <td style={{color: 'var(--text-primary-finance)'}}>{e.nombre}</td>
                                <td className="text-xs">{e.productosManejados}</td>
                                <td>{e.tiempoPromedio} min</td>
                                <td className={e.precisionPorciones >= 95 ? 'text-green-500' : e.precisionPorciones >= 90 ? 'text-yellow-500' : 'text-red-500' }>{formatPercentage(e.precisionPorciones, false, 0)}</td>
                            </tr>
                        )) : (
                            <tr><td colSpan="4" className="text-center py-4">No hay datos de rendimiento de empleados.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--content-padding-finance)]">
                <StatCardFinance title="Desviación en Porciones (Ejemplo)" icon={BarChartHorizontalBig}>
                    <ChartPlaceholder text="Gráfico Barras: Empleados con mayor desviación" />
                </StatCardFinance>
                <StatCardFinance title="Ranking Tiempos Preparación (Top 3 Ejemplo)" icon={Clock}>
                    {empleadosOrdenadosPorTiempo.length > 0 ? (
                        <ul className="text-xs space-y-1 mt-2">
                            {empleadosOrdenadosPorTiempo.slice(0,3).map((e,i) => (
                                <li key={e.id} className="flex justify-between">
                                    <span>{i+1}. {e.nombre}</span>
                                    <span className="font-medium">{e.tiempoPromedio} min</span>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-xs text-text-tertiary-finance">No hay datos de tiempos.</p>}
                </StatCardFinance>
            </div>
        </div>
      </div>
    );
  };

  const renderReservasSection = () => {
    if (!reservasData) return <ChartPlaceholder text="Cargando datos de reservas..." />;
    if (reservasData.error) return <div className="content-card-finance text-center py-5 text-red-500">{reservasData.error}</div>;

    const { reservasPorMes = [], crecimientoReservasPct, tiposCliente = [], reservasActivasHoy, capacidadReservadaPct, listaReservasActivas = [] } = reservasData;

    return (
      <div className="animate-fadeIn">
        <div className="page-header-finance">
          <h1>Módulo: Reservas</h1>
          <p>Comportamiento de clientes y previsión de demanda.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[var(--content-padding-finance)]">
            <div className="lg:col-span-2">
                <StatCardFinance title="Reservas por Mes (Últimos 6M)" icon={BarChart2} changePercent={formatPercentage(crecimientoReservasPct, true)} changeDirection={crecimientoReservasPct >= 0 ? 'up':'down'}>
                   {reservasPorMes.length > 0 ? <ChartPlaceholder text="Gráfico de Barras: Cantidad de reservas/mes" /> : <p className="text-xs text-text-tertiary-finance">No hay datos de reservas por mes.</p> }
                   {/* Aquí puedes renderizar el gráfico real pasando `reservasPorMes` */}
                </StatCardFinance>
            </div>

            <StatCardFinance title="Tipo de Cliente (Mes Actual)" icon={Users}>
                {tiposCliente.length > 0 ? (
                    <>
                        <ChartPlaceholder text="Gráfico Pastel: % Reservas por tipo cliente" />
                        <div className="chart-legend-finance grid grid-cols-2 gap-1 mt-2">
                            {tiposCliente.map(tc => (
                            <span key={tc.tipo} className="chart-legend-item"><span className="legend-dot" style={{backgroundColor: tc.color}}></span>{tc.tipo} ({formatPercentage(tc.porcentaje)})</span>
                            ))}
                        </div>
                    </>
                ): <p className="text-xs text-text-tertiary-finance">No hay datos de tipos de cliente.</p>}
            </StatCardFinance>

            <StatCardFinance title="Reservas Activas Hoy" value={formatNumber(reservasActivasHoy)} icon={ListChecks}>
                <ProgressBar value={capacidadReservadaPct} max={100} label={`Capacidad Reservada (${formatPercentage(capacidadReservadaPct, false, 0)})`} barColor="var(--accent-green-finance)"/>
            </StatCardFinance>
            
            <div className="lg:col-span-2"> {/* Ajustado para que la lista de reservas ocupe más espacio */}
                <div className="content-card-finance" style={{ minHeight: '200px' }}> {/* Alto mínimo para la tarjeta */}
                    <h3 className="text-lg font-semibold text-text-primary-finance mb-3">Próximas Reservas (Hoy y Semana)</h3>
                    {listaReservasActivas.length > 0 ? (
                        <ul className="space-y-2 text-sm max-h-60 overflow-y-auto"> {/* Scroll si hay muchas */}
                            {listaReservasActivas.slice(0,10).map((res) => ( // Mostrar hasta 10
                                <li key={res.id} className="flex justify-between items-center p-2 rounded bg-gray-50 hover:bg-gray-100">
                                    <div>
                                        <span className="font-medium" style={{color: 'var(--text-primary-finance)'}}>{res.cliente} ({res.personas}p)</span>
                                        <span className="block text-xs text-text-tertiary-finance">{res.fecha}</span>
                                    </div>
                                    <span className="text-text-secondary-finance font-medium">{res.hora}</span>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-sm text-text-secondary-finance">No hay reservas activas para mostrar.</p>}
                </div>
            </div>
        </div>
      </div>
    );
  };
  
  const renderProveedoresSection = () => {
    if (!proveedoresData) return <ChartPlaceholder text="Cargando datos de proveedores..." />;
    if (proveedoresData.error) return <div className="content-card-finance text-center py-5 text-red-500">{proveedoresData.error}</div>;

    const { activos = [], historialInsumoDestacado, historialComprasTabla = [] } = proveedoresData;

    return (
      <div className="animate-fadeIn">
        <div className="page-header-finance">
          <h1>Módulo: Proveedores</h1>
          <p>Gestión de relaciones, rendimiento y control de insumos.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[var(--content-padding-finance)]">
            <div className="lg:col-span-2">
                 <div className="content-card-finance">
                    <h3 className="text-lg font-semibold text-text-primary-finance mb-3">Proveedores Activos (Top {activos.slice(0,5).length} en el período)</h3>
                    {activos.length > 0 ? (
                        <ul className="space-y-3">
                            {activos.slice(0,5).map(prov => (
                                <li key={prov.id} className="p-3 rounded-md border border-border-color-finance hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-center mb-1">
                                        <h4 className="font-semibold" style={{color: 'var(--text-primary-finance)'}}>{prov.nombre}</h4>
                                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">{prov.frecuencia}</span>
                                    </div>
                                    <p className="text-xs text-text-secondary-finance">Tipo: {prov.tipo}</p>
                                    <p className="text-xs text-text-secondary-finance">Última compra: {prov.ultimaCompra} / Costo Prom. Item: {formatCurrency(prov.costoPromedioItem,2)}</p>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-sm text-text-secondary-finance">No hay proveedores con compras en el período seleccionado.</p>}
                </div>
            </div>

            <StatCardFinance title={`Variación Precio ${historialInsumoDestacado?.nombreInsumo || 'Insumo X'}`} icon={TrendingUpIcon}>
                 {historialInsumoDestacado && historialInsumoDestacado.datos.length > 0 ? (
                    <>
                        <ChartPlaceholder text={`Gráfico de Línea: Variación de precios ${historialInsumoDestacado.nombreInsumo}`} />
                        {/* Aquí renderizarías el gráfico de línea con historialInsumoDestacado.datos */}
                        <div className="chart-legend-finance mt-2">
                            <span className="chart-legend-item"><span className="legend-dot" style={{backgroundColor: historialInsumoDestacado.datos[0]?.color || 'var(--accent-orange-finance)'}}></span>
                                Costo Unitario Prom.
                            </span>
                        </div>
                    </>
                 ) : <p className="text-xs text-text-tertiary-finance">No hay datos de variación de precios para {historialInsumoDestacado?.nombreInsumo || 'el insumo seleccionado'}.</p>}
            </StatCardFinance>
            
            <div className="lg:col-span-3 content-card-finance">
                <h3 className="text-lg font-semibold text-text-primary-finance mb-3">
                    Historial Compras ({historialComprasTabla.length > 0 ? `${historialInsumoDestacado?.nombreInsumo || 'Insumo Ejemplo'} de Proveedor X` : 'Ejemplo'})
                </h3>
                {historialComprasTabla.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="dashboard-table-finance w-full">
                            <thead><tr><th>Fecha</th><th>Proveedor</th><th>Cantidad</th><th>Costo Unit.</th><th>Total</th></tr></thead>
                            <tbody>
                                {historialComprasTabla.map((item,i) => (
                                    <tr key={item.id || i}>
                                        <td>{item.fecha}</td>
                                        <td className="text-xs">{item.proveedor || 'N/A'}</td>
                                        <td>{item.cantidad} uds.</td>
                                        <td>{formatCurrency(item.costoU,2)}</td>
                                        <td style={{color: 'var(--text-primary-finance)'}}>{formatCurrency(item.total,2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : <p className="text-sm text-text-secondary-finance">No hay historial de compras para el insumo en este período.</p>}
            </div>
        </div>
      </div>
    );
  };


  // --- Estructura Principal del Layout ---
  return (
    <div className="dashboard-layout">
      <header className="app-header"> {/* Asumo que tienes CSS para app-header en headerDashboard.css */}
        <div className="header-left">
          <Briefcase size={28} className="text-accent-blue-finance mr-3"/> {/* Icono del Restaurante */}
          <nav className="app-navigation">
            <ul>
              {navigationTabs.map(tab => (
                <li key={tab.id}>
                  <button
                    onClick={() => setSelectedSection(tab.id)}
                    className={`nav-button ${selectedSection === tab.id ? 'active' : ''}`}
                  >
                    {tab.icon && <tab.icon size={16} />}
                    {tab.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="header-right">
          <div className="date-filters flex items-center gap-2">
            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="p-2 text-sm rounded border border-border-color-finance bg-button-bg-finance text-button-text-finance focus:outline-none focus:ring-1 focus:ring-accent-blue-finance">
              {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
            </select>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="p-2 text-sm rounded border border-border-color-finance bg-button-bg-finance text-button-text-finance focus:outline-none focus:ring-1 focus:ring-accent-blue-finance">
              {availableMonths.map(month => <option key={month.value} value={month.value}>{month.label}</option>)}
            </select>
          </div>
        </div>
      </header>

      <main className="main-dashboard-content">
        {isLoading ? (
            <div className="flex justify-center items-center h-64"><Clock size={32} className="animate-spin" style={{color: 'var(--accent-blue-finance)'}} /> <p className="ml-3" style={{color: 'var(--text-secondary-finance)'}}>Cargando datos del dashboard...</p></div>
        ) : (
          <>
            {renderBonusSection()}
            {error && <div className="content-card-finance text-center py-3 text-sm text-red-600 bg-red-50 border border-red-200 mb-4">{error}</div>}
            
            {selectedSection === 'labor' && renderLaborSection()}
            {selectedSection === 'reservas' && renderReservasSection()}
            {selectedSection === 'proveedores' && renderProveedoresSection()}
            {/* Si no hay una sección seleccionada, puedes mostrar un mensaje o el primer módulo por defecto */}
            {!navigationTabs.find(t => t.id === selectedSection) && !isLoading && (
              <div className="content-card-finance">
                <p>Selecciona un módulo del menú superior para ver los detalles.</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;