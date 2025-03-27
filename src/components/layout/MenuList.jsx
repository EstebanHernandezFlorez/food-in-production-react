// MenuList.js
import React, { useState, useRef, useEffect } from 'react';
import { Menu, Modal } from 'antd';
import { Link } from 'react-router-dom';
import {
    HomeOutlined,
    UserOutlined,
    ProductOutlined,
    CalendarOutlined,
    BarChartOutlined,
    IdcardOutlined,
    LogoutOutlined,
} from '@ant-design/icons';
import '../../menu.css';

const MenuList = ({ collapsed }) => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [openKeys, setOpenKeys] = useState([]);
    const menuRef = useRef(null);


    const onOpenChange = (keys) => {
        setOpenKeys(keys);
    };

    const menuItems = [
        { key: 'dashboard', icon: <HomeOutlined style={{ fontSize: '18px' }} />, label: 'Dashboard', path: '/dashboard' },
        { key: 'roles', icon: <IdcardOutlined style={{ fontSize: '18px' }} />, label: 'Roles', path: '/roles' },
        { key: 'usuarios', icon: <UserOutlined style={{ fontSize: '18px' }} />, label: 'Usuarios', path: '/usuarios' },
        {
            key: 'subtasks',
            icon: <ProductOutlined style={{ fontSize: '18px' }} />, label: 'Producción',
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
            icon: <CalendarOutlined style={{ fontSize: '18px' }} />, label: 'Reservas',
            children: [
                { key: 'clientes', label: 'Clientes', path: '/clientes' },
                { key: 'reservas', label: 'Reservas', path: '/reservas' },
                { key: 'servicios', label: 'Servicios', path: '/servicios' },
            ],
        },
        { key: 'mano_de_obra', icon: <BarChartOutlined style={{ fontSize: '18px' }} />, label: 'Mano de Obra', path: '/mano_de_obra' },
    ];



    return (
        <>
            <Menu
                ref={menuRef}
                mode="inline"
                openKeys={openKeys}
                onOpenChange={onOpenChange}
                style={{ height: '100%', borderRight: 0, backgroundColor: '#FEF5C4' }}
                className="menu-container"
            >
                {menuItems.map((item) =>
                    item.children ? (
                        <Menu.SubMenu key={item.key} icon={item.icon} title={item.label} className="submenu-item">
                            {item.children.map((child) => (
                                <Menu.Item key={child.key}>
                                    <Link to={child.path} style={{ textDecoration: 'none' }}>{child.label}</Link>
                                </Menu.Item>
                            ))}
                        </Menu.SubMenu>
                    ) : (
                        <Menu.Item key={item.key} icon={item.icon}>
                            <Link to={item.path} style={{ textDecoration: 'none' }}>{item.label}</Link>
                        </Menu.Item>
                    )
                )}

            </Menu>


        </>
    );
};

export default MenuList;