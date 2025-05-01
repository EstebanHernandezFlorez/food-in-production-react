// src/components/layout/MenuList.js

import React, { useState, useEffect, useCallback } from 'react';
import { Menu } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../views/hooks/AuthProvider'; // <-- VERIFICA ESTA RUTA
import allRoutes from "../../views/module/pages.routes"; // <-- VERIFICA ESTA RUTA
import '../../assets/css/menu.css'; // <-- VERIFICA ESTA RUTA

// Este componente renderizará los iconos definidos en 'allRoutes'
const MenuList = ({ collapsed, textColor }) => {
    const { user } = useAuth();
    const location = useLocation();
    const [filteredRoutes, setFilteredRoutes] = useState([]);
    const [openKeys, setOpenKeys] = useState([]);
    const [selectedKeys, setSelectedKeys] = useState([]);

    // --- Función Recursiva para Filtrar Rutas por Permisos ---
    const filterRoutesByPermission = useCallback((routesToFilter, userPermissions) => {
        if (!userPermissions) userPermissions = [];

        return routesToFilter.reduce((allowed, route) => {
            const hasAccess = !route.requiredPermission || userPermissions.includes(route.requiredPermission);

            let filteredChildren = [];
            if (route.children) {
                filteredChildren = filterRoutesByPermission(route.children, userPermissions);
            }

            if (hasAccess && (!route.children || filteredChildren.length > 0)) {
                allowed.push({ ...route, children: filteredChildren });
            } else if (!hasAccess && route.children && filteredChildren.length > 0) {
                allowed.push({ ...route, children: filteredChildren });
            } else if (!route.requiredPermission && !route.children) {
                 allowed.push(route); // Incluir rutas públicas sin hijos
            }
            return allowed;
        }, []);
    }, []);

    // --- Efecto para recalcular las rutas filtradas ---
    useEffect(() => {
        const currentUserPermissions = user?.permissions || [];
        if (user) {
            const accessibleRoutes = filterRoutesByPermission(allRoutes, currentUserPermissions);
            setFilteredRoutes(accessibleRoutes);
        } else {
            setFilteredRoutes([]);
        }
    }, [user, filterRoutesByPermission]);

    // --- Efecto para manejar selección y apertura de submenús ---
    useEffect(() => {
        const currentPath = location.pathname;
        setSelectedKeys([currentPath]);

        if (!collapsed) {
            const pathSegments = currentPath.split('/').filter(Boolean);
            if (pathSegments.length >= 2) {
                const parentPath = `/${pathSegments[0]}/${pathSegments[1]}`;
                const parentRoute = filteredRoutes.find(r => `/home/${r.path}` === parentPath);
                if (parentRoute && parentRoute.children && parentRoute.children.length > 0) {
                     setOpenKeys(prevOpenKeys => {
                         if (!prevOpenKeys.includes(parentPath)) {
                             // return [...prevOpenKeys, parentPath]; // Mantiene otros
                             return [parentPath]; // Solo abre el actual
                         }
                         return prevOpenKeys;
                     });
                }
            }
        } else {
             setOpenKeys([]);
        }

    }, [location.pathname, filteredRoutes, collapsed]);


    // --- Funciones Auxiliares ---
    const rootSubmenuKeys = filteredRoutes
        .filter(r => r.children && r.children.length > 0)
        .map(r => `/home/${r.path}`);

    const onOpenChange = (keys) => {
        const latestOpenKey = keys.find((key) => openKeys.indexOf(key) === -1);
        if (rootSubmenuKeys.includes(latestOpenKey)) {
            setOpenKeys(latestOpenKey ? [latestOpenKey] : []);
        } else {
            setOpenKeys(keys);
        }
    };

    // --- Renderiza items y submenús recursivamente ---
    const renderMenuItem = (item, basePath = '/home') => {
        const currentPath = `${basePath}/${item.path}`.replace(/\/+/g, '/');

        // Item final (sin hijos visibles)
        if (!item.children || item.children.length === 0) {
            return (
                // El componente 'item.icon' viene de pages.routes.js
                <Menu.Item key={currentPath} icon={item.icon} /* style={{ color: textColor }} */>
                    <Link to={currentPath} style={{ textDecoration: 'none' }}>
                        {item.label}
                    </Link>
                </Menu.Item>
            );
        }

        // Submenú (con hijos visibles)
        return (
            // El componente 'item.icon' viene de pages.routes.js
            <Menu.SubMenu key={currentPath} icon={item.icon} title={item.label} /* style={{ color: textColor }} */>
                {item.children.map(child => renderMenuItem(child, currentPath))}
            </Menu.SubMenu>
        );
    };

    if (!user || filteredRoutes.length === 0) {
        return null;
    }

    return (
        <Menu
            mode="inline"
            theme="light" // Para que funcionen los estilos .ant-menu-light
            selectedKeys={selectedKeys}
            openKeys={collapsed ? [] : openKeys}
            onOpenChange={onOpenChange}
            style={{
                borderRight: 0,
                backgroundColor: 'transparent', // Hereda gradiente
            }}
            inlineCollapsed={collapsed}
        >
            {filteredRoutes.map(route => renderMenuItem(route))}
        </Menu>
    );
};

export default MenuList;
