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
import pagesRoutes from "./views/module/pages.routes";
import UserProfile from "./views/module/Auth/UserProfile";

// Contexto
import { ActiveOrdersProvider } from './views/module/OrdenProduccion/ActiveOrdersContext';

// Vistas específicas
import TablaGastos from "./views/module/ManoDeObra/TablaGastos";
import RendimientoEmpleado from "./views/module/ManoDeObra/RendimientoEmpleado";
import RegistroCompra from "./views/module/Compras/RegistroComprasPage";
import SpecificConceptManagement from './views/module/ManoDeObra/SpecificConceptManagement';
import FichaTecnica from "./views/module/ProductoInsumo/FichaTecnica";
import ListaFichasTecnicas from "./views/module/ProductoInsumo/ListaFichasTecnicas";
import OrdenProduccionForm from "./views/module/OrdenProduccion/OrdenProduccion";

// Helper para renderizar rutas anidadas
const renderRoutes = (routesArray, basePath = "") => {
  if (!Array.isArray(routesArray)) return null;
  return routesArray.map((route, index) => {
    if (!route.path || !route.element) return null;
    const fullPath = route.path.startsWith('/') ? route.path : `${basePath}/${route.path}`.replace(/\/+/g, '/').replace(/^\//, '');
    const elementToRender = route.element;
    if (route.children && route.children.length > 0) {
      return (
        <Route
          key={route.path || index}
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

// Componente para decidir la redirección inicial dentro de /home
const HomeIndexRedirectDecider = () => {
  const { user, initialAuthCheckComplete, loading } = useAuth();

  if (loading || !initialAuthCheckComplete) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 112px)', width: '100%' }}>
        <Spinner color="primary" style={{ width: '3rem', height: '3rem' }} />
      </div>
    );
  }

  if (!user || !user.idRole) {
    return <Navigate to="/login" replace />;
  }

  // Mapa de redirecciones por defecto según el rol. ¡AJUSTA ESTAS RUTAS!
  const defaultRoutesByRole = {
    1: '/home/dashboard',                     // Admin
    2: '/home/produccion/orden-produccion',                      // Rol 2 (ej. Supervisor) -> va a Usuarios
    3: '/home/produccion/orden-produccion',   // Rol 3 (Cocinero)
  };

  const redirectTo = defaultRoutesByRole[user.idRole] || '/home/profile'; // Fallback a perfil

  console.log(`[HomeIndexRedirectDecider] Redirigiendo roleId ${user.idRole} a ${redirectTo}`);
  
  return <Navigate to={redirectTo} replace />;
};


export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route element={<ProtectedRoute />}>
            <Route
              path="home"
              element={
                <ActiveOrdersProvider>
                  <AppLayout />
                </ActiveOrdersProvider>
              }
            >
              <Route index element={<HomeIndexRedirectDecider />} />
              
              {pagesRoutes && pagesRoutes.length > 0 ? renderRoutes(pagesRoutes) : null}

              {/* Rutas específicas adicionales */}
              <Route path="profile" element={<UserProfile />} />
              <Route path="compras/registrar" element={<RegistroCompra />} />
              <Route path="fichas-tecnicas" element={<ListaFichasTecnicas />} />
              <Route path="fichas-tecnicas/crear" element={<FichaTecnica />} />
              <Route path="fichas-tecnicas/editar/:idSpecsheet" element={<FichaTecnica />} />
              <Route path="producto/:idProduct/fichas" element={<ListaFichasTecnicas />} />
              <Route path="produccion/ordenes/crear" element={<OrdenProduccionForm />} />
              <Route path="mano-de-obra/gastos" element={<TablaGastos />} />
              <Route path="mano-de-obra/rendimiento" element={<RendimientoEmpleado />} />
              <Route path="mano-de-obra/conceptos" element={<SpecificConceptManagement />} />
              
              <Route path="*" element={
                <div className="container text-center py-5">
                  <h2>Página no encontrada</h2>
                  <p>La página que buscas no existe.</p>
                </div>
              } />
            </Route>
          </Route>

          <Route path="*" element={
            <div className="container text-center py-5">
              <h2>Ruta no encontrada</h2>
              <p>La URL solicitada no corresponde a ninguna página.</p>
            </div>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  );
}