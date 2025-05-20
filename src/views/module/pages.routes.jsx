// srcs/module/pages.routes.jsx

import React from "react";
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
import OrdenProduccion from "./OrdenProduccion/OrdenProduccion";
import Historial from "./OrdenProduccion/Historial";

// --- ICONOS ---
import {
    Home, Key, UserIcon, PackageIcon, CalendarIcon, Settings, UserCog, Box as BoxIcon, ShoppingBag as ShoppingBagIcon, Clipboard as ClipboardIcon, Factory as FactoryIcon, Bell, CheckCircle, History as HistoryIcon
} from "lucide-react";

const ICON_SIZE = 18;
const SUB_ICON_SIZE = ICON_SIZE - 2;

console.log("[pages.routes.jsx] Definición de rutas cargada.");

const routes = [
  {
    path: "dashboard", // URL: /home/dashboard
    label: "Dashboard",
    icon: <Home size={ICON_SIZE} />,
    element: <Dashboard />,
    requiredPermission: "dashboard", // CLAVE PARA PERMISOS
  },
  {
    path: "roles", // URL: /home/roles
    label: "Roles",
    icon: <Key size={ICON_SIZE} />,
    element: <Roles />,
    requiredPermission: "roles", // CLAVE PARA PERMISOS
  },
  {
    path: "usuarios", // URL: /home/usuarios
    label: "Usuarios",
    icon: <UserIcon size={ICON_SIZE} />,
    element: <Usuarios />,
    requiredPermission: "usuarios", // CLAVE PARA PERMISOS
  },
  {
    // --- GRUPO: PRODUCCIÓN ---
    path: "produccion", // URL: /home/produccion (actúa como agrupador)
    label: "Producción",
    icon: <PackageIcon size={ICON_SIZE} />,
    // No 'requiredPermission' en el padre del grupo, se mostrará si algún hijo es visible.
    // Si se quisiera controlar el grupo completo, se añadiría aquí, por ejemplo: requiredPermission: "produccion_module_access"
    children: [
      {
        path: "proveedores", // URL: /home/produccion/proveedores
        label: "Proveedores",
        icon: <FactoryIcon size={SUB_ICON_SIZE} />,
        element: <Proveedores />,
        requiredPermission: "proveedores", // CLAVE PARA PERMISOS
      },
      {
        path: "empleados", // URL: /home/produccion/empleados
        label: "Empleados",
        icon: <UserCog size={SUB_ICON_SIZE} />,
        element: <Empleados />,
        requiredPermission: "empleados", // CLAVE PARA PERMISOS (Asegúrate que 'empleados' existe como permiso)
      },
      {
        path: "insumo", // URL: /home/produccion/insumo
        label: "Insumo",
        icon: <BoxIcon size={SUB_ICON_SIZE} />,
        element: <Insumos />,
        requiredPermission: "insumo", // CLAVE PARA PERMISOS
      },
      {
        path: "producto-insumo", // URL: /home/produccion/producto-insumo (CORREGIDO A GUION MEDIO)
        label: "Producto Insumo",
        icon: <BoxIcon size={SUB_ICON_SIZE} />, // Podrías usar otro ícono para diferenciar
        element: <ProductosInsumo />,
        requiredPermission: "producto-insumo", // CLAVE PARA PERMISOS (CORREGIDO A GUION MEDIO)
      },
      {
        path: "orden-produccion", // URL: /home/produccion/orden-produccion
        label: "Orden de producción",
        icon: <FactoryIcon size={SUB_ICON_SIZE} />,
        element: <OrdenProduccion />,
        requiredPermission: "orden-produccion", // CLAVE PARA PERMISOS
      },
      {
        path: "historial", // URL: /home/produccion/historial (Path en minúsculas es común)
        label: "Historial", // CORREGIDO
        icon: <HistoryIcon size={SUB_ICON_SIZE} />, // Usando un ícono de historial
        element: <Historial />,
        requiredPermission: "orden-produccion", // Reutilizando permiso de orden-produccion para ver su historial
                                                // O podrías tener "orden-produccion-view-history" si es un privilegio separado.
                                                // Tu MenuList.jsx usa "view" por defecto, así que can("orden-produccion", "view")
      },
      {
        path: "gestion-de-compra", // URL: /home/produccion/gestion-de-compra
        label: "Gestión de compras",
        icon: <ShoppingBagIcon size={SUB_ICON_SIZE} />,
        element: <GestionComprasPage />,
        requiredPermission: "gestion-de-compra", // CLAVE PARA PERMISOS
      },
    ],
  },
  {
    // --- GRUPO: RESERVAS ---
    path: "reservas", // URL: /home/reservas
    label: "Reservas",
    icon: <CalendarIcon size={ICON_SIZE} />,
    requiredPermission: "reservas", // CLAVE PARA PERMISOS (controla visibilidad del grupo entero)
    children: [
      {
        path: "clientes", // URL: /home/reservas/clientes
        label: "Clientes",
        icon: <ClipboardIcon size={SUB_ICON_SIZE} />, // Icono podría ser UserIcon o similar
        element: <Clientes />,
        requiredPermission: "clientes", // CLAVE PARA PERMISOS
      },
      {
        path: "lista", // URL: /home/reservas/lista
        label: "Lista de Reservas", // Más descriptivo
        icon: <CheckCircle size={SUB_ICON_SIZE} />,
        element: <Reservas />,
        requiredPermission: "reservas", // Reutilizando el permiso del padre para ver la lista
      },
      {
        path: "servicios", // URL: /home/reservas/servicios
        label: "Servicios Adicionales", // Más descriptivo
        icon: <Bell size={SUB_ICON_SIZE} />, // Icono podría ser Settings o similar
        element: <Servicios />,
        requiredPermission: "servicios", // CLAVE PARA PERMISOS
      },
    ],
  },
  {
    path: "mano-de-obra", // URL: /home/mano-de-obra
    label: "Mano de obra",
    icon: <Settings size={ICON_SIZE} />,
    element: <ManoDeObra />,
    requiredPermission: "mano-de-obra", // CLAVE PARA PERMISOS
  },
];

export default routes;