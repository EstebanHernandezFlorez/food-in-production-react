// src/App.jsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Outlet,
  Navigate,
} from "react-router-dom";
import { Spinner } from "reactstrap";

import "./assets/css/App.css";
import { AuthProvider, useAuth } from "./views/hooks/AuthProvider";
import ProtectedRoute from "./views/hooks/Route";

// Layout y vistas principales
import AppLayout from "./components/layout/AppLayout";
import Login from "./views/module/Auth/Login";
import pagesRoutes from "./views/module/pages.routes"; // Asegúrate que este archivo exporte un array de rutas
import UserProfile from "./views/module/Auth/UserProfile";

// Importa ActiveOrdersProvider
import { ActiveOrdersProvider } from './views/module/OrdenProduccion/ActiveOrdersContext';

// Vistas específicas (mantén las que necesites)
// import Dashboard from "./views/module/Dashboard/dashboard"; // Probablemente ya en pagesRoutes
import TablaGastos from "./views/module/ManoDeObra/TablaGastos";
import RendimientoEmpleado from "./views/module/ManoDeObra/RendimientoEmpleado";
import RegistroCompra from "./views/module/Compras/RegistroComprasPage";
import Insumos from "./views/module/Insumo/Insumo";
import SpecificConceptManagement from './views/module/ManoDeObra/SpecificConceptManagement';
// import ProduccionPage from "./views/module/OrdenProduccion/ProduccionPage"; // Probablemente ya en pagesRoutes
import FichaTecnica from "./views/module/ProductoInsumo/FichaTecnica";
import ListaFichasTecnicas from "./views/module/ProductoInsumo/ListaFichasTecnicas";

// Helper para renderizar rutas anidadas desde pages.routes.jsx
const renderRoutes = (routesArray, basePath = "") => {
  if (!Array.isArray(routesArray)) {
    console.warn("[renderRoutes] routesArray no es un array o es undefined:", routesArray);
    return null;
  }
  return routesArray.map((route, index) => {
    if (!route.path || !route.element) { // Asegurar que la ruta tenga path y element
        console.warn("[renderRoutes] Ruta inválida (sin path o element):", route, "en índice:", index);
        return null;
    }

    const fullPath = route.path.startsWith('/') ? route.path : `${basePath}/${route.path}`.replace(/\/+/g, '/').replace(/^\//, '');
    
    const elementToRender = route.element;

    if (route.children && route.children.length > 0) {
      return (
        <Route
          key={route.path || index} // Usar route.path para key si está disponible
          path={route.path}
          element={React.cloneElement(elementToRender, { children: <Outlet /> })}
        >
          {renderRoutes(route.children, "")}
        </Route>
      );
    }
    return <Route key={route.path || index} path={route.path} element={elementToRender} />;
  });
};

// Componente para la decisión de redirección del índice de /home
const HomeIndexRedirectDecider = () => {
  const { user, initialAuthCheckComplete, loading } = useAuth();

  if (loading || !initialAuthCheckComplete) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px - 48px)', width: '100%' }}>
        <Spinner color="primary" style={{ width: '3rem', height: '3rem' }} />
      </div>
    );
  }

  const userRoleName = user?.role?.roleName;
  if (userRoleName && userRoleName.toLowerCase() === "cocinero") {
    return <Navigate to="/home/produccion/orden-produccion" replace />;
  }
  // Asegúrate que "/home/dashboard" es una ruta válida generada por renderRoutes o definida manualmente
  return <Navigate to="/home/dashboard" replace />;
};


export default function App() {
  console.log("[APP] App componente renderizando.");
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Rutas Protegidas envueltas AHORA por ActiveOrdersProvider */}
          <Route element={<ProtectedRoute />}>
            <Route
              path="home"
              element={
                // ActiveOrdersProvider envuelve AppLayout y sus rutas hijas (Outlet)
                <ActiveOrdersProvider>
                  <AppLayout />
                </ActiveOrdersProvider>
              }
            >
              <Route index element={<HomeIndexRedirectDecider />} />

              {/* renderRoutes generará las rutas desde pages.routes.jsx */}
              {/* Asegúrate que pages.routes.jsx exporte un array válido */}
              {pagesRoutes && pagesRoutes.length > 0 ? renderRoutes(pagesRoutes) : (
                <Route path="dashboard" element={<div>Dashboard (placeholder si pagesRoutes falla)</div>} />
              )}


              {/* Rutas específicas adicionales que no están en pages.routes.jsx */}
              <Route path="profile" element={<UserProfile />} />
              <Route path="compras/registrar" element={<RegistroCompra />} />

              {/* Ejemplo de otras rutas, asegúrate de que no haya conflictos con pages.routes.jsx */}
              {/* Si "insumos" está en pages.routes, esta podría ser redundante o diferente */}
              {/* <Route path="insumos" element={<Insumos />} />  // Comentado, revisa si está en pages.routes */}
              <Route path="fichas-tecnicas" element={<ListaFichasTecnicas />} />
              <Route path="fichas-tecnicas/crear" element={<FichaTecnica />} />
              <Route path="fichas-tecnicas/editar/:idSpecsheet" element={<FichaTecnica />} />
              <Route path="producto/:idProduct/fichas" element={<ListaFichasTecnicas />} />

              <Route path="mano-de-obra/gastos" element={<TablaGastos />} />
              <Route path="mano-de-obra/rendimiento" element={<RendimientoEmpleado />} />
               <Route path="mano-de-obra/conceptos" element={<SpecificConceptManagement />} />

              <Route path="*" element={
                <div className="container text-center py-5">
                  <h2>Página no encontrada en Home</h2>
                  <p>La página que buscas dentro de la aplicación no existe.</p>
                  <p>Path intentado: {window.location.pathname}</p>
                  <p><a href="/home/dashboard">Ir al Dashboard</a></p>
                </div>
              } />
            </Route>
          </Route>

          <Route path="*" element={
            <div className="container text-center py-5">
              <h2>Ruta global no encontrada</h2>
              <p>La URL solicitada no corresponde a ninguna página configurada.</p>
              <p>Path: {window.location.pathname}</p>
              <p><a href="/login">Ir al Login</a></p>
            </div>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  );
}