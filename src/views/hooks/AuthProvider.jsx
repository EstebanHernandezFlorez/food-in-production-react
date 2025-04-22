import axios from "axios";
import { useContext, createContext, useState } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const defaultUser = {
    name: "Default User",
    email: "defaultuser@example.com",
  };

  const defaultToken = "default-token";

  const [user, setUser] = useState(
    localStorage.getItem("token") ? null : defaultUser
  );
  
  const [token, setToken] = useState(
    localStorage.getItem("token") || defaultToken
  );

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
      localStorage.setItem("token", response.data.token);

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
