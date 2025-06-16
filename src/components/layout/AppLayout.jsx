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
import { Outlet, useNavigate } from "react-router-dom";
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

const { Header, Sider, Content } = Layout;

// --- Constantes de estilo ---
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
  const [collapsed, setCollapsed] = useState(false);
  const { user, logOut, loading: authLoading, initialAuthCheckComplete } = useAuth();
  const navigate = useNavigate();

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // --- LÓGICA DE VISUALIZACIÓN POR ROL ---
  // El rol con idRole 3 es el Cocinero
  const isCocineroRole = user?.idRole === 3;

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

  if (authLoading && !initialAuthCheckComplete) {
      return (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: CONTENT_BACKGROUND_LIGHT }}>
              <Spinner color="primary" style={{ width: '3rem', height: '3rem' }} />
          </div>
      );
  }

  if (!user && initialAuthCheckComplete) {
    return <div style={{ padding: '20px', textAlign:'center' }}>Error de autenticación. Redirigiendo...</div>;
  }

  // --- RENDERIZADO CONDICIONAL DEL LAYOUT ---

  // Layout Simplificado para el Cocinero (Rol 3)
  if (isCocineroRole) {
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
                <Header
                    style={{
                        padding: 0, backgroundColor: NEW_HEADER_WHITE_BACKGROUND,
                        borderBottom: `2px solid ${ACCENT_COLOR}`, height: `${HEADER_HEIGHT}px`,
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        position: "fixed", top: 0, width: '100%', zIndex: 10,
                    }}
                >
                    <div style={{ paddingLeft: "24px" }}>
                        <span style={{ color: HEADER_TEXT_COLOR, fontWeight: 500, fontSize: '1.2rem' }}>
                            Órdenes de Producción
                        </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", paddingRight: "24px" }}>
                        <Dropdown menu={{ items: userMenuDropdownItems, onClick: handleMenuClick }} trigger={["click"]}>
                            <a href="#!" onClick={(e) => e.preventDefault()} style={{ cursor: "pointer" }}>
                                <Space size="small">
                                    <Avatar size={32} icon={<UserIconLucide size={18} />} style={{ backgroundColor: ACCENT_COLOR }} />
                                    <span style={{ color: HEADER_TEXT_COLOR, fontWeight: 500 }}>
                                        {user.full_name || "Cocinero"}
                                    </span>
                                </Space>
                            </a>
                        </Dropdown>
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
        </>
    );
  }

  // Layout Completo para todos los demás roles
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

        <Layout className="site-layout" style={{ minHeight: "100vh", marginLeft: collapsed ? SIDER_WIDTH_COLLAPSED : SIDER_WIDTH_EXPANDED, transition: "margin-left 0.2s" }}>
            <Header
                style={{
                    padding: 0, backgroundColor: NEW_HEADER_WHITE_BACKGROUND,
                    borderBottom: `2px solid ${ACCENT_COLOR}`, height: `${HEADER_HEIGHT}px`,
                    lineHeight: `${HEADER_HEIGHT}px`, display: "flex", alignItems: "center",
                    justifyContent: "space-between", position: "fixed", top: 0,
                    left: collapsed ? SIDER_WIDTH_COLLAPSED : SIDER_WIDTH_EXPANDED,
                    width: `calc(100% - ${collapsed ? SIDER_WIDTH_COLLAPSED : SIDER_WIDTH_EXPANDED}px)`,
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
                    {authLoading ? (
                        <Space><Spinner size="sm" /><Avatar size={32} icon={<UserIconLucide size={18} />} style={{ backgroundColor: '#ccc' }} /></Space>
                    ) : user ? (
                        <Dropdown menu={{ items: userMenuDropdownItems, onClick: handleMenuClick }} trigger={["click"]}>
                            <a href="#!" onClick={(e) => e.preventDefault()} style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", height: "100%" }}>
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