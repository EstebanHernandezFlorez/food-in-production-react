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
    backgroundColor: '#000000', // Fondo negro oscuro
    color: '#D9A407', // Color de texto dorado
    height: '8vh', // Asegura que el menú ocupe toda la altura del contenedor
  };

  const itemStyle = {
    color: 'white',        // Color de texto blanco
    textDecoration: 'none' // Sin decoración de texto
  };  

  const submenuStyle = {
    color: 'black', // Color de texto dorado para los ítems dentro de SubMenu
    backgroundColor: 'black'
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
          style={itemStyle}
        >
          <Link to="/dashboard" style={itemStyle}>
            Dashboard
          </Link>
        </Menu.Item>
        <Menu.Item
          key="roles"
          icon={<IdcardOutlined style={{ color: itemStyle.color }} />}
          style={itemStyle}
        >
          <Link to="/roles" style={itemStyle}>
            Roles
          </Link>
        </Menu.Item>
        <Menu.Item
          key="usuarios"
          icon={<UserOutlined style={{ color: itemStyle.color }} />}
          style={itemStyle}
        >
          <Link to="/usuarios" style={itemStyle}>
            Usuarios
          </Link>
        </Menu.Item>
        <Menu.SubMenu
          key="subtasks"
          icon={<ProductOutlined style={{ color: itemStyle.color }} />}
          title="Producción"
          style={itemStyle} // Estilo aplicado al SubMenu
        >
          <Menu.Item key="produccion" style={submenuStyle}>
            <Link to="/produccion" style={itemStyle}>Producción</Link>
          </Menu.Item>
          <Menu.Item key="orden_produccion" style={submenuStyle}>
            <Link to="/orden_produccion" style={itemStyle}>Orden de Producción</Link>
          </Menu.Item>
          <Menu.Item key="producto_insumo" style={submenuStyle}>
            <Link to="/producto_insumo" style={itemStyle}>Producto Insumo</Link>
          </Menu.Item>
          <Menu.Item key="insumo" style={submenuStyle}>
            <Link to="/insumo" style={itemStyle}>Insumo</Link>
          </Menu.Item>
          <Menu.Item key="empleados" style={submenuStyle}>
            <Link to="/empleados" style={itemStyle}>Empleados</Link>
          </Menu.Item>
          <Menu.Item key="proveedores" style={submenuStyle}>
            <Link to="/proveedores" style={itemStyle}>Proveedores</Link>
          </Menu.Item>
        </Menu.SubMenu>
        <Menu.SubMenu
        
          key="reservas"
          icon={<CalendarOutlined style={{ color: itemStyle.color }} />}
          title="Reservas"
          style={itemStyle} // Estilo aplicado al SubMenu
        >
          <Menu.Item key="Calendario" style={submenuStyle}>
            <Link to="/Calendario" style={itemStyle}>Calendario</Link>
          </Menu.Item>
          <Menu.Item key="clientes" style={submenuStyle}>
            <Link to="/clientes" style={itemStyle}>Clientes</Link>
          </Menu.Item>
          <Menu.Item key="reservas" style={submenuStyle}>
            <Link to="/reservas" style={itemStyle}>Reservas</Link>
          </Menu.Item>
          <Menu.Item key="servicios" style={submenuStyle}>
            <Link to="/servicios" style={itemStyle}>Servicios</Link>
          </Menu.Item>
        </Menu.SubMenu>
        <Menu.Item
          key="mano_de_obra"
          icon={<BarChartOutlined style={{ color: itemStyle.color }} />}
          style={itemStyle}
        >
          <Link to="/mano_de_obra" style={itemStyle}>
            Mano de Obra
          </Link>
        </Menu.Item>
        <Menu.Item
          key="logout"
          icon={<LogoutOutlined style={{ color: itemStyle.color }} />}
          style={itemStyle}
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
