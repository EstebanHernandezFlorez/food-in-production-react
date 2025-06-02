import axios from "axios";

// Usar la URL directamente para evitar problemas con variables de entorno
const API_URL = "http://localhost:3000/reservations";

/**
 * Mapeo de estados entre la UI y la API
 * La API usa un ENUM para el estado, no un booleano
 */
const mapUIStateToAPI = (uiState) => {
  // Validar que el estado sea uno de los valores permitidos
  if (
    typeof uiState === "string" &&
    ["pendiente", "confirmada", "en_proceso", "terminada", "anulada"].includes(uiState.toLowerCase()) // Asegurar minúsculas
  ) {
    return uiState.toLowerCase();
  }

  // Valor por defecto si no es válido
  console.warn(`Estado UI inválido recibido: ${uiState}, usando 'pendiente' por defecto.`);
  return "pendiente";
};

const mapAPIStateToUI = (apiStatus) => {
  // console.log("Estado API recibido para mapear a UI:", apiStatus); // Logueo más específico

  // Si el estado es uno de los valores válidos del ENUM, lo usamos directamente
  if (
    typeof apiStatus === "string" &&
    ["pendiente", "confirmada", "en_proceso", "terminada", "anulada"].includes(apiStatus.toLowerCase()) // Asegurar minúsculas
  ) {
    return apiStatus.toLowerCase();
  }

  // Valor por defecto si no es válido
  console.warn(`Estado API inválido recibido: ${apiStatus}, usando 'pendiente' por defecto para UI.`);
  return "pendiente";
};

/**
 * Servicio para gestionar las reservas
 */
const reservasService = {
  /**
   * Obtiene todas las reservas
   */
  getAllReservations: async () => {
    try {
      console.log("[reservasService] Solicitando todas las reservas a:", API_URL);
      const response = await axios.get(API_URL);

      // Convertir los estados de la API al formato de la UI
      const reservationsWithUIStates = response.data.map((reservation) => ({
        ...reservation,
        status: mapAPIStateToUI(reservation.status),
      }));

      // console.log("[reservasService] Respuesta procesada (getAllReservations):", reservationsWithUIStates); // Log detallado si es necesario
      return reservationsWithUIStates;
    } catch (error) {
      console.error("[reservasService] Error al obtener las reservas:", error);
      if (error.response) {
        console.error("[reservasService] Detalles del error (getAllReservations) - Status:", error.response.status);
        console.error("[reservasService] Detalles del error (getAllReservations) - Data:", JSON.stringify(error.response.data, null, 2));
      } else {
        console.error("[reservasService] Detalles del error (getAllReservations) - Mensaje:", error.message);
      }
      throw error;
    }
  },

  /**
   * Crea una nueva reserva
   * @param {Object} reserva - Datos de la reserva
   */
  createReservation: async (reserva) => {
    try {
      console.log("[reservasService] Datos originales recibidos en createReservation:", JSON.stringify(reserva, null, 2));

      const idCustomersNum = Number(reserva.idCustomers);
      if (isNaN(idCustomersNum) || idCustomersNum <= 0) { // Añadir verificación de <= 0
        console.error("[reservasService] ID de cliente inválido:", reserva.idCustomers);
        throw new Error(`ID de cliente inválido: ${reserva.idCustomers}`);
      }

      console.log("[reservasService] Estado UI recibido (createReservation):", reserva.status);
      const apiStatus = mapUIStateToAPI(reserva.status);
      console.log("[reservasService] Estado convertido para API (createReservation):", apiStatus);

      const dataToSend = {
        idCustomers: idCustomersNum,
        dateTime: new Date(reserva.dateTime).toISOString(),
        numberPeople: Number(reserva.numberPeople),
        matter: reserva.matter || "", // Asegurar que no sea null si el backend no lo permite y no tiene default
        timeDurationR: String(reserva.timeDurationR), // Backend espera STRING
        pass: Array.isArray(reserva.pass)
          ? reserva.pass.map((p) => ({
              fecha: p.fecha, // Asegurar formato de fecha si es necesario para el backend
              cantidad: Number(p.cantidad),
            }))
          : [],
        decorationAmount: Number(reserva.decorationAmount),
        remaining: Number(reserva.remaining),
        evenType: reserva.evenType,
        totalPay: Number(reserva.totalPay),
        status: apiStatus,
      };

      console.log("[reservasService] Duración a enviar en creación:", dataToSend.timeDurationR, "tipo:", typeof dataToSend.timeDurationR);

      if (reserva.idAditionalServices && Array.isArray(reserva.idAditionalServices) && reserva.idAditionalServices.length > 0) {
        dataToSend.idAditionalServices = reserva.idAditionalServices.map(id => Number(id)).filter(id => !isNaN(id));
      } else if (reserva.servicios && Array.isArray(reserva.servicios) && reserva.servicios.length > 0) {
        dataToSend.idAditionalServices = reserva.servicios
          .map((s) => (typeof s === "object" && s !== null ? Number(s.value) : Number(s)))
          .filter((id) => !isNaN(id) && id > 0); // Asegurar que los IDs sean válidos
      }
      // Si no hay servicios adicionales, no enviar el campo idAditionalServices si el backend lo prefiere así.
      // else {
      //   delete dataToSend.idAditionalServices; // Opcional, depende del backend
      // }


      console.log("[reservasService] DATOS FINALES A ENVIAR (createReservation):", JSON.stringify(dataToSend, null, 2));

      const config = {
        headers: {
          "Content-Type": "application/json",
        },
      };

      // Bloque try-catch específico para la llamada axios
      const response = await axios.post(API_URL, dataToSend, config);
      console.log("[reservasService] Respuesta del servidor (crear):", response.data);

      const responseWithUIState = {
        ...response.data,
        status: mapAPIStateToUI(response.data.status),
      };
      return responseWithUIState;

    } catch (axiosError) { // Renombrado a axiosError para claridad
      console.error("[reservasService] Error EXCEPCIÓN en createReservation:", axiosError.message); // Log del mensaje de la excepción

      if (axiosError.response) {
        console.error("[reservasService] Respuesta de error del servidor (status):", axiosError.response.status);
        console.error("[reservasService] Respuesta de error del servidor (data completa):", JSON.stringify(axiosError.response.data, null, 2));

        if (axiosError.response.data && Array.isArray(axiosError.response.data.errors)) {
          console.error("[reservasService] DETALLE DE ERRORES DEL BACKEND:");
          axiosError.response.data.errors.forEach((err, index) => {
            console.error(`[reservasService] Error ${index + 1}:`, JSON.stringify(err, null, 2));
            // Loguear campos individuales si existen
            if (err.message) console.error(`  Message: ${err.message}`);
            if (err.path) console.error(`  Path: ${err.path}`);
            if (err.type) console.error(`  Type: ${err.type}`);
            if (err.value !== undefined) console.error(`  Value: ${JSON.stringify(err.value)}`);
          });
        } else if (axiosError.response.data) {
            // Si no es el formato {errors: []}, mostrar lo que sea que venga
            console.error("[reservasService] Respuesta de error del servidor (data directa):", axiosError.response.data);
        }

        let userFriendlyErrorMessage = "No se pudo crear la reserva."; // Mensaje por defecto
        if (axiosError.response.data) {
            if (typeof axiosError.response.data.message === 'string') {
                userFriendlyErrorMessage = axiosError.response.data.message;
            } else if (Array.isArray(axiosError.response.data.errors) && axiosError.response.data.errors.length > 0 && typeof axiosError.response.data.errors[0].message === 'string') {
                userFriendlyErrorMessage = axiosError.response.data.errors[0].message;
            } else if (typeof axiosError.response.data.error === 'string'){ // Otro formato común
                userFriendlyErrorMessage = axiosError.response.data.error;
            }
        }
        // Mantener el throw original si es un error genérico de Axios, o uno más específico si viene del backend
        throw new Error(userFriendlyErrorMessage || axiosError.message);

      } else if (axiosError.request) {
        console.error("[reservasService] Error creating reservation: No se recibió respuesta del servidor", axiosError.request);
        throw new Error("No se pudo conectar con el servidor. Intente más tarde.");
      } else {
        console.error("[reservasService] Error creating reservation: Error al configurar la solicitud", axiosError.message);
        throw new Error(`Error al configurar la solicitud: ${axiosError.message}`);
      }
    }
  },

  /**
   * Obtiene una reserva por ID
   * @param {number} id - ID de la reserva
   */
  getReservationById: async (id) => {
    try {
      console.log(`[reservasService] Solicitando detalles de la reserva ${id}`);
      const response = await axios.get(`${API_URL}/${id}`);
      console.log("[reservasService] Respuesta de detalles de reserva:", response.data);

      const reservation = response.data;

      if (!reservation.Customer && reservation.idCustomers) {
        console.warn(`[reservasService] Advertencia: La reserva ${id} no incluye datos del cliente completos.`);
      }

      if (!Array.isArray(reservation.AditionalServices) || reservation.AditionalServices.length === 0) {
        // Podría ser que no tenga servicios, no necesariamente una advertencia si es válido
        // console.log(`[reservasService] Info: La reserva ${id} no tiene servicios adicionales asignados.`);
      }

      if (!reservation.pass) {
        console.warn(`[reservasService] Advertencia: La reserva ${id} no incluye campo pass, inicializando como array vacío.`);
        reservation.pass = [];
      } else if (typeof reservation.pass === "string") {
        try {
          console.log(`[reservasService] Reserva ${id} tiene pass como string, intentando parsear:`, reservation.pass);
          reservation.pass = JSON.parse(reservation.pass);
        } catch (parseError) {
          console.error(`[reservasService] Error al parsear pass para reserva ${id}:`, parseError);
          reservation.pass = [];
        }
      }
      // Asegurar que pass sea siempre un array
      if (!Array.isArray(reservation.pass)) {
        console.warn(`[reservasService] Advertencia: La reserva ${id} tiene pass en formato incorrecto, convirtiendo a array vacío.`);
        reservation.pass = [];
      }

      if (Array.isArray(reservation.pass)) {
        reservation.pass = reservation.pass.map((abono) => {
          if (!abono || typeof abono !== "object") {
            return { fecha: "", cantidad: 0 };
          }
          return {
            fecha: abono.fecha || "", // Considerar formatear a YYYY-MM-DD si es necesario
            cantidad: Number(abono.cantidad) || 0,
          };
        });
      }

      console.log("[reservasService] Estado API recibido (getById):", reservation.status);
      reservation.status = mapAPIStateToUI(reservation.status);
      console.log("[reservasService] Estado convertido para UI (getById):", reservation.status);

      console.log("[reservasService] Duración recibida de la API (getById):", reservation.timeDurationR, "tipo:", typeof reservation.timeDurationR);
      if (reservation.timeDurationR === undefined || reservation.timeDurationR === null) {
        console.warn(`[reservasService] Advertencia: La reserva ${id} no incluye duración, estableciendo string vacío.`);
        reservation.timeDurationR = ""; // Debe ser string si el modelo es STRING
      } else {
        reservation.timeDurationR = String(reservation.timeDurationR); // Asegurar que sea string
      }

      // console.log("[reservasService] Reserva procesada (getById) con pass:", reservation.pass);
      return reservation;
    } catch (error) {
      console.error(`[reservasService] Error fetching reservation with id ${id}:`, error);
      if (error.response) {
        console.error("[reservasService] Detalles del error (getById) - Status:", error.response.status);
        console.error("[reservasService] Detalles del error (getById) - Data:", JSON.stringify(error.response.data, null, 2));
      } else {
        console.error("[reservasService] Detalles del error (getById) - Mensaje:", error.message);
      }
      return {
        idReservations: id,
        error: true,
        errorMessage: error.response?.data?.message || error.response?.data?.error || error.message || "Error al cargar los detalles de la reserva.",
        pass: [],
        status: "pendiente",
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
      if (!id && reserva.idReservations) {
        id = reserva.idReservations;
      }
      if (!id) {
        console.error("[reservasService] ID de reserva no proporcionado o inválido para actualizar.");
        throw new Error("No se proporcionó un ID de reserva válido para actualizar.");
      }

      console.log("[reservasService] Datos originales recibidos en updateReservation:", JSON.stringify(reserva, null, 2));

      const idCustomersNum = Number(reserva.idCustomers);
      if (isNaN(idCustomersNum) || idCustomersNum <= 0) {
        console.error("[reservasService] ID de cliente inválido (updateReservation):", reserva.idCustomers);
        throw new Error(`ID de cliente inválido: ${reserva.idCustomers}`);
      }

      let formattedPass = [];
      if (Array.isArray(reserva.pass)) {
        formattedPass = reserva.pass.map((abono) => {
          if (!abono || typeof abono !== "object") {
            return { fecha: "", cantidad: 0 };
          }
          return {
            fecha: abono.fecha,
            cantidad: Number(abono.cantidad) || 0,
          };
        });
        // Considerar no filtrar abonos con cantidad 0 si son válidos para el backend
        // formattedPass = formattedPass.filter((abono) => abono.fecha && !isNaN(abono.cantidad));
      }

      console.log("[reservasService] Estado UI recibido (updateReservation):", reserva.status);
      const apiStatus = mapUIStateToAPI(reserva.status);
      console.log("[reservasService] Estado convertido para API (updateReservation):", apiStatus);

      const dataToSend = {
        idCustomers: idCustomersNum,
        dateTime: new Date(reserva.dateTime).toISOString(),
        numberPeople: Number(reserva.numberPeople),
        matter: reserva.matter || "",
        timeDurationR: String(reserva.timeDurationR), // Backend espera STRING
        pass: formattedPass, // Enviar el array formateado (puede estar vacío)
        decorationAmount: Number(reserva.decorationAmount),
        remaining: Number(reserva.remaining),
        evenType: reserva.evenType,
        totalPay: Number(reserva.totalPay),
        status: apiStatus,
      };

      console.log("[reservasService] Duración a enviar en actualización:", dataToSend.timeDurationR, "tipo:", typeof dataToSend.timeDurationR);

      if (reserva.idAditionalServices && Array.isArray(reserva.idAditionalServices)) {
        dataToSend.idAditionalServices = reserva.idAditionalServices.map(id => Number(id)).filter(id => !isNaN(id));
         if(dataToSend.idAditionalServices.length === 0) delete dataToSend.idAditionalServices; // No enviar array vacío si no es necesario
      } else if (reserva.servicios && Array.isArray(reserva.servicios)) {
        dataToSend.idAditionalServices = reserva.servicios
          .map((s) => (typeof s === "object" && s !== null ? Number(s.value) : Number(s)))
          .filter((id) => !isNaN(id) && id > 0);
         if(dataToSend.idAditionalServices.length === 0) delete dataToSend.idAditionalServices;
      }


      console.log("[reservasService] DATOS FINALES A ENVIAR (UPDATE):", JSON.stringify(dataToSend, null, 2));
      console.log("[reservasService] URL de la solicitud (UPDATE):", `${API_URL}/${id}`);

      const config = {
        headers: {
          "Content-Type": "application/json",
        },
      };

      // Simplificado: Intentar solo con PUT completo. Si falla, el log detallado ayudará.
      const response = await axios.put(`${API_URL}/${id}`, dataToSend, config);
      console.log("[reservasService] Respuesta del servidor (actualizar):", response.data);

      const responseWithUIState = {
        ...response.data,
        status: mapAPIStateToUI(response.data.status),
      };
      return responseWithUIState;

    } catch (axiosError) { // Renombrado a axiosError para claridad
      console.error("[reservasService] Error EXCEPCIÓN en updateReservation:", axiosError.message);

      if (axiosError.response) {
        console.error("[reservasService] Respuesta de error del servidor (status):", axiosError.response.status);
        console.error("[reservasService] Respuesta de error del servidor (data completa):", JSON.stringify(axiosError.response.data, null, 2));

        if (axiosError.response.data && Array.isArray(axiosError.response.data.errors)) {
          console.error("[reservasService] DETALLE DE ERRORES DEL BACKEND (UPDATE):");
          axiosError.response.data.errors.forEach((err, index) => {
            console.error(`[reservasService] Error ${index + 1}:`, JSON.stringify(err, null, 2));
            if (err.message) console.error(`  Message: ${err.message}`);
            if (err.path) console.error(`  Path: ${err.path}`);
            // ... otros campos ...
          });
        } else if (axiosError.response.data) {
            console.error("[reservasService] Respuesta de error del servidor (data directa):", axiosError.response.data);
        }
        
        let userFriendlyErrorMessage = "No se pudo actualizar la reserva.";
        if (axiosError.response.data) {
            if (typeof axiosError.response.data.message === 'string') {
                userFriendlyErrorMessage = axiosError.response.data.message;
            } else if (Array.isArray(axiosError.response.data.errors) && axiosError.response.data.errors.length > 0 && typeof axiosError.response.data.errors[0].message === 'string') {
                userFriendlyErrorMessage = axiosError.response.data.errors[0].message;
            } else if (typeof axiosError.response.data.error === 'string'){
                userFriendlyErrorMessage = axiosError.response.data.error;
            }
        }
        throw new Error(userFriendlyErrorMessage || axiosError.message);

      } else if (axiosError.request) {
        console.error("[reservasService] Error updating reservation: No se recibió respuesta del servidor", axiosError.request);
        throw new Error("No se pudo conectar con el servidor. Intente más tarde.");
      } else {
        console.error("[reservasService] Error updating reservation: Error al configurar la solicitud", axiosError.message);
        throw new Error(`Error al configurar la solicitud: ${axiosError.message}`);
      }
    }
  },

  /**
   * Elimina una reserva por ID
   * @param {number} id - ID de la reserva
   */
  deleteReservation: async (id) => {
    try {
      console.log(`[reservasService] Eliminando reserva con ID: ${id}`);
      const response = await axios.delete(`${API_URL}/${id}`);
      console.log("[reservasService] Respuesta del servidor (eliminar):", response.data);
      return response.data; // Asumiendo que el backend devuelve algo útil, ej: { success: true, message: "..." }
    } catch (error) {
      console.error(`[reservasService] Error deleting reservation with id ${id}:`, error);
      if (error.response) {
        console.error("[reservasService] Detalles del error (delete) - Status:", error.response.status);
        console.error("[reservasService] Detalles del error (delete) - Data:", JSON.stringify(error.response.data, null, 2));
      } else {
        console.error("[reservasService] Detalles del error (delete) - Mensaje:", error.message);
      }
      throw new Error(error.response?.data?.message || error.response?.data?.error || "No se pudo eliminar la reserva.");
    }
  },

  /**
   * Cambia el estado de una reserva (usando PATCH)
   * @param {number} id - ID de la reserva
   * @param {string} uiStatus - Estado en formato UI
   */
  changeReservationStatus: async (id, uiStatus) => { // Renombrado de updateStatus a changeReservationStatus para diferenciar
    try {
      console.log(`[reservasService] Cambiando estado de reserva ${id} a: ${uiStatus}`);
      const apiStatus = mapUIStateToAPI(uiStatus);

      // El backend podría requerir un objeto específico para PATCH, ej: solo los campos a cambiar
      const response = await axios.patch(`${API_URL}/${id}`, {
        status: apiStatus,
        // actionConfirmed: true, // Enviar solo si el backend lo requiere explícitamente para esta operación
      });

      console.log("[reservasService] Respuesta del servidor (cambiar estado):", response.data);
      return {
        ...response.data,
        status: mapAPIStateToUI(response.data.status), // Mapear de nuevo por si el backend transforma el estado
      };
    } catch (error) {
      console.error(`[reservasService] Error changing status for reservation with id ${id}:`, error);
       if (error.response) {
        console.error("[reservasService] Detalles del error (changeStatus) - Status:", error.response.status);
        console.error("[reservasService] Detalles del error (changeStatus) - Data:", JSON.stringify(error.response.data, null, 2));
      } else {
        console.error("[reservasService] Detalles del error (changeStatus) - Mensaje:", error.message);
      }
      throw new Error(error.response?.data?.message || error.response?.data?.error || "No se pudo cambiar el estado de la reserva.");
    }
  },

  /**
   * Actualiza solo la duración de una reserva (usando PATCH)
   * @param {number} id - ID de la reserva
   * @param {number|string} duration - Nueva duración (se convertirá a string)
   */
  updateDuration: async (id, duration) => {
    try {
      console.log(`[reservasService] Actualizando solo duración de reserva ${id} a: ${duration}`);
      const durationString = String(duration); // Backend espera STRING

      const response = await axios.patch(`${API_URL}/${id}`, {
        timeDurationR: durationString,
        // actionConfirmed: true, // Enviar solo si el backend lo requiere explícitamente
      });

      console.log("[reservasService] Respuesta del servidor (actualizar duración):", response.data);
      return {
        ...response.data,
        timeDurationR: String(response.data.timeDurationR !== undefined ? response.data.timeDurationR : durationString),
      };
    } catch (error) {
      console.error(`[reservasService] Error updating duration for reservation with id ${id}:`, error);
       if (error.response) {
        console.error("[reservasService] Detalles del error (updateDuration) - Status:", error.response.status);
        console.error("[reservasService] Detalles del error (updateDuration) - Data:", JSON.stringify(error.response.data, null, 2));
      } else {
        console.error("[reservasService] Detalles del error (updateDuration) - Mensaje:", error.message);
      }
      throw new Error(error.response?.data?.message || error.response?.data?.error || "No se pudo actualizar la duración.");
    }
  },

  // 'updateStatus' ya existe como 'changeReservationStatus'. Si necesitas una función que solo actualice
  // el estado usando un endpoint específico, la crearías aquí. Por ahora, la he eliminado para evitar duplicidad.

};

export default reservasService;