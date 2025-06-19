import React, { useCallback } from 'react';
import { DollarSign, BarChart2, TrendingUp, Layers, Clock, Users, Package, Sliders, AlertTriangle } from 'lucide-react';
import { 
    ResponsiveContainer, 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend, 
    RadialBarChart, 
    RadialBar, 
    Cell, 
    ComposedChart, 
    Line 
} from 'recharts';
import { subMonths, endOfMonth } from 'date-fns';

import { useDashboardSection } from '../hooks/useDashboardSection';
import StatCard from '../components/StatCard';
import ChartPlaceholder from '../components/ChartPlaceholder';
import { formatCurrency, formatPercentage } from '../utils/formatters';

// --- SERVICIOS ACTUALIZADOS ---
import DashboardService from '../../../services/DashboardService'; // ¡NUEVO! Para datos de dashboard
import MonthlyOverallExpenseService from '../../../services/MonthlyOverallExpenseService'; // Para el gasto total
import empleadoService from '../../../services/empleadoService';
import ProductionAnalyticsService from '../../../services/ProductionAnalyticsService';

// --- Componente CustomTooltip para los gráficos (sin cambios) ---
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    // Tooltip para el gráfico de Tendencia de Gastos (apilado)
    if (payload[0].payload.totalLaborCost === undefined) {
      const total = payload.reduce((sum, entry) => sum + entry.value, 0);
      return (
        <div className="custom-tooltip-finance">
          <p className="label">{label}</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {payload.map((entry, index) => (
              <li key={`item-${index}`} style={{ color: entry.color }}>
                {`${entry.name}: ${formatCurrency(entry.value)}`}
              </li>
            ))}
          </ul>
          <p className="total" style={{ fontWeight: 'bold', marginTop: '8px' }}>
            Total: {formatCurrency(total)}
          </p>
        </div>
      );
    }
    
    // Tooltip para el gráfico de Productividad (compuesto)
    return (
      <div className="custom-tooltip-finance">
        <p className="label">{label}</p>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {payload.map((entry, index) => {
            const formattedValue = entry.dataKey === 'unitsProduced' 
              ? `${entry.value} uds.` 
              : formatCurrency(entry.value);
            return (
              <li key={`item-${index}`} style={{ color: entry.stroke || entry.fill }}>
                {`${entry.name}: ${formattedValue}`}
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
  return null;
};


const LaborSection = ({ selectedYear, selectedMonth }) => {
  const fetchExpensesData = useCallback(async () => {
    const yearNum = parseInt(selectedYear);
    const monthNum = parseInt(selectedMonth);
    const currentDate = new Date(yearNum, monthNum - 1, 1);
    
    const ID_CATEGORIA_MANO_DE_OBRA = 1; 
    const CONCEPTO_HORAS_EXTRA = 'Sueldo Empleado Auxiliar'; // Ajusta a un concepto que exista para probar

    // --- ¡CAMBIO CLAVE! ---
    // La función getExpenses ahora usa el nuevo servicio optimizado para el dashboard.
    const getExpenses = async (filters) => {
        return DashboardService.getLaborExpenseItems(filters);
    };
    
    // 1. OBTENER DATOS BASE DE LOS SERVICIOS
    const [
      currentMonthExpenses, 
      previousMonthExpenses,
      { totalExpense: totalGastoEmpresa }, // Se obtiene el total general para el KPI
      { count: numeroDeEmpleados },
      productionResults // Los datos de producción se obtienen para 6 meses de una vez
    ] = await Promise.all([
        getExpenses({ year: yearNum, month: monthNum, idExpenseCategory: ID_CATEGORIA_MANO_DE_OBRA }),
        getExpenses({ 
            year: monthNum === 1 ? yearNum - 1 : yearNum, 
            month: monthNum === 1 ? 12 : monthNum - 1,
            idExpenseCategory: ID_CATEGORIA_MANO_DE_OBRA
        }),
        MonthlyOverallExpenseService.getTotalExpenseByMonth(yearNum, monthNum),
        empleadoService.getActiveEmployeeCountByMonth(yearNum, monthNum),
        ProductionAnalyticsService.getMonthlySummary(subMonths(currentDate, 5), endOfMonth(currentDate))
    ]);

    // 2. CALCULAR TODOS LOS KPIs (la lógica interna no cambia)
    const totalGastoMesActual = currentMonthExpenses.reduce((sum, exp) => sum + (Number(exp.total) || 0), 0);
    const totalGastoMesAnterior = previousMonthExpenses.reduce((sum, exp) => sum + (Number(exp.total) || 0), 0);
    let gastoChangePct = totalGastoMesAnterior > 0 ? ((totalGastoMesActual - totalGastoMesAnterior) / totalGastoMesAnterior) * 100 : (totalGastoMesActual > 0 ? 100 : null);
    const pctSobreGastoTotal = totalGastoEmpresa > 0 ? (totalGastoMesActual / totalGastoEmpresa) * 100 : 0;
    const costoPromedioPorEmpleado = numeroDeEmpleados > 0 ? totalGastoMesActual / numeroDeEmpleados : 0;
    const conceptDistribution = currentMonthExpenses.reduce((acc, exp) => {
        const conceptName = exp.specificConceptSpent?.name || 'Concepto Desconocido';
        acc[conceptName] = (acc[conceptName] || 0) + (Number(exp.total) || 0);
        return acc;
    }, {});
    const costoHorasExtra = conceptDistribution[CONCEPTO_HORAS_EXTRA] || 0;
    const pctHorasExtra = totalGastoMesActual > 0 ? (costoHorasExtra / totalGastoMesActual) * 100 : 0;

    // 3. PREPARAR DATOS PARA GRÁFICOS
    const trendPromises = Array.from({ length: 6 }).map((_, i) => {
        const d = subMonths(currentDate, i);
        return getExpenses({ year: d.getFullYear(), month: d.getMonth() + 1, idExpenseCategory: ID_CATEGORIA_MANO_DE_OBRA });
    });
    const trendResults = await Promise.all(trendPromises);

    const allConcepts = new Set();
    trendResults.flat().forEach(exp => allConcepts.add(exp.specificConceptSpent?.name || 'Concepto Desconocido'));

    const monthlyTrendData = trendResults.map((expenses, i) => {
        const d = subMonths(currentDate, i);
        const monthName = d.toLocaleString('es-ES', { month: 'short' });
        const yearShort = d.getFullYear().toString().slice(-2);
        const entry = { name: `${monthName.charAt(0).toUpperCase() + monthName.slice(1)}. '${yearShort}`, year: d.getFullYear(), month: d.getMonth() + 1 };
        allConcepts.forEach(concept => { entry[concept] = 0; });
        expenses.forEach(exp => {
            const conceptName = exp.specificConceptSpent?.name || 'Concepto Desconocido';
            entry[conceptName] += (Number(exp.total) || 0);
        });
        return entry;
    }).reverse();
    
    const productivityData = monthlyTrendData.map(trend => {
        const productionMonth = productionResults.find(p => p.year === trend.year && p.month === trend.month);
        const totalLaborCost = Array.from(allConcepts).reduce((sum, concept) => sum + (trend[concept] || 0), 0);
        return { ...trend, totalLaborCost, unitsProduced: productionMonth ? productionMonth.unitsProduced : 0 };
    });

    const conceptColors = {};
    Array.from(allConcepts).forEach((cat, index) => { conceptColors[cat] = `hsl(${index * 60}, 70%, 60%)`; });
    const distributionChartData = Object.entries(conceptDistribution).map(([name, value]) => ({ name, value, fill: conceptColors[name] || '#ccc' })).sort((a, b) => b.value - a.value);

    return {
      kpiData: { totalGastoMesActual, gastoChangePct, numConcepts: distributionChartData.length, pctSobreGastoTotal, numeroDeEmpleados, costoPromedioPorEmpleado, costoHorasExtra, pctHorasExtra },
      monthlyTrendData,
      distributionChartData,
      conceptColors,
      allConcepts: Array.from(allConcepts),
      productivityData,
    };
  }, [selectedYear, selectedMonth]);

  const { data, isLoading, error } = useDashboardSection(fetchExpensesData, [selectedYear, selectedMonth]);
  
  const { kpiData = {}, monthlyTrendData = [], distributionChartData = [], conceptColors = {}, allConcepts = [], productivityData = [] } = data || {};

  if (isLoading) return <div className="loading-state-finance"><DollarSign size={32} className="lucide-spin" /><p>Cargando Datos de Mano de Obra...</p></div>;
  if (error) return <div className="error-state-finance"><AlertTriangle /><p>{error.message || "Error cargando datos de mano de obra."}</p></div>;

  return (
    <div className="animate-fadeIn">
      <div className="kpi-grid-finance kpi-grid-cols-3-finance">
        <StatCard title="Gasto en Mano de Obra (Mes)" value={formatCurrency(kpiData.totalGastoMesActual)} icon={DollarSign} />
        <StatCard 
          title="Variación vs. Mes Anterior" 
          value={kpiData.gastoChangePct !== null ? formatPercentage(kpiData.gastoChangePct, true) : 'N/A'}
          changeDirection={kpiData.gastoChangePct === null ? undefined : (kpiData.gastoChangePct >= 0 ? 'up' : 'down')}
          icon={TrendingUp} 
        />
        <StatCard 
            title="% sobre Gasto Total Empresa" 
            value={formatPercentage(kpiData.pctSobreGastoTotal)} 
            icon={Layers} 
            children={<small>del total de gastos del mes</small>}
        />
        <StatCard 
            title="Costo Promedio / Empleado" 
            value={formatCurrency(kpiData.costoPromedioPorEmpleado)} 
            icon={Users}
            children={<small>Basado en {kpiData.numeroDeEmpleados || 0} empleados</small>}
        />
        <StatCard 
            title="Costo Horas Extra" 
            value={formatCurrency(kpiData.costoHorasExtra)} 
            icon={Clock} 
            children={<small>{formatPercentage(kpiData.pctHorasExtra)} del costo de M.O.</small>}
        />
        <StatCard 
            title="Conceptos de Gasto Activos" 
            value={kpiData.numConcepts} 
            icon={Sliders} 
        />
      </div>

      <div className="content-card-finance" style={{marginBottom: '1.5rem'}}>
        <h3 className="card-title-main">Productividad: Costo Laboral vs. Unidades Producidas</h3>
        {productivityData.length > 0 && productivityData.some(d => d.totalLaborCost > 0) ? (
             <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={productivityData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.3}/>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }}/>
                    <YAxis 
                        yAxisId="left" 
                        orientation="left" 
                        stroke="#8884d8" 
                        tickFormatter={(value) => formatCurrency(value, 0)} 
                        tick={{ fontSize: 11 }} 
                    />
                    <YAxis 
                        yAxisId="right" 
                        orientation="right" 
                        stroke="#82ca9d" 
                        tickFormatter={(value) => `${value} u.`}
                        tick={{ fontSize: 11 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area 
                      yAxisId="left" 
                      type="monotone" 
                      dataKey="totalLaborCost" 
                      name="Costo Laboral" 
                      fill="#8884d8" 
                      stroke="#8884d8" 
                      fillOpacity={0.6}
                    />
                    <Line 
                      yAxisId="right" 
                      type="monotone" 
                      dataKey="unitsProduced" 
                      name="Unidades Producidas" 
                      stroke="#82ca9d" 
                      strokeWidth={2}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        ) : (
            <ChartPlaceholder text="No hay datos suficientes para mostrar la productividad." icon={Package} />
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="content-card-finance">
            <h3 className="card-title-main">Tendencia por Concepto (Últimos 6 Meses)</h3>
            {monthlyTrendData.length > 0 && monthlyTrendData.some(d => Object.values(d).some(v => typeof v === 'number' && v > 0)) ? (
                <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.3}/>
                        <XAxis dataKey="name" tick={{ fontSize: 12 }}/>
                        <YAxis tickFormatter={(value) => formatCurrency(value, 0)} tick={{ fontSize: 11 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{fontSize: "12px"}}/>
                        {allConcepts.map(concept => (
                            <Area key={concept} type="monotone" dataKey={concept} stackId="1" stroke={conceptColors[concept]} fill={conceptColors[concept]} fillOpacity={0.7} name={concept} />
                        ))}
                    </AreaChart>
                </ResponsiveContainer>
            ) : (
                <ChartPlaceholder text="No hay datos de tendencia para mostrar." icon={TrendingUp} />
            )}
        </div>
        
        <div className="content-card-finance">
            <h3 className="card-title-main">Distribución por Concepto (Mes Actual)</h3>
            {distributionChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                    <RadialBarChart cx="50%" cy="50%" innerRadius="15%" outerRadius="85%" barSize={15} data={distributionChartData} startAngle={90} endAngle={-270}>
                        <RadialBar minAngle={15} background clockWise dataKey="value">
                        {distributionChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                        </RadialBar>
                        <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{fontSize: "12px"}} />
                        <Tooltip formatter={(value, name) => [formatCurrency(value), name]}/>
                    </RadialBarChart>
                </ResponsiveContainer>
            ) : <ChartPlaceholder text="No hay gastos de mano de obra registrados este mes." icon={BarChart2} />}
        </div>
      </div>
    </div>
  );
};

export default LaborSection;