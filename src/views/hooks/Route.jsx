// src/views/hooks/Route.jsx
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { Spinner } from "reactstrap";

const ProtectedRoute = () => {
  const { isAuthenticated, loading, initialAuthCheckComplete, user } = useAuth();
  const location = useLocation();

  if (loading || !initialAuthCheckComplete) {
    // Loader mientras se verifica el estado de autenticación.
    // Evita redirecciones incorrectas antes de tener la info del usuario.
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spinner color="primary" style={{ width: '3rem', height: '3rem' }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Si el chequeo terminó y no está autenticado, redirige a login.
    console.log("[ProtectedRoute] Usuario no autenticado. Redirigiendo a /login.");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // --- LÓGICA DE PROTECCIÓN DE RUTA POR ROL ---
  const ADMIN_ROLE_ID = 1;
  const isUserAdmin = user.idRole === ADMIN_ROLE_ID;
  const pathname = location.pathname;

  // Lista de rutas que son EXCLUSIVAS para el Administrador.
  const adminOnlyPaths = ['/home/dashboard', '/home/historial'];

  // Verificamos si la ruta actual es una de las rutas solo para admin.
  const isAccessingAdminRoute = adminOnlyPaths.some(adminPath => pathname.startsWith(adminPath));

  if (isAccessingAdminRoute && !isUserAdmin) {
    // ¡CASO CRÍTICO! El usuario intenta acceder a una ruta de admin y NO es admin.
    console.warn(`[ProtectedRoute] ACCESO DENEGADO. Usuario (roleId: ${user.idRole}) intentó acceder a ruta de admin: ${pathname}. Redirigiendo a /home/profile.`);
    
    // Lo redirigimos a una página segura, como su perfil.
    return <Navigate to="/home/profile" replace />;
  }
  // --- FIN DE LA LÓGICA DE PROTECCIÓN ---

  // Si todas las comprobaciones pasan, el usuario tiene permiso para ver la página.
  console.log(`[ProtectedRoute] Acceso permitido a ${pathname} para usuario (roleId: ${user.idRole}).`);
  return <Outlet />; 
};

export default ProtectedRoute;