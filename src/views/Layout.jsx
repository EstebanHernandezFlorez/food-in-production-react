import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState } from 'react';
import { Layout, Button, Dropdown, Menu } from 'antd';
import { MenuUnfoldOutlined, MenuFoldOutlined, UserOutlined } from '@ant-design/icons';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';




const { Header, Sider, Content } = Layout;

export default function AppLayout({ children }) {
  const [darkTheme, setDarkTheme] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const toggleTheme = () => {
    setDarkTheme(!darkTheme);
  };

  const handleEditProfile = () => {
    navigate('/editar-perfil');
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
    <Router>
      <Layout>
        <Sider
          theme={darkTheme ? 'dark' : 'light'}
          style={{
            backgroundColor: darkTheme ? '#4a0000' : '#fff',
          }}
          className="sidebar"
          collapsible
          trigger={null}
          collapsed={collapsed}
          onCollapse={() => setCollapsed(!collapsed)}
        >
          <Logo />
          <MenuList darkTheme={darkTheme} />
          <ToggleThemeButton darkTheme={darkTheme} toggleTheme={toggleTheme} />
        </Sider>
        <Layout>
          <Header style={{ padding: 0 }} className="header">
            <div className="d-flex justify-content-between align-items-center" style={{ height: '100%' }}>
              <Button
                className="buttonInt"
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
              />
              <h1 style={{ margin: 0 }}>Food in Production</h1>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                <Dropdown overlay={menu} trigger={['click']}>
                  
                </Dropdown>
              </div>
            </div>
          </Header>
          <Content style={{ padding: '24px', minHeight: 'calc(100vh - 64px)' }}>
            {children}
          </Content>
        </Layout>
      </Layout>
    </Router>
  );
}
