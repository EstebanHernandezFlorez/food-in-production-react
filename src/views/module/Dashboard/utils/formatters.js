// RUTA: src/views/Dashboard/utils/formatters.js
export const formatCurrency = (value, decimals = 0) => {
  if (value == null || isNaN(Number(value))) return '$0';
  return `$${Number(value).toLocaleString('es-CO', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
};

export const formatNumber = (value) => {
  if (value == null || isNaN(Number(value))) return '0';
  return Number(value).toLocaleString('es-CO');
};

export const formatPercentage = (value, addPlusSign = false) => {
  if (value == null || isNaN(Number(value))) return `0%`;
  const numValue = Number(value);
  const sign = addPlusSign && numValue > 0 ? '+' : '';
  return `${sign}${numValue.toFixed(1)}%`;
};

export const getRandomColor = () => `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;