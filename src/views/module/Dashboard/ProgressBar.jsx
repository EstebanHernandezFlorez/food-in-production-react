import React from 'react';

const ProgressBar = ({ value, max, label, showPercentage = true, barColor }) => {
  const percentage = Math.min(100, Math.max(0, Math.round((value / (max || 1)) * 100)));
  return (
    <div className="w-full my-1">
      {(label || showPercentage) && (
        <div className="flex justify-between mb-1">
          {label && <span className="text-xs font-medium text-text-secondary-finance">{label}</span>}
          {showPercentage && <span className="text-xs font-medium text-text-secondary-finance">{percentage}%</span>}
        </div>
      )}
      <div className="progress-bar-track w-full">
        <div
          className="progress-bar-fill transition-all duration-500 ease-out"
          style={{ width: `${percentage}%`, ...(barColor && { backgroundColor: barColor }) }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;