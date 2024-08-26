import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { Modal } from 'antd';


function RecovyPassword({ show, onHide }) {
  const [email, setEmail] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validEmails = ['admin@example.com', 'test@test.com'];

  const handleChange = (e) => {
    setEmail(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validEmails.includes(email)) {
      setSuccessMessage('Se ha enviado un correo electrónico para la recuperación de su contraseña.');
      setErrorMessage('');
      
      setTimeout(() => {
        setShowChangePasswordModal(true);
      }, 2000); // Muestra el modal de cambio de contraseña después de 2 segundos
    } else {
      setErrorMessage('El correo electrónico no está registrado.');
      setSuccessMessage('');
    }
  };

  const validatePassword = (password) => {
    // Validación de contraseña robusta
    return /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10,}$/.test(password);
  };

  const handleNewPasswordChange = (e) => {
    const value = e.target.value;
    setNewPassword(value);

    if (!validatePassword(value)) {
      setPasswordError('La contraseña debe contener al menos 10 caracteres, una mayúscula, una minúscula, un número y un carácter especial.');
    } else {
      setPasswordError('');
    }
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
  };

  const handlePasswordChangeSubmit = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden.');
      return;
    }
    // Aquí podrías manejar el cambio de contraseña
    setShowChangePasswordModal(false);
    onHide(); // Cierra el modal después de cambiar la contraseña
  };

  return (
    <>
      <Modal show={show} onHide={onHide} centered size="lg">
        <Modal.Body>
          <Button variant="danger" onClick={onHide} style={{ float: 'right' }}>X</Button>
          <Modal.Title className="text-center">Recuperación de Contraseña</Modal.Title>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="formBasicEmail">
              <Form.Label>Email address</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={handleChange}
                required
              />
              <Form.Text className="text-muted">
                Ingrese su correo
              </Form.Text>
            </Form.Group>
            {successMessage && (
              <Form.Text className="text-success d-block mb-3">
                {successMessage}
              </Form.Text>
            )}
            {errorMessage && (
              <Form.Text className="text-danger d-block mb-3">
                {errorMessage}
              </Form.Text>
            )}
            <Button variant="primary" type="submit">
              Submit
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      <Modal show={showChangePasswordModal} onHide={() => setShowChangePasswordModal(false)} centered size="lg">
        <Modal.Body>
          <Button variant="danger" onClick={() => setShowChangePasswordModal(false)} style={{ float: 'right' }}>X</Button>
          <Modal.Title className="text-center">Cambio de Contraseña</Modal.Title>
          <Form onSubmit={handlePasswordChangeSubmit}>
            <Form.Group className="mb-3" controlId="formNewPassword">
              <Form.Label>Nueva Contraseña</Form.Label>
              <Form.Control
                type="password"
                placeholder="Ingrese nueva contraseña"
                value={newPassword}
                onChange={handleNewPasswordChange}
                isInvalid={!!passwordError}
                required
              />
              <Form.Control.Feedback type="invalid">
                {passwordError}
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3" controlId="formConfirmPassword">
              <Form.Label>Confirmar Contraseña</Form.Label>
              <Form.Control
                type="password"
                placeholder="Confirme nueva contraseña"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                isInvalid={confirmPassword && newPassword !== confirmPassword}
                required
              />
              <Form.Control.Feedback type="invalid">
                Las contraseñas no coinciden.
              </Form.Control.Feedback>
            </Form.Group>
            <Button variant="primary" type="submit" disabled={!!passwordError || newPassword !== confirmPassword}>
              Cambiar Contraseña
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
}

export default RecovyPassword;