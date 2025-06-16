// RUTA: src/views/Dashboard/components/ChartPlaceholder.jsx
import React from 'react';

const ChartPlaceholder = ({ text = "Datos no disponibles...", icon: Icon }) => (
  <div className="chart-placeholder-finance">
    {Icon && <Icon size={48} className="placeholder-icon" />}
    <p className="placeholder-text">{text}</p>
  </div>
);

export default ChartPlaceholder;