// RUTA: src/views/Dashboard/sections/ProveedoresSection.jsx

import React, { useCallback } from 'react';
import { Truck, ListChecks, DollarSign, Award, Repeat, UserCheck } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';
import { useDashboardSection } from '../hooks/useDashboardSection';
import StatCard from '../components/StatCard';
import ChartPlaceholder from '../components/ChartPlaceholder';
import { formatCurrency, formatNumber, getRandomColor } from '../utils/formatters';
import proveedorService from '../../../services/proveedorSevice';
import registerPurchaseService from '../../../services/registroCompraService';

const ProveedoresSection = ({ selectedYear, selectedMonth }) => {
  const fetchProviderData = useCallback(async () => {
    const yearNum = parseInt(selectedYear);
    const monthNum = parseInt(selectedMonth);

    const [providersResult, purchasesResult] = await Promise.all([
      proveedorService.getAllProveedores(),
      registerPurchaseService.getAllRegisterPurchasesWithDetails(),
    ]);

    // --- KPI 1: Total Compras del Mes ---
    const purchasesInMonth = (Array.isArray(purchasesResult) ? purchasesResult : []).filter(p => {
        const pDate = new Date(p.date);
        return pDate.getFullYear() === yearNum && (pDate.getMonth() + 1) === monthNum;
    });
    const totalComprasMes = purchasesInMonth.reduce((sum, p) => sum + (Number(p.totalAmount) || 0), 0);
    
    // --- Lógica para Insumos compartidos y Proveedor principal ---
    const allProviders = Array.isArray(providersResult) ? providersResult : [];
    const allPurchases = Array.isArray(purchasesResult) ? purchasesResult : [];

    // Mapeo para contar insumos por proveedor y por insumo
    const supplyByProviderCount = {}; // { providerName: Set(supplyName1, supplyName2), ... }
    const providersBySupplyCount = {}; // { supplyName: Set(providerName1, providerName2), ... }

    allPurchases.forEach(purchase => {
      const providerName = purchase.provider?.providerName || 'Proveedor Desconocido';
      if (!supplyByProviderCount[providerName]) {
        supplyByProviderCount[providerName] = new Set();
      }

      purchase.purchaseDetails?.forEach(detail => {
        const supplyName = detail.insumo?.supplierName;
        if (supplyName) {
          supplyByProviderCount[providerName].add(supplyName);

          if (!providersBySupplyCount[supplyName]) {
            providersBySupplyCount[supplyName] = new Set();
          }
          providersBySupplyCount[supplyName].add(providerName);
        }
      });
    });

    // KPI 2: Insumos compartidos por 2 o más proveedores
    const insumosCompartidosCount = Object.values(providersBySupplyCount).filter(providersSet => providersSet.size >= 2).length;

    // KPI 3: Proveedor con más insumos únicos comprados
    let proveedorPrincipal = "N/A";
    let maxSupplies = 0;
    Object.entries(supplyByProviderCount).forEach(([providerName, suppliesSet]) => {
      if (suppliesSet.size > maxSupplies) {
        maxSupplies = suppliesSet.size;
        proveedorPrincipal = providerName;
      }
    });

    // Gráfico: Top Proveedores por Gasto Total (Histórico)
    const providerTotalSpending = allPurchases.reduce((acc, purchase) => {
        const providerName = purchase.provider?.providerName || 'Desconocido';
        acc[providerName] = (acc[providerName] || 0) + (Number(purchase.totalAmount) || 0);
        return acc;
    }, {});
    
    const topSpendingProvidersChart = Object.entries(providerTotalSpending)
        .map(([name, total]) => ({ name, 'Gasto Total': total, fill: getRandomColor() }))
        .sort((a,b) => b['Gasto Total'] - a['Gasto Total'])
        .slice(0, 10);

    // Gráfico: Top Insumos comprados por múltiples proveedores
     const sharedSuppliesChart = Object.entries(providersBySupplyCount)
        .filter(([, providersSet]) => providersSet.size >= 2)
        .map(([name, providersSet]) => ({ name, 'Nº Proveedores': providersSet.size, fill: getRandomColor() }))
        .sort((a, b) => b['Nº Proveedores'] - a['Nº Proveedores'])
        .slice(0, 10);


    return {
      totalComprasMes,
      insumosCompartidosCount,
      proveedorPrincipal,
      proveedoresActivos: allProviders.filter(p => p.status === true).length,
      topSpendingProvidersChart,
      sharedSuppliesChart,
    };
  }, [selectedYear, selectedMonth]);

  const { data, isLoading, error } = useDashboardSection(fetchProviderData, [selectedYear, selectedMonth]);

  if (isLoading) return <div className="loading-state-finance"><Truck size={32} className="lucide-spin" /><p>Cargando Proveedores...</p></div>;
  if (error || !data) return <div className="error-state-finance">{error || "No se pudieron cargar los datos de proveedores."}</div>;

  return (
    <div className="animate-fadeIn">
      <div className="kpi-grid-finance">
         <StatCard title="Proveedores Activos" value={formatNumber(data.proveedoresActivos)} icon={UserCheck} />
         <StatCard title="Total Compras (Mes)" value={formatCurrency(data.totalComprasMes)} icon={ListChecks}/>
         <StatCard title="Insumos Compartidos" value={formatNumber(data.insumosCompartidosCount)} icon={Repeat} info="Insumos ofrecidos por 2+ proveedores"/>
         <StatCard title="Proveedor Principal" value={data.proveedorPrincipal} icon={Award} info="Con más variedad de insumos comprados"/>
      </div>
      
      <div className="charts-section-finance" style={{gridTemplateColumns: '1fr 1fr', gap: '1.5rem'}}>
        <div className="content-card-finance">
            <h3 className="card-title-main">Top 10 Proveedores por Gasto Histórico</h3>
            {data.topSpendingProvidersChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={data.topSpendingProvidersChart} layout="vertical" margin={{ left: 120 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false}/>
                        <XAxis type="number" tickFormatter={(value) => formatCurrency(value, 0).replace('$', '')} />
                        <YAxis type="category" dataKey="name" width={110} tick={{fontSize: 11}}/>
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Bar dataKey="Gasto Total" barSize={20}>
                            {data.topSpendingProvidersChart.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            ) : <ChartPlaceholder text="No hay datos de compras para mostrar." icon={DollarSign}/>}
        </div>
        <div className="content-card-finance">
            <h3 className="card-title-main">Insumos Más Compartidos entre Proveedores</h3>
            {data.sharedSuppliesChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={data.sharedSuppliesChart} layout="vertical" margin={{ left: 120 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false}/>
                        <XAxis type="number" allowDecimals={false} domain={[0, dataMax => Math.max(2, dataMax)]} />
                        <YAxis type="category" dataKey="name" width={110} tick={{fontSize: 11}}/>
                        <Tooltip formatter={(value) => [`Ofrecido por ${value} proveedores`]}/>
                        <Bar dataKey="Nº Proveedores" barSize={20}>
                            {data.sharedSuppliesChart.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            ) : <ChartPlaceholder text="No hay insumos compartidos entre proveedores." icon={Repeat}/>}
        </div>
      </div>
    </div>
  );
};

export default ProveedoresSection;