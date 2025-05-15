import React, { useState } from 'react';
import {
  Card,
  Avatar,
  Descriptions,
  Typography,
  Spin,
  Alert,
  Button,
  Modal,
  Input,
  Form,
  message
} from 'antd';
import { Eye, EyeOff, Pencil } from 'lucide-react';
import { useAuth } from '../../hooks/AuthProvider';
import userService from '../../services/usuarioService';

const { Title, Text } = Typography;

const UserProfile = () => {
  const { user, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleEditPassword = async () => {
    try {
      const values = await form.validateFields();
      const userId = user.id;
      await userService.updateUser(userId, { password: values.password });
      message.success('Contraseña actualizada correctamente');
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('Error al actualizar la contraseña');
      console.error('Error al cambiar contraseña:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <Spin size="large" />
      </div>
    );
  }

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

  return (
    <>
      <Card
        title={<Title level={3} style={{ color: '#5C4033' }}>👤 Mi Perfil</Title>}
        bordered={false}
        style={{
          maxWidth: '700px',
          margin: 'auto',
          backgroundColor: '#fefbf5',
          borderRadius: '20px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          padding: '24px'
        }}
        extra={
          <Button
            icon={<Pencil size={16} />}
            style={{
              color: '#fff',
              backgroundColor: '#9e3535',
              borderColor: '#9e3535',
              transition: '0.3s',
            }}
            onClick={() => setIsModalVisible(true)}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#7a2929')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#9e3535')}
          >
            Editar Contraseña
          </Button>
        }
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Avatar
            size={100}
            style={{
              backgroundColor: '#d0b88e',
              color: '#5C4033',
              fontWeight: 'bold',
              border: '2px solid #9e3535'
            }}
          >
            {user.full_name?.[0]?.toUpperCase() || 'U'}
          </Avatar>
          <Title level={4} style={{ color: '#5C4033', marginTop: '12px' }}>
            {user.full_name}
          </Title>
        </div>

        <Descriptions
          column={1}
          layout="horizontal"
          bordered
          labelStyle={{ fontWeight: 'bold', color: '#5C4033', backgroundColor: '#f9f4ea' }}
          contentStyle={{ color: '#5C4033', backgroundColor: '#fffaf2' }}
        >
          <Descriptions.Item label="Correo Electrónico">
            <Text>{user.email || 'No disponible'}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Rol">
            <Text>{user.role?.name || 'No asignado'}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Contraseña">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Input.Password
                value={user.password || '********'}
                type={showPassword ? 'text' : 'password'}
                readOnly
                style={{ border: 'none', backgroundColor: '#fffaf2' }}
                iconRender={() =>
                  showPassword ? (
                    <EyeOff onClick={togglePasswordVisibility} style={{ stroke: '#5C4033', cursor: 'pointer' }} />
                  ) : (
                    <Eye onClick={togglePasswordVisibility} style={{ stroke: '#5C4033', cursor: 'pointer' }} />
                  )
                }
              />
            </div>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Modal
        title="Editar Contraseña"
        open={isModalVisible}
        onOk={handleEditPassword}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        okText="Guardar"
        cancelText="Cancelar"
        centered
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="password"
            label="Nueva Contraseña"
            rules={[{ required: true, message: 'Por favor ingresa la nueva contraseña' }]}
          >
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default UserProfile;
