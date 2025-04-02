// AppLayout.js
import React, { useState } from 'react';
import { Layout, Button } from 'antd';
import { PanelLeftClose, PanelRightClose } from 'lucide-react'; // Mantenemos Lucide
import Logo from './Logo';
import MenuList from './MenuList';
import './layout.css';

const { Header, Sider, Content } = Layout;

// --- CONSTANTES ACTUALIZADAS ---
const SIDER_WIDTH_EXPANDED = 280;
const SIDER_WIDTH_COLLAPSED = 80;
// ¡TU NUEVO COLOR DE FONDO!
const SIDEBAR_BACKGROUND_COLOR = '#E8A833'; // <-- Nuevo color solicitado
// Borde ajustado para el nuevo color (un tono ligeramente más oscuro)
const BORDER_COLOR = '#D4992D'; // <-- Ajustado para #E8A833

const AppLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        theme="light"
        className="sidebar"
        collapsible
        trigger={null}
        collapsed={collapsed}
        width={SIDER_WIDTH_EXPANDED}
        collapsedWidth={SIDER_WIDTH_COLLAPSED}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          backgroundColor: SIDEBAR_BACKGROUND_COLOR, // Aplicando #E8A833
          borderRight: `1px solid ${BORDER_COLOR}` // Borde actualizado
        }}
      >
        {/* El color se pasa correctamente a los hijos */}
        <Logo collapsed={collapsed} backgroundColor={SIDEBAR_BACKGROUND_COLOR} />
        <MenuList collapsed={collapsed} backgroundColor={SIDEBAR_BACKGROUND_COLOR} />
      </Sider>
      <Layout
        className="site-layout"
        style={{
          marginLeft: collapsed ? SIDER_WIDTH_COLLAPSED : SIDER_WIDTH_EXPANDED,
          transition: 'margin-left 0.2s',
          minHeight: '100vh',
          backgroundColor: '#FFFFFF',
        }}
      >
        <Header
          className="site-layout-background header-sticky"
          style={{
            padding: '0 16px',
            backgroundColor: SIDEBAR_BACKGROUND_COLOR, // Header también con #E8A833
            borderBottom: `1px solid ${BORDER_COLOR}`, // Borde actualizado
            position: 'sticky',
            top: 0,
            zIndex: 1,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <PanelRightClose size={18} /> : <PanelLeftClose size={18} />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              width: 64,
              height: 64,
              color: '#5C4033', // Marrón oscuro sigue contrastando bien
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          />
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;