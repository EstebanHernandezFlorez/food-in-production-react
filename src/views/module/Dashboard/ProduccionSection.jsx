// src/views/module/Dashboard/ProduccionSection.jsx
import React, { useState, useEffect } from 'react';
import { Clock, PackageCheck, BarChart2 } from 'lucide-react';
import StatCardFinance from './StatCardFinance';
import ChartPlaceholder from './ChartPlaceholder';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

import productionOrderService from '../../services/productionOrderService'; // Ajusta ruta!
// Podrías necesitar servicios de productos o fichas técnicas si quieres más detalle

const ProduccionSection = ({ selectedYear, selectedMonth }) => {
  const [produccionData, setProduccionData] = useState({
    ordenesActivas: 0,
    ordenesCompletadasMes: 0,
    productosMasProducidos: [], // [{ name: 'Producto A', count: 150 }, ...]
    eficienciaProduccionPct: 0, // Placeholder
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatNumber = (value) => value != null ? Number(value).toLocaleString('es-CO') : '0';

  useEffect(() => {
    const fetchProduccionData = async () => {
      setIsLoading(true);
      setError(null);
      console.log(`[ProduccionSection] Fetching data for ${selectedYear}-${selectedMonth}`);
      try {
        const allOrdersResult = await productionOrderService.getAllOrders().catch(err => { console.error("Error all orders:", err); return []; });
        const allOrders = Array.isArray(allOrdersResult) ? allOrdersResult : [];

        const yearNum = parseInt(selectedYear);
        const monthNum = parseInt(selectedMonth);

        const ordenesActivas = allOrders.filter(
            // Ajusta los estados según tu modelo
            order => order.status === 'pendiente' || order.status === 'en_proceso'
        ).length;

        const ordenesCompletadasMes = allOrders.filter(order => {
            if (order.status !== 'completada' && order.status !== 'finalizada') return false; // Ajusta estados
            const completionDate = order.completionDate ? new Date(order.completionDate) : (order.updatedAt ? new Date(order.updatedAt) : null); // Usa un campo de fecha de finalización
            return completionDate && completionDate.getFullYear() === yearNum && (completionDate.getMonth() + 1) === monthNum;
        }).length;

        // Productos más producidos (requiere que las órdenes tengan info del producto y cantidad)
        // Esto es una simplificación. En realidad, necesitarías agrupar por producto.
        const productCounts = {};
        allOrders.forEach(order => {
            if (order.status === 'completada' || order.status === 'finalizada') { // Solo contar las completadas/finalizadas
                const productName = order.productName || `Producto ID ${order.idProduct}` || 'Desconocido'; // Asume que tienes productName o idProduct
                productCounts[productName] = (productCounts[productName] || 0) + (Number(order.quantity) || 1); // Asume 'quantity'
            }
        });
        const productosMasProducidos = Object.entries(productCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5) // Top 5
            .map(p => ({...p, fill: getRandomColor() }));


        setProduccionData({
          ordenesActivas,
          ordenesCompletadasMes,
          productosMasProducidos,
          eficienciaProduccionPct: Math.floor(Math.random() * 15) + 80, // Simulado
        });

      } catch (err) {
        console.error("Critical error fetching produccion data:", err);
        setError(err.message || "Error al cargar datos de producción.");
      } finally {
        setIsLoading(false);
      }
    };
    if (selectedYear && selectedMonth) {
        fetchProduccionData();
    }
  }, [selectedYear, selectedMonth]);

  const getRandomColor = () => {
    const letters = '0123456789ABCDEF'; let color = '#';
    for (let i = 0; i < 6; i++) { color += letters[Math.floor(Math.random() * 16)]; }
    return color;
  };

  if (isLoading) {
    return (
      <div className="flup-content-loading-state">
        <Clock size={32} className="animate-spin-slow" />
        <p>Cargando Producción...</p>
      </div>
    );
  }

  if (error || !produccionData) {
    return <div className="flup-content-error-state">{error || "No hay datos disponibles para producción."}</div>;
  }

  return (
    <div className="animate-fadeIn">
      <div className="flup-kpi-grid">
        <StatCardFinance title="Órdenes Activas" value={formatNumber(produccionData.ordenesActivas)} icon={Clock} />
        <StatCardFinance title="Órdenes Completadas (Mes)" value={formatNumber(produccionData.ordenesCompletadasMes)} icon={PackageCheck}/>
        <StatCardFinance title="Eficiencia Producción" value={`${produccionData.eficienciaProduccionPct}%`} icon={BarChart2} />
        <StatCardFinance title="Unidades Producidas (Mes)" value={"N/A"} icon={PackageCheck} />
      </div>
      <div className="flup-charts-section">
        <div className="flup-chart-container">
          <h3 className="chart-title">Productos Más Producidos (Top 5 - Unidades Totales)</h3>
          {produccionData.productosMasProducidos.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={produccionData.productosMasProducidos} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={150} tick={{fontSize: 11}} />
                <Tooltip formatter={(value) => [formatNumber(value), "Unidades"]}/>
                <Legend />
                <Bar dataKey="count" name="Unidades Producidas" barSize={20}>
                    {produccionData.productosMasProducidos.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <ChartPlaceholder text="No hay datos de productos para mostrar." />}
        </div>
        <div className="flup-chart-container">
          <h3 className="chart-title">Estado Órdenes de Producción (Placeholder)</h3>
          <ChartPlaceholder text="Gráfico de Estado de Órdenes (Próximamente)" />
          {/* Aquí podrías tener un PieChart mostrando el % de órdenes en_proceso, pendientes, completadas etc. */}
        </div>
      </div>
    </div>
  );
};

export default ProduccionSection;