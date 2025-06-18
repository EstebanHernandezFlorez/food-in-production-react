// RUTA: src/views/Dashboard/sections/LaborSection.jsx

import React, { useCallback } from 'react';
import { DollarSign, BarChart2, TrendingUp, Layers, Clock, Users } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, RadialBarChart, RadialBar, Cell } from 'recharts';

import { useDashboardSection } from '../hooks/useDashboardSection';
import StatCard from '../components/StatCard';
import ChartPlaceholder from '../components/ChartPlaceholder';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import MonthlyOverallExpenseService from '../../../services/MonthlyOverallExpenseService';

// --- Componente CustomTooltip (sin cambios) ---
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
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
  return null;
};

const LaborSection = ({ selectedYear, selectedMonth }) => {
  const fetchExpensesData = useCallback(async () => {
    const yearNum = parseInt(selectedYear);
    const monthNum = parseInt(selectedMonth);

    // <-- ¡IMPORTANTE! CAMBIA ESTE NÚMERO POR EL ID REAL DE TU CATEGORÍA "MANO DE OBRA" -->
    const ID_CATEGORIA_MANO_DE_OBRA = 1; 

    // Función robusta para obtener datos de gastos por categoría
    const getExpenses = async (filters) => {
        const result = await MonthlyOverallExpenseService.getAllMonthlyOverallExpenses(filters);
        return Array.isArray(result) ? result : (result?.rows || []);
    };
    
    // 1. Obtener gastos de "Mano de Obra" del mes actual y del anterior
    const [currentMonthExpenses, previousMonthExpenses] = await Promise.all([
        getExpenses({ year: yearNum, month: monthNum, idExpenseCategory: ID_CATEGORIA_MANO_DE_OBRA }),
        getExpenses({ 
            year: monthNum === 1 ? yearNum - 1 : yearNum, 
            month: monthNum === 1 ? 12 : monthNum - 1,
            idExpenseCategory: ID_CATEGORIA_MANO_DE_OBRA
        })
    ]);

    // KPI 1: Gasto Mensual Actual en Mano de Obra
    const totalGastoMesActual = currentMonthExpenses.reduce((sum, exp) => sum + (Number(exp.total) || 0), 0);
    
    // KPI 2: Variación vs Mes Anterior (Lógica mejorada)
    const totalGastoMesAnterior = previousMonthExpenses.reduce((sum, exp) => sum + (Number(exp.total) || 0), 0);
    let gastoChangePct = null; // Inicia como nulo
    if (totalGastoMesAnterior > 0) {
        gastoChangePct = ((totalGastoMesActual - totalGastoMesAnterior) / totalGastoMesAnterior) * 100;
    } else if (totalGastoMesActual > 0) {
        // Si no hay mes anterior pero sí mes actual, es un 100% de aumento "infinito"
        gastoChangePct = 100; 
    }
    // Si ambos son 0, gastoChangePct se queda como null.

    // 2. Obtener gastos de los últimos 6 meses para la tendencia (solo de Mano de Obra)
    const trendPromises = Array.from({ length: 6 }).map((_, i) => {
        const d = new Date(yearNum, monthNum - 1 - i, 1);
        return getExpenses({ year: d.getFullYear(), month: d.getMonth() + 1, idExpenseCategory: ID_CATEGORIA_MANO_DE_OBRA });
    });
    const trendResults = await Promise.all(trendPromises);

    // Ahora los "conceptos" son los diferentes tipos de mano de obra (ej. Salario, Horas Extra)
    const allConcepts = new Set();
    trendResults.flat().forEach(exp => {
        allConcepts.add(exp.specificConceptSpent?.name || 'Concepto Desconocido');
    });

    // Gráfico 1: Tendencia por concepto específico dentro de Mano de Obra
    const monthlyTrendData = trendResults.map((expenses, i) => {
        const d = new Date(yearNum, monthNum - 1 - i, 1);
        const monthName = d.toLocaleString('es-ES', { month: 'short' });
        const yearShort = d.getFullYear().toString().slice(-2);
        const entry = { name: `${monthName.charAt(0).toUpperCase() + monthName.slice(1)}. '${yearShort}` };
        
        allConcepts.forEach(concept => { entry[concept] = 0; });

        expenses.forEach(exp => {
            const conceptName = exp.specificConceptSpent?.name || 'Concepto Desconocido';
            entry[conceptName] = (entry[conceptName] || 0) + (Number(exp.total) || 0);
        });
        return entry;
    }).reverse();

    // Gráfico 2: Distribución de Gastos por concepto específico
    const conceptDistribution = currentMonthExpenses.reduce((acc, exp) => {
        const conceptName = exp.specificConceptSpent?.name || 'Concepto Desconocido';
        acc[conceptName] = (acc[conceptName] || 0) + (Number(exp.total) || 0);
        return acc;
    }, {});
    
    const conceptColors = {};
    Array.from(allConcepts).forEach((cat, index) => {
      conceptColors[cat] = `hsl(${index * 60}, 70%, 60%)`;
    });
    
    const distributionChartData = Object.entries(conceptDistribution)
        .map(([name, value]) => ({ name, value, fill: conceptColors[name] || '#ccc' }))
        .sort((a, b) => b.value - a.value);

    return {
      kpiData: {
        totalGastoMesActual,
        gastoChangePct,
        numConcepts: distributionChartData.length
      },
      monthlyTrendData,
      distributionChartData,
      conceptColors,
      allConcepts: Array.from(allConcepts),
    };
  }, [selectedYear, selectedMonth]);

  const { data, isLoading, error } = useDashboardSection(fetchExpensesData, [selectedYear, selectedMonth]);
  
  const { 
    kpiData = {}, 
    monthlyTrendData = [], 
    distributionChartData = [],
    conceptColors = {},
    allConcepts = [],
  } = data || {};

  if (isLoading) return <div className="loading-state-finance"><DollarSign size={32} className="lucide-spin" /><p>Cargando Gastos de Mano de Obra...</p></div>;
  if (error) return <div className="error-state-finance">{error.message || "No hay datos de gastos disponibles."}</div>;

  return (
    <div className="animate-fadeIn">
      <div className="kpi-grid-finance">
        <StatCard 
            title="Gasto en Mano de Obra (Mes)" 
            value={formatCurrency(kpiData.totalGastoMesActual)} 
            icon={DollarSign} 
        />
        <StatCard 
            title="Variación vs. Mes Anterior" 
            // <-- Lógica mejorada en el componente para mostrar N/A -->
            value={kpiData.gastoChangePct !== null ? formatPercentage(kpiData.gastoChangePct, true) : 'N/A'}
            changeDirection={kpiData.gastoChangePct === null ? undefined : (kpiData.gastoChangePct >= 0 ? 'up' : 'down')}
            icon={TrendingUp} 
            children={kpiData.gastoChangePct === null && kpiData.totalGastoMesActual === 0 ? <small>Sin datos para comparar</small> : null}
        />
        <StatCard 
            title="Conceptos de Gasto" 
            value={kpiData.numConcepts} 
            icon={Users} 
        />
      </div>

      <div className="content-card-finance" style={{marginBottom: '1.5rem'}}>
        <h3 className="card-title-main">Tendencia de Gastos de Mano de Obra (Últimos 6 Meses)</h3>
        {monthlyTrendData.length > 0 && monthlyTrendData.some(d => Object.values(d).some(v => typeof v === 'number' && v > 0)) ? (
             <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.3}/>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }}/>
                    <YAxis tickFormatter={(value) => formatCurrency(value, 0)} tick={{ fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {allConcepts.map(concept => (
                        <Area 
                          key={concept} 
                          type="monotone" 
                          dataKey={concept} 
                          stackId="1" 
                          stroke={conceptColors[concept]} 
                          fill={conceptColors[concept]} 
                          fillOpacity={0.7}
                        />
                    ))}
                </AreaChart>
            </ResponsiveContainer>
        ) : (
            <ChartPlaceholder text="No hay datos suficientes para mostrar la tendencia." icon={Clock} />
        )}
      </div>
      
      <div className="content-card-finance">
        <h3 className="card-title-main">Distribución de Mano de Obra (Mes Actual)</h3>
        {distributionChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
                 <RadialBarChart 
                    cx="50%" cy="50%" 
                    innerRadius="10%" outerRadius="80%" 
                    barSize={15} data={distributionChartData}
                    startAngle={180} endAngle={-180}
                 >
                    <RadialBar minAngle={15} background clockWise dataKey="value">
                      {distributionChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </RadialBar>
                    <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" />
                    <Tooltip formatter={(value, name) => [formatCurrency(value), name]}/>
                </RadialBarChart>
            </ResponsiveContainer>
        ) : <ChartPlaceholder text="No hay gastos de mano de obra este mes." icon={BarChart2} />}
      </div>
    </div>
  );
};

export default LaborSection;