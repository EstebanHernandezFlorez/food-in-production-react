import React, { useState } from "react";
import { Layout, Button, Dropdown, Menu, Avatar, Space } from "antd";
import { PanelLeftClose, PanelRightClose, User as UserIcon, LogOut } from "lucide-react";
import { UserOutlined } from '@ant-design/icons';
import Logo from "./Logo"; // Asegúrate que la ruta sea correcta
import MenuList from "./MenuList"; // Asegúrate que la ruta sea correcta
import "../../assets/css/layout.css"; // Estilos generales del layout si los tienes
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from '../../views/hooks/AuthProvider'; // Verifica la ruta

const { Header, Sider, Content } = Layout;

// --- CONSTANTES - Opción 3: Gradiente Sutil ---
const SIDER_WIDTH_EXPANDED = 260;
const SIDER_WIDTH_COLLAPSED = 60;
// No definimos un color sólido para el Sider, usaremos el gradiente
const SIDER_GRADIENT = "linear-gradient(to bottom, #FAF9F6, #F0EBE0)"; // Gradiente para Sider
const BORDER_COLOR = "#E6E4E0"; // Borde estándar
const SIDER_TEXT_COLOR = "#5D4037"; // Marrón oscuro para texto/iconos base
const HEADER_BACKGROUND_COLOR = "#FAF9F6"; // Color superior del gradiente para Header
// ---------------------------------------------

const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logOut, loading } = useAuth();
  const navigate = useNavigate();

  const handleMenuClick = ({ key }) => {
    if (key === 'profile') {
      navigate('/home/profile'); // Ajusta tu ruta de perfil
    } else if (key === 'logout') {
      logOut();
    }
  };

  const menuItems = [
    { key: 'profile', icon: <UserIcon size={16} />, label: 'Mi Perfil' },
    { key: 'logout', icon: <LogOut size={16} />, label: 'Cerrar Sesión', danger: true },
  ];
  const userMenu = <Menu onClick={handleMenuClick} items={menuItems} />;

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* === SIDERA === */}
      <Sider
        className="sidebar" // Clase para estilos CSS (scrollbar, etc.)
        collapsible
        trigger={null}
        collapsed={collapsed}
        width={SIDER_WIDTH_EXPANDED}
        collapsedWidth={SIDER_WIDTH_COLLAPSED}
        style={{
          overflow: "auto",
          height: "100vh",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          // Aplicando el GRADIENTE como fondo
          background: SIDER_GRADIENT,
          borderRight: `1px solid ${BORDER_COLOR}`,
          zIndex: 10,
        }}
      >
        <Logo
          collapsed={collapsed}
          // El fondo del logo coincidirá con el del header (parte superior del gradiente)
          backgroundColor={HEADER_BACKGROUND_COLOR}
        />
        <MenuList
          collapsed={collapsed}
          // El menú será transparente para mostrar el gradiente
          textColor={SIDER_TEXT_COLOR} // Pasa el color base del texto
          // No necesita menuTheme="dark"
        />
      </Sider>

      {/* === LAYOUT PRINCIPAL === */}
      <Layout
        className="site-layout"
        style={{
          marginLeft: collapsed ? SIDER_WIDTH_COLLAPSED : SIDER_WIDTH_EXPANDED,
          transition: "margin-left 0.2s",
          minHeight: "100vh",
          backgroundColor: "#FFFFFF", // Fondo blanco para el área de contenido
        }}
      >
        {/* === HEADER === */}
        <Header
          className="site-layout-background header-sticky"
          style={{
            padding: "0 16px",
            backgroundColor: HEADER_BACKGROUND_COLOR, // Color sólido para header
            borderBottom: `1px solid ${BORDER_COLOR}`,
            position: "sticky",
            top: 0,
            zIndex: 9,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Botón Colapso */}
          <Button
            type="text"
            icon={ collapsed ? <PanelRightClose size={18} /> : <PanelLeftClose size={18} /> }
            onClick={() => setCollapsed(!collapsed)}
            style={{
              padding: '0 15px', height: '100%',
              color: SIDER_TEXT_COLOR, // Color de icono consistente con menú
              display: "flex", alignItems: "center", justifyContent: "center",
              border: 'none', borderRadius: 0,
            }}
            aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
          />

          {/* Dropdown Usuario */}
          <div style={{ marginRight: '16px' }}>
            {!loading && user ? (
              <Dropdown overlay={userMenu} trigger={['click']}>
                <a onClick={(e) => e.preventDefault()} style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
                  <Space>
                    <Avatar size="small" icon={<UserOutlined />} />
                    {/* Texto del usuario con el color base */}
                    <span style={{ color: SIDER_TEXT_COLOR, fontWeight: 500 }}>
                      {user.full_name || 'Usuario'}
                    </span>
                  </Space>
                </a>
              </Dropdown>
            ) : null}
          </div>
        </Header>

        {/* === CONTENT === */}
        <Content style={{ margin: "24px 16px", padding: 24, minHeight: 280, }} >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;