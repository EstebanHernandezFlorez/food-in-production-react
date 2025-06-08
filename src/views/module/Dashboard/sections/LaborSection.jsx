// RUTA: src/views/Dashboard/sections/LaborSection.jsx (o ExpensesSection.jsx si lo renombras)

import React, { useCallback } from 'react';
import { DollarSign, PieChart as PieChartIcon, BarChart2, Clock } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';

import { useDashboardSection } from '../hooks/useDashboardSection';
import StatCard from '../components/StatCard';
import ChartPlaceholder from '../components/ChartPlaceholder';
import { formatCurrency, formatPercentage, getRandomColor } from '../utils/formatters';
import MonthlyOverallExpenseService from '../../../services/MonthlyOverallExpenseService';

const LaborSection = ({ selectedYear, selectedMonth }) => {
  const fetchExpensesData = useCallback(async () => {
    const yearNum = parseInt(selectedYear);
    const monthNum = parseInt(selectedMonth);

    // 1. Obtener todos los gastos del mes actual y del anterior para KPIs
    const [currentMonthExpenses, previousMonthExpenses] = await Promise.all([
        MonthlyOverallExpenseService.getAllMonthlyOverallExpenses({ year: yearNum, month: monthNum }),
        MonthlyOverallExpenseService.getAllMonthlyOverallExpenses({ 
            year: monthNum === 1 ? yearNum - 1 : yearNum, 
            month: monthNum === 1 ? 12 : monthNum - 1 
        })
    ]);

    // KPI 1: Gasto Mensual Actual
    const totalGastoMesActual = currentMonthExpenses.reduce((sum, exp) => sum + (Number(exp.total) || 0), 0);
    
    // KPI 2: Variación vs Mes Anterior
    const totalGastoMesAnterior = previousMonthExpenses.reduce((sum, exp) => sum + (Number(exp.total) || 0), 0);
    const gastoChangePct = totalGastoMesAnterior > 0 
        ? ((totalGastoMesActual - totalGastoMesAnterior) / totalGastoMesAnterior) * 100 
        : (totalGastoMesActual > 0 ? 100 : 0);

    // 2. Obtener gastos de los últimos 6 meses para el gráfico de tendencias
    const trendPromises = [];
    for (let i = 0; i < 6; i++) {
        const d = new Date(yearNum, monthNum - 1 - i, 1);
        trendPromises.push(MonthlyOverallExpenseService.getAllMonthlyOverallExpenses({ year: d.getFullYear(), month: d.getMonth() + 1 }));
    }
    const trendResults = await Promise.all(trendPromises);

    // Gráfico 1: Variaciones de gastos en el tiempo
    const monthlyTrendData = trendResults.map((expenses, i) => {
        const d = new Date(yearNum, monthNum - 1 - i, 1);
        const monthName = d.toLocaleString('es-ES', { month: 'short' });
        const yearShort = d.getFullYear().toString().slice(-2);

        const totalsByCategory = expenses.reduce((acc, exp) => {
            const categoryName = exp.expenseCategory?.name || 'Sin Categoría';
            acc[categoryName] = (acc[categoryName] || 0) + (Number(exp.total) || 0);
            return acc;
        }, {});

        return {
            name: `${monthName.charAt(0).toUpperCase() + monthName.slice(1)}. '${yearShort}`,
            ...totalsByCategory
        };
    }).reverse(); // Invertir para mostrar del más antiguo al más reciente

    // Gráfico 2: Distribución de Gastos del Mes Actual
    const categoryDistribution = currentMonthExpenses.reduce((acc, exp) => {
        const categoryName = exp.expenseCategory?.name || 'Sin Categoría';
        acc[categoryName] = (acc[categoryName] || 0) + (Number(exp.total) || 0);
        return acc;
    }, {});

    const distributionChartData = Object.entries(categoryDistribution)
        .map(([name, value]) => ({ name, value, fill: getRandomColor() }))
        .sort((a,b) => b.value - a.value);

    return {
      totalGastoMesActual,
      gastoChangePct,
      monthlyTrendData,
      distributionChartData,
    };
  }, [selectedYear, selectedMonth]);

  const { data, isLoading, error } = useDashboardSection(fetchExpensesData, [selectedYear, selectedMonth]);

  if (isLoading) return <div className="loading-state-finance"><DollarSign size={32} className="lucide-spin" /><p>Cargando Análisis de Gastos...</p></div>;
  if (error || !data) return <div className="error-state-finance">{error || "No hay datos de gastos disponibles."}</div>;

  return (
    <div className="animate-fadeIn">
      <div className="kpi-grid-finance">
        <StatCard 
            title="Gasto Total del Mes" 
            value={formatCurrency(data.totalGastoMesActual)} 
            icon={DollarSign} 
        />
        <StatCard 
            title="Variación vs. Mes Anterior" 
            value={formatPercentage(data.gastoChangePct, true)} 
            icon={BarChart2} 
        />
        <StatCard 
            title="Categorías de Gasto" 
            value={data.distributionChartData.length} 
            icon={PieChartIcon} 
        />
      </div>

      <div className="content-card-finance" style={{marginBottom: '1.5rem'}}>
        <h3 className="card-title-main">Tendencia de Gastos por Categoría (Últimos 6 Meses)</h3>
        {data.monthlyTrendData && data.monthlyTrendData.length > 0 ? (
             <ResponsiveContainer width="100%" height={350}>
                <BarChart data={data.monthlyTrendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }}/>
                    <YAxis tickFormatter={(value) => formatCurrency(value, 0).replace('$', '')} />
                    <Tooltip formatter={(value, name) => [formatCurrency(value), name]}/>
                    <Legend />
                    {/* Renderizar una barra por cada categoría encontrada */}
                    {Object.keys(data.monthlyTrendData[0] || {})
                        .filter(key => key !== 'name')
                        .map(category => (
                            <Bar key={category} dataKey={category} stackId="a" fill={getRandomColor()} />
                        ))
                    }
                </BarChart>
            </ResponsiveContainer>
        ) : (
            <ChartPlaceholder text="No hay datos suficientes para mostrar la tendencia." icon={Clock} />
        )}
      </div>
      
      <div className="content-card-finance">
        <h3 className="card-title-main">Distribución de Gastos (Mes Actual)</h3>
        {data.distributionChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
                 <PieChart>
                    <Pie
                        data={data.distributionChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                        {data.distributionChartData.map((entry) => (
                            <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                        ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)}/>
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        ) : <ChartPlaceholder text="No hay gastos registrados este mes." />}
      </div>
    </div>
  );
};

export default LaborSection;