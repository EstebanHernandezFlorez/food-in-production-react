import axios from "axios";
import { useContext, createContext, useState } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("site") || "");
  const navigate = useNavigate();
  const url = "http://localhost:3000/api/auth/login";

  const loginAction = async (data) => {
    try {
      const response = await axios.post(url, data)

      console.log(response)

      if (response.data) {
        setUser(response.data.user);
        setToken(response.token);
        localStorage.setItem("site", response.token);
        navigate("/home/dashboard");
        return;
      }
      
      throw new Error(response.message);
    } catch (err) {
      console.error(err);
    }
  };

  const logOut = () => {
    setUser(null);
    setToken("");
    localStorage.removeItem("site");
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
