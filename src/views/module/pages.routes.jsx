// src/views/module/pages.routes.jsx

import React from "react";
// --- COMPONENTES DE PÁGINA (Verifica que estén bien importados) ---
import Dashboard from "./Dashboard/dashboard";
import Roles from "./roles/roles";
import Usuarios from "./usuarios/usuarios";
import Proveedores from "./Proveedores/Proveedores";
import Empleados from "./Empleados/Empleados";
import ProductosInsumo from "./ProductoInsumo/ProductoInsumo";
// 🚨 Importa el componente correcto para Orden de Producción si existe
// import OrdenProduccion from "./Produccion/OrdenProduccion";
import GestionComprasPage from "./Compras/GestionComprasPage";
import Clientes from "./Clientes/Clientes";
import Reservas from "./Reservas/Reservas"; // Componente para la lista de reservas
import Servicios from "./Servicios/Servicios";
import ManoDeObra from "./ManoDeObra/ManoDeObra";
import Insumos from "./Insumo/Insumo";
import OrdenProduccion from "./OrdenProduccion/OrdenProduccion"; // Asegúrate que este es el componente correcto para "Producción"
import Historial from "./OrdenProduccion/Historial"; // Asegúrate que este es el componente correcto para "Historial"
// --- FIN IMPORTS ---

// --- ICONOS ---
import {
    Home, Key, UserIcon, PackageIcon, CalendarIcon, Settings, UserCog, Box as BoxIcon, ShoppingBag as ShoppingBagIcon, Clipboard as ClipboardIcon, Factory as FactoryIcon, Bell, CheckCircle,
} from "lucide-react";

const ICON_SIZE = 18;
const SUB_ICON_SIZE = ICON_SIZE - 2;

// --- DEFINICIÓN DE RUTAS CON PERMISOS REQUERIDOS (Strings literales) ---
// --- ¡¡¡IMPORTANTE!!! Estos strings DEBEN COINCIDIR EXACTAMENTE ---
// --- con los que genera tu backend en user.permissions ---
const routes = [
  {
    path: "dashboard",
    label: "Dashboard",
    icon: <Home size={ICON_SIZE} />,
    element: <Dashboard />,
    requiredPermission: "dashboard-view", // <-- String literal
  },
  {
    path: "roles",
    label: "Roles",
    icon: <Key size={ICON_SIZE} />,
    element: <Roles />,
    requiredPermission: "roles-view", // <-- String literal
  },
  {
    path: "usuarios",
    label: "Usuarios",
    icon: <UserIcon size={ICON_SIZE} />,
    element: <Usuarios />,
    requiredPermission: "usuarios-view", // <-- String literal
  },
  {
    // --- GRUPO: PRODUCCIÓN ---
    path: "produccion",
    label: "Producción",
    icon: <PackageIcon size={ICON_SIZE} />,
    // Sin requiredPermission aquí, se mostrará si algún hijo es visible.
    // Opcional: Añade requiredPermission: "produccion-view" si quieres controlar el grupo entero.
    children: [
      {
        path: "proveedores",
        label: "Proveedores",
        icon: <FactoryIcon size={SUB_ICON_SIZE} />,
        element: <Proveedores />,
        requiredPermission: "proveedores-view", // <-- String literal
      },
      {
        path: "empleados",
        label: "Empleados",
        icon: <UserCog size={SUB_ICON_SIZE} />,
        element: <Empleados />,
        // 🚨 Asegúrate que 'empleados-view' existe como permiso en tu BD/Backend
        requiredPermission: "empleados-view", // <-- String literal
      },
      {
        path: "insumo",
        label: "Insumo",
        icon: <BoxIcon size={SUB_ICON_SIZE} />,
        element: <Insumos />,
        requiredPermission: "insumo-view", // <-- String literal
      },
      {
        path: "producto_insumo",
        label: "Producto Insumo",
        icon: <BoxIcon size={SUB_ICON_SIZE} />,
        element: <ProductosInsumo />,
        requiredPermission: "producto-insumo-view", // <-- String literal
      },
      {
        path: "orden-produccion",
        label: "Orden de producción",
        icon: <FactoryIcon size={SUB_ICON_SIZE} />,
        element: <OrdenProduccion />,
        requiredPermission: "orden-produccion-view", // <-- String literal
      },
      {
        path: "Historial",
        label: "Historial",
        icon: <FactoryIcon size={SUB_ICON_SIZE} />,
        element: <Historial />,
        requiredPermission: "orden-produccion-view", // <-- String literal
      },
      {
        path: "gestion-de-compra",
        label: "Gestión de compras",
        icon: <ShoppingBagIcon size={SUB_ICON_SIZE} />,
        element: <GestionComprasPage />,
        requiredPermission: "gestion-de-compra-view", // <-- String literal
      },
    ],
  },
  {
    // --- GRUPO: RESERVAS ---
    path: "reservas",
    label: "Reservas",
    icon: <CalendarIcon size={ICON_SIZE} />,
    // Permiso para ver la sección general de Reservas
    requiredPermission: "reservas-view", // <-- String literal (controla visibilidad del grupo)
    children: [
      {
        path: "clientes",
        label: "Clientes",
        icon: <ClipboardIcon size={SUB_ICON_SIZE} />,
        element: <Clientes />,
        requiredPermission: "clientes-view", // <-- String literal
      },
      {
        // Ruta para ver la lista de reservas
        path: "lista", // URL -> /home/reservas/lista
        label: "Ver Reservas",
        icon: <CheckCircle size={SUB_ICON_SIZE} />,
        element: <Reservas />, // Componente que muestra la lista
        // Usa el mismo permiso general o uno específico si es necesario
        requiredPermission: "reservas-view", // <-- String literal (reutilizado)
      },
      {
        path: "servicios",
        label: "Servicios",
        icon: <Bell size={SUB_ICON_SIZE} />,
        element: <Servicios />,
        requiredPermission: "servicios-view", // <-- String literal
      },
    ],
  },
  {
    path: "mano-de-obra",
    label: "Mano de obra",
    icon: <Settings size={ICON_SIZE} />,
    element: <ManoDeObra />,
    requiredPermission: "mano-de-obra-view", // <-- String literal
  },
];

export default routes;