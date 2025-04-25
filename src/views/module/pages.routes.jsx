import React from "react";
import Dashboard from "./Dashboard/dashboard";
import Roles from "./roles/roles";
import Usuarios from "./usuarios/usuarios";
import Proveedores from "./Proveedores/Proveedores"
import Empleados from "./Empleados/Empleados";
import Productos from "./ProductoInsumo/ProductoInsumo"
import Produccion from "./Produccion/produccion"
import Clientes from "./Clientes/Clientes"
import Reservas from "./Reservas/Reservas"
import Servicios from "./Servicios/Servicios"
import ManoDeObra from "./ManoDeObra/ManoDeObra"
import GestionComprasPage from "./Compras/GestionComprasPage";
import Insumos from "./Insumo/Insumo"
import {
  Home,
  Key,
  Users as UserIcon,
  Package as PackageIcon,
  Calendar as CalendarIcon,
  Settings,
  UserCog,
  Box as BoxIcon,
  ShoppingBag as ShoppingBagIcon,
  Clipboard as ClipboardIcon,
  Factory as FactoryIcon,
  Bell,
  CheckCircle,
} from "lucide-react";

const roles = {
  admin: 1,
  jefeCocina: 2,
  auxCocina: 3,
};

const ICON_SIZE = 18;
const SUB_ICON_SIZE = ICON_SIZE - 2;

const routes = [
  {
    path: "dashboard",
    label: "Dashboard",
    icon: <Home size={ICON_SIZE} />,
    element: <Dashboard />,
  },
  {
    path: "roles",
    label: "Roles",
    icon: <Key size={ICON_SIZE} />,
    element: <Roles />,
  },
  {
    path: "usuarios",
    label: "Usuarios",
    icon: <UserIcon size={ICON_SIZE} />,
    element: <Usuarios />,
  },
  {
    path: "produccion",
    label: "Producción",
    icon: <PackageIcon size={ICON_SIZE} />,
    children: [
      {
        path: "proveedores",
        label: "Proveedores",
        icon: <FactoryIcon size={SUB_ICON_SIZE} />,
        element: <Proveedores />,
      },
      {
        path: "empleados",
        label: "Empleados",
        icon: <UserCog size={SUB_ICON_SIZE} />,
        element: <Empleados />,
      },
      {
        path: "insumo",
        label: "Insumo",
        icon: <BoxIcon size={SUB_ICON_SIZE} />,
        element: <Insumos/>,
      },
      {
        path: "producto-insumo",
        label: "Producto Insumo",
        icon: <BoxIcon size={SUB_ICON_SIZE} />,
        element: <Productos />,
      },
      {
        path: "orden-produccion",
        label: "Orden de producción",
        icon: <FactoryIcon size={SUB_ICON_SIZE} />,
        element: <Empleados />,
      },
      {
        path: "produccion",
        label: "Producción",
        icon: <FactoryIcon size={SUB_ICON_SIZE} />,
        element: <Produccion />,
      },
      {
        path: "gestion-de-compra",
        label: "Gestión de compras",
        icon: <ShoppingBagIcon size={SUB_ICON_SIZE} />,
        element: <GestionComprasPage />,
      },
    ],
  },
  {
    path: "reservas",
    label: "Reservas",
    icon: <CalendarIcon size={ICON_SIZE} />,
    children: [
      {
        path: "clientes",
        label: "Clientes",
        icon: <ClipboardIcon size={SUB_ICON_SIZE} />,
        element: <Clientes />,
      },
      {
        path: "reservas",
        label: "Reservas",
        icon: <CheckCircle size={SUB_ICON_SIZE} />,
        element: <Reservas />,
      },
      {
        path: "servicios",
        label: "Servicios",
        icon: <Bell size={SUB_ICON_SIZE} />,
        element: <Servicios />,
      },
    ],
  },
  {
    path: "mano-de-obra",
    label: "Mano de obra",
    icon: <Settings size={ICON_SIZE} />,
    element: <ManoDeObra />,
  },
];

export default routes;
