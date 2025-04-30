// src/views/hooks/route.js (o src/components/PrivateRoute.js)

import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthProvider"; // Asegúrate que la ruta a AuthProvider sea correcta

const PrivateRoute = () => {
  // 1. Obtiene el estado actual de autenticación y carga
  const { user, token, loading } = useAuth();

  // 2. Si está en proceso de carga/validación inicial...
  if (loading) {
    // ...muestra un indicador y NO renderiza nada más.
    // Esto es CRUCIAL para esperar la validación.
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
            <span>Verificando autenticación...</span>
            {/* Podrías usar un Spinner de Antd aquí: */}
            {/* <Spin size="large" /> */}
        </div>
    );
  }

  // 3. Si la carga terminó y NO hay token...
  if (!token) {
    // ...redirige al usuario a la página de login.
    console.log("PrivateRoute: No hay token después de cargar. Redirigiendo a /");
    return <Navigate to="/" replace />; // 'replace' es importante
  }

  // 4. Si la carga terminó y SÍ hay token...
  // ...permite el acceso y renderiza la ruta hija correspondiente.
  console.log("PrivateRoute: Token válido después de cargar. Permitiendo acceso.");
  return <Outlet />;
};

export default PrivateRoute;