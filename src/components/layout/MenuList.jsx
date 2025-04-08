// MenuList.js
import React, { useState, useRef } from 'react';
import { Menu } from 'antd';
import { Link } from 'react-router-dom';
import {
    Home, BadgeInfo, User, Package, Calendar, Wrench, Users,
    Building, Box, ShoppingBag, ClipboardList, Factory,
    ConciergeBell, CalendarCheck, Boxes
} from 'lucide-react';
import '../../menu.css'; // Importante que se cargue

const ICON_SIZE = 18;
const SUB_ICON_SIZE = ICON_SIZE - 2;

// Recibe textColor como prop
const MenuList = ({ collapsed, backgroundColor, textColor }) => {
    const [openKeys, setOpenKeys] = useState([]);
    const menuRef = useRef(null);
    const rootSubmenuKeys = ['produccion_submenu', 'reservas_submenu'];

    // ... (lógica onOpenChange y menuItems sin cambios) ...
    const onOpenChange = (keys) => {
        const latestOpenKey = keys.find((key) => openKeys.indexOf(key) === -1);
        if (rootSubmenuKeys.indexOf(latestOpenKey) === -1) {
          setOpenKeys(keys);
        } else {
          setOpenKeys(latestOpenKey ? [latestOpenKey] : []);
        }
      };

    const menuItems = [
        { key: 'dashboard', icon: <Home size={ICON_SIZE} />, label: 'Dashboard', path: '/dashboard' },
        { key: 'roles', icon: <BadgeInfo size={ICON_SIZE} />, label: 'Roles', path: '/roles' },
        { key: 'usuarios', icon: <User size={ICON_SIZE} />, label: 'Usuarios', path: '/usuarios' },
        {
            key: 'produccion_submenu',
            icon: <Package size={ICON_SIZE} />, label: 'Producción',
            children: [
                { key: 'proveedores', label: 'Proveedores', path: '/proveedores', icon: <Building size={SUB_ICON_SIZE} /> },
                { key: 'empleados', label: 'Empleados', path: '/empleados', icon: <Users size={SUB_ICON_SIZE} /> },
                { key: 'insumo', label: 'Insumo', path: '/insumo', icon: <Box size={SUB_ICON_SIZE} /> },
                { key: 'producto_insumo', label: 'Producto Insumo', path: '/producto_insumo', icon: <Boxes size={SUB_ICON_SIZE} /> },
                { key: 'orden_produccion', label: 'Crear Orden de Producción', path: '/orden_produccion', icon: <ClipboardList size={SUB_ICON_SIZE} /> },
                { key: 'produccion', label: 'Producción', path: '/produccion', icon: <Factory size={SUB_ICON_SIZE} /> },
                { key: 'compras', label: 'Registro compra', path: '/compras', icon: <ShoppingBag size={SUB_ICON_SIZE} /> },
            ],
        },
        {
            key: 'reservas_submenu',
            icon: <Calendar size={ICON_SIZE} />, label: 'Reservas',
            children: [
                { key: 'clientes', label: 'Clientes', path: '/clientes', icon: <Users size={SUB_ICON_SIZE} /> },
                { key: 'reservas', label: 'Reservas', path: '/reservas', icon: <CalendarCheck size={SUB_ICON_SIZE} /> },
                { key: 'servicios', label: 'Servicios', path: '/servicios', icon: <ConciergeBell size={SUB_ICON_SIZE} /> },
            ],
        },
        { key: 'mano_de_obra', icon: <Wrench size={ICON_SIZE} />, label: 'Mano de Obra', path: '/mano_de_obra' },
    ];

    const renderMenuItem = (item) => {
        if (item.children) {
            return (
                <Menu.SubMenu key={item.key} icon={item.icon} title={item.label} className="submenu-item">
                    {item.children.map(renderMenuItem)}
                </Menu.SubMenu>
            );
        }
        return (
            <Menu.Item key={item.key} icon={item.icon}>
                <Link to={item.path} style={{ textDecoration: 'none' }}>
                    {item.label}
                </Link>
            </Menu.Item>
        );
    };

    return (
        <Menu
            ref={menuRef}
            mode="inline"
            theme="light" // Mantenemos light, los estilos CSS hacen el trabajo
            openKeys={openKeys}
            onOpenChange={onOpenChange}
            style={{
                borderRight: 0,
                backgroundColor: 'transparent', // Fondo transparente para ver el del Sider
                paddingBottom: '48px'
            }}
            // Pasamos el textColor como una variable CSS para usar en menu.css
            // Esto es opcional, también podrías definir el color directamente en menu.css
            // como lo hacíamos antes, pero así es más dinámico si alguna vez cambia.
            css={{ '--menu-text-icon-color-base': textColor }}
            className="menu-list-container"
            inlineCollapsed={collapsed}
        >
            {menuItems.map(renderMenuItem)}
        </Menu>
    );
};

export default MenuList;