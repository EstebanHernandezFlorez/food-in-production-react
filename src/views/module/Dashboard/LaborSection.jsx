// src/views/module/Dashboard/LaborSection.jsx
import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import StatCardFinance from './StatCardFinance'; // Ajusta la ruta
import ChartPlaceholder from './ChartPlaceholder'; // Ajusta la ruta
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

// Importa tus servicios necesarios
import MonthlyOverallExpenseService from '../../services/MonthlyOverallExpenseService'; // Ajusta ruta

const LaborSection = ({ selectedYear, selectedMonth }) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatCurrency = (value, decimals = 0, currencySymbol = '$') => value != null ? `${currencySymbol}${Number(value).toLocaleString('es-CO', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}` : `${currencySymbol}0`;
  const formatPercentage = (value, addPlusSign = false, decimals = 1) => { /* ... tu función ... */ return `${value}%`; };


  useEffect(() => {
    const fetchLaborData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Ejemplo de llamada a servicio
        const ID_TIPO_GASTO_MANO_OBRA = 1; // Define este ID según tu BD
        const currentExpensesData = await MonthlyOverallExpenseService.getTotalExpenseByTypeAndMonth(selectedYear, selectedMonth, ID_TIPO_GASTO_MANO_OBRA)
            .catch(() => ({ totalExpense: 0, message: "No se pudo cargar el gasto actual." }));
        
        // Simulación de más datos
        const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
        const prevYear = selectedMonth === 1 ? (parseInt(selectedYear) - 1).toString() : selectedYear;
        const previousExpensesData = await MonthlyOverallExpenseService.getTotalExpenseByTypeAndMonth(prevYear, prevMonth, ID_TIPO_GASTO_MANO_OBRA)
            .catch(() => ({ totalExpense: 0, message: "No se pudo cargar el gasto del mes anterior." }));

        const currentMonthTotal = currentExpensesData.totalExpense || 0;
        const previousMonthTotal = previousExpensesData.totalExpense || 0;

        // Simulación de datos para gráficos
        const distribucionCategoria = [
            { categoria: 'Salarios Cocina', porcentaje: 65, color: '#3b82f6' },
            { categoria: 'Salarios Servicio', porcentaje: 25, color: '#10b981' },
            { categoria: 'Bonificaciones', porcentaje: 10, color: '#f97316' }
        ];
        
        // Total de todos los meses (esto sería una consulta más compleja o un cálculo acumulado)
        // Por ahora, simularemos un valor. En una implementación real, necesitarías un endpoint o lógica.
        const totalHistoricoManoObra = 55000000; // Ejemplo, deberías calcular esto de verdad

        setData({
          gastoMensualTotal: currentMonthTotal,
          gastoMesAnteriorPct: previousMonthTotal > 0 ? ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100 : (currentMonthTotal > 0 ? 100 : 0),
          distribucionCategoria,
          totalHistoricoManoObra,
          // ... más datos que necesites ...
        });

      } catch (err) {
        console.error("Error fetching labor data:", err);
        setError(err.message || "Error al cargar datos de mano de obra.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLaborData();
  }, [selectedYear, selectedMonth]);

  if (isLoading) {
    return (
      <div className="flup-content-loading-state">
        <Clock size={32} className="animate-spin-slow" />
        <p>Cargando Mano de Obra...</p>
      </div>
    );
  }

  if (error || !data) {
    return <div className="flup-content-error-state">{error || "No hay datos disponibles para mano de obra."}</div>;
  }

  const pieDataCategorias = data.distribucionCategoria.map(cat => ({ name: cat.categoria, value: cat.porcentaje, color: cat.color }));


  return (
    <div className="animate-fadeIn">
      <div className="flup-kpi-grid">
        <StatCardFinance title="Gasto Mensual M.O." value={formatCurrency(data.gastoMensualTotal)} changePercent={formatPercentage(data.gastoMesAnteriorPct, true)} changeDirection={data.gastoMesAnteriorPct >= 0 ? 'up' : 'down'} />
        <StatCardFinance title="Gasto Histórico Total M.O." value={formatCurrency(data.totalHistoricoManoObra)} />
        {/* Puedes añadir más KPIs específicos de mano de obra */}
      </div>
      <div className="flup-charts-section">
        <div className="flup-chart-container">
          <h3 className="chart-title">Distribución Gastos M.O. (Mes Actual)</h3>
          {pieDataCategorias.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieDataCategorias} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {pieDataCategorias.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value}%`, name]}/>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <ChartPlaceholder />}
        </div>
        <div className="flup-chart-container">
          <h3 className="chart-title">Gastos Mensuales M.O. (Por Concepto - Placeholder)</h3>
          {/* Aquí iría un BarChart con los nombres y valores del gasto del mes */}
          <ChartPlaceholder text="Gráfico de Gastos Mensuales por Concepto (Próximamente)" />
        </div>
      </div>
    </div>
  );
};

export default LaborSection;