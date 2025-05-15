import React from 'react';
// Importa su CSS específico si decides hacerlo así
// import './charts.css'; // O una ruta más general si `charts.css` está en `assets/css`

const ChartPlaceholder = ({ text = "Chart data here..." }) => (
  <div className="chart-placeholder-finance">{text}</div>
);

export default ChartPlaceholder;