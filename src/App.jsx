import {
  BrowserRouter as Router,
  Route,
  Routes,
  Outlet,
} from "react-router-dom";
import "./index.css";
import pagesRoutes from "./views/module/pages.routes";
import Login from "./views/module/Auth/Login";
import { AppLayout } from "./views/Layout";
import PrivateRoute from "./views/hooks/route";
import  AuthProvider  from "./views/hooks/AuthProvider";

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
        <Route
          path="/"
          element={
            <Login
              setIsAuthenticated={setIsAuthenticated}
              openRecoverModal={openRecoverModal}
            />
          }
        />

        {isAuthenticated ? (
          <Route
            path="/*"
            element={
              <Layout>
                <Sider
                  className="sidebar"
                  collapsible
                  trigger={null}
                  collapsed={collapsed}
                  onCollapse={() => setCollapsed(!collapsed)}
                  style={{ backgroundColor: '#fff' }} // Fondo blanco en el Sider
                >
                  <Logo collapsed={collapsed} />
                  <MenuList />
                </Sider>
                <Layout>
                  <Header
                    style={{
                      padding: '3px',
                      borderBottom: '5px solid #800020',
                      position: 'fixed',
                      width: '100%',
                      zIndex: 1000,
                      backgroundColor: '#fff', // Fondo blanco en el Header
                    }}
                    className="header"
                  >
                    <div
                      className="d-flex justify-content-between align-items-center"
                      style={{ height: '100%' }}
                    >
                      <Button
                        className="buttonInt"
                        type="text"
                        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        onClick={() => setCollapsed(!collapsed)}
                        style={{
                          fontSize: collapsed ? '16px' : '24px',
                          transition: 'font-size 0.3s',
                          color: '#000', // Texto negro en el Button
                        }}
                      />
                      <div style={{ position: 'absolute', right: '18%', zIndex: 2000 }}>
                        <NavDropdown
                          title={
                            <span>
                              <UserOutlined
                                style={{ marginRight: '8px', fontSize: '20px' }}
                              />
                              Lina Marcela - Admin
                            </span>
                          }
                          id="nav-dropdown"
                        >
                          <NavDropdown.Item href="#action1">Perfil</NavDropdown.Item>
                          <NavDropdown.Item href="#action2">Cerrar Sesión</NavDropdown.Item>
                        </NavDropdown>
                      </div>
                    </div>
                  </Header>

                  <Content
                    style={{ padding: '80px 24px 24px', minHeight: 'calc(100vh - 64px)', backgroundColor: '#fff' }} // Fondo blanco en el Content
                  >
                    <Routes>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/roles" element={<Roles />} />
                      <Route path="/usuarios" element={<Usuarios />} />
                      <Route path="/produccion" element={<Produccion />} />
                      <Route path="/compras/registrar" element={<RegistroCompra />} />
                      <Route path="/producto_insumo" element={<ProductoInsumo />} />
                      <Route path="/gestion-compras" element={<GestionComprasPage />} />
                      <Route path="/insumo" element={<Insumo />} />
                      <Route path="/empleados" element={<Empleados />} />
                      <Route path="/proveedores" element={<Proveedores />} />
                      <Route path="/clientes" element={<Clientes />} />
                      <Route path="/reservas" element={<Reservas />} />
                      <Route path="/servicios" element={<Servicios />} />
                      <Route path="/mano_de_obra" element={<ManoDeObra />} />
                      <Route path="/registro-compras" element={<RegistroCompra />} />
                      <Route path="/tabla-gastos" element={<TablaGastos />} />
                      <Route path="/rendimiento-empleado" element={<RendimientoEmpleado />} />
                    </Routes>
                  </Content>
                </Layout>
              </Layout>
            }
          />
        ) : (
          <Route path="*" element={<Navigate to="/" />} />
        )}
      </Routes>
      </AuthProvider>
    </Router>
  );
}
