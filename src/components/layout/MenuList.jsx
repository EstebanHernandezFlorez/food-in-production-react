'use strict';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../views/hooks/AuthProvider';
import allRoutesConfig from "../../views/module/pages.routes";
import '../../assets/css/menu.css';

const MenuList = ({ collapsed }) => {
    const { user, can, initialAuthCheckComplete, effectivePermissions } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const [filteredRoutes, setFilteredRoutes] = useState([]);
    const [openKeys, setOpenKeys] = useState([]);
    const [selectedKeys, setSelectedKeys] = useState([]);

    // --- MANEJADOR DE CLICS PARA NAVEGACIÓN ---
    // No necesita cambios, funciona con las keys corregidas.
    const handleMenuClick = ({ key }) => {
        // La key es la ruta a navegar. Los grupos no tienen un path navegable, así que no se navega.
        if (key && key.includes('/')) { // Solo navega si la key es una ruta válida
            navigate(key);
        }
    };

    // --- LÓGICA DE FILTRADO DE RUTAS ---
    // No necesita cambios.
    const filterAndBuildRoutes = useCallback((routesToFilter) => {
        if (!user || typeof can !== 'function') return [];
        return routesToFilter.reduce((allowed, route) => {
            const permissionToCheck = route.requiredPermission;
            let isRouteAccessible = !permissionToCheck || can(permissionToCheck, "view");
            let processedChildren = [];
            if (route.children && route.children.length > 0) {
                processedChildren = filterAndBuildRoutes(route.children);
            }
            if (isRouteAccessible) {
                if (route.children) {
                    if (processedChildren.length > 0) allowed.push({ ...route, children: processedChildren });
                } else {
                    allowed.push(route);
                }
            } else if (route.children && processedChildren.length > 0) {
                allowed.push({ ...route, children: processedChildren });
            }
            return allowed;
        }, []);
    }, [can, user]);

    // --- EFECTO PARA FILTRAR RUTAS SEGÚN ROL Y PERMISOS ---
    // No necesita cambios.
    useEffect(() => {
        if (!initialAuthCheckComplete || !user) {
            setFilteredRoutes([]);
            return;
        }
        const userActualRoleName = user.role?.roleName;
        if (userActualRoleName && userActualRoleName.toLowerCase() === "cocinero") {
            const produccionGroupConfig = allRoutesConfig.find(route => route.path === "produccion");
            if (produccionGroupConfig && produccionGroupConfig.children) {
                const ordenProduccionRouteConfig = produccionGroupConfig.children.find(child => child.path === "orden-produccion");
                if (ordenProduccionRouteConfig && can(ordenProduccionRouteConfig.requiredPermission, "view")) {
                    setFilteredRoutes([{ ...produccionGroupConfig, children: [ordenProduccionRouteConfig] }]);
                } else { setFilteredRoutes([]); }
            } else { setFilteredRoutes([]); }
        } else {
            setFilteredRoutes(filterAndBuildRoutes(allRoutesConfig));
        }
    }, [user, can, initialAuthCheckComplete, filterAndBuildRoutes, effectivePermissions]);
    
    // --- EFECTO PARA SINCRONIZAR ESTADO DEL MENÚ CON LA RUTA URL ---
    useEffect(() => {
        const currentPath = location.pathname;
        setSelectedKeys([currentPath]);

        if (collapsed) {
            setOpenKeys([]); // En modo colapsado, AntD maneja los popups, no necesitamos openKeys.
            return;
        }

        // Encuentra la ruta del submenú padre de la ruta actual para mantenerlo abierto.
        const parentRoute = filteredRoutes.find(route => 
            route.children && currentPath.startsWith(`/home/${route.path}`)
        );

        if (parentRoute) {
            const parentKey = `/home/${parentRoute.path}`;
            setOpenKeys([parentKey]);
        } else {
            setOpenKeys([]); // Cierra otros menús si la ruta no pertenece a ninguno.
        }

    }, [location.pathname, filteredRoutes, collapsed]);

    // --- CORRECCIÓN CLAVE: GENERAR ITEMS CON KEYS ESTABLES Y CORRECTAS ---
    const generateMenuItems = useCallback((routes, basePath = '/home') => {
        return routes.map(item => {
            // La 'key' ahora siempre es la ruta completa. Esto es crucial.
            const itemPath = `${basePath}/${item.path}`.replace(/\/+/g, '/');

            const menuItem = {
                key: itemPath, // <-- Key estable y significativa.
                icon: item.icon,
                label: item.label,
            };

            // Si tiene hijos, se generan recursivamente.
            if (item.children && item.children.length > 0) {
                menuItem.children = generateMenuItems(item.children, itemPath);
            }
            
            // Si el item no es un grupo (no tiene hijos), es un item final.
            // Si es un grupo pero no tiene hijos visibles (por permisos), no se renderiza.
            if (!menuItem.children && item.children) {
                return null;
            }

            return menuItem;
        }).filter(item => item !== null); // Filtra los grupos que quedaron vacíos.
    }, []);

    const menuItems = useMemo(() => {
        return generateMenuItems(filteredRoutes);
    }, [filteredRoutes, generateMenuItems]);

    if (!initialAuthCheckComplete || !user) {
        return null; // No mostrar nada mientras carga.
    }

    // Mensaje si un usuario (no cocinero) no tiene módulos.
    if (menuItems.length === 0 && user.role?.roleName?.toLowerCase() !== "cocinero") {
        return <div style={{ padding: '20px', color: '#5C4033', textAlign: 'center', fontSize: '0.9em' }}>No tiene módulos asignados.</div>;
    }
    
    // Si no hay items, no renderizar el menú.
    if (menuItems.length === 0) {
        return null;
    }
    
    return (
        <Menu
            mode="inline"
            theme="light"
            selectedKeys={selectedKeys}
            openKeys={openKeys} // 'openKeys' se vacía automáticamente cuando 'collapsed' es true.
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