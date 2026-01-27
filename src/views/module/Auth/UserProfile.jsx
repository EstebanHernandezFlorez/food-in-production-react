import React, { useState, useEffect } from 'react';
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
import roleService from '../../services/roleServices';

const { Title, Text } = Typography;

const UserProfile = () => {
  const { user, loading, refreshUser } = useAuth(); 

  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [isEmailModalVisible, setIsEmailModalVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [roleInfo, setRoleInfo] = useState(null);
  const [isRoleLoading, setIsRoleLoading] = useState(false);

  const [passwordForm] = Form.useForm();
  const [emailForm] = Form.useForm();

  useEffect(() => {
    // CORRECCIÓN: Se busca 'user.idRole' para coincidir con el modelo de backend.
    if (user?.idRole) {
      const fetchRoleData = async () => {
        setIsRoleLoading(true);
        try {
          const roleData = await roleService.getRoleById(user.idRole);
          setRoleInfo(roleData);
        } catch (error) {
          console.error("Error al obtener la información del rol:", error);
          message.error("No se pudo cargar la información del rol.");
          setRoleInfo(null);
        } finally {
          setIsRoleLoading(false);
        }
      };
      fetchRoleData();
    }
  }, [user]);

  const handleEditPassword = async () => {
    try {
      const values = await passwordForm.validateFields();
      await userService.updateUser(user.idUser, { password: values.password }); // Asumiendo que el ID del usuario es idUser
      message.success('Contraseña actualizada correctamente');
      setIsPasswordModalVisible(false);
      passwordForm.resetFields();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al actualizar la contraseña';
      message.error(errorMessage);
    }
  };

  const handleEditEmail = async () => {
    try {
      const values = await emailForm.validateFields();
      await userService.updateUser(user.idUser, { email: values.email }); // Asumiendo que el ID del usuario es idUser
      message.success('Correo electrónico actualizado correctamente');
      setIsEmailModalVisible(false);
      if (refreshUser) {
        await refreshUser();
      }
      emailForm.resetFields();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al actualizar el correo';
      message.error(errorMessage);
    }
  };

  const showEmailModal = () => {
    emailForm.setFieldsValue({ email: user.email });
    setIsEmailModalVisible(true);
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}><Spin size="large" /></div>;
  }

  if (!user) {
    return <Alert message="Error" description="No se pudo cargar el perfil." type="error" showIcon />;
  }

  return (
    <>
      <Card
        title={<Title level={3} style={{ color: '#5C4033' }}>👤 Mi Perfil</Title>}
        variant="borderless" 
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
            style={{ color: '#fff', backgroundColor: '#9e3535', borderColor: '#9e3535' }}
            onClick={() => setIsPasswordModalVisible(true)}
          >
            Editar Contraseña
          </Button>
        }
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Avatar size={100} style={{ backgroundColor: '#d0b88e', color: '#5C4033', fontWeight: 'bold', border: '2px solid #9e3535' }}>
            {user.full_name?.[0]?.toUpperCase() || 'U'}
          </Avatar>
          <Title level={4} style={{ color: '#5C4033', marginTop: '12px' }}>
            {user.full_name}
          </Title>
        </div>

        <Descriptions
          column={1}
          bordered
          styles={{
            label: { fontWeight: 'bold', color: '#5C4033', backgroundColor: '#f9f4ea' },
            content: { color: '#5C4033', backgroundColor: '#fffaf2' },
          }}
        >
          <Descriptions.Item label="Correo Electrónico">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text>{user.email || 'No disponible'}</Text>
              <Button type="text" icon={<Pencil size={14} />} onClick={showEmailModal} style={{ color: '#9e3535' }}/>
            </div>
          </Descriptions.Item>

          <Descriptions.Item label="Rol">
            {/* CORRECCIÓN: Se muestra 'roleInfo.roleName' para coincidir con el modelo de backend. */}
            {isRoleLoading ? <Spin size="small" /> : <Text>{roleInfo?.roleName || 'No asignado'}</Text>}
          </Descriptions.Item>

          <Descriptions.Item label="Contraseña">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Input
                type={showPassword ? 'text' : 'password'}
                value="••••••••••"
                readOnly
                style={{ border: 'none', backgroundColor: 'transparent', paddingLeft: 0, color: '#5C4033' }}
              />
              <Button
                type="text"
                icon={showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                onClick={() => setShowPassword(!showPassword)}
                style={{ color: '#5C4033' }}
              />
            </div>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* --- Modal para Contraseña --- */}
      <Modal
        title="Editar Contraseña"
        open={isPasswordModalVisible}
        onOk={handleEditPassword}
        onCancel={() => { setIsPasswordModalVisible(false); passwordForm.resetFields(); }}
        okText="Guardar" cancelText="Cancelar" centered
      >
        <Form form={passwordForm} layout="vertical">
          <Form.Item name="password" label="Nueva Contraseña" rules={[{ required: true, message: 'Ingresa la nueva contraseña' }, { min: 8, message: 'Mínimo 8 caracteres' }]}>
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>

      {/* --- Modal para Correo --- */}
      <Modal
        title="Editar Correo Electrónico"
        open={isEmailModalVisible}
        onOk={handleEditEmail}
        onCancel={() => { setIsEmailModalVisible(false); emailForm.resetFields(); }}
        okText="Guardar" cancelText="Cancelar" centered
      >
        <Form form={emailForm} layout="vertical">
          <Form.Item name="email" label="Nuevo Correo" rules={[{ required: true, message: 'Ingresa el nuevo correo' }, { type: 'email', message: 'Formato de correo no válido' }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default UserProfile;