// components/layout/AppLayout.js
import React, { useState } from "react"; // Importa React si no estaba
import { Layout, Button } from "antd";
import { PanelLeftClose, PanelRightClose } from "lucide-react";
import Logo from "./Logo"; // Asegúrate que la ruta es correcta
import MenuList from "./MenuList"; // Asegúrate que la ruta es correcta
import "../../layout.css"; // Asegúrate que este archivo existe y la ruta es correcta
import { Outlet } from "react-router-dom"; // <-- ¡IMPORTANTE!

const { Header, Sider, Content } = Layout;

// --- CONSTANTES ---
const SIDER_WIDTH_EXPANDED = 320;
const SIDER_WIDTH_COLLAPSED = 80;
const SIDEBAR_BACKGROUND_COLOR = "#FFF1E6";
const BORDER_COLOR = "#E0C8B8";
const SIDER_TEXT_COLOR = "#5C4033";

const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* === SIDERA (BARRA LATERAL) === */}
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
        {/* Pasa las props necesarias a MenuList */}
        <MenuList
          collapsed={collapsed}
          backgroundColor={SIDEBAR_BACKGROUND_COLOR}
          textColor={SIDER_TEXT_COLOR}
        />
      </Sider>

      {/* === LAYOUT PRINCIPAL (Header y Content) === */}
      <Layout
        className="site-layout"
        style={{
          marginLeft: collapsed ? SIDER_WIDTH_COLLAPSED : SIDER_WIDTH_EXPANDED,
          transition: "margin-left 0.2s",
          minHeight: "100vh",
          backgroundColor: "#FFFFFF",
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
            display: "flex",
            alignItems: "center",
          }}
        >
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
              width: 64,
              height: 64,
              color: SIDER_TEXT_COLOR,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
          />
          {/* Otros elementos del Header aquí (ej: User profile, notifications) */}
        </Header>

        {/* === CONTENT (Contenido principal de la página) === */}
        <Content
          style={{
            margin: "24px 16px", // Espaciado alrededor del contenido
            padding: 24, // Espaciado interno del contenido
            minHeight: 280, // Altura mínima ejemplo
            // backgroundColor: '#fff', // Fondo del área de contenido si es diferente
          }}
        >
          {/* --- ¡¡AQUÍ SE RENDERIZAN LAS RUTAS HIJAS!! --- */}
          <Outlet />
        </Content>
        {/* Puedes añadir un Footer aquí si lo necesitas */}
        {/* <Footer style={{ textAlign: 'center' }}>Mi App ©2023</Footer> */}
      </Layout>
    </Layout>
  );
};

export default AppLayout;