import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

// No necesita su propio CSS si los estilos están en dashboard-flup-content-style.css

const StatCardFinance = ({
  title,
  value,
  changePercent, // Ya es un string formateado como "+2.5%" o "-0.2%"
  changeDirection, // 'up' o 'down'
  icon: Icon, // Icono para la tarjeta (ej. DollarSign)
  children, // Para contenido adicional como ProgressBar
}) => {
  const numericChange = parseFloat(changePercent); // Extraer el número para lógica
  let changeColorClass = 'neutral';

  if (changePercent != null) {
    // La imagen de ejemplo usa verde para aumento y rojo para disminución
    // independientemente de si es costo o ingreso.
    if (changeDirection === 'up' && numericChange > 0) {
      changeColorClass = 'positive';
    } else if (changeDirection === 'down' && numericChange < 0) {
      changeColorClass = 'negative';
    }
    // Si el cambio es 0%, se queda 'neutral' (gris)
  }

  return (
    <div className="flup-stat-card">
      <div className="card-header">
        <h3 className="card-title">{title}</h3>
        {Icon && <Icon size={18} className="card-icon" />}
      </div>
      {value != null && <p className="card-value">{value}</p>}
      {changePercent != null && (
        <div className={`card-change ${changeColorClass}`}>
          {changeDirection === 'up' && numericChange > 0 ? <TrendingUp size={14} /> : null}
          {changeDirection === 'down' && numericChange < 0 ? <TrendingDown size={14} /> : null}
          <span>{changePercent}</span>
        </div>
      )}
      {children && <div className="card-content">{children}</div>}
    </div>
  );
};

export default StatCardFinance;