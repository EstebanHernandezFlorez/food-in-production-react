// RUTA: src/views/Dashboard/hooks/useDashboardSection.js
import { useState, useEffect, useCallback } from 'react';

export const useDashboardSection = (fetchDataCallback, deps = []) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchDataCallback();
      setData(result);
    } catch (err) {
      console.error("Error en useDashboardSection:", err);
      setError(err.message || "Ocurrió un error al cargar los datos.");
    } finally {
      setIsLoading(false);
    }
  }, [fetchDataCallback]);

  useEffect(() => {
    loadData();
  }, [loadData, ...deps]);

  return { data, isLoading, error, reload: loadData };
};