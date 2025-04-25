// src/components/layout/MenuList.js (Implementando Opción A)

import React, { useState, useEffect } from 'react';
import { Menu } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../views/hooks/AuthProvider'; // <-- Verifica/Ajusta esta ruta
import allRoutes from "../../views/module/pages.routes"; // <-- Verifica/Ajusta esta ruta
import '../../menu.css'; // Tus estilos

// --- CONSTANTES DE ROLES (Asegúrate que coincidan con tu BD/Backend) ---
const ROLES = {
    ADMIN: 1,     // Rol de Administrador
    AUX: 2,       // Rol Auxiliar (o como lo llames)
    // Agrega otros roles si existen
};
// -----------------------------------------------------------------------

const MenuList = ({ collapsed, backgroundColor, textColor }) => {
    // Obtiene el usuario del contexto de autenticación
    const { user } = useAuth();
    // Hook para obtener la ubicación actual (ruta)
    const location = useLocation();
    // Estado para almacenar las rutas filtradas según el rol
    const [filteredRoutes, setFilteredRoutes] = useState([]);
    // Estado para controlar qué submenús están abiertos
    const [openKeys, setOpenKeys] = useState([]);
    // Estado para controlar qué item del menú está seleccionado
    const [selectedKeys, setSelectedKeys] = useState([]);

    // --- Efecto para filtrar las rutas basado en el rol del usuario ---
    useEffect(() => {
        let currentRoutes = [];
        console.log("MenuList useEffect triggered. User object:", user); // LOG 1

        // Verifica que 'user' exista, que tenga la propiedad 'role', y que 'role' tenga la propiedad 'id'
        if (user && user.role && user.role.id !== undefined && user.role.id !== null) {
            // Accede al ID del rol desde DENTRO del objeto user.role
            const userRoleId = user.role.id;
            console.log("Raw user.role.id value:", userRoleId); // LOG 2
            console.log("Type of user.role.id:", typeof userRoleId); // LOG 3

            // Intenta convertir a número (por si acaso, aunque debería ser number)
            const userRole = Number(userRoleId);
            console.log("Converted userRole (Number):", userRole); // LOG 4

            // Realiza las comparaciones con los IDs de ROLES
            const isAdmin = userRole === ROLES.ADMIN;
            const isAux = userRole === ROLES.AUX;
            console.log(`Is Admin (${ROLES.ADMIN})?`, isAdmin); // LOG 5
            console.log(`Is Aux (${ROLES.AUX})?`, isAux);       // LOG 6

            // Aplica la lógica de filtrado
            if (isAdmin) {
                console.log("Condition: ADMIN matched.");
                currentRoutes = allRoutes; // Admin ve todo
            } else if (isAux) {
                console.log("Condition: AUX matched. Filtering for 'dashboard' and 'reservas'.");
                // Auxiliar ve solo 'dashboard' y 'reservas' (y sus hijos)
                // Asegúrate que los 'path' en pages.routes.js sean exactos
                currentRoutes = allRoutes.filter(route =>
                    route.path === 'dashboard' || route.path === 'reservas'
                );
            } else {
                 // Rol no reconocido explícitamente
                 console.warn(`Condition: No specific role matched (ADMIN or AUX). Role ID was ${userRole}. Falling back to dashboard.`);
                 currentRoutes = allRoutes.filter(route => route.path === 'dashboard');
            }
        } else {
             // No hay usuario, o falta el objeto 'role', o falta 'role.id'
             console.log("Condition: User object, user.role, or user.role.id is missing or null/undefined. No routes will be shown.");
             currentRoutes = []; // No mostrar nada
        }

        // Actualiza el estado con las rutas filtradas
        setFilteredRoutes(currentRoutes);
        console.log("Final Filtered Routes:", currentRoutes); // LOG 7

    // Este efecto se re-ejecuta cada vez que el objeto 'user' cambia
    }, [user]);

    // --- Efecto para manejar la selección del menú y los submenús abiertos basado en la ruta actual ---
    useEffect(() => {
        const currentPath = location.pathname;
        // Establece la clave seleccionada basada en la ruta actual
        setSelectedKeys([currentPath]);

        // Lógica para intentar abrir el submenú padre si estamos en una ruta hija
        const pathSegments = currentPath.split('/'); // ej: ['', 'home', 'reservas', 'clientes']
        if (pathSegments.length > 3) { // Si estamos en una ruta más profunda que /home/segmento
             const parentPath = `/${pathSegments[1]}/${pathSegments[2]}`; // Construye /home/segmento
             // Verifica si este parentPath corresponde a un submenú en las rutas filtradas
             const parentRoute = filteredRoutes.find(r => `/home/${r.path}` === parentPath && r.children);
             if (parentRoute && !collapsed) { // Solo abre si no está colapsado
                // Verifica si este submenú no está ya abierto para evitar bucles
                if (!openKeys.includes(parentPath)) {
                     setOpenKeys([parentPath]);
                }
             }
        } else if (!collapsed) {
            // Si estamos en una ruta de nivel superior o el dashboard, podríamos cerrar otros submenús
            // setOpenKeys([]); // Descomentar si quieres que se cierren al navegar a nivel superior
        }

    // Este efecto depende de la ruta actual y de las rutas filtradas (por si cambian con el rol)
    // También depende de 'collapsed' para no intentar abrir submenús si está colapsado
    }, [location.pathname, filteredRoutes, collapsed, openKeys]); // Añadido openKeys para evitar bucle potencial


    // --- Funciones Auxiliares ---

    // Obtiene las claves de los submenús raíz de las rutas filtradas
    const rootSubmenuKeys = filteredRoutes.filter(r => r.children).map(r => `/home/${r.path}`);

    // Manejador para cuando se abre/cierra un submenú (evita múltiples abiertos simultáneamente)
    const onOpenChange = (keys) => {
        const latestOpenKey = keys.find((key) => openKeys.indexOf(key) === -1);
        // Si la clave que se intenta abrir no es un submenú raíz O no se encontró una nueva clave, usa las claves actuales
        if (rootSubmenuKeys.indexOf(latestOpenKey) === -1) {
            setOpenKeys(keys);
        } else {
            // Si es un submenú raíz, mantén solo ese abierto
            setOpenKeys(latestOpenKey ? [latestOpenKey] : []);
        }
    };

    // Función recursiva para renderizar los items y submenús
    const renderMenuItem = (item, basePath = '/home') => {
        // Construye la ruta completa para el item actual
        const currentPath = `${basePath}/${item.path}`.replace(/\/+/g, '/'); // Limpia slashes duplicados

        // Si no tiene hijos, es un item final
        if (!item.children || item.children.length === 0) {
            return (
                <Menu.Item key={currentPath} icon={item.icon}>
                    <Link to={currentPath} style={{ textDecoration: 'none' }}>
                        {item.label}
                    </Link>
                </Menu.Item>
            );
        }

        // Si tiene hijos, es un submenú
        return (
            <Menu.SubMenu key={currentPath} icon={item.icon} title={item.label}>
                {/* Llama recursivamente para renderizar los hijos */}
                {item.children.map(child => renderMenuItem(child, currentPath))}
            </Menu.SubMenu>
        );
    };
    // -------------------------------------------------------------

    // --- Renderizado del Componente ---

    // Si después de filtrar no hay rutas (o no hay usuario), no renderiza el menú
    if (!filteredRoutes || filteredRoutes.length === 0) {
         console.log("No hay rutas filtradas para mostrar en el menú. Renderizando null.");
        return null;
    }

    console.log("Renderizando menú con las rutas filtradas:", filteredRoutes);
    // Renderiza el componente Menu de Ant Design
    return (
        <Menu
            mode="inline" // Menú vertical
            theme="light" // O el tema que uses ('dark')
            selectedKeys={selectedKeys} // Items seleccionados actualmente
            openKeys={collapsed ? [] : openKeys} // Submenús abiertos (ninguno si está colapsado)
            onOpenChange={onOpenChange} // Función para manejar apertura/cierre de submenús
            style={{
                borderRight: 0, // Quita borde derecho por defecto
                backgroundColor: backgroundColor || 'transparent', // Aplica color de fondo pasado por props
                // Puedes añadir 'color: textColor' si necesitas forzar color de texto
            }}
            inlineCollapsed={collapsed} // Controla si el menú está colapsado
            // items={filteredRoutes.map(route => renderMenuItem(route))} // Alternativa si usas la prop 'items'
        >
            {/* Mapea las rutas filtradas para renderizar cada item/submenú */}
            {filteredRoutes.map(route => renderMenuItem(route))}
        </Menu>
    );
};

export default MenuList;