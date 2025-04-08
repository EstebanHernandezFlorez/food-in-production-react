import axios from "axios"

// --- ¡CONFIRMA ESTA URL BASE! ---
// Asegúrate que '/customers' es donde montaste tus rutas de clientes en el backend
const API_URL = "http://localhost:3000/customers" // Ajusta el puerto si es necesario

/**
 * Mapea los datos del backend (Customers) al formato del frontend (Clientes).
 * @param {object} backendCustomer - Objeto del backend { idCustomers, fullName, distintive, ... status }
 * @returns {object} Objeto del frontend { id, NombreCompleto, Distintivo, ... Estado }
 */
const mapToFrontend = (backendCustomer) => {
  if (!backendCustomer) return null
  return {
    id: backendCustomer.idCustomers, // Mapea idCustomers a id
    NombreCompleto: backendCustomer.fullName,
    Distintivo: backendCustomer.distintive,
    CategoriaCliente: backendCustomer.customerCategory,
    Celular: backendCustomer.cellphone || "", // Usa '' si es null/undefined
    Correo: backendCustomer.email || "",
    Direccion: backendCustomer.address || "",
    Estado: backendCustomer.status ? "Activo" : "Inactivo", // Mapea boolean a string 'Activo'/'Inactivo'
  }
}

/**
 * Mapea los datos del frontend (Clientes) al formato esperado por el backend (Customers).
 * @param {object} frontendCliente - Objeto del frontend { NombreCompleto, Distintivo, ... Estado }
 * @returns {object} Objeto para el backend { fullName, distintive, ... status }
 */
const mapToBackend = (frontendCliente) => {
  // Excluye 'id' y transforma 'Estado'
  const { id, Estado, ...rest } = frontendCliente
  return {
    fullName: rest.NombreCompleto,
    distintive: rest.Distintivo,
    customerCategory: rest.CategoriaCliente,
    cellphone: rest.Celular,
    email: rest.Correo,
    address: rest.Direccion,
    status: Estado === "Activo", // Mapea string 'Activo'/'Inactivo' a boolean
  }
}

/**
 * Mapea solo los campos necesarios para ACTUALIZAR.
 * IMPORTANTE: Por simplicidad, aquí mapeamos todo igual que mapToBackend,
 * pero si tu backend espera solo campos específicos para PUT, ajusta esto.
 * @param {object} frontendCliente - Objeto del frontend { id, NombreCompleto, ... Estado }
 * @returns {object} Objeto para el backend { fullName, distinctive, ... status }
 */
const mapToBackendForUpdate = (frontendCliente) => {
  // Excluimos 'id' porque va en la URL del PUT
  const dataToSend = mapToBackend(frontendCliente)
  // Si no quieres enviar 'status' en el PUT (si solo cambias estado con PATCH)
  // delete dataToSend.status; // Descomenta si no envías status en PUT
  return dataToSend
}

const clientesService = {
  /**
   * Obtiene todos los clientes y los mapea al formato del frontend.
   */
  getAllClientes: async () => {
    try {
      const response = await axios.get(API_URL)
      return response.data.map(mapToFrontend)
    } catch (error) {
      console.error("Error fetching clientes:", error)
      throw error // Propaga el error para que el componente lo maneje
    }
  },

  /**
   * Crea un nuevo cliente.
   * @param {object} clienteDataFrontend - Datos en formato frontend.
   */
  createCliente: async (clienteDataFrontend) => {
    try {
      const dataToSend = mapToBackend(clienteDataFrontend)
      const response = await axios.post(API_URL, dataToSend)
      return mapToFrontend(response.data) // Devuelve el cliente creado mapeado
    } catch (error) {
      console.error("Error creating cliente:", error)
      throw error
    }
  },

  /**
   * Obtiene un cliente por ID.
   * @param {number|string} idCliente - El ID del cliente (el que usa el backend, idCustomers).
   */
  getClienteById: async (idCliente) => {
    try {
      const response = await axios.get(`${API_URL}/${idCliente}`)
      return mapToFrontend(response.data)
    } catch (error) {
      console.error(`Error fetching cliente with id ${idCliente}:`, error)
      throw error
    }
  },

  /**
   * Actualiza un cliente existente. (API devuelve 204 No Content)
   * @param {number|string} idCliente - El ID del cliente (idCustomers).
   * @param {object} clienteDataFrontend - Datos en formato frontend.
   */
  updateCliente: async (idCliente, clienteDataFrontend) => {
    try {
      // Usa un mapeo específico si es necesario (ej, no enviar status)
      const dataToSend = mapToBackendForUpdate(clienteDataFrontend)
      await axios.put(`${API_URL}/${idCliente}`, dataToSend)
      // No hay datos en la respuesta (204)
    } catch (error) {
      console.error(`Error updating cliente with id ${idCliente}:`, error)
      throw error
    }
  },

  /**
   * Elimina un cliente por su ID.
   * @param {number|string} idCliente - El ID del cliente (idCustomers).
   */
  deleteCliente: async (idCliente) => {
    try {
      await axios.delete(`${API_URL}/${idCliente}`)
      // La API devuelve un mensaje, pero no necesitamos procesarlo aquí normalmente
    } catch (error) {
      console.error(`Error deleting cliente with id ${idCliente}:`, error)
      throw error
    }
  },

  /**
   * Cambia el estado (Activo/Inactivo) de un cliente usando PATCH. (API devuelve 204 No Content)
   * @param {number|string} idCliente - El ID del cliente (idCustomers).
   * @param {string} nuevoEstadoFrontend - El nuevo estado ('Activo' o 'Inactivo').
   */
  changeStateCliente: async (idCliente, nuevoEstadoFrontend) => {
    try {
      const dataToSend = { status: nuevoEstadoFrontend === "Activo" } // Envía el booleano
      await axios.patch(`${API_URL}/${idCliente}`, dataToSend)
      // No hay datos en la respuesta (204)
    } catch (error) {
      console.error(`Error changing estado cliente with id ${idCliente}:`, error)
      throw error
    }
  },

  /**
   * Busca clientes por un término (ej: nombre, distintivo).
   * Asume que el backend tiene un endpoint como GET /customers/search?term=...
   * @param {string} searchTerm - El término a buscar.
   * @returns {Promise<Array>} Una promesa que resuelve a un array de clientes (formato frontend).
   */
  searchClientes: async (searchTerm) => {
    try {
      // Validación: No buscar con términos muy cortos (causa 400 Bad Request)
      if (!searchTerm || searchTerm.length < 3) {
        console.log("Término de búsqueda demasiado corto, se requieren al menos 3 caracteres")
        return [] // Retorna array vacío en lugar de hacer la petición
      }

      // Añadir manejo de errores con validateStatus para evitar rechazos por 4xx
      const response = await axios.get(`${API_URL}/search`, {
        params: {
          term: searchTerm,
        },
        validateStatus: (status) => {
          return status < 500 // Solo rechaza si es error 500+
        },
      })

      // Verificar el status code
      if (response.status === 200) {
        return response.data.map(mapToFrontend)
      } else {
        console.warn(`API respondió con status ${response.status}: ${response.statusText}`)
        return []
      }
    } catch (error) {
      console.error(`Error searching clientes with term "${searchTerm}":`, error)
      return [] // Retorna array vacío en caso de error
    }
  },
}

export default clientesService
