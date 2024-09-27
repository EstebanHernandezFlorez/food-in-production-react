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

  // Estilos en función del tema
  const menuStyle = {
    backgroundColor: 'black', // Fondo negro para el menú
    color: 'white', // Color de texto vinotinto
    fontWeight: 'bold', // Peso de fuente en negrita
    height: '90vh', // Altura del menú para ocupar toda la pantalla
    border: 'none', // Quita el borde del menú
    fontSize:'15px'
  };
  

  const itemStyle = {
    color: 'white',        // Color de texto blanco
    textDecoration: 'none', // Sin decoración de texto
    backgroundColor: 'black', // Fondo negro para cada item
  };  

  const submenuStyle = {
    color: 'white', // Color de texto blanco para los ítems dentro del SubMenu
    backgroundColor: 'black', // Fondo negro para los ítems dentro del SubMenu
    textDecoration: 'none',
  };

  // Estilos específicos para el SubMenu
  const subMenuStyle = {
    backgroundColor: 'black', // Fondo negro para el SubMenu
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
        className='MenuCompleto'
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
          style={subMenuStyle} // Estilo aplicado al SubMenu
        >
          <Menu.Item key="produccion" style={submenuStyle}>
            <Link to="/produccion" style={submenuStyle}>Producción</Link>
          </Menu.Item>
          <Menu.Item key="orden_produccion" style={submenuStyle}>
            <Link to="/orden_produccion" style={submenuStyle}>Orden de Producción</Link>
          </Menu.Item>
          <Menu.Item key="producto_insumo" style={submenuStyle}>
            <Link to="/producto_insumo" style={submenuStyle}>Producto Insumo</Link>
          </Menu.Item>
          <Menu.Item key="insumo" style={submenuStyle}>
            <Link to="/insumo" style={submenuStyle}>Insumo</Link>
          </Menu.Item>
          <Menu.Item key="empleados" style={submenuStyle}>
            <Link to="/empleados" style={submenuStyle}>Empleados</Link>
          </Menu.Item>
          <Menu.Item key="proveedores" style={submenuStyle}>
            <Link to="/proveedores" style={submenuStyle}>Proveedores</Link>
          </Menu.Item>
        </Menu.SubMenu>
        <Menu.SubMenu
        
          key="reservas"
          icon={<CalendarOutlined style={{ color: itemStyle.color }} />}
          title="Reservas"
          style={subMenuStyle} // Estilo aplicado al SubMenu
        >
          <Menu.Item key="clientes" style={submenuStyle}>
            <Link to="/clientes" style={submenuStyle}>Clientes</Link>
          </Menu.Item>
          <Menu.Item key="reservas" style={submenuStyle}>
            <Link to="/reservas" style={submenuStyle}>Reservas</Link>
          </Menu.Item>
          <Menu.Item key="servicios" style={submenuStyle}>
            <Link to="/servicios" style={submenuStyle}>Servicios</Link>
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
