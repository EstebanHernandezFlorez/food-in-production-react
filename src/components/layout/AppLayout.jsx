// AppLayout.js
import  { useState } from "react";
import { Layout, Button } from "antd";
import { PanelLeftClose, PanelRightClose } from "lucide-react";
import Logo from "./Logo";
import MenuList from "./MenuList";
import "../../layout.css"; // Asegúrate que este archivo existe
import {Outlet} from "react-router-dom";

const { Header, Sider, Content } = Layout;

// --- CONSTANTES ACTUALIZADAS ---
const SIDER_WIDTH_EXPANDED = 320; // Mantenemos el ancho aumentado
const SIDER_WIDTH_COLLAPSED = 80;
const SIDEBAR_BACKGROUND_COLOR = "#FFF1E6"; // <-- ¡NUEVO COLOR DURAZNO!
const BORDER_COLOR = "#E0C8B8"; // <-- Borde ajustado para #FFF1E6 (un tono más oscuro)
// Color para texto/iconos que contrasten bien con #FFF1E6 y el hover vino tinto
const SIDER_TEXT_COLOR = "#5C4033"; // Marrón oscuro sigue siendo una buena opción

const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* === SIDERA (BARRA LATERAL) === */}
      <Sider
        theme="light" // Usamos 'light' para que nuestros CSS anulen más fácil
        className="sidebar"
        collapsible
        trigger={null} // Botón personalizado
        collapsed={collapsed}
        width={SIDER_WIDTH_EXPANDED}
        collapsedWidth={SIDER_WIDTH_COLLAPSED}
        style={{
          // --- ESTILOS CLAVE PARA SIDEBAR FIJO Y CON SCROLL INTERNO ---
          overflow: "auto", // <<< Importante: Habilita scroll SI el contenido (menú) es más alto que la pantalla
          height: "100vh", // <<< Ocupa toda la altura de la ventana
          position: "fixed", // <<< Fija el Sider en la pantalla
          left: 0,
          top: 0,
          bottom: 0,
          // --- FIN ESTILOS CLAVE ---
          backgroundColor: SIDEBAR_BACKGROUND_COLOR, // Nuevo color durazno
          borderRight: `1px solid ${BORDER_COLOR}`, // Borde actualizado
          zIndex: 10, // Asegura que esté por encima del contenido
        }}
      >
        {/* Pasamos el color explícito por si los componentes hijos lo necesitan */}
        <Logo
          collapsed={collapsed}
          backgroundColor={SIDEBAR_BACKGROUND_COLOR}
        />
        <MenuList
          collapsed={collapsed}
          backgroundColor={SIDEBAR_BACKGROUND_COLOR}
          textColor={SIDER_TEXT_COLOR} // Pasamos el color de texto base
        />
      </Sider>

      {/* === LAYOUT PRINCIPAL (Contiene Header y Content) === */}
      <Layout
        className="site-layout"
        style={{
          // --- AJUSTE CLAVE PARA EL ANCHO ---
          // El margen izquierdo DEBE coincidir con el ancho ACTUAL del Sider
          marginLeft: collapsed ? SIDER_WIDTH_COLLAPSED : SIDER_WIDTH_EXPANDED,
          // --- FIN AJUSTE CLAVE ---
          transition: "margin-left 0.2s", // Transición suave al colapsar/expandir
          minHeight: "100vh",
          backgroundColor: "#FFFFFF", // Fondo del área de contenido
        }}
      >
        {/* === HEADER === */}
        <Header
          className="site-layout-background header-sticky"
          style={{
            padding: "0 16px",
            backgroundColor: SIDEBAR_BACKGROUND_COLOR, // Header también durazno
            borderBottom: `1px solid ${BORDER_COLOR}`, // Borde actualizado
            position: "sticky", // Header fijo al hacer scroll en el contenido principal
            top: 0,
            zIndex: 9, // Menos que el Sider, más que el Content
            display: "flex",
            alignItems: "center",
            // El ancho se adapta al espacio disponible por el marginLeft del Layout padre
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
              color: SIDER_TEXT_COLOR, // Usamos el mismo color de texto base del Sider
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
          />
          {/* Otros elementos del Header aquí */}
        </Header>

        {/* === CONTENT (Contenido principal de la página) === */}
        <Content
          style={{
            margin: "24px 16px",
            padding: 24,
            minHeight: 280, // Altura mínima ejemplo
            // Si aquí añades overflow: 'auto', tendrás scroll DENTRO del content
            // Si no lo pones, el scroll será el de la página (body) si el contenido es muy largo
          }}
        >
          <Outlet /> {/* Renderiza las rutas hijas aquí */}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
