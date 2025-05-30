// srcs/module/pages.routes.jsx

import React from "react";
import { Outlet } from 'react-router-dom'; // <--- IMPORTANTE: Importar Outlet

// --- COMPONENTES DE PÁGINA ---
import Dashboard from "./Dashboard/dashboard";
import Roles from "./roles/roles";
import Usuarios from "./usuarios/usuarios";
import Proveedores from "./Proveedores/Proveedores";
import Empleados from "./Empleados/Empleados";
import ProductosInsumo from "./ProductoInsumo/ProductoInsumo";
import GestionComprasPage from "./Compras/GestionComprasPage";
import Clientes from "./Clientes/Clientes";
import Reservas from "./Reservas/Reservas";
import Servicios from "./Servicios/Servicios";
import ManoDeObra from "./ManoDeObra/ManoDeObra";
import Insumos from "./Insumo/Insumo";
// import OrdenProduccionForm from "./OrdenProduccion/OrdenProduccion"; // Parece que ProduccionPage es el usado
import Historial from "./OrdenProduccion/Historial";
import ProduccionPage from "./OrdenProduccion/ProduccionPage";

// --- ICONOS ---
import {
    Home, Key, UserIcon, PackageIcon, CalendarIcon, Settings, UserCog, Box as BoxIcon, ShoppingBag as ShoppingBagIcon, Clipboard as ClipboardIcon, Factory as FactoryIcon, Bell, CheckCircle, History as HistoryIcon
} from "lucide-react";

const ICON_SIZE = 18;
const SUB_ICON_SIZE = ICON_SIZE - 2;

console.log("[pages.routes.jsx] Definición de rutas cargada.");

const routes = [
  {
    path: "dashboard",
    label: "Dashboard",
    icon: <Home size={ICON_SIZE} />,
    element: <Dashboard />,
    requiredPermission: "dashboard",
  },
  {
    path: "roles",
    label: "Roles",
    icon: <Key size={ICON_SIZE} />,
    element: <Roles />,
    requiredPermission: "roles",
  },
  {
    path: "usuarios",
    label: "Usuarios",
    icon: <UserIcon size={ICON_SIZE} />,
    element: <Usuarios />,
    requiredPermission: "usuarios",
  },
  {
    path: "produccion",
    label: "Producción",
    icon: <PackageIcon size={ICON_SIZE} />,
    element: <Outlet />, // <--- AÑADIDO ELEMENT CON OUTLET
    // No 'requiredPermission' en el padre del grupo aquí, se mostrará si algún hijo es visible.
    // Si quieres controlar el grupo: requiredPermission: "produccion_module_access"
    children: [
      {
        path: "proveedores",
        label: "Proveedores",
        icon: <FactoryIcon size={SUB_ICON_SIZE} />,
        element: <Proveedores />,
        requiredPermission: "proveedores",
      },
      {
        path: "empleados",
        label: "Empleados",
        icon: <UserCog size={SUB_ICON_SIZE} />,
        element: <Empleados />,
        requiredPermission: "empleados",
      },
      {
        path: "insumo",
        label: "Insumo",
        icon: <BoxIcon size={SUB_ICON_SIZE} />,
        element: <Insumos />,
        requiredPermission: "insumo",
      },
      {
        path: "producto-insumo",
        label: "Producto Insumo",
        icon: <BoxIcon size={SUB_ICON_SIZE} />,
        element: <ProductosInsumo />,
        requiredPermission: "producto-insumo",
      },
      {
        path: "orden-produccion", // Este path puede ser solo "orden-produccion" y ProduccionPage manejar internamente si es crear o editar basado en un param
        label: "Orden de producción",
        icon: <FactoryIcon size={SUB_ICON_SIZE} />,
        element: <ProduccionPage />, // ProduccionPage podría tener un Outlet si tiene sub-rutas, o manejar params
        requiredPermission: "orden-produccion",
        // Si ProduccionPage necesita manejar rutas como /home/produccion/orden-produccion/:orderIdParam?
        // entonces este path debería ser "orden-produccion/:orderIdParam?"
        // Si ProduccionPage es solo para "crear" y "editar" es otra ruta, entonces está bien así.
      },
      {
        path: "historial",
        label: "Historial",
        icon: <HistoryIcon size={SUB_ICON_SIZE} />,
        element: <Historial />,
        requiredPermission: "orden-produccion",
      },
      {
        path: "gestion-de-compra",
        label: "Gestión de compras",
        icon: <ShoppingBagIcon size={SUB_ICON_SIZE} />,
        element: <GestionComprasPage />,
        requiredPermission: "gestion-de-compra",
      },
    ],
  },
  {
    path: "reservas",
    label: "Reservas",
    icon: <CalendarIcon size={ICON_SIZE} />,
    element: <Outlet />, // <--- AÑADIDO ELEMENT CON OUTLET
    requiredPermission: "reservas",
    children: [
      {
        path: "clientes",
        label: "Clientes",
        icon: <ClipboardIcon size={SUB_ICON_SIZE} />,
        element: <Clientes />,
        requiredPermission: "clientes",
      },
      {
        path: "lista",
        label: "Lista de Reservas",
        icon: <CheckCircle size={SUB_ICON_SIZE} />,
        element: <Reservas />,
        requiredPermission: "reservas",
      },
      {
        path: "servicios",
        label: "Servicios Adicionales",
        icon: <Bell size={SUB_ICON_SIZE} />,
        element: <Servicios />,
        requiredPermission: "servicios",
      },
    ],
  },
  {
    path: "mano-de-obra",
    label: "Mano de obra",
    icon: <Settings size={ICON_SIZE} />,
    element: <ManoDeObra />,
    requiredPermission: "mano-de-obra",
  },
];

export default routes;