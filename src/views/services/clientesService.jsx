import axios from "axios"
import { apiurl } from '../../enviroments/local';
const API_URL = `${apiurl}/api/customers`; 

/**
 * @param {object} backendCustomer 
 * @returns {object} 
 */
const mapToFrontend = (backendCustomer) => {
  if (!backendCustomer) return null
  
 
  const idCustomersNum = Number(backendCustomer.idCustomers)
  
  
  if (isNaN(idCustomersNum)) {
    console.error(`ERROR: idCustomers no es un número válido: ${backendCustomer.idCustomers}`, backendCustomer)
  }
  
  return {
    id: idCustomersNum, 
    idCustomers: idCustomersNum, 
    NombreCompleto: backendCustomer.fullName,
    Distintivo: backendCustomer.distintive,
    CategoriaCliente: backendCustomer.customerCategory,
    Celular: backendCustomer.cellphone || "", 
    Correo: backendCustomer.email || "",
    Direccion: backendCustomer.address || "",
    Estado: backendCustomer.status ? "Activo" : "Inactivo", 
  }
}

/**
 
 * @param {object} frontendCliente 
 * @returns {object} 
 */
const mapToBackend = (frontendCliente) => {

  const { id, idCustomers, Estado, ...rest } = frontendCliente
  if (rest.Correo === "") delete rest.Correo;
  if (rest.Direccion === "") delete rest.Direccion;
  return {
    fullName: rest.NombreCompleto,
    distintive: rest.Distintivo,
    customerCategory: rest.CategoriaCliente,
     cellphone: rest.Celular ? parseInt(rest.Celular, 10) : undefined,
    email: rest.Correo,
    address: rest.Direccion,
    status: Estado === "Activo", 
  }
}

/**
 *
 * @param {object} frontendCliente 
 * @returns {object} 
 */
const mapToBackendForUpdate = (frontendCliente) => {
  const dataToSend = mapToBackend(frontendCliente)
  return dataToSend
}

const clientesService = {
  /**
   
   */
  getAllClientes: async () => {
    try {
      const response = await axios.get(API_URL)
      
      console.log("Datos de clientes recibidos:", response.data.length)
      
      
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
      throw error 
    }
  },

  /**
   * Crea un nuevo cliente.
   * @param {object} clienteDataFrontend 
   */
  createCliente: async (clienteDataFrontend) => {
    try {
      const dataToSend = mapToBackend(clienteDataFrontend)
      const response = await axios.post(API_URL, dataToSend)
      return mapToFrontend(response.data) 
    } catch (error) {
      console.error("Error creating cliente:", error)
      throw error
    }
  },

  /**
   
   * @param {number|string} idCliente 
   */
  getClienteById: async (idCliente) => {
    try {
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
   
   * @param {number|string} idCliente 
   * @param {object} clienteDataFrontend 
   */
  updateCliente: async (idCliente, clienteDataFrontend) => {
    try {
      
      const idClienteNum = Number(idCliente)
      if (isNaN(idClienteNum)) {
        console.error(`ERROR: ID de cliente no es un número válido: ${idCliente}`)
        throw new Error("ID de cliente inválido")
      }
      
      
      const dataToSend = mapToBackendForUpdate(clienteDataFrontend)
      await axios.put(`${API_URL}/${idClienteNum}`, dataToSend)
      
    } catch (error) {
      console.error(`Error updating cliente with id ${idCliente}:`, error)
      throw error
    }
  },

  /**
   * Elimina un cliente por su ID.
   * @param {number|string} idCliente 
   */
  deleteCliente: async (idCliente) => {
    try {
      
      const idClienteNum = Number(idCliente)
      if (isNaN(idClienteNum)) {
        console.error(`ERROR: ID de cliente no es un número válido: ${idCliente}`)
        throw new Error("ID de cliente inválido")
      }
      
      await axios.delete(`${API_URL}/${idClienteNum}`)
     
    } catch (error) {
      console.error(`Error deleting cliente with id ${idCliente}:`, error)
      throw error
    }
  },

  /**

   * @param {number|string} idCliente 
   * @param {string} nuevoEstadoFrontend 
   */
  changeStateCliente: async (idCliente, nuevoEstadoFrontend) => {
    try {
   
      const idClienteNum = Number(idCliente)
      if (isNaN(idClienteNum)) {
        console.error(`ERROR: ID de cliente no es un número válido: ${idCliente}`)
        throw new Error("ID de cliente inválido")
      }
      
      const dataToSend = { status: nuevoEstadoFrontend === "Activo" } 
      await axios.patch(`${API_URL}/${idClienteNum}`, dataToSend)
      
    } catch (error) {
      console.error(`Error changing estado cliente with id ${idCliente}:`, error)
      throw error
    }
  },

  /**

   * @param {string} searchTerm 
   * @returns {Promise<Array>} 
   */
  searchClientes: async (searchTerm) => {
    try {
      
      if (!searchTerm || searchTerm.length < 3) {
        console.log("Término de búsqueda demasiado corto, se requieren al menos 3 caracteres")
        return [] 
      }

      
      const response = await axios.get(`${API_URL}/search`, {
        params: {
          term: searchTerm,
        },
        validateStatus: (status) => {
          return status < 500 
        },
      })

      if (response.status === 200) {
   
        const results = response.data.map(cliente => {
          if (!cliente.idCustomers && cliente.idCustomers !== 0) {
            console.error("Cliente sin idCustomers en resultados de búsqueda:", cliente)
          }
          
          
          return mapToFrontend(cliente)
        })
        
        
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
      return [] 
    }
  },
}

export default clientesService