// src/views/hooks/AuthProvider.js

import axios from "axios";
import { useContext, createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from '../services/authService'; // Asume que esto está bien

// Cambia esta línea:
// import { getUserProfile } from '../services/usuarioService'; // <-- LÍNEA INCORRECTA
import userServiceApi from '../services/usuarioService'; // <-- LÍNEA CORREGIDA (Importa el default y renómbralo)

const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();





  

  useEffect(() => {
    const fetchInitialUser = async () => {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        try {
          // Cambia esta línea:
          // const profile = await getUserProfile(); // <-- LLAMADA INCORRECTA
          const profile = await userServiceApi.getUserProfile(); // <-- LLAMADA CORREGIDA (Usa el objeto importado)
          setUser(profile);
          setToken(storedToken);
        } catch (error) {
          console.error("Failed to fetch user profile on load:", error);
          localStorage.removeItem("token");
          setToken("");
          setUser(null);
          // Solo navega si falla la carga inicial con token
          navigate("/");
        }
      }
      setLoading(false);
    };

    fetchInitialUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Ejecutar solo una vez al montar


  const loginAction = async (data) => {
    setLoading(true);
    try {
      const response = await authService.login(data);
      setUser(response.user);
      setToken(response.token);
      localStorage.setItem("token", response.token);
      navigate("/home/dashboard");
    } catch (err) {
      console.error("Login failed:", err);
      throw err;
    } finally {
       setLoading(false);
    }
  };

  const logOut = () => {
    setUser(null);
    setToken("");
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, loginAction, logOut }}>
      {/* Renderiza children DESPUÉS de la carga inicial, incluso si falla */}
      {!loading && children}
      {/* Muestra "Cargando" solo DURANTE la carga inicial */}
      {loading && <div>Cargando sesión...</div>}
    </AuthContext.Provider>
  );
};

export default AuthProvider;

export const useAuth = () => {
  return useContext(AuthContext);
};





