import { useState } from "react";
import { useAuth } from "../../hooks/AuthProvider"; // Asegúrate que la ruta sea correcta
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from 'lucide-react'; // <<<--- 1. Importar iconos

// --- Imagenes ---
import logoSrc from "../../../assets/logoFIP.png";
import restauranteImg2 from "../../../assets/fondoResta2.jpg";
import restauranteImg3 from "../../../assets/fondoResta3.jpg";
import restauranteImg4 from "../../../assets/fondoResta4.jpg";

// --- CSS ---
import "../../../assets/css/Login.css";

// Función simple de validación de email
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export default function Login() {
  const [input, setInput] = useState({
    email: "",
    password: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [authError, setAuthError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // <<<--- 2. Estado para visibilidad

  const auth = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setInput((prev) => ({ ...prev, [id]: value }));
    if (formErrors[id]) {
      setFormErrors((prev) => ({ ...prev, [id]: null }));
    }
    setAuthError(null);
  };

  // Función para alternar la visibilidad de la contraseña
  const togglePasswordVisibility = () => {
    setShowPassword(prevState => !prevState);
  };

  const validateForm = () => {
    // ... (sin cambios)
    const errors = {};
    if (!input.email) {
      errors.email = "El correo electrónico es obligatorio.";
    } else if (!isValidEmail(input.email)) {
      errors.email = "Ingrese un formato de correo electrónico válido.";
    }
    if (!input.password) {
      errors.password = "La contraseña es obligatoria.";
    }
    return errors;
  };

  const handleSubmitEvent = async (e) => {
    // ... (sin cambios)
     e.preventDefault();
    setAuthError(null);
    setFormErrors({});

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      await auth.loginAction(input);
      navigate("/home");
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || "Error al iniciar sesión. Verifique sus credenciales o intente más tarde.";
      setAuthError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    // Contenedor principal
    <div className="login-page-wrapper min-vh-100 d-flex align-items-center justify-content-center p-3">

      {/* Contenedor del Collage de Fondo */}
      <div className="page-background-collage-container" aria-hidden="true">
         <div className="collage-grid">
            <div className="collage-column main-column"><div className="collage-item"><img src={restauranteImg2} alt="" /></div></div>
            <div className="collage-column secondary-column">
              <div className="collage-item"><img src={restauranteImg3} alt="" /></div>
              <div className="collage-item"><img src={restauranteImg4} alt="" /></div>
              <div className="collage-item"><img src={logoSrc} alt="" /></div>
            </div>
         </div>
      </div>

      {/* Card del formulario */}
      <div className="card login-form-card shadow-lg" style={{ width: '100%', maxWidth: '450px' }}>
        <div className="card-body p-4 p-md-5">
          <form onSubmit={handleSubmitEvent} noValidate>
            <div className="text-center mb-4">
              <img src={logoSrc} alt="Logo FIP" style={{ width: 100, height: 'auto' }} />
            </div>

            {authError && (<div className="alert alert-danger text-center py-2 mb-4" role="alert">{authError}</div>)}

            {/* Campo Email (sin cambios) */}
            <div className="form-outline mb-3">
              <label htmlFor="email" className="form-label fw-bold">Usuario</label>
              <input
                type="email"
                className={`form-control form-control-lg border border-black border-2 ${formErrors.email ? 'is-invalid' : ''}`}
                id="email" placeholder="Ingrese su correo" value={input.email} onChange={handleInputChange} disabled={loading} aria-describedby="emailError"
              />
              {formErrors.email && <div id="emailError" className="invalid-feedback d-block">{formErrors.email}</div>}
            </div>

            {/* --- Campo Contraseña (MODIFICADO) --- */}
            <div className="mb-3"> {/* Envuelve label y input-group */}
              <label htmlFor="password" className="form-label fw-bold">Contraseña</label>
              <div className="input-group"> {/* <<<--- 3. Input Group */}
                <input
                  // <<<--- 4. Tipo dinámico
                  type={showPassword ? "text" : "password"}
                  className={`form-control form-control-lg border border-black border-2 ${formErrors.password ? 'is-invalid' : ''}`}
                  // Quitar borde derecho si el botón está pegado
                  style={{ borderRight: 'none' }}
                  id="password"
                  placeholder="Ingrese su contraseña"
                  value={input.password}
                  onChange={handleInputChange}
                  disabled={loading}
                  aria-describedby="passwordError"
                />
                {/* <<<--- 5. Botón para alternar visibilidad */}
                <button
                  className={`btn border border-black border-2 password-toggle-icon ${formErrors.password ? 'border-danger' : ''}`} // Hereda borde y color de error
                  type="button"
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  style={{ borderLeft: 'none' }} // Quita el borde izquierdo del botón
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {/* Mensaje de error fuera del input-group */}
              {formErrors.password && <div id="passwordError" className="invalid-feedback d-block">{formErrors.password}</div>}
            </div>
            {/* --- Fin Campo Contraseña --- */}


            <div className="text-center my-3">
              <a href="#!" className="text-body text-decoration-none">¿Ha olvidado su contraseña?</a>
            </div>

            <div className="d-grid gap-2 mt-4">
              <button type="submit" className="btn btn-login-custom btn-lg" disabled={loading}>
                {loading ? (<><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Ingresando...</>) : ('Ingresar')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}