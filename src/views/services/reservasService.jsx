// RUTA: src/services/reservasService.js

import axios from "axios";

// Usar la URL directamente para evitar problemas con variables de entorno
const API_URL = "http://localhost:3000/reservations";

/**
 * Mapeo de estados entre la UI y la API
 */
const mapUIStateToAPI = (uiState) => {
  if (
    typeof uiState === "string" &&
    ["pendiente", "confirmada", "en_proceso", "terminada", "anulada"].includes(uiState.toLowerCase())
  ) {
    return uiState.toLowerCase();
  }
  console.warn(`Estado UI inválido recibido: ${uiState}, usando 'pendiente' por defecto.`);
  return "pendiente";
};

const mapAPIStateToUI = (apiStatus) => {
  if (
    typeof apiStatus === "string" &&
    ["pendiente", "confirmada", "en_proceso", "terminada", "anulada"].includes(apiStatus.toLowerCase())
  ) {
    return apiStatus.toLowerCase();
  }
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
    try { // <<< INICIO DEL BLOQUE TRY
      console.log("[reservasService] Solicitando todas las reservas a:", API_URL);
      const response = await axios.get(API_URL);

      if (!Array.isArray(response.data)) {
        console.warn("La respuesta de getAllReservations no es un array. Se devuelve array vacío.");
        return [];
      }

      const reservationsWithUIStates = response.data.map((reservation) => ({
        ...reservation,
        status: mapAPIStateToUI(reservation.status),
      }));
      
      return reservationsWithUIStates;

    } catch (error) { // <<< CORRECCIÓN: SE AÑADE EL BLOQUE CATCH QUE FALTABA
      console.error("[reservasService] Error al obtener las reservas:", error);
      if (error.response) {
        console.error("[reservasService] Detalles del error (getAllReservations) - Status:", error.response.status);
        console.error("[reservasService] Detalles del error (getAllReservations) - Data:", JSON.stringify(error.response.data, null, 2));
      } else {
        console.error("[reservasService] Detalles del error (getAllReservations) - Mensaje:", error.message);
      }
      return []; // Devolver array vacío en caso de error
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
      if (isNaN(idCustomersNum) || idCustomersNum <= 0) {
        console.error("[reservasService] ID de cliente inválido:", reserva.idCustomers);
        throw new Error(`ID de cliente inválido: ${reserva.idCustomers}`);
      }
      
      const apiStatus = mapUIStateToAPI(reserva.status);

      const dataToSend = {
        idCustomers: idCustomersNum,
        dateTime: new Date(reserva.dateTime).toISOString(),
        numberPeople: Number(reserva.numberPeople),
        matter: reserva.matter || "",
        timeDurationR: String(reserva.timeDurationR),
        pass: Array.isArray(reserva.pass)
          ? reserva.pass.map((p) => ({
              fecha: p.fecha,
              cantidad: Number(p.cantidad),
            }))
          : [],
        decorationAmount: Number(reserva.decorationAmount),
        remaining: Number(reserva.remaining),
        evenType: reserva.evenType,
        totalPay: Number(reserva.totalPay),
        status: apiStatus,
      };

      if (reserva.idAditionalServices && Array.isArray(reserva.idAditionalServices) && reserva.idAditionalServices.length > 0) {
        dataToSend.idAditionalServices = reserva.idAditionalServices.map(id => Number(id)).filter(id => !isNaN(id));
      } else if (reserva.servicios && Array.isArray(reserva.servicios) && reserva.servicios.length > 0) {
        dataToSend.idAditionalServices = reserva.servicios
          .map((s) => (typeof s === "object" && s !== null ? Number(s.value) : Number(s)))
          .filter((id) => !isNaN(id) && id > 0);
      }

      const config = { headers: { "Content-Type": "application/json" } };
      const response = await axios.post(API_URL, dataToSend, config);

      return { ...response.data, status: mapAPIStateToUI(response.data.status) };

    } catch (axiosError) {
      console.error("[reservasService] Error EXCEPCIÓN en createReservation:", axiosError.message);
      let userFriendlyErrorMessage = "No se pudo crear la reserva.";
      if (axiosError.response) {
        console.error("[reservasService] Respuesta de error del servidor (status):", axiosError.response.status);
        console.error("[reservasService] Respuesta de error del servidor (data completa):", JSON.stringify(axiosError.response.data, null, 2));
        if (typeof axiosError.response.data.message === 'string') {
            userFriendlyErrorMessage = axiosError.response.data.message;
        }
      } else if (axiosError.request) {
        userFriendlyErrorMessage = "No se pudo conectar con el servidor. Intente más tarde.";
      }
      throw new Error(userFriendlyErrorMessage || axiosError.message);
    }
  },

  /**
   * Obtiene una reserva por ID
   * @param {number} id - ID de la reserva
   */
  getReservationById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/${id}`);
      const reservation = response.data;

      if (typeof reservation.pass === "string") {
        try {
          reservation.pass = JSON.parse(reservation.pass);
        } catch (parseError) {
          console.error(`Error al parsear pass para reserva ${id}:`, parseError);
          reservation.pass = [];
        }
      }
      if (!Array.isArray(reservation.pass)) reservation.pass = [];
      
      reservation.status = mapAPIStateToUI(reservation.status);
      reservation.timeDurationR = String(reservation.timeDurationR ?? "");
      
      return reservation;
    } catch (error) {
      console.error(`[reservasService] Error fetching reservation with id ${id}:`, error);
      return { idReservations: id, error: true, errorMessage: "Error al cargar los detalles.", pass: [], status: "pendiente" };
    }
  },

  /**
   * Actualiza una reserva existente
   * @param {number} id - ID de la reserva
   * @param {Object} reserva - Datos actualizados de la reserva
   */
  updateReservation: async (id, reserva) => {
    try {
      const idToUpdate = id || reserva.idReservations;
      if (!idToUpdate) throw new Error("No se proporcionó un ID de reserva válido para actualizar.");
      
      const apiStatus = mapAPIStateToAPI(reserva.status);

      const dataToSend = {
        idCustomers: Number(reserva.idCustomers),
        dateTime: new Date(reserva.dateTime).toISOString(),
        numberPeople: Number(reserva.numberPeople),
        matter: reserva.matter || "",
        timeDurationR: String(reserva.timeDurationR),
        pass: Array.isArray(reserva.pass) ? reserva.pass.map(p => ({ fecha: p.fecha, cantidad: Number(p.cantidad) || 0 })) : [],
        decorationAmount: Number(reserva.decorationAmount),
        remaining: Number(reserva.remaining),
        evenType: reserva.evenType,
        totalPay: Number(reserva.totalPay),
        status: apiStatus,
      };

      if (reserva.idAditionalServices && Array.isArray(reserva.idAditionalServices)) {
        dataToSend.idAditionalServices = reserva.idAditionalServices.map(id => Number(id)).filter(id => !isNaN(id));
      }

      const config = { headers: { "Content-Type": "application/json" } };
      const response = await axios.put(`${API_URL}/${idToUpdate}`, dataToSend, config);
      
      return { ...response.data, status: mapAPIStateToUI(response.data.status) };

    } catch (axiosError) {
      console.error("[reservasService] Error EXCEPCIÓN en updateReservation:", axiosError.message);
      let userFriendlyErrorMessage = "No se pudo actualizar la reserva.";
      if (axiosError.response?.data?.message) {
          userFriendlyErrorMessage = axiosError.response.data.message;
      }
      throw new Error(userFriendlyErrorMessage || axiosError.message);
    }
  },

  /**
   * Elimina una reserva por ID
   * @param {number} id - ID de la reserva
   */
  deleteReservation: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`[reservasService] Error deleting reservation with id ${id}:`, error);
      throw new Error(error.response?.data?.message || "No se pudo eliminar la reserva.");
    }
  },

  /**
   * Cambia el estado de una reserva (usando PATCH)
   * @param {number} id - ID de la reserva
   * @param {string} uiStatus - Estado en formato UI
   */
  changeReservationStatus: async (id, uiStatus) => {
    try {
      const apiStatus = mapUIStateToAPI(uiStatus);
      const response = await axios.patch(`${API_URL}/${id}`, { status: apiStatus });
      return { ...response.data, status: mapAPIStateToUI(response.data.status) };
    } catch (error) {
      console.error(`[reservasService] Error changing status for reservation with id ${id}:`, error);
      throw new Error(error.response?.data?.message || "No se pudo cambiar el estado.");
    }
  },

  /**
   * Actualiza solo la duración de una reserva (usando PATCH)
   * @param {number} id - ID de la reserva
   * @param {number|string} duration - Nueva duración
   */
  updateDuration: async (id, duration) => {
    try {
      const durationString = String(duration);
      const response = await axios.patch(`${API_URL}/${id}`, { timeDurationR: durationString });
      return { ...response.data, timeDurationR: String(response.data.timeDurationR ?? durationString) };
    } catch (error) {
      console.error(`[reservasService] Error updating duration for reservation with id ${id}:`, error);
      throw new Error(error.response?.data?.message || "No se pudo actualizar la duración.");
    }
  },
};

export default reservasService;