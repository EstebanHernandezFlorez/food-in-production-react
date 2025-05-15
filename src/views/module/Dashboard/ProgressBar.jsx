import React from 'react';
// Sus estilos .progress-bar-track y .progress-bar-fill están en dashboard-flup-content-style.css

const ProgressBar = ({ value, max, label, showPercentage = true, barColor }) => {
  const percentage = Math.min(100, Math.max(0, Math.round((value / (max || 1)) * 100)));
  return (
    <div className="w-full my-1"> {/* Clases de Tailwind, puedes eliminarlas si no las usas */}
      {(label || showPercentage) && (
        <div className="flex justify-between mb-1 text-xs" style={{ color: 'var(--flup-text-secondary)'}}>
          {label && <span className="font-medium">{label}</span>}
          {showPercentage && <span className="font-medium">{percentage}%</span>}
        </div>
      )}
      <div className="progress-bar-track">
        <div
          className="progress-bar-fill transition-all duration-500 ease-out"
          style={{ width: `${percentage}%`, ...(barColor && { backgroundColor: barColor }) }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;