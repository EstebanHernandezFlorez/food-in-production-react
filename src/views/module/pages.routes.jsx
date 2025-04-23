import React from "react";
import Dashboard from "./Dashboard/dashboard";
import Roles from "./Roles/roles";
import Usuarios from "./Usuarios/usuarios";
import Proveedores from "./Proveedores/Proveedores"
import Empleados from "./Empleados/Empleados";
import Productos from "./ProductoInsumo/ProductoInsumo"
import Produccion from "./Produccion/produccion"
import Clientes from "./Clientes/Clientes"
import Reservas from "./Reservas/Reservas"
import Servicios from "./Servicios/Servicios"
import ManoDeObra from "./ManoDeObra/ManoDeObra"
import FichaTecnica from "./ProductoInsumo/FichaTecnica";
import ListaFichasTecnicas from "./ProductoInsumo/ListaFichasTecnicas";

import {
  Home,
  BadgeInfo,
  User,
  Package,
  Calendar,
  Wrench,
  Users,
  Building,
  Box,
  ShoppingBag,
  ClipboardList,
  Factory,
  ConciergeBell,
  CalendarCheck,
  Boxes,
} from "lucide-react";
import { patch } from "@mui/material";

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
    icon: <BadgeInfo size={ICON_SIZE} />,
    element: <Roles />,
  },
  {
    path: "usuarios",
    label: "Usuarios",
    icon: <User size={ICON_SIZE} />,
    element: <Usuarios />,
  },
  {
    path: "produccion",
    label: "Producción",
    icon: <Package size={ICON_SIZE} />,
    children: [
      {
        path: "proveedores",
        label: "Proveedores",
        icon: <Building size={SUB_ICON_SIZE} />,
        element: <Proveedores />,
      },
      {
        path: "empleados",
        label: "Empleados",
        icon: <Users size={SUB_ICON_SIZE} />,
        element: <Empleados />,
      },
      {
        path: "producto-insumo",
        label: "Producto Insumo",
        icon: <Boxes size={SUB_ICON_SIZE} />,
        element: <Productos />,
      },
      {
        path: "ficha-tecnica",
        label: "Ficha Técnica",
        icon: <Box size={SUB_ICON_SIZE} />,
        element: <FichaTecnica />,
      },
      {
        path: "fichas-tecnicas/:idProduct",
        element: <ListaFichasTecnicas />,
      },
      {
        path: "orden-produccion",
        label: "Orden de producción",
        icon: <Factory size={SUB_ICON_SIZE} />,
        element: <Empleados />,
      },
      {
        path: "produccion",
        label: "Producción",
        icon: <Factory size={SUB_ICON_SIZE} />,
        element: <Produccion />,
      },
    ],
  },
  {
    path: "reservas",
    label: "Reservas",
    icon: <Calendar size={ICON_SIZE} />,
    children:[
      {
        path: "clientes",
        label: "Clientes",
        icon: <ClipboardList size={SUB_ICON_SIZE} />,
        element: <Clientes />,
      },
      {
        path: "reservas",
        label: "Reservas",
        icon: <CalendarCheck size={SUB_ICON_SIZE} />,
        element: <Reservas />,
      },
      {
        path: "servicios",
        label: "Servicios",
        icon: <ConciergeBell size={SUB_ICON_SIZE} />,
        element: <Servicios />,
      }
    ]
  },
  {
    path: "mano-de-obra",
    label: "Mano de obra",
    icon: <Wrench size={ICON_SIZE} />,
    element: <ManoDeObra />,
  }
];

export default routes;
