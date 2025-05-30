// src/views/hooks/AuthProvider.jsx
import React, { useContext, createContext, useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authService as authFrontendService, AUTH_STORAGE_KEYS } from '../services/authService';
import usuarioService from '../services/usuarioService';
import roleFrontendService from '../services/roleServices';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem(AUTH_STORAGE_KEYS.user);
    try { return storedUser ? JSON.parse(storedUser) : null; }
    catch (e) { console.error("AuthProvider: Error parseando storedUser", e); localStorage.removeItem(AUTH_STORAGE_KEYS.user); return null; }
  });

  const [effectivePermissions, setEffectivePermissions] = useState(() => {
    const storedPerms = localStorage.getItem(AUTH_STORAGE_KEYS.permissions);
    try { return storedPerms ? JSON.parse(storedPerms) : {}; }
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
  }, [navigate, location.pathname]);

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
      // ... (manejo de errores como lo tenías)
      return null;
    }
  }, []); // Quitamos roleFrontendService si es un objeto estático

  useEffect(() => {
    const attemptInitialAuth = async () => {
      const currentToken = authFrontendService.getAccessToken();
      if (currentToken && !user) { // Solo si hay token Y no hay usuario en el estado (evita re-fetch innecesario si el usuario ya está)
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

          if ((!permissionsLoaded || Object.keys(effectivePermissions).length === 0) && freshProfile && freshProfile.idRole) {
            console.log("AuthProvider InitialLoad: Permisos no en localStorage o vacíos, intentando cargar vía endpoint.");
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
            // Para otros errores, también podrías limpiar la sesión si consideras que la data es inconsistente
            clearAuthDataAndSession();
          }
        } finally {
          setLoading(false);
          setInitialAuthCheckComplete(true);
          console.log("AuthProvider InitialLoad: Chequeo inicial completado.");
        }
      } else if (!currentToken) { // Si no hay token
        if (user) { // Si había un usuario en estado pero no token, limpiar
            clearAuthDataAndSession(false); // No navegar si ya está en login por ejemplo
        }
        setLoading(false);
        setInitialAuthCheckComplete(true);
        console.log("AuthProvider InitialLoad: No hay token, chequeo inicial completado.");
      } else { // Si hay token Y hay usuario, asumimos que es válido por ahora, o que se validará en la siguiente petición
        setLoading(false);
        setInitialAuthCheckComplete(true);
         console.log("AuthProvider InitialLoad: Token y usuario ya existen, chequeo inicial completado.");
      }
    };

    if (!initialAuthCheckComplete) {
      attemptInitialAuth();
    }
  }, [initialAuthCheckComplete, user, clearAuthDataAndSession, loadPermissionsViaDedicatedEndpoint, effectivePermissions]); // Añadido effectivePermissions para el caso de que se carguen desde localStorage y luego se quiera refrescar

  const loginAction = async (credentials) => {
    console.log("AuthProvider loginAction: Iniciando login...");
    setLoading(true);
    try {
      const loginData = await authFrontendService.login(credentials); 

      setUser(loginData.user);
      setEffectivePermissions(loginData.effectivePermissions);
      // El token ya fue manejado por authFrontendService.login

      console.log("AuthProvider loginAction: Usuario, token y permisos procesados.", loginData.user, loginData.effectivePermissions);

      setInitialAuthCheckComplete(true); 
      setLoading(false);

      const userRoleName = loginData.user?.role?.roleName;
      if (userRoleName && userRoleName.toLowerCase() === "cocinero") {
        console.log("AuthProvider loginAction: Usuario Cocinero, navegando a /home/produccion/orden-produccion.");
        navigate("/home/produccion/orden-produccion", { replace: true });
      } else {
        console.log("AuthProvider loginAction: Login exitoso, navegando a /home/dashboard.");
        navigate("/home/dashboard", { replace: true });
      }
      
      return true;
    } catch (err) {
      console.error("AuthProvider loginAction: Login falló:", err.message || err);
      setUser(null); 
      setEffectivePermissions({}); 
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
        console.error("AuthProvider logOut: Error en logoutBackend (manejado en authService)", logoutError)
    } finally {
        clearAuthDataAndSession(true);
        // Resetear initialAuthCheckComplete para forzar un nuevo chequeo si el usuario vuelve a la app sin recargar
        // y el token fue limpiado. Si se navega a /login, el login volverá a setearlo.
        // Considera si esto es necesario o si quieres que se mantenga true hasta recarga de página.
        // setInitialAuthCheckComplete(false); // Podría causar re-renderizados, evaluar bien
        setLoading(false);
        console.log("AuthProvider logOut: Sesión cerrada.");
    }
  }, [clearAuthDataAndSession]); // authFrontendService no es necesario si sus métodos son estables


  const can = useCallback((permissionKey, privilegeKey) => {
    if (!user || !effectivePermissions || Object.keys(effectivePermissions).length === 0) {
      return false;
    }
    // SuperAdmin check (ejemplo, ajusta a tu lógica si tienes superadmins)
    // if (user.isSuperAdmin) return true; 

    const privilegesForModule = effectivePermissions[permissionKey];
    if (!privilegesForModule || !Array.isArray(privilegesForModule)) {
      return false;
    }
    return privilegesForModule.includes(privilegeKey);
  }, [user, effectivePermissions]);

  const contextValue = {
    isAuthenticated: !!user && authFrontendService.isAuthenticatedFromToken(),
    user,
    loading, // Exponer loading para que otros componentes puedan reaccionar
    can,
    effectivePermissions,
    loginAction,
    logOut,
    initialAuthCheckComplete // Exponer para saber si el chequeo inicial ya se hizo
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