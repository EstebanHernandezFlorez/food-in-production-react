import React from 'react';
import { Menu } from 'antd';
import { Link } from 'react-router-dom';
import { 
    HomeOutlined, 
    UserOutlined, 
    ProductOutlined, 
    CalendarOutlined, 
    BarChartOutlined,
    IdcardOutlined
} from '@ant-design/icons';

const MenuList = ({ darkTheme }) => {
    // Definir los estilos en función del tema
    const menuStyle = {
        backgroundColor: darkTheme ? '#222222' : '#ffffff',
        color: darkTheme ? '#ffffff' : '#222222',
        height: '100vh', // Asegura que el menú ocupe toda la altura del contenedor
    };

    const itemStyle = {
        color: darkTheme ? '#ffffff' : '#222222',
    };

    const activeItemStyle = {
        backgroundColor: darkTheme ? '#444444' : '#f0f0f0',
        color: darkTheme ? '#ffffff' : '#222222',
    };

    const submenuStyle = {
        backgroundColor: darkTheme ? '#222222' : '#ffffff',
        color: darkTheme ? '#ffffff' : '#222222',
    };

    return (
        <Menu
            theme={darkTheme ? 'dark' : 'light'}
            mode="inline"
            style={menuStyle}
        >
            <Menu.Item
                key="dashboard"
                icon={<HomeOutlined style={{ color: itemStyle.color }} />}
                style={itemStyle}
            >
                <Link to="/dashboard" style={itemStyle}>Dashboard</Link>
            </Menu.Item>
            <Menu.Item
                key="roles"
                icon={<IdcardOutlined style={{ color: itemStyle.color }} />}
                style={itemStyle}
            >
                <Link to="/roles" style={itemStyle}>Roles</Link>
            </Menu.Item>
            <Menu.Item
                key="usuarios"
                icon={<UserOutlined style={{ color: itemStyle.color }} />}
                style={itemStyle}
            >
                <Link to="/usuarios" style={itemStyle}>Usuarios</Link>
            </Menu.Item>
            <Menu.SubMenu 
                key="subtasks" 
                icon={<ProductOutlined style={{ color: itemStyle.color }} />} 
                title="Producción"
                style={submenuStyle}
            >
                <Menu.Item key="produccion" style={itemStyle}>
                    <Link to="/produccion">Producción</Link>
                </Menu.Item>
                <Menu.Item key="orden_produccion" style={itemStyle}>
                    <Link to="/orden_produccion">Orden de Producción</Link>
                </Menu.Item>
                <Menu.Item key="producto_insumo" style={itemStyle}>
                    <Link to="/producto_insumo">Producto Insumo</Link>
                </Menu.Item>
                <Menu.Item key="insumo" style={itemStyle}>
                    <Link to="/insumo">Insumo</Link>
                </Menu.Item>
                <Menu.Item key="empleados" style={itemStyle}>
                    <Link to="/empleados">Empleados</Link>
                </Menu.Item>
                <Menu.Item key="proveedores" style={itemStyle}>
                    <Link to="/proveedores">Proveedores</Link>
                </Menu.Item>
            </Menu.SubMenu>
            <Menu.SubMenu 
                key="reservas" 
                icon={<CalendarOutlined style={{ color: itemStyle.color }} />} 
                title="Reservas"
                style={submenuStyle}
            >
                <Menu.Item key="clientes" style={itemStyle}>
                    <Link to="/clientes">Clientes</Link>
                </Menu.Item>
                <Menu.Item key="reservas" style={itemStyle}>
                    <Link to="/reservas">Reservas</Link>
                </Menu.Item>
                <Menu.Item key="servicios" style={itemStyle}>
                    <Link to="/servicios">Servicios</Link>
                </Menu.Item>
            </Menu.SubMenu>
            <Menu.Item
                key="mano_de_obra"
                icon={<BarChartOutlined style={{ color: itemStyle.color }} />}
                style={itemStyle}
            >
                <Link to="/mano_de_obra" style={itemStyle}>Mano de Obra</Link>
            </Menu.Item>
        </Menu>
    );
}

export default MenuList;
