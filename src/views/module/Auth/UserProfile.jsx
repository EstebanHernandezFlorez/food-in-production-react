// src/views/module/Auth/UserProfile.jsx

import React from 'react';
import { Card, Avatar, Descriptions, Typography, Spin, Alert, Button } from 'antd';
import { UserOutlined, EditOutlined } from '@ant-design/icons'; // Importa iconos de Antd
import { useAuth } from '../../hooks/AuthProvider'; // Ajusta la ruta si es necesario

const { Title, Text } = Typography;

const UserProfile = () => {
  const { user, loading } = useAuth(); // Obtén el usuario y el estado de carga

  // Muestra un spinner mientras se carga la información del usuario (si aplica)
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <Spin size="large" />
      </div>
    );
  }

  // Muestra un mensaje si no se pudo obtener el usuario
  if (!user) {
    return (
      <Alert
        message="Error"
        description="No se pudo cargar la información del perfil. Por favor, intente iniciar sesión de nuevo."
        type="error"
        showIcon
      />
    );
  }

  // Renderiza la información del perfil
  return (
    <Card
      title={<Title level={3}>Mi Perfil</Title>}
      bordered={false} // Opcional: quitar borde de la Card
      style={{ maxWidth: '700px', margin: 'auto' }} // Centrar y limitar ancho
      // Extra actions (ej: botón editar)
      extra={
        <Button
            type="link" // O "primary" si prefieres
            icon={<EditOutlined />}
            // onClick={() => {/* Lógica para abrir modal de edición o navegar */}}
            // disabled // Habilita cuando tengas la funcionalidad
        >
            Editar Perfil
        </Button>
      }
    >
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <Avatar size={100} icon={<UserOutlined />} /> {/* Avatar grande */}
      </div>

      {/* Descriptions es ideal para mostrar pares clave-valor */}
      <Descriptions bordered column={1} layout="horizontal">
        <Descriptions.Item label="Nombre Completo">
          <Text strong>{user.full_name || 'No disponible'}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Correo Electrónico">
          <Text>{user.email || 'No disponible'}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Rol">
          {/* Accede al nombre del rol de forma segura */}
          <Text>{user.role?.name || 'No asignado'}</Text>
        </Descriptions.Item>
        {/* Puedes añadir más campos si están disponibles en tu objeto 'user' */}
        {/* <Descriptions.Item label="ID de Usuario">
          <Text code>{user.id}</Text>
        </Descriptions.Item> */}
      </Descriptions>
    </Card>
  );
};

export default UserProfile;