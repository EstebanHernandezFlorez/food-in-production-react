import React, { useState, useRef, useEffect } from 'react';
import { Menu, Modal } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import {
    HomeOutlined,
    UserOutlined,
    ProductOutlined,
    CalendarOutlined,
    BarChartOutlined,
    IdcardOutlined,
    LogoutOutlined,
} from '@ant-design/icons';
import '../../menu.css'
import '../../index.css'

const MenuList = ({ collapsed }) => { // Eliminamos backgroundColor de las props
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [openKeys, setOpenKeys] = useState([]);
    const menuRef = useRef(null);
    const logoutRef = useRef(null); // Referencia al item de logout
    const [menuHeight, setMenuHeight] = useState('auto');

    useEffect(() => {
        const calculateHeight = () => {
        };

        calculateHeight();

        window.addEventListener('resize', calculateHeight);

        return () => {
            window.removeEventListener('resize', calculateHeight);
        };
    }, [openKeys]);

    const menuStyle = {
        backgroundColor: '#FEF5C4  ', // Aplicamos el color directamente
        color: '#000',
        fontWeight: 'bold',
        border: 'none',        fontSize: '15px',
        position: 'relative', // Importante para el posicionamiento absoluto del logout
    };

    const itemStyle = {
        color: '#000',
        textDecoration: 'none',
        backgroundColor: '#FEF5C4  ', // Aplicamos el color directamente
        padding: '12px 16px',
        margin: '0',
    };

    const submenuStyle = {
        color: '#000',
        backgroundColor: '#FEF5C4  ', // Aplicamos el color directamente
        textDecoration: 'none',
    };

    const subMenuStyle = {
        backgroundColor: '#FEF5C4  ', // Aplicamos el color directamente
    };

    const showConfirm = () => {
        setIsModalVisible(true);
    };

    const handleOk = () => {
        setIsModalVisible(false);
        window.location.href = '/';
    };

    const handleCancel = () => {
        setIsModalVisible(false);
    };

    const onOpenChange = (keys) => {
        setOpenKeys(keys);
    };

    const menuItems = [
        { key: 'dashboard', icon: <HomeOutlined style={{ color: '#000' }} />, label: 'Dashboard', path: '/dashboard' },
        { key: 'roles', icon: <IdcardOutlined style={{ color: '#000' }} />, label: 'Roles', path: '/roles' },
        { key: 'usuarios', icon: <UserOutlined style={{ color: '#000' }} />, label: 'Usuarios', path: '/usuarios' },
        {
            key: 'subtasks',
            icon: <ProductOutlined style={{ color: '#000' }} />, label: 'Producción',
            children: [
                { key: 'proveedores', label: 'Proveedores', path: '/proveedores' },
                { key: 'empleados', label: 'Empleados', path: '/empleados' },
                { key: 'insumo', label: 'Insumo', path: '/insumo' },
                { key: 'producto_insumo', label: 'Producto Insumo', path: '/producto_insumo' },
                { key: 'orden_produccion', label: 'Orden de Producción', path: '/orden_produccion' },
                { key: 'produccion', label: 'Producción', path: '/produccion' },
            ],
        },
        {
            key: 'reservas',
            icon: <CalendarOutlined style={{ color: '#000' }} />, label: 'Reservas',
            children: [
                { key: 'clientes', label: 'Clientes', path: '/clientes' },
                { key: 'reservas', label: 'Reservas', path: '/reservas' },
                { key: 'servicios', label: 'Servicios', path: '/servicios' },
            ],
        },
        { key: 'mano_de_obra', icon: <BarChartOutlined style={{ color: '#000' }} />, label: 'Mano de Obra', path: '/mano_de_obra' },
    ];

    const logoutItem = { key: 'logout', icon: <LogoutOutlined style={{ color: '#000' }} />, label: 'Cerrar sesión', onClick: showConfirm };

    return (
        <>
            <Menu
                ref={menuRef}
                mode="inline"
                style={menuStyle}
                className='MenuCompleto'
                onOpenChange={onOpenChange}
                openKeys={openKeys}
            >
                {menuItems.map((item) =>
                    item.children ? (
                        <Menu.SubMenu
                            key={item.key}
                            icon={item.icon}
                            title={item.label}
                            style={subMenuStyle}
                            popupClassName={openKeys.includes(item.key) ? 'submenu-open' : ''}
                        >
                            {item.children.map((child) => (
                                <Menu.Item key={child.key} style={submenuStyle}>
                                    <Link to={child.path} style={submenuStyle}>{child.label}</Link>
                                </Menu.Item>
                            ))}
                        </Menu.SubMenu>
                    ) : (
                        <Menu.Item
                            key={item.key}
                            icon={item.icon}
                            style={itemStyle}
                        >
                            <Link to={item.path} style={itemStyle}>
                                {item.label}
                            </Link>
                        </Menu.Item>
                    )
                )}
            </Menu>
            {/* Item de cerrar sesión fuera del Menu */}
            <Menu
                ref={logoutRef} // Referencia al item de logout
                mode="inline"
                style={{
                    backgroundColor: '#FEF5C4  ', // Aplicamos el color directamente
                    color: '#D4AF37',
                    border: 'none',
                    fontSize: '15px',
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: '100%',
                }}
                onClick={logoutItem.onClick}
            >
                <Menu.Item
                    key={logoutItem.key}
                    icon={logoutItem.icon}
                    style={itemStyle}
                >
                    {logoutItem.label}
                </Menu.Item>
            </Menu>

            <Modal
                title="Confirmación"
                open={isModalVisible}
                onOk={handleOk}
                onCancel={handleCancel}
                okText="Sí"
                cancelText="No"
            >
                <p>¿Estás seguro de que deseas cerrar sesión?</p>
            </Modal>
        </>
    );
};

export default MenuList;