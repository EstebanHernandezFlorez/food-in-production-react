// src/views/module/Dashboard/DashboardGeneralSection.jsx
import React, { useState, useEffect, useMemo } from 'react';
// --- IMPORTACIONES DE ICONOS ---
import {
    Users,
    DollarSign,
    PackageCheck,
    Clock,
    TrendingUp, // <--- ¡AÑADIDO TrendingUp AQUÍ!
    TrendingDown // Probablemente también necesites este para los KPIs
} from 'lucide-react';
// --- FIN IMPORTACIONES DE ICONOS ---

import StatCardFinance from './StatCardFinance';
import ChartPlaceholder from './ChartPlaceholder';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Servicios necesarios
import clientesService from '../../services/clientesService';
import monthlyOverallExpenseService from '../../services/MonthlyOverallExpenseService';
import productionOrderService from '../../services/ordenProduccionService';

const DashboardGeneralSection = ({ selectedYear, selectedMonth }) => {
  const [kpiData, setKpiData] = useState({
    activeClients: 0,
    totalExpensesMonth: 0,
    activeProductionOrders: 0,
    activeClientsChange: 0,
    totalExpensesMonthChange: 0,
    activeProductionOrdersChange: 0,
  });
  const [productSalesData, setProductSalesData] = useState([]);
  const [salesByCategoryData, setSalesByCategoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // ... (tus funciones formatCurrency, formatNumber, formatPercentage) ...
  const formatCurrency = (value, decimals = 0, currencySymbol = '$') => value != null ? `${currencySymbol}${Number(value).toLocaleString('es-CO', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}` : `${currencySymbol}0`;
  const formatNumber = (value) => value != null ? Number(value).toLocaleString('es-CO') : '0';
  const formatPercentage = (value, addPlusSign = false, decimals = 1) => {
    if (value == null || isNaN(Number(value))) return `0%`;
    const numValue = Number(value);
    const sign = addPlusSign && numValue > 0 ? '+' : (addPlusSign && numValue < 0 ? '' : '');
    return `${sign}${numValue.toFixed(decimals)}%`;
  };

  const availableMonths = useMemo(() => [
    { value: 1, label: 'Ene' }, { value: 2, label: 'Feb' }, { value: 3, label: 'Mar' },
    { value: 4, label: 'Abr' }, { value: 5, label: 'May' }, { value: 6, label: 'Jun' },
    { value: 7, label: 'Jul' }, { value: 8, label: 'Ago' }, { value: 9, label: 'Sep' },
    { value: 10, label: 'Oct' }, { value: 11, label: 'Nov' }, { value: 12, label: 'Dic' }
  ], []);

  const processProductSalesChart = async (year, month) => {
      const sales = [];
      const daysInMonth = new Date(year, month, 0).getDate();
      const currentMonthObject = availableMonths.find(m => m.value === parseInt(month));
      const monthLabel = currentMonthObject ? currentMonthObject.label : '';
      const daysToShow = Math.min(12, daysInMonth);
      const startDate = Math.max(1, daysInMonth - daysToShow + 1);
      for (let i = 0; i < daysToShow; i++) {
          const day = startDate + i;
          sales.push({
              name: `${day} ${monthLabel}`,
              'Margen Bruto': Math.floor(Math.random() * 40000) + 10000,
              'Ingresos': Math.floor(Math.random() * 60000) + 20000,
          });
      }
      await new Promise(resolve => setTimeout(resolve, 300));
      return sales;
  };

  const processSalesByCategoryChart = async (year, month) => {
      const categories = [
          { name: 'Sala', value: 25, color: '#8b5cf6' }, { name: 'Niños', value: 17, color: '#3b82f6' },
          { name: 'Oficina', value: 13, color: '#10b981' }, { name: 'Dormitorio', value: 12, color: '#6366f1' },
          { name: 'Cocina', value: 9, color: '#ef4444' }, { name: 'Baño', value: 8, color: '#f97316' },
          { name: 'Comedor', value: 6, color: '#eab308' }, { name: 'Decoración', value: 5, color: '#ec4899' }
      ];
      await new Promise(resolve => setTimeout(resolve, 400));
      return categories;
  };

  useEffect(() => {
    const fetchGeneralData = async () => {
      setIsLoading(true);
      setError(null);
      // console.log(`[DashboardGeneralSection] Fetching data for ${selectedYear}-${selectedMonth}`);
      try {
        const [clientsResult, expensesResult, ordersResult, salesChartResult, categoryChartResult] = await Promise.allSettled([
          clientesService.getAllClientes(),
          monthlyOverallExpenseService.getTotalExpenseByMonth(selectedYear, selectedMonth),
          productionOrderService.getAllOrders(),
          processProductSalesChart(selectedYear, selectedMonth),
          processSalesByCategoryChart(selectedYear, selectedMonth)
        ]);

        let newKpiData = {
          activeClients: 0, totalExpensesMonth: 0, activeProductionOrders: 0,
          activeClientsChange: (Math.random() * 10 - 5),
          totalExpensesMonthChange: (Math.random() * 15 - 7.5),
          activeProductionOrdersChange: (Math.random() * 20 - 10),
        };

        if (clientsResult.status === 'fulfilled' && Array.isArray(clientsResult.value)) {
          newKpiData.activeClients = clientsResult.value.filter(client => client.Estado === "Activo").length;
        } else {
          console.error("Error fetching clients:", clientsResult.reason);
        }

        if (expensesResult.status === 'fulfilled' && expensesResult.value && typeof expensesResult.value.totalExpense === 'number') {
          newKpiData.totalExpensesMonth = expensesResult.value.totalExpense;
        } else if (expensesResult.status === 'fulfilled' && typeof expensesResult.value === 'number') {
          newKpiData.totalExpensesMonth = expensesResult.value;
        } else {
          console.error("Error fetching expenses or unexpected format:", expensesResult.reason || expensesResult.value);
        }

        if (ordersResult.status === 'fulfilled' && Array.isArray(ordersResult.value)) {
          newKpiData.activeProductionOrders = ordersResult.value.filter(
            order => order.status === "activa" || order.status === "en_proceso" || order.status === "pendiente"
          ).length;
        } else {
          console.error("Error fetching production orders:", ordersResult.reason);
        }

        setKpiData(newKpiData);

        if (salesChartResult.status === 'fulfilled') setProductSalesData(salesChartResult.value);
        else console.error("Error fetching product sales chart:", salesChartResult.reason);

        if (categoryChartResult.status === 'fulfilled') setSalesByCategoryData(categoryChartResult.value);
        else console.error("Error fetching sales by category chart:", categoryChartResult.reason);

      } catch (err) {
        console.error("Critical error in fetchGeneralData:", err);
        setError("No se pudieron cargar todos los datos del dashboard.");
      } finally {
        setIsLoading(false);
      }
    };

    if (selectedYear && selectedMonth) {
        fetchGeneralData();
    }
  }, [selectedYear, selectedMonth, availableMonths]); // availableMonths es dependencia

  if (isLoading) {
    return (
      <div className="flup-content-loading-state">
        <Clock size={32} className="animate-spin-slow" />
        <p>Cargando Dashboard General...</p>
      </div>
    );
  }

  if (error) {
    return <div className="flup-content-error-state">{error}</div>;
  }

  return (
    <div className="animate-fadeIn">
      <div className="flup-kpi-grid">
        <StatCardFinance
          title="Clientes Activos"
          value={formatNumber(kpiData.activeClients)}
          icon={Users}
          changePercent={formatPercentage(kpiData.activeClientsChange, true)}
          changeDirection={kpiData.activeClientsChange >= 0 ? 'up' : 'down'}
        />
        <StatCardFinance
          title="Gastos del Mes"
          value={formatCurrency(kpiData.totalExpensesMonth)}
          icon={DollarSign}
          changePercent={formatPercentage(kpiData.totalExpensesMonthChange, true)}
          changeDirection={kpiData.totalExpensesMonthChange >= 0 ? 'up' : 'down'}
        />
        <StatCardFinance
          title="Órdenes Prod. Activas"
          value={formatNumber(kpiData.activeProductionOrders)}
          icon={PackageCheck}
          changePercent={formatPercentage(kpiData.activeProductionOrdersChange, true)}
          changeDirection={kpiData.activeProductionOrdersChange >= 0 ? 'up' : 'down'}
        />
        <StatCardFinance // Este es el KPI que usaba TrendingUp
            title="Ventas Netas Mes"
            value={formatCurrency(7850000)} // Valor simulado
            icon={TrendingUp} // Ahora TrendingUp está importado
            changePercent="+3.5%" // Valor simulado
            changeDirection="up" // Valor simulado
        />
      </div>

      {/* Sección de Gráficos */}
      <div className="flup-charts-section">
        <div className="flup-chart-container">
            <div className="chart-header"> <h3 className="chart-title">Ventas del Producto (Últimos 12 días)</h3> </div>
            {productSalesData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={productSalesData} margin={{top:5,right:10,left:-20,bottom:5}}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                        <XAxis dataKey="name" tick={{fontSize:11}} angle={-15} textAnchor="end" height={40}/>
                        <YAxis tickFormatter={(v)=>`${v/1000}K`} tick={{fontSize:11}}/>
                        <Tooltip formatter={(value, name)=>[formatCurrency(value,0), name]}/>
                        <Legend wrapperStyle={{fontSize: '12px', paddingTop: '10px'}} />
                        <Bar dataKey="Margen Bruto" fill="#3b82f6" radius={[4,4,0,0]} barSize={12}/>
                        <Bar dataKey="Ingresos" fill="#10b981" radius={[4,4,0,0]} barSize={12}/>
                    </BarChart>
                </ResponsiveContainer>
            ) : isLoading ? <ChartPlaceholder text="Cargando datos de ventas..." /> : <ChartPlaceholder text="No hay datos de ventas para mostrar." />}
        </div>
        <div className="flup-bottom-charts-grid">
            <div className="flup-chart-container">
                <h3 className="chart-title">Ventas por Categoría de Producto</h3>
                {salesByCategoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={salesByCategoryData} cx="50%" cy="50%" labelLine={false} outerRadius={100} innerRadius={60} dataKey="value" nameKey="name" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}>
                                {salesByCategoryData.map((entry,index)=><Cell key={`cell-${index}`} fill={entry.color}/>)}
                            </Pie>
                            <Tooltip formatter={(value,name,props)=>[`${props.payload.name}: ${value.toFixed(1)}%`]}/>
                            <Legend wrapperStyle={{fontSize: '12px', paddingTop: '10px'}} layout="vertical" verticalAlign="middle" align="right" />
                        </PieChart>
                    </ResponsiveContainer>
                ) : isLoading ? <ChartPlaceholder text="Cargando categorías..." /> : <ChartPlaceholder text="No hay datos de categorías para mostrar." />}
            </div>
            <div className="flup-chart-container">
                 <h3 className="chart-title">Ventas por Países (Simulado)</h3>
                 <ChartPlaceholder text="Mapa de Ventas por País (Visualización futura)" />
            </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardGeneralSection;