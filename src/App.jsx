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
import { AuthProvider, useAuth } from "./views/hooks/AuthProvider";
import ProtectedRoute from "./views/hooks/Route"; // O el nombre correcto del archivo donde defines la ruta protegida

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
import Dashboard from "./views/module/Dashboard/dashboard"
import ListaFichasTecnicas from "./views/module/ProductoInsumo/ListaFichasTecnicas";
import SpecificConceptManagement from './views/module/ManoDeObra/SpecificConceptManagement';

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
          {/* === Ruta Pública para el Login === */}
          <Route path="/login" element={<Login />} /> {/* <--- CAMBIO AQUÍ */}

          {/* Opcional: Si también quieres que "/" sea el login */}
          <Route path="/" element={<Login />} />

          {/* === Rutas Privadas (Requieren Login) === */}
          <Route element={<ProtectedRoute />}>
            <Route path="home" element={<AppLayout />}>
              {/* ... tus otras rutas ... */}
              <Route index element={<Navigate to="dashboard" replace />} /> {/* Por ejemplo, para /home */}
              <Route path="dashboard" element={<Dashboard/>} /> {/* Ejemplo */}
              {renderRoutes(pagesRoutes)}
              <Route path="profile" element={<UserProfile />} />
              <Route path="conceptos-gasto" element={<TablaGastos />} />
              <Route path="rendimiento-empleado" element={<RendimientoEmpleado />} />
              <Route path="registrar-compra" element={<RegistroCompra />} />
              <Route path="ficha-tecnica/crear" element={<FichaTecnica />} />
              <Route path="insumos" element={<Insumos />} />
              <Route path="producto/:idProduct/fichas" element={<ListaFichasTecnicas />} />
              <Route path="fichas-tecnicas/:idProduct" element={<ListaFichasTecnicas />} />
              <Route path="ficha-tecnica/editar/:idSpecsheet" element={<FichaTecnica />} />
              <Route path="/home/gestion-conceptos-especificos" element={<SpecificConceptManagement />} />
            </Route>
          </Route>
          
             


          {/* Opcional: Ruta catch-all para 404 */}
          {/* <Route path="*" element={<Navigate to="/login" replace />} /> */}
        </Routes>
      </AuthProvider>
    </Router>
  );
}   