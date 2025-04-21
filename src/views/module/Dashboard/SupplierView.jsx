// src/views/module/Dashboard/SupplierView.jsx
import React, { useState, useEffect, useMemo } from 'react';
import styles from './Dashboard.module.css';
import registerPurchaseService from '../../services/registroCompraService';
import { Search, AlertCircle, Info } from 'lucide-react';

const SupplierView = ({ suppliers, products, isLoadingParent }) => {
  const [selectedProduct, setSelectedProduct] = useState('');
  const [allPurchases, setAllPurchases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // ... (useEffect para fetchPurchases - sin cambios) ...
  useEffect(() => { /* ... */ }, [isLoadingParent]);

  // --- Lógica Productos y Compras (sin cambios) ---
  const availableProducts = useMemo(() => products || [], [products]);
  const productPurchases = useMemo(() => { /* ... (lógica de filtrado/mapeo) ... */ }, [selectedProduct, allPurchases, suppliers, products]);

  const handleProductChange = (e) => setSelectedProduct(e.target.value);

  // --- Renderizado ---
  if (isLoading) {
    return <div className={`${styles.chartCard} ${styles.loading}`}><p className={styles.loadingMessage}>Cargando Compras...</p></div>;
  }

  const selectedProductName = (products || []).find(p => p.id === selectedProduct)?.name || '';
  const uniqueSuppliersInComparison = useMemo(() => new Set(productPurchases.map(p => p.supplierName)).size, [productPurchases]);

  return (
    <div className={styles.chartCard}>
      <h4 className={styles.chartCardTitle}>Análisis de Compras</h4>
      <p className={styles.chartCardSubtitle}>Compara precios de insumos entre proveedores</p>

       <div className={styles.filters} style={{ marginBottom: '25px', paddingLeft: 0 }}>
        <label htmlFor="product-select-supplier" style={{ alignSelf: 'center', marginRight: '10px', fontSize: '0.9rem' }}>Insumo:</label>
        <select id="product-select-supplier" /* ... */ >
          {/* ... (opciones) ... */}
        </select>
      </div>

        {error && <p className={styles.errorMessage}><AlertCircle size={16}/> Error al cargar compras: {error}</p>}

      {/* Contenido Principal */}
      {!error && (
         selectedProduct ? (
            productPurchases?.length > 0 ? (
                <>
                    {/* Mensaje Resumen */}
                    <p style={{ fontSize: '0.9rem', marginBottom: '20px' }}>
                        Mostrando {productPurchases.length} registro(s) de compra para
                        <strong> "{selectedProductName}"</strong> de {uniqueSuppliersInComparison} proveedor(es) diferente(s).
                    </p>

                    {/* **TODO (Opcional): Añadir gráfico comparativo de precios promedio si tiene sentido** */}
                    {/* <div className={styles.chartContainer}> ... </div> */}

                    <h5>Historial de Precios</h5>
                    <div style={{ overflowX: 'auto', marginTop: '10px' }}>
                        <table className={styles.dataTable}>
                           {/* ... (tabla) ... */}
                        </table>
                    </div>
                </>
            ) : (
              <p style={{marginTop: '10px'}}> <Info size={16} style={{marginRight: '5px'}}/> No se encontraron compras para "{selectedProductName}".</p>
            )
          ) : (
             <p style={{marginTop: '10px'}}> <Info size={16} style={{marginRight: '5px'}}/> Selecciona un insumo de la lista para ver el historial y comparar precios.</p>
          )
      )}

       <div className={styles.chartCardFooter}>
            <Search size={12}/>
            <span>{error ? 'Error al obtener datos' : 'Explora los precios históricos por insumo'}</span>
       </div>
    </div>
  );
};

export default SupplierView;