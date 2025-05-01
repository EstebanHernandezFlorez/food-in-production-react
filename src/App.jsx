// src/App.jsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Outlet,
  Navigate,
} from "react-router-dom";

import "./assets/css/App.css"; // Asegúrate que la ruta a tu CSS sea correcta

// --- Proveedor de autenticación y control de rutas privadas ---
import AuthProvider, { useAuth } from "./views/hooks/AuthProvider";
// Asegúrate que la importación de PrivateRoute o ProtectedRoute sea la correcta
import ProtectedRoute from "./views/hooks/Route"; // O el nombre que uses (ej: PrivateRoute)

// --- Layout y vistas principales ---
import AppLayout from "./components/layout/AppLayout";
import Login from "./views/module/Auth/Login";
import pagesRoutes from "./views/module/pages.routes"; // Rutas generadas por el menú

// --- Importa el nuevo componente de Perfil ---
import UserProfile from "./views/module/Auth/UserProfile"; // <-- ¡ASEGÚRATE QUE LA RUTA SEA CORRECTA!

// --- Vistas adicionales fuera del menú ---
import TablaGastos from "./views/module/ManoDeObra/TablaGastos";
import RendimientoEmpleado from "./views/module/ManoDeObra/RendimientoEmpleado";
import RegistroCompra from "./views/module/Compras/RegistroComprasPage";
import FichaTecnica from "./views/module/ProductoInsumo/FichaTecnica";
import Insumos from "./views/module/Insumo/Insumo";
// import NotFound from "./views/NotFound"; // opcional

// Función recursiva para generar rutas del menú (si la usas)
const renderRoutes = (routesArray) => {
  if (!Array.isArray(routesArray)) return null; // Manejo si no es array
  return routesArray.map((route, index) => {
    // Añade validación por si falta 'path' o 'element'
    if (!route.path) return null;

    if (route.children && Array.isArray(route.children) && route.children.length > 0) {
      return (
        <Route
          key={route.path || index} // Usa path como key si está disponible
          path={route.path}
          // Si el padre tiene elemento propio, úsalo, sino Outlet
          element={route.element ? React.cloneElement(route.element, { children: <Outlet /> }) : <Outlet />}
        >
          {/* Llamada recursiva para los hijos */}
          {renderRoutes(route.children)}
        </Route>
      );
    }
    // Ruta simple sin hijos (asegura que tenga elemento)
    return <Route key={route.path || index} path={route.path} element={route.element || <div>Ruta sin elemento: {route.path}</div>} />;
  });
};

// --- RUTA PROTEGIDA (si la defines aquí) ---
// Si ya tienes PrivateRoute en su propio archivo, no necesitas esto.
// const ProtectedRoute = () => {
//   const { user, loading } = useAuth();
//   if (loading) return <div>Cargando sesión...</div>; // O un spinner más elaborado
//   return user ? <Outlet /> : <Navigate to="/" replace />;
// };

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* === Ruta Pública === */}
          <Route path="/" element={<Login />} />

          {/* === Rutas Privadas (Requieren Login) === */}
          {/* Envuelve las rutas privadas con el componente ProtectedRoute */}
          <Route element={<ProtectedRoute />}>
            {/* Define el Layout principal para las rutas bajo /home */}
            <Route path="home" element={<AppLayout />}>

              {/* 1. Rutas generadas a partir de pages.routes (tu menú) */}
              {renderRoutes(pagesRoutes)}

              {/* 2. Ruta específica para el Perfil del Usuario */}
              <Route path="profile" element={<UserProfile />} />
              {/*    ^^^^^^^^^^^^ URL será /home/profile */}

              {/* 3. Otras rutas específicas que no están en pages.routes */}
              <Route path="conceptos-gasto" element={<TablaGastos />} />
              <Route path="rendimiento-empleado" element={<RendimientoEmpleado />} />
              <Route path="registrar-compra" element={<RegistroCompra />} />
              <Route path="ficha-tecnica" element={<FichaTecnica />} />
              <Route path="insumos" element={<Insumos />} />

              {/* Opcional: Ruta por defecto si se accede a /home */}
              {/* Si quieres redirigir /home a /home/dashboard por defecto: */}
              {/* <Route index element={<Navigate to="dashboard" replace />} /> */}

              {/* Opcional: Ruta "No Encontrada" dentro del layout /home */}
              {/* <Route path="*" element={<div>Página no encontrada dentro de Home</div>} /> */}

            </Route> {/* Fin de rutas bajo /home */}
          </Route> {/* Fin de Rutas Protegidas */}

          {/* Opcional: Ruta global 404 (fuera del layout y sin protección) */}
          {/* <Route path="*" element={<NotFound />} /> */}

        </Routes>
      </AuthProvider>
    </Router>
  );
}