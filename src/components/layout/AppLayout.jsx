// src/components/layout/AppLayout.jsx
import React, { useState } from "react";
import {
  Layout,
  Button as AntButton,
  Dropdown,
  Avatar,
  Space,
} from "antd";
import {
  PanelLeftClose,
  PanelRightClose,
  User as UserIconLucide,
  LogOut as LogOutIconLucide,
  AlertTriangle,
} from "lucide-react";
import { Outlet, useNavigate, Routes, Route, Navigate } from "react-router-dom"; // Importa Routes, Route, Navigate
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Spinner,
} from "reactstrap";
import { useAuth } from "../../views/hooks/AuthProvider";
import Logo from "./Logo";
import MenuList from "./MenuList";
import "../../assets/css/layout.css";

// Importa la configuración de rutas y la función para generarlas
import pagesRoutesConfig from "../../views/module/pages.routes"; // TU configuración de rutas
import UserProfile from "../../views/module/Auth/UserProfile"; // Importa las vistas adicionales aquí si solo se usan en AppLayout
import TablaGastos from "../../views/module/ManoDeObra/TablaGastos";
import RendimientoEmpleado from "../../views/module/ManoDeObra/RendimientoEmpleado";
import RegistroCompra from "../../views/module/Compras/RegistroComprasPage";
import FichaTecnica from "../../views/module/ProductoInsumo/FichaTecnica";
import ListaFichasTecnicas from "../../views/module/ProductoInsumo/ListaFichasTecnicas";


const { Header, Sider, Content } = Layout;

// --- Constantes de estilo ---
const SIDER_WIDTH_EXPANDED = 260;
const SIDER_WIDTH_COLLAPSED = 80;
const HEADER_HEIGHT = 64;
const PRIMARY_SIDER_BACKGROUND = "#d0b88e";
const ACCENT_COLOR = "#9e3535";
// const TEXT_ON_ACCENT_BG = "#FFFFFF"; // No parece usarse activamente
const BORDER_COLOR_DARKER_BEIGE_SIDER = "#b8a078";
const CONTENT_BACKGROUND_LIGHT = "#F5F1E6";
const HEADER_TEXT_COLOR = "#4A3B2A";
const SIDER_DEFINED_SHADOW = `2px 0px 6px -1px rgba(74, 59, 42, 0.22)`;
const SIDER_TOP_HIGHLIGHT_BORDER_COLOR = `rgba(255, 255, 255, 0.35)`;
const NEW_HEADER_WHITE_BACKGROUND = "#FFFFFF";
// --- Fin Constantes de estilo ---

// Función para generar rutas anidadas (movida o importada aquí si es específica de AppLayout)
const generateAppRoutes = (routesArray) => {
  if (!Array.isArray(routesArray)) return null;
  return routesArray.map((routeConfig) => {
    if (!routeConfig.path) {
      console.warn("[AppLayout generateAppRoutes] Route config is missing a path:", routeConfig);
      return null;
    }
    const elementToRender = routeConfig.element || (routeConfig.children && routeConfig.children.length > 0 ? <Outlet /> : <div>Elemento no definido para {routeConfig.path}</div>);

    if (routeConfig.children && routeConfig.children.length > 0) {
      return (
        <Route key={routeConfig.path} path={routeConfig.path} element={elementToRender}>
          {routeConfig.indexElement && <Route index element={routeConfig.indexElement} />}
          {generateAppRoutes(routeConfig.children)}
        </Route>
      );
    }
    return (
      <Route key={routeConfig.path} path={routeConfig.path} element={elementToRender} />
    );
  }).filter(route => route !== null);
};


const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logOut, loading } = useAuth();
  const navigate = useNavigate();

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleMenuClick = ({ key }) => {
    if (key === "profile") {
      navigate("/home/profile"); // Navegación relativa a /home
    } else if (key === "logout") {
      setIsLogoutModalOpen(true);
    }
  };

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logOut();
      // Navegación a /login es manejada por AuthProvider o PrivateRoute
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    } finally {
      setIsLoggingOut(false);
      setIsLogoutModalOpen(false);
    }
  };

  const userMenuDropdownItems = [
    { key: "profile", icon: <UserIconLucide size={16} />, label: <span>Mi Perfil</span> },
    { key: "logout", icon: <LogOutIconLucide size={16} />, label: <span>Cerrar Sesión</span>, danger: true },
  ];

  const currentSiderWidth = collapsed ? SIDER_WIDTH_COLLAPSED : SIDER_WIDTH_EXPANDED;

  return (
    <>
      <Modal isOpen={isLogoutModalOpen} toggle={() => setIsLogoutModalOpen(false)} centered backdrop="static" keyboard={!isLoggingOut}>
        <ModalHeader toggle={!isLoggingOut ? () => setIsLogoutModalOpen(false) : undefined}>
          <div className="d-flex align-items-center">
            <AlertTriangle size={24} className="text-danger me-2" />
            <span className="fw-bold">Confirmar cierre de sesión</span>
          </div>
        </ModalHeader>
        <ModalBody>¿Estás seguro de que deseas cerrar sesión?</ModalBody>
        <ModalFooter>
          <Button color="secondary" outline onClick={() => setIsLogoutModalOpen(false)} disabled={isLoggingOut}>Cancelar</Button>
          <Button color="danger" onClick={confirmLogout} disabled={isLoggingOut}>
            {isLoggingOut ? (<><Spinner size="sm" /> Cerrando...</>) : ("Cerrar sesión")}
          </Button>
        </ModalFooter>
      </Modal>

      <Layout style={{ minHeight: "100vh" }}>
        <Sider
          collapsible trigger={null} collapsed={collapsed}
          width={SIDER_WIDTH_EXPANDED} collapsedWidth={SIDER_WIDTH_COLLAPSED}
          theme="light"
          style={{
            overflow: "auto", height: "100vh", position: "fixed", left: 0, top: 0, bottom: 0,
            background: PRIMARY_SIDER_BACKGROUND,
            borderTop: `1px solid ${SIDER_TOP_HIGHLIGHT_BORDER_COLOR}`,
            borderRight: `1px solid ${BORDER_COLOR_DARKER_BEIGE_SIDER}`,
            boxShadow: SIDER_DEFINED_SHADOW, zIndex: 20,
          }}
        >
          <Logo collapsed={collapsed} backgroundColor={PRIMARY_SIDER_BACKGROUND} />
          <MenuList collapsed={collapsed} />
        </Sider>

        <Layout className="site-layout" style={{ minHeight: "100vh", marginLeft: currentSiderWidth, transition: "margin-left 0.2s" }}>
          <Header
            style={{
              padding: 0, backgroundColor: NEW_HEADER_WHITE_BACKGROUND,
              borderBottom: `2px solid ${ACCENT_COLOR}`, height: `${HEADER_HEIGHT}px`,
              lineHeight: `${HEADER_HEIGHT}px`, display: "flex", alignItems: "center",
              justifyContent: "space-between", position: "fixed", top: 0,
              // Ajuste: el header no debe solapar el Sider, empieza después de él
              left: currentSiderWidth, // Posición inicial del header
              width: `calc(100% - ${currentSiderWidth}px)`, // Ancho dinámico
              zIndex: 10, transition: "left 0.2s, width 0.2s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", height: "100%", paddingLeft: "16px" }}>
              <AntButton
                type="text"
                icon={collapsed ? <PanelRightClose size={18} /> : <PanelLeftClose size={18} />}
                onClick={() => setCollapsed(!collapsed)}
                style={{
                  padding: "0", width: "48px", height: "100%", color: HEADER_TEXT_COLOR,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: "none", borderRadius: 0, fontSize: "18px",
                }}
                aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", paddingRight: "24px", height: "100%" }}>
              {!loading && user ? (
                <Dropdown menu={{ items: userMenuDropdownItems, onClick: handleMenuClick }} trigger={["click"]}>
                  <a onClick={(e) => e.preventDefault()} style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", height: "100%" }}>
                    <Space size="small">
                      <Avatar size={32} icon={<UserIconLucide size={18} />} style={{ backgroundColor: ACCENT_COLOR, flexShrink: 0 }} />
                      <span style={{ color: HEADER_TEXT_COLOR, fontWeight: 500, display: "inline-block", maxWidth: "150px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", verticalAlign: "middle" }}>
                        {user.full_name || "Usuario"}
                      </span>
                    </Space>
                  </a>
                </Dropdown>
              ) : (<Space><Avatar size={32} icon={<UserIconLucide size={18} />} style={{ backgroundColor: '#ccc' }} /></Space>)}
            </div>
          </Header>

          <Content
            style={{
              padding: 24, minHeight: 280, backgroundColor: CONTENT_BACKGROUND_LIGHT,
              marginTop: `${HEADER_HEIGHT}px`, // marginLeft ya está en el Layout padre
              // marginLeft: currentSiderWidth, // No es necesario aquí si el Layout padre lo maneja
              // transition: "margin-left 0.2s ease-in-out", // Ya en el Layout padre
            }}
          >
            {/* El <Outlet /> aquí es donde se renderizarán las rutas hijas definidas en App.jsx para /home/* */}
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </>
  );
};

export default AppLayout;