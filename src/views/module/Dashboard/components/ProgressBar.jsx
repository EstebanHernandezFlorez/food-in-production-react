// RUTA: src/views/Dashboard/components/ProgressBar.jsx
import React from 'react';

const ProgressBar = ({ value, max, label, showPercentage = true, barColor }) => {
  const percentage = Math.min(100, Math.max(0, Math.round((value / (max || 1)) * 100)));
  
  return (
    <div className="progress-bar-wrapper">
      {(label || showPercentage) && (
        <div className="progress-bar-header">
          {label && <span className="progress-bar-label">{label}</span>}
          {showPercentage && <span className="progress-bar-percentage">{percentage}%</span>}
        </div>
      )}
      <div className="progress-bar-track">
        <div
          className="progress-bar-fill"
          style={{ width: `${percentage}%`, ...(barColor && { backgroundColor: barColor }) }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;