// ForgotPasswordModal.jsx

import React, { useState, useEffect } from 'react';
import { authService } from '../../services/authService'; // <-- IMPORTANTE

// Función simple de validación de email
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Función de validación de contraseña
const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10,}$/;
    if (!password) return false;
    return passwordRegex.test(password);
};

export default function ForgotPasswordModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordValidationError, setPasswordValidationError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setEmail('');
      setCode('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setSuccessMessage('');
      setPasswordValidationError('');
      setLoading(false);
    }
  }, [isOpen]);

  const handleEmailChange = (e) => setEmail(e.target.value);
  const handleCodeChange = (e) => setCode(e.target.value);

  const handleNewPasswordChange = (e) => {
    const value = e.target.value;
    setNewPassword(value);
    if (value && !validatePassword(value)) {
        setPasswordValidationError('Mínimo 10 caracteres, con mayúscula, minúscula, número y símbolo (@$!%*?&).');
    } else {
        setPasswordValidationError('');
    }
  };
  const handleConfirmPasswordChange = (e) => setConfirmPassword(e.target.value);

  const handleRequestCodeSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!isValidEmail(email)) {
      setError('Por favor, ingrese un formato de correo electrónico válido.');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.forgotPassword({ email });

      setSuccessMessage(response.message || 'Código de verificación enviado. Revise su correo.');
      setError('');
      setLoading(false);
      
      setTimeout(() => {
          setSuccessMessage('');
          setStep(2);
      }, 2500);

    } catch (err) {
      const backendError = err?.response?.data?.message || 'Ocurrió un error. Verifique el correo o intente más tarde.';
      setError(backendError);
      setSuccessMessage('');
      setLoading(false);
    }
  };

  const handleVerifyCodeSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setPasswordValidationError('');

    if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
        setError('Ingrese un código de verificación válido (6 dígitos).');
        return;
    }
    if (!validatePassword(newPassword)) {
        setError('La nueva contraseña no cumple los requisitos.');
        setPasswordValidationError('Mínimo 10 caracteres, con mayúscula, minúscula, número y símbolo (@$!%*?&).');
        return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.verifyCodeAndResetPassword({
            email,
            code,
            newPassword
        });

        setSuccessMessage(response.message || 'Contraseña actualizada con éxito.');
        setError('');
        setLoading(false);
        
        setTimeout(() => {
            onClose();
        }, 3000);

    } catch (err) {
         const backendError = err?.response?.data?.message || 'Error al verificar el código o actualizar la contraseña.';
         setError(backendError);
         setSuccessMessage('');
         setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {step === 1 ? 'Recuperar Contraseña' : 'Verificar y Cambiar Contraseña'}
            </h5>
            <button type="button" className="btn-close" onClick={!loading ? onClose : undefined} aria-label="Close" disabled={loading}></button>
          </div>
          <div className="modal-body">
            {error && <div className="alert alert-danger py-2">{error}</div>}
            {successMessage && <div className="alert alert-success py-2">{successMessage}</div>}

            {step === 1 && !successMessage && (
              <form onSubmit={handleRequestCodeSubmit}>
                <div className="mb-3">
                  <label htmlFor="recoverEmail" className="form-label">Correo Electrónico</label>
                  <input
                    type="email"
                    className="form-control"
                    id="recoverEmail"
                    placeholder="Ingrese su correo registrado"
                    value={email}
                    onChange={handleEmailChange}
                    required
                    disabled={loading}
                  />
                  <div className="form-text">Le enviaremos un código de verificación a este correo si está registrado.</div>
                </div>
                <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                  {loading ? 'Enviando...' : 'Enviar Código'}
                </button>
              </form>
            )}

            {step === 2 && !successMessage && (
              <form onSubmit={handleVerifyCodeSubmit}>
                 <div className="mb-3">
                    <p>Se envió un código al correo: <strong>{email}</strong>. Ingréselo a continuación.</p>
                 </div>
                <div className="mb-3">
                    <label htmlFor="verificationCode" className="form-label">Código de Verificación</label>
                    <input
                        type="text"
                        inputMode="numeric"
                        className={`form-control ${error && error.toLowerCase().includes('código') ? 'is-invalid' : ''}`}
                        id="verificationCode"
                        placeholder="Ingrese el código de 6 dígitos"
                        value={code}
                        onChange={handleCodeChange}
                        maxLength={6}
                        required
                        disabled={loading}
                    />
                </div>
                <div className="mb-3">
                  <label htmlFor="newPassword" className="form-label">Nueva Contraseña</label>
                  <input
                    type="password"
                    className={`form-control ${passwordValidationError ? 'is-invalid' : ''}`}
                    id="newPassword"
                    placeholder="Ingrese su nueva contraseña"
                    value={newPassword}
                    onChange={handleNewPasswordChange}
                    required
                    disabled={loading}
                  />
                   {passwordValidationError && <div className="invalid-feedback d-block">{passwordValidationError}</div>}
                   {!passwordValidationError && <div className="form-text">Mínimo 10 caracteres, mayúscula, minúscula, número y símbolo (@$!%*?&).</div>}
                </div>
                <div className="mb-3">
                  <label htmlFor="confirmPassword" className="form-label">Confirmar Nueva Contraseña</label>
                  <input
                    type="password"
                    className={`form-control ${newPassword && confirmPassword && newPassword !== confirmPassword ? 'is-invalid' : ''}`}
                    id="confirmPassword"
                    placeholder="Confirme su nueva contraseña"
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    required
                    disabled={loading}
                  />
                  {newPassword && confirmPassword && newPassword !== confirmPassword && (
                     <div className="invalid-feedback d-block">Las contraseñas no coinciden.</div>
                  )}
                </div>
                <button type="submit" className="btn btn-primary w-100" disabled={loading || !code || !newPassword || !confirmPassword || !!passwordValidationError || (newPassword !== confirmPassword)}>
                  {loading ? 'Verificando y Actualizando...' : 'Restablecer Contraseña'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}