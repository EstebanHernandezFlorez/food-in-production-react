"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Container,
  Button,
  FormGroup,
  Input,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Row,
  Col,
  Label,
  Spinner,
  FormFeedback,
  Table,
  Pagination,
  PaginationItem,
  PaginationLink,
} from "reactstrap";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
// >>> Importación CSS eliminada <<<
// import './Calendario.css';
import { utils, writeFile } from "xlsx";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { FaFileExcel, FaTrashAlt, FaList } from "react-icons/fa";
import Select from "react-select";

// --- IMPORTAR SERVICIOS REALES ---
import reservasService from "../../services/reservasService";
import clientesService from "../../services/clientesService";
import serviciosService from "../../services/serviciosService";

// --- ESTADO INICIAL DEL FORMULARIO ---
const emptyForm = {
  // ... (sin cambios)
  id: null,
  idCustomers: "",
  fullName: "",
  distintive: "",
  customerCategory: "",
  email: "",
  cellphone: "",
  address: "",
  dateTime: "",
  timeDurationR: "",
  evenType: "",
  numberPeople: "",
  matter: "",
  servicios: [],
  decorationAmount: "",
  pass: [],
  totalPay: "",
  remaining: "",
  status: "pendiente",
};

// --- CONTENIDO CSS COMO STRING (anteriormente en Calendario.css) ---
const calendarStyles = `
  /* Calendario.css - Estilos inspirados en Untitled UI */

  /* --- Fuentes (Asegúrate de importar 'Inter' o tu fuente preferida globalmente) --- */
  .calendar-container {
    font-family: 'Inter', sans-serif; /* Asegúrate que la fuente esté disponible */
    background-color: #f9fafb; /* Fondo general ligeramente gris */
    padding: 20px !important; /* Añade padding al contenedor general */
    border-radius: 8px; /* Bordes redondeados para el contenedor principal */
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03); /* Sombra sutil */
  }

  /* --- Estilos Globales para Inputs y Botones (Override Reactstrap/Bootstrap) --- */
  .calendar-container .form-control,
  .calendar-container .form-select,
  .calendar-container .Select__control { /* Estilo para React Select */
    font-size: 0.875rem;
    border-radius: 6px !important;
    border-color: #d1d5db; /* Gris claro */
    box-shadow: none !important;
  }
  .calendar-container .form-control:focus,
  .calendar-container .form-select:focus,
  .calendar-container .Select__control--is-focused {
    border-color: #3b82f6; /* Azul al enfocar */
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3) !important;
  }

  .calendar-container .btn {
    font-size: 0.875rem;
    border-radius: 6px;
    padding: 0.4rem 0.8rem;
    font-weight: 500;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
  }

  .calendar-container .btn-primary {
    background-color: #3b82f6; /* Azul primario */
    border-color: #3b82f6;
    color: white;
  }
  .calendar-container .btn-primary:hover {
    background-color: #2563eb;
    border-color: #2563eb;
  }

  .calendar-container .btn-secondary {
    background-color: #ffffff;
    border-color: #d1d5db; /* Borde gris */
    color: #374151; /* Texto oscuro */
  }
  .calendar-container .btn-secondary:hover {
    background-color: #f9fafb; /* Gris muy claro hover */
    border-color: #adb5bd;
  }
   .calendar-container .btn-secondary:focus {
     box-shadow: 0 0 0 2px rgba(209, 213, 219, 0.5) !important;
   }

  .calendar-container .btn-outline-primary {
    color: #3b82f6;
    border-color: #3b82f6;
  }
  .calendar-container .btn-outline-primary:hover {
    background-color: #eff6ff; /* Azul muy claro */
  }

   .calendar-container .btn-danger {
      background-color: #EF4444;
      border-color: #EF4444;
      color: white;
  }
  .calendar-container .btn-danger:hover {
      background-color: #DC2626;
      border-color: #DC2626;
  }
  .calendar-container .btn-outline-danger {
      color: #EF4444;
      border-color: #EF4444;
  }
  .calendar-container .btn-outline-danger:hover {
      background-color: #FEE2E2; /* Rojo muy claro */
      color: #DC2626;
  }


  /* --- Encabezado del Calendario --- */
  .calendar-header {
    margin-bottom: 1.5rem !important;
  }
  .calendar-header h2 {
    font-size: 1.5rem; /* Tamaño título principal */
    font-weight: 600;
    color: #111827; /* Casi negro */
  }
  .calendar-search-input {
    background-color: white;
    font-size: 0.875rem; /* Ajustar tamaño si es necesario */
  }

  /* --- FullCalendar Wrapper --- */
  .fullcalendar-wrapper {
    background-color: #fff; /* Fondo blanco para el calendario */
    border: 1px solid #e5e7eb; /* Borde gris muy claro */
    border-radius: 8px;
    padding: 15px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03), 0 1px 2px rgba(0, 0, 0, 0.02);
  }

  /* --- FullCalendar Toolbar --- */
  .fc .fc-toolbar {
    margin-bottom: 1.5em !important;
    padding: 0 !important;
  }
  .fc .fc-toolbar-title {
    font-size: 1.125rem !important; /* 18px */
    font-weight: 600;
    color: #111827;
  }
  .fc .fc-button {
    background-color: #fff !important;
    border: 1px solid #d1d5db !important;
    color: #374151 !important;
    font-size: 0.875rem !important;
    padding: 0.3rem 0.7rem !important;
    box-shadow: none !important;
    border-radius: 6px !important;
    text-transform: none !important;
    transition: background-color 0.2s ease, border-color 0.2s ease;
  }
  .fc .fc-button:hover {
    background-color: #f9fafb !important;
  }
  .fc .fc-button-primary:not(:disabled):active,
  .fc .fc-button-primary:not(:disabled).fc-button-active {
    background-color: #eff6ff !important; /* Azul muy claro activo */
    border-color: #93c5fd !important;
    color: #2563eb !important;
  }
   .fc .fc-button .fc-icon { /* Ajustar tamaño iconos si es necesario */
      font-size: 1em;
   }

  /* --- FullCalendar Grid y Celdas --- */
  .fc .fc-col-header-cell { /* Encabezado días (Lun, Mar...) */
    background-color: #f9fafb;
    border-color: #e5e7eb !important;
    font-weight: 500;
    font-size: 0.75rem; /* Más pequeño */
    color: #6b7280; /* Gris */
    padding: 0.5rem 0;
    text-transform: uppercase;
  }
  .fc .fc-daygrid-day { /* Celdas de día */
    border-color: #e5e7eb !important; /* Borde gris muy claro */
  }
  .fc .fc-daygrid-day-number { /* Número del día */
    padding: 0.5em 0.5em 0 0 !important;
    font-size: 0.8rem;
    color: #374151;
    font-weight: 500;
  }
  .fc .fc-day-today { /* Celda del día actual */
    background-color: #f3f4f6 !important; /* Gris un poco más oscuro */
  }

  /* --- Estilo de Eventos (FullCalendar) --- */
  .fc .fc-daygrid-event { /* Contenedor del evento */
    border-radius: 12px !important; /* Más redondeado (píldora) */
    padding: 2px 6px !important;
    margin-bottom: 3px !important;
    font-size: 0.75rem; /* Texto evento más pequeño */
    font-weight: 500;
    border: none !important; /* Quitamos borde por defecto */
    background-color: transparent !important; /* Hacemos transparente el contenedor */
    cursor: pointer;
  }
   .fc .fc-event-main {
      padding: 0 !important; /* Quitamos padding interno por defecto */
  }

  /* Estructura personalizada dentro del evento (dot + title + time) */
  .fc-event-main-custom {
    display: flex;
    align-items: center;
    gap: 5px; /* Espacio entre punto y texto */
    padding: 3px 6px; /* Padding interno del contenido */
    border-radius: 10px; /* Redondeo interno */
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .event-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0; /* Evita que el punto se encoja */
  }

  .event-title {
    flex-grow: 1; /* Ocupa el espacio restante */
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    color: inherit; /* Hereda color del contenedor (definido abajo) */
  }
   .event-time {
      color: inherit;
      opacity: 0.8; /* Hora un poco más tenue */
      margin-left: auto; /* Empuja la hora a la derecha */
      padding-left: 5px;
  }

  /* Colores específicos por estado del evento */
  .fc-event-main-custom.event-status-pendiente { background-color: #FEF3C7; color: #92400E; } /* Amarillo claro fondo, texto oscuro */
  .fc-event-main-custom.event-status-confirmada { background-color: #DBEAFE; color: #1E40AF; } /* Azul claro fondo, texto oscuro */
  .fc-event-main-custom.event-status-terminada { background-color: #D1FAE5; color: #065F46; } /* Verde claro fondo, texto oscuro */
  .fc-event-main-custom.event-status-anulada { background-color: #FEE2E2; color: #991B1B; } /* Rojo claro fondo, texto oscuro */
  .fc-event-main-custom.event-status-en_proceso { background-color: #FEF9C3; color: #854D0E; } /* Naranja claro */
  .fc-event-main-custom.event-status-default { background-color: #E5E7EB; color: #374151; } /* Gris claro */

  /* Hover sobre eventos */
  .fc-daygrid-event:hover .fc-event-main-custom {
    opacity: 0.85;
  }

  /* Indicador "+ more" */
  .fc .fc-daygrid-more-link {
      color: #3b82f6; /* Azul */
      font-size: 0.7rem;
      font-weight: 500;
  }

  /* --- Estilos para Modales --- */
  .calendar-modal .modal-content {
    border-radius: 8px;
    border: none;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
  .calendar-modal .modal-header {
    background-color: #f9fafb; /* Fondo cabecera gris claro */
    border-bottom: 1px solid #e5e7eb;
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
    padding: 1rem 1.5rem;
  }
  .calendar-modal .modal-header .modal-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #111827;
  }
  .calendar-modal .modal-header .btn-close { /* Botón cerrar */
      filter: grayscale(1) opacity(0.5);
  }
  .calendar-modal .modal-body {
    padding: 1.5rem;
    font-size: 0.875rem;
  }
  .calendar-modal .modal-footer {
    background-color: #f9fafb; /* Fondo pie gris claro */
    border-top: 1px solid #e5e7eb;
    border-bottom-left-radius: 8px;
    border-bottom-right-radius: 8px;
    padding: 1rem 1.5rem;
  }

  /* Estilo para los fieldsets dentro del modal */
  .calendar-modal .modal-fieldset {
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 1rem 1.5rem 1.5rem 1.5rem;
      margin-bottom: 1.5rem !important;
  }
  .calendar-modal .modal-legend {
      font-size: 0.875rem;
      font-weight: 600;
      color: #111827;
      padding: 0 0.5rem;
      width: auto; /* Necesario para que el fondo no lo tape */
      margin-left: 0.5rem; /* Ajusta para que no pegue al borde */
      float: none; /* Evita problemas de float */
  }
  .calendar-modal .modal-body label {
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.3rem;
      display: block; /* Asegura espaciado correcto */
  }
  /* Ajustes específicos para React Select dentro del modal */
  .calendar-modal .Select__control {
      min-height: 38px; /* Altura consistente */
  }
  .calendar-modal .Select__placeholder {
      color: #9ca3af; /* Placeholder más claro */
  }


  /* --- Estilos para la Tabla de Lista en Modal --- */
  .list-modal .reservations-table {
      margin-bottom: 1rem; /* Espacio antes de paginación */
      border-collapse: separate; /* Permite bordes redondeados */
      border-spacing: 0;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden; /* Clave para que el radius funcione en la tabla */
  }
  .list-modal .reservations-table th {
      background-color: #f9fafb;
      font-size: 0.75rem;
      font-weight: 600;
      color: #4b5563;
      text-transform: uppercase;
      border-bottom: 1px solid #e5e7eb !important;
      border-top: none !important;
      border-left: none !important;
      border-right: none !important;
      white-space: nowrap;
      padding: 0.75rem 1rem;
  }
   .list-modal .reservations-table th:first-child {
     border-top-left-radius: 8px;
   }
    .list-modal .reservations-table th:last-child {
     border-top-right-radius: 8px;
   }

  .list-modal .reservations-table td {
      font-size: 0.875rem;
      vertical-align: middle;
      border-top: 1px solid #e5e7eb !important; /* Borde superior para separar filas */
      border-bottom: none !important;
      border-left: none !important;
      border-right: none !important;
      padding: 0.75rem 1rem;
      background-color: #fff; /* Fondo blanco para celdas */
  }
   /* Quitar borde superior de la primera fila */
  .list-modal .reservations-table tbody tr:first-child td {
      border-top: none !important;
  }

   /* Alternar color de filas (opcional, si no usas 'striped') */
   /* .list-modal .reservations-table tbody tr:nth-child(odd) td {
      background-color: #f9fafb;
   } */


  .list-modal .badge.event-status-badge {
      font-size: 0.7rem;
      padding: 0.3em 0.6em;
      border-radius: 12px;
      font-weight: 500;
      /* Los colores ya vienen del style inline, pero podemos ajustar texto */
      color: white; /* Texto blanco por defecto */
  }
  /* Ajustar color de texto para estados con fondo claro */
  .list-modal .badge.event-status-badge.event-status-pendiente,
  .list-modal .badge.event-status-badge.event-status-en_proceso {
      color: #422006; /* Texto oscuro para fondos claros */
  }

  /* --- Paginación en Modal --- */
  .calendar-modal .pagination .page-link {
      font-size: 0.875rem;
      color: #3b82f6; /* Azul */
      border-color: #e5e7eb;
      margin: 0 2px;
      border-radius: 6px !important;
      background-color: #fff;
  }
  .calendar-modal .pagination .page-link:hover {
      background-color: #eff6ff;
      border-color: #d1d5db;
  }
  .calendar-modal .pagination .page-item.active .page-link {
      background-color: #3b82f6;
      border-color: #3b82f6;
      color: white;
      z-index: 1; /* Asegura que esté por encima */
  }
  .calendar-modal .pagination .page-item.disabled .page-link {
      color: #9ca3af; /* Gris para deshabilitado */
      background-color: #f9fafb;
      border-color: #e5e7eb;
  }

  /* --- Overlay de Carga --- */
  .loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.8); /* Fondo blanco semi-transparente */
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1060; /* Encima de modales (Bootstrap z-index) */
    color: #1f2937; /* Texto oscuro */
    font-weight: 500;
  }

  /* --- Lista de búsqueda de clientes --- */
    .client-search-results {
        position: absolute;
        z-index: 1050; /* Encima del contenido normal, debajo de modales */
        width: 100%;
        max-height: 200px;
        overflow-y: auto;
        border: 1px solid #d1d5db; /* Borde gris */
        background-color: white;
        border-radius: 0 0 6px 6px; /* Redondeo inferior */
        margin-top: -1px; /* Solapar ligeramente con el input */
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -1px rgba(0, 0, 0, 0.04);
    }
    .client-search-results .list-group-item {
        font-size: 0.875rem;
        padding: 0.5rem 0.75rem;
        border: none; /* Quitamos bordes internos */
        border-bottom: 1px solid #f3f4f6; /* Separador muy sutil */
        cursor: pointer;
    }
     .client-search-results .list-group-item:last-child {
        border-bottom: none;
     }
    .client-search-results .list-group-item:hover {
        background-color: #f3f4f6; /* Gris muy claro hover */
    }
    .client-search-results .list-group-item.no-results {
        color: #6b7280; /* Texto gris para mensajes */
        cursor: default;
        background-color: white !important; /* Sin hover */
    }

    /* Ocultar el input de búsqueda original de react-select si es necesario */
    /* .calendar-modal .Select__input { display: none; } */

`;

// --- COMPONENTE PRINCIPAL ---
export default function Calendario() {
  // --- Estados del Componente ---
  const [data, setData] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  const [selectedReserva, setSelectedReserva] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [listModalOpen, setListModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [searchText, setSearchText] = useState("");
  const [clientSearchText, setClientSearchText] = useState("");
  const [clientSearchResults, setClientSearchResults] = useState([]);
  const [showClientSearch, setShowClientSearch] = useState(false);
  const [isClientSearchLoading, setIsClientSearchLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // --- Mapeo de colores (ajustado a la UI) ---
  const colorMap = {
    terminada: "#10B981", // Verde
    anulada: "#F04438",   // Rojo
    pendiente: "#F79009", // Naranja/Amarillo
    en_proceso: "#F59E0B", // Naranja más claro
    confirmada: "#3B82F6", // Azul
    default: "#6B7280" // Gris por defecto
  };

  // --- Opciones formateadas para react-select ---
   const serviceOptions = availableServices.map((service) => ({
    value: service.id,
    label: service.Nombre || service.name || service.Name || `Servicio ${service.id}`,
  }));

  // --- Carga de Datos ---
  const loadInitialData = useCallback(async () => {
    // ... (sin cambios)
    setLoading(true);
    try {
      const [fetchedReservations, fetchedServices] = await Promise.all([
        reservasService.getAllReservations(),
        serviciosService.getAllServicios(),
      ]);
      const normalizedServices = (fetchedServices || []).map((service) => ({
        ...service,
        Nombre: service.Nombre || service.name || service.Name || `Servicio ${service.id}`,
      }));
      setData(fetchedReservations || []);
      setAvailableServices(normalizedServices);
    } catch (error) {
      console.error("Error fetching initial data:", error);
      Swal.fire("Error Carga Inicial", `No se pudieron cargar los datos: ${error?.message || "Error desconocido"}`, "error");
      setData([]);
      setAvailableServices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);


  // --- Mapeo de eventos para FullCalendar (MODIFICADO para usar eventContent) ---
   const events = data.map((reserva) => ({
     id: reserva.idReservations?.toString() || reserva.id?.toString(),
     title: reserva.fullName || reserva.evento || `Reserva ${reserva.idReservations || reserva.id}`,
     start: reserva.dateTime,
     extendedProps: { // Pasamos datos extra al evento
       status: reserva.status || 'default',
     }
   }));

  // --- Resto de Funciones (handleDateClick, handleEventClick, handleEventDrop, etc.) ---
  // --- Deben permanecer igual que en la versión anterior con archivo CSS separado ---
  // --- ... (incluye handleClientSearch, selectClient, handleAbonoChange, addAbono, removeAbono, updateRestante, handleMultiServiceChange, validaciones, handleSaveReserva, handleCancel, handleDownloadExcel, formatCurrency, toggleListModal, handlePageChange) ...
  // --- ¡Asegúrate de tener TODAS las funciones aquí! ---
    // (Funciones omitidas por brevedad, deben estar aquí como en la respuesta anterior)
  const handleDateClick = (arg) => {
      const now = new Date();
      const clickedDateTime = new Date(arg.dateStr);
      const nowUTC = new Date(now.toISOString());
      const clickedUTC = new Date(clickedDateTime.toISOString());

      if (clickedUTC.getTime() < nowUTC.getTime() && arg.dateStr !== now.toISOString().split('T')[0]) { // Permitir click en hoy
          Swal.fire("Fecha Inválida", "No se pueden crear reservas en fechas pasadas.", "warning");
          return;
      }

      setSelectedReserva(null);
      const defaultTime = "T09:00";
      // Establecer fecha/hora. Si es hoy, usar hora actual + 1 hora, si no, usar hora por defecto.
      let initialDateTime = arg.dateStr + defaultTime;
      if (arg.dateStr === now.toISOString().split('T')[0]) {
          now.setHours(now.getHours() + 1, 0, 0, 0); // Hora actual + 1 hora, minutos a 00
          initialDateTime = now.toISOString().slice(0, 16);
      }


      setForm({ ...emptyForm, dateTime: initialDateTime, pass: [{ fecha: new Date().toISOString().split('T')[0], cantidad: "" }] }); // Inicializar pass con fecha hoy
      setErrors({});
      setClientSearchText("");
      setClientSearchResults([]);
      setShowClientSearch(false);
      setModalOpen(true);
  };

  const handleEventClick = (info) => {
    const idReservations = Number.parseInt(info.event.id, 10);
    if (isNaN(idReservations)) {
        console.error("ID de reserva inválido:", info.event.id);
        Swal.fire("Error", "ID de reserva inválido.", "error");
        return;
    }
    setLoading(true);
    reservasService.getReservationById(idReservations).then((detailedReservation) => {
        // ... (lógica igual que antes)
         if (detailedReservation && !detailedReservation.error) {
          setSelectedReserva(detailedReservation);
          const selectedServiceValues = (Array.isArray(detailedReservation.AditionalServices) ? detailedReservation.AditionalServices : [])
              .map((service) => ({
                  value: service.idAditionalServices,
                  label: service.name || `Servicio ${service.idAditionalServices}`,
              }));
          let formattedPass = [];
          if (Array.isArray(detailedReservation.pass)) {
              formattedPass = detailedReservation.pass.map((abono) => ({
                  fecha: abono.fecha ? abono.fecha.split('T')[0] : "", // Formatear fecha
                  cantidad: abono.cantidad || 0,
              }));
          }
          const idCliente = detailedReservation.idCustomers || (detailedReservation.Customer ? detailedReservation.Customer.idCustomers : null);
          setForm({
              ...emptyForm,
              ...detailedReservation,
              id: detailedReservation.idReservations,
              idCustomers: idCliente,
              fullName: detailedReservation.fullName || (detailedReservation.Customer ? detailedReservation.Customer.fullName : ""),
              distintive: detailedReservation.distintive || (detailedReservation.Customer ? detailedReservation.Customer.distintive : ""),
              customerCategory: detailedReservation.customerCategory || (detailedReservation.Customer ? detailedReservation.Customer.customerCategory : ""),
              email: detailedReservation.email || (detailedReservation.Customer ? detailedReservation.Customer.email : ""),
              cellphone: detailedReservation.cellphone || (detailedReservation.Customer ? detailedReservation.Customer.cellphone : ""),
              address: detailedReservation.address || (detailedReservation.Customer ? detailedReservation.Customer.address : ""),
              dateTime: detailedReservation.dateTime ? detailedReservation.dateTime.slice(0, 16) : "",
              servicios: selectedServiceValues,
              pass: formattedPass.length > 0 ? formattedPass : [{ fecha: new Date().toISOString().split('T')[0], cantidad: "" }], // Asegurar al menos un abono con fecha
          });
          updateRestante(detailedReservation.totalPay, formattedPass);
          setErrors({});
          setClientSearchText("");
          setClientSearchResults([]);
          setShowClientSearch(false);
          setModalOpen(true);
        } else {
            console.error("Reserva no encontrada o error al cargar. ID:", idReservations, "Respuesta:", detailedReservation);
            Swal.fire("Error", detailedReservation?.errorMessage || "No se pudo encontrar la reserva seleccionada.", "error");
        }
    }).catch((error) => {
        console.error("Error fetching reservation details:", error);
        Swal.fire("Error", `No se pudo cargar los detalles de la reserva: ${error.message}`, "error");
    }).finally(() => {
        setLoading(false);
    });
  };

  const handleEventDrop = async (info) => {
    // ... (lógica igual que antes)
    const { event } = info;
    const idReservations = Number.parseInt(event.id, 10);
    const reservaOriginal = data.find((res) => res.idReservations === idReservations);

    if (!reservaOriginal) {
      console.error("Error: No se encontró reserva original para reprogramar. ID:", idReservations);
      Swal.fire("Error Interno", "No se pudo encontrar la reserva.", "error");
      info.revert();
      return;
    }
    const newStartDate = new Date(event.start);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (newStartDate < today) {
      Swal.fire("Error", "No se pueden reprogramar a fechas pasadas.", "error");
      info.revert();
      return;
    }
     const fullReservaData = await reservasService.getReservationById(idReservations);
     if (!fullReservaData || fullReservaData.error) {
         Swal.fire("Error", "No se pudieron obtener los detalles completos para reprogramar.", "error");
         info.revert();
         return;
     }
    const updatedReservaData = {
      ...fullReservaData,
      id: idReservations,
      idReservations: idReservations,
      dateTime: event.start.toISOString().slice(0, 16),
       idAditionalServices: (fullReservaData.AditionalServices || []).map(s => s.idAditionalServices),
       pass: (fullReservaData.pass || []).map(p => ({ fecha: p.fecha ? p.fecha.split('T')[0] : '', cantidad: p.cantidad })), // Asegurar formato fecha
    };
    delete updatedReservaData.AditionalServices;
    delete updatedReservaData.Customer;
    delete updatedReservaData.error;
    delete updatedReservaData.errorMessage;
    try {
      setLoading(true);
      updatedReservaData.idCustomers = Number(updatedReservaData.idCustomers);
      if (isNaN(updatedReservaData.idCustomers)) throw new Error("ID de cliente inválido para reprogramar.");

      // Convertir campos numéricos
      updatedReservaData.numberPeople = Number.parseInt(updatedReservaData.numberPeople || 0);
      updatedReservaData.decorationAmount = Number.parseFloat(updatedReservaData.decorationAmount || 0);
      updatedReservaData.totalPay = Number.parseFloat(updatedReservaData.totalPay || 0);
      updatedReservaData.remaining = Number.parseFloat(updatedReservaData.remaining || 0);


      await reservasService.updateReservation(idReservations, updatedReservaData);
       setData((prevData) =>
        prevData.map((res) =>
          res.idReservations === idReservations ? { ...res, dateTime: updatedReservaData.dateTime } : res
        )
      );
      Swal.fire("Reserva reprogramada", "La fecha de la reserva se actualizó.", "success");
    } catch (error) {
      console.error("Error updating reservation on drop:", error);
       const errorMessage = error.response?.data?.message || error.message || "No se pudo reprogramar la reserva.";
      Swal.fire("Error", errorMessage, "error");
      info.revert();
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => { setSearchText(e.target.value); };
  const filteredEvents = events.filter((event) => event.title.toLowerCase().includes(searchText.toLowerCase()));

  const handleClientSearch = async (searchValue) => {
    // ... (lógica igual que antes)
     setClientSearchText(searchValue);
    if (searchValue.length < 2) {
      setClientSearchResults([]);
      setShowClientSearch(true);
      return;
    }
    setIsClientSearchLoading(true);
    setShowClientSearch(true);
    try {
      const results = await clientesService.searchClientes(searchValue);
      if (Array.isArray(results)) {
        const normalizedResults = results.map((cliente) => ({
          id: cliente.idCustomers || cliente.id,
          idCustomers: Number(cliente.idCustomers || cliente.id),
          FullName: cliente.FullName || cliente.NombreCompleto || cliente.name || `Cliente ${cliente.idCustomers || cliente.id}`,
          Distintive: cliente.Distintive || cliente.Distintivo || "Regular",
          CustomerCategory: cliente.CustomerCategory || cliente.CategoriaCliente || "",
          Email: cliente.Email || cliente.Correo || "",
          Cellphone: cliente.Cellphone || cliente.Celular || "",
          Address: cliente.Address || cliente.Direccion || "",
        }));
        setClientSearchResults(normalizedResults);
      } else {
        setClientSearchResults([]);
      }
    } catch (error) {
      console.error("Error al buscar clientes:", error);
      setClientSearchResults([]);
    } finally {
      setIsClientSearchLoading(false);
    }
  };

  const selectClient = (cliente) => {
    // ... (lógica igual que antes)
    if (!cliente || (!cliente.idCustomers && cliente.idCustomers !== 0)) {
      setErrors((prev) => ({ ...prev, idCustomers: "Cliente seleccionado inválido" }));
      return;
    }
    const idCustomersNum = Number(cliente.idCustomers);
    if (isNaN(idCustomersNum)) {
      setErrors((prev) => ({ ...prev, idCustomers: "ID de cliente inválido" }));
      return;
    }
    setForm((prevForm) => ({
      ...prevForm,
      idCustomers: idCustomersNum,
      fullName: cliente.FullName || "",
      distintive: cliente.Distintive || "",
      customerCategory: cliente.CustomerCategory || "",
      email: cliente.Email || "",
      cellphone: cliente.Cellphone || "",
      address: cliente.Address || "",
    }));
    setClientSearchText("");
    setClientSearchResults([]);
    setShowClientSearch(false);
    if (errors.idCustomers) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.idCustomers;
        return newErrors;
      });
    }
  };

  const handleAbonoChange = (index, field, value) => {
    // ... (lógica igual que antes)
    const updatedAbonos = form.pass.map((abono, i) => (i === index ? { ...abono, [field]: value } : abono));
    setForm((prevForm) => ({ ...prevForm, pass: updatedAbonos }));
    if (field === "cantidad") {
      updateRestante(form.totalPay, updatedAbonos);
    }
    setErrors((prevErrors) => ({ ...prevErrors, [`pass-${index}-${field}`]: validateAbonoField(field, value) }));
  };

  const addAbono = () => {
     // Añadir abono con fecha actual por defecto
    const todayStr = new Date().toISOString().split('T')[0];
    setForm((prevForm) => ({ ...prevForm, pass: [...(prevForm.pass || []), { fecha: todayStr, cantidad: "" }] }));
    setErrors((prevErrors) => ({ ...prevErrors, pass: "" }));
  };

  const removeAbono = (index) => {
    // ... (lógica igual que antes)
    const updatedAbonos = (form.pass || []).filter((_, i) => i !== index);
    setForm((prevForm) => ({ ...prevForm, pass: updatedAbonos }));
    updateRestante(form.totalPay, updatedAbonos);
    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      delete newErrors[`pass-${index}-fecha`];
      delete newErrors[`pass-${index}-cantidad`];
      return newErrors;
    });
  };

  const updateRestante = useCallback((totalPay, pass) => {
    // ... (lógica igual que antes)
     const totalAbonosNum = (pass || []).reduce((sum, abono) => sum + Number.parseFloat(abono.cantidad || 0), 0);
    const totalPagoNum = Number.parseFloat(totalPay || 0);
    const restanteNum = totalPagoNum - totalAbonosNum;
    const restanteFormatted = isNaN(restanteNum) ? "" : restanteNum.toFixed(0);
    setForm((prevForm) => ({ ...prevForm, remaining: restanteFormatted }));
  }, []);

  const handleMultiServiceChange = (selectedOptions) => {
    // ... (lógica igual que antes)
    setForm((prevForm) => ({ ...prevForm, servicios: selectedOptions || [] }));
    setErrors((prevErrors) => ({ ...prevErrors, servicios: validateField("servicios", selectedOptions || []) }));
  };

  const validateAbonoField = (fieldName, value) => {
      // ... (lógica igual que antes)
      if (fieldName === "fecha" && !value) return "Fecha requerida.";
      if (fieldName === "cantidad") {
        if (value === "" || value === null) return "Cantidad requerida.";
        const numValue = Number.parseFloat(value);
        if (isNaN(numValue) || numValue <= 0) return "Cantidad debe ser > 0.";
      }
      return "";
  };

  const validateField = (name, value) => {
      // ... (lógica igual que antes)
       if (name === "idCustomers") {
            if (value === null || value === undefined || value === "" || value <= 0 || isNaN(Number(value))) {
            return "Debe buscar y seleccionar un cliente válido.";
            }
            return "";
        }
        if (name === "servicios" && (!Array.isArray(value) || value.length === 0)) {
            return "Seleccione al menos un servicio.";
        }
        switch (name) {
            case "fullName": return value?.trim() ? "" : "Nombre de cliente requerido (seleccione un cliente).";
            case "dateTime":
                if (!value) return "Fecha y hora requeridas.";
                const selectedDate = new Date(value);
                const now = new Date();
                // Permite seleccionar el día actual, pero no horas pasadas en el día actual
                return selectedDate >= now ? "" : "Fecha/hora no puede ser pasada.";
            case "timeDurationR": return value ? "" : "Duración requerida.";
            case "evenType": return value ? "" : "Tipo de Evento requerido.";
            case "numberPeople":
                const numPeople = Number.parseInt(value);
                return !isNaN(numPeople) && numPeople > 0 ? "" : "Nro. Personas debe ser > 0.";
            case "decorationAmount":
                const decorAmount = Number.parseFloat(value);
                return !isNaN(decorAmount) && decorAmount >= 0 ? "" : "Monto Decoración debe ser >= 0.";
            case "totalPay":
                const totalP = Number.parseFloat(value);
                return !isNaN(totalP) && totalP > 0 ? "" : "Total a Pagar debe ser > 0.";
             case "paymentMethod": return value ? "" : "Forma de Pago requerida.";
             case "cellphone": return !value || /^\d{7,15}$/.test(value) ? "" : "Celular inválido (7-15 dígitos).";
             case "email": return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "" : "Correo inválido.";
            default: return "";
        }
  };

  const validateForm = () => {
      // ... (lógica igual que antes)
      const newErrors = {};
      let isValid = true;
      const fieldsToValidate = [
        "idCustomers", "dateTime", "timeDurationR", "evenType",
        "numberPeople", "decorationAmount", "totalPay", "servicios",
         //"paymentMethod"
      ];
      fieldsToValidate.forEach((key) => {
        const error = validateField(key, form[key]);
        if (error) {
          newErrors[key] = error;
          isValid = false;
        }
      });
       if (!form.fullName?.trim()) {
          newErrors.idCustomers = newErrors.idCustomers || "Seleccione un cliente válido.";
          isValid = false;
      }
      if (!form.pass || form.pass.length === 0) {
        newErrors.pass = "Debe agregar al menos un abono.";
        isValid = false;
      } else {
        form.pass.forEach((abono, i) => {
          const fe = validateAbonoField("fecha", abono.fecha);
          const ce = validateAbonoField("cantidad", abono.cantidad);
          if (fe) { newErrors[`pass-${i}-fecha`] = fe; isValid = false; }
          if (ce) { newErrors[`pass-${i}-cantidad`] = ce; isValid = false; }
        });
      }
      const totalPagoNum = Number.parseFloat(form.totalPay || 0);
      const totalAbonosNum = (form.pass || []).reduce((sum, abono) => sum + Number.parseFloat(abono.cantidad || 0), 0);
      if (!isNaN(totalPagoNum) && !isNaN(totalAbonosNum) && (totalPagoNum < totalAbonosNum)) {
          newErrors.remaining = "El total de abonos no puede superar el Total a Pagar.";
          isValid = false;
      }
      setErrors(newErrors);
      return isValid;
  };

  const handleChange = (e) => {
    // ... (lógica igual que antes)
     const { name, value } = e.target;
    const updatedForm = { ...form, [name]: value };
    setForm(updatedForm);
    if (name === "totalPay") {
      updateRestante(value, updatedForm.pass);
    }
    if (name !== 'idCustomers') {
        const error = validateField(name, value);
        setErrors((prevErrors) => ({ ...prevErrors, [name]: error, }));
    } else {
         setErrors((prevErrors) => {
            const newErrors = { ...prevErrors };
            delete newErrors.idCustomers;
            return newErrors;
        });
    }
  };

  const handleSaveReserva = async () => {
    // ... (lógica igual que antes)
      updateRestante(form.totalPay, form.pass);
      await new Promise(resolve => setTimeout(resolve, 0)); // Delay for state update
      if (!validateForm()) {
        Swal.fire("Error Validación", "Corrija los errores indicados.", "warning");
        return;
      }
      const isEditing = selectedReserva !== null;
      const title = isEditing ? "¿Guardar Cambios?" : "¿Crear Reserva?";
      const result = await Swal.fire({ title, icon: "question", showCancelButton: true, confirmButtonColor: "#3085d6", cancelButtonColor: "#d33", confirmButtonText: "Sí", cancelButtonText: "No", });
      if (result.isConfirmed) {
        setLoading(true);
        try {
            const idAditionalServices = (form.servicios || []).map((option) => option.value);
            const abonosToSend = (form.pass || []).map((ab) => ({ fecha: ab.fecha, cantidad: Number.parseFloat(ab.cantidad || 0), }));
            const idCustomersNum = Number(form.idCustomers);
            if (isNaN(idCustomersNum)) throw new Error("ID de cliente inválido al guardar.");
            const dataToSend = {
                ...form,
                idCustomers: idCustomersNum,
                idAditionalServices: idAditionalServices,
                pass: abonosToSend,
                numberPeople: Number.parseInt(form.numberPeople || 0),
                decorationAmount: Number.parseFloat(form.decorationAmount || 0),
                totalPay: Number.parseFloat(form.totalPay || 0),
                remaining: Number.parseFloat(form.remaining || 0),
            };
            delete dataToSend.servicios; delete dataToSend.fullName; delete dataToSend.distintive; delete dataToSend.customerCategory; delete dataToSend.email; delete dataToSend.cellphone; delete dataToSend.address;
            console.log("Datos enviados:", dataToSend);

            if (isEditing) {
                const reservationId = selectedReserva.idReservations || form.id;
                if (!reservationId) throw new Error("No se pudo identificar la reserva a actualizar.");
                await reservasService.updateReservation(reservationId, dataToSend);
                setData((prevData) => prevData.map((r) => r.idReservations === reservationId ? { ...form, idReservations: reservationId, remaining: dataToSend.remaining } : r ));
                Swal.fire("Actualizado", "Reserva actualizada.", "success");
            } else {
                const newReservationResponse = await reservasService.createReservation(dataToSend);
                const newReservationForState = { ...form, ...newReservationResponse, idReservations: newReservationResponse.idReservations || newReservationResponse.id, remaining: dataToSend.remaining };
                setData((prevData) => [...prevData, newReservationForState]);
                Swal.fire("Creada", "Reserva creada.", "success");
            }
            setModalOpen(false);
        } catch (error) {
            console.error("Error saving reservation:", error);
            const errorMessage = error.response?.data?.message || error.message || "No se pudo guardar la reserva.";
            Swal.fire("Error", errorMessage, "error");
        } finally {
            setLoading(false);
        }
    }
  };

  const handleCancel = async (id) => {
    // ... (lógica igual que antes)
    if (!id) { Swal.fire("Error", "No se proporcionó ID para eliminar.", "error"); return; }
    const result = await Swal.fire({ title: "¿ELIMINAR Reserva?", text: "¡Esta acción no se puede deshacer!", icon: "warning", showCancelButton: true, confirmButtonColor: "#d33", cancelButtonColor: "#3085d6", confirmButtonText: "Sí, eliminar", cancelButtonText: "No", });
    if (result.isConfirmed) {
        setLoading(true);
        try {
            const response = await reservasService.deleteReservation(id);
            if (response && response.success !== false) {
                setData((prevData) => prevData.filter((reserva) => reserva.idReservations !== id));
                setModalOpen(false); setListModalOpen(false);
                Swal.fire("Eliminada", response.message || "Reserva eliminada.", "success");
            } else { Swal.fire("Error", response?.message || "No se pudo eliminar la reserva.", "error"); }
        } catch (error) {
            console.error("Error deleting reservation:", error);
            const errorMessage = error.response?.data?.message || error.message || "Error al eliminar.";
            Swal.fire("Error", errorMessage, "error");
        } finally { setLoading(false); }
    }
  };

  const handleDownloadExcel = () => {
    // ... (lógica igual que antes)
    if (data.length === 0) { Swal.fire("Vacío", "No hay datos de reservas para exportar.", "info"); return; }
    const dataToExport = data.map((r) => ({
        ID: r.idReservations || r.id, Cliente: r.fullName || "N/A", 'Fecha y Hora': r.dateTime ? new Date(r.dateTime).toLocaleString("es-CO", { dateStyle: 'short', timeStyle: 'short' }) : "N/A",
        'Tipo Evento': r.evenType || "N/A", 'Personas': r.numberPeople || "N/A", 'Total Pago ($)': r.totalPay || 0, 'Restante ($)': r.remaining || 0,
        'Estado': r.status ? r.status.replace("_", " ") : "N/A", 'Observaciones': r.matter || "",
    }));
    const ws = utils.json_to_sheet(dataToExport);
    ws['!cols'] = [ { wch: 5 }, { wch: 25 }, { wch: 18 }, { wch: 15 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 30 }, ];
    const wb = utils.book_new(); utils.book_append_sheet(wb, ws, "Reservas"); writeFile(wb, "Lista_Reservas.xlsx");
  };

  const formatCurrency = (value) => {
    // ... (lógica igual que antes)
     const n = Number.parseFloat(value);
    return isNaN(n) ? "$0" : new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);
  };

  const toggleListModal = () => {
    // ... (lógica igual que antes)
    if (!listModalOpen) { setCurrentPage(1); }
    setListModalOpen(!listModalOpen);
  };

  const handlePageChange = (pageNumber) => { setCurrentPage(pageNumber); };

  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const sortedData = [...data].sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
  const currentItems = sortedData.slice(startIndex, endIndex);


  // --- RENDERIZADO DEL COMPONENTE ---
  return (
    // Añadimos una clase contenedora para aplicar estilos globales específicos
    <Container fluid className="p-0 calendar-container">

      {/* --- ETIQUETA STYLE CON TODO EL CSS --- */}
      <style>{calendarStyles}</style>

      {/* --- Indicador de Carga General --- */}
      {loading && (
         <div className="loading-overlay"> {/* Usa clase para styling */}
          <Spinner color="primary" style={{ width: "3rem", height: "3rem" }} />
          <span className="ms-2">Cargando...</span>
        </div>
      )}

      {/* --- Encabezado y Botones (se estilizarán via CSS) --- */}
      <Row className="mb-3 align-items-center calendar-header">
        <Col>
          <h2>Calendario</h2> {/* Título ajustado */}
        </Col>
         {/* Input de búsqueda */}
        <Col md={4} lg={3}>
           <Input
            bsSize="sm" // Tamaño más pequeño
            type="text"
            className="calendar-search-input" // Clase para estilo
            placeholder="Buscar en calendario..."
            value={searchText}
            onChange={handleSearchChange}
            disabled={loading}
          />
        </Col>
        <Col xs="auto">
          <Button color="secondary" outline size="sm" onClick={toggleListModal} disabled={loading || data.length === 0} title="Ver lista">
            <FaList className="me-1" /> Lista
          </Button>
        </Col>
        <Col xs="auto">
          <Button color="secondary" outline size="sm" onClick={handleDownloadExcel} disabled={data.length === 0 || loading} title="Descargar Excel">
            <FaFileExcel className="me-1" /> Exportar
          </Button>
        </Col>
      </Row>

      {/* --- Contenedor del Calendario --- */}
      <Row>
        <Col>
          {/* Aplicamos una clase al div contenedor de FullCalendar */}
          <div className="fullcalendar-wrapper" style={{ height: "calc(100vh - 180px)", position: "relative" }}>
            {data.length > 0 || !loading ? (
              <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek' // Añadimos vista semanal
                }}
                 buttonText={{
                    today:    'Hoy',
                    month:    'Mes',
                    week:     'Semana',
                    day:      'Día',
                    list:     'Lista'
                }}
                events={events}
                dateClick={handleDateClick}
                eventClick={handleEventClick}
                editable={true}
                eventDrop={handleEventDrop}
                locale="es"
                height="100%"
                dayMaxEventRows={3}
                // --- eventContent para personalizar el renderizado del evento ---
                eventContent={(eventInfo) => {
                   const status = eventInfo.event.extendedProps.status || 'default';
                   const dotColor = colorMap[status] || colorMap['default'];
                   return (
                     <div className={`fc-event-main-custom event-status-${status}`}>
                       <span className="event-dot" style={{ backgroundColor: dotColor }}></span>
                       <span className="event-title">{eventInfo.event.title}</span>
                       {eventInfo.timeText && <span className="event-time">{eventInfo.timeText}</span>}
                     </div>
                   );
                }}
              />
            ) : (
              <p className="text-center mt-5">{loading ? "" : "No hay reservas para mostrar en el calendario."}</p>
            )}
          </div>
        </Col>
      </Row>

        {/* --- MODAL PARA CREAR/EDITAR RESERVA --- */}
        <Modal isOpen={modalOpen} toggle={() => !loading && setModalOpen(!modalOpen)} size="lg" backdrop="static" scrollable className="calendar-modal">
            <ModalHeader toggle={() => !loading && setModalOpen(!modalOpen)}>
                {selectedReserva ? "Editar Reserva" : "Nueva Reserva"}
            </ModalHeader>
            <ModalBody>
                {/* --- Datos del Cliente --- */}
                <FormGroup tag="fieldset" className="modal-fieldset">
                    <legend className="modal-legend">Datos del Cliente</legend>
                    <Row>
                        <Col md={7}>
                            <Label htmlFor="clienteBusqueda"><b>Buscar y Seleccionar Cliente*</b></Label>
                            <div style={{ position: 'relative' }}>
                                <Input
                                    id="clienteBusqueda"
                                    type="text"
                                    placeholder="Escriba nombre, ID o distintivo (mín 2 letras)"
                                    value={clientSearchText}
                                    onChange={(e) => handleClientSearch(e.target.value)}
                                    onFocus={() => setShowClientSearch(true)}
                                    onBlur={() => setTimeout(() => setShowClientSearch(false), 200)} // Ocultar con retardo
                                    disabled={loading}
                                    invalid={!!errors.idCustomers && !form.idCustomers}
                                    autoComplete="off"
                                />
                                {isClientSearchLoading && <Spinner size="sm" color="primary" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }} />}
                                {showClientSearch && (
                                    <div className="list-group client-search-results" onMouseDown={(e) => e.preventDefault()}>
                                        {clientSearchResults.length > 0 ? (
                                            clientSearchResults.map((cliente) => (
                                                <button type="button" key={cliente.idCustomers} className="list-group-item list-group-item-action" onClick={() => selectClient(cliente)}>
                                                    {cliente.FullName} (ID: {cliente.idCustomers}, {cliente.Distintive})
                                                </button>
                                            ))
                                        ) : (
                                            <span className="list-group-item no-results">
                                                {clientSearchText.length < 2 ? "Escriba al menos 2 letras" : isClientSearchLoading ? "Buscando..." : "No se encontraron clientes"}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                            {errors.idCustomers && !form.idCustomers && <div className="text-danger mt-1 small">{errors.idCustomers}</div>}
                        </Col>
                        <Col md={5}>
                            <Label htmlFor="categoriaClienteDisplay">Categoría</Label>
                            <Input id="categoriaClienteDisplay" value={form.customerCategory || "-"} readOnly disabled bsSize="sm" />
                        </Col>
                        {form.fullName && (
                            <Col md={12} className="mt-2">
                                <Label>Cliente Seleccionado:</Label>
                                <Input bsSize="sm" type="text" value={`${form.fullName} (Dist: ${form.distintive || "N/A"})`} readOnly disabled style={{backgroundColor: '#e9ecef', border: 'none'}} />
                                {errors.fullName && <div className="text-danger small">{errors.fullName}</div>}
                            </Col>
                        )}
                    </Row>
                </FormGroup>

                 {/* --- Detalles de la Reserva --- */}
                 <FormGroup tag="fieldset" className="modal-fieldset">
                    <legend className="modal-legend">Detalles de la Reserva</legend>
                    <Row>
                         <Col md={6}>
                             <Label htmlFor="dateTime"><b>Fecha y Hora*</b></Label>
                             <Input id="dateTime" name="dateTime" type="datetime-local" value={form.dateTime} onChange={handleChange} invalid={!!errors.dateTime} disabled={loading} />
                             {errors.dateTime && <FormFeedback>{errors.dateTime}</FormFeedback>}
                         </Col>
                         <Col md={6}>
                             <Label htmlFor="timeDurationR"><b>Duración (HH:MM)*</b></Label>
                             <Input id="timeDurationR" name="timeDurationR" type="time" value={form.timeDurationR} onChange={handleChange} invalid={!!errors.timeDurationR} step="1800" disabled={loading} />
                             {errors.timeDurationR && <FormFeedback>{errors.timeDurationR}</FormFeedback>}
                         </Col>
                    </Row>
                     <Row className="mt-3">
                         <Col md={6}>
                            <Label htmlFor="evenType"><b>Tipo de Evento*</b></Label>
                            <Input id="evenType" name="evenType" type="select" value={form.evenType} onChange={handleChange} invalid={!!errors.evenType} disabled={loading}>
                                <option value="">Seleccione...</option>
                                <option value="Empresarial">Empresarial</option>
                                <option value="Cumpleaños">Cumpleaños</option>
                                <option value="Grado">Grado</option>
                                <option value="Aniversario">Aniversario</option>
                                <option value="Bautizo">Bautizo</option>
                                <option value="PrimeraComunion">Primera Comunión</option>
                                <option value="Matrimonio">Matrimonio</option>
                                <option value="Otro">Otro</option>
                            </Input>
                             {errors.evenType && <FormFeedback>{errors.evenType}</FormFeedback>}
                         </Col>
                         <Col md={6}>
                             <Label htmlFor="numberPeople"><b>Número de Personas*</b></Label>
                             <Input id="numberPeople" name="numberPeople" type="number" value={form.numberPeople} onChange={handleChange} invalid={!!errors.numberPeople} min="1" disabled={loading} />
                             {errors.numberPeople && <FormFeedback>{errors.numberPeople}</FormFeedback>}
                         </Col>
                     </Row>
                    <Row className="mt-3">
                        <Col md={12}>
                            <Label htmlFor="matter">Observaciones</Label>
                            <Input id="matter" name="matter" type="textarea" value={form.matter} onChange={handleChange} rows="2" disabled={loading} />
                        </Col>
                    </Row>
                </FormGroup>

                 {/* --- Servicios Adicionales --- */}
                 <FormGroup tag="fieldset" className="modal-fieldset">
                     <legend className="modal-legend">Servicios Adicionales*</legend>
                     <Select
                        id="servicios" name="servicios" options={serviceOptions} isMulti onChange={handleMultiServiceChange} value={form.servicios}
                        placeholder="Seleccione servicios..." isLoading={loading && availableServices.length === 0} isDisabled={loading || availableServices.length === 0}
                        closeMenuOnSelect={false} styles={{ control: (base) => ({ ...base, borderColor: errors.servicios ? "#dc3545" : "#ced4da", }), }}
                        noOptionsMessage={() => availableServices.length === 0 ? "No hay servicios disponibles" : "No hay más opciones"}
                    />
                    {errors.servicios && <div className="text-danger mt-1 small">{errors.servicios}</div>}
                 </FormGroup>

                 {/* --- Detalles de Pago y Abonos --- */}
                 <FormGroup tag="fieldset" className="modal-fieldset">
                    <legend className="modal-legend">Detalles de Pago</legend>
                     <Row>
                         <Col md={6}>
                            <Label htmlFor="decorationAmount"><b>Monto Decoración*</b> ($)</Label>
                             <Input id="decorationAmount" name="decorationAmount" type="number" placeholder="Ej: 50000" value={form.decorationAmount} onChange={handleChange} invalid={!!errors.decorationAmount} min="0" disabled={loading} />
                            {errors.decorationAmount && <FormFeedback>{errors.decorationAmount}</FormFeedback>}
                         </Col>
                        <Col md={6}>
                            <Label htmlFor="totalPay"><b>Total a Pagar (Reserva)*</b> ($)</Label>
                             <Input id="totalPay" name="totalPay" type="number" placeholder="Ej: 300000" value={form.totalPay} onChange={handleChange} invalid={!!errors.totalPay} min="0" disabled={loading} />
                             {errors.totalPay && <FormFeedback>{errors.totalPay}</FormFeedback>}
                         </Col>
                     </Row>
                    <Row className="mt-3">
                        <Col md={12}>
                            <Label><b>Abonos*</b></Label>
                             {errors.pass && <div className="text-danger mb-2 small">{errors.pass}</div>}
                             {(form.pass || []).map((abono, index) => (
                                <Row key={index} className="mb-2 align-items-center gx-2">
                                     <Col md={5} xs={5}>
                                         <Input type="date" bsSize="sm" value={abono.fecha} onChange={(e) => handleAbonoChange(index, "fecha", e.target.value)} invalid={!!errors[`pass-${index}-fecha`]} disabled={loading} max={new Date().toISOString().split('T')[0]}/>
                                         {errors[`pass-${index}-fecha`] && <FormFeedback>{errors[`pass-${index}-fecha`]}</FormFeedback>}
                                     </Col>
                                     <Col md={5} xs={5}>
                                         <Input type="number" bsSize="sm" placeholder="Cantidad ($)" value={abono.cantidad} onChange={(e) => handleAbonoChange(index, "cantidad", e.target.value)} invalid={!!errors[`pass-${index}-cantidad`]} min="1" disabled={loading} />
                                         {errors[`pass-${index}-cantidad`] && (<FormFeedback>{errors[`pass-${index}-cantidad`]}</FormFeedback>)}
                                     </Col>
                                     <Col md={2} xs={2} className="text-end">
                                         <Button size="sm" color="danger" outline onClick={() => removeAbono(index)} disabled={loading || (form.pass || []).length <= 1} title="Eliminar abono"> <FaTrashAlt /> </Button>
                                     </Col>
                                </Row>
                            ))}
                            <Button color="primary" outline size="sm" onClick={addAbono} className="mt-1" disabled={loading}> + Agregar Abono </Button>
                        </Col>
                    </Row>
                     <Row className="mt-3">
                         <Col md={6}>
                             <Label htmlFor="remaining"><b>Restante*</b></Label>
                             <Input id="remaining" name="remaining" type="text" value={formatCurrency(form.remaining)} readOnly invalid={!!errors.remaining} className={`fw-bold ${Number(form.remaining) < 0 ? 'text-danger is-invalid' : ''}`} />
                             {errors.remaining && <FormFeedback>{errors.remaining}</FormFeedback>}
                         </Col>
                          {/* Descomentar si se usa paymentMethod */}
                         {/* <Col md={6}>
                            <Label htmlFor="paymentMethod"><b>Forma de Pago*</b></Label>
                            <Input id="paymentMethod" name="paymentMethod" type="select" value={form.paymentMethod} onChange={handleChange} invalid={!!errors.paymentMethod} disabled={loading}>
                                <option value="">Seleccione...</option> <option value="Efectivo">Efectivo</option> <option value="Transferencia">Transferencia</option> <option value="Tarjeta">Tarjeta</option> <option value="Otro">Otro</option>
                            </Input>
                            {errors.paymentMethod && <FormFeedback>{errors.paymentMethod}</FormFeedback>}
                         </Col> */}
                     </Row>
                 </FormGroup>

                 {/* --- Estado Visual --- */}
                 <FormGroup tag="fieldset" className="modal-fieldset">
                    <legend className="modal-legend">Estado de la Reserva</legend>
                     <Row>
                         <Col md={12}>
                             <Label htmlFor="status"><b>Estado (Visual)*</b></Label>
                             <Input id="status" name="status" type="select" value={form.status} onChange={handleChange} disabled={loading}>
                                <option value="pendiente">Pendiente</option> <option value="confirmada">Confirmada</option> <option value="en_proceso">En Proceso</option> <option value="terminada">Terminada</option> <option value="anulada">Anulada</option>
                             </Input>
                         </Col>
                     </Row>
                 </FormGroup>
            </ModalBody>
            <ModalFooter>
                <Button color="primary" onClick={handleSaveReserva} disabled={loading}> {loading ? <Spinner size="sm" /> : selectedReserva ? "Guardar Cambios" : "Crear Reserva"} </Button>
                {selectedReserva && ( <Button color="danger" outline onClick={() => handleCancel(selectedReserva.idReservations)} disabled={loading}> {loading ? <Spinner size="sm" /> : <><FaTrashAlt className="me-1"/> Eliminar</>} </Button> )}
                <Button color="secondary" onClick={() => setModalOpen(false)} disabled={loading}> Cancelar </Button>
            </ModalFooter>
        </Modal>

       {/* --- MODAL PARA MOSTRAR LA LISTA DE RESERVAS --- */}
       <Modal isOpen={listModalOpen} toggle={toggleListModal} size="xl" backdrop="static" scrollable className="calendar-modal list-modal">
            <ModalHeader toggle={toggleListModal}> Lista de Reservas (Página {currentPage} de {totalPages}) </ModalHeader>
            <ModalBody>
                {currentItems && currentItems.length > 0 ? (
                <>
                    <Table hover responsive size="sm" className="reservations-table">
                         <thead>
                            <tr>
                                <th>#</th> <th>Cliente</th> <th>Fecha y Hora</th> <th>Tipo Evento</th> <th className="text-center">Personas</th>
                                <th className="text-end">Total</th> <th className="text-end">Restante</th> <th className="text-center">Estado</th> <th className="text-center">Acciones</th>
                            </tr>
                        </thead>
                         <tbody>
                            {currentItems.map((reserva, index) => (
                            <tr key={reserva.idReservations || reserva.id}>
                                <td>{startIndex + index + 1}</td>
                                <td>{reserva.fullName || "N/A"}</td>
                                <td>{reserva.dateTime ? new Date(reserva.dateTime).toLocaleString("es-CO", { dateStyle: 'medium', timeStyle: 'short' }) : "N/A"}</td>
                                <td>{reserva.evenType || "N/A"}</td>
                                <td className="text-center">{reserva.numberPeople || "N/A"}</td>
                                <td className="text-end">{formatCurrency(reserva.totalPay)}</td>
                                <td className="text-end">{formatCurrency(reserva.remaining)}</td>
                                <td className="text-center">
                                    <span className={`badge text-uppercase event-status-badge event-status-${reserva.status || 'default'}`}
                                          style={{ backgroundColor: colorMap[reserva.status] || colorMap['default'] }}>
                                        {reserva.status ? reserva.status.replace("_", " ") : "N/A"}
                                    </span>
                                </td>
                                <td className="text-center">
                                    <Button size="sm" color="primary" outline onClick={() => { handleEventClick({ event: { id: (reserva.idReservations || reserva.id).toString() } }); toggleListModal(); }} title="Ver/Editar Reserva"> Ver/Editar </Button>
                                </td>
                            </tr>
                            ))}
                        </tbody>
                    </Table>
                    {totalPages > 1 && (
                        <Pagination aria-label="Navegación de reservas" className="mt-3 justify-content-center">
                            <PaginationItem disabled={currentPage <= 1}> <PaginationLink first onClick={() => handlePageChange(1)} /> </PaginationItem>
                            <PaginationItem disabled={currentPage <= 1}> <PaginationLink previous onClick={() => handlePageChange(currentPage - 1)} /> </PaginationItem>
                             {[...Array(totalPages).keys()].map(page => ( <PaginationItem active={page + 1 === currentPage} key={page + 1}> <PaginationLink onClick={() => handlePageChange(page + 1)}> {page + 1} </PaginationLink> </PaginationItem> ))}
                            <PaginationItem disabled={currentPage >= totalPages}> <PaginationLink next onClick={() => handlePageChange(currentPage + 1)} /> </PaginationItem>
                            <PaginationItem disabled={currentPage >= totalPages}> <PaginationLink last onClick={() => handlePageChange(totalPages)} /> </PaginationItem>
                        </Pagination>
                    )}
                </>
                ) : ( <p className="text-center">No hay reservas para mostrar.</p> )}
            </ModalBody>
            <ModalFooter> <Button color="secondary" onClick={toggleListModal}> Cerrar </Button> </ModalFooter>
        </Modal>

    </Container> // Cierre del .calendar-container
  );
}