// src/views/hooks/AuthProvider.jsx
import React, { useContext, createContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { authService, AUTH_STORAGE_KEYS } from '../services/authService';
import usuarioService from '../services/usuarioService';
import roleService from '../services/roleServices';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem(AUTH_STORAGE_KEYS.user);
    try { return storedUser ? JSON.parse(storedUser) : null; }
    catch (e) { console.error("AuthProvider: Error parsing storedUser", e); localStorage.removeItem(AUTH_STORAGE_KEYS.user); return null; }
  });

  const [effectivePermissions, setEffectivePermissions] = useState(() => {
    const storedPerms = localStorage.getItem(AUTH_STORAGE_KEYS.permissions);
    try { return storedPerms ? JSON.parse(storedPerms) : {}; }
    catch (e) { console.error("AuthProvider: Error parsing storedPerms", e); localStorage.removeItem(AUTH_STORAGE_KEYS.permissions); return {}; }
  });

  const [initialAuthCheckComplete, setInitialAuthCheckComplete] = useState(false);
  const [loading, setLoading] = useState(!!authService.getAccessToken() && !initialAuthCheckComplete);

  const navigate = useNavigate();

  const clearAuthDataAndNavigate = useCallback(() => {
    console.log("AuthProvider: Clearing auth data and session.");
    setUser(null);
    setEffectivePermissions({});
    authService.clearClientSession(); // Limpia token, user, permissions de localStorage
    // Navegación se maneja externamente o en logOut/loginAction
  }, []);

  const loadEffectivePermissions = useCallback(async (userIdRole) => {
    if (!userIdRole) {
      console.log("AuthProvider: No userIdRole provided to load permissions.");
      setEffectivePermissions({});
      localStorage.removeItem(AUTH_STORAGE_KEYS.permissions);
      return {}; // Devuelve objeto vacío
    }
    console.log(`AuthProvider: Loading permissions for idRole: ${userIdRole}`);
    try {
      const permissionsData = await roleService.getRoleEffectivePermissions(userIdRole);
      setEffectivePermissions(permissionsData || {});
      localStorage.setItem(AUTH_STORAGE_KEYS.permissions, JSON.stringify(permissionsData || {}));
      console.log("AuthProvider: Permissions loaded:", permissionsData);
      return permissionsData || {};
    } catch (error) {
      console.error("AuthProvider: Error loading detailed permissions:", error);
      setEffectivePermissions({});
      localStorage.removeItem(AUTH_STORAGE_KEYS.permissions);
      return {}; // Devuelve objeto vacío en caso de error
    }
  }, []);


  useEffect(() => {
    const attemptInitialAuth = async () => {
      const currentToken = authService.getAccessToken();
      if (currentToken) {
        console.log("AuthProvider InitialLoad: Token found, validating...");
        setLoading(true);
        try {
          const freshProfile = await usuarioService.getUserProfile();
          setUser(freshProfile);
          localStorage.setItem(AUTH_STORAGE_KEYS.user, JSON.stringify(freshProfile));
          console.log("AuthProvider InitialLoad: User profile refreshed:", freshProfile);

          if (freshProfile && freshProfile.idRole) {
            await loadEffectivePermissions(freshProfile.idRole);
          } else {
            console.warn("AuthProvider InitialLoad: Profile missing idRole, no permissions loaded.");
            setEffectivePermissions({});
            localStorage.removeItem(AUTH_STORAGE_KEYS.permissions);
          }
        } catch (error) {
          console.error("AuthProvider InitialLoad: Failed token/profile validation:", error);
          if (error.response?.status === 401) {
            console.log("AuthProvider InitialLoad: 401 detected, axiosConfig should handle session cleanup.");
            // authService.clearClientSession(); // Redundante si axiosConfig lo hace, pero seguro
            // setUser(null);
            // setEffectivePermissions({});
          } else {
            clearAuthDataAndNavigate();
          }
        } finally {
          setLoading(false);
          setInitialAuthCheckComplete(true);
          console.log("AuthProvider InitialLoad: Initial check completed.");
        }
      } else {
        console.log("AuthProvider InitialLoad: No initial token. Check completed.");
        setUser(null);
        setEffectivePermissions({});
        setLoading(false);
        setInitialAuthCheckComplete(true);
      }
    };

    if (!initialAuthCheckComplete) {
      attemptInitialAuth();
    }
  }, [initialAuthCheckComplete, loadEffectivePermissions, clearAuthDataAndNavigate]);


  const loginAction = async (credentials) => {
    console.log("AuthProvider loginAction: Initiating login...");
    setLoading(true);
    try {
      // authService.login DEBERÍA devolver { user, token, effectivePermissions }
      // O, si authService.login solo devuelve { user, token },
      // entonces los permisos se cargan aquí como antes.
      // Tu authService del backend sí parece que está construyendo `effectivePermissionsForFrontend`
      // pero no lo está devolviendo en la respuesta del login. El frontend pide los permisos
      // por separado a /effective-permissions, lo cual está bien y `loadEffectivePermissions` lo hace.

      const loginResponse = await authService.login(credentials); // authService ya guarda el token

      if (!loginResponse.user || !loginResponse.token) {
        throw new Error("Incomplete login response from authService.");
      }
      
      const loggedInUser = loginResponse.user;
      setUser(loggedInUser);
      localStorage.setItem(AUTH_STORAGE_KEYS.user, JSON.stringify(loggedInUser));
      console.log("AuthProvider loginAction: User and token processed.", loggedInUser);

      if (loggedInUser && loggedInUser.idRole) {
        // Llama a loadEffectivePermissions que también los guarda en localStorage
        await loadEffectivePermissions(loggedInUser.idRole);
      } else {
        console.warn("AuthProvider loginAction: Logged in user without idRole. No permissions loaded.");
        setEffectivePermissions({});
        localStorage.removeItem(AUTH_STORAGE_KEYS.permissions);
      }
      setInitialAuthCheckComplete(true);
      setLoading(false);
      console.log("AuthProvider loginAction: Login successful, navigating to /home/dashboard.");
      navigate("/home/dashboard", { replace: true });
    } catch (err) {
      console.error("AuthProvider loginAction: Login failed:", err.message || err);
      clearAuthDataAndNavigate();
      setLoading(false);
      setInitialAuthCheckComplete(true);
      throw err;
    }
  };

  const logOut = useCallback(async () => {
    console.log("AuthProvider logOut: Initiating logout...");
    setLoading(true);
    try {
      await authService.logoutBackend();
    } catch (logoutError) {
        console.error("AuthProvider logOut: Error during backend logout, proceeding with client cleanup.", logoutError);
    } finally {
        clearAuthDataAndNavigate();
        setInitialAuthCheckComplete(false); // Reset for potential re-login
        setLoading(false);
        console.log("AuthProvider logOut: Session closed. Navigating to login.");
        if (window.location.pathname !== '/login') {
            navigate("/login", { replace: true });
        }
    }
  }, [navigate, clearAuthDataAndNavigate]);


  const can = useCallback((permissionKey, privilegeKey) => {
    if (!user || !effectivePermissions || Object.keys(effectivePermissions).length === 0) {
      // console.log(`CAN CHECK: No user or permissions. PKey: ${permissionKey}, PrivKey: ${privilegeKey} -> FALSE`);
      return false;
    }

    const privilegesForModule = effectivePermissions[permissionKey];
    if (!privilegesForModule || !Array.isArray(privilegesForModule)) {
      // console.log(`CAN CHECK: No privileges for module ${permissionKey}. PrivKey: ${privilegeKey} -> FALSE`);
      return false;
    }
    const hasPrivilege = privilegesForModule.includes(privilegeKey);
    // console.log(`CAN CHECK: Module: ${permissionKey}, Privileges: [${privilegesForModule.join(', ')}], Required: ${privilegeKey} -> ${hasPrivilege}`);
    return hasPrivilege;
  }, [user, effectivePermissions]);

  const contextValue = {
    isAuthenticated: !!user && authService.isAuthenticatedFromToken(),
    user,
    loading,
    can,
    effectivePermissions, // Exponer directamente para que MenuList lo use
    loginAction,
    logOut,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};