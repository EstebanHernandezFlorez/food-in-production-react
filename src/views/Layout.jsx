import { useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { Layout, Button, Menu } from "antd";
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  UserOutlined,
} from "@ant-design/icons";
import "primereact/resources/themes/lara-light-indigo/theme.css"; // Theme
import "primereact/resources/primereact.min.css"; // Core CSS
import "primeicons/primeicons.css"; // PrimeIcons

// Importaciones correctas de los componentes del menú
import MenuList from "../components/layout/MenuList";
import Logo from "../components/layout/Logo";
import { NavDropdown } from "react-bootstrap";

const { Header, Sider, Content } = Layout;

export function AppLayout() {
  const [darkTheme, setDarkTheme] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const toggleTheme = () => {
    setDarkTheme(!darkTheme);
  };

  const handleEditProfile = () => {
    navigate("/editar-perfil");
  };

  const menu = (
    <Menu>
      <Menu.Item key="1" onClick={handleEditProfile}>
        Editar Perfil
      </Menu.Item>
      {/* Puedes agregar más opciones aquí si lo deseas */}
    </Menu>
  );

  return (
    <Layout>
      <Sider
        className="sidebar"
        collapsible
        trigger={null}
        collapsed={collapsed}
        onCollapse={() => setCollapsed(!collapsed)}
        style={{ backgroundColor: "#fff" }} // Fondo blanco en el Sider
      >
        <Logo collapsed={collapsed} />
        <MenuList />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: "3px",
            borderBottom: "5px solid #800020",
            position: "fixed",
            width: "100%", // Remove dynamic width calculation
            zIndex: 1000,
            backgroundColor: "#fff",
          }}
          className="header"
        >
          <div
            className="d-flex justify-content-between align-items-center"
            style={{ height: "100%" }}
          >
            <Button
              className="buttonInt"
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: collapsed ? "16px" : "24px",
                transition: "font-size 0.3s",
                color: "#000", // Texto negro en el Button
              }}
            />
            <div style={{ position: "absolute", right: "18%", zIndex: 2000 }}>
              <NavDropdown
                title={
                  <span>
                    <UserOutlined
                      style={{ marginRight: "8px", fontSize: "20px" }}
                    />
                    Lina Marcela - Admin
                  </span>
                }
                id="nav-dropdown"
              >
                <NavDropdown.Item href="#action1">Perfil</NavDropdown.Item>
                <NavDropdown.Item href="#action2">
                  Cerrar Sesión
                </NavDropdown.Item>
              </NavDropdown>
            </div>
          </div>
        </Header>

        <Content
          style={{
            padding: "80px 24px 24px",
            minHeight: "100vh",
            backgroundColor: "#fff",
            transition: "margin-left 0.3s", // Smooth transition for margin
          }}
        >
          <Outlet /> {/* Renderiza las rutas hijas aquí */}
        </Content>
      </Layout>
    </Layout>
  );
}
