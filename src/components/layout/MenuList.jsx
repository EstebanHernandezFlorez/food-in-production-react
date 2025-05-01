// src/components/layout/MenuList.js

import React, { useState, useEffect } from 'react';
import { Menu } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../views/hooks/AuthProvider'; // <-- Verifica/Ajusta esta ruta
import allRoutes from "../../views/module/pages.routes"; // <-- Verifica/Ajusta esta ruta
import '../../menu.css'; // Tus estilos

// --- CONSTANTES DE ROLES (Asegúrate que coincidan con tu BD/Backend) ---
const ROLES = {
    ADMIN: 1,
    AUX: 2,
    JEFE: 3
};
// -----------------------------------------------------------------------

const MenuList = ({ collapsed, backgroundColor, textColor }) => {
    const { user } = useAuth();
    const location = useLocation();
    const [filteredRoutes, setFilteredRoutes] = useState([]);
    const [openKeys, setOpenKeys] = useState([]);
    const [selectedKeys, setSelectedKeys] = useState([]);

    // --- Efecto para filtrar las rutas basado en el rol del usuario ---
    useEffect(() => {
        let currentRoutes = [];
        console.log("MenuList useEffect triggered. User object:", user); // LOG 1

        if (user && user.role && user.role.id !== undefined && user.role.id !== null) {
            const userRoleId = user.role.id;
            console.log("Raw user.role.id value:", userRoleId); // LOG 2
            console.log("Type of user.role.id:", typeof userRoleId); // LOG 3

            const userRole = Number(userRoleId);
            console.log("Converted userRole (Number):", userRole); // LOG 4

            const isAdmin = userRole === ROLES.ADMIN;
            const isAux = userRole === ROLES.AUX;
            const isJefe = userRole === ROLES.JEFE;
            console.log(`Is Admin (${ROLES.ADMIN})?`, isAdmin); // LOG 5
            console.log(`Is Aux (${ROLES.AUX})?`, isAux);       // LOG 6
            console.log(`Is Jefe (${ROLES.JEFE})?`, isJefe);    // LOG 7

            if (isAdmin) {
                console.log("Condition: ADMIN matched.");
                currentRoutes = allRoutes;
            } else if (isAux || isJefe) {
                console.log(`Condition: AUX (${ROLES.AUX}) or JEFE (${ROLES.JEFE}) matched. Filtering for 'dashboard' and 'reservas'.`);
                currentRoutes = allRoutes.filter(route =>
                    route.path === 'dashboard' || route.path === 'reservas'
                );
            } else {
                console.warn(`Condition: No specific role matched (ADMIN, AUX, or JEFE). Role ID was ${userRole}. Falling back to dashboard.`);
                currentRoutes = allRoutes.filter(route => route.path === 'dashboard');
            }

        } else {
            console.log("Condition: User object, user.role, or user.role.id is missing or null/undefined. No routes will be shown.");
            currentRoutes = [];
        }

        setFilteredRoutes(currentRoutes);
        console.log("Final Filtered Routes:", currentRoutes); // LOG 8

    }, [user]);

    // --- Efecto para manejar la selección del menú y los submenús abiertos basado en la ruta actual ---
    useEffect(() => {
        const currentPath = location.pathname;
        setSelectedKeys([currentPath]);

        const pathSegments = currentPath.split('/');
        if (pathSegments.length > 3) {
            const parentPath = `/${pathSegments[1]}/${pathSegments[2]}`;
            const parentRoute = filteredRoutes.find(r => `/home/${r.path}` === parentPath && r.children);
            if (parentRoute && !collapsed) {
                if (!openKeys.includes(parentPath)) {
                    setOpenKeys([parentPath]);
                }
            }
        }

    }, [location.pathname, filteredRoutes, collapsed, openKeys]);

    const rootSubmenuKeys = filteredRoutes.filter(r => r.children).map(r => `/home/${r.path}`);

    const onOpenChange = (keys) => {
        const latestOpenKey = keys.find((key) => openKeys.indexOf(key) === -1);
        if (rootSubmenuKeys.indexOf(latestOpenKey) === -1) {
            setOpenKeys(keys);
        } else {
            setOpenKeys(latestOpenKey ? [latestOpenKey] : []);
        }
    };

    const renderMenuItem = (item, basePath = '/home') => {
        const currentPath = `${basePath}/${item.path}`.replace(/\/+/g, '/');

        if (!item.children || item.children.length === 0) {
            return (
                <Menu.Item key={currentPath} icon={item.icon}>
                    <Link to={currentPath} style={{ textDecoration: 'none' }}>
                        {item.label}
                    </Link>
                </Menu.Item>
            );
        }

        return (
            <Menu.SubMenu key={currentPath} icon={item.icon} title={item.label}>
                {item.children.map(child => renderMenuItem(child, currentPath))}
            </Menu.SubMenu>
        );
    };

    if (!filteredRoutes || filteredRoutes.length === 0) {
        console.log("No hay rutas filtradas para mostrar en el menú. Renderizando null.");
        return null;
    }

    console.log("Renderizando menú con las rutas filtradas:", filteredRoutes);
    return (
        <Menu
            mode="inline"
            theme="light"
            selectedKeys={selectedKeys}
            openKeys={collapsed ? [] : openKeys}
            onOpenChange={onOpenChange}
            style={{
                borderRight: 0,
                backgroundColor: backgroundColor || 'transparent',
                // color: textColor,
            }}
            inlineCollapsed={collapsed}
        >
            {filteredRoutes.map(route => renderMenuItem(route))}
        </Menu>
    );
};

export default MenuList;
