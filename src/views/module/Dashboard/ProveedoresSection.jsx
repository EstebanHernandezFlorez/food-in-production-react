// src/views/module/Dashboard/ProveedoresSection.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Truck, ListChecks, BarChart2, PieChart as LucidePieChart, DollarSign, Award } from 'lucide-react';
import StatCardFinance from './StatCardFinance';
import ChartPlaceholder from './ChartPlaceholder';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';

import proveedorService from '../../services/proveedorSevice'; // Ajusta ruta!
import registerPurchaseService from '../../services/registroCompraService'; // Ajusta ruta!
// import supplierService from '../../../services/supplierService'; // Este es para Insumos, no proveedores de compras.

const ProveedoresSection = ({ selectedYear, selectedMonth }) => {
  const [proveedoresData, setProveedoresData] = useState({
    proveedoresActivos: 0,
    comprasProveedorSeleccionado: [], // [{ idPurchase, date, totalAmount, details: [] }, ...]
    insumosPorProveedorData: [], // [{ name: 'Insumo A', quantity: 100 }, ...] para el proveedor seleccionado
    proveedorSeleccionado: null, // { idProvider, providerName }
    listaProveedores: [], // Para el selector
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatCurrency = (value, decimals = 0, currencySymbol = '$') => value != null ? `${currencySymbol}${Number(value).toLocaleString('es-CO', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}` : `${currencySymbol}0`;
  const formatNumber = (value) => value != null ? Number(value).toLocaleString('es-CO') : '0';

  useEffect(() => {
    const fetchProveedoresData = async () => {
      setIsLoading(true);
      setError(null);
      console.log(`[ProveedoresSection] Fetching data for ${selectedYear}-${selectedMonth}`);
      try {
        const [allProveedoresResult, allPurchasesResult] = await Promise.allSettled([
          proveedorService.getAllProveedores(),
          registerPurchaseService.getAllRegisterPurchasesWithDetails() // Asume que este trae detalles e insumos
        ]);

        let proveedoresActivos = 0;
        let listaProveedores = [];
        if (allProveedoresResult.status === 'fulfilled' && Array.isArray(allProveedoresResult.value)) {
          const proveedores = allProveedoresResult.value;
          proveedoresActivos = proveedores.filter(p => p.status === true).length; // Asume que el estado es booleano
          listaProveedores = proveedores.map(p => ({ idProvider: p.idProvider, providerName: p.providerName }));
        } else {
          console.error("Error fetching proveedores:", allProveedoresResult.reason);
        }

        // Para las otras gráficas, necesitaremos un proveedor seleccionado.
        // Por ahora, solo establecemos los KPIs generales.
        // La lógica para cargar datos de un proveedor específico se activará cuando se seleccione uno.
        setProveedoresData(prev => ({
          ...prev,
          proveedoresActivos,
          listaProveedores,
          // Limpiar datos específicos del proveedor si cambia el mes/año
          comprasProveedorSeleccionado: prev.proveedorSeleccionado ? [] : prev.comprasProveedorSeleccionado,
          insumosPorProveedorData: prev.proveedorSeleccionado ? [] : prev.insumosPorProveedorData,
        }));

      } catch (err) {
        console.error("Critical error fetching proveedores data:", err);
        setError(err.message || "Error al cargar datos de proveedores.");
      } finally {
        setIsLoading(false);
      }
    };
    if (selectedYear && selectedMonth) {
        fetchProveedoresData();
    }
  }, [selectedYear, selectedMonth]);


  // Efecto para cargar datos cuando se selecciona un proveedor
  useEffect(() => {
    const fetchDetailsForSelectedProvider = async () => {
        if (!proveedoresData.proveedorSeleccionado?.idProvider) {
            setProveedoresData(prev => ({ ...prev, comprasProveedorSeleccionado: [], insumosPorProveedorData: [] }));
            return;
        }
        setIsLoading(true); // O un loader específico para esta parte
        console.log(`[ProveedoresSection] Fetching details for provider ID: ${proveedoresData.proveedorSeleccionado.idProvider}`);
        try {
            // Asumimos que ya tenemos todas las compras, filtramos
            const allPurchases = await registerPurchaseService.getAllRegisterPurchasesWithDetails().catch(()=>[]); // Re-fetch o usar cache
            
            const comprasDelProveedor = allPurchases.filter(
                compra => compra.provider?.idProvider === proveedoresData.proveedorSeleccionado.idProvider
            );

            const insumosAgregados = {};
            comprasDelProveedor.forEach(compra => {
                if (Array.isArray(compra.purchaseDetails)) {
                    compra.purchaseDetails.forEach(detalle => {
                        if (detalle.insumo) { // Asumiendo que 'insumo' es el objeto y 'supplier' es el nombre del insumo
                            const nombreInsumo = detalle.insumo.supplierName || detalle.insumo.name || 'Desconocido';
                            insumosAgregados[nombreInsumo] = (insumosAgregados[nombreInsumo] || 0) + (Number(detalle.quantity) || 0);
                        }
                    });
                }
            });
            const insumosPorProveedorData = Object.entries(insumosAgregados).map(([name, quantity]) => ({ name, quantity, fill: getRandomColor() }));

            setProveedoresData(prev => ({
                ...prev,
                comprasProveedorSeleccionado: comprasDelProveedor.sort((a,b) => new Date(b.date) - new Date(a.date)),
                insumosPorProveedorData
            }));

        } catch(err) {
            console.error("Error fetching details for selected provider:", err);
            setError("Error cargando detalles del proveedor seleccionado.");
        } finally {
            setIsLoading(false);
        }
    };

    fetchDetailsForSelectedProvider();
  }, [proveedoresData.proveedorSeleccionado?.idProvider]); // Depende solo del ID del proveedor seleccionado

  const handleProviderSelect = (e) => {
    const id = parseInt(e.target.value);
    if (!id) {
        setProveedoresData(prev => ({ ...prev, proveedorSeleccionado: null }));
        return;
    }
    const selected = proveedoresData.listaProveedores.find(p => p.idProvider === id);
    setProveedoresData(prev => ({ ...prev, proveedorSeleccionado: selected || null }));
  };

  const getRandomColor = () => { // Helper para colores de gráfico
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };


  if (isLoading && !proveedoresData.proveedorSeleccionado) { // Loader general
    return (
      <div className="flup-content-loading-state">
        <Clock size={32} className="animate-spin-slow" />
        <p>Cargando Proveedores...</p>
      </div>
    );
  }

  if (error) {
    return <div className="flup-content-error-state">{error}</div>;
  }

  return (
    <div className="animate-fadeIn">
      <div className="flup-kpi-grid">
        <StatCardFinance title="Proveedores Activos" value={formatNumber(proveedoresData.proveedoresActivos)} icon={Truck} />
        {/* Más KPIs generales de proveedores */}
        <StatCardFinance title="Total Compras (Mes)" value={"N/A"} icon={ListChecks}/>
        <StatCardFinance title="Gasto Promedio/Compra" value={"N/A"} icon={DollarSign}/>
        <StatCardFinance title="Proveedor Principal" value={proveedoresData.listaProveedores[0]?.providerName || "N/A"} icon={Award}/>
      </div>

      <div className="flup-content-card mb-4"> {/* Usando una clase de card general */}
        <h3 className="card-title-main">Análisis por Proveedor</h3>
        <div className="mb-3" style={{maxWidth: '400px'}}>
            <label htmlFor="provider-select" className="form-label" style={{fontSize: '0.9rem', fontWeight: '500'}}>Seleccionar Proveedor:</label>
            <select id="provider-select" className="form-select form-select-sm" onChange={handleProviderSelect} value={proveedoresData.proveedorSeleccionado?.idProvider || ''}>
                <option value="">-- Todos --</option>
                {proveedoresData.listaProveedores.map(p => (
                    <option key={p.idProvider} value={p.idProvider}>{p.providerName}</option>
                ))}
            </select>
        </div>

        {isLoading && proveedoresData.proveedorSeleccionado && (
            <div className="flup-content-loading-state"><Clock size={24} className="animate-spin-slow" /><p>Cargando datos de {proveedoresData.proveedorSeleccionado.providerName}...</p></div>
        )}

        {!isLoading && proveedoresData.proveedorSeleccionado && (
            <div className="flup-charts-section mt-3">
                <div className="flup-chart-container">
                    <h4 className="chart-title">Compras a {proveedoresData.proveedorSeleccionado.providerName} (Últimas 5)</h4>
                    {proveedoresData.comprasProveedorSeleccionado.length > 0 ? (
                        <div className="table-responsive" style={{maxHeight: '300px'}}>
                            <table className="dashboard-table-finance">
                                <thead><tr><th>Fecha</th><th>Total</th><th>Detalles</th></tr></thead>
                                <tbody>
                                    {proveedoresData.comprasProveedorSeleccionado.slice(0,5).map(compra => (
                                        <tr key={compra.idPurchase}>
                                            <td>{new Date(compra.date).toLocaleDateString()}</td>
                                            <td>{formatCurrency(compra.totalAmount)}</td>
                                            <td>{compra.purchaseDetails?.length || 0} items</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : <ChartPlaceholder text={`No hay registros de compras para ${proveedoresData.proveedorSeleccionado.providerName}.`} />}
                </div>
                <div className="flup-chart-container">
                    <h4 className="chart-title">Insumos Comprados a {proveedoresData.proveedorSeleccionado.providerName} (Total Cantidad)</h4>
                    {proveedoresData.insumosPorProveedorData.length > 0 ? (
                         <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={proveedoresData.insumosPorProveedorData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis type="category" dataKey="name" width={100} tick={{fontSize: 10}}/>
                                <Tooltip formatter={(value) => [formatNumber(value), "Cantidad Total"]}/>
                                <Legend />
                                <Bar dataKey="quantity" name="Cantidad Comprada" barSize={20}>
                                     {proveedoresData.insumosPorProveedorData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <ChartPlaceholder text={`No hay datos de insumos para ${proveedoresData.proveedorSeleccionado.providerName}.`} />}
                </div>
            </div>
        )}
        {!proveedoresData.proveedorSeleccionado && !isLoading && (
            <ChartPlaceholder text="Seleccione un proveedor para ver sus detalles de compras e insumos." />
        )}
      </div>
    </div>
  );
};

export default ProveedoresSection;