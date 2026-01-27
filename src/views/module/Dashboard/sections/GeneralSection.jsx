// RUTA: src/views/Dashboard/sections/GeneralSection.jsx

import React, { useCallback } from 'react';
import { Users, DollarSign, PackageCheck, Clock, Wrench, Cpu, ShoppingCart, TrendingUp } from 'lucide-react';
// <-- CAMBIO: Se importa AreaChart y Area para el nuevo gráfico de compras -->
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie, Sector } from 'recharts';

import { useDashboardSection } from '../hooks/useDashboardSection';
import StatCard from '../components/StatCard';
import ChartPlaceholder from '../components/ChartPlaceholder';
import { formatCurrency, formatNumber, getRandomColor } from '../utils/formatters';
// ... (tus imports de servicios se mantienen igual)
import clientesService from '../../../services/clientesService';
import monthlyOverallExpenseService from '../../../services/MonthlyOverallExpenseService';
import productionOrderService from '../../../services/productionOrderService';
import registerPurchaseService from '../../../services/registroCompraService';
import specSheetService from '../../../services/specSheetService';


// ===================================================================
// ===         NUEVAS FUNCIONES PARA GRÁFICOS PERSONALIZADOS         ===
// ===================================================================

// --- Componente para Tooltip Personalizado con mejor estilo ---
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip-finance">
        <p className="label">{`${label}`}</p>
        <p className="intro">{`${payload[0].name}: ${payload[0].value.toLocaleString()}`}</p>
        {payload[0].payload.extraInfo && <p className="desc">{payload[0].payload.extraInfo}</p>}
      </div>
    );
  }
  return null;
};

// --- Componente para renderizar la forma activa de un PieChart (efecto al pasar el ratón) ---
const renderActiveShape = (props) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} fontSize={16} fontWeight="bold">
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333" fontWeight="bold">{`${formatNumber(value)} uds`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
        {`(${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};


const GeneralSection = ({ selectedYear, selectedMonth }) => {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const onPieEnter = useCallback((_, index) => {
    setActiveIndex(index);
  }, []);
  
  const fetchGeneralData = useCallback(async () => {
    // ... (la lógica de fetch que ya funciona se mantiene idéntica)
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
      productionOrderService.getAllProductionOrders({ includeDetails: true }),
      registerPurchaseService.getAllRegisterPurchasesWithDetails(),
      specSheetService.getAllSpecSheets({ includeSupplies: true }),
    ]);

    const getData = (result) => {
        if (result.status === 'fulfilled' && result.value) {
            if (result.value.data && Array.isArray(result.value.data)) return result.value.data;
            if (Array.isArray(result.value)) return result.value;
        }
        return [];
    };

    const allClients = getData(clientsResult);
    const allOrders = getData(ordersResult);
    const allPurchases = getData(purchasesResult);
    const allSpecSheets = getData(specSheetsResult);
    
    const activeClients = allClients.filter(c => c.Estado === "Activo").length;
    const totalExpensesMonth = (expensesResult.status === 'fulfilled') ? expensesResult.value?.totalExpense ?? 0 : 0;
    const activeProductionOrders = allOrders.filter(o => {
        const status = o.status || o.state;
        if (!status) return false;
        return ["en_proceso", "pendiente", "activa", "en configuracion"].includes(status.toLowerCase());
    }).length;

    const purchasesInMonth = allPurchases.filter(p => {
        const purchaseDate = new Date(p.date || p.purchaseDate);
        return purchaseDate.getFullYear() === yearNum && (purchaseDate.getMonth() + 1) === monthNum;
    });
    const totalPurchasesMonth = purchasesInMonth.reduce((sum, p) => sum + (Number(p.totalAmount) || 0), 0);
    
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
    const dailyPurchases = Array.from({ length: daysInMonth }, (_, i) => ({ name: `Día ${i + 1}`, Compras: 0 }));
    purchasesInMonth.forEach(p => {
        const dayOfMonth = new Date(p.date || p.purchaseDate).getDate();
        if (dailyPurchases[dayOfMonth - 1]) {
            dailyPurchases[dayOfMonth - 1].Compras += Number(p.totalAmount) || 0;
        }
    });
    const purchasesChartData = dailyPurchases;

    const supplyCount = allSpecSheets.reduce((acc, sheet) => {
        if (Array.isArray(sheet.specSheetSupplies)) {
            sheet.specSheetSupplies.forEach(supplyDetail => {
                const supplyName = supplyDetail.supply?.supplyName;
                if (supplyName) acc[supplyName] = (acc[supplyName] || 0) + 1;
            });
        }
        return acc;
    }, {});
    const supplyUsageInSpecSheets = Object.entries(supplyCount)
        .map(([name, count], index) => ({ name, value: count, fill: `hsl(${index * 60}, 70%, 50%)` }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

    const productProductionCount = allOrders.reduce((acc, order) => {
        const productName = order.productNameSnapshot || 'Producto Desconocido';
        const quantity = Number(order.initialAmount) || 0;
        if (productName !== 'Producto Desconocido' && quantity > 0) acc[productName] = (acc[productName] || 0) + quantity;
        return acc;
    }, {});
    const topProducedProducts = Object.entries(productProductionCount)
        .map(([name, totalQuantity], index) => ({ name, value: totalQuantity, fill: `hsl(${index * 75 + 200}, 70%, 60%)` }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

    return {
      kpiData: { activeClients, totalExpensesMonth, activeProductionOrders, totalPurchasesMonth },
      purchasesChartData,
      supplyUsageInSpecSheets,
      topProducedProducts,
    };
  }, [selectedYear, selectedMonth]);

  const { data, isLoading, error } = useDashboardSection(fetchGeneralData, [selectedYear, selectedMonth]);

  if (isLoading) return <div className="loading-state-finance"><Clock size={32} className="lucide-spin" /><p>Cargando Dashboard General...</p></div>;
  if (error) return <div className="error-state-finance">{error || "No se pudieron cargar los datos."}</div>;

  const { 
    kpiData = {}, 
    purchasesChartData = [], 
    supplyUsageInSpecSheets = [], 
    topProducedProducts = [] 
  } = data || {};

  return (
    <div className="animate-fadeIn">
      <div className="kpi-grid-finance">
        <StatCard title="Clientes Activos" value={formatNumber(kpiData.activeClients)} icon={Users} />
        <StatCard title="Gasto Total (Mes)" value={formatCurrency(kpiData.totalExpensesMonth)} icon={DollarSign} />
        <StatCard title="Órdenes en Proceso" value={formatNumber(kpiData.activeProductionOrders)} icon={PackageCheck} />
        <StatCard title="Compras (Mes)" value={formatCurrency(kpiData.totalPurchasesMonth)} icon={ShoppingCart}/>
      </div>
      
      {/* =================================================================== */}
      {/* ===              NUEVO GRÁFICO DE COMPRAS (ÁREA)                === */}
      {/* =================================================================== */}
      <div className="content-card-finance" style={{margin: '1.5rem 0'}}>
        <h3 className="card-title-main">Evolución de Compras del Mes</h3>
        {purchasesChartData.some(d => d.Compras > 0) ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={purchasesChartData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorComprasGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.3} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} tickFormatter={(label) => label.replace('Día ','')} />
              <YAxis tickFormatter={(value) => formatCurrency(value, 0)} tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="Compras" stroke="#8884d8" fillOpacity={1} fill="url(#colorComprasGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <ChartPlaceholder text="No se registraron compras este mes." icon={TrendingUp} />
        )}
      </div>

      <div className="bottom-charts-grid-finance">
          {/* =================================================================== */}
          {/* ===       NUEVO GRÁFICO DE INSUMOS (BARRAS MEJORADO)          === */}
          {/* =================================================================== */}
          <div className="content-card-finance">
              <h3 className="card-title-main">Top Insumos en Fichas Técnicas</h3>
              {supplyUsageInSpecSheets.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={supplyUsageInSpecSheets} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.2}/>
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={120} tick={{ fontSize: 12 }} />
                        <Tooltip cursor={{ fill: 'rgba(200, 200, 200, 0.1)' }} content={<CustomTooltip />} />
                        <Bar dataKey="value" name="Fichas" barSize={20} radius={[0, 10, 10, 0]}>
                           {supplyUsageInSpecSheets.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
              ) : (
                <ChartPlaceholder text="No hay datos de insumos en fichas técnicas." icon={Wrench} />
              )}
          </div>
          {/* =================================================================== */}
          {/* ===        NUEVO GRÁFICO DE PRODUCTOS (DONA INTERACTIVA)        === */}
          {/* =================================================================== */}
          <div className="content-card-finance">
               <h3 className="card-title-main">Proporción de Productos Producidos</h3>
               {topProducedProducts.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            activeIndex={activeIndex}
                            activeShape={renderActiveShape}
                            data={topProducedProducts}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={100}
                            dataKey="value"
                            onMouseEnter={onPieEnter}
                        >
                          {topProducedProducts.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill}/>)}
                        </Pie>
                         <Legend iconType="circle" />
                    </PieChart>
                </ResponsiveContainer>
               ) : (
                <ChartPlaceholder text="No hay productos completados." icon={Cpu} />
               )}
          </div>
      </div>
    </div>
  );
};

export default GeneralSection;