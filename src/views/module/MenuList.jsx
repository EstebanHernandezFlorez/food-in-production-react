import React, { useState } from 'react';
import { Menu, Modal } from 'antd';

import { Link } from 'react-router-dom';
import {
  HomeOutlined,
  UserOutlined,
  ProductOutlined,
  CalendarOutlined,
  BarChartOutlined,
  IdcardOutlined,
  LogoutOutlined,
} from '@ant-design/icons';

const MenuList = ({ darkTheme }) => {
  const [isModalVisible, setIsModalVisible] = useState(false); // Inicialización del estado

  // Definir los estilos en función del tema
  const menuStyle = {
    backgroundColor: darkTheme ? '#222222' : '#ffffff',
    color: darkTheme ? '#ffffff' : '#222222',
    height: '100vh', // Asegura que el menú ocupe toda la altura del contenedor
  };

  const itemStyle = {
    color: darkTheme ? '#ffffff' : '#222222',
  };

  const activeItemStyle = {
    backgroundColor: darkTheme ? '#444444' : '#f0f0f0',
    color: darkTheme ? '#ffffff' : '#222222',
  };

  // Funciones para manejar la visibilidad del modal
  const showConfirm = () => {
    setIsModalVisible(true);
  };

  const handleOk = () => {
    setIsModalVisible(false);
    // Aquí se podría añadir la lógica para cerrar sesión
    // Limpiar el estado de autenticación
    // Redirigir a la página de inicio o de login
    window.location.href = '/'; // Redirige a la página de inicio (o login)
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  return (
    <>
      <Menu
        theme={darkTheme ? 'dark' : 'light'}
        mode="inline"
        style={menuStyle}
      >
        <Menu.Item
          key="dashboard"
          icon={<HomeOutlined style={{ color: itemStyle.color }} />}
        >
          <Link to="/dashboard" style={itemStyle}>
            Dashboard
          </Link>
        </Menu.Item>
        <Menu.Item
          key="roles"
          icon={<IdcardOutlined style={{ color: itemStyle.color }} />}
        >
          <Link to="/roles" style={itemStyle}>
            Roles
          </Link>
        </Menu.Item>
        <Menu.Item
          key="usuarios"
          icon={<UserOutlined style={{ color: itemStyle.color }} />}
        >
          <Link to="/usuarios" style={itemStyle}>
            Usuarios
          </Link>
        </Menu.Item>
        <Menu.SubMenu
          key="subtasks"
          icon={<ProductOutlined style={{ color: itemStyle.color }} />}
          title="Producción"
        >
          <Menu.Item key="produccion" style={menuStyle}>
            <Link to="/produccion">Producción</Link>
          </Menu.Item>
          <Menu.Item key="orden_produccion" style={menuStyle}>
            <Link to="/orden_produccion">Orden de Producción</Link>
          </Menu.Item>
          <Menu.Item key="producto_insumo" style={menuStyle}>
            <Link to="/producto_insumo">Producto Insumo</Link>
          </Menu.Item>
          <Menu.Item key="insumo" style={menuStyle}>
            <Link to="/insumo">Insumo</Link>
          </Menu.Item>
          <Menu.Item key="empleados" style={menuStyle}>
            <Link to="/empleados">Empleados</Link>
          </Menu.Item>
          <Menu.Item key="proveedores" style={menuStyle}>
            <Link to="/proveedores">Proveedores</Link>
          </Menu.Item>
        </Menu.SubMenu>
        <Menu.SubMenu
          key="reservas"
          icon={<CalendarOutlined style={{ color: itemStyle.color }} />}
          title="Reservas"
        >
          <Menu.Item key="clientes" style={itemStyle}>
            <Link to="/clientes">Clientes</Link>
          </Menu.Item>
          <Menu.Item key="reservas" style={itemStyle}>
            <Link to="/reservas">Reservas</Link>
          </Menu.Item>
          <Menu.Item key="servicios" style={itemStyle}>
            <Link to="/servicios">Servicios</Link>
          </Menu.Item>
        </Menu.SubMenu>
        <Menu.Item
          key="mano_de_obra"
          icon={<BarChartOutlined style={{ color: itemStyle.color }} />}
        >
          <Link to="/mano_de_obra" style={itemStyle}>
            Mano de Obra
          </Link>
        </Menu.Item>
        <Menu.Item
          key="logout"
          icon={<LogoutOutlined style={{ color: itemStyle.color }} />}
          onClick={showConfirm}
        >
          <span style={itemStyle}>Cerrar sesión</span>
        </Menu.Item>
      </Menu>

      {/* Modal de confirmación */}
      <Modal
        title="Confirmación"
        visible={isModalVisible} // Usa la prop `visible` para controlar la visibilidad
        onOk={handleOk}
        onCancel={handleCancel}
        okText="Sí"
        cancelText="No"
      >
        <p>¿Estás seguro de que deseas cerrar sesión?</p>
      </Modal>
    </>
  );
};

export default MenuList;
