// src/views/hooks/route.js (MODIFICADO)
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthProvider";

const PrivateRoute = () => {
  const { user, token, loading } = useAuth(); // Obtén loading del contexto

  if (loading) {
    // Muestra un estado de carga mientras el AuthProvider verifica el token/usuario
    // Podrías retornar un Spinner/Loader de Antd aquí
    return <div>Verificando autenticación...</div>;
  }

  // Si no está cargando y no hay token (o usuario), redirige a login
  if (!token) { // La verificación principal suele ser el token
    // console.log("PrivateRoute: No token found, redirecting to /");
    return <Navigate to="/" replace />; // Usa replace para no guardar la ruta privada en el historial
  }

  // Si no está cargando y hay token, permite el acceso al Outlet (rutas hijas)
  // console.log("PrivateRoute: Token found, allowing access.");
  return <Outlet />;
};

export default PrivateRoute;