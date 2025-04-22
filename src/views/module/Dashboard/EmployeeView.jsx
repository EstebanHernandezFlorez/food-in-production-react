// src/views/module/Dashboard/EmployeeView.jsx
import React, { useState, useMemo } from 'react';
import styles from './Dashboard.module.css';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { UsersRound, Info, AlertCircle } from 'lucide-react'; // Usamos UsersRound

const EmployeeView = ({ employees, processes, records, isLoadingParent }) => {
  const [selectedProcess, setSelectedProcess] = useState('');
  // Añadir error específico si la carga de 'records' falla en el futuro
  // const [recordsError, setRecordsError] = useState(null);

  // ... (useMemo para processRecords y employeeComparisonData - sin cambios) ...
  const handleProcessChange = (e) => setSelectedProcess(e.target.value);
  const currentProcess = (processes || []).find(p => p.id === selectedProcess);

  // --- Renderizado ---
   if (isLoadingParent) {
     return <div className={`${styles.chartCard} ${styles.loading}`}><p className={styles.loadingMessage}>Cargando Empleados...</p></div>;
   }

   // Calcular KPIs del proceso seleccionado (Ejemplo)
   const processKPIs = useMemo(() => {
        if (!processRecords || processRecords.length === 0) return null;
        const totalInput = processRecords.reduce((sum, r) => sum + (r.inputConsumed || 0), 0);
        const totalOutput = processRecords.reduce((sum, r) => sum + (r.outputProduced || 0), 0);
        const totalTime = processRecords.reduce((sum, r) => sum + (r.timeTakenMin || 0), 0);
        const avgEfficiencyIO = totalInput > 0 ? (totalOutput / totalInput) * 100 : 0; // Eficiencia % Input/Output
        const avgTimePerUnit = totalOutput > 0 ? totalTime / totalOutput : 0; // Tiempo promedio por unidad producida
        return {
            recordCount: processRecords.length,
            avgEfficiencyIO: avgEfficiencyIO.toFixed(1),
            avgTimePerUnit: avgTimePerUnit.toFixed(1)
        };
   }, [processRecords]);


  return (
    <div className={styles.chartCard}>
      <h4 className={styles.chartCardTitle}>Análisis de Eficiencia</h4>
      <p className={styles.chartCardSubtitle}>Compara el rendimiento de empleados por proceso</p>

       <div className={styles.filters} style={{ marginBottom: '25px', paddingLeft: 0 }}>
        <label htmlFor="process-select-employee" /* ... */ >Proceso:</label>
        <select id="process-select-employee" className={styles.filterSelect} value={selectedProcess} onChange={handleProcessChange} disabled={!processes || processes.length === 0} >
           {/* ... (opciones) ... */}
        </select>
      </div>

       {/* TODO: Añadir manejo de error si la carga de 'records' falla */}
       {/* {recordsError && <p className={styles.errorMessage}>...</p>} */}

       {/* Contenido Principal */}
      {selectedProcess ? (
         (records && records.length > 0 && processRecords?.length > 0) ? (
             <>
                {/* Resumen y KPIs del Proceso */}
                {processKPIs && (
                    <div className={styles.statsContainer} style={{gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', marginBottom: '30px'}}>
                        <div className={styles.statCard}>
                            <h4>Registros</h4>
                            <p>{processKPIs.recordCount}</p>
                        </div>
                         <div className={styles.statCard}>
                            <h4>Efic. Prom.</h4>
                            <p>{processKPIs.avgEfficiencyIO}%</p>
                            <small style={{fontSize: '0.7rem'}}>(Output/Input)</small>
                        </div>
                         <div className={styles.statCard}>
                            <h4>T. Prom/Ud</h4>
                            <p>{processKPIs.avgTimePerUnit} min</p>
                        </div>
                    </div>
                )}

                 {/* Gráfico Comparativo */}
                 <div className={styles.chartContainer}>
                    <h5>Comparativa Promedios: {currentProcess?.name}</h5>
                    {/* ... (ResponsiveContainer con BarChart) ... */}
                 </div>

                 {/* Tabla Registros */}
                 <h5 style={{marginTop: '30px'}}>Registros Individuales: {currentProcess?.name}</h5>
                 <div style={{ overflowX: 'auto', marginTop: '10px' }}>
                     <table className={styles.dataTable}>
                        {/* ... (tabla) ... */}
                     </table>
                 </div>
             </>
         ) : (
             <p style={{marginTop: '10px'}}><Info size={16} style={{marginRight: '5px'}}/> No se encontraron registros para el proceso "{currentProcess?.name}".</p>
         )
      ) : (
          <p style={{marginTop: '10px'}}><Info size={16} style={{marginRight: '5px'}}/> Selecciona un proceso para ver el análisis de eficiencia.</p>
      )}


       <div className={styles.chartCardFooter}>
            <UsersRound size={12}/>
            <span>Analiza el rendimiento individual por proceso</span>
       </div>
    </div>
  );
};

export default EmployeeView;