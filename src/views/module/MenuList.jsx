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
    const menuStyle = {
        backgroundColor: darkTheme ? '#4a0000' : '#ffffff',
        fontsize: '1rem', // Vinotinto para el tema oscuro, blanco para el claro
    };

    const itemStyle = {
        color: darkTheme ? '#ffffff' : '#000000', // Blanco para el texto en el tema oscuro, negro para el claro
    };

    const activeItemStyle = {
        backgroundColor: darkTheme ? '#800000' : '#f0f0f0', // Vinotinto para el ítem activo en el tema oscuro, gris claro para el claro
        color: darkTheme ? '#ffffff' : '#000000',
    };

    return (
        <Menu
            theme={darkTheme ? 'dark' : 'light'}
            mode="inline"
            style={menuStyle}
        >
            <Menu.Item key="dashboard" icon={<HomeOutlined style={{ color: itemStyle.color }} />}>
                <Link to="/dashboard" style={itemStyle}>Dashboard</Link>
            </Menu.Item>
            <Menu.Item key="roles" icon={<IdcardOutlined style={{ color: itemStyle.color }} />}>
                <Link to="/roles" style={itemStyle}>Roles</Link>
            </Menu.Item>
            <Menu.Item key="usuarios" icon={<UserOutlined style={{ color: itemStyle.color }} />}>
                <Link to="/usuarios" style={itemStyle}>Usuarios</Link>
            </Menu.Item>
            <Menu.SubMenu 
                key="subtasks" 
                icon={<ProductOutlined style={{ color: menuStyle.color }} />} 
                title="Produccion"
                popupClassName={darkTheme ? 'dark-theme-submenu' : ''}
            >
                <Menu.Item key="produccion" style={menuStyle}>
                    <Link to="/produccion">Produccion</Link>
                </Menu.Item>
                <Menu.Item key="orden_produccion" style={menuStyle}>
                    <Link to="/orden_produccion">Orden de Produccion</Link>
                </Menu.Item>
                <Menu.Item key="producto_insumo" style={menuStyle}>
                    <Link to="/producto_insumo">Producto insumo</Link>
                </Menu.Item>
                <Menu.Item key="insumo" style={menuStyle}>
                    <Link to="/insumo">Insumo</Link>
                </Menu.Item>
                <Menu.Item key="empleados" style={menuStyle}>
                    <Link to="/empleados">Empleados</Link>
                </Menu.Item>
                <Menu.Item key="proveedores" style={menuStyle}>
                    <Link to="/proveedores">Proveedores</Link>
                </Menu.Item>
            </Menu.SubMenu>
            <Menu.SubMenu 
                key="reservas" 
                icon={<CalendarOutlined style={{ color: itemStyle.color }} />} 
                title="Reservas"
                popupClassName={darkTheme ? 'dark-theme-submenu' : ''}
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
            <Menu.Item key="mano_de_obra" icon={<BarChartOutlined style={{ color: itemStyle.color }} />}>
                <Link to="/mano_de_obra" style={itemStyle}>Mano de obra</Link>
            </Menu.Item>
        </Menu>
    );
}

export default MenuList;
