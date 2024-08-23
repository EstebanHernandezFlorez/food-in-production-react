import { useState } from "react";
import { useNavigate } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Layout, Button } from 'antd';
import { MenuUnfoldOutlined, MenuFoldOutlined, UserOutlined } from '@ant-design/icons';
import MenuList from './views/module/MenuList';
import Logo from './views/module/Logo';
import ToggleThemeButton from './views/module/ToggleThemeButton';
import Dashboard from "./views/module/Dashboard/dashboard";
import Roles from './views/module/roles/roles';
import Usuarios from './views/module/usuarios/usuarios';
import Produccion from './views/module/Produccion/produccion';
import OrdenProduccion from './views/module/OrdenProduccion/OrdenProduccion';
import ProductoInsumo from './views/module/ProductoInsumo/ProductoInsumo';
import Insumo from './views/module/Insumo/Insumo';
import Empleados from './views/module/Empleados/Empleados';
import Proveedores from './views/module/Proveedores/Proveedores';
import Clientes from './views/module/Clientes/Clientes';
import Reservas from './views/module/Reservas/Reservas';
import Servicios from './views/module/Servicios/Servicios';
import ManoDeObra from './views/module/ManoDeObra/ManoDeObra';

const users = [
  {
    id: 1,
    usuario: "Carla Gomez",
    contrasena: "12345", // Convertido a string para comparación
    rol: "auxiliar de cocina"
  },
  {
    id: 2,
    usuario: "Luis gutierrez",
    contrasena: "12345", // Convertido a string para comparación
    rol: "administrador"
  },
];

const { Header, Sider, Content } = Layout;

export default function App() {
  const [darkTheme, setDarkTheme] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Estado de autenticación

  const toggleTheme = () => {
    setDarkTheme(!darkTheme);
  };

  return (
    <Router>
      <Routes>
        {/* Ruta de inicio de sesión */}
        <Route path="/" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
        
        {/* Rutas protegidas que requieren autenticación */}
        {isAuthenticated ? (
          <Route path="/*" element={
            <Layout>
              <Sider
                theme={darkTheme ? 'dark' : 'light'}
                style={{
                  backgroundColor: darkTheme ? '#4a0000' : '#fff',  // Vinotinto si darkTheme es true
                }}
                className="sidebar"
                collapsible
                trigger={null}
                collapsed={collapsed}
                onCollapse={() => setCollapsed(!collapsed)}
              >
                <Logo />
                <MenuList darkTheme={darkTheme} />
                <ToggleThemeButton darkTheme={darkTheme} toggleTheme={toggleTheme} />
              </Sider>
              <Layout>
                <Header style={{ padding: 0 }} className='header'>
                  <div className="d-flex justify-content-between align-items-center" style={{ height: '100%' }}>
                    <Button
                      className='buttonInt'
                      type='text'
                      icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                      onClick={() => setCollapsed(!collapsed)}
                    />
                    <h1 style={{ margin: 0 }}>Food in Production</h1>
                    <Button 
                      className='buttonStatus justify-content-end'
                      type='text'
                      icon={<UserOutlined />}
                      style={{ marginLeft: 'auto' }} // Alinea el botón a la derecha
                    >
                      Lina Marcela: Admin
                    </Button>
                  </div>
                </Header>
                <Content style={{ padding: '24px', minHeight: 'calc(100vh - 64px)' }}>
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/roles" element={<Roles />} />
                    <Route path="/usuarios" element={<Usuarios />} />
                    <Route path="/produccion" element={<Produccion />} />
                    <Route path="/orden_produccion" element={<OrdenProduccion />} />
                    <Route path="/producto_insumo" element={<ProductoInsumo />} />
                    <Route path="/insumo" element={<Insumo />} />
                    <Route path="/empleados" element={<Empleados />} />
                    <Route path="/proveedores" element={<Proveedores />} />
                    <Route path="/clientes" element={<Clientes />} />
                    <Route path="/reservas" element={<Reservas />} />
                    <Route path="/servicios" element={<Servicios />} />
                    <Route path="/mano_de_obra" element={<ManoDeObra />} />
                  </Routes>
                </Content>
              </Layout>
            </Layout>
          } />
        ) : (
          <Route path="*" element={<Navigate to="/" />} />
        )}
      </Routes>
    </Router>
  );
}

function Login({ setIsAuthenticated }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    const validUser = users.find((user) => user.usuario === username && user.contrasena === password);
    
    if (validUser) {
      setError("");
      setIsAuthenticated(true); // Establecer la autenticación
      navigate("/dashboard");
    } else {
      setError("Usuario o contraseña incorrectos");
    }
  };

  return (
    <div className="row h-100 w-100">
      <div className="col-sm-12 col-md-6">
        <div className="d-flex justify-content-center align-items-center h-100">
          <form className='border border-black p-5' onSubmit={handleSubmit}>
            <img src="../src/assets/logo.jpg" alt="logo" style={{ width: 100, height: 100 }} className="logo img-fluid mb-4" />
            <div className="form-group">
              <i className="fa fa-user fa-lg" aria-hidden="true"></i>
              <label htmlFor="username" className='form-label'>Usuario</label>
              <input
                type="text"
                className="form-control"
                id="username"
                placeholder="correo@micorreo.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="password" className='form-label'>Contraseña</label>
              <input
                type="password"
                className="form-control"
                id="password"
                placeholder="Ingrese la contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <div className="text-danger mb-3">{error}</div>}
            <div className='my-3'>
              <a href="#">Recuperar contraseña</a>
            </div>
            <div className="btn-group">
              <button type="submit" className="btn btn-primary">
                Ingresar
              </button>
            </div>
          </form>
        </div>
      </div>
      <article className="col-sm-12 col-md-6">
        <div className="d-flex justify-content-center align-items-center h-100">
          <img src="../src/assets/login.jpg" alt="food-in-production" width="800" height="800" />
        </div>
      </article>
    </div>
  );
}
