// RUTA: src/views/Dashboard/Dashboard.jsx
import React, { useState, useMemo } from 'react';
import { Home, UserCog, Calendar, Truck, Cog as CogIcon } from 'lucide-react';
import '../../../assets/css/dashboard-flup-content-style.css'; // Usamos el nuevo CSS unificado

import DashboardHeader from './components/DashboardHeader';
import GeneralSection from './sections/GeneralSection.jsx';
import LaborSection from './sections/LaborSection.jsx';
import ReservasSection from './sections/ReservasSection.jsx';
import ProveedoresSection from './sections/ProveedoresSection.jsx';
import ProduccionSection from './sections/ProduccionSection.jsx';

const Dashboard = () => {
  const [selectedSection, setSelectedSection] = useState('home');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [isChangingSection, setIsChangingSection] = useState(false);

  const availableYears = useMemo(() => Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 2 + i).toString()), []);
  const availableMonths = useMemo(() => [
    { value: 1, label: 'Ene' }, { value: 2, label: 'Feb' }, { value: 3, label: 'Mar' },
    { value: 4, label: 'Abr' }, { value: 5, label: 'May' }, { value: 6, label: 'Jun' },
    { value: 7, label: 'Jul' }, { value: 8, label: 'Ago' }, { value: 9, label: 'Sep' },
    { value: 10, label: 'Oct' }, { value: 11, label: 'Nov' }, { value: 12, label: 'Dic' }
  ], []);

  const navigationTabs = useMemo(() => [
    { id: 'home', label: 'Dashboard General', icon: Home, component: GeneralSection },
    { id: 'labor', label: 'Mano de Obra', icon: UserCog, component: LaborSection },
    { id: 'reservas', label: 'Reservas', icon: Calendar, component: ReservasSection },
    { id: 'proveedores', label: 'Proveedores', icon: Truck, component: ProveedoresSection },
    { id: 'produccion', label: 'Producción', icon: CogIcon, component: ProduccionSection },
  ], []);

  const currentModule = useMemo(() => navigationTabs.find(tab => tab.id === selectedSection) || navigationTabs[0], [selectedSection, navigationTabs]);

  const handleSectionChange = (newSectionId) => {
    setIsChangingSection(true);
    setSelectedSection(newSectionId);
    setTimeout(() => setIsChangingSection(false), 300);
  };

  const renderCurrentSection = () => {
    const SectionComponent = currentModule.component;
    if (isChangingSection) {
      return (
        <div className="loading-state-finance">
          <CogIcon size={32} className="lucide-spin" />
          <p>Cargando sección: {currentModule.label}...</p>
        </div>
      );
    }
    return SectionComponent ? <SectionComponent selectedYear={selectedYear} selectedMonth={selectedMonth} /> : <div>Seleccione una sección.</div>;
  };

  return (
    <div className="dashboard-main-content-area-flex">
      <DashboardHeader
        navigationTabs={navigationTabs}
        selectedSection={selectedSection}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        availableYears={availableYears}
        availableMonths={availableMonths}
        isChangingSection={isChangingSection}
        onSectionChange={handleSectionChange}
        onYearChange={setSelectedYear}
        onMonthChange={setSelectedMonth}
      />
      
      {renderCurrentSection()}
    </div>
  );
};

export default Dashboard;