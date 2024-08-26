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
import EditarPerfil from "./views/module/EditarPerfil/EditarPerfil";

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
      <div className="col-sm-12 col-md-6 d-flex justify-content-center align-items-center">
    <div className="d-flex justify-content-center align-items-center h-100 w-100 ">
    <form className="p-5 border border-black border border-2 " onSubmit={handleSubmit}>
      <div className="d-flex justify-content-center ">
        <img 
          src="../src/assets/logo.jpg" 
          alt="logo" 
          style={{ width: 100, height: 100 }} 
          className="justify-content-center"
        />
      </div>  
      <div className="form-group d-flex flex-column align-items-center">
    <label htmlFor="username" className="form-label">Usuario</label>
      <div className="input-group mb-3 w-100 justify-content-center">
    <div className="input-group-prepend">
      <span className="input-group-text">
        <i className="fa fa-user"></i>
      </span>
    </div>
    <input
      type="text"
      className="form-control border border-black border-2"
      id="username"
      placeholder="correo@micorreo.com"
      value={username}
      onChange={(e) => setUsername(e.target.value)}
    />
    </div>
    </div>

    <div className="form-group d-flex flex-column align-items-center">
     <label htmlFor="password" className="form-label">Contraseña</label>
      <div className="input-group mb-3 w-100 justify-content-center">
      <div className="input-group-prepend">
      <span className="input-group-text">
        <i className="fa fa-lock"></i>
      </span>
    </div>
    <input
      type="password"
      className="form-control border border-black border-2"
      id="password"
      placeholder="Ingrese la contraseña"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
    />
    </div>
    </div>

      {error && <div className="text-danger mb-3">{error}</div>}
      <div className="my-3 text-center link-tex " >
        <a href="#!"> ¿Ha olvidado su contraseña?</a>
      </div>
      <div className="btn-group w-100">
      <button 
       type="submit" 
      className="btn w-100" 
      style={{ backgroundColor: '#cc4123', color: 'white' }}>
    Ingresar
    </button>
      </div>

    </form>
    </div>
    </div>

      <article className="col-sm-12 col-md-6">
        <div className="d-flex justify-content-center align-items-center h-100">
          <img src="../src/assets/login.jpg" alt="food-in-production" width="800" height="800" className="rounded"/>
        </div>
      </article>
    </div>
  );
}
