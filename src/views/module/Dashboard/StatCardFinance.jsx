import React from 'react';
import { MoreHorizontal, TrendingUp, TrendingDown } from 'lucide-react';
// Importa su CSS específico si decides hacerlo así
// import './cards.css'; // O una ruta más general si `cards.css` está en `assets/css`

const StatCardFinance = ({ title, subtitle, value, changePercent, changeDirection, onViewReport, children }) => {
  const isPositive = changeDirection === 'up';
  return (
    <div className="kpi-card-finance">
      <div className="kpi-card-finance-header">
        <div className="kpi-card-finance-title-block">
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {onViewReport && (
          <button onClick={onViewReport} className="kpi-card-finance-view-report-btn">
            View Report
          </button>
        )}
      </div>
      {value && <p className="kpi-card-finance-main-value">{value}</p>}
      {changePercent && (
        <span className={`kpi-card-finance-change ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {changePercent}
        </span>
      )}
      {children && <div className="kpi-card-finance-content">{children}</div>}
    </div>
  );
};

export default StatCardFinance;