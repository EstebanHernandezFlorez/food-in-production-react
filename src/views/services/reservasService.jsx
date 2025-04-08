// src/services/reservasService.js
import axios from 'axios';

const API_URL = 'http://localhost:3000/reservations'; // VERIFICAR

// --- mapToFrontend (SIN CAMBIOS, asumiendo que funciona para mostrar datos) ---
const mapToFrontend = (backendReservation) => {
    if (!backendReservation) return null;
    const customer = backendReservation.Customer || {};
    const aditionalServices = backendReservation.AditionalServices || [];
    const abonosData = backendReservation.Abonos || []; // Asumiendo alias 'Abonos'

    // console.log("BE Data to mapToFrontend:", JSON.stringify(backendReservation, null, 2));

    

    return {
        id: backendReservation.idReservations,
        customerId: customer?.idCustomers,
        nombre: customer?.fullName || 'Cliente Desconocido',
        distintivo: customer?.distintive || '',
        categoriaCliente: customer?.customerCategory || '',
        correo: customer?.email || '',
        celular: customer?.cellphone || '',
        direccion: customer?.address || '',
        evento: backendReservation.matter,
        fechaHora: backendReservation.dateTime ? new Date(backendReservation.dateTime).toISOString().slice(0, 16) : '',
        duracionEvento: backendReservation.timeDurationR,
        tipoEvento: backendReservation.evenType,
        nroPersonas: backendReservation.numberPeople,
        observaciones: backendReservation.observations,
        montoDecoracion: backendReservation.decorationAmount,
        totalPago: backendReservation.totalPay,
        restante: backendReservation.remaining,
        formaPago: backendReservation.paymentMethod,
        estado: backendReservation.status === false ? 'anulada' : (backendReservation.estado_interno || 'confirmada'), // Revisar lógica estado
        servicios: aditionalServices.map(service => ({
             value: service.idAditionalServices,
             label: service.name || `Servicio ${service.idAditionalServices}`
        })),
        abonos: abonosData.map(abono => ({
            id: abono.idAbono,
            fecha: abono.paymentDate ? new Date(abono.paymentDate).toISOString().split('T')[0] : '', // Usa paymentDate
            cantidad: abono.amount // Usa amount
        })),
    };
};

// --- mapToBackend (AJUSTES CLAVE) ---
const mapToBackend = (frontendReservation) => {
    if (!frontendReservation.customerId) {
        console.error("Error crítico: Falta customerId al intentar guardar reserva.");
        throw new Error("Se requiere seleccionar un cliente.");
    }

    // --- CAMBIO 1: Asegurar que serviceIds son enteros ---
    const serviceIds = (frontendReservation.servicios || [])
                         .map(option => parseInt(option.value, 10)) // Convertir a entero base 10
                         .filter(id => !isNaN(id) && id > 0); // Filtrar NaN y asegurar positivos

    // --- CAMBIO 2: Asegurar formato correcto para abonos ---
    const abonosToSend = (frontendReservation.abonos || []).map(ab => ({
        fecha: ab.fecha, // Enviar como YYYY-MM-DD (el input date lo da así)
        cantidad: parseFloat(ab.cantidad || 0) // Asegurar que es número
    }));

    const backendData = {
        // IDs y Relaciones (para que el servicio backend los procese)
        idCustomers: frontendReservation.customerId, // <- CAMBIADO DESDE idCustomers a customerId en validación
        serviceIds: serviceIds,
        abonos: abonosToSend,

        // Campos de Reservations
        dateTime: frontendReservation.fechaHora,
        numberPeople: parseInt(frontendReservation.nroPersonas || 0, 10),
        matter: frontendReservation.evento,
        timeDurationR: frontendReservation.duracionEvento, // Formato HH:MM o HH:MM:SS
        pass: frontendReservation.pass || 0, // ¿Se usa?
        decorationAmount: parseFloat(frontendReservation.montoDecoracion || 0),
        remaining: parseFloat(frontendReservation.restante || 0),
        evenType: frontendReservation.tipoEvento,
        totalPay: parseFloat(frontendReservation.totalPago || 0),
        paymentMethod: frontendReservation.formaPago,
        // --- CAMBIO 3: Añadir observaciones si existe en el form ---
        // Asume que el campo en el backend se llama 'observaciones' o 'notes'
        observaciones: frontendReservation.observaciones, // Incluir este campo

        // status booleano no se envía aquí normalmente
    };
    return backendData;
};

// --- Objeto del Servicio (Sin cambios en la estructura, usa mapeos corregidos) ---
const reservasService = {
    getAllReservations: async () => {
        try {
            const response = await axios.get(API_URL);
            console.log("[Service GET ALL] Raw Backend response data:", JSON.stringify(response.data, null, 2));
            return response.data.map(mapToFrontend);
        } catch (error) { console.error("Error fetching reservations:", error); throw error; }
    },
    createReservation: async (reservationDataFrontend) => {
        try {
            const dataToSend = mapToBackend(reservationDataFrontend);
            console.log("[Service CREATE] Datos COMPLETOS enviados:", JSON.stringify(dataToSend, null, 2));
            const response = await axios.post(API_URL, dataToSend);
            console.log("[Service CREATE] Respuesta del backend:", response.data);
            return mapToFrontend(response.data);
        } catch (error) { console.error("Error creating reservation:", error); throw error; }
    },
    getReservationById: async (idReservation) => {
        try {
            const response = await axios.get(`${API_URL}/${idReservation}`);
            console.log(`[Service GET ID ${idReservation}] Raw Backend response data:`, JSON.stringify(response.data, null, 2));
            return mapToFrontend(response.data);
        } catch (error) { console.error(`Error fetching reservation with id ${idReservation}:`, error); throw error; }
    },
    updateReservation: async (idReservation, reservationDataFrontend) => {
        try {
            const dataToSend = mapToBackend(reservationDataFrontend);
            console.log(`[Service UPDATE ID ${idReservation}] Datos COMPLETOS enviados:`, JSON.stringify(dataToSend, null, 2)); // LOG CLAVE
            await axios.put(`${API_URL}/${idReservation}`, dataToSend);
            return; // PUT exitoso
        } catch (error) { console.error(`Error updating reservation with id ${idReservation}:`, error); throw error; }
    },
    deleteReservation: async (idReservation) => {
        try {
            const response = await axios.delete(`${API_URL}/${idReservation}`);
            console.log(`[Service DELETE ID ${idReservation}] Respuesta del backend:`, response.data);
            return response.data;
        } catch (error) { console.error(`Error deleting reservation with id ${idReservation}:`, error); throw error.response?.data || error; }
    },
    // changeStateReservation si lo necesitas...
};

export default reservasService;