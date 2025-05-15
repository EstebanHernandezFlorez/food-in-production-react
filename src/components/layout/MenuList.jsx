// src/components/layout/MenuList.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Menu } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../views/hooks/AuthProvider'; // Ajusta la ruta si es necesario
import allRoutesConfig from "../../views/module/pages.routes"; // Ajusta la ruta si es necesario
import '../../assets/css/menu.css'; // Ajusta la ruta si es necesario

const MenuList = ({ collapsed }) => {
    const { user, effectivePermissions, can } = useAuth(); // Obtener 'can' y 'effectivePermissions'
    const location = useLocation();

    const [filteredRoutes, setFilteredRoutes] = useState([]);
    const [openKeys, setOpenKeys] = useState([]);
    const [selectedKeys, setSelectedKeys] = useState([]);

    const filterAndBuildRoutes = useCallback((routesToFilter) => {
        if (!user) { // Si no hay usuario, no mostrar nada (o solo rutas 100% públicas si las tuvieras aquí)
            // console.log("MenuList filter: No user, returning empty routes.");
            return [];
        }
        // Si no hay `can` (ej. durante la carga inicial de AuthProvider), no procesar aún.
        if (typeof can !== 'function') {
            // console.log("MenuList filter: 'can' function not available yet.");
            return [];
        }

        // console.log("MenuList filter: Starting filtering with user and 'can' function.");
        return routesToFilter.reduce((allowed, route) => {
            // Para que un item de menú se muestre, el usuario necesita el privilegio "view" para ese módulo.
            // Si route.requiredPermission no está definido, se asume que es una ruta "pública" dentro del layout.
            const isRouteAccessible = route.requiredPermission
                ? can(route.requiredPermission, "view") // Asumimos "view" para la visibilidad del menú
                : true; // Ruta sin permiso requerido es visible por defecto (dentro de un layout autenticado)

            let processedChildren = [];
            if (route.children && route.children.length > 0) {
                processedChildren = filterAndBuildRoutes(route.children);
            }

            if (isRouteAccessible) {
                // Si la ruta principal es accesible
                if (route.children) {
                    // Si es un grupo (tiene hijos originalmente), lo incluimos con sus hijos filtrados.
                    // Incluso si todos los hijos son filtrados, el grupo (si es accesible) se muestra.
                    // El componente Menu de Antd manejará si se muestra vacío o no.
                    allowed.push({ ...route, children: processedChildren });
                } else {
                    // Es una ruta hoja y es accesible
                    allowed.push(route);
                }
            } else if (route.children && processedChildren.length > 0) {
                // La ruta principal NO es accesible, PERO tiene hijos que SÍ lo son.
                // Mostramos el padre como un agrupador no navegable.
                allowed.push({ ...route, path: '#', children: processedChildren });
            }
            return allowed;
        }, []);
    }, [user, can]); // Dependencias: user y can (effectivePermissions es dependencia de 'can')

    useEffect(() => {
        // console.log("MenuList Effect (user, can, allRoutesConfig): Recalculating filteredRoutes.");
        // console.log("Current user:", user);
        // console.log("Current effectivePermissions:", effectivePermissions);
        // console.log("Is 'can' a function?", typeof can === 'function');

        if (user && typeof can === 'function') { // Asegurarse que 'can' está listo
            const accessibleRoutes = filterAndBuildRoutes(allRoutesConfig);
            // console.log("MenuList: Routes after filtering:", accessibleRoutes);
            setFilteredRoutes(accessibleRoutes);
        } else {
            // console.log("MenuList: No user or 'can' not ready, setting empty filtered routes.");
            setFilteredRoutes([]);
        }
    }, [user, effectivePermissions, can, filterAndBuildRoutes]); // effectivePermissions agregado como dependencia porque 'can' depende de él.

    useEffect(() => {
        const currentPath = location.pathname;
        setSelectedKeys([currentPath]);

        let keyToOpen = '';
        const findOpenKey = (routes, currentBasePath = '/home') => {
            for (const route of routes) {
                const routeFullPath = `${currentBasePath}/${route.path}`.replace(/\/+/g, '/');
                if (route.children && route.children.length > 0) {
                    if (currentPath.startsWith(routeFullPath + '/') || currentPath === routeFullPath) {
                        keyToOpen = routeFullPath;
                    }
                    if (findOpenKey(route.children, routeFullPath)) {
                        return true;
                    }
                } else if (currentPath === routeFullPath) {
                    // Si es una ruta hoja, el keyToOpen podría ser su padre si existe
                    // Esto es más complejo; por ahora, nos enfocamos en los padres de submenús.
                    // La lógica actual busca el padre de un submenú activo.
                }
            }
            return false;
        };

        if (filteredRoutes.length > 0) {
            findOpenKey(filteredRoutes);
        }
        
        if (!collapsed) {
            if (keyToOpen) { // Si se encontró una clave para abrir
                setOpenKeys(prevOpenKeys => {
                    // Solo actualiza si la nueva keyToOpen no está ya o es diferente
                    if (!prevOpenKeys.includes(keyToOpen)) return [keyToOpen];
                    return prevOpenKeys;
                });
            }
            // Si no se encuentra keyToOpen y no está colapsado, ¿qué hacer?
            // Podríamos querer mantener las openKeys si el usuario navegó a una ruta no en el menú
            // o colapsar todo. Por ahora, si no hay keyToOpen, no cambia openKeys.
        } else {
            setOpenKeys([]);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname, filteredRoutes, collapsed]);


    const rootSubmenuKeys = useMemo(() =>
        filteredRoutes
            .filter(r => r.children && r.children.length > 0 && r.path !== '#') // Solo submenús navegables
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
            const key = currentPath === '#' ? `submenu-${item.label}-${Math.random()}` : currentPath; // Clave única para submenús no navegables

            const menuItem = {
                key: key,
                icon: item.icon,
                label: item.label,
            };

            if (item.children && item.children.length > 0) {
                menuItem.children = generateMenuItems(item.children, currentPath === '#' ? basePath : currentPath); // Si el padre es '#', los hijos mantienen el basePath original
                // No necesita Link si es un submenú con hijos
            } else if (item.path !== '#') { // Es una hoja navegable
                menuItem.label = (
                    <Link to={currentPath} style={{ textDecoration: 'none' }}>
                        {item.label}
                    </Link>
                );
            } else { // Es un item con path '#' pero sin hijos (probablemente no debería llegar aquí si se filtra bien)
                return null;
            }
            return menuItem;
        }).filter(item => item !== null);
    }, []);

    const menuItems = useMemo(() => {
        // console.log("MenuList useMemo for menuItems: Regenerating with filteredRoutes:", filteredRoutes);
        return generateMenuItems(filteredRoutes);
    }, [filteredRoutes, generateMenuItems]);
        // Submenú (con hijos visibles)
        return (
            // El componente 'item.icon' viene de pages.routes.js
            <Menu.SubMenu key={currentPath} icon={item.icon} title={item.label} /* style={{ color: textColor }} */>
                {item.children.map(child => renderMenuItem(child, currentPath))}
            </Menu.SubMenu>
        );
    };

    // Renderizado condicional
    if (!user) { // Si no hay usuario, no mostrar menú
        // console.log("MenuList Render: No user, rendering null.");
        return null;
    }
    // Si hay usuario pero no hay permisos cargados (estado intermedio) O no hay items de menú
    if ((!effectivePermissions || Object.keys(effectivePermissions).length === 0) && menuItems.length === 0 && !user.isAdmin) { // isAdmin es un ejemplo, puedes tener otra lógica para roles sin permisos explícitos
        // console.log("MenuList Render: User exists, but no permissions or no menu items. Rendering null.", { effectivePermissions, menuItems });
        // Podrías mostrar un mensaje o un menú mínimo si es necesario
        // return <small>Cargando permisos o sin acceso a módulos...</small>;
        // return null; // Para no mostrar nada
    }
    if (menuItems.length === 0) {
        // console.log("MenuList Render: No menu items to display, rendering null.");
        return null;
    }
    // console.log("MenuList Render: Rendering Antd Menu with items:", menuItems);
    // console.log("SelectedKeys:", selectedKeys, "OpenKeys:", collapsed ? [] : openKeys);

    return (
        <Menu
            mode="inline"
            theme="light" // O tu tema preferido
            selectedKeys={selectedKeys}
            openKeys={collapsed ? [] : openKeys}
            onOpenChange={onOpenChange}
            style={{
                borderRight: 0,
                backgroundColor: 'transparent', // O tu color de fondo
            }}
            inlineCollapsed={collapsed}
            items={menuItems}
        />
    );
};

export default MenuList;
