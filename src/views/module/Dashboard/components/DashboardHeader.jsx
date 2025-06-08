// RUTA: src/views/Dashboard/components/DashboardHeader.jsx
import React from 'react';

const DashboardHeader = ({
  navigationTabs,
  selectedSection,
  selectedYear,
  selectedMonth,
  availableYears,
  availableMonths,
  isChangingSection,
  onSectionChange,
  onYearChange,
  onMonthChange,
}) => (
  <header className="page-header-finance">
    <div className="header-top-row">
      <div className="header-title-section">
        <h1 className="page-title">Dashboard Operativo</h1>
      </div>
      <div className="header-controls">
        <div className="date-filters">
          <select value={selectedYear} onChange={(e) => onYearChange(e.target.value)} disabled={isChangingSection} aria-label="Seleccionar año">
            {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
          </select>
          <select value={selectedMonth} onChange={(e) => onMonthChange(parseInt(e.target.value))} disabled={isChangingSection} aria-label="Seleccionar mes">
            {availableMonths.map(month => <option key={month.value} value={month.value}>{month.label}</option>)}
          </select>
        </div>
      </div>
    </div>
    
    <nav className="module-navigation-tabs">
      <ul>
        {navigationTabs.map(tab => (
          <li key={tab.id}>
            <button
              className={`nav-button ${selectedSection === tab.id ? 'active' : ''}`}
              onClick={() => onSectionChange(tab.id)}
              disabled={isChangingSection}
            >
              {tab.icon && <tab.icon size={16} />}
              <span>{tab.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  </header>
);

export default DashboardHeader;