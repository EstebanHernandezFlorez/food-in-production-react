// src/views/hooks/AuthProvider.jsx
import React, { useContext, createContext, useState, useEffect, useCallback, useMemo } from "react";
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
  const [loading, setLoading] = useState(!!authFrontendService.getAccessToken());

  const navigate = useNavigate();
  const location = useLocation();

  // --- CORRECCIÓN 1: Estabilizar clearAuthDataAndSession ---
  // Se elimina 'location.pathname' de las dependencias. La función usará el valor
  // de 'location' que esté en el scope cuando se llame, pero la referencia a la función no cambiará en cada render.
  const clearAuthDataAndSession = useCallback((shouldNavigate = true) => {
    console.log("AuthProvider: Limpiando datos de autenticación y sesión.");
    setUser(null);
    setEffectivePermissions({});
    authFrontendService.clearClientSession();
    if (shouldNavigate && location.pathname !== '/login') {
        console.log("AuthProvider: Navegando a /login después de limpiar sesión.");
        navigate("/login", { replace: true });
    }
  }, [navigate, location]); // Usamos 'location' en lugar de 'location.pathname' para mayor estabilidad si es necesario

  const loadPermissionsViaDedicatedEndpoint = useCallback(async (userIdRole) => {
    if (!userIdRole) return null;
    console.log(`AuthProvider: Cargando permisos para idRole: ${userIdRole}`);
    try {
      const permissionsData = await roleFrontendService.getRoleEffectivePermissions(userIdRole);
      const perms = permissionsData || {};
      setEffectivePermissions(perms);
      localStorage.setItem(AUTH_STORAGE_KEYS.permissions, JSON.stringify(perms));
      console.log("AuthProvider: Permisos cargados vía endpoint:", perms);
      return perms;
    } catch (error) {
      console.error("AuthProvider: Error cargando permisos:", error.message);
      return null;
    }
  }, []);

  // --- CORRECCIÓN 2: El useEffect de autenticación principal ---
  // Este efecto ahora SÓLO se ejecutará una vez, gracias a la puerta `initialAuthCheckComplete`
  // y a un array de dependencias vacío.
  useEffect(() => {
    const attemptInitialAuth = async () => {
      const currentToken = authFrontendService.getAccessToken();

      if (currentToken) {
        console.log("AuthProvider InitialLoad: Token encontrado, validando...");
        try {
          // No necesitamos comprobar `!user` porque este efecto solo corre una vez.
          const freshProfile = await usuarioService.getUserProfile();
          setUser(freshProfile);
          localStorage.setItem(AUTH_STORAGE_KEYS.user, JSON.stringify(freshProfile));
          
          if (freshProfile?.idRole) {
            // Cargar permisos siempre después de obtener el perfil para asegurar consistencia.
            await loadPermissionsViaDedicatedEndpoint(freshProfile.idRole);
          }

        } catch (error) {
          console.error("AuthProvider InitialLoad: Falló validación de token/perfil:", error.message);
          // Si la validación falla (ej. 401), limpiamos todo.
          clearAuthDataAndSession();
        } finally {
            setLoading(false);
        }
      } else {
        // Si no hay token, no hay nada que hacer, el usuario no está logueado.
        setLoading(false);
        console.log("AuthProvider InitialLoad: No hay token.");
      }
      // Marcamos el chequeo como completo al final de todo el proceso.
      setInitialAuthCheckComplete(true);
      console.log("AuthProvider InitialLoad: Chequeo inicial completado.");
    };

    // La puerta: solo intentar la autenticación si no se ha hecho antes.
    if (!initialAuthCheckComplete) {
      attemptInitialAuth();
    }
  // --- Array de dependencias vacío `[]` es crucial para que se ejecute SÓLO UNA VEZ al montar.
  }, [initialAuthCheckComplete, clearAuthDataAndSession, loadPermissionsViaDedicatedEndpoint]);

  const loginAction = async (credentials) => {
    // ... tu función de login está bien, no necesita cambios ...
    console.log("AuthProvider loginAction: Iniciando login...");
    setLoading(true);
    try {
      const loginData = await authFrontendService.login(credentials); 
      setUser(loginData.user);
      setEffectivePermissions(loginData.effectivePermissions);
      console.log("AuthProvider loginAction: Usuario, token y permisos procesados.", loginData.user, loginData.effectivePermissions);
      setInitialAuthCheckComplete(true); 
      setLoading(false);
      const userRoleName = loginData.user?.role?.roleName;
      if (userRoleName && userRoleName.toLowerCase() === "cocinero") {
        navigate("/home/produccion/orden-produccion", { replace: true });
      } else {
        navigate("/home/dashboard", { replace: true });
      }
      return true;
    } catch (err) {
      console.error("AuthProvider loginAction: Login falló:", err.message || err);
      clearAuthDataAndSession(false); // Limpiar datos sin navegar
      setLoading(false);
      throw err;
    }
  };

  const logOut = useCallback(async () => {
    // ... tu función de logout está bien ...
    console.log("AuthProvider logOut: Iniciando logout...");
    try {
      await authFrontendService.logoutBackend();
    } catch (logoutError) {
        console.error("AuthProvider logOut: Error en logoutBackend", logoutError)
    } finally {
        clearAuthDataAndSession(true);
        console.log("AuthProvider logOut: Sesión cerrada.");
    }
  }, [clearAuthDataAndSession]);

  const can = useCallback((permissionKey, privilegeKey) => {
    // ... tu función can está bien ...
    if (!user || !effectivePermissions || Object.keys(effectivePermissions).length === 0) return false;
    const privilegesForModule = effectivePermissions[permissionKey];
    if (!privilegesForModule || !Array.isArray(privilegesForModule)) return false;
    return privilegesForModule.includes(privilegeKey);
  }, [user, effectivePermissions]);

  // --- CORRECCIÓN 3: Memoizar el valor del contexto ---
  // Esto previene re-renderizados innecesarios en todos los componentes hijos
  // que consumen este contexto.
  const contextValue = useMemo(() => ({
    isAuthenticated: !!user && authFrontendService.isAuthenticatedFromToken(),
    user,
    loading,
    can,
    effectivePermissions,
    loginAction,
    logOut,
    initialAuthCheckComplete
  }), [user, loading, can, effectivePermissions, initialAuthCheckComplete, loginAction, logOut]);

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