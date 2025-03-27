import React, { useState, useRef, useEffect } from 'react';
import { Layout, Button, Dropdown, Menu } from 'antd';
import { MenuUnfoldOutlined, MenuFoldOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';
import MenuList from './MenuList';
import './layout.css';

const { Header, Sider, Content } = Layout;

const AppLayout = ({ children }) => {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const [contentHeight, setContentHeight] = useState('auto'); // Estado para la altura del Content
    const contentRef = useRef(null); // Referencia al Content

    useEffect(() => {
        const calculateContentHeight = () => {
            if (contentRef.current) {
                setContentHeight(contentRef.current.offsetHeight);
            }
        };

        calculateContentHeight();
        window.addEventListener('resize', calculateContentHeight); // Recalcular en resize

        return () => {
            window.removeEventListener('resize', calculateContentHeight);
        };
    }, []);

    const handleEditProfile = () => {
        navigate('/editar-perfil');
    };

    const menu = (
        <Menu>
            <Menu.Item key="1" onClick={handleEditProfile}>
                Editar Perfil
            </Menu.Item>
        </Menu>
    );

    return (
        <Layout>
            <Sider
                theme="light"
                className="sidebar"
                collapsible
                trigger={null}
                collapsed={collapsed}
                onCollapse={() => setCollapsed(!collapsed)}
                width={250}
                style={{
                    overflow: 'auto',
                    height: contentHeight, // Usar la altura del Content
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    backgroundColor: '#FEF5C4',
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
                    marginTop: '10px',
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
                        minHeight: 280, // Eliminar el cálculo de altura
                        backgroundColor: '#FEF5C4',
                    }}
                    ref={contentRef} // Asignar la referencia
                >
                    {children}
                </Content>
            </Layout>
        </Layout>
    );
};

export default AppLayout;