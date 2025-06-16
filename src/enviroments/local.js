// DESPUÉS (para Vite)
// Este archivo ahora lee la variable de entorno y la exporta.
// El valor será 'http://localhost:3000' en desarrollo y la URL de producción al desplegar.
export const 
apiurl = import.meta.env.VITE_API_URL;

// DESPUÉS (para Create React App)
// Este archivo ahora lee la variable de entorno y la exporta.
// El valor será 'http://localhost:3000' en desarrollo y la URL de producción al desplegar.
//export const apiurl = process.env.REACT_APP_API_URL;