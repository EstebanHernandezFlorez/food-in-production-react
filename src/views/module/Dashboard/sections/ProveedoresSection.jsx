// RUTA: src/views/Dashboard/sections/ProveedoresSection.jsx

import React, { useCallback } from 'react';
// Se usa el icono BarChart3 para el nuevo gráfico
import { Truck, DollarSign, Award, CheckSquare, Repeat, BarChart3 } from 'lucide-react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
} from 'recharts';
import { subMonths, startOfMonth, endOfMonth } from 'date-fns';

import { useDashboardSection } from '../hooks/useDashboardSection';
import StatCard from '../components/StatCard';
import ChartPlaceholder from '../components/ChartPlaceholder';
import { formatCurrency, getRandomColor, formatNumber } from '../utils/formatters';

import proveedorService from '../../../services/proveedorSevice';
import registerPurchaseService from '../../../services/registroCompraService';
import specSheetService from '../../../services/specSheetService';

// Tooltip para el gráfico de Área (sin cambios)
const CustomAreaTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="custom-tooltip-finance">
                <p className="label">{`Mes: ${label}`}</p>
                <p className="intro" style={{ color: payload[0].color }}>
                    {`${payload[0].name}: ${formatCurrency(payload[0].value)}`}
                </p>
            </div>
        );
    }
    return null;
};

const ProveedoresSection = ({ selectedYear, selectedMonth }) => {
    const fetchProviderData = useCallback(async () => {
        const yearNum = parseInt(selectedYear);
        const monthNum = parseInt(selectedMonth);
        const currentDate = new Date(yearNum, monthNum - 1, 1);

        const [
            allPurchases,
            allSpecSheets
        ] = await Promise.all([
            registerPurchaseService.getAllRegisterPurchasesWithDetails(),
            specSheetService.getAllSpecSheets(),
        ]);

        const purchasesInMonth = (allPurchases || []).filter(p => {
            if (!p.purchaseDate) return false;
            const pDate = new Date(p.purchaseDate);
            return pDate.getFullYear() === yearNum && (pDate.getMonth() + 1) === monthNum;
        });

        const totalComprasMes = purchasesInMonth.reduce((sum, p) => sum + (Number(p.totalAmount) || 0), 0);
        
        const purchaseCountByProvider = purchasesInMonth.reduce((acc, purchase) => {
            const providerName = purchase.provider?.company || 'Desconocido';
            acc[providerName] = (acc[providerName] || 0) + 1;
            return acc;
        }, {});
        
        const proveedorPrincipal = Object.keys(purchaseCountByProvider).length > 0
            ? Object.entries(purchaseCountByProvider).sort((a, b) => b[1] - a[1])[0][0]
            : "N/A";
        
        const supplyUsageCount = (allSpecSheets || []).reduce((acc, sheet) => {
            (sheet.specSheetSupplies || []).forEach(supplyItem => {
                const supplyName = supplyItem.supply?.supplyName;
                if (supplyName) {
                    acc[supplyName] = (acc[supplyName] || 0) + 1;
                }
            });
            return acc;
        }, {});
        const insumosEstrategicosCount = Object.values(supplyUsageCount).filter(count => count >= 2).length;

        const monthlyPurchases = Array.from({ length: 6 }).map((_, i) => {
            const d = subMonths(currentDate, i);
            const monthStart = startOfMonth(d);
            const monthEnd = endOfMonth(d);
            const monthName = d.toLocaleString('es-ES', { month: 'short' });
            const yearShort = d.getFullYear().toString().slice(-2);
            
            const total = (allPurchases || [])
                .filter(p => {
                    if (!p.purchaseDate) return false;
                    const pDate = new Date(p.purchaseDate);
                    return pDate >= monthStart && pDate <= monthEnd;
                })
                .reduce((sum, p) => sum + (Number(p.totalAmount) || 0), 0);

            return { name: `${monthName.charAt(0).toUpperCase() + monthName.slice(1)}. '${yearShort}`, 'Total Compras': total };
        }).reverse();
        
        const spendingByProvider = purchasesInMonth.reduce((acc, purchase) => {
            const providerName = purchase.provider?.company || 'Desconocido';
            acc[providerName] = (acc[providerName] || 0) + (Number(purchase.totalAmount) || 0);
            return acc;
        }, {});
        
        const spendingDistributionChart = Object.entries(spendingByProvider)
            .map(([name, value]) => ({ name, value, fill: getRandomColor() }))
            .sort((a,b) => b.value - a.value);

        const spendingBySupply = purchasesInMonth.reduce((acc, purchase) => {
            (purchase.details || []).forEach(detail => {
                const supplyName = detail.supply?.supplyName || 'Insumo Desconocido';
                const detailCost = Number(detail.subtotal) || (Number(detail.price) * Number(detail.quantity));
                if (supplyName && !isNaN(detailCost)) {
                    acc[supplyName] = (acc[supplyName] || 0) + detailCost;
                }
            });
            return acc;
        }, {});
        
        const topSpendingSuppliesChart = Object.entries(spendingBySupply)
            .map(([name, total]) => ({ name, 'Gasto en Insumo': total }))
            .sort((a, b) => b['Gasto en Insumo'] - a['Gasto en Insumo'])
            .slice(0, 10);

        return {
            totalComprasMes,
            proveedorPrincipal,
            insumosEstrategicosCount,
            monthlyPurchases,
            spendingDistributionChart,
            topSpendingSuppliesChart
        };
    }, [selectedYear, selectedMonth]);

    const { data, isLoading, error } = useDashboardSection(fetchProviderData, [selectedYear, selectedMonth]);

    const {
        totalComprasMes = 0,
        proveedorPrincipal = "N/A",
        insumosEstrategicosCount = 0,
        monthlyPurchases = [],
        spendingDistributionChart = [],
        topSpendingSuppliesChart = []
    } = data || {};

    if (isLoading) return <div className="loading-state-finance"><Truck size={32} className="lucide-spin" /><p>Cargando Datos de Proveedores...</p></div>;
    if (error) return <div className="error-state-finance">{error?.message || "No se pudieron cargar los datos de proveedores."}</div>;

    return (
        <div className="animate-fadeIn">
            <div className="kpi-grid-finance kpi-grid-cols-3-finance">
                <StatCard title="Total Compras (Mes)" value={formatCurrency(totalComprasMes)} icon={DollarSign} />
                <StatCard title="Proveedor Principal (Mes)" value={proveedorPrincipal} icon={Award} info="Proveedor con más órdenes de compra" />
                <StatCard title="Insumos Estratégicos" value={formatNumber(insumosEstrategicosCount)} icon={Repeat} info="Insumos usados en 2+ recetas" />
            </div>
            
            <div className="content-card-finance" style={{ marginBottom: '1.5rem' }}>
                <h3 className="card-title-main">Evolución de Compras (Últimos 6 Meses)</h3>
                {monthlyPurchases.some(d => d['Total Compras'] > 0) ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={monthlyPurchases}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis tickFormatter={(value) => formatCurrency(value, 0)} tick={{ fontSize: 11 }} />
                            <Tooltip content={<CustomAreaTooltip />} />
                            <Legend />
                            <Area type="monotone" dataKey="Total Compras" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : <ChartPlaceholder text="No hay datos de compras para mostrar la tendencia." icon={CheckSquare} />}
            </div>

            <div className="charts-section-finance" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                <div className="content-card-finance">
                    <h3 className="card-title-main">Distribución de Gasto por Proveedor (Mes Actual)</h3>
                    {spendingDistributionChart.length > 0 ? (
                        <ResponsiveContainer width="100%" height={350}>
                            <PieChart>
                                <Pie
                                    data={spendingDistributionChart}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={120}
                                    fill="#8884d8"
                                    dataKey="value"
                                    nameKey="name"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {spendingDistributionChart.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                                </Pie>
                                <Tooltip formatter={(value) => formatCurrency(value)} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : <ChartPlaceholder text="No hay compras registradas este mes." icon={DollarSign} />}
                </div>

                {/* --- GRÁFICO ACTUALIZADO A BARRAS VERTICALES CON GRADIENTE --- */}
                <div className="content-card-finance">
                    <h3 className="card-title-main">Top 10 Insumos por Gasto (Mes Actual)</h3>
                    {topSpendingSuppliesChart.length > 0 ? (
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={topSpendingSuppliesChart} margin={{ top: 20, right: 30, left: 20, bottom: 95 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis 
                                    dataKey="name" 
                                    angle={-45} 
                                    textAnchor="end"
                                    interval={0}
                                    tick={{ fontSize: 11 }}
                                />
                                <YAxis 
                                    tickFormatter={(value) => formatCurrency(value, 0)} 
                                    tick={{ fontSize: 11 }} 
                                />
                                <Tooltip 
                                    formatter={(value) => [formatCurrency(value), "Gasto"]}
                                    cursor={{ fill: 'rgba(206, 206, 206, 0.2)' }}
                                />
                                <Bar dataKey="Gasto en Insumo">
                                    {topSpendingSuppliesChart.map((entry, index) => (
                                        // Crea un gradiente de color azul
                                        <Cell key={`cell-${index}`} fill={`hsl(210, 80%, ${75 - index * 4}%)`} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <ChartPlaceholder text="No hay detalles de compras para mostrar." icon={BarChart3} />}
                </div>
            </div>
        </div>
    );
};

export default ProveedoresSection;