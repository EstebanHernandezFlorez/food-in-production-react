// components/layout/AppLayout.js
import React, { useState } from "react";
import { Layout, Button, Dropdown, Menu, Avatar, Space } from "antd"; // <-- Añadido Dropdown, Menu, Avatar, Space
import {
  PanelLeftClose,
  PanelRightClose,
  User as UserIcon, // <-- Renombrado para evitar conflicto con variable user
  LogOut,
  // DownOutlined // Opcional: icono para el dropdown
} from "lucide-react";
import { UserOutlined } from '@ant-design/icons'; // <-- Icono de Ant Design para Avatar
import Logo from "./Logo";
import MenuList from "./MenuList";
import "../../layout.css";
import { Outlet, useNavigate } from "react-router-dom"; // <-- Añadido useNavigate
import { useAuth } from '../../views/hooks/AuthProvider'; // <-- Importa useAuth

const { Header, Sider, Content } = Layout;

// --- CONSTANTES ---
const SIDER_WIDTH_EXPANDED = 260;
const SIDER_WIDTH_COLLAPSED = 60;
const SIDEBAR_BACKGROUND_COLOR = "#FAF9F6";
const BORDER_COLOR = "#E6E4E0";
const SIDER_TEXT_COLOR = "#3F3A36";

const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logOut, loading } = useAuth(); // <-- Obtiene user, logOut y loading del contexto
  const navigate = useNavigate(); // <-- Hook para navegar

  // --- Definición del menú desplegable del usuario ---
  const handleMenuClick = ({ key }) => {
    if (key === 'profile') {
      // Navega a la página de perfil (asegúrate que esta ruta exista)
      navigate('/home/profile'); // <-- Define tu ruta de perfil
      console.log("Navegando a perfil...");
    } else if (key === 'logout') {
      // Llama a la función de logout del AuthProvider
      logOut();
      console.log("Cerrando sesión...");
    }
  };

  const menuItems = [
    {
      key: 'profile',
      icon: <UserIcon size={16} />, // Icono de Lucide
      label: 'Mi Perfil',
      // onClick se maneja en handleMenuClick basado en la 'key'
    },
    {
      key: 'logout',
      icon: <LogOut size={16} />, // Icono de Lucide
      label: 'Cerrar Sesión',
      danger: true, // Marca como acción peligrosa/destructiva (opcional)
      // onClick se maneja en handleMenuClick basado en la 'key'
    },
  ];

  // Construye el componente Menu una sola vez
  const userMenu = <Menu onClick={handleMenuClick} items={menuItems} />;
  // --------------------------------------------------

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* === SIDERA === */}
      <Sider
        theme="light"
        className="sidebar"
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
          backgroundColor: SIDEBAR_BACKGROUND_COLOR,
          borderRight: `1px solid ${BORDER_COLOR}`,
          zIndex: 10,
        }}
      >
        <Logo
          collapsed={collapsed}
          backgroundColor={SIDEBAR_BACKGROUND_COLOR}
        />
        <MenuList
          collapsed={collapsed}
          backgroundColor={SIDEBAR_BACKGROUND_COLOR}
          textColor={SIDER_TEXT_COLOR}
        />
      </Sider>

      {/* === LAYOUT PRINCIPAL === */}
      <Layout
        className="site-layout"
        style={{
          marginLeft: collapsed ? SIDER_WIDTH_COLLAPSED : SIDER_WIDTH_EXPANDED,
          transition: "margin-left 0.2s",
          minHeight: "100vh",
          backgroundColor: "#FFFFFF", // O el color de fondo que prefieras
        }}
      >
        {/* === HEADER === */}
        <Header
          className="site-layout-background header-sticky"
          style={{
            padding: "0 16px",
            backgroundColor: SIDEBAR_BACKGROUND_COLOR,
            borderBottom: `1px solid ${BORDER_COLOR}`,
            position: "sticky",
            top: 0,
            zIndex: 9,
            display: "flex",        // <-- Para alinear elementos
            alignItems: "center",   // <-- Centra verticalmente
            justifyContent: "space-between", // <-- Separa botón y user dropdown
          }}
        >
          {/* --- Botón de Colapso (Izquierda) --- */}
          <Button
            type="text"
            icon={
              collapsed ? (
                <PanelRightClose size={18} />
              ) : (
                <PanelLeftClose size={18} />
              )
            }
            onClick={() => setCollapsed(!collapsed)}
            style={{
              // Quitado width/height fijo para que se ajuste al contenido
              padding: '0 15px', // Añade algo de padding horizontal
              height: '100%', // Ocupa la altura del header
              color: SIDER_TEXT_COLOR,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: 'none', // Asegura que no tenga borde
              borderRadius: 0, // Opcional: quita borde redondeado si existe
            }}
            aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
          />

          {/* --- Dropdown de Usuario (Derecha) --- */}
          <div style={{ marginRight: '16px' }}> {/* Contenedor para margen */}
            {/* Muestra el dropdown solo si no está cargando y el usuario existe */}
            {!loading && user ? (
              <Dropdown overlay={userMenu} trigger={['click']}>
                {/* El 'a' es común para el trigger, previene comportamiento por defecto */}
                <a onClick={(e) => e.preventDefault()} style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
                  <Space> {/* Space para añadir espacio entre Avatar y nombre */}
                    <Avatar size="small" icon={<UserOutlined />} />
                    <span style={{ color: SIDER_TEXT_COLOR, fontWeight: 500 }}>
                      {/* Muestra nombre completo o 'Usuario' como fallback */}
                      {user.full_name || 'Usuario'}
                    </span>
                    {/* <DownOutlined style={{ fontSize: '12px', color: SIDER_TEXT_COLOR }} /> */}
                  </Space>
                </a>
              </Dropdown>
            ) : (
              // Opcional: Muestra algo mientras carga o si no hay usuario
              // Puedes poner un Skeleton.Avatar o simplemente null
              null
            )}
          </div>
          {/* -------------------------------------- */}

        </Header>

        {/* === CONTENT === */}
        <Content
          style={{
            margin: "24px 16px",
            padding: 24,
            minHeight: 280,
          }}
        >
          <Outlet /> {/* Renderiza la ruta hija activa */}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;