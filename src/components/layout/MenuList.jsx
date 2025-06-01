// src/components/layout/MenuList.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Menu } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../views/hooks/AuthProvider';
import allRoutesConfig from "../../views/module/pages.routes";
import '../../assets/css/menu.css';

const MenuList = ({ collapsed }) => {
    const { user, effectivePermissions, can, initialAuthCheckComplete } = useAuth();
    const location = useLocation();

    const [filteredRoutes, setFilteredRoutes] = useState([]);
    const [openKeys, setOpenKeys] = useState([]);
    const [selectedKeys, setSelectedKeys] = useState([]);

    const filterAndBuildRoutes = useCallback((routesToFilter) => {
        if (!user || typeof can !== 'function') return [];

        return routesToFilter.reduce((allowed, route) => {
            const permissionToCheck = route.requiredPermission;
            let isRouteAccessible = true; // Rutas sin requiredPermission son accesibles por defecto
            if (permissionToCheck) {
                isRouteAccessible = can(permissionToCheck, "view");
            }
            
            let processedChildren = [];
            if (route.children && route.children.length > 0) {
                processedChildren = filterAndBuildRoutes(route.children); // No pasar parentPathForLog si no se usa
            }

            if (isRouteAccessible) {
                if (route.children) { // Si es un grupo y es accesible
                    if (processedChildren.length > 0) { // Y tiene hijos accesibles
                        allowed.push({ ...route, children: processedChildren });
                    }
                    // Si no tiene hijos accesibles, el grupo no se añade a menos que quieras mostrar grupos vacíos
                } else { // Si es una ruta individual y es accesible
                    allowed.push(route);
                }
            } else if (route.children && processedChildren.length > 0) {
                // Si la ruta padre (grupo) no es accesible por sí misma pero tiene hijos que sí lo son
                allowed.push({ ...route, path: '#', children: processedChildren }); // El grupo se vuelve no navegable
            }
            return allowed;
        }, []);
    }, [user, can]); // effectivePermissions es usado indirectamente por 'can', así que 'can' es suficiente si su referencia es estable o si 'user' y 'effectivePermissions' son las deps de 'can'. Por seguridad, puedes añadir effectivePermissions.

    useEffect(() => {
        if (!initialAuthCheckComplete || !user || !user.role || typeof can !== 'function') {
            setFilteredRoutes([]);
            return;
        }
        
        let accessibleRoutes;
        const userActualRoleName = user.role.roleName;

        if (userActualRoleName && userActualRoleName.toLowerCase() === "cocinero") {
            console.log("[MenuList] Usuario es Cocinero. Filtrando solo para Orden de Producción.");
            const produccionGroupConfig = allRoutesConfig.find(route => route.path === "produccion");
            
            if (produccionGroupConfig && produccionGroupConfig.children) {
                const ordenProduccionRouteConfig = produccionGroupConfig.children.find(child => 
                    child.path === "orden-produccion" // Asegúrate que esta es la ruta exacta en pages.routes.jsx
                );

                if (ordenProduccionRouteConfig && can(ordenProduccionRouteConfig.requiredPermission, "view")) {
                    accessibleRoutes = [{
                        ...produccionGroupConfig,
                        label: produccionGroupConfig.label, // Mantener el label del grupo
                        icon: produccionGroupConfig.icon,   // Mantener el icono del grupo
                        path: '#', // El grupo "Producción" no será navegable directamente
                        children: [ordenProduccionRouteConfig]
                    }];
                } else {
                    console.log("[MenuList] Cocinero no tiene permiso para 'orden-produccion' o ruta no encontrada.");
                    accessibleRoutes = [];
                }
            } else {
                console.log("[MenuList] No se encontró config para 'produccion' o no tiene hijos.");
                accessibleRoutes = [];
            }
        } else {
            accessibleRoutes = filterAndBuildRoutes(allRoutesConfig);
        }
        setFilteredRoutes(accessibleRoutes);

    }, [user, effectivePermissions, can, initialAuthCheckComplete, filterAndBuildRoutes]);


    useEffect(() => {
        const currentPath = location.pathname;
        setSelectedKeys([currentPath]);
        
        if (collapsed || !filteredRoutes.length) {
            if (!collapsed) setOpenKeys([]); // Solo limpiar openKeys si no está colapsado y no hay rutas o por cambio de colapso
            return;
        }
    
        let keyToOpen = '';
        const findOpenKeyRecursive = (routes, currentBasePath = '/home', parentKey = null) => {
            for (const route of routes) {
                const routeFullPath = route.path === '#' 
                    ? (parentKey || `nonav-${route.label}-${Math.random().toString(36).substring(2,7)}`) // Clave única para no navegables
                    : `${currentBasePath}/${route.path}`.replace(/\/+/g, '/');
    
                if (currentPath === routeFullPath || (route.children && currentPath.startsWith(routeFullPath + (routeFullPath.endsWith('/') ? '' : '/')))) {
                    keyToOpen = route.path === '#' ? parentKey || routeFullPath : routeFullPath; // Si es un item de menú, su path es la key. Si es un grupo #, el parentKey (si existe) o su propia key.
                    
                    if (route.children && route.children.length > 0 && currentPath.startsWith(routeFullPath + (routeFullPath.endsWith('/') ? '' : '/'))) {
                         // Si la ruta actual es hija de este item, se busca recursivamente
                        if (findOpenKeyRecursive(route.children, routeFullPath, routeFullPath)) return true;
                    }
                    return true; 
                }
            }
            return false;
        };
        
        findOpenKeyRecursive(filteredRoutes);
    
        if (keyToOpen) {
            // Evitar re-establecer openKeys innecesariamente si ya incluye la key, o si es una key raíz diferente
            setOpenKeys(prevOpenKeys => {
                if (rootSubmenuKeys.includes(keyToOpen)) { // Es una key de un submenú raíz
                    return prevOpenKeys.includes(keyToOpen) ? prevOpenKeys : [keyToOpen];
                }
                // Para submenús anidados, podrías querer añadir a las keys abiertas existentes
                return prevOpenKeys.includes(keyToOpen) ? prevOpenKeys : [...prevOpenKeys, keyToOpen].filter((v, i, a) => a.indexOf(v) === i);
            });
        } else if (!collapsed) {
            // setOpenKeys([]); // Considera si quieres cerrar todo si no hay coincidencia directa
        }
    
    }, [location.pathname, filteredRoutes, collapsed]); // rootSubmenuKeys como dependencia si su cálculo puede cambiar y afectar esto
    

    const rootSubmenuKeys = useMemo(() =>
        filteredRoutes
            .filter(r => r.children && r.children.length > 0 && r.path !== '#') // Solo submenús con path navegable
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
            const keyForPath = item.path === '#' ? `group-${item.label}-${basePath}` : `${basePath}/${item.path}`.replace(/\/+/g, '/');
            // Clave única para items no navegables (path '#') o items con el mismo path bajo diferentes padres (raro en este setup)
            const uniqueKey = item.path === '#' ? `group-${item.label}-${(Math.random() + 1).toString(36).substring(7)}` : keyForPath;

            const menuItem = {
                key: uniqueKey,
                icon: item.icon,
                label: item.label, 
            };

            if (item.children && item.children.length > 0) {
                // Si el path es '#', los hijos se generan desde el mismo basePath del padre (grupo)
                // Si el path no es '#', los hijos se generan desde el currentPath del padre
                menuItem.children = generateMenuItems(item.children, item.path === '#' ? basePath : keyForPath);
            } else if (item.path !== '#') { 
                menuItem.label = (
                    <Link to={keyForPath} style={{ textDecoration: 'none' }}>
                        {item.label}
                    </Link>
                );
            } else if (item.path === '#' && (!item.children || item.children.length === 0)) {
                return null; // Agrupador sin path y sin hijos visibles, no renderizar
            }
            
            return menuItem;
        }).filter(item => item !== null); // Filtrar los nulos
    }, []);


    const menuItems = useMemo(() => {
        return generateMenuItems(filteredRoutes);
    }, [filteredRoutes, generateMenuItems]);

    if (!initialAuthCheckComplete || !user || !user.role) { // Esperar carga y datos de usuario
        return null; // O un loader si se prefiere
    }
    
    const userActualRoleName = user.role.roleName;
    const isCocineroRole = userActualRoleName && userActualRoleName.toLowerCase() === "cocinero";

    // Para el cocinero, si el Sider estuviera visible pero no hay items (por ej. sin permiso a OrdenProd), no mostrar nada.
    if (isCocineroRole && menuItems.length === 0) {
        return null; 
    }
    
    // Mensaje para otros roles si no tienen módulos asignados
    if (!isCocineroRole && menuItems.length === 0 && initialAuthCheckComplete && user) {
        // Podrías verificar también !authLoading.isSuperAdmin o similar si tienes esa lógica.
        return <div style={{ padding: '20px', color: '#5C4033', textAlign: 'center', fontSize: '0.9em' }}>No tiene módulos asignados.</div>;
    }
    
    // Solo renderizar el Menú si hay items
    if (menuItems.length > 0) {
        return (
            <Menu
                mode="inline"
                theme="light" // O la que uses
                selectedKeys={selectedKeys}
                openKeys={collapsed ? [] : openKeys}
                onOpenChange={onOpenChange}
                style={{
                    borderRight: 0,
                    backgroundColor: 'transparent', 
                }}
                inlineCollapsed={collapsed}
                items={menuItems}
                className="menu-list-container"
            />
        );
    }

    return null; // Fallback si no hay items y no es cocinero (o si es cocinero y no tiene items)
};

export default MenuList;