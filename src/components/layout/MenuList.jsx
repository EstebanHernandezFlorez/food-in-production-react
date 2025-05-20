// src/components/layout/MenuList.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Menu } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../views/hooks/AuthProvider'; // Ajusta la ruta si es necesario
import allRoutesConfig from "../../views/module/pages.routes"; // Ajusta la ruta si es necesario
import '../../assets/css/menu.css'; // Ajusta la ruta si es necesario

const MenuList = ({ collapsed }) => {
    const { user, effectivePermissions, can } = useAuth();
    const location = useLocation();

    const [filteredRoutes, setFilteredRoutes] = useState([]);
    const [openKeys, setOpenKeys] = useState([]);
    const [selectedKeys, setSelectedKeys] = useState([]);

    // Función recursiva para filtrar rutas basadas en permisos
    const filterAndBuildRoutes = useCallback((routesToFilter, parentPathForLog = 'ROOT') => {
        if (!user) {
            // console.log(`[MenuList filterAndBuildRoutes for ${parentPathForLog}] No user, returning empty.`);
            return [];
        }
        if (typeof can !== 'function') {
            // console.log(`[MenuList filterAndBuildRoutes for ${parentPathForLog}] 'can' function not yet available, returning empty.`);
            return [];
        }

        if (parentPathForLog === 'ROOT') {
            // console.log("[MenuList filterAndBuildRoutes - INVOCATION START] User:", user?.email);
            // console.log("[MenuList filterAndBuildRoutes - INVOCATION START] Effective Permissions for 'can':", JSON.stringify(effectivePermissions));
        }

        return routesToFilter.reduce((allowed, route) => {
            // console.log(`[MenuList filterAndBuildRoutes for ${parentPathForLog}] Processing route: ${route.label}, Path: ${route.path}, RequiredPermission: '${route.requiredPermission}'`);

            const permissionToCheck = route.requiredPermission;
            let isRouteAccessible = true;

            if (permissionToCheck) {
                isRouteAccessible = can(permissionToCheck, "view");
                // console.log(`[MenuList filterAndBuildRoutes for ${parentPathForLog}] > Call to can('${permissionToCheck}', 'view') for route '${route.label}' -> Result: ${isRouteAccessible}`);
            } else {
                // console.log(`[MenuList filterAndBuildRoutes for ${parentPathForLog}] No requiredPermission for ${route.label}, considered accessible (if user is authenticated).`);
            }

            let processedChildren = [];
            if (route.children && route.children.length > 0) {
                // console.log(`[MenuList filterAndBuildRoutes for ${parentPathForLog}] >>>> Recursing for children of ${route.label}. Children to process:`, route.children.map(c => c.label).join(', '));
                processedChildren = filterAndBuildRoutes(route.children, route.label);
                // console.log(`[MenuList filterAndBuildRoutes for ${parentPathForLog}] <<<< Finished recursion for ${route.label}. Processed (accessible) children count: ${processedChildren.length}. Children:`, processedChildren.map(c => c.label).join(', '));
            }

            // --- INICIO DE LÓGICA DE OPCIÓN A ---
            if (isRouteAccessible) { // Si la ruta actual (padre o hoja) cumple su propio chequeo de permiso
                if (route.children) { // Si es un grupo/padre (originalmente tenía hijos)
                    if (processedChildren.length > 0) {
                        // Padre accesible Y TIENE al menos un hijo visible después del filtro
                        // console.log(`[MenuList filterAndBuildRoutes for ${parentPathForLog}] Route ${route.label} IS ACCESSIBLE and has ${processedChildren.length} visible children. Including parent with children.`);
                        allowed.push({ ...route, children: processedChildren });
                    } else {
                        // Padre accesible pero SIN hijos visibles después del filtro. No lo incluimos.
                        // console.log(`[MenuList filterAndBuildRoutes for ${parentPathForLog}] Route ${route.label} IS ACCESSIBLE but has NO visible children. Excluding parent.`);
                    }
                } else { // Es una ruta hoja (sin hijos) y es accesible
                    // console.log(`[MenuList filterAndBuildRoutes for ${parentPathForLog}] Route ${route.label} (leaf) IS ACCESSIBLE. Including.`);
                    allowed.push(route);
                }
            } else if (route.children && processedChildren.length > 0) {
                // La ruta padre NO es accesible por su propio `requiredPermission`,
                // PERO tiene hijos que SÍ lo son.
                // Se muestra el padre como un agrupador no navegable.
                // console.log(`[MenuList filterAndBuildRoutes for ${parentPathForLog}] Route ${route.label} NOT ACCESSIBLE, but has ${processedChildren.length} accessible children. Displaying as non-navigable parent.`);
                allowed.push({ ...route, path: '#', children: processedChildren });
            } else {
                // Ruta no accesible y (si tenía hijos) ninguno de sus hijos es accesible.
                // console.log(`[MenuList filterAndBuildRoutes for ${parentPathForLog}] Route ${route.label} NOT ACCESSIBLE and no accessible children (if any). Excluding.`);
            }
            // --- FIN DE LÓGICA DE OPCIÓN A ---
            return allowed;
        }, []);
    }, [user, can, effectivePermissions]);

    useEffect(() => {
        // console.log("[MenuList useEffect for filteredRoutes] Triggered. User:", user ? user.email : "No user", "Can is function:", typeof can === 'function');
        if (user && typeof can === 'function') {
            const accessibleRoutes = filterAndBuildRoutes(allRoutesConfig, 'ROOT_EFFECT_CALL');
            // console.log("[MenuList useEffect for filteredRoutes] FINAL ACCESSIBLE ROUTES from filterAndBuildRoutes:", JSON.stringify(accessibleRoutes, (key, value) => key === 'icon' || key === 'element' ? 'COMPONENT_OR_ICON' : value, 2));
            setFilteredRoutes(accessibleRoutes);
        } else {
            // console.log("[MenuList useEffect for filteredRoutes] Conditions not met. Setting empty filtered routes.");
            setFilteredRoutes([]);
        }
    }, [user, effectivePermissions, can, filterAndBuildRoutes, allRoutesConfig]);


    useEffect(() => {
        const currentPath = location.pathname;
        setSelectedKeys([currentPath]);
        let keyToOpen = '';

        const findOpenKeyRecursive = (routes, currentBasePath = '/home', parentKey = null) => {
            for (const route of routes) {
                const routeFullPath = route.path === '#' ? parentKey : `${currentBasePath}/${route.path}`.replace(/\/+/g, '/');
                if (currentPath === routeFullPath) {
                    keyToOpen = parentKey || routeFullPath;
                    return true;
                }
                if (route.children && route.children.length > 0) {
                    if (currentPath.startsWith(routeFullPath + '/')) {
                        keyToOpen = routeFullPath;
                    }
                    if (findOpenKeyRecursive(route.children, routeFullPath, routeFullPath)) {
                        return true;
                    }
                }
            }
            return false;
        };

        if (filteredRoutes.length > 0) {
            findOpenKeyRecursive(filteredRoutes);
        }

        if (!collapsed && keyToOpen) {
            setOpenKeys(prevOpenKeys => {
                if (!prevOpenKeys.includes(keyToOpen)) {
                    return [keyToOpen];
                }
                return prevOpenKeys;
            });
        } else if (collapsed) {
            setOpenKeys([]);
        }
    }, [location.pathname, filteredRoutes, collapsed]);


    const rootSubmenuKeys = useMemo(() =>
        filteredRoutes
            .filter(r => r.children && r.children.length > 0 && r.path !== '#')
            .map(r => `/home/${r.path}`.replace(/\/+/g, '/')),
    [filteredRoutes]);

    const onOpenChange = (keys) => {
        const latestOpenKey = keys.find((key) => !openKeys.includes(key));
        if (latestOpenKey && rootSubmenuKeys.includes(latestOpenKey)) {
            setOpenKeys([latestOpenKey]);
        } else {
            setOpenKeys(keys);
        }
    };

    const generateMenuItems = useCallback((routes, basePath = '/home') => {
        return routes.map(item => {
            const currentPath = item.path === '#' ? '#' : `${basePath}/${item.path}`.replace(/\/+/g, '/');
            const key = item.path === '#' ? `submenu-nonav-${item.label}-${Math.random().toString(36).substr(2, 5)}` : currentPath; // Asegurar unicidad para '#'

            const menuItem = {
                key: key,
                icon: item.icon,
            };

            if (item.children && item.children.length > 0) {
                menuItem.children = generateMenuItems(item.children, item.path === '#' ? basePath : currentPath);
                menuItem.label = item.label;
            } else if (item.path !== '#') {
                menuItem.label = (
                    <Link to={currentPath} style={{ textDecoration: 'none' }}>
                        {item.label}
                    </Link>
                );
            } else {
                return null; // Un item '#' sin hijos no debería renderizarse
            }
            return menuItem;
        }).filter(item => item !== null);
    }, []);


    const menuItems = useMemo(() => {
        return generateMenuItems(filteredRoutes);
    }, [filteredRoutes, generateMenuItems]);


    if (!user) {
        return null;
    }

    if (menuItems.length === 0) {
        // console.log("[MenuList Render] No menu items to display after processing. Rendering null or placeholder.");
        // Puedes mostrar un mensaje si lo deseas:
        // return <div style={{ padding: '10px', color: 'grey', textAlign: 'center' }}>No tiene módulos asignados.</div>;
        return null;
    }

    return (
        <Menu
            mode="inline"
            theme="light"
            selectedKeys={selectedKeys}
            openKeys={collapsed ? [] : openKeys}
            onOpenChange={onOpenChange}
            style={{
                borderRight: 0,
                backgroundColor: 'transparent',
            }}
            inlineCollapsed={collapsed}
            items={menuItems}
        />
    );
};

export default MenuList;