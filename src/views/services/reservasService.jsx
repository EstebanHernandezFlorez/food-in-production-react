import axios from "axios"

// --- ¡CONFIRMA ESTA URL BASE! ---
const API_URL = "http://localhost:3000/reservations" // Ajusta el puerto si es necesario

/**
 * Servicio para gestionar las reservas
 */
const reservasService = {
  /**
   * Obtiene todas las reservas
   */
  getAllReservations: async () => {
    try {
      console.log("Solicitando todas las reservas a:", API_URL);
      const response = await axios.get(API_URL);
      console.log("Respuesta recibida:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error al obtener las reservas:", error);
      console.error("Detalles del error:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Crea una nueva reserva
   * @param {Object} reserva - Datos de la reserva
   */
  createReservation: async (reserva) => {
    try {
      // Log de datos originales para depuración
      console.log("Datos originales recibidos en createReservation:", JSON.stringify(reserva, null, 2));
      
      // CAMBIO 1: Asegurar que idCustomers sea un número y esté presente
      const idCustomersNum = Number(reserva.idCustomers);
      console.log("numero principal:", reserva.idCustomers);
      if (isNaN(idCustomersNum)) {
        throw new Error(`ID de cliente inválido: ${reserva.idCustomers}`);
      }
      console.log("idCustomers convertido a número:", idCustomersNum, "tipo:", typeof idCustomersNum);
      
      // CAMBIO 2: Crear una copia limpia de los datos para enviar
      // Convertir campos numéricos a números
      const dataToSend = {
        idCustomers: idCustomersNum, // Asegurar que sea un número
        dateTime: new Date(reserva.dateTime).toISOString(), // Convertir a formato ISO 8601
        numberPeople: Number(reserva.numberPeople),
        matter: reserva.matter || "",
        timeDurationR: reserva.timeDurationR,
        pass: Array.isArray(reserva.pass) 
          ? reserva.pass.map(p => ({
              fecha: p.fecha,
              cantidad: Number(p.cantidad)
            }))
          : [],
        decorationAmount: Number(reserva.decorationAmount),
        remaining: Number(reserva.remaining),
        evenType: reserva.evenType,
        totalPay: Number(reserva.totalPay),
        paymentMethod: reserva.paymentMethod,
        status: reserva.status === "pendiente" ? false : 
                reserva.status === "confirmada" ? true : 
                reserva.status === "en_proceso" ? false : 
                reserva.status === "terminada" ? true : 
                reserva.status === "anulada" ? false : false,
      };
      
      // CAMBIO 3: Añadir idAditionalServices si existe
      if (reserva.idAditionalServices && Array.isArray(reserva.idAditionalServices)) {
        dataToSend.idAditionalServices = reserva.idAditionalServices;
      } else if (reserva.servicios && Array.isArray(reserva.servicios)) {
        // Si no hay idAditionalServices pero hay servicios, extraer los IDs
        dataToSend.idAditionalServices = reserva.servicios.map(s => 
          typeof s === 'object' && s !== null ? Number(s.value) : Number(s)
        ).filter(id => !isNaN(id));
      }
      
      // Log de datos finales para depuración
      console.log("DATOS FINALES A ENVIAR:", JSON.stringify(dataToSend, null, 2));
      
      // CAMBIO 5: Configuración adicional para la solicitud
      const config = {
        headers: {
          'Content-Type': 'application/json',
        }
      };
      
      try {
        const response = await axios.post(API_URL, dataToSend, config);
        console.log("Respuesta del servidor (crear):", response.data);
        return response.data;
      } catch (axiosError) {
        console.error("Error creating reservation:", axiosError);
        console.error("Respuesta de error del servidor:", axiosError.response?.data);
        throw new Error(axiosError.response?.data?.message || axiosError.message);
      }
    } catch (error) {
      console.log("Error creating reservation:", error);
      throw error;
    }
  },

 
  /**
 * Obtiene una reserva por ID
 * @param {number} id - ID de la reserva
 */
getReservationById: async (id) => {
  try {
    console.log(`Solicitando detalles de la reserva ${id}`);
    const response = await axios.get(`${API_URL}/${id}`);
    
    // Log de la respuesta para depuración
    console.log("Respuesta de detalles de reserva:", response.data);
    
    // Verificar si la respuesta tiene la estructura esperada
    const reservation = response.data;
    
    // Verificar si falta información del cliente o servicios
    if (!reservation.Customer && reservation.idCustomers) {
      console.warn(`Advertencia: La reserva ${id} no incluye datos del cliente`);
    }
    
    if (!reservation.AditionalServices || !Array.isArray(reservation.AditionalServices) || reservation.AditionalServices.length === 0) {
      console.warn(`Advertencia: La reserva ${id} no incluye servicios adicionales o está vacío`);
    }
    
    // NUEVO: Asegurarse de que pass sea un array
    if (!reservation.pass) {
      console.warn(`Advertencia: La reserva ${id} no incluye campo pass, inicializando como array vacío`);
      reservation.pass = [];
    } else if (typeof reservation.pass === 'string') {
      try {
        console.log(`Reserva ${id} tiene pass como string, intentando parsear:`, reservation.pass);
        reservation.pass = JSON.parse(reservation.pass);
      } catch (parseError) {
        console.error(`Error al parsear pass para reserva ${id}:`, parseError);
        reservation.pass = [];
      }
    } else if (!Array.isArray(reservation.pass)) {
      console.warn(`Advertencia: La reserva ${id} tiene pass en formato incorrecto, convirtiendo a array`);
      reservation.pass = [];
    }
    
    // NUEVO: Verificar si cada elemento de pass tiene la estructura correcta
    if (Array.isArray(reservation.pass)) {
      reservation.pass = reservation.pass.map(abono => {
        // Asegurarse de que cada abono tenga fecha y cantidad
        if (!abono || typeof abono !== 'object') {
          return { fecha: '', cantidad: 0 };
        }
        return {
          fecha: abono.fecha || '',
          cantidad: abono.cantidad || 0
        };
      });
    }
    
    console.log("Reserva procesada con pass:", reservation.pass);
    return reservation;
  } catch (error) {
    console.error(`Error fetching reservation with id ${id}:`, error);
    console.error("Detalles del error:", error.response?.data || error.message);
    
    // Devolver un objeto con información de error para evitar errores en la UI
    return { 
      idReservations: id,
      error: true,
      errorMessage: error.response?.data?.message || error.message || "Error al cargar los detalles de la reserva",
      pass: [] // NUEVO: Incluir un array vacío para pass
    };
  }
},

 /**
 * Actualiza una reserva existente
 * @param {number} id - ID de la reserva
 * @param {Object} reserva - Datos actualizados de la reserva
 */
updateReservation: async (id, reserva) => {
  try {
    // NUEVO: Verificar que el ID sea válido
    if (!id) {
      console.error("ID de reserva no proporcionado o inválido:", id);
      // Intentar obtener el ID de la reserva del objeto reserva
      id = reserva.idReservations;
      if (!id) {
        throw new Error("No se proporcionó un ID de reserva válido");
      }
      console.log("Usando ID de reserva del objeto:", id);
    }
    
    // Log de datos originales para depuración
    console.log("Datos originales recibidos en updateReservation:", JSON.stringify(reserva, null, 2));
    
    // CAMBIO 6: Asegurar que idCustomers sea un número y esté presente
    const idCustomersNum = Number(reserva.idCustomers);
    if (isNaN(idCustomersNum)) {
      throw new Error(`ID de cliente inválido: ${reserva.idCustomers}`);
    }
    console.log("idCustomers convertido a número:", idCustomersNum, "tipo:", typeof idCustomersNum);
    
    // NUEVO: Asegurar que pass sea un array válido con mejor validación
    let formattedPass = [];
    if (Array.isArray(reserva.pass)) {
      formattedPass = reserva.pass.map(abono => {
        // Validar cada abono individualmente
        if (!abono || typeof abono !== 'object') {
          return { fecha: '', cantidad: 0 };
        }
        return {
          fecha: abono.fecha || '',
          cantidad: Number(abono.cantidad) || 0
        };
      });
      // Filtrar abonos inválidos (opcional)
      formattedPass = formattedPass.filter(abono => 
        abono.fecha && !isNaN(abono.cantidad) && abono.cantidad > 0
      );
    } else if (reserva.pass && typeof reserva.pass === 'object' && !Array.isArray(reserva.pass)) {
      // Si pass es un objeto pero no un array
      console.warn("El campo pass no es un array, convirtiendo a formato correcto");
      formattedPass = [{ fecha: '', cantidad: 0 }];
    }
    
    console.log("Abonos formateados para actualización:", formattedPass);
    
    // CAMBIO 7: Crear una copia limpia de los datos para enviar
    // Similar a createReservation pero para actualización
    const dataToSend = {
      idCustomers: idCustomersNum, // Asegurar que sea un número
      dateTime: new Date(reserva.dateTime).toISOString(), // Convertir a formato ISO 8601
      numberPeople: Number(reserva.numberPeople),
      matter: reserva.matter || "",
      timeDurationR: reserva.timeDurationR,
      // MODIFICADO: Usar los abonos formateados
      pass: formattedPass.length > 0 ? formattedPass : [],
      decorationAmount: Number(reserva.decorationAmount),
      remaining: Number(reserva.remaining),
      evenType: reserva.evenType,
      totalPay: Number(reserva.totalPay),
      paymentMethod: reserva.paymentMethod,
      status: reserva.status === "pendiente" ? false : 
              reserva.status === "confirmada" ? true : 
              reserva.status === "en_proceso" ? false : 
              reserva.status === "terminada" ? true : 
              reserva.status === "anulada" ? false : false,
    };
    
    // CAMBIO 8: Añadir idAditionalServices si existe
    if (reserva.idAditionalServices && Array.isArray(reserva.idAditionalServices)) {
      dataToSend.idAditionalServices = reserva.idAditionalServices;
    } else if (reserva.servicios && Array.isArray(reserva.servicios)) {
      // Si no hay idAditionalServices pero hay servicios, extraer los IDs
      dataToSend.idAditionalServices = reserva.servicios.map(s => 
        typeof s === 'object' && s !== null ? Number(s.value) : Number(s)
      ).filter(id => !isNaN(id));
    }
    
    // NUEVO: Verificar si hay abonos y calcular el total abonado
    if (formattedPass.length > 0) {
      const totalAbonado = formattedPass.reduce((sum, abono) => sum + (Number(abono.cantidad) || 0), 0);
      console.log(`Total abonado: ${totalAbonado}, Total a pagar: ${dataToSend.totalPay}`);
      
      // Opcional: Recalcular el remaining basado en los abonos
      // dataToSend.remaining = dataToSend.totalPay - totalAbonado;
    }
    
    // Log de datos finales para depuración
    console.log("DATOS FINALES A ENVIAR (UPDATE):", JSON.stringify(dataToSend, null, 2));
    console.log("URL de la solicitud:", `${API_URL}/${id}`);
    
    // CAMBIO 10: Configuración adicional para la solicitud
    const config = {
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    // NUEVO: Solución temporal - Intentar con diferentes formatos de datos
    try {
      console.log("Intentando actualizar con formato completo...");
      const response = await axios.put(`${API_URL}/${id}`, dataToSend, config);
      console.log("Respuesta del servidor (actualizar):", response.data);
      return response.data;
    } catch (firstError) {
      console.error("Primer intento fallido:", firstError);
      
      // Intentar con un formato más simple
      try {
        console.log("Intentando con formato simplificado...");
        
        // Crear un objeto más simple
        const simplifiedData = {
          idCustomers: idCustomersNum,
          dateTime: new Date(reserva.dateTime).toISOString(),
          numberPeople: Number(reserva.numberPeople),
          matter: reserva.matter || "",
          timeDurationR: reserva.timeDurationR,
          decorationAmount: Number(reserva.decorationAmount),
          totalPay: Number(reserva.totalPay),
          remaining: Number(reserva.remaining),
          evenType: reserva.evenType,
          paymentMethod: reserva.paymentMethod,
          status: typeof reserva.status === 'boolean' ? reserva.status : false
        };
        
        // Intentar sin el campo pass
        console.log("Datos simplificados:", simplifiedData);
        const response = await axios.put(`${API_URL}/${id}`, simplifiedData, config);
        console.log("Respuesta del servidor (actualizar simplificado):", response.data);
        
        // Si funciona, intentar actualizar los servicios por separado
        if (dataToSend.idAditionalServices && dataToSend.idAditionalServices.length > 0) {
          try {
            console.log("Actualizando servicios por separado...");
            await axios.post(`${API_URL}/${id}/services`, {
              idAditionalServices: dataToSend.idAditionalServices
            }, config);
          } catch (servicesError) {
            console.error("Error al actualizar servicios:", servicesError);
          }
        }
        
        return response.data;
      } catch (secondError) {
        console.error("Segundo intento fallido:", secondError);
        throw new Error(secondError.response?.data?.message || secondError.message);
      }
    }
  } catch (error) {
    console.error(`Error updating reservation with id ${id}:`, error);
    throw error;
  }
},
  /**
   * Elimina una reserva por ID
   * @param {number} id - ID de la reserva
   */
  deleteReservation: async (id) => {
    try {
      console.log(`Eliminando reserva con ID: ${id}`);
      const response = await axios.delete(`${API_URL}/${id}`);
      console.log("Respuesta del servidor (eliminar):", response.data);
      return response.data;
    } catch (error) {
      console.error(`Error deleting reservation with id ${id}:`, error);
      console.error("Detalles del error:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Cambia el estado de una reserva
   * @param {number} id - ID de la reserva
   * @param {boolean} status - Nuevo estado
   */
  changeReservationStatus: async (id, status) => {
    try {
      console.log(`Cambiando estado de reserva ${id} a: ${status}`);
      const response = await axios.patch(`${API_URL}/${id}`, { 
        status, 
        actionConfirmed: true // Asegurarse de que se envía este campo requerido
      });
      console.log("Respuesta del servidor (cambiar estado):", response.data);
      return response.data;
    } catch (error) {
      console.error(`Error changing status for reservation with id ${id}:`, error);
      console.error("Detalles del error:", error.response?.data || error.message);
      throw error;
    }
  }
};

export default reservasService;