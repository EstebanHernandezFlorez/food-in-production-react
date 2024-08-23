import React from 'react';
import { Form, Input, Button, Alert } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, LockOutlined } from '@ant-design/icons';

const EditProfile = () => {
    const [form] = Form.useForm();
    const [error, setError] = React.useState("");

    // Datos del usuario (simulados, normalmente los obtendrás de un servidor o contexto)
    const userData = {
        document: '1234567890',
        fullName: 'Lina Marcela',
        email: 'lina.marcela@example.com',
        phone: '1234567890',
        role: 'Administrador',
    };

    const handleSubmit = (values) => {
        // Aquí iría la lógica para manejar la edición del perfil, como enviar datos a un servidor
        console.log('Datos del perfil:', values);
        setError(""); // Limpiar cualquier error previo
        alert('Perfil actualizado con éxito!');
    };

    const validateConfirmPassword = (_, value) => {
        if (!value || form.getFieldValue('password') === value) {
            return Promise.resolve();
        }
        return Promise.reject('Las contraseñas no coinciden');
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2>Editar Perfil</h2>
            {error && <Alert message={error} type="error" />}
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                initialValues={{
                    document: userData.document,
                    fullName: userData.fullName,
                    email: userData.email,
                    phone: userData.phone,
                    role: userData.role,
                }}
            >
                <Form.Item name="document" label="Documento" initialValue={userData.document}>
                    <Input disabled prefix={<UserOutlined />} />
                </Form.Item>
                <Form.Item name="fullName" label="Nombre Completo" rules={[{ required: true, message: 'Por favor ingresa tu nombre completo' }]}>
                    <Input prefix={<UserOutlined />} />
                </Form.Item>
                <Form.Item name="email" label="Correo" rules={[{ type: 'email', message: 'El correo no es válido' }, { required: true, message: 'Por favor ingresa tu correo' }]}>
                    <Input prefix={<MailOutlined />} />
                </Form.Item>
                <Form.Item name="phone" label="Celular" rules={[{ required: true, message: 'Por favor ingresa tu número de celular' }]}>
                    <Input prefix={<PhoneOutlined />} />
                </Form.Item>
                <Form.Item name="role" label="Rol" initialValue={userData.role}>
                    <Input disabled prefix={<UserOutlined />} />
                </Form.Item>
                <Form.Item
                    name="password"
                    label="Contraseña"
                    rules={[{ required: true, message: 'Por favor ingresa tu contraseña' }]}
                >
                    <Input.Password prefix={<LockOutlined />} />
                </Form.Item>
                <Form.Item
                    name="confirmPassword"
                    label="Confirmar Contraseña"
                    dependencies={['password']}
                    rules={[
                        { required: true, message: 'Por favor confirma tu contraseña' },
                        { validator: validateConfirmPassword },
                    ]}
                >
                    <Input.Password prefix={<LockOutlined />} />
                </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit">
                        Actualizar
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
};

export default EditProfile;
