// src/views/hooks/Route.jsx (o donde definas PrivateRoute)
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthProvider"; // Ajusta la ruta si es necesario

const PrivateRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    console.log("PrivateRoute: AuthProvider está cargando...");
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5', color: '#333' }}>
            <span>Verificando autenticación...</span>
        </div>
    );
  }

  // Si no está autenticado, redirige a la página de login (o donde desees)
  if (!isAuthenticated) {
    console.log("PrivateRoute: No autenticado después de cargar. Redirigiendo a /");
    return <Navigate to="/login" replace />;
  }

  // Si está autenticado, permite el acceso a la ruta protegida
  console.log("PrivateRoute: Autenticado. Permitiendo acceso a la ruta.");
  return <Outlet />; // Renderiza el componente hijo de la ruta protegida
};

export default PrivateRoute;
