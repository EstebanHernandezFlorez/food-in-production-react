// import {
//   BrowserRouter as Router,
//   Route,
//   Routes,
//   Outlet,
// } from "react-router-dom";
// import "./index.css";
// import pagesRoutes from "./views/module/pages.routes";
// import Login from "./views/module/Auth/Login";
// import AppLayout from "./components/layout/AppLayout";
// import PrivateRoute from "./views/hooks/route";
// import AuthProvider from "./views/hooks/AuthProvider";
// import TablaGastos from "./views/module/ManoDeObra/TablaGastos";
// import ManoDeObra from "./views/module/ManoDeObra/ManoDeObra";

// export default function App() {
//   const renderRoutes = (routes) => {
//     return routes.map((route, index) => {
//       if (route.children) {
//         return (
//           <Route
//             key={index}
//             path={route.children.path}
//             element={
//               route.element || <Outlet /> // Renderiza Outlet si no hay un elemento explícito
//             }
//           >
//             {renderRoutes(route.children)}
//           </Route>
//         );
//       }
//       return <Route key={index} path={route.path} element={route.element} />;
//     });
//   };

//   return (
//     <Router>
//       <AuthProvider>
//         <Routes>
//           {/* rutas publicas */}
//           <Route path="/" element={<Login />} />
//           <Route path="/password" element={<Login />} />
//           {/* rutas privadas */}
//           <Route element={<PrivateRoute />}>
//             <Route path="home" element={<AppLayout />}>
//               {renderRoutes(pagesRoutes)}
//             </Route>
//             <Route path="conceptos-gasto" element={<TablaGastos />} />
//             <Route path="mano-de-obra" element={<ManoDeObra />} />
//           </Route>
          
//         </Routes>
//       </AuthProvider>
//     </Router>
//   );
// }


// src/App.js (Versión Combinada y Corregida)

import {
  BrowserRouter as Router,
  Route,
  Routes,
  Outlet, // Necesario si una ruta padre tiene 'element' y rutas hijas
} from "react-router-dom";
import "./index.css"; // Estilos globales

// --- Componentes del Layout y Auth ---
import AppLayout from "./components/layout/AppLayout"; // Tu Layout principal
import Login from "./views/module/Auth/Login"; // Tu componente Login
import AuthProvider from "./views/hooks/AuthProvider"; // Tu proveedor de Auth
import PrivateRoute from "./views/hooks/route"; // Tu componente/hook de ruta privada

// --- Rutas para el Menú ---
import pagesRoutes from "./views/module/pages.routes";

// --- Componentes de Vistas (Asegúrate que las rutas de importación son correctas) ---
// Importaciones que probablemente irán en pages.routes.jsimport Dashboard from "./views/module/Dashboard/dashboard";
import GestionComprasPage from "./views/module/Compras/GestionComprasPage"; // Vista principal de compras?


// Importaciones para rutas "ocultas" o específicas
import TablaGastos from "./views/module/ManoDeObra/TablaGastos"; // Verifica la ruta real (Gastos o ManoDeObra?)
import RendimientoEmpleado from "./views/module/ManoDeObra/RendimientoEmpleado"; // Verifica la ruta real
import RegistroCompra from './views/module/Compras/RegistroComprasPage'; // Se accede desde GestionCompras?

// Opcional: Componente para rutas no encontradas
// import NotFound from './views/NotFound';

export default function App() {

  // Función mejorada para renderizar rutas (maneja recursividad)
  const renderRoutes = (routesArray) => {
    return routesArray.map((route, index) => {
      // Si la ruta tiene hijos, renderiza un Route padre (puede tener element o solo Outlet)
      if (route.children && Array.isArray(route.children) && route.children.length > 0) {
        return (
          <Route key={index} path={route.path} element={route.element || <Outlet />}>
            {/* Llama recursivamente para los hijos */}
            {renderRoutes(route.children)}
          </Route>
        );
      }
      // Si no tiene hijos, es una ruta final
      return <Route key={index} path={route.path} element={route.element} />;
    });
  };

  return (
    <Router>
      {/* El AuthProvider envuelve todo para gestionar el estado de autenticación */}
      <AuthProvider>
        <Routes>
          {/* === RUTAS PÚBLICAS === */}
          {/* Ruta raíz para el Login */}
          <Route path="/" element={<Login />} />
          {/* Si tienes una página separada para recuperar contraseña: */}
          {/* import RecoveryPassword from './views/module/Auth/olvidoContraseña'; */}
          {/* <Route path="/password" element={<RecoveryPassword />} /> */}


          {/* === RUTAS PRIVADAS (Requieren autenticación) === */}
          <Route element={<PrivateRoute />}> {/* Protege todas las rutas anidadas */}

            {/* --- Ruta Padre "/home" que aplica el Layout Principal --- */}
            <Route path="home" element={<AppLayout />}>

              {/* 1. Rutas del Menú Principal */}
              {/* Renderiza las rutas definidas en pages.routes.js */}
              {/* Ej: /home/dashboard, /home/roles, /home/mano-de-obra, etc. */}
              {renderRoutes(pagesRoutes)}

              {/* 2. Rutas Específicas o "Ocultas" (Usan el Layout pero no están en el menú) */}
              {/* Se definen aquí para que estén anidadas bajo /home y usen AppLayout */}

              {/* Ruta para Conceptos de Gasto (accedida desde ManoDeObra) */}
              {/* URL: /home/conceptos-gasto */}
              <Route path="conceptos-gasto" element={<TablaGastos />} />

              {/* Ruta para Rendimiento Empleado (ej. accedida desde Empleados o ManoDeObra) */}
              {/* URL: /home/rendimiento-empleado */}
              <Route path="rendimiento-empleado" element={<RendimientoEmpleado />} />

              {/* Ruta para Registrar Compra (ej. accedida desde Gestion Compras) */}
              {/* Puedes usar un path más específico si quieres, ej: compras/registrar */}
              {/* URL: /home/registrar-compra (o /home/compras/registrar si 'compras' es padre en pages.routes.js) */}
              <Route path="registrar-compra" element={<RegistroCompra />} />

              {/* Añade aquí otras rutas que necesiten el Layout pero no el menú */}

              {/* Opcional: Una ruta catch-all DENTRO de /home si no se encuentra nada */}
              {/* <Route path="*" element={<Dashboard />} /> O un componente NotFound específico */}

            </Route>
            {/* --- Fin de la ruta /home --- */}

          </Route>
          {/* === FIN RUTAS PRIVADAS === */}

          {/* Opcional: Ruta global para Not Found (404) si ninguna ruta coincide */}
          {/* <Route path="*" element={<NotFound />} /> */}

        </Routes>
      </AuthProvider>
    </Router>
  );
}