import React, { useState } from 'react';
import { Layout, Button, Dropdown, Menu } from 'antd';
import { MenuUnfoldOutlined, MenuFoldOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';
import MenuList from './MenuList';
import '../../layout.css'

const { Header, Sider, Content } = Layout;

const AppLayout = ({ children }) => {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();

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
                className="sidebar" // Aplicamos la clase
                collapsible
                trigger={null}
                collapsed={collapsed}
                onCollapse={() => setCollapsed(!collapsed)}
                width={250} // Establece el ancho del sidebar
            >
                <Logo collapsed={collapsed} backgroundColor="#FEF5C4" /> {/* Pasamos el color de fondo #FEF5C4*/}
                <MenuList /> {/*Pasamos el color de fondo #FEF5C4*/}
            </Sider>
            <Layout style={{ marginLeft: collapsed ? 80 : 250 }}>  {/* Ajusta el margen izquierdo según el estado collapsed */}
                <Header style={{ padding: 0, backgroundColor: '#FEF5C4' }} className="header">
                    <div className="d-flex justify-content-between align-items-center" style={{ height: '100%' }}>
                        <Button
                            className="buttonInt"
                            type="text"
                            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                            onClick={() => setCollapsed(!collapsed)}
                            style={{ color: '#000' }} // Cambie el color del icono a negro
                        />
                        <h1 style={{ margin: 0, color: '#000' }}>Food in Production</h1> {/* Cambie el color del texto a negro */}
                        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                            <Dropdown overlay={menu} trigger={['click']}>
                                <Button type="text" style={{ color: '#000' }}> {/* Cambie el color del texto a negro */}
                                    Mi Perfil
                                </Button>
                            </Dropdown>
                        </div>
                    </div>
                </Header>
                <Content style={{ padding: '24px', minHeight: 'calc(100vh - 64px)', backgroundColor: '#FEF5C4' }}>
                    {children}
                </Content>
            </Layout>
        </Layout>
    );
};

export default AppLayout;