// src/components/layout/AppLayout.jsx
import React, { useState, useEffect } from "react";
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
import { Outlet, useNavigate, useLocation } from "react-router-dom";
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
// ELIMINAR LA SIGUIENTE LÍNEA:
// import { ActiveOrdersProvider } from '../../views/module/OrdenProduccion/ActiveOrdersContext';

const { Header, Sider, Content } = Layout;

// --- Constantes de estilo (sin cambios) ---
const SIDER_WIDTH_EXPANDED = 260;
const SIDER_WIDTH_COLLAPSED = 80;
const HEADER_HEIGHT = 64;
const PRIMARY_SIDER_BACKGROUND = "#d0b88e";
const ACCENT_COLOR = "#9e3535";
const BORDER_COLOR_DARKER_BEIGE_SIDER = "#b8a078";
const CONTENT_BACKGROUND_LIGHT = "#F5F1E6";
const HEADER_TEXT_COLOR = "#4A3B2A";
const SIDER_DEFINED_SHADOW = `2px 0px 6px -1px rgba(74, 59, 42, 0.22)`;
const SIDER_TOP_HIGHLIGHT_BORDER_COLOR = `rgba(255, 255, 255, 0.35)`;
const NEW_HEADER_WHITE_BACKGROUND = "#FFFFFF";


const AppLayout = () => {
  console.log("[AppLayout] Componente AppLayout renderizando/re-renderizando.");

  const [collapsed, setCollapsed] = useState(false);
  const { user, logOut, loading: authLoading, initialAuthCheckComplete } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSiderActuallyVisible, setIsSiderActuallyVisible] = useState(true);

  useEffect(() => {
    if (!initialAuthCheckComplete) return;

    if (!user || !user.role) {
        console.log("[AppLayout SiderVis] Usuario o rol no definido. Sider visible por defecto.");
        setIsSiderActuallyVisible(true);
        return;
    }

    const roleName = user.role.roleName;
    console.log("[AppLayout SiderVis] user roleName:", roleName, "pathname:", location.pathname);

    const isCocinero = roleName && roleName.toLowerCase() === "cocinero";
    const produccionPageBase = "/home/produccion/orden-produccion";
    const currentPathIsProductionRelated = location.pathname.startsWith(produccionPageBase);

    if (isCocinero && currentPathIsProductionRelated) {
      console.log("[AppLayout SiderVis] Cocinero en ruta de producción. Ocultando Sider.");
      setIsSiderActuallyVisible(false);
      if (!collapsed) setCollapsed(true);
    } else {
      console.log("[AppLayout SiderVis] No es Cocinero en ruta de producción relevante o rol no cocinero. Mostrando Sider.");
      setIsSiderActuallyVisible(true);
    }
  // Quité 'collapsed' de las dependencias para evitar posibles bucles si setCollapsed se llama dentro.
  // El colapso del sider debería ser principalmente una interacción del usuario o una consecuencia de ocultar el sider.
  }, [user, location.pathname, initialAuthCheckComplete, ]);


  const handleMenuClick = ({ key }) => {
    if (key === "profile") {
      navigate("/home/profile");
    } else if (key === "logout") {
      setIsLogoutModalOpen(true);
    }
  };

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logOut();
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

  const currentSiderEffectiveWidth = isSiderActuallyVisible
    ? (collapsed ? SIDER_WIDTH_COLLAPSED : SIDER_WIDTH_EXPANDED)
    : 0;

  if (authLoading && !initialAuthCheckComplete) {
      console.log("[AppLayout] AuthProvider está cargando (chequeo inicial). Mostrando loader de AppLayout.");
      return (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: CONTENT_BACKGROUND_LIGHT }}>
              <Spinner color="primary" style={{ width: '3rem', height: '3rem' }} />
          </div>
      );
  }

  if (!user && initialAuthCheckComplete) {
    console.log("[AppLayout] Chequeo de auth completo, pero no hay usuario. No debería renderizar AppLayout.");
    // navigate("/login", { replace: true }); // Podrías hacer esto aquí si ProtectedRoute no lo maneja
    return <div style={{ padding: '20px', textAlign:'center' }}>Error de autenticación. Redirigiendo...</div>;
  }


  // NO HAY <ActiveOrdersProvider> AQUÍ
  return (
    <>
      <Modal isOpen={isLogoutModalOpen} toggle={() => !isLoggingOut && setIsLogoutModalOpen(false)} centered backdrop="static" keyboard={!isLoggingOut}>
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
        {isSiderActuallyVisible && (
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
              className="sidebar"
            >
              <Logo collapsed={collapsed} backgroundColor={PRIMARY_SIDER_BACKGROUND} />
              <MenuList collapsed={collapsed} />
            </Sider>
        )}

        <Layout className="site-layout" style={{ minHeight: "100vh", marginLeft: currentSiderEffectiveWidth, transition: "margin-left 0.2s" }}>
          <Header
            style={{
              padding: 0, backgroundColor: NEW_HEADER_WHITE_BACKGROUND,
              borderBottom: `2px solid ${ACCENT_COLOR}`, height: `${HEADER_HEIGHT}px`,
              lineHeight: `${HEADER_HEIGHT}px`, display: "flex", alignItems: "center",
              justifyContent: "space-between", position: "fixed", top: 0,
              left: currentSiderEffectiveWidth,
              width: `calc(100% - ${currentSiderEffectiveWidth}px)`,
              zIndex: 10, transition: "left 0.2s, width 0.2s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", height: "100%", paddingLeft: "16px" }}>
              {isSiderActuallyVisible && (
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
              )}
              {!isSiderActuallyVisible && user?.role?.roleName?.toLowerCase() === "cocinero" && (
                 <span style={{ color: HEADER_TEXT_COLOR, fontWeight: 500, fontSize: '1.1rem', marginLeft: '16px' }}>
                    Órdenes de Producción
                 </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", paddingRight: "24px", height: "100%" }}>
              {authLoading ? (
                  <Space><Spinner size="sm" /><Avatar size={32} icon={<UserIconLucide size={18} />} style={{ backgroundColor: '#ccc' }} /></Space>
              ) : user ? (
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
              ) : (
                <Space><Avatar size={32} icon={<UserIconLucide size={18} />} style={{ backgroundColor: '#ccc' }} /></Space>
              )}
            </div>
          </Header>

          <Content
            style={{
              padding: 24, minHeight: 280, backgroundColor: CONTENT_BACKGROUND_LIGHT,
              marginTop: `${HEADER_HEIGHT}px`,
            }}
            className="main-content-area-with-scrollbar"
          >
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </>
  );
};

export default AppLayout;