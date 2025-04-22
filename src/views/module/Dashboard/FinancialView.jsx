// src/views/module/Dashboard/FinancialView.jsx
import React, { useState, useEffect } from 'react';
// Importa LineChart si vas a añadir gráfico de tendencias
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import styles from './Dashboard.module.css';
import { getPreviousMonth, getMonthYear } from '../../../data/sampleData'; // Necesitas getMonthYear si cargas datos históricos
import monthlyOverallExpenseService from '../../services/gastosGeneralesService';
import axios from 'axios';
import { Clock, AlertCircle, TrendingUp } from 'lucide-react';

const FinancialView = ({ selectedYear, selectedMonth, isLoadingParent }) => {
  const [monthlyExpenses, setMonthlyExpenses] = useState([]);
  const [previousMonthExpenses, setPreviousMonthExpenses] = useState([]);
  // **NUEVO: Estado para datos de tendencia (ej: últimos 6 meses)**
  const [expenseTrendData, setExpenseTrendData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isLoadingParent) { setIsLoading(true); return; }

    const fetchFinancialData = async () => {
      setIsLoading(true); setError(null); setMonthlyExpenses([]); setPreviousMonthExpenses([]); setExpenseTrendData([]);
      const { month: prevMonthName, year: prevYear } = getPreviousMonth(parseInt(selectedYear), selectedMonth);

      try {
        // **TODO: Añadir lógica para obtener datos de los últimos N meses para la tendencia**
        // Esto podría requerir otra llamada API o modificar la existente
        // Ejemplo conceptual (habría que implementarlo en el servicio/API):
        // const trendResponse = await axios.get('http://localhost:3000/monthlyOverallExpense/trend', { params: { endYear: selectedYear, endMonth: selectedMonth, months: 6 } });
        // const mappedTrendData = trendResponse.data.map(d => ({ name: `${d.month.substring(0,3)} ${d.year.toString().slice(-2)}`, Gasto: d.total }));
        // setExpenseTrendData(mappedTrendData);

        // Llamadas actuales para mes actual y anterior
        const [currentResponse, previousResponse] = await Promise.all([
          axios.get('http://localhost:3000/monthlyOverallExpense', { params: { year: selectedYear, month: selectedMonth } }),
          axios.get('http://localhost:3000/monthlyOverallExpense', { params: { year: prevYear, month: prevMonthName } })
        ]);
        const mapExpenses = (data) => data.map(exp => ({ /* ... mapeo ... */ }));
        setMonthlyExpenses(mapExpenses(currentResponse.data));
        setPreviousMonthExpenses(mapExpenses(previousResponse.data));

      } catch (err) { setError(err.response?.data?.message || err.message || 'Error al cargar datos financieros'); }
      finally { setIsLoading(false); }
    };
    fetchFinancialData();
  }, [selectedYear, selectedMonth, isLoadingParent]);

  // --- Renderizado ---
  if (isLoading) {
    return <div className={`${styles.chartCard} ${styles.loading}`}><p className={styles.loadingMessage}>Cargando Finanzas...</p></div>;
  }

  // --- Cálculos ---
  const totalMonthExpenses = monthlyExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  const totalPreviousMonthExpenses = previousMonthExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  const difference = totalMonthExpenses - totalPreviousMonthExpenses;
  const percentageChange = totalPreviousMonthExpenses === 0
  ? (totalMonthExpenses > 0 ? 100 : 0) // Si antes era 0, cambio es 100% o 0%
  : ((difference / totalPreviousMonthExpenses) * 100);
  const expensesByCategory = monthlyExpenses.reduce((acc, exp) => {
    // Usa exp.category (o el nombre correcto de tu API) como clave
    const categoryKey = exp.category || 'Sin Categoría';
    acc[categoryKey] = (acc[categoryKey] || 0) + (exp.amount || 0); // Suma el amount
    return acc;
  }, {}); // Objeto inicial vacío
  const chartDataCategory = Object.keys(expensesByCategory).map(category => ({ name: category, Gasto: expensesByCategory[category] }));
  const changeType = difference === 0 ? 'neutral' : difference > 0 ? 'negative' : 'positive';

  // Mensaje de resumen dinámico
  const summaryMessage = () => {
    if (error) return `Error al cargar: ${error}`;
    if (monthlyExpenses.length === 0) return "No hay datos de gastos para este mes.";
    let msg = `Gasto total de ${totalMonthExpenses.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })}`; // Ajusta moneda
    if (totalPreviousMonthExpenses > 0) {
      msg += `, un ${percentageChange > 0 ? 'aumento' : 'descenso'} del ${Math.abs(percentageChange).toFixed(1)}% respecto al mes anterior.`;
    } else if (totalMonthExpenses > 0) {
      msg += ". No hay datos del mes anterior para comparar.";
    }
    const topCategory = Object.entries(expensesByCategory).sort(([,a],[,b]) => b-a)[0];
    if (topCategory) {
        msg += ` La categoría principal de gasto fue "${topCategory[0]}" con ${topCategory[1].toLocaleString('es-ES', { style: 'currency', currency: 'USD' })}.`
    }
    return msg;
  };

  return (
    // **Puedes dividir la vista en varias tarjetas si prefieres**
    // Opción 1: Todo en una tarjeta
    <div className={styles.chartCard}>
      <h4 className={styles.chartCardTitle}>Análisis Financiero</h4>
      <p className={styles.chartCardSubtitle}>{selectedMonth} {selectedYear}</p>

      {/* Mensaje Resumen */}
      <p style={{ fontSize: '0.9rem', marginBottom: '25px', borderLeft: `3px solid ${error ? '#f5365c': '#8C1616'}`, paddingLeft: '10px' }}>
        {summaryMessage()}
      </p>

      {/* Contenedor de KPIs internos (opcional si ya están en el resumen) */}
      {/* <div className={styles.statsContainer}> ... </div> */}

      {/* Gráfico por Categoría */}
      {!error && monthlyExpenses.length > 0 && (
          <div className={styles.chartContainer}>
            <h5>Gastos por Categoría</h5>
            <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartDataCategory} /* ... */ >
                    {/* ... Barras, Ejes, etc. ... */}
                     <Bar dataKey="Gasto" fill="#8C1616" />
                </BarChart>
            </ResponsiveContainer>
          </div>
      )}

      {/* **NUEVO: Gráfico de Tendencia (si tienes expenseTrendData)** */}
      {/* {!error && expenseTrendData.length > 0 && (
          <div className={styles.chartContainer} style={{marginTop: '30px'}}>
            <h5>Tendencia de Gastos (Últimos Meses)</h5>
             <ResponsiveContainer width="100%" height={200}>
                 <LineChart data={expenseTrendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0"/>
                    <XAxis dataKey="name" fontSize={11}/>
                    <YAxis fontSize={11}/>
                    <Tooltip formatter={(value) => `$${value.toLocaleString('es-ES')}`}/>
                    <Legend wrapperStyle={{fontSize: '12px'}}/>
                    <Line type="monotone" dataKey="Gasto" stroke="#8C1616" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }}/>
                 </LineChart>
            </ResponsiveContainer>
          </div>
      )} */}

      <div className={styles.chartCardFooter}>
           <Clock size={12}/>
           <span>{error ? 'Error al cargar' : 'Datos del periodo'}</span>
       </div>
    </div>

    // Opción 2: Dividir en varias tarjetas (requiere ajustar .contentArea en CSS)
    /*
    <>
        <div className={styles.chartCard}> // Tarjeta para Resumen y KPIs
             <h4 ...>Resumen Financiero</h4> ... <p>{summaryMessage()}</p> ...
        </div>
        <div className={styles.chartCard}> // Tarjeta para Gráfico Categorías
             <h4 ...>Gastos por Categoría</h4> ... <ResponsiveContainer>...</ResponsiveContainer>
        </div>
         <div className={styles.chartCard}> // Tarjeta para Gráfico Tendencia
             <h4 ...>Tendencia Gastos</h4> ... <ResponsiveContainer>...</ResponsiveContainer>
        </div>
    </>
    */
  );
};

export default FinancialView;