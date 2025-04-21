import axios from "axios";
import { useContext, createContext, useState } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const navigate = useNavigate();
  const url = "http://localhost:3000/api/auth/login";

  const loginAction = async (data) => {
    try {
      const response = await axios.post(url, data);
      
      if (!response) {
        throw new Error(response.message);
      }

      console.log(response);

      setUser(response.data.user);
      setToken(response.data.token);
      localStorage.setItem("token", response.token);
      
      navigate("/home/dashboard");
    } catch (err) {
      console.error(err);
    }
  };

  const logOut = () => {
    setUser(null);
    setToken("");
    localStorage.removeItem("token");
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
