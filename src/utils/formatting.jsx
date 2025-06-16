// src/utils/formatting.js (o donde prefieras)
export const formatCurrencyCOP = (value) => {
    const number = Number(value) || 0;
    // Usamos minimumFractionDigits: 0 y maximumFractionDigits: 0 para no mostrar centavos en COP
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(number);
};