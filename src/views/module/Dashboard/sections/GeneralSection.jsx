// RUTA: src/views/Dashboard/sections/GeneralSection.jsx

import React, { useCallback, useMemo } from 'react';
import { Users, DollarSign, PackageCheck, Clock, Wrench, Cpu, ShoppingCart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Importaciones de servicios
import { useDashboardSection } from '../hooks/useDashboardSection';
import StatCard from '../components/StatCard';
import ChartPlaceholder from '../components/ChartPlaceholder';
import { formatCurrency, formatNumber, getRandomColor } from '../utils/formatters';
import clientesService from '../../../services/clientesService';
import monthlyOverallExpenseService from '../../../services/MonthlyOverallExpenseService';
import productionOrderService from '../../../services/productionOrderService';
import registerPurchaseService from '../../../services/registroCompraService';
import specSheetService from '../../../services/specSheetService';

const GeneralSection = ({ selectedYear, selectedMonth }) => {
  const fetchGeneralData = useCallback(async () => {
    const yearNum = parseInt(selectedYear);
    const monthNum = parseInt(selectedMonth);

    const [
        clientsResult, 
        expensesResult, 
        ordersResult, 
        purchasesResult,
        specSheetsResult,
    ] = await Promise.allSettled([
      clientesService.getAllClientes(),
      monthlyOverallExpenseService.getTotalExpenseByMonth(yearNum, monthNum),
      productionOrderService.getAllProductionOrders(),
      registerPurchaseService.getAllRegisterPurchasesWithDetails(),
      specSheetService.getAllSpecSheets(),
    ]);

    // 1. KPI: Clientes Activos
    const activeClients = (clientsResult.status === 'fulfilled' && Array.isArray(clientsResult.value)) 
      ? clientsResult.value.filter(c => c.Estado === "Activo").length 
      : 0;

    // 2. KPI: Gasto Total del Mes
    const totalExpensesMonth = (expensesResult.status === 'fulfilled') 
      ? expensesResult.value?.totalExpense ?? 0 
      : 0;
    
    // 3. KPI: Órdenes de Producción Activas ('en proceso' y 'pendiente/configuracion')
    const activeProductionOrders = (ordersResult.status === 'fulfilled' && Array.isArray(ordersResult.value)) 
      ? ordersResult.value.filter(o => ["en_proceso", "pendiente"].includes(o.status?.toLowerCase())).length 
      : 0;

    // --- Procesamiento de Compras para KPI y Gráfico ---
    let totalPurchasesMonth = 0;
    let purchasesChartData = [];
    if (purchasesResult.status === 'fulfilled' && Array.isArray(purchasesResult.value)) {
        const purchasesInMonth = purchasesResult.value.filter(p => {
            const purchaseDate = new Date(p.date);
            return purchaseDate.getFullYear() === yearNum && (purchaseDate.getMonth() + 1) === monthNum;
        });

        // 4. KPI: Total de Compras del Mes
        totalPurchasesMonth = purchasesInMonth.reduce((sum, p) => sum + (Number(p.totalAmount) || 0), 0);

        // 5. GRÁFICO: Resumen de Registros de Compras por día
        const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
        const dailyPurchases = Array.from({ length: daysInMonth }, (_, i) => ({
            name: `Día ${i + 1}`,
            'Total Compra': 0,
        }));

        purchasesInMonth.forEach(p => {
            const dayOfMonth = new Date(p.date).getDate();
            if (dailyPurchases[dayOfMonth - 1]) {
                dailyPurchases[dayOfMonth - 1]['Total Compra'] += Number(p.totalAmount) || 0;
            }
        });
        purchasesChartData = dailyPurchases;
    }

    // 6. GRÁFICO: Insumos en Fichas Técnicas
    let supplyUsageInSpecSheets = [];
    if (specSheetsResult.status === 'fulfilled' && Array.isArray(specSheetsResult.value)) {
        const supplyCount = specSheetsResult.value.reduce((acc, sheet) => {
            if (Array.isArray(sheet.supplies)) {
                sheet.supplies.forEach(supplyDetail => {
                    const supplyName = supplyDetail.supply?.supplierName || 'Desconocido';
                    acc[supplyName] = (acc[supplyName] || 0) + 1;
                });
            }
            return acc;
        }, {});

        supplyUsageInSpecSheets = Object.entries(supplyCount)
            .map(([name, count]) => ({ name, 'Fichas': count, fill: getRandomColor() }))
            .sort((a, b) => b.Fichas - a.Fichas)
            .slice(0, 5);
    }

    // 7. GRÁFICO: Insumos más usados en Órdenes de Producción
    let topUsedSuppliesInProduction = [];
    if (ordersResult.status === 'fulfilled' && Array.isArray(ordersResult.value)) {
        const supplyFrequency = ordersResult.value.reduce((acc, order) => {
             const orderDate = new Date(order.creationDate);
             if (orderDate.getFullYear() === yearNum && (orderDate.getMonth() + 1) === monthNum) {
                if(Array.isArray(order.consumedSupplies)) {
                    // Usamos un Set para contar cada insumo solo una vez por orden, sin importar cuántas veces se usó
                    const uniqueSuppliesInOrder = new Set(order.consumedSupplies.map(cs => cs.supply?.supplierName).filter(Boolean));
                    uniqueSuppliesInOrder.forEach(supplyName => {
                        acc[supplyName] = (acc[supplyName] || 0) + 1;
                    });
                }
             }
             return acc;
        }, {});

        topUsedSuppliesInProduction = Object.entries(supplyFrequency)
            .map(([name, count]) => ({ name, 'Órdenes': count, fill: getRandomColor() }))
            .sort((a, b) => b['Órdenes'] - a['Órdenes'])
            .slice(0, 5);
    }
    
    return {
      kpiData: { activeClients, totalExpensesMonth, activeProductionOrders, totalPurchasesMonth },
      purchasesChartData,
      supplyUsageInSpecSheets,
      topUsedSuppliesInProduction,
    };
  }, [selectedYear, selectedMonth]);

  const { data, isLoading, error } = useDashboardSection(fetchGeneralData, [selectedYear, selectedMonth]);

  if (isLoading) return <div className="loading-state-finance"><Clock size={32} className="lucide-spin" /><p>Cargando Dashboard General...</p></div>;
  if (error || !data) return <div className="error-state-finance">{error || "No se pudieron cargar los datos."}</div>;

  const { kpiData, purchasesChartData, supplyUsageInSpecSheets, topUsedSuppliesInProduction } = data;

  return (
    <div className="animate-fadeIn">
      <div className="kpi-grid-finance">
        <StatCard title="Clientes Activos" value={formatNumber(kpiData.activeClients)} icon={Users} />
        <StatCard title="Gasto Total del Mes" value={formatCurrency(kpiData.totalExpensesMonth)} icon={DollarSign} />
        <StatCard title="Órdenes en Proceso" value={formatNumber(kpiData.activeProductionOrders)} icon={PackageCheck} />
        <StatCard title="Compras del Mes" value={formatCurrency(kpiData.totalPurchasesMonth)} icon={ShoppingCart}/>
      </div>
      
      <div className="charts-section-finance" style={{gap: '1.5rem', marginBottom: '1.5rem'}}>
        <div className="content-card-finance">
          <h3 className="card-title-main">Resumen de Compras del Mes</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={purchasesChartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(value) => formatCurrency(value, 0).replace('$', '')} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="Total Compra" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bottom-charts-grid-finance">
          <div className="content-card-finance">
              <h3 className="card-title-main">Top Insumos en Fichas Técnicas</h3>
              {supplyUsageInSpecSheets && supplyUsageInSpecSheets.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={supplyUsageInSpecSheets} layout="vertical" margin={{ left: 120 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(value) => [`${value} fichas`]}/>
                        <Bar dataKey="Fichas" barSize={20}>
                           {supplyUsageInSpecSheets.map(entry => <Cell key={entry.name} fill={entry.fill} />)}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
              ) : (
                <ChartPlaceholder text="No hay datos de insumos en fichas técnicas." icon={Wrench} />
              )}
          </div>
          <div className="content-card-finance">
               <h3 className="card-title-main">Top Insumos en Órdenes de Producción (Mes)</h3>
               {topUsedSuppliesInProduction && topUsedSuppliesInProduction.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topUsedSuppliesInProduction} layout="vertical" margin={{ left: 120 }}>
                       <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                       <XAxis type="number" allowDecimals={false} />
                       <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                       <Tooltip formatter={(value) => [`Presente en ${value} órdenes`]} />
                       <Bar dataKey="Órdenes" barSize={20}>
                            {topUsedSuppliesInProduction.map(entry => <Cell key={entry.name} fill={entry.fill} />)}
                       </Bar>
                    </BarChart>
                </ResponsiveContainer>
               ) : (
                <ChartPlaceholder text="No hay insumos usados en producción este mes." icon={Cpu} />
               )}
          </div>
      </div>
    </div>
  );
};

export default GeneralSection;