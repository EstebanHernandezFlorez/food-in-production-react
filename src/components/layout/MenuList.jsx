// MenuList.js
import React, { useState, useRef } from 'react';
import { Menu } from 'antd';
import { Link } from 'react-router-dom';
// ¡Importa los iconos de Lucide!
import {
    Home,       // Reemplaza HomeOutlined
    BadgeInfo,  // Reemplaza IdcardOutlined (para Roles)
    User,       // Reemplaza UserOutlined
    Package,    // Reemplaza ProductOutlined (para Producción)
    Calendar,   // Reemplaza CalendarOutlined
    Wrench,     // Reemplaza BarChartOutlined (para Mano de Obra - considera si otro icono como 'BarChart' es mejor)
    // Puedes añadir más iconos de Lucide según necesites para los submenús
    Users,      // Para Empleados/Clientes
    Building,   // Para Proveedores
    Box,        // Para Insumo
    ShoppingBag,// Para Compras
    ClipboardList, // Para Orden Producción
    Factory,    // Para Producción
    ConciergeBell, // Para Servicios
    CalendarCheck // Para Reservas
} from 'lucide-react';
import '../../menu.css'; // ¡IMPORTANTE QUE ESTE ARCHIVO SE CARGUE!

// Tamaño estándar para los iconos del menú
const ICON_SIZE = 18;

const MenuList = ({ collapsed, backgroundColor }) => {
    const [openKeys, setOpenKeys] = useState([]);
    const menuRef = useRef(null);
    // Asegúrate que estas keys coincidan con las keys de los SubMenu
    const rootSubmenuKeys = ['produccion_submenu', 'reservas_submenu'];

    const onOpenChange = (keys) => {
        const latestOpenKey = keys.find((key) => openKeys.indexOf(key) === -1);
        if (rootSubmenuKeys.indexOf(latestOpenKey) === -1) {
          setOpenKeys(keys);
        } else {
          setOpenKeys(latestOpenKey ? [latestOpenKey] : []);
        }
      };

    // --- ITEMS DEL MENÚ CON ICONOS LUCIDE ---
    const menuItems = [
        { key: 'dashboard', icon: <Home size={ICON_SIZE} />, label: 'Dashboard', path: '/dashboard' },
        { key: 'roles', icon: <BadgeInfo size={ICON_SIZE} />, label: 'Roles', path: '/roles' },
        { key: 'usuarios', icon: <User size={ICON_SIZE} />, label: 'Usuarios', path: '/usuarios' },
        {
            key: 'produccion_submenu', // Cambia la key para evitar conflictos si 'produccion' se usa como item
            icon: <Package size={ICON_SIZE} />, label: 'Producción',
            children: [
                // Considera añadir iconos de Lucide a los subitems también si lo deseas
                { key: 'proveedores', label: 'Proveedores', path: '/proveedores', icon: <Building size={ICON_SIZE-2} /> },
                { key: 'empleados', label: 'Empleados', path: '/empleados', icon: <Users size={ICON_SIZE-2} /> },
                { key: 'insumo', label: 'Insumo', path: '/insumo', icon: <Box size={ICON_SIZE-2} /> },
                { key: 'producto_insumo', label: 'Producto Insumo', path: '/producto_insumo' /* icon: <Boxes size={ICON_SIZE-2} /> */ },
                { key: 'orden_produccion', label: 'Orden de Producción', path: '/orden_produccion', icon: <ClipboardList size={ICON_SIZE-2} /> },
                { key: 'produccion', label: 'Producción', path: '/produccion', icon: <Factory size={ICON_SIZE-2} /> },
                { key: 'compras', label: 'Registro compra', path: '/compras', icon: <ShoppingBag size={ICON_SIZE-2} /> },
            ],
        },
        {
            key: 'reservas_submenu', // Cambia la key
            icon: <Calendar size={ICON_SIZE} />, label: 'Reservas',
            children: [
                { key: 'clientes', label: 'Clientes', path: '/clientes', icon: <Users size={ICON_SIZE-2} /> },
                { key: 'reservas', label: 'Reservas', path: '/reservas', icon: <CalendarCheck size={ICON_SIZE-2} /> },
                { key: 'servicios', label: 'Servicios', path: '/servicios', icon: <ConciergeBell size={ICON_SIZE-2} /> },
            ],
        },
        // Nota: Wrench puede no ser el mejor icono para 'Mano de Obra',
        // podrías preferir `HardHat`, `PersonStanding` o incluso `BarChart3` si se refiere a estadísticas.
        { key: 'mano_de_obra', icon: <Wrench size={ICON_SIZE} />, label: 'Mano de Obra', path: '/mano_de_obra' },
    ];


    // Función para renderizar los items (con o sin hijos)
    const renderMenuItem = (item) => {
        if (item.children) {
            return (
                <Menu.SubMenu key={item.key} icon={item.icon} title={item.label} className="submenu-item">
                    {item.children.map(renderMenuItem)} // Renderiza recursivamente los hijos
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
            theme="light" // Theme light + CSS overrides es la clave
            openKeys={openKeys}
            onOpenChange={onOpenChange}
            style={{
                borderRight: 0, // Sin borde propio del menú
                backgroundColor: 'transparent', // ¡Importante! Hacer transparente para ver el fondo del Sider
                paddingBottom: '48px'
            }}
            className="menu-list-container" // Clase para aplicar estilos CSS
            inlineCollapsed={collapsed}
        >
            {menuItems.map(renderMenuItem)} {/* Usa la función de renderizado */}
        </Menu>
    );
};

export default MenuList;