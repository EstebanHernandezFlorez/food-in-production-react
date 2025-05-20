// src/views/module/Dashboard/Dashboard.jsx (Contenedor Principal)
import React, { useState, useEffect, useMemo } from 'react';
import { Home, UserCog, Calendar, Truck, Cog as CogIcon } from 'lucide-react'; // Renombrado Cog a CogIcon para evitar conflicto

import '../../../assets/css/dashboard-flup-content-style.css';

// Importar los nuevos componentes de sección
import DashboardGeneralSection from './DashboardGeneralSection';
import LaborSection from './LaborSection'; // Necesitarás crear este archivo
import ReservasSection from './ReservasSection'; // Necesitarás crear este archivo
import ProveedoresSection from './ProveedoresSection'; // Necesitarás crear este archivo
import ProduccionSection from './ProduccionSection'; // Necesitarás crear este archivo

const Dashboard = () => {
  const [selectedSection, setSelectedSection] = useState('home');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [error, setError] = useState(null); // Para errores generales del dashboard o de carga de sección

  // isLoading general para el cambio de sección, cada sección manejará su carga interna
  const [isChangingSection, setIsChangingSection] = useState(false);


  const availableYears = useMemo(() => Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 2 + i).toString()), []);
  const availableMonths = useMemo(() => [
    { value: 1, label: 'Ene' }, { value: 2, label: 'Feb' }, { value: 3, label: 'Mar' },
    { value: 4, label: 'Abr' }, { value: 5, label: 'May' }, { value: 6, label: 'Jun' },
    { value: 7, label: 'Jul' }, { value: 8, label: 'Ago' }, { value: 9, label: 'Sep' },
    { value: 10, label: 'Oct' }, { value: 11, label: 'Nov' }, { value: 12, label: 'Dic' }
  ], []);

  const navigationTabs = [
    { id: 'home', label: 'Dashboard General', icon: Home, component: DashboardGeneralSection },
    { id: 'labor', label: 'Mano de Obra', icon: UserCog, component: LaborSection },
    { id: 'reservas', label: 'Reservas', icon: Calendar, component: ReservasSection },
    { id: 'proveedores', label: 'Proveedores', icon: Truck, component: ProveedoresSection },
    { id: 'produccion', label: 'Producción', icon: CogIcon, component: ProduccionSection },
  ];

  const currentModule = useMemo(() => navigationTabs.find(tab => tab.id === selectedSection) || navigationTabs[0], [selectedSection, navigationTabs]);

  const handleSectionChange = (newSectionId) => {
    setIsChangingSection(true);
    setError(null);
    setSelectedSection(newSectionId);
    // Simular un pequeño delay para el cambio de sección si es necesario,
    // o simplemente dejar que el useEffect de la sección hija maneje su carga.
    setTimeout(() => setIsChangingSection(false), 200); // Pequeño delay para feedback visual
  };


  const renderCurrentSection = () => {
    const SectionComponent = currentModule.component;
    if (isChangingSection) { // Mostrar un loader simple mientras cambia la sección
        return (
            <div className="flup-content-loading-state">
                <CogIcon size={32} className="animate-spin-slow" />
                <p>Cargando sección: {currentModule.label}...</p>
            </div>
        );
    }
    return SectionComponent ? <SectionComponent selectedYear={selectedYear} selectedMonth={selectedMonth} /> : <div>Seleccione una sección.</div>;
  };

  return (
    <div className="flup-dashboard-content-area">
      <header className="flup-content-header">
        <div className="header-title-section">
            {currentModule.icon && <currentModule.icon size={28} className="header-section-icon" style={{color: 'var(--flup-text-accent)'}} />}
            <h1 className="header-title">{currentModule.label}</h1>
        </div>
        <div className="header-controls">
          <div className="section-selector-container">
            <select
                value={selectedSection}
                onChange={(e) => handleSectionChange(e.target.value)}
                disabled={isChangingSection}
                className="dashboard-section-select"
                aria-label="Seleccionar sección del dashboard"
            >
                {navigationTabs.map(tab => (
                    <option key={tab.id} value={tab.id}>{tab.label}</option>
                ))}
            </select>
          </div>
          <div className="date-filters">
            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} disabled={isChangingSection} aria-label="Seleccionar año">
              {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
            </select>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} disabled={isChangingSection} aria-label="Seleccionar mes">
              {availableMonths.map(month => <option key={month.value} value={month.value}>{month.label}</option>)}
            </select>
          </div>
        </div>
      </header>

      <main className="flup-content-wrapper">
        {error && <div className="flup-content-error-state mb-4">{error}</div>}
        {renderCurrentSection()}
      </main>
    </div>
  );
};

export default Dashboard;