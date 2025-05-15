// src/components/layout/AppLayout.jsx
import React, { useState } from "react";
import {
  Layout,
  Button as AntButton,
  Dropdown,
  // Menu, // Menu component might not be needed directly here anymore
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
import MenuList from "./MenuList"; // Your updated MenuList
import "../../assets/css/layout.css";

const { Header, Sider, Content } = Layout;

// --- Constantes de estilo (sin cambios) ---
// ... (keep your style constants) ...
const SIDER_WIDTH_EXPANDED = 260;
const SIDER_WIDTH_COLLAPSED = 80;
const HEADER_HEIGHT = 64;
const PRIMARY_SIDER_BACKGROUND = "#d0b88e";
const ACCENT_COLOR = "#9e3535";
const TEXT_ON_ACCENT_BG = "#FFFFFF";
const BORDER_COLOR_DARKER_BEIGE_SIDER = "#b8a078";
const CONTENT_BACKGROUND_LIGHT = "#F5F1E6";
const HEADER_TEXT_COLOR = "#4A3B2A";
const SIDER_DEFINED_SHADOW = `2px 0px 6px -1px rgba(74, 59, 42, 0.22)`;
const SIDER_TOP_HIGHLIGHT_BORDER_COLOR = `rgba(255, 255, 255, 0.35)`;
const NEW_HEADER_WHITE_BACKGROUND = "#FFFFFF";
// --- Fin Constantes de estilo ---


const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logOut, loading } = useAuth();
  const navigate = useNavigate();

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // --- MODIFIED: Define the handler directly ---
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

  // --- MODIFIED: Define the items array directly ---
  const userMenuDropdownItems = [
    {
      key: "profile",
      icon: <UserIconLucide size={16} /* style={{ color: TEXT_ON_ACCENT_BG }} */ />, // Style might be applied by Dropdown/Menu theme now
      label: <span /* style={{ color: TEXT_ON_ACCENT_BG }} */ >Mi Perfil</span>,
    },
    {
      key: "logout",
      icon: <LogOutIconLucide size={16} /* style={{ color: TEXT_ON_ACCENT_BG }} */ />,
      label: (
        <span /* style={{ color: TEXT_ON_ACCENT_BG }} */ >Cerrar Sesión</span>
      ),
      danger: true,
    },
  ];

  // --- REMOVED: The old userMenu variable is no longer needed ---
  // const userMenu = (
  //   <Menu
  //     onClick={handleMenuClick}
  //     items={userMenuDropdownItems}
  //     style={{
  //       backgroundColor: ACCENT_COLOR,
  //       border: `1px solid ${ACCENT_COLOR}`,
  //     }}
  //     className="user-dropdown-menu-custom" // You might need to style the dropdown differently now
  //   />
  // );

  const currentSiderWidth = collapsed
    ? SIDER_WIDTH_COLLAPSED
    : SIDER_WIDTH_EXPANDED;

  return (
    <>
      {/* --- Modal (sin cambios) --- */}
      <Modal
        isOpen={isLogoutModalOpen}
        toggle={() => setIsLogoutModalOpen(false)}
        centered
        backdrop="static"
        keyboard={!isLoggingOut}
      >
         {/* ... Modal content ... */}
         <ModalHeader toggle={!isLoggingOut ? () => setIsLogoutModalOpen(false) : undefined}>
          <div className="d-flex align-items-center">
            <AlertTriangle size={24} className="text-danger me-2" />
            <span className="fw-bold">Confirmar cierre de sesión</span>
          </div>
        </ModalHeader>
        <ModalBody>
          ¿Estás seguro de que deseas cerrar sesión?
        </ModalBody>
        <ModalFooter>
          <Button
            color="secondary"
            outline
            onClick={() => setIsLogoutModalOpen(false)}
            disabled={isLoggingOut}
          >
            Cancelar
          </Button>
          <Button color="danger" onClick={confirmLogout} disabled={isLoggingOut}>
            {isLoggingOut ? (
              <>
                <Spinner size="sm" /> Cerrando sesión...
              </>
            ) : (
              "Cerrar sesión"
            )}
          </Button>
        </ModalFooter>
      </Modal>

      {/* --- Layout Principal --- */}
      <Layout style={{ minHeight: "100vh" }}>
        {/* --- Sider (sin cambios - using your updated MenuList) --- */}
        <Sider
          collapsible
          trigger={null}
          collapsed={collapsed}
          width={SIDER_WIDTH_EXPANDED}
          collapsedWidth={SIDER_WIDTH_COLLAPSED}
          theme="light"
          style={{
             // ... Sider styles ...
             overflow: "auto",
             height: "100vh",
             position: "fixed",
             left: 0,
             top: 0,
             bottom: 0,
             background: PRIMARY_SIDER_BACKGROUND,
             borderTop: `1px solid ${SIDER_TOP_HIGHLIGHT_BORDER_COLOR}`,
             borderRight: `1px solid ${BORDER_COLOR_DARKER_BEIGE_SIDER}`,
             boxShadow: SIDER_DEFINED_SHADOW,
             zIndex: 20,
          }}
        >
          <Logo collapsed={collapsed} backgroundColor={PRIMARY_SIDER_BACKGROUND} />
          {/* Uses the updated MenuList */}
          <MenuList collapsed={collapsed} />
        </Sider>

        <Layout className="site-layout" style={{ minHeight: "100vh" }}>
           {/* --- Header --- */}
          <Header
            style={{
                // ... Header styles ...
                padding: 0,
                backgroundColor: NEW_HEADER_WHITE_BACKGROUND,
                borderBottom: `2px solid ${ACCENT_COLOR}`,
                height: `${HEADER_HEIGHT}px`,
                lineHeight: `${HEADER_HEIGHT}px`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                zIndex: 10,
            }}
          >
            {/* Botón Colapsar/Expandir (sin cambios) */}
            <div
              style={{
                  // ... styles ...
                  display: "flex",
                  alignItems: "center",
                  height: "100%",
                  paddingLeft: currentSiderWidth + 16 + "px",
                  transition: "padding-left 0.2s",
              }}
            >
              <AntButton
                type="text"
                icon={ collapsed ? <PanelRightClose size={18} /> : <PanelLeftClose size={18} />}
                onClick={() => setCollapsed(!collapsed)}
                style={{
                    // ... button styles ...
                    padding: "0",
                    width: "48px",
                    height: "100%",
                    color: HEADER_TEXT_COLOR,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "none",
                    borderRadius: 0,
                    fontSize: "18px",
                }}
                aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
              />
            </div>

            {/* Menú de Usuario (Dropdown MODIFICADO) */}
            <div
              style={{
                  // ... styles ...
                  display: "flex",
                  alignItems: "center",
                  paddingRight: "24px",
                  height: "100%",
              }}
            >
              {!loading && user ? (
                // --- MODIFIED: Use 'menu' prop instead of 'overlay' ---
                <Dropdown
                   menu={{ // Pass configuration object
                       items: userMenuDropdownItems, // The array of items
                       onClick: handleMenuClick, // The click handler
                       // Add other Menu props here if needed (like style, className)
                       // style: { backgroundColor: ACCENT_COLOR /* ... */ }, // Example
                       // className: 'user-dropdown-menu-custom' // Example
                   }}
                   trigger={["click"]}
                   // --- Optional: Add dropdownRender prop for more complex customization if needed ---
                   // dropdownRender={(menu) => (
                   //   <div style={{ backgroundColor: ACCENT_COLOR, boxShadow: '...', borderRadius: '...' }}>
                   //     {React.cloneElement(menu, { style: { color: TEXT_ON_ACCENT_BG }})}
                   //   </div>
                   // )}
                >
                  {/* The trigger element remains the same */}
                  <a
                    onClick={(e) => e.preventDefault()}
                    style={{
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      height: "100%",
                    }}
                  >
                    <Space size="small">
                      <Avatar
                        size={32}
                        icon={<UserIconLucide size={18} />}
                        style={{ backgroundColor: ACCENT_COLOR, flexShrink: 0 }}
                      />
                      <span
                        style={{
                            // ... span styles ...
                            color: HEADER_TEXT_COLOR,
                            fontWeight: 500,
                            display: "inline-block",
                            maxWidth: "150px",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            verticalAlign: "middle",
                        }}
                      >
                        {user.full_name || "Usuario"}
                      </span>
                    </Space>
                  </a>
                </Dropdown>
              ) : (
                // Placeholder (sin cambios)
                <Space>
                  <Avatar
                    size={32}
                    icon={<UserIconLucide size={18} />}
                    style={{ backgroundColor: '#ccc' }}
                  />
                </Space>
              )}
            </div>
          </Header>

          {/* --- Content (sin cambios) --- */}
          <Content
            style={{
                // ... Content styles ...
                padding: 24,
                minHeight: 280,
                backgroundColor: CONTENT_BACKGROUND_LIGHT,
                marginTop: `${HEADER_HEIGHT}px`,
                marginLeft: currentSiderWidth,
                transition: "margin-left 0.2s ease-in-out",
            }}
          >
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </>
  );
};

export default AppLayout;