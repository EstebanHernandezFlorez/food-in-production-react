import React from 'react';
import styles from './Dashboard.module.css';
// Ya no necesitamos importar nada de react-icons

const StatCard = ({ title, value, change = null, changeType = 'neutral', icon: IconComponent }) => { // Recibe el componente Icono
  let changeStyleClass = styles.neutralChange;
  if (changeType === 'positive') {
    changeStyleClass = styles.positiveChange;
  } else if (changeType === 'negative') {
    changeStyleClass = styles.negativeChange;
  }

  return (
    <div className={styles.statCardTop}>
      <div className={styles.statCardTopContent}>
        <span className={styles.statCardTopTitle}>{title}</span>
        <span className={styles.statCardTopValue}>{value}</span>
        {change !== null && (
          <span className={`${styles.statCardTopChange} ${changeStyleClass}`}>
            {change}
          </span>
        )}
      </div>
      {/* Renderiza el IconComponent si existe */}
      {IconComponent && (
        <div className={styles.statCardTopIcon}>
          {/* Ajusta strokeWidth y size como prefieras */}
          <IconComponent size={20} strokeWidth={2} />
        </div>
      )}
    </div>
  );
};

export default StatCard;