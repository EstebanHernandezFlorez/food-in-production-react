// AuthProvider.jsx
import axios from "axios"; // Puedes usar axios global o tu instancia configurada
import { useContext, createContext, useState, useEffect } from "react"; // Añade useEffect
import { useNavigate } from "react-router-dom";
import { authService } from '../services/authService'; // Asegúrate de importar correctamente

// import axiosInstance from "./path/to/axiosInstance"; // Opcional: Usar instancia configurada

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // Inicializa el token desde localStorage al cargar
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const navigate = useNavigate();
  // Asegúrate que esta URL es la correcta para TU endpoint de login

  // Efecto para actualizar estado si el token cambia (útil al recargar)
   useEffect(() => {
     if (token) {
       // Opcional: Podrías verificar el token aquí o decodificarlo para obtener datos del usuario
       // const decoded = jwt_decode(token); // Necesitarías libreria jwt-decode
       // setUser(decoded); // Ojo: esto no valida si el token sigue vigente en el backend
       localStorage.setItem("token", token);
     } else {
       localStorage.removeItem("token");
     }
   }, [token]);



   const loginAction = async (data) => {
     try {
       const response = await authService.login(data.email, data.password); // Usamos authService aquí
       setUser(response.user);
       setToken(response.token);
       localStorage.setItem("token", response.token);
       navigate("/home/dashboard");
     } catch (err) {
       console.error("Error en loginAction:", err.message);
       throw err; // Propagamos el error
     }
   };
   

  const logOut = () => {
    setUser(null);
    setToken(""); // Limpia el estado del token
    localStorage.removeItem("token"); // Limpia localStorage
    navigate("/");
  };

  return (
    <AuthContext.Provider value={{ token, user, loginAction, logOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;

export const useAuth = () => {
  return useContext(AuthContext);
};