// AuthProvider.jsx
import axios from "axios"; // Puedes usar axios global o tu instancia configurada
import { useContext, createContext, useState, useEffect } from "react"; // Añade useEffect
import { useNavigate } from "react-router-dom";
import { authService } from '../services/authService'; // Asegúrate de importar correctamente

// import axiosInstance from "./path/to/axiosInstance"; // Opcional: Usar instancia configurada

const AuthContext = createContext();
const url = "http://localhost:3000/api/auth/login"; // Cambia esto a tu URL de login

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // Inicializa el token desde localStorage al cargar
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const navigate = useNavigate();
  // Asegúrate que esta URL es la correcta para TU endpoint de login

  const loginAction = async (data) => {
    try {
      const response = await axios.post(url, data);

      if (!response) {
        throw new Error(response.message);
      }


      setUser(response.data.user);
      setToken(response.data.token);
      localStorage.setItem("token", response.data.token);

      navigate("/home/dashboard");
    } catch (err) {
      console.error(err);
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