// ForgotPasswordModal.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Función simple de validación de email
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Función de validación de contraseña (ajusta según tus reglas exactas si es necesario)
const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10,}$/;
    if (!password) return false; // Añadido para evitar error si está vacío
    return passwordRegex.test(password);
};

// Asegúrate que esta URL base coincida con tu configuración de backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'; // Ajusta si es necesario

export default function ForgotPasswordModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1); // 1: Email, 2: Code + New Password
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordValidationError, setPasswordValidationError] = useState('');


  // Resetear estado completo cuando el modal se cierra o reabre
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

  // Handlers para los inputs
  const handleEmailChange = (e) => setEmail(e.target.value);
  const handleCodeChange = (e) => setCode(e.target.value);

  // Handler para nueva contraseña con validación instantánea
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

  // --- Paso 1: Enviar solicitud de código ---
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
      // --- LLAMADA AL BACKEND (forgotPassword) ---
      // !!! Asegúrate que la ruta '/auth/forgot-password' existe en tu backend y apunta a tu función `forgotPassword` !!!
      const response = await axios.post(`${API_BASE_URL}/auth/forgot-password`, { email });

      setSuccessMessage(response.data.message || 'Código de verificación enviado. Revise su correo.');
      setError('');
      setLoading(false);
      // Esperar un poco para mostrar el mensaje y luego pasar al paso 2
      setTimeout(() => {
          setSuccessMessage(''); // Limpiar mensaje para el siguiente paso
          setStep(2); // Cambiar al paso de ingresar código y contraseña
      }, 2500);

    } catch (err) {
      const backendError = err?.response?.data?.message || 'Ocurrió un error. Verifique el correo o intente más tarde.';
      setError(backendError);
      setSuccessMessage('');
      setLoading(false);
    }
  };

  // --- Paso 2: Verificar código y establecer nueva contraseña ---
  const handleVerifyCodeSubmit = async (e) => {
      e.preventDefault();
      setError('');
      setSuccessMessage('');
      setPasswordValidationError(''); // Limpiar validación específica de contraseña

      // Validaciones
      if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) { // Asume código de 6 dígitos numéricos
          setError('Ingrese un código de verificación válido (6 dígitos).');
          return;
      }
       if (!validatePassword(newPassword)) {
            setError('La nueva contraseña no cumple los requisitos.');
            setPasswordValidationError('Mínimo 10 caracteres, con mayúscula, minúscula, número y símbolo (@$!%*?&).'); // Muestra el error específico también
            return;
       }
      if (newPassword !== confirmPassword) {
        setError('Las contraseñas no coinciden.');
        return;
      }

      setLoading(true);
      try {
        // --- LLAMADA AL BACKEND (verifyCode) ---
        // !!! Asegúrate que la ruta '/auth/verify-code' existe en tu backend y apunta a tu función `verifyCode` !!!
         const response = await axios.post(`${API_BASE_URL}/auth/verify-code`, {
              email: email, // Necesitamos el email original
              code: code,
              newPassword: newPassword
          });

          setSuccessMessage(response.data.message || 'Contraseña actualizada con éxito.');
          setError('');
          setLoading(false);
          // Cerrar modal después de mostrar éxito
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

            {/* --- Formulario Paso 1: Ingresar Email --- */}
            {step === 1 && !successMessage && ( // Ocultar form si hay mensaje de éxito
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

            {/* --- Formulario Paso 2: Ingresar Código y Nueva Contraseña --- */}
            {step === 2 && !successMessage && ( // Ocultar form si hay mensaje de éxito
              <form onSubmit={handleVerifyCodeSubmit}>
                 <div className="mb-3">
                    <p>Se envió un código al correo: <strong>{email}</strong>. Ingréselo a continuación.</p>
                 </div>
                <div className="mb-3">
                    <label htmlFor="verificationCode" className="form-label">Código de Verificación</label>
                    <input
                        type="text" // Usar text para permitir pegar fácilmente
                        inputMode="numeric" // Sugiere teclado numérico en móviles
                        className={`form-control ${error && error.toLowerCase().includes('código') ? 'is-invalid' : ''}`}
                        id="verificationCode"
                        placeholder="Ingrese el código de 6 dígitos"
                        value={code}
                        onChange={handleCodeChange}
                        maxLength={6} // Limitar a 6 caracteres
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
                   {/* Mostrar error específico de validación de contraseña */}
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
                  {/* Mensaje si no coinciden */}
                  {newPassword && confirmPassword && newPassword !== confirmPassword && (
                     <div className="invalid-feedback d-block">Las contraseñas no coinciden.</div>
                  )}
                </div>
                <button type="submit" className="btn btn-primary w-100" disabled={loading || !code || !newPassword || !confirmPassword || !!passwordValidationError || (newPassword !== confirmPassword)}>
                  {loading ? 'Verificando y Actualizando...' : 'Restablecer Contraseña'}
                </button>
              </form>
            )}
          </div> {/* Fin modal-body */}
        </div> {/* Fin modal-content */}
      </div> {/* Fin modal-dialog */}
    </div> // Fin modal container
  );
}