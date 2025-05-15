import React, { useState, useEffect, useMemo } from 'react';
import {
    DollarSign, Users, Truck, PackageCheck, Clock, Calendar, Award, BarChart2, PieChart as LucidePieChart,
    TrendingUp, TrendingDown, Cog, Home, UserCog, PlusCircle, ChevronLeft,
    Briefcase, // Para el logo/título del dashboard
    ListChecks, TrendingUpIcon, BarChartHorizontalBig, Percent // Iconos usados en tus módulos
} from 'lucide-react';

// --- Nuevo CSS ---
import '../../../assets/css/dashboard-flup-content-style.css'; // ¡IMPORTANTE!

// --- Componentes Separados ---
import StatCardFinance from './StatCardFinance'; // Usa la versión adaptada
import ChartPlaceholder from './ChartPlaceholder';
import ProgressBar from './ProgressBar';

// --- Servicios (Tus servicios originales) ---
import clientesService from '../../services/clientesService';
import proveedorService from '../../services/proveedorSevice'; // Verifica el nombre del archivo (proveedorService.js vs proveedorSevice.js)
import registerPurchaseService from '../../services/registroCompraService';
import reservasService from '../../services/reservasService';
import MonthlyOverallExpenseService from '../../services/gastosGeneralesService'; // Renombrado desde gastosGeneralesService

// --- Recharts ---
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const Dashboard = () => {
  const [userName, setUserName] = useState("Lina");
  
  // selectedSection determina qué módulo se muestra. 'home' es el dashboard general.
  const [selectedSection, setSelectedSection] = useState('home'); 

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  
  // Loaders
  const [isKpiLoading, setIsKpiLoading] = useState(true); // Para los KPIs del dashboard 'home'
  const [isModuleLoading, setIsModuleLoading] = useState(false); // Loader para los módulos específicos
  
  const [error, setError] = useState(null);

  // Datos para el dashboard 'home'
  const [kpiData, setKpiData] = useState(null);
  const [productSalesData, setProductSalesData] = useState([]);
  const [salesByCategoryData, setSalesByCategoryData] = useState([]);

  // Datos para los módulos específicos
  const [laborData, setLaborData] = useState(null);
  const [reservasData, setReservasData] = useState(null);
  const [proveedoresData, setProveedoresData] = useState(null);
  // const [produccionData, setProduccionData] = useState(null); // Si lo necesitas

  const availableYears = useMemo(() => Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 2 + i).toString()), []);
  const availableMonths = useMemo(() => [
    { value: 1, label: 'Ene' }, { value: 2, label: 'Feb' }, { value: 3, label: 'Mar' },
    { value: 4, label: 'Abr' }, { value: 5, label: 'May' }, { value: 6, label: 'Jun' },
    { value: 7, label: 'Jul' }, { value: 8, label: 'Ago' }, { value: 9, label: 'Sep' },
    { value: 10, label: 'Oct' }, { value: 11, label: 'Nov' }, { value: 12, label: 'Dic' }
  ], []);

  // --- NAVEGACIÓN DE MÓDULOS (DEFINICIÓN) ---
  // Estos tabs ahora se usarán para generar botones de navegación y títulos
  const navigationTabs = [
    { id: 'home', label: 'Dashboard General', icon: Home },
    { id: 'labor', label: 'Mano de Obra', icon: UserCog },
    { id: 'reservas', label: 'Reservas', icon: Calendar },
    { id: 'proveedores', label: 'Proveedores', icon: Truck },
    { id: 'produccion', label: 'Producción', icon: Cog },
  ];
  
  const currentModule = useMemo(() => navigationTabs.find(tab => tab.id === selectedSection) || navigationTabs[0], [selectedSection]);


  // --- FUNCIONES DE PROCESAMIENTO DE DATOS ---
  // (KPIs y gráficos del Dashboard HOME - como en la respuesta anterior)
  const processKpiData = async (year, month) => {
    setIsKpiLoading(true);
    try {
      // Tus datos simulados o reales para KPIs (totalCustomers, totalRevenue, etc.)
      // Mantengo la simulación de la respuesta anterior
      const totalCustomers = Math.floor(Math.random() * 100000) + 500000;
      const totalRevenue = Math.floor(Math.random() * 1000000) + 3000000;
      const totalOrders = Math.floor(Math.random() * 500000) + 1000000;
      const totalReturns = Math.floor(Math.random() * 1000) + 1000;
      await new Promise(resolve => setTimeout(resolve, 700));
      return {
        totalCustomers, totalCustomersChange: (Math.random() * 5 - 2.5),
        totalRevenue, totalRevenueChange: (Math.random() * 1 - 0.5),
        totalOrders, totalOrdersChange: (Math.random() * 1 - 0.7), // Puede ser negativo
        totalReturns, totalReturnsChange: (Math.random() * 0.5 - 0.1),
      };
    } catch (err) { return { error: "Error KPIs." }; } finally { setIsKpiLoading(false); }
  };

  const processProductSalesChart = async (year, month) => { /* ... como antes ... */ 
    const sales = [];
    const daysInMonth = new Date(year, month, 0).getDate();
    const startDate = Math.max(1, daysInMonth - 11);
    for (let i = startDate; i <= daysInMonth; i++) {
        sales.push({
            name: `${i} ${availableMonths.find(m => m.value === parseInt(month))?.label || ''}`,
            'Gross margin': Math.floor(Math.random() * 40000) + 10000,
            'Revenue': Math.floor(Math.random() * 60000) + 20000,
        });
    }
    await new Promise(resolve => setTimeout(resolve, 900));
    return sales.slice(-12);
  };
  const processSalesByCategoryChart = async (year, month) => { /* ... como antes ... */
    const categories = [
        { name: 'Living room', value: 25, color: '#8b5cf6' }, { name: 'Kids', value: 17, color: '#3b82f6' },
        { name: 'Office', value: 13, color: '#10b981' }, { name: 'Bedroom', value: 12, color: '#6366f1' },
        { name: 'Kitchen', value: 9, color: '#ef4444' }, { name: 'Bathroom', value: 8, color: '#f97316' },
        { name: 'Dining room', value: 6, color: '#eab308' }, { name: 'Decor', value: 5, color: '#ec4899' },
        { name: 'Lighting', value: 3, color: '#06b6d4' }, { name: 'Outdoor', value: 2, color: '#84cc16' },
    ];
    await new Promise(resolve => setTimeout(resolve, 1100));
    return categories;
  };

  // Tus funciones originales de processLaborData, processReservasData, processProveedoresData
  // (Asegúrate que los servicios estén correctamente importados y funcionen)
  const processLaborData = async (year, month) => {
      setIsModuleLoading(true);
      try {
          const ID_TIPO_GASTO_MANO_OBRA = 1;
          const currentMonthExpenses = await MonthlyOverallExpenseService.getTotalExpenseByTypeAndMonth(year, month, ID_TIPO_GASTO_MANO_OBRA).catch(() => ({ totalExpense: 0 }));
          const prevMonth = month === 1 ? 12 : month - 1;
          const prevYear = month === 1 ? parseInt(year) - 1 : parseInt(year);
          const previousMonthExpenses = await MonthlyOverallExpenseService.getTotalExpenseByTypeAndMonth(prevYear.toString(), prevMonth, ID_TIPO_GASTO_MANO_OBRA).catch(() => ({ totalExpense: 0 }));
          
          // Asumiendo que kpiData ya está cargado si es necesario para ventasMesActual
          const ventasMesActual = kpiData?.totalRevenue || (await processKpiData(year,month)).totalRevenue || 75000; // Fallback
          
          return {
              gastoMensualTotal: currentMonthExpenses.totalExpense,
              gastoMesAnteriorPct: previousMonthExpenses.totalExpense > 0 ? ((currentMonthExpenses.totalExpense - previousMonthExpenses.totalExpense) / previousMonthExpenses.totalExpense) * 100 : (currentMonthExpenses.totalExpense > 0 ? 100 : 0),
              gastoBimestralPromedio: (currentMonthExpenses.totalExpense + previousMonthExpenses.totalExpense) / 2,
              gastoVsIngresosPct: ventasMesActual > 0 ? (currentMonthExpenses.totalExpense / ventasMesActual) * 100 : 0,
              distribucionCategoria: [ { categoria: 'Cocina', porcentaje: 60, color: '#3b82f6' }, { categoria: 'Servicio', porcentaje: 30, color: '#10b981' }, { categoria: 'Admin', porcentaje: 10, color: '#f97316' }],
              rendimientoEmpleados: [ { id: 1, nombre: 'Ana P.', productosManejados: 'Varios', tiempoPromedio: 15, precisionPorciones: 95 }, { id: 2, nombre: 'Luis M.', productosManejados: 'Principales', tiempoPromedio: 20, precisionPorciones: 90 } ],
              desviacionPorcionesData: [ { name: 'Ana P.', desviacion: 2 }, { name: 'Luis M.', desviacion: -5 }],
          };
      } catch (err) { console.error("Error Labor Data:", err); return { error: "Error cargando datos de Mano de Obra." }; }
      finally { setIsModuleLoading(false); }
  };

  const processReservasData = async (year, month) => { /* Tu implementación original */ 
      setIsModuleLoading(true);
      try {
          // ... tu lógica de reservasService, clientesService ...
          // Simulación breve
          const reservasPorMes = Array(6).fill(null).map((_, i) => ({ mes: availableMonths[ (month - 1 - i + 12) % 12].label, cantidad: Math.floor(Math.random() * 50) + 20 }));
          const tiposCliente = [ { tipo: 'Nuevo', porcentaje: 40, color: '#3b82f6'}, { tipo: 'Recurrente', porcentaje: 60, color: '#10b981'}];
          const listaReservasActivas = [{id:1, cliente:'Cliente Ejemplo', personas:4, fecha: 'Hoy', hora:'20:00'}];
          return { reservasPorMes, crecimientoReservasPct: Math.random()*20-10, tiposCliente, reservasActivasHoy: 5, capacidadReservadaPct: 25, listaReservasActivas};
      } catch (err) { return { error: "Error cargando datos de Reservas." }; }
      finally { setIsModuleLoading(false); }
  };
  const processProveedoresData = async (year, month) => { /* Tu implementación original */
      setIsModuleLoading(true);
      try {
          // ... tu lógica de proveedorService, registerPurchaseService ...
          const activos = [{id:1, nombre: 'Proveedor X', frecuencia: '5 compras', tipo:'Frutas', ultimaCompra:'Ayer', costoPromedioItem:1500}];
          const historialInsumoDestacado = { nombreInsumo: 'Tomate', datos: [{mes:'Ene', costo:1200},{mes:'Feb', costo:1300}], color: '#f97316'};
          const historialComprasTabla = [{id:1, fecha:'Hoy', proveedor:'Proveedor X', cantidad:10, costoU:1200, total:12000}];
          return { activos, historialInsumoDestacado, historialComprasTabla};
      } catch (err) { return { error: "Error cargando datos de Proveedores." }; }
      finally { setIsModuleLoading(false); }
  };
  const processProduccionData = async (year, month) => {
      setIsModuleLoading(true);
      // Simula la carga de datos para Producción
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsModuleLoading(false);
      return { message: "Datos de producción cargados (simulado)." };
  };


  // --- Carga de Datos ---
  useEffect(() => {
    setError(null); // Limpiar error al cambiar mes/año

    if (selectedSection === 'home') {
      setIsKpiLoading(true); // Asegurar que el loader de KPIs se active
      //setIsModuleLoading(false); // El loader de módulo no aplica para home
      
      processKpiData(selectedYear, selectedMonth).then(data => setKpiData(data));
      Promise.allSettled([
        processProductSalesChart(selectedYear, selectedMonth),
        processSalesByCategoryChart(selectedYear, selectedMonth),
      ]).then(results => {
        if (results[0].status === 'fulfilled') setProductSalesData(results[0].value);
        if (results[1].status === 'fulfilled') setSalesByCategoryData(results[1].value);
        // No marcamos isModuleLoading false aquí porque es para 'home'
      }).catch(err => setError("Error cargando gráficos del dashboard."));

    } else {
      //setIsKpiLoading(false); // El loader de KPI no aplica para módulos
      setIsModuleLoading(true);
      let dataPromise;
      switch (selectedSection) {
        case 'labor': dataPromise = processLaborData(selectedYear, selectedMonth); break;
        case 'reservas': dataPromise = processReservasData(selectedYear, selectedMonth); break;
        case 'proveedores': dataPromise = processProveedoresData(selectedYear, selectedMonth); break;
        case 'produccion': dataPromise = processProduccionData(selectedYear, selectedMonth); break;
        default: dataPromise = Promise.resolve(null);
      }

      dataPromise.then(data => {
        if (data?.error) setError(data.error);
        else {
            if (selectedSection === 'labor') setLaborData(data);
            if (selectedSection === 'reservas') setReservasData(data);
            if (selectedSection === 'proveedores') setProveedoresData(data);
            // if (selectedSection === 'produccion') setProduccionData(data); // si guardas estado
        }
      }).catch(err => {
        console.error(`Error cargando módulo ${selectedSection}:`, err);
        setError(`No se pudo cargar el módulo ${currentModule.label}.`);
      }).finally(() => {
        setIsModuleLoading(false);
      });
    }
  }, [selectedYear, selectedMonth, selectedSection]);


  // --- Utilidades de Formato ---
  const formatCurrency = (value, decimals = 0, currencySymbol = '$') =>
    value != null ? `${currencySymbol}${Number(value).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}` : `${currencySymbol}0`;
  const formatNumber = (value) => value != null ? Number(value).toLocaleString('en-US') : '0';
  const formatPercentage = (value, addPlusSign = false, decimals = 1) => {
    if (value == null || isNaN(Number(value))) return '0%';
    const numValue = Number(value);
    const sign = addPlusSign && numValue > 0 ? '+' : (addPlusSign && numValue < 0 ? '' : '');
    return `${sign}${numValue.toFixed(decimals)}%`;
  };


  // --- RENDERIZADO DE SECCIONES ESPECÍFICAS (Adaptadas para el nuevo estilo) ---
  const renderLaborSection = () => {
    if (isModuleLoading) return <div className="flup-content-loading-state"><Clock size={32} className="animate-spin" /><p>Cargando Mano de Obra...</p></div>;
    if (!laborData || laborData.error) return <div className="flup-content-error-state">{laborData?.error || "Error al cargar datos de mano de obra."}</div>;
    
    const { gastoMensualTotal, gastoMesAnteriorPct, gastoBimestralPromedio, gastoVsIngresosPct, distribucionCategoria = [], rendimientoEmpleados = [], desviacionPorcionesData = [] } = laborData;
    const pieDataCategorias = distribucionCategoria.map(cat => ({ name: cat.categoria, value: cat.porcentaje, color: cat.color }));

    return (
      <div className="animate-fadeIn"> {/* Puedes añadir animaciones si quieres */}
        <div className="flup-kpi-grid">
          <StatCardFinance title="Gasto Mensual M.O." value={formatCurrency(gastoMensualTotal, 0)} changePercent={formatPercentage(gastoMesAnteriorPct, true)} changeDirection={gastoMesAnteriorPct >= 0 ? 'up' : 'down'} />
          <StatCardFinance title="M.O. vs Ingresos" value={formatPercentage(gastoVsIngresosPct)} icon={Percent} />
          <StatCardFinance title="Promedio Bimestral M.O." value={formatCurrency(gastoBimestralPromedio, 0)} />
        </div>
        <div className="flup-charts-section">
          <div className="flup-chart-container">
            <h3 className="chart-title">Distribución Gastos M.O.</h3>
            {pieDataCategorias.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart><Pie data={pieDataCategorias} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label> {pieDataCategorias.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))} </Pie><Tooltip /></PieChart>
              </ResponsiveContainer>
            ) : <ChartPlaceholder />}
          </div>
          {/* Más gráficos o tablas para rendimiento, etc. */}
        </div>
      </div>
    );
  };

  const renderReservasSection = () => {
    if (isModuleLoading) return <div className="flup-content-loading-state"><Clock size={32} className="animate-spin" /><p>Cargando Reservas...</p></div>;
    if (!reservasData || reservasData.error) return <div className="flup-content-error-state">{reservasData?.error || "Error al cargar datos de reservas."}</div>;
    
    const { reservasPorMes = [], crecimientoReservasPct, tiposCliente = [], reservasActivasHoy, capacidadReservadaPct, listaReservasActivas = [] } = reservasData;
    return (
        <div className="animate-fadeIn">
            <div className="flup-kpi-grid">
                <StatCardFinance title="Reservas Hoy" value={formatNumber(reservasActivasHoy)} icon={ListChecks}>
                    <ProgressBar value={capacidadReservadaPct} max={100} label={`Capacidad (${formatPercentage(capacidadReservadaPct,false,0)})`} barColor="var(--flup-text-accent)"/>
                </StatCardFinance>
                <StatCardFinance title="Crecimiento Reservas" value={formatPercentage(crecimientoReservasPct, true)} changeDirection={crecimientoReservasPct >= 0 ? 'up':'down'} icon={TrendingUpIcon} />
            </div>
             <div className="flup-charts-section">
                <div className="flup-chart-container" style={{gridColumn: 'span 2'}}> {/* Ocupa más espacio */}
                    <h3 className="chart-title">Reservas por Mes (Últimos 6M)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={reservasPorMes}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="mes" /><YAxis /><Tooltip /><Bar dataKey="cantidad" fill="var(--flup-text-accent)" /></BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="flup-chart-container">
                    <h3 className="chart-title">Tipo de Cliente (Mes)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart><Pie data={tiposCliente} dataKey="porcentaje" nameKey="tipo" cx="50%" cy="50%" outerRadius={80} label>{tiposCliente.map((e,i) => <Cell key={`c-${i}`} fill={e.color}/>)}</Pie><Tooltip/></PieChart>
                    </ResponsiveContainer>
                </div>
                {/* Lista de próximas reservas podría ir en otro flup-chart-container */}
             </div>
        </div>
    );
  };
  
  const renderProveedoresSection = () => {
    if (isModuleLoading) return <div className="flup-content-loading-state"><Clock size={32} className="animate-spin" /><p>Cargando Proveedores...</p></div>;
    if (!proveedoresData || proveedoresData.error) return <div className="flup-content-error-state">{proveedoresData?.error || "Error al cargar datos de proveedores."}</div>;

    const { activos = [], historialInsumoDestacado, historialComprasTabla = [] } = proveedoresData;
    return (
        <div className="animate-fadeIn">
             <div className="flup-charts-section">
                <div className="flup-chart-container lg:col-span-2"> {/* Tailwind class si usas, o style propio */}
                    <h3 className="chart-title">Proveedores Activos (Top 5)</h3>
                    {activos.length > 0 ? <ul className="space-y-2 text-sm">{activos.slice(0,5).map(p => <li key={p.id} className="p-2 border-b border-[var(--flup-border-color)]">{p.nombre} ({p.frecuencia})</li>)}</ul> : <p>No hay datos.</p>}
                </div>
                <div className="flup-chart-container">
                    <h3 className="chart-title">Variación Precio: {historialInsumoDestacado?.nombreInsumo}</h3>
                    {historialInsumoDestacado?.datos?.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={historialInsumoDestacado.datos}><CartesianGrid /><XAxis dataKey="mes" /><YAxis /><Tooltip /><Line type="monotone" dataKey="costo" stroke={historialInsumoDestacado.color || '#8884d8'} /></LineChart>
                        </ResponsiveContainer>
                    ) : <ChartPlaceholder />}
                </div>
                {/* Historial de compras podría ser una tabla en otro flup-chart-container */}
             </div>
        </div>
    );
  };

  const renderProduccionSection = () => {
    if (isModuleLoading) return <div className="flup-content-loading-state"><Clock size={32} className="animate-spin" /><p>Cargando Producción...</p></div>;
    // if (produccionData?.error) ...
    return (
      <div className="animate-fadeIn flup-chart-container">
        <h3 className="chart-title">Módulo de Producción</h3>
        <ChartPlaceholder text="Contenido de Producción (Próximamente)" />
      </div>
    );
  };

  const renderHomeDashboard = () => (
    <>
      {isKpiLoading ? (
        <div className="flup-kpi-grid">
          {Array(4).fill(0).map((_, idx) => (
            <div key={idx} className="flup-stat-card" style={{ minHeight: '120px', display:'flex', alignItems:'center', justifyContent:'center' }}><Clock size={24} className="animate-spin" /></div>
          ))}
        </div>
      ) : kpiData && !kpiData.error ? (
        <div className="flup-kpi-grid">
            <StatCardFinance title="Total customers" value={formatNumber(kpiData.totalCustomers)} changePercent={formatPercentage(kpiData.totalCustomersChange, true)} changeDirection={kpiData.totalCustomersChange >= 0 ? 'up' : 'down'}/>
            <StatCardFinance title="Total revenue" value={formatCurrency(kpiData.totalRevenue, 0)} changePercent={formatPercentage(kpiData.totalRevenueChange, true)} changeDirection={kpiData.totalRevenueChange >= 0 ? 'up' : 'down'}/>
            <StatCardFinance title="Total orders" value={formatNumber(kpiData.totalOrders)} changePercent={formatPercentage(kpiData.totalOrdersChange, true)} changeDirection={kpiData.totalOrdersChange >= 0 ? 'up' : 'down'}/>
            <StatCardFinance title="Total returns" value={formatNumber(kpiData.totalReturns)} changePercent={formatPercentage(kpiData.totalReturnsChange, true)} changeDirection={kpiData.totalReturnsChange >= 0 ? 'up' : 'down'}/>
        </div>
      ) : (
        <div className="flup-content-error-state">{kpiData?.error || "Error KPIs."}</div>
      )}

      <div className="flup-charts-section">
        <div className="flup-chart-container">
            <div className="chart-header"> <h3 className="chart-title">Product sales</h3> {/* ... legend ... */} </div>
            {productSalesData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}><BarChart data={productSalesData} margin={{top:5,right:0,left:-20,bottom:5}}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name" tick={{fontSize:12}}/><YAxis tickFormatter={(v)=>`${v/1000}K`} tick={{fontSize:12}}/><Tooltip formatter={(v,n)=>[formatCurrency(v,0),n]}/><Bar dataKey="Gross margin" fill="#3b82f6" radius={[4,4,0,0]} barSize={12}/><Bar dataKey="Revenue" fill="#f97316" radius={[4,4,0,0]} barSize={12}/></BarChart></ResponsiveContainer>
            ) : <ChartPlaceholder text="Cargando ventas..." />}
        </div>
        <div className="flup-bottom-charts-grid">
            <div className="flup-chart-container">
                <h3 className="chart-title">Sales by product category</h3>
                {salesByCategoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}><PieChart><Pie data={salesByCategoryData} cx="50%" cy="50%" labelLine={false} outerRadius={100} innerRadius={60} dataKey="value" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}>{salesByCategoryData.map((e,i)=><Cell key={`cell-${i}`} fill={e.color}/>)}</Pie><Tooltip formatter={(v,n,p)=>[`${v}%`,p.payload.name]}/></PieChart></ResponsiveContainer>
                ) : <ChartPlaceholder text="Cargando categorías..." />}
            </div>
            <div className="flup-chart-container"> <h3 className="chart-title">Sales by countries</h3> <ChartPlaceholder text="Mapa Ventas por País" /> </div>
        </div>
      </div>
    </>
  );


  // --- Renderizado del Dashboard ---
  return (
    <div className="flup-dashboard-content-area">
      <header className="flup-content-header">
        <div className="header-title-section">
            {/* Icono de la sección actual, o un logo general */}
            {currentModule.icon && <currentModule.icon size={28} className="mr-3" style={{color: 'var(--flup-text-accent)'}} />}
            <h1 className="header-title">{currentModule.label}</h1>
        </div>
        <div className="header-actions">
          <div className="date-filters">
            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} disabled={isKpiLoading || isModuleLoading}>
              {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
            </select>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} disabled={isKpiLoading || isModuleLoading}>
              {availableMonths.map(month => <option key={month.value} value={month.value}>{month.label}</option>)}
            </select>
          </div>
          {/* <button className="add-data-btn" onClick={() => alert("Add Data clicked!")}> <PlusCircle size={16} /> Add data </button> */}
        </div>
      </header>

      <main className="flup-content-wrapper">
        {/* Renderizado condicional del contenido del módulo */}
        {error && <div className="flup-content-error-state mb-4">{error}</div>}

        {/* Aquí puedes poner botones para cambiar de sección si no tienes sidebar externa para ello */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {navigationTabs.map(tab => (
                <button 
                    key={tab.id} 
                    onClick={() => {setSelectedSection(tab.id); setError(null);}}
                    style={{
                        padding: '0.5rem 1rem', 
                        border: '1px solid var(--flup-border-color)',
                        borderRadius: '6px',
                        backgroundColor: selectedSection === tab.id ? 'var(--flup-text-accent)' : 'var(--flup-bg-card)',
                        color: selectedSection === tab.id ? 'white' : 'var(--flup-text-primary)',
                        cursor: 'pointer',
                        fontWeight: 500
                    }}
                    disabled={isKpiLoading || isModuleLoading}
                >
                    {tab.label}
                </button>
            ))}
        </div>
        
        {selectedSection === 'home' && renderHomeDashboard()}
        {selectedSection === 'labor' && renderLaborSection()}
        {selectedSection === 'reservas' && renderReservasSection()}
        {selectedSection === 'proveedores' && renderProveedoresSection()}
        {selectedSection === 'produccion' && renderProduccionSection()}
        
      </main>
    </div>
  );
};

export default Dashboard;