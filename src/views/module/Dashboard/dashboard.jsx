import React, { useState, useEffect, useMemo } from 'react';
import styles from './Dashboard.module.css';

// --- Servicios ---
import proveedorService from '../../services/proveedorSevice';
import empleadoService from '../../services/empleadoService';
import registerPurchaseService from '../../services/registroCompraService';
import monthlyOverallExpenseService from '../../services/gastosGeneralesService';
// --- Datos Simulados ---
import {
    sampleProducts,
    sampleProcesses,
    sampleProductionRecords,
    getMonthYear,
    getPreviousMonth
} from '../../../data/sampleData';

// --- Componentes ---
import StatCard from './StatCard';
import FinancialView from './FinancialView';
import SupplierView from './SupplierView';
import EmployeeView from './EmployeeView';

// --- Importar Iconos de Lucide ---
import { DollarSign, TrendingUp, Users, Truck, Clock, PackageCheck, AlertCircle } from 'lucide-react'; // Importa los iconos que usarás

const CATEGORIES = {
  FINANCIERO: 'Financiero',
  PROVEEDOR: 'Proveedor',
  EMPLEADO: 'Eficiencia del empleado',
};

const Dashboard = () => {
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES.FINANCIERO);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState(getMonthYear(new Date().toISOString()).month);

  // --- Estados ---
  const [suppliers, setSuppliers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [kpiData, setKpiData] = useState({
    totalExpense: null,
    expenseChangePercent: null,
    activeSuppliers: null,
    totalProduction: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingKpi, setIsLoadingKpi] = useState(true);
  const [error, setError] = useState(null);

  // --- Carga de datos ---
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      setIsLoadingKpi(true);
      setError(null);
      try {
        const [suppliersData, employeesData] = await Promise.all([
          proveedorService.getAllProveedores(),
          empleadoService.getAllEmpleados()
        ]);

        const mappedSuppliers = suppliersData.map(s => ({ id: s.idProvider, name: s.nameProvider, status: s.status , ...s }));
        setSuppliers(mappedSuppliers);
        setEmployees(employeesData.map(e => ({ id: e.idEmployee, name: e.nameEmployee, status: e.status, ...e })));

        // --- CALCULAR KPIs (¡LÓGICA REAL NECESARIA!) ---
        const activeSuppliersCount = mappedSuppliers.filter(s => s.status === true || s.status === 1).length;
        const activeEmployeesCount = employeesData.filter(e => e.status === true || e.status === 1).length; // Asume que empleados también tienen status

        // Placeholders - Reemplazar con llamadas API o cálculos
        const fetchedKpiData = {
            totalExpense: 53250,
            expenseChangePercent: -2.5,
            activeSuppliers: activeSuppliersCount,
            totalProduction: 1250,
            activeEmployees: activeEmployeesCount // Añadido
        };
        setKpiData(fetchedKpiData);
        // --- Fin Cálculo KPIs ---

        setIsLoading(false);
        setIsLoadingKpi(false);

      } catch (err) {
        console.error("Error loading initial dashboard data:", err);
        setError(err.message || "Error al cargar datos iniciales.");
        setIsLoading(false);
        setIsLoadingKpi(false);
      }
    };
    loadInitialData();
  }, []);

   // --- Años y Meses ---
   const availableYears = useMemo(() => { /* ... */ }, []);
   const availableMonths = useMemo(() => { /* ... */ }, []);
   const handleCategoryChange = (category) => setSelectedCategory(category);
   const handleYearChange = (e) => setSelectedYear(e.target.value);
   const handleMonthChange = (e) => setSelectedMonth(e.target.value);

   // --- Renderizado Condicional Error ---
   if (error && isLoading) { // Error durante la carga inicial crítica
     return (
        <div className={styles.dashboardContainer}>
            <div className={styles.errorMessage}>
                <AlertCircle size={30} style={{ marginRight: '10px' }}/> Error al cargar datos iniciales: {error}
            </div>
        </div>
     );
   }

  // --- Renderizado Contenido Detallado ---
  const renderContent = () => { /* ... (igual que antes) ... */ };
  const formatCurrency = (value) => value ? `$${value.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '$0';
  const formatNumber = (value) => value ? value.toLocaleString('es-ES') : '0';
  const formatPercentage = (value) => value ? `${value >= 0 ? '+' : ''}${value.toFixed(1)}%` : '0%';


  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
         <h1 className={styles.title}>Dashboard</h1>
         <div className={styles.filters}>{/* ... (selectores) ... */}</div>
         <div className={styles.categoryButtons}>{/* ... (botones) ... */}</div>
      </header>

      {/* --- FILA DE STAT CARDS --- */}
      <div className={styles.statCardRow}>
        {isLoadingKpi ? (
          // Placeholders de carga
          Array.from({ length: 4 }).map((_, index) => ( // Crea 4 placeholders
            <div key={index} className={styles.statCardTop} style={{ justifyContent: 'center' }}>
                <span className={styles.loadingMessage} style={{padding: '20px 0'}}>Cargando...</span>
            </div>
          ))
        ) : error && !isLoading ? ( // Muestra error de KPI si la carga general terminó
             <div className={styles.errorMessage} style={{gridColumn: '1 / -1'}}>
                <AlertCircle size={20} style={{ marginRight: '8px' }}/> Error al cargar KPIs: {error}
             </div>
        ) : (
          // Renderiza las StatCards con iconos Lucide
          <>
            <StatCard
              title="Gasto Total Mes"
              value={formatCurrency(kpiData.totalExpense)}
              change={kpiData.expenseChangePercent ? `${formatPercentage(kpiData.expenseChangePercent)} vs mes ant.` : null}
              changeType={kpiData.expenseChangePercent === null ? 'neutral' : (kpiData.expenseChangePercent > 0 ? 'negative' : 'positive')}
              icon={DollarSign} // Usa el icono importado de Lucide
            />
             <StatCard
              title="Producción Total"
              value={`${formatNumber(kpiData.totalProduction)} uds`}
              // change="+5% vs mes ant."
              // changeType="positive"
              icon={PackageCheck} // Icono Lucide
            />
             <StatCard
              title="Proveedores Activos"
              value={formatNumber(kpiData.activeSuppliers)}
              icon={Truck} // Icono Lucide
            />
            <StatCard
              title="Empleados Activos"
              value={formatNumber(kpiData.activeEmployees)}
              icon={Users} // Icono Lucide
            />
          </>
        )}
      </div>


      {/* Área Principal */}
      <main className={styles.contentArea}>
        {isLoading && !error ? ( // Muestra carga general si aún no ha terminado
             <div className={styles.loadingMessage}>Cargando datos...</div>
        ) : (
            renderContent() // Renderiza la vista correspondiente
        )}
      </main>

    </div>
  );
};

export default Dashboard;