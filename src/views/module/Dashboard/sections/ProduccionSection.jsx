// RUTA: src/views/Dashboard/sections/ProduccionSection.jsx

import React, { useCallback } from 'react';
import { Clock, PackageCheck, BarChart2, TrendingUp, Cpu, ListChecks } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, PieChart, Pie } from 'recharts';

import StatCard from '../components/StatCard';
import ChartPlaceholder from '../components/ChartPlaceholder';
import { useDashboardSection } from '../hooks/useDashboardSection';
import { formatNumber, getRandomColor } from '../utils/formatters';
import productionOrderService from '../../../services/productionOrderService';
import specSheetService from '../../../services/specSheetService';

const ProduccionSection = ({ selectedYear, selectedMonth }) => {
  const fetchData = useCallback(async () => {
    const yearNum = parseInt(selectedYear);
    const monthNum = parseInt(selectedMonth);

    const [allOrders, allSpecSheets] = await Promise.all([
      productionOrderService.getAllProductionOrders({ includeDetails: true }),
      specSheetService.getAllSpecSheets()
    ]);

    // --- KPIs ---
    const activeStatuses = ['pendiente', 'en_proceso', 'activa', 'en configuracion'];
    const ordenesActivas = allOrders.filter(o => activeStatuses.includes(o.status?.toLowerCase())).length;

    const completedStatuses = ['completada', 'finalizada'];
    const ordenesDelMes = allOrders.filter(o => {
      const date = new Date(o.creationDate);
      return date.getFullYear() === yearNum && (date.getMonth() + 1) === monthNum;
    });
    const ordenesCompletadasMes = ordenesDelMes.filter(o => completedStatuses.includes(o.status?.toLowerCase())).length;

    let eficienciaProduccion = 0;
    const completedOrdersWithTime = allOrders.filter(o => completedStatuses.includes(o.status?.toLowerCase()) && o.completionDate && o.creationDate);
    if (completedOrdersWithTime.length > 0) {
      const { totalTiempoReal, totalTiempoEstimado } = completedOrdersWithTime.reduce((acc, order) => {
        const specSheet = allSpecSheets.find(ss => ss.idSpecSheet === order.idSpecSheet);
        if (specSheet) {
          const tiempoReal = (new Date(order.completionDate) - new Date(order.creationDate)) / (1000 * 60); // en minutos
          const tiempoEstimado = Number(specSheet.estimatedTime) || 0;
          if (tiempoEstimado > 0) {
            acc.totalTiempoReal += tiempoReal;
            acc.totalTiempoEstimado += tiempoEstimado * order.quantity;
          }
        }
        return acc;
      }, { totalTiempoReal: 0, totalTiempoEstimado: 0 });

      if (totalTiempoEstimado > 0) {
        eficienciaProduccion = (totalTiempoEstimado / totalTiempoReal) * 100;
      }
    }

    const getWeekNumber = (d) => {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
        var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
        var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1)/7);
        return weekNo;
    };
    const currentWeek = getWeekNumber(new Date());
    const ordenesSemanaActual = ordenesDelMes.filter(o => getWeekNumber(new Date(o.creationDate)) === currentWeek);

    // <<<--- CORRECCIÓN DE ROBUSTEZ: Asegurar que Math.max no reciba un array vacío --- >>>
    const produccionMaxMes = ordenesDelMes.length > 0 ? Math.max(...ordenesDelMes.map(o => o.quantity || 0)) : 0;
    const produccionMaxSemana = ordenesSemanaActual.length > 0 ? Math.max(...ordenesSemanaActual.map(o => o.quantity || 0)) : 0;

    // --- GRÁFICOS ---
    const productosMasProducidos = allOrders.reduce((acc, order) => {
        if (completedStatuses.includes(order.status?.toLowerCase())) {
            const name = order.productName || 'Producto Desconocido';
            acc[name] = (acc[name] || 0) + (Number(order.quantity) || 0);
        }
        return acc;
    }, {});
    
    const productosChartData = Object.entries(productosMasProducidos)
      .map(([name, count]) => ({ name, 'Unidades Producidas': count, fill: getRandomColor() }))
      .sort((a, b) => b['Unidades Producidas'] - a['Unidades Producidas'])
      .slice(0, 5);

    const statusCounts = allOrders.reduce((acc, order) => {
        const status = order.status || 'desconocido';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {});
    
    const statusChartData = Object.entries(statusCounts)
      .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '), value, fill: getRandomColor() }));

    return {
      ordenesActivas,
      ordenesCompletadasMes,
      eficienciaProduccion: eficienciaProduccion.toFixed(1),
      produccionMaxMes,
      produccionMaxSemana,
      productosChartData,
      statusChartData,
    };
  }, [selectedYear, selectedMonth]);

  const { data: produccionData, isLoading, error } = useDashboardSection(fetchData, [selectedYear, selectedMonth]);

  // <<<--- CORRECCIÓN PRINCIPAL: Añadir una comprobación explícita para produccionData --- >>>
  if (isLoading || !produccionData) return <div className="loading-state-finance"><PackageCheck size={32} className="lucide-spin" /><p>Cargando Producción...</p></div>;
  if (error) return <div className="error-state-finance">{error || "No hay datos disponibles para producción."}</div>;

  return (
    <div className="animate-fadeIn">
      <div className="kpi-grid-finance">
        <StatCard title="Órdenes Activas" value={formatNumber(produccionData.ordenesActivas)} icon={Clock} />
        <StatCard title="Completadas (Mes)" value={formatNumber(produccionData.ordenesCompletadasMes)} icon={PackageCheck}/>
        <StatCard title="Eficiencia de Producción" value={`${produccionData.eficienciaProduccion}%`} icon={BarChart2} info="Tiempo Real vs. Estimado"/>
        <StatCard title="Producción Máx. (Mes / Semana)" value={`${formatNumber(produccionData.produccionMaxMes)} / ${formatNumber(produccionData.produccionMaxSemana)}`} icon={TrendingUp} info="Lote más grande"/>
      </div>
      <div className="charts-section-finance" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem'}}>
        <div className="content-card-finance">
          <h3 className="card-title-main">Productos Más Producidos (Histórico)</h3>
          {produccionData.productosChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={produccionData.productosChartData} layout="vertical" margin={{ left: 150 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" tick={{fontSize: 11}} width={140} />
                <Tooltip formatter={(value) => [formatNumber(value), "Unidades"]}/>
                <Bar dataKey="Unidades Producidas" barSize={20}>
                    {produccionData.productosChartData.map((entry) => (<Cell key={`cell-${entry.name}`} fill={entry.fill} />))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <ChartPlaceholder text="No hay productos completados para mostrar." icon={Cpu}/>}
        </div>
        <div className="content-card-finance">
          <h3 className="card-title-main">Estado General de Órdenes</h3>
          {produccionData.statusChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie data={produccionData.statusChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: ${value}`}>
                        {produccionData.statusChartData.map((entry) => (<Cell key={`cell-${entry.name}`} fill={entry.fill} />))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [value, name]}/>
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
          ) : <ChartPlaceholder text="No hay órdenes de producción." icon={ListChecks} />}
        </div>
      </div>
    </div>
  );
};

export default ProduccionSection;