import axios from "axios";
// ¡Verifica que esta ruta relativa sea correcta desde donde está axiosConfig.js hasta environments/local.js!
import { apiurl } from "../../enviroments/local";
// ¡Verifica que esta ruta sea correcta!
import { authService } from "./authService";

// Añade un console.log para verificar que la URL se importa correctamente
console.log("API Base URL importada:", apiurl); // Deberías ver 'http://localhost:3000' en la consola

// Crear una instancia de Axios
const axiosInstance = axios.create({
  // Usa la variable importada DIRECTAMENTE
  baseURL: apiurl,
});

// Interceptor para solicitudes (ESTO PARECE ESTAR BIEN)
axiosInstance.interceptors.request.use(
  (config) => {
    const token = authService.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Puedes añadir un log aquí también si quieres ver la URL final de la petición
    // console.log('Petición Axios Config:', config);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para respuestas (ESTO PARECE ESTAR BIEN)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Respuesta no autorizada (401). Limpiando sesión.');
      authService.clearSession();
      // Considera redirigir al login
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;

// Asegúrate de que NO haya ninguna otra definición o exportación de 'apiurl' al final de ESTE archivo.