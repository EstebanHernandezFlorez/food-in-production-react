// RUTA: src/views/Dashboard/components/StatCard.jsx
import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = ({
  title,
  value,
  changePercent,
  changeDirection, // 'up' o 'down'
  icon: Icon,
  children,
}) => {
  const hasChange = changePercent != null;
  const changeClass = changeDirection === 'up' ? 'positive' : 'negative';

  return (
    <div className="kpi-card-finance">
      <div className="kpi-card-finance-header">
        <div className="kpi-card-finance-title-block">
          <h3>{title}</h3>
        </div>
        {Icon && <Icon size={20} className="kpi-card-icon-large" />}
      </div>

      {value != null && <p className="kpi-card-finance-main-value">{value}</p>}

      {hasChange && (
        <div className={`kpi-card-finance-change ${changeClass}`}>
          {changeDirection === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          <span>{changePercent}</span>
        </div>
      )}

      {children && <div className="kpi-card-finance-content">{children}</div>}
    </div>
  );
};

export default StatCard;