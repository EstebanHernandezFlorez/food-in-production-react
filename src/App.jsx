import {
  BrowserRouter as Router,
  Route,
  Routes,
  Outlet,
} from "react-router-dom";
import "./index.css";
import pagesRoutes from "./views/module/pages.routes";
import Login from "./views/module/Auth/Login";
import AppLayout from "./components/layout/AppLayout";
import PrivateRoute from "./views/hooks/route";
import AuthProvider from "./views/hooks/AuthProvider";

export default function App() {
  const renderRoutes = (routes) => {
    return routes.map((route, index) => {
      if (route.children) {
        return (
          <Route
            key={index}
            path={route.children.path}
            element={
              route.element || <Outlet /> // Renderiza Outlet si no hay un elemento explícito
            }
          >
            {renderRoutes(route.children)}
          </Route>
        );
      }
      return <Route key={index} path={route.path} element={route.element} />;
    });
  };

  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route element={<PrivateRoute />}>
            <Route path="home" element={<AppLayout />}>
              {renderRoutes(pagesRoutes)}
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}
