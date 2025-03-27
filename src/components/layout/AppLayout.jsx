// AppLayout.js
import React, { useState } from 'react';
import { Layout, Button } from 'antd';
import { MenuUnfoldOutlined, MenuFoldOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';
import MenuList from './MenuList';
import './layout.css';

const { Header, Sider, Content } = Layout;

const AppLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        theme="light"
        className="sidebar"
        collapsible
        trigger={null}
        collapsed={collapsed}
        onCollapse={() => setCollapsed(!collapsed)}
        width={collapsed ? 80:250}
        style={{
          overflow: 'auto',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          backgroundColor: '#FEF5C4',
          height: '100vh', //Important: Ensure sidebar takes full height.
        }}
      >
        <Logo collapsed={collapsed} backgroundColor="#FEF5C4" />
        <MenuList collapsed={collapsed} />
      </Sider>
      <Layout
        className="site-layout"
        style={{
          marginLeft: collapsed ? 80 : 250,
          transition: 'margin-left 0.2s',
        }}
      >
        <Header
          className="site-layout-background"
          style={{
            padding: 0,
            backgroundColor: '#FEF5C4',
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
              color: '#000'
            }}
          />
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            backgroundColor: '#FEF5C4',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;