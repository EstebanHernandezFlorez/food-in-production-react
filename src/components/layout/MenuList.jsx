// src/components/layout/MenuList.js

'use strict';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../views/hooks/AuthProvider';
import allRoutesConfig from "../../views/module/pages.routes";
import '../../assets/css/menu.css';

const MenuList = ({ collapsed }) => {
    const { user, can, initialAuthCheckComplete } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const [filteredRoutes, setFilteredRoutes] = useState([]);
    const [openKeys, setOpenKeys] = useState([]);
    const [selectedKeys, setSelectedKeys] = useState([]);

    const handleMenuClick = ({ key }) => {
        if (key && key.includes('/')) {
            navigate(key);
        }
    };

    // Esta función está bien como está, la dejamos igual.
    const filterAndBuildRoutes = useCallback((routesToFilter) => {
        if (!user || typeof can !== 'function') {
            return [];
        }
        
        const ADMIN_ROLE_ID = 1;

        return routesToFilter.reduce((allowed, route) => {
            const isAdminOnlyRoute = route.path === 'dashboard' || route.path === 'historial';
            const isUserAdmin = user.idRole === ADMIN_ROLE_ID;

            if (isAdminOnlyRoute && !isUserAdmin) {
                return allowed; 
            }

            const permissionToCheck = route.requiredPermission;
            let isRouteAccessible = !permissionToCheck || can(permissionToCheck, "view");
            
            let processedChildren = [];
            if (route.children && route.children.length > 0) {
                processedChildren = filterAndBuildRoutes(route.children);
            }

            if (isRouteAccessible) {
                if (route.children) {
                    if (processedChildren.length > 0) {
                        allowed.push({ ...route, children: processedChildren });
                    }
                } else {
                    allowed.push(route);
                }
            } else if (route.children && processedChildren.length > 0) {
                allowed.push({ ...route, children: processedChildren });
            }
            
            return allowed;
        }, []);
    }, [can, user]);

    // Este useEffect está bien, no causa el bucle.
    useEffect(() => {
        if (!initialAuthCheckComplete || !user) {
            setFilteredRoutes([]);
            return;
        }
        setFilteredRoutes(filterAndBuildRoutes(allRoutesConfig));
    }, [user, can, initialAuthCheckComplete, filterAndBuildRoutes]);
    
    // *** CORRECCIÓN APLICADA AQUÍ ***
    useEffect(() => {
        const currentPath = location.pathname;
        setSelectedKeys([currentPath]);

        // Si el menú está colapsado, usamos la forma funcional para asegurarnos
        // de que solo actualizamos si es necesario y rompemos el bucle.
        if (collapsed) {
            setOpenKeys(prevKeys => (prevKeys.length > 0 ? [] : prevKeys));
            return;
        }

        const parentRoute = filteredRoutes.find(route => 
            route.children && currentPath.startsWith(`/home/${route.path}`)
        );

        if (parentRoute) {
            const parentKey = `/home/${parentRoute.path}`;
            // Usamos la forma funcional de setState. Obtenemos los `prevKeys`
            // y solo devolvemos un nuevo array si la clave no está incluida.
            setOpenKeys(prevKeys => {
                if (!prevKeys.includes(parentKey)) {
                    return [parentKey];
                }
                return prevKeys; // Si ya existe, devolvemos el estado anterior para no re-renderizar.
            });
        }
        // Hemos eliminado 'openKeys' del array de dependencias para romper el bucle infinito.
    }, [location.pathname, filteredRoutes, collapsed]);

    // Esta función memoizada está bien.
    const generateMenuItems = useCallback((routes, basePath = '/home') => {
        return routes.map(item => {
            const itemPath = `${basePath}/${item.path}`.replace(/\/+/g, '/');
            const menuItem = {
                key: itemPath,
                icon: item.icon,
                label: item.label,
            };
            if (item.children && item.children.length > 0) {
                menuItem.children = generateMenuItems(item.children, itemPath);
            }
            if (!menuItem.children && item.children) {
                return null;
            }
            return menuItem;
        }).filter(item => item !== null);
    }, []);

    // Esta memoización está bien.
    const menuItems = useMemo(() => {
        return generateMenuItems(filteredRoutes);
    }, [filteredRoutes, generateMenuItems]);

    // El resto del componente está bien...
    if (!initialAuthCheckComplete || !user) {
        return null;
    }

    if (menuItems.length === 0 && user.role?.roleName?.toLowerCase() !== "cocinero") {
        return <div style={{ padding: '20px', color: '#5C4033', textAlign: 'center', fontSize: '0.9em' }}>No tiene módulos asignados.</div>;
    }
    
    if (menuItems.length === 0) {
        return null;
    }
    
    return (
        <Menu
            mode="inline"
            theme="light"
            selectedKeys={selectedKeys}
            openKeys={openKeys}
            onOpenChange={setOpenKeys}
            onClick={handleMenuClick}
            style={{
                borderRight: 0,
                backgroundColor: 'transparent',
            }}
            inlineCollapsed={collapsed}
            items={menuItems}
            className="menu-list-container"
        />
    );
};

export default MenuList;