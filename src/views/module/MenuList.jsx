import React from "react";
import { Menu } from "antd";

export function MenuList() {
  return (
    <Menu theme="light" mode="inline">
      <Menu.Item key="1">Inicio</Menu.Item>
      <Menu.Item key="2">Productos</Menu.Item>
      <Menu.Item key="3">Pedidos</Menu.Item>
      <Menu.Item key="4">Configuración</Menu.Item>
    </Menu>
  );
}
