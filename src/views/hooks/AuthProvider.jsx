// src/views/hooks/AuthProvider.js

import axios from "axios";
import { useContext, createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from '../services/authService';
import userServiceApi from '../services/usuarioService';

const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  // Intenta inicializar desde localStorage sincrónicamente
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("authUser");
    try { return storedUser ? JSON.parse(storedUser) : null; }
    catch (e) { localStorage.removeItem("authUser"); return null; }
  });
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  // loading es true solo si encontramos un token inicial que necesita validación
  const [loading, setLoading] = useState(!!localStorage.getItem("token"));
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem("token");

    // Solo valida si encontramos un token al inicio
    if (storedToken) {
      console.log("AuthProvider: Token encontrado, iniciando validación...");
      const validateToken = async () => {
        try {
          // Asume que userServiceApi ya usa el token (interceptor)
          const freshProfile = await userServiceApi.getUserProfile();
          console.log("AuthProvider: Token válido, perfil refrescado.");
          setUser(freshProfile);
          localStorage.setItem("authUser", JSON.stringify(freshProfile)); // Actualiza user en storage
          // No es necesario setToken si no cambió
        } catch (error) {
          console.error("AuthProvider: Falló validación de token:", error);
          // --- SOLO LIMPIAR, NO NAVEGAR ---
          setUser(null);
          setToken("");
          localStorage.removeItem("token");
          localStorage.removeItem("authUser");
          // La navegación la hará el ProtectedRoute al ver que no hay token
        } finally {
          // La validación (o intento) ha terminado
          setLoading(false);
          console.log("AuthProvider: Validación terminada.");
        }
      };
      validateToken();
    } else {
      // Si no había token, no hay nada que validar/cargar
      setLoading(false);
       console.log("AuthProvider: No hay token inicial, carga terminada.");
    }
    // La dependencia vacía es correcta, solo se ejecuta al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const loginAction = async (data) => {
    // setLoading(true); // Quitado, el componente Login maneja su propio estado
    try {
      const response = await authService.login(data);
      setUser(response.user);
      setToken(response.token);
      localStorage.setItem("token", response.token);
      localStorage.setItem("authUser", JSON.stringify(response.user));
      navigate("/home/dashboard"); // Navegación OK aquí después del login
    } catch (err) {
      console.error("Login failed:", err);
       // Limpiar estado localmente por si acaso
      setUser(null);
      setToken("");
      localStorage.removeItem("token");
      localStorage.removeItem("authUser");
      throw err; // Relanzar para que Login muestre el error
    } /* finally { setLoading(false); } // Quitado */
  };

  const logOut = () => {
    setUser(null);
    setToken("");
    localStorage.removeItem("token");
    localStorage.removeItem("authUser");
    navigate("/"); // Navegación OK aquí para logout
  };

  const contextValue = { token, user, loading, loginAction, logOut };

  return (
    <AuthContext.Provider value={contextValue}>
      {/* Muestra un loader global MIENTRAS valida */}
      {loading ? (
         <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
             {/* Aquí puedes poner un Spinner de Ant Design u otro */}
             <span>Verificando sesión...</span>
         </div>
      ) : (
        // Renderiza la aplicación una vez que la carga/validación termina
         children
      )}
    </AuthContext.Provider>
  );
};

export default AuthProvider;

export const useAuth = () => {
  return useContext(AuthContext);
};





