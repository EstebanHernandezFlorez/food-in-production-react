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
  
  // CAMBIO 1: Asegurar que id sea siempre un número
  const idCustomersNum = Number(backendCustomer.idCustomers)
  
  // Verificar que idCustomers sea un número válido
  if (isNaN(idCustomersNum)) {
    console.error(`ERROR: idCustomers no es un número válido: ${backendCustomer.idCustomers}`, backendCustomer)
  }
  
  return {
    id: idCustomersNum, // Convertir explícitamente a número
    idCustomers: idCustomersNum, // Añadir también como idCustomers para compatibilidad
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
  const { id, idCustomers, Estado, ...rest } = frontendCliente
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
      // CAMBIO 2: Verificar y loguear los datos recibidos
      console.log("Datos de clientes recibidos:", response.data.length)
      
      // Mapear y verificar que cada cliente tenga un idCustomers válido
      const mappedClients = response.data.map(cliente => {
        const mappedClient = mapToFrontend(cliente)
        if (!mappedClient.id || isNaN(mappedClient.id)) {
          console.error("Cliente con ID inválido:", cliente)
        }
        return mappedClient
      })
      
      return mappedClients
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
      // CAMBIO 3: Asegurar que idCliente sea un número
      const idClienteNum = Number(idCliente)
      if (isNaN(idClienteNum)) {
        console.error(`ERROR: ID de cliente no es un número válido: ${idCliente}`)
        throw new Error("ID de cliente inválido")
      }
      
      const response = await axios.get(`${API_URL}/${idClienteNum}`)
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
      // CAMBIO 4: Asegurar que idCliente sea un número
      const idClienteNum = Number(idCliente)
      if (isNaN(idClienteNum)) {
        console.error(`ERROR: ID de cliente no es un número válido: ${idCliente}`)
        throw new Error("ID de cliente inválido")
      }
      
      // Usa un mapeo específico si es necesario (ej, no enviar status)
      const dataToSend = mapToBackendForUpdate(clienteDataFrontend)
      await axios.put(`${API_URL}/${idClienteNum}`, dataToSend)
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
      // CAMBIO 5: Asegurar que idCliente sea un número
      const idClienteNum = Number(idCliente)
      if (isNaN(idClienteNum)) {
        console.error(`ERROR: ID de cliente no es un número válido: ${idCliente}`)
        throw new Error("ID de cliente inválido")
      }
      
      await axios.delete(`${API_URL}/${idClienteNum}`)
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
      // CAMBIO 6: Asegurar que idCliente sea un número
      const idClienteNum = Number(idCliente)
      if (isNaN(idClienteNum)) {
        console.error(`ERROR: ID de cliente no es un número válido: ${idCliente}`)
        throw new Error("ID de cliente inválido")
      }
      
      const dataToSend = { status: nuevoEstadoFrontend === "Activo" } // Envía el booleano
      await axios.patch(`${API_URL}/${idClienteNum}`, dataToSend)
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
        // CAMBIO 7: Asegurar que cada cliente tenga idCustomers como número
        const results = response.data.map(cliente => {
          // Verificar si el cliente tiene idCustomers
          if (!cliente.idCustomers && cliente.idCustomers !== 0) {
            console.error("Cliente sin idCustomers en resultados de búsqueda:", cliente)
          }
          
          // Mapear el cliente asegurando que idCustomers sea un número
          return mapToFrontend(cliente)
        })
        
        // Verificar los resultados mapeados
        console.log(`Resultados de búsqueda (${results.length}):`, 
          results.map(c => ({ id: c.id, idCustomers: c.idCustomers, nombre: c.NombreCompleto }))
        )
        
        return results
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