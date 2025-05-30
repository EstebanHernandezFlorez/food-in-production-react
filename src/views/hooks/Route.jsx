// src/views/hooks/Route.jsx (o PrivateRoute.jsx, ProtectedRoute.jsx, etc.)
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider"; // Ajusta la ruta
import { Spinner } from "reactstrap"; // Para el loader

const ProtectedRoute = () => {
  const { isAuthenticated, loading, initialAuthCheckComplete, user } = useAuth();
  const location = useLocation();

  console.log(`[ProtectedRoute] Path: ${location.pathname}, Auth Loading: ${loading}, InitialCheckComplete: ${initialAuthCheckComplete}, IsAuthenticated: ${isAuthenticated}`);

  if (loading || !initialAuthCheckComplete) {
    // Muestra un loader mientras se verifica el estado de autenticación
    // Esto es crucial para evitar renderizados prematuros o redirecciones incorrectas
    console.log("[ProtectedRoute] Auth check in progress, showing loader.");
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spinner color="primary" style={{ width: '3rem', height: '3rem' }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Si no está autenticado y el chequeo inicial está completo, redirige a login
    console.log("[ProtectedRoute] Not authenticated, redirecting to login.");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Lógica adicional para roles específicos si es necesario aquí,
  // aunque mucho ya se maneja en App.jsx y los componentes individuales.
  // Por ejemplo, si un rol no "cocinero" intenta acceder a una ruta solo para cocineros
  // y esa ruta no tiene su propia protección interna.

  // Si está autenticado, renderiza el contenido de la ruta (Outlet)
  console.log("[ProtectedRoute] Authenticated, rendering Outlet.");
  return <Outlet />; 
};

export default ProtectedRoute;