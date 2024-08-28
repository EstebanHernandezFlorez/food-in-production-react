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
import RecoveryPassword from './views/module/Auth/olvidoContraseña'; // Nombre 
import {NavDropdown,Nav} from 'react-bootstrap';




const users = [
  {
    id: 1,
    usuario: "Carla Gomez",
    contrasena: "12345",
    rol: "auxiliar de cocina"
  },
  {
    id: 2,
    usuario: "Luis Gutierrez",
    contrasena: "12345",
    rol: "administrador"
  },
];

const { Header, Sider, Content } = Layout;

export default function App() {
  const handleSelectcted = (eventKey) => alert(`sele  const handleSelectcted ${eventKey}`);

  const [darkTheme, setDarkTheme] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const toggleTheme = () => {
    setDarkTheme(!darkTheme);
  };

  const openRecoverModal = (e) => {
    e.preventDefault();
    setIsRecoveryOpen(true);
  };
  
  const closeRecoverModal = () => {
    setIsRecoveryOpen(false);
  };
 
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login setIsAuthenticated={setIsAuthenticated} openRecoverModal={openRecoverModal} />} />
        
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
                <Header style={{ padding:'5px'}} className='header'>
                  <div className="d-flex justify-content-between align-items-center" style={{ height: '100%' }}>
                    <Button
                      className='buttonInt'
                      type='text'
                      icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                      onC lick={() => setCollapsed(!collapsed)}
                    />
                    <h1 style={{ margin: 0 }}>Food in Production</h1> 

                    <NavDropdown title={<span><UserOutlined style={{ marginRight: '8px' }} /> Cargar Nombre Usuario</span>} id="nav-dropdown">
                    <NavDropdown.Item href="#action1">Perfil</NavDropdown.Item>
                    </NavDropdown>

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

      {/* Modal de recuperación de contraseña */}
      <RecoveryPassword isOpen={isRecoveryOpen} onClose={closeRecoverModal} />
    </Router>
  );
}

function Login({ setIsAuthenticated, openRecoverModal }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    const validUser = users.find((user) => user.usuario === username && user.contrasena === password);
    
    if (validUser) {
      setError("");
      setIsAuthenticated(true);
      navigate("/dashboard");
    } else {
      setError("Usuario o contraseña incorrectos");
    }
  };

  return (
    <div className="row h-100 w-100">
      <div className="col-sm-12 col-md-6 d-flex justify-content-center align-items-center">
        <div className="d-flex justify-content-center align-items-center h-100 w-100 ">
          <form className="p-5 border border-black border border-2" onSubmit={handleSubmit}>
            <div className="d-flex justify-content-center">
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
                <div className="input-group-prepend"></div>
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
                <div className="input-group-prepend"></div>
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
            <div className="my-3 text-center link-text">
              <a href="#!" onClick={openRecoverModal}> ¿Ha olvidado su contraseña?</a>
            </div>
            <div className="btn-group w-100">
              <button 
                type="submit" 
                className="btn w-100" 
                style={{ backgroundColor: '#8C1616', color: 'white' }}>
                Ingresar
              </button>
            </div>
          </form>
        </div>
      </div>

      <article className="col-sm-12 col-md-6">
        <div className="d-flex justify-content-center align-items-center h-100">
          <img src="../src/assets/login.jpg" alt="food-in-production" width="790" height="734" className="rounded"/>
        </div>
      </article>
    </div>
  );
}
