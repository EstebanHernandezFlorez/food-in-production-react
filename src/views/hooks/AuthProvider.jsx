// src/views/hooks/AuthProvider.jsx
import React, { useContext, createContext, useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// Corregir la importación aquí:
// Se importa 'authService' (que es la exportación nombrada) y se renombra a 'authFrontendService'
// Se importa 'AUTH_STORAGE_KEYS' como una exportación nombrada.
// Se ajusta la ruta relativa a dos niveles arriba y luego a 'services'.
import { authService as authFrontendService, AUTH_STORAGE_KEYS } from '../services/authService';
import usuarioService from '../services/usuarioService'; // Asumiendo que esta ruta es correcta
import roleFrontendService from '../services/roleServices';   // Asumiendo que esta ruta es correcta y también usa exportaciones nombradas si es necesario

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem(AUTH_STORAGE_KEYS.user);
    try { return storedUser ? JSON.parse(storedUser) : null; }
    catch (e) { console.error("AuthProvider: Error parseando storedUser", e); localStorage.removeItem(AUTH_STORAGE_KEYS.user); return null; }
  });

  const [effectivePermissions, setEffectivePermissions] = useState(() => {
    const storedPerms = localStorage.getItem(AUTH_STORAGE_KEYS.permissions);
    try { return storedPerms ? JSON.parse(storedPerms) : {}; } // Default a objeto vacío
    catch (e) { console.error("AuthProvider: Error parseando storedPerms", e); localStorage.removeItem(AUTH_STORAGE_KEYS.permissions); return {}; }
  });

  const [initialAuthCheckComplete, setInitialAuthCheckComplete] = useState(false);
  const [loading, setLoading] = useState(!!authFrontendService.getAccessToken() && !initialAuthCheckComplete);

  const navigate = useNavigate();
  const location = useLocation();

  const clearAuthDataAndSession = useCallback((shouldNavigate = true) => {
    console.log("AuthProvider: Limpiando datos de autenticación y sesión.");
    setUser(null);
    setEffectivePermissions({});
    authFrontendService.clearClientSession();
    if (shouldNavigate && location.pathname !== '/login') {
        console.log("AuthProvider: Navegando a /login después de limpiar sesión.");
        navigate("/login", { replace: true });
    }
  }, [navigate, location.pathname]); // authFrontendService no necesita ser dependencia si sus métodos no cambian

  const loadPermissionsViaDedicatedEndpoint = useCallback(async (userIdRole) => {
    if (!userIdRole) {
      console.log("AuthProvider: No se proporcionó userIdRole para cargar permisos vía endpoint.");
      return null;
    }
    console.log(`AuthProvider: Intentando cargar/refrescar permisos para idRole: ${userIdRole} vía endpoint dedicado.`);
    try {
      const permissionsData = await roleFrontendService.getRoleEffectivePermissions(userIdRole);
      setEffectivePermissions(permissionsData || {});
      localStorage.setItem(AUTH_STORAGE_KEYS.permissions, JSON.stringify(permissionsData || {}));
      console.log("AuthProvider: Permisos cargados/refrescados vía endpoint dedicado:", permissionsData);
      return permissionsData || {};
    } catch (error) {
      console.error("AuthProvider: Error cargando permisos detallados vía endpoint dedicado:", error.message);
      if (error.message.includes("No tienes los permisos necesarios")) {
        console.warn("AuthProvider: Denegado el acceso al endpoint de permisos (esperado para roles no admin). Se mantendrán los permisos actuales si existen.");
      } else {
        const storedPerms = localStorage.getItem(AUTH_STORAGE_KEYS.permissions);
        if (!storedPerms) {
            setEffectivePermissions({});
            localStorage.removeItem(AUTH_STORAGE_KEYS.permissions);
        }
      }
      return null;
    }
  }, [roleFrontendService]); // Dependencia de roleFrontendService si sus métodos pudieran cambiar (aunque raro para objetos de servicio)

  useEffect(() => {
    const attemptInitialAuth = async () => {
      const currentToken = authFrontendService.getAccessToken();
      if (currentToken && !user) {
        console.log("AuthProvider InitialLoad: Token encontrado, validando...");
        setLoading(true);
        try {
          const freshProfile = await usuarioService.getUserProfile();
          setUser(freshProfile);
          localStorage.setItem(AUTH_STORAGE_KEYS.user, JSON.stringify(freshProfile));
          console.log("AuthProvider InitialLoad: Perfil de usuario refrescado:", freshProfile);

          const storedPermsJSON = localStorage.getItem(AUTH_STORAGE_KEYS.permissions);
          let permissionsLoaded = false;
          if (storedPermsJSON) {
            try {
              const parsedPerms = JSON.parse(storedPermsJSON);
              setEffectivePermissions(parsedPerms);
              permissionsLoaded = true;
              console.log("AuthProvider InitialLoad: Permisos efectivos cargados desde localStorage.");
            } catch (e) {
              console.error("AuthProvider InitialLoad: Error parseando permisos de localStorage.", e);
              localStorage.removeItem(AUTH_STORAGE_KEYS.permissions);
            }
          }

          if (!permissionsLoaded && freshProfile && freshProfile.idRole) {
            console.log("AuthProvider InitialLoad: Permisos no en localStorage, intentando cargar vía endpoint.");
            await loadPermissionsViaDedicatedEndpoint(freshProfile.idRole);
          } else if (!freshProfile || !freshProfile.idRole) {
            console.warn("AuthProvider InitialLoad: Perfil sin idRole, no se cargarán permisos específicos.");
            setEffectivePermissions({});
            localStorage.removeItem(AUTH_STORAGE_KEYS.permissions);
          }

        } catch (error) {
          console.error("AuthProvider InitialLoad: Falló validación de token/perfil o carga de permisos:", error.message);
          if (error.response?.status === 401 || error.response?.status === 403) {
             console.log("AuthProvider InitialLoad: 401/403 detectado, limpiando sesión.");
             clearAuthDataAndSession();
          } else {
            clearAuthDataAndSession();
          }
        } finally {
          setLoading(false);
          setInitialAuthCheckComplete(true);
          console.log("AuthProvider InitialLoad: Chequeo inicial completado.");
        }
      } else {
        if (!currentToken) {
            clearAuthDataAndSession(false);
        }
        setLoading(false);
        setInitialAuthCheckComplete(true);
      }
    };

    if (!initialAuthCheckComplete) {
      attemptInitialAuth();
    }
  }, [initialAuthCheckComplete, user, clearAuthDataAndSession, loadPermissionsViaDedicatedEndpoint, authFrontendService, usuarioService]);


  const loginAction = async (credentials) => {
    console.log("AuthProvider loginAction: Iniciando login...");
    setLoading(true);
    try {
      const loginData = await authFrontendService.login(credentials); // authFrontendService.login devuelve {user, token, effectivePermissions}

      setUser(loginData.user);
      setEffectivePermissions(loginData.effectivePermissions);
      // El token ya fue manejado (guardado y puesto en headers) por authFrontendService.login

      console.log("AuthProvider loginAction: Usuario, token y permisos procesados desde respuesta de login.", loginData.user, loginData.effectivePermissions);

      setInitialAuthCheckComplete(true);
      setLoading(false);
      console.log("AuthProvider loginAction: Login exitoso, navegando a /home/dashboard.");
      navigate("/home/dashboard", { replace: true });
      return true;
    } catch (err) {
      console.error("AuthProvider loginAction: Login falló:", err.message || err);
      setUser(null); // Asegurar que el estado de React esté limpio
      setEffectivePermissions({}); // Asegurar que el estado de React esté limpio
      // authFrontendService.login ya debería haber limpiado localStorage
      setLoading(false);
      setInitialAuthCheckComplete(true);
      throw err;
    }
  };

  const logOut = useCallback(async () => {
    console.log("AuthProvider logOut: Iniciando logout...");
    setLoading(true);
    try {
      await authFrontendService.logoutBackend();
    } catch (logoutError) {
        // Manejado en authFrontendService
    } finally {
        clearAuthDataAndSession(true);
        setInitialAuthCheckComplete(false);
        setLoading(false);
        console.log("AuthProvider logOut: Sesión cerrada.");
    }
  }, [clearAuthDataAndSession, authFrontendService]);


  const can = useCallback((permissionKey, privilegeKey) => {
    if (!user || !effectivePermissions || Object.keys(effectivePermissions).length === 0) {
      return false;
    }
    const privilegesForModule = effectivePermissions[permissionKey];
    if (!privilegesForModule || !Array.isArray(privilegesForModule)) {
      return false;
    }
    return privilegesForModule.includes(privilegeKey);
  }, [user, effectivePermissions]);

  const contextValue = {
    isAuthenticated: !!user && authFrontendService.isAuthenticatedFromToken(),
    user,
    loading,
    can,
    effectivePermissions,
    loginAction,
    logOut,
    initialAuthCheckComplete
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
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
};