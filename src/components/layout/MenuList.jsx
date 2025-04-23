// src/components/layout/MenuList.js (CORREGIDO)

import React, { useState, useRef } from 'react';
import { Menu } from 'antd';
import { Link } from 'react-router-dom';
// Importa SOLO las rutas que van al menú
import routes from "../../views/module/pages.routes"; // <-- Usa pages.routes.js
import '../../menu.css'; // Importante que se cargue

const MenuList = ({ collapsed, backgroundColor, textColor }) => {
    const [openKeys, setOpenKeys] = useState([]);
    const menuRef = useRef(null);

    const rootSubmenuKeys = routes.filter(r => r.children).map(r => r.path);
    const onOpenChange = (keys) => {
        const latestOpenKey = keys.find((key) => openKeys.indexOf(key) === -1);
        if (rootSubmenuKeys.indexOf(latestOpenKey) === -1) {
          setOpenKeys(keys);
        } else {
          setOpenKeys(latestOpenKey ? [latestOpenKey] : []);
        }
    };

    // --- FUNCIÓN CORREGIDA para generar items de menú con rutas anidadas ---
    const renderMenuItem = (item, basePath = '/home') => { // Añade basePath, default '/home'
        // Construye el path completo actual, evitando dobles barras
        const currentPath = `${basePath}/${item.path}`.replace(/\/+/g, '/');

        // Si es una ruta final (hoja)
        if (!item.children || item.children.length === 0) {
            return (
                <Menu.Item key={currentPath} icon={item.icon}> {/* Usa path completo como key */}
                    {/* El Link AHORA apunta al path completo calculado */}
                    <Link to={currentPath} style={{ textDecoration: 'none' }}>
                        {item.label}
                    </Link>
                </Menu.Item>
            );
        }

        // Si es un submenú (tiene hijos)
        return (
            <Menu.SubMenu key={currentPath} icon={item.icon} title={item.label}> {/* Usa path completo como key */}
                {/* Llama recursivamente para los hijos, pasando el NUEVO basePath */}
                {item.children.map(child => renderMenuItem(child, currentPath))}
            </Menu.SubMenu>
        );
    };
    // ---------------------------------------------------------------------

    return (
        <Menu
            ref={menuRef}
            mode="inline"
            theme="light"
            openKeys={openKeys}
            onOpenChange={onOpenChange}
            style={{
                borderRight: 0,
                backgroundColor: 'transparent',
            }}
             css={{ '--menu-text-icon-color-base': textColor }}
            className="menu-list-container"
            inlineCollapsed={collapsed}
        >
            {/* Mapea las rutas de pages.routes.js iniciando la recursión */}
            {/* La llamada inicial usa el basePath por defecto ('/home') */}
            {routes.map(route => renderMenuItem(route))}
        </Menu>
    );
};

export default MenuList;