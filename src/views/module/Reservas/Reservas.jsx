import { useEffect, useState, useCallback, useRef } from "react"
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
} from "reactstrap"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import { utils, writeFile } from "xlsx"
import "sweetalert2/dist/sweetalert2.min.css"
import { FaFileExcel, FaTrashAlt, FaList } from "react-icons/fa"
import Select from "react-select"
import { AlertTriangle, CheckCircle, XCircle, Plus, Edit } from "lucide-react"
import toast, { Toaster } from "react-hot-toast"
import esLocale from '@fullcalendar/core/locales/es';

// --- IMPORTAR SERVICIOS REALES ---
import reservasService from "../../services/reservasService"
import clientesService from "../../services/clientesService"
import serviciosService from "../../services/serviciosService"

// --- Componente de Modal de Confirmación (copiado del componente de clientes) ---
const ConfirmationModal = ({
  isOpen,
  toggle,
  title,
  children,
  onConfirm,
  confirmText = "Confirmar",
  confirmColor = "primary",
  isConfirming = false,
}) => (
  <Modal
    isOpen={isOpen}
    toggle={!isConfirming ? toggle : undefined}
    centered
    backdrop="static"
    keyboard={!isConfirming}
  >
    <ModalHeader toggle={!isConfirming ? toggle : undefined}>
      <div className="d-flex align-items-center">
        <AlertTriangle
          size={24}
          className={`text-${confirmColor === "danger" ? "danger" : confirmColor === "warning" ? "warning" : "primary"} me-2`}
        />
        <span className="fw-bold">{title}</span>
      </div>
    </ModalHeader>
    <ModalBody>{children}</ModalBody>
    <ModalFooter>
      <Button color="secondary" outline onClick={toggle} disabled={isConfirming}>
        Cancelar
      </Button>
      <Button color={confirmColor} onClick={onConfirm} disabled={isConfirming}>
        {isConfirming ? (
          <>
            <Spinner size="sm" className="me-1" /> Procesando...
          </>
        ) : (
          confirmText
        )}
      </Button>
    </ModalFooter>
  </Modal>
)

// --- ESTADO INICIAL DEL FORMULARIO ---
const emptyForm = {
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
  additionalServiceAmount: "",
  pass: [],
  totalPay: "",
  remaining: "",
  status: "pendiente",
}

// Modificar el mapeo de colores para usar colores pastel más suaves
// ESTE colorMap ES PARA LA LISTA, NO PARA EL CALENDARIO DIRECTAMENTE
const colorMap = {
  terminada: "rgba(76, 175, 80, 0.7)",
  anulada: "rgba(244, 67, 54, 0.7)",
  pendiente: "rgba(255, 152, 0, 0.7)",
  en_proceso: "rgba(255, 235, 59, 0.7)",
  confirmada: "rgba(33, 150, 243, 0.7)",
  default: "rgba(158, 158, 158, 0.7)",
}

// Modificar los estilos CSS personalizados para el calendario
const customCalendarStyles = `
  /* Estilos generales para el calendario */
  .fc {
    --fc-border-color: #e5e7eb;
    --fc-page-bg-color: #fff;
    --fc-neutral-bg-color: #f9fafb;
    --fc-event-selected-box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    height: 100% !important; /* Asegura que FC tome toda la altura de su contenedor directo */
    width: 100% !important;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }
  
  /* Estilos para la barra de herramientas */
  .fc .fc-toolbar {
    margin-bottom: 0.25rem !important; /* Reducido */
    padding: 0.25rem 0.5rem; /* Reducido */
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
  }
  
  .fc .fc-toolbar-title {
    font-size: 1rem !important; /* Reducido */
    font-weight: 600;
    color: #111827;
  }
  
  /* Estilos para los botones */
  .fc .fc-button {
    padding: 0.2rem 0.5rem !important; /* Reducido */
    font-size: 0.75rem !important; /* Reducido */
    border-radius: 4px !important; /* Reducido */
    background-color: #fff;
    border: 1px solid #e5e7eb;
    color: #374151;
    font-weight: 500;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    transition: all 0.15s ease;
  }
  
  .fc .fc-button:hover {
    background-color: #f9fafb;
    border-color: #d1d5db;
  }
  
  .fc .fc-button-primary:not(:disabled).fc-button-active,
  .fc .fc-button-primary:not(:disabled):active {
    background-color: #f3f4f6;
    border-color: #d1d5db;
    color: #111827;
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
  }
  
  /* Estilos para los encabezados de día */
  .fc .fc-col-header-cell {
    padding: 0.2rem 0; /* Reducido */
    background-color: #fff;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .fc .fc-col-header-cell-cushion {
    padding: 0.2rem; /* Reducido */
    font-weight: 500;
    color: #6b7280;
    font-size: 0.7rem; /* Reducido */
    text-decoration: none !important;
  }
  
  /* Estilos para las celdas de día */
  .fc .fc-daygrid-day {
    min-height: 3.5rem; /* Reducido significativamente para filas más cortas */
    /* Alternativa: min-height: unset; si se quiere que la altura sea completamente flexible */
  }
  
  .fc .fc-daygrid-day-frame {
    padding: 2px; /* Reducido */
    display: flex;
    flex-direction: column;
    height: 100%; /* Para que el contenido se distribuya en la celda */
  }
  
  .fc .fc-daygrid-day-top {
    justify-content: flex-start;
    padding: 2px; /* Reducido */
    flex-shrink: 0; /* Para que el número del día no se encoja demasiado */
  }
  
  .fc .fc-daygrid-day-number {
    font-size: 0.7rem; /* Reducido */
    font-weight: 500;
    color: #374151;
    text-decoration: none !important;
    margin: 2px; /* Reducido */
    padding: 1px 2px; /* Ajustado */
  }
  
  /* Estilos para eventos - FullCalendar manejará el fondo con eventContent */
  .fc-event {
    border: none !important;
    background: transparent !important; /* Dejar que eventContent maneje el fondo */
    margin: 1px 0 !important; /* Reducido */
  }
  
  .fc-event-main {
    padding: 0 !important;
  }
  
  /* Estilo para el día actual */
  .fc .fc-day-today {
    background-color: rgba(239, 246, 255, 0.6) !important;
  }
  
  /* Estilos para días de otros meses */
  .fc .fc-day-other .fc-daygrid-day-top {
    opacity: 0.5;
  }
  
  /* Estilos para el contenedor de eventos */
  .fc .fc-daygrid-day-events {
    margin-top: 1px; /* Reducido */
    padding: 0 1px; /* Reducido */
    flex-grow: 1; /* Permite que el contenedor de eventos ocupe espacio disponible */
    overflow: hidden; /* Para manejar el desbordamiento de eventos */
    min-height: 1.5em; /* Un mínimo para que se vea algo si hay muchos eventos */
  }
    
  /* Estilos para eventos personalizados - NUEVO ESTILO */
  .custom-event-container {
    display: block;
    margin: 1px 0; /* Coincide con .fc-event margin */
    padding: 1px 3px; /* Reducido */
    border-radius: 4px; /* Reducido */
    font-size: 0.65rem; /* Reducido */
    line-height: 1.2; 
    cursor: pointer;
    box-shadow: 0 1px 1px rgba(0,0,0,0.08); /* Sombra más sutil */
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    transition: all 0.15s ease;
    border: 1px solid rgba(0,0,0,0.05); 
  }
  
  .custom-event-container:hover {
    box-shadow: 0 2px 3px rgba(0,0,0,0.1);
    transform: translateY(-1px);
  }
  
  .custom-event-title {
    font-weight: 500; /* Reducido */
  }
  
  .custom-event-time {
    font-weight: 400; 
    margin-left: 4px; 
    opacity: 0.9;
    font-size: 0.6rem; /* Ligeramente más pequeño si es necesario */
  }
  
  /* Ajustes para vista móvil (ya presentes, podrían necesitar revisión si la vista es muy pequeña) */
  @media (max-width: 768px) {
    .fc .fc-toolbar {
      flex-direction: column;
      align-items: flex-start;
    }
    
    .fc .fc-toolbar-chunk {
      margin-bottom: 0.5rem;
    }
    
    .fc .fc-daygrid-day {
      min-height: 3rem; /* Ajustar si es necesario para móviles */
    }
    .custom-event-container {
      padding: 2px 5px; /* Ajustar para móviles */
      font-size: 0.6rem; /* Ajustar para móviles */
    }
  }

  /* --- INICIO: ESTILOS PARA EL FORMULARIO POR PASOS --- */
  .step-wizard-list {
    display: flex;
    justify-content: space-around;
    padding: 0;
    margin: 0 0 20px 0;
    list-style-type: none;
    position: relative;
  }
  
  .step-wizard-item {
    flex: 1;
    text-align: center;
    position: relative;
  }

  .step-wizard-item:not(:first-child)::before {
    content: '';
    position: absolute;
    top: 50%;
    left: -50%;
    height: 2px;
    width: 100%;
    background-color: #ced4da;
    transform: translateY(-50%);
    z-index: 1;
  }

  .step-wizard-item.completed:not(:first-child)::before,
  .step-wizard-item.current:not(:first-child)::before {
    background-color: #9e3535;
  }
  
  .progress-count {
    height: 40px;
    width: 40px;
    border-radius: 50%;
    background-color: #f8f9fa;
    border: 2px solid #ced4da;
    color: #ced4da;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    margin: 0 auto 5px;
    position: relative;
    z-index: 2;
  }
  
  .step-wizard-item.completed .progress-count {
    background-color: #9e3535;
    border-color: #9e3535;
    color: white;
  }
  
  .step-wizard-item.current .progress-count {
    border-color: #9e3535;
    color: #9e3535;
  }

  .progress-label {
    font-size: 0.8rem;
    font-weight: 500;
    color: #ced4da;
  }
  
  .step-wizard-item.completed .progress-label,
  .step-wizard-item.current .progress-label {
    color: #495057;
  }
  /* --- FIN: ESTILOS PARA EL FORMULARIO POR PASOS --- */

`

// --- COMPONENTE PRINCIPAL ---
const Calendario = () => {
  // --- Estados del Componente ---
  const [data, setData] = useState([])
  const [availableServices, setAvailableServices] = useState([])
  const [selectedReserva, setSelectedReserva] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [listModalOpen, setListModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [searchText, setSearchText] = useState("")
  const [clientSearchText, setClientSearchText] = useState("")
  const [clientSearchResults, setClientSearchResults] = useState([])
  const [showClientSearch, setShowClientSearch] = useState(false)
  const [isClientSearchLoading, setIsClientSearchLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6
  const [allClients, setAllClients] = useState([]); 

  // --- Estados para el modal de confirmación ---
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [confirmModalProps, setConfirmModalProps] = useState({
    title: "",
    message: null,
    confirmText: "Confirmar",
    confirmColor: "primary",
    itemDetails: null,
  })
  const [isConfirmActionLoading, setIsConfirmActionLoading] = useState(false)
  const confirmActionRef = useRef(null)

  // --- NUEVO: Estado para el nombre del campo de monto adicional ---
  const [additionalAmountLabel, setAdditionalAmountLabel] = useState("Monto Decoración")
  // --- NUEVO: Estado para controlar la visibilidad del input Monto Decoración ---
  const [showDecorationAmountInput, setShowDecorationAmountInput] = useState(false)
  // --- NUEVO: Estado para controlar la visibilidad del input de servicios adicionales ---
  const [showAdditionalServiceAmountInput, setShowAdditionalServiceAmountInput] = useState(false)
  
  // --- INICIO: ESTADO Y LÓGICA PARA FORMULARIO POR PASOS ---
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 3

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep((prev) => prev + 1)
      }
    } else {
        toast.error("Por favor, corrige los errores antes de continuar.")
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }
  
  const validateStep = (step) => {
    const newErrors = { ...errors }
    let isValid = true;
    
    // Función para limpiar errores de campos no validados en este paso
    const clearOtherErrors = (fieldsToKeep) => {
        Object.keys(newErrors).forEach(key => {
            if (!fieldsToKeep.includes(key)) {
                delete newErrors[key];
            }
        });
    };

    switch (step) {
      case 1: { // Paso 1: Datos del Cliente
        const fields = ['idCustomers', 'fullName'];
        fields.forEach(key => {
            const error = validateField(key, form[key]);
            if (error) {
                newErrors[key] = error;
                isValid = false;
            } else {
                delete newErrors[key];
            }
        });
        if (!form.fullName?.trim()) { // Validacion adicional
            newErrors.idCustomers = "Debes buscar y seleccionar un cliente.";
            isValid = false;
        }
        break;
      }
      case 2: { // Paso 2: Detalles de la Reserva
        const fields = [
            'numberPeople', 'evenType', 'servicios', 'dateTime', 'timeDurationR',
        ];
        if (showDecorationAmountInput) fields.push('decorationAmount');
        if (showAdditionalServiceAmountInput) fields.push('additionalServiceAmount');
        
        fields.forEach(key => {
            const error = validateField(key, form[key]);
            if (error) {
                newErrors[key] = error;
                isValid = false;
            } else {
                delete newErrors[key];
            }
        });
        break;
      }
      default:
        break;
    }
    
    setErrors(newErrors);
    return isValid;
  };

  // --- FIN: ESTADO Y LÓGICA PARA FORMULARIO POR PASOS ---

  // --- NUEVA FUNCIÓN: Convertir formato de tiempo a número ---
  const convertTimeFormatToNumber = (timeStr) => {
    if (!timeStr) return ""

    // Si ya es un número, devolverlo directamente
    if (!isNaN(Number(timeStr))) return timeStr

    try {
      // Intentar extraer los segundos del formato "00:00:02"
      const parts = timeStr.split(":")
      if (parts.length === 3) {
        const hours = Number.parseInt(parts[0], 10) || 0
        const minutes = Number.parseInt(parts[1], 10) || 0
        const seconds = Number.parseInt(parts[2], 10) || 0
        return seconds.toString()
      }
      return timeStr
    } catch (error) {
      console.error("Error al convertir formato de tiempo:", error)
      return timeStr
    }
  }

  // --- NUEVA FUNCIÓN: Calcular monto de decoración según número de personas ---
  const calculateDecorationAmount = (numPeople) => {
    if (!numPeople || isNaN(Number(numPeople))) return ""

    const people = Number(numPeople)

    if (people >= 2 && people <= 15) {
      return "70000" 
    } else if (people >= 16 && people <= 40) {
      return "90000" 
    } else if (people > 40) {
      return "90000" 
    } else {
      return "" 
    }
  }

  // --- NUEVA FUNCIÓN: Verificar si un servicio es de decoración ---
  const isDecorationService = (serviceName) => {
    return serviceName && serviceName.toLowerCase().includes("decoracion")
  }

  // --- Opciones formateadas para react-select ---
  const serviceOptions = availableServices.map((service) => ({
    value: service.id,
    label: service.Nombre || service.name || service.Name || `Servicio ${service.id}`,
    price: service.price || service.Price || service.precio || 0, 
  }))

  // --- Funciones para el modal de confirmación ---
  const toggleConfirmModal = useCallback(() => {
    if (isConfirmActionLoading) return 
    setConfirmModalOpen((prev) => !prev)
  }, [isConfirmActionLoading])

  // Efecto para resetear el estado del modal de confirmación cuando se cierra
  useEffect(() => {
    if (!confirmModalOpen && !isConfirmActionLoading) {
      setConfirmModalProps({
        title: "",
        message: null,
        confirmText: "Confirmar",
        confirmColor: "primary",
        itemDetails: null,
      })
      confirmActionRef.current = null
    }
  }, [confirmModalOpen, isConfirmActionLoading])

  // Función para preparar la confirmación
  const prepareConfirmation = useCallback(
    (actionFn, props) => {
      const detailsToPass = props.itemDetails
      confirmActionRef.current = () => {
        if (actionFn) {
          actionFn(detailsToPass)
        } else {
          console.error("[CONFIRM ACTION] actionFn is null or undefined in ref execution.")
          toast.error("Error interno al intentar ejecutar la acción confirmada.")
          toggleConfirmModal()
        }
      }
      setConfirmModalProps(props)
      setConfirmModalOpen(true)
    },
    [toggleConfirmModal],
  )

// USA ESTA VERSIÓN PARA DEPURAR LOS SERVICIOS
// REEMPLAZA TU FUNCIÓN ENTERA CON ESTA VERSIÓN FINAL
const loadInitialData = useCallback(async () => {
    setLoading(true);
    console.log("--- INICIANDO CARGA INICIAL ---");
    try {
        const [fetchedReservations, fetchedServices, fetchedClients] = await Promise.all([
            reservasService.getAllReservations(),
            serviciosService.getAllServicios(),
            clientesService.getAllClientes(),
        ]);

        console.log("--- DATOS RECIBIDOS DE APIS ---");
        console.log("SERVICIOS CRUDOS RECIBIDOS:", fetchedServices);
        
        // --- PROCESAMIENTO DE SERVICIOS (LÓGICA IGUAL A CLIENTES) ---
        if (Array.isArray(fetchedServices)) {
            // ELIMINAMOS EL FILTRO DE STATUS. Asumimos que la API ya devuelve solo los activos.
            console.log(`PROCESANDO ${fetchedServices.length} servicios recibidos (sin filtro de estado).`);

            const normalizedServices = fetchedServices.map(service => ({
                id: service.idAditionalServices || service.id,
                // 'label' y 'value' son los campos que react-select necesita
                label: service.name || `Servicio #${service.idAditionalServices || service.id}`,
                value: service.idAditionalServices || service.id,
                price: service.price || 0,
                ...service // Incluimos el resto de las propiedades del servicio
            }));
            
            console.log("SERVICIOS NORMALIZADOS (para el selector):", normalizedServices);
            setAvailableServices(normalizedServices);
        } else {
            console.error("ERROR: La respuesta de servicios NO es un array.");
            setAvailableServices([]);
        }

        // --- PROCESAMIENTO DE CLIENTES Y RESERVAS ---
        setAllClients(fetchedClients || []);
        setData(fetchedReservations || []);

    } catch (error) {
        console.error("ERROR CATASTRÓFICO en loadInitialData:", error);
        toast.error("Fallo al cargar datos iniciales.");
    } finally {
        setLoading(false);
        console.log("--- CARGA INICIAL FINALIZADA ---");
    }
}, []);

  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  // --- Mapeo de eventos para FullCalendar (MODIFICADO para usar eventContent) ---
  const events = data.map((reserva) => ({
    id: reserva.idReservations?.toString() || reserva.id?.toString(),
    title: reserva.fullName || reserva.evento || `Reserva ${reserva.idReservations || reserva.id}`,
    start: reserva.dateTime,
    extendedProps: {
      // Pasamos datos extra al evento
      status: reserva.status || "default",
      evenType: reserva.evenType || "",
      numberPeople: reserva.numberPeople || "",
    },
  }))

  
  const checkDuplicateReservation = useCallback(
    (clientId, dateTime, reservationId = null) => {
      if (!clientId || !dateTime) return false

      const reservationDate = new Date(dateTime)
      const reservationDateString = reservationDate.toISOString().split("T")[0] 

      return data.some((reserva) => {
        if (reservationId && (reserva.idReservations === reservationId || reserva.id === reservationId)) {
          return false
        }

        const sameClient = reserva.idCustomers === clientId
        if (!sameClient) return false

       
        const reservaDate = new Date(reserva.dateTime)
        const reservaDateString = reservaDate.toISOString().split("T")[0]

        return reservaDateString === reservationDateString
      })
    },
    [data],
  )

 
  const checkTimeConflict = useCallback(
    (dateTime, reservationId = null) => {
      if (!dateTime) return false

      const reservationDateTime = new Date(dateTime)

     
      return data.some((reserva) => {
        if (reservationId && (reserva.idReservations === reservationId || reserva.id === reservationId)) {
          return false
        }

      
        const reservaDateTime = new Date(reserva.dateTime)

       
        const sameYear = reservationDateTime.getFullYear() === reservaDateTime.getFullYear()
        const sameMonth = reservationDateTime.getMonth() === reservaDateTime.getMonth()
        const sameDay = reservationDateTime.getDate() === reservaDateTime.getDate()
        const sameHour = reservationDateTime.getHours() === reservaDateTime.getHours()
        const sameMinute = reservationDateTime.getMinutes() === reservaDateTime.getMinutes()

        
        console.log("Comparando fechas:", {
          nueva: reservationDateTime.toLocaleString(),
          existente: reservaDateTime.toLocaleString(),
          sameYear,
          sameMonth,
          sameDay,
          sameHour,
          sameMinute,
          resultado: sameYear && sameMonth && sameDay && sameHour && sameMinute,
        })

        return sameYear && sameMonth && sameDay && sameHour && sameMinute
      })
    },
    [data],
  )

  
  const calculateServicePrice = (numPeople, selectedServices) => {
    if (!numPeople || !selectedServices || selectedServices.length === 0) return 0

   
    const people = Number.parseInt(numPeople, 10)
    if (isNaN(people) || people <= 0) return 0

    
    let totalPrice = 0
    selectedServices.forEach((service) => {
      if (service && service.price) {
        totalPrice += Number.parseFloat(service.price) * people
      }
    })

    return totalPrice
  }

 
  const handleDateClick = (arg) => {
    console.log("[handleDateClick] Iniciando. Argumento:", arg)
    setCurrentStep(1); 

    setSelectedReserva(null)
    setAdditionalAmountLabel("Monto Decoración")
    setShowDecorationAmountInput(false)
    setShowAdditionalServiceAmountInput(false) 

    
    setForm({
      ...emptyForm,
      dateTime: "", 
      pass: [{ fecha: new Date().toISOString().split("T")[0], cantidad: "50000" }],
    })

    setErrors({})
    setClientSearchText("")
    setClientSearchResults([])
    setShowClientSearch(false)
    console.log("[handleDateClick] Abriendo modal con fecha y hora vacías...")
    setModalOpen(true)
  }

  const handleEventClick = (info) => {
    const idReservations = Number.parseInt(info.event.id, 10)
    if (isNaN(idReservations)) {
      console.error("ID de reserva inválido:", info.event.id)
      toast.error("ID de reserva inválido.")
      return
    }
    setCurrentStep(1); 
    setLoading(true)
    reservasService
      .getReservationById(idReservations)
      .then((detailedReservation) => {
        if (detailedReservation && !detailedReservation.error) {
           // --- NUEVA LÓGICA AQUÍ ---
                // Buscamos el cliente en nuestra lista completa (activos e inactivos)
                const clienteAsociado = allClients.find(
                  c => c.idCustomers === detailedReservation.idCustomers
                );
                
                // Usamos el nombre del cliente encontrado, o el que viene en la reserva, o un valor por defecto.
               const nombreClienteParaMostrar = clienteAsociado 
    ? (clienteAsociado.FullName || clienteAsociado.fullName || clienteAsociado.nombre || 'Cliente no encontrado')
    : (detailedReservation.fullName || 'Cliente no disponible');
                // --- FIN DE LA NUEVA LÓGICA ---
          setSelectedReserva(detailedReservation)
          const selectedServiceValues = (
            Array.isArray(detailedReservation.AditionalServices) ? detailedReservation.AditionalServices : []
          ).map((service) => ({
            value: service.idAditionalServices,
            label: service.name || `Servicio ${service.idAditionalServices}`,
            price: service.price || service.Price || service.precio || 0,
          }))

          // --- LÓGICA  PARA MONTO DECORACIÓN Y SERVICIOS ADICIONALES ---
          const tieneDecoracion = selectedServiceValues.some((s) => isDecorationService(s.label))
          const tieneOtrosServicios = selectedServiceValues.some((s) => !isDecorationService(s.label))
          const esCumpleanos =
            detailedReservation.evenType && detailedReservation.evenType.toLowerCase().includes("cumpleaños")

          let currentDecorationAmount = detailedReservation.decorationAmount || "0"
          let currentAdditionalServiceAmount = detailedReservation.additionalServiceAmount || "0"

          if (tieneDecoracion) {
            setAdditionalAmountLabel("Monto Decoración")
            if (esCumpleanos) {
              setShowDecorationAmountInput(false)
              currentDecorationAmount = "0"
            } else {
              setShowDecorationAmountInput(true)
            
              if (!currentDecorationAmount && detailedReservation.numberPeople) {
                currentDecorationAmount = calculateDecorationAmount(detailedReservation.numberPeople)
              }
            }
          } else {
            setShowDecorationAmountInput(false)
            currentDecorationAmount = "0"
          }

         
          if (tieneOtrosServicios) {
            setShowAdditionalServiceAmountInput(true)
          } else {
            setShowAdditionalServiceAmountInput(false)
            currentAdditionalServiceAmount = "0"
          }

          let formattedPass = []
          if (Array.isArray(detailedReservation.pass)) {
            formattedPass = detailedReservation.pass.map((abono) => ({
              fecha: abono.fecha ? abono.fecha.split("T")[0] : "", 
              cantidad: abono.cantidad || 0,
            }))
          }
          const idCliente =
            detailedReservation.idCustomers ||
            (detailedReservation.Customer ? detailedReservation.Customer.idCustomers : null)

          // Asegurarse de que la duración se establece correctamente
          const duration = detailedReservation.timeDurationR || detailedReservation.duration || ""
          console.log("Duración cargada del evento:", duration, "tipo:", typeof duration)

          // Convertir el formato de tiempo a número
          const durationAsNumber = convertTimeFormatToNumber(duration)

          // Asegurarse de que el estado se establece correctamente
          let statusToUse = detailedReservation.status
          console.log("Estado recibido:", statusToUse, "tipo:", typeof statusToUse)

          // Si el estado es booleano, convertirlo a string
          if (typeof statusToUse === "boolean") {
            statusToUse = statusToUse === true ? "confirmada" : "pendiente"
          }
          // Si el estado es string pero no es uno de los valores válidos, establecer un valor por defecto
          else if (
            typeof statusToUse === "string" &&
            !["pendiente", "confirmada", "en_proceso", "terminada", "anulada"].includes(statusToUse)
          ) {
            statusToUse = "pendiente"
          }

          console.log("Estado a usar:", statusToUse)
          // --- AQUÍ ES DONDE AJUSTAMOS EL dateTime ---
          let dateTimeForInput = ""
          if (detailedReservation.dateTime) {
            // <--- ESTE ES EL IF QUE DEBES ASEGURARTE DE TENER
            const dateObj = new Date(detailedReservation.dateTime) // Interpreta la cadena UTC

            // Formatear para el input datetime-local (YYYY-MM-DDTHH:MM en hora local del navegador)
            const year = dateObj.getFullYear()
            const month = (dateObj.getMonth() + 1).toString().padStart(2, "0")
            const day = dateObj.getDate().toString().padStart(2, "0")
            const hours = dateObj.getHours().toString().padStart(2, "0")
            const minutes = dateObj.getMinutes().toString().padStart(2, "0")

            dateTimeForInput = `${year}-${month}-${day}T${hours}:${minutes}`
            console.log("[handleEventClick] Fecha UTC original:", detailedReservation.dateTime)
            console.log("[handleEventClick] Fecha formateada para input (local):", dateTimeForInput)
          } else {
            console.warn("[handleEventClick] detailedReservation.dateTime está vacío o no definido.")
          }
          // Modificar el objeto form para incluir el estado correcto
          setForm({
            ...emptyForm,
            ...detailedReservation,
            id: detailedReservation.idReservations,
            idCustomers: idCliente,
            fullName: nombreClienteParaMostrar, // Usamos el nombre que encontramos,
            distintive:
              detailedReservation.distintive ||
              (detailedReservation.Customer ? detailedReservation.Customer.distintive : ""),
            customerCategory:
              detailedReservation.customerCategory ||
              (detailedReservation.Customer ? detailedReservation.customerCategory : ""),
            email:
              detailedReservation.email || (detailedReservation.Customer ? detailedReservation.Customer.email : ""),
            cellphone:
              detailedReservation.cellphone ||
              (detailedReservation.Customer ? detailedReservation.Customer.cellphone : ""),
            address:
              detailedReservation.address || (detailedReservation.Customer ? detailedReservation.Customer.address : ""),
            dateTime: dateTimeForInput,
            servicios: selectedServiceValues,
            pass:
              formattedPass.length > 0
                ? formattedPass
                : [{ fecha: new Date().toISOString().split("T")[0], cantidad: "50000" }], // Asegurar al menos un abono con fecha y monto mínimo
            timeDurationR: durationAsNumber, // Usar el valor convertido
            status: statusToUse,
            decorationAmount: currentDecorationAmount, // Asegurarse de que se usa el monto de decoración actualizado
            additionalServiceAmount: currentAdditionalServiceAmount, // NUEVO: Campo para servicios adicionales
          })
          console.log(
            "Duración cargada:",
            durationAsNumber,
            detailedReservation.timeDurationR,
            "tipo:",
            typeof detailedReservation.timeDurationR,
          )
          updateRestante(detailedReservation.totalPay, formattedPass)
          setErrors({})
          setClientSearchText("")
          setClientSearchResults([])
          setShowClientSearch(false)
          setModalOpen(true)
        } else {
          console.error(
            "Reserva no encontrada o error al cargar. ID:",
            idReservations,
            "Respuesta:",
            detailedReservation,
          )
          toast.error(detailedReservation?.errorMessage || "No se pudo encontrar la reserva seleccionada.")
        }
      })
      .catch((error) => {
        console.error("Error fetching reservation details:", error)
        toast.error(`No se pudo cargar los detalles de la reserva: ${error.message}`)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  const handleEventDrop = async (info) => {
    const { event } = info
    const idReservations = Number.parseInt(event.id, 10)
    const reservaOriginal = data.find((res) => res.idReservations === idReservations)

    if (!reservaOriginal) {
      console.error("Error: No se encontró reserva original para reprogramar. ID:", idReservations)
      toast.error("No se pudo encontrar la reserva.")
      info.revert()
      return
    }
    const newStartDate = new Date(event.start)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (newStartDate < today) {
      toast.error("No se pueden reprogramar a fechas pasadas.")
      info.revert()
      return
    }

    // Verificar si hay conflicto de hora
    if (checkTimeConflict(event.start.toISOString(), idReservations)) {
      toast.error("Ya existe una reserva en esta hora. Por favor, seleccione otra hora.")
      info.revert()
      return
    }

    // Verificar si el cliente ya tiene una reserva en esta fecha
    if (checkDuplicateReservation(reservaOriginal.idCustomers, event.start.toISOString(), idReservations)) {
      toast.error(
        "Este cliente ya tiene una reserva en esta fecha. No se permiten múltiples reservas para el mismo cliente en un día.",
      )
      info.revert()
      return
    }

    const fullReservaData = await reservasService.getReservationById(idReservations)
    if (!fullReservaData || fullReservaData.error) {
      toast.error("No se pudieron obtener los detalles completos para reprogramar.")
      info.revert()
      return
    }
    const updatedReservaData = {
      ...fullReservaData,
      id: idReservations,
      idReservations: idReservations,
      dateTime: event.start.toISOString().slice(0, 16),
      idAditionalServices: (fullReservaData.AditionalServices || []).map((s) => s.idAditionalServices),
      pass: (fullReservaData.pass || []).map((p) => ({
        fecha: p.fecha ? p.fecha.split("T")[0] : "",
        cantidad: p.cantidad,
      })), // Asegurar formato fecha
    }
    delete updatedReservaData.AditionalServices
    delete updatedReservaData.Customer
    delete updatedReservaData.error
    delete updatedReservaData.errorMessage
    try {
      setLoading(true)
      updatedReservaData.idCustomers = Number(updatedReservaData.idCustomers)
      if (isNaN(updatedReservaData.idCustomers)) throw new Error("ID de cliente inválido para reprogramar.")

      // Convertir campos numéricos
      updatedReservaData.numberPeople = Number.parseInt(updatedReservaData.numberPeople || 0)
      updatedReservaData.decorationAmount = Number.parseFloat(updatedReservaData.decorationAmount || 0)
      updatedReservaData.totalPay = Number.parseFloat(updatedReservaData.totalPay || 0)
      updatedReservaData.remaining = Number.parseFloat(updatedReservaData.remaining || 0)

      await reservasService.updateReservation(idReservations, updatedReservaData)
      setData((prevData) =>
        prevData.map((res) =>
          res.idReservations === idReservations ? { ...res, dateTime: updatedReservaData.dateTime } : res,
        ),
      )
      toast.success("La fecha de la reserva se actualizó.")
    } catch (error) {
      console.error("Error updating reservation on drop:", error)
      const errorMessage = error.response?.data?.message || error.message || "No se pudo reprogramar la reserva."
      toast.error(errorMessage)
      info.revert()
    } finally {
      setLoading(false)
    }
  }

  const handleSearchChange = (e) => {
    setSearchText(e.target.value)
  }

// REEMPLAZA TODA TU FUNCIÓN con esta versión para depurar
const handleClientSearch = async (searchValue) => {
    setClientSearchText(searchValue);
    if (searchValue.length < 2) {
        setClientSearchResults([]);
        setShowClientSearch(true);
        return;
    }
    setIsClientSearchLoading(true);
    setShowClientSearch(true);
    try {
        // 1. Llamamos a la API
        const results = await clientesService.searchClientes(searchValue);
        console.log("API devolvió:", results); // Log para ver qué llega

        if (Array.isArray(results)) {
            // 2. Transformamos los datos SIN FILTRAR NADA
            const normalizedResults = results.map((cliente) => {
                // Verificamos explícitamente cada campo
                const id = cliente.idCustomers || cliente.id;
                const nombre = cliente.FullName || cliente.NombreCompleto || cliente.name || cliente.nombre;

                console.log(`Mapeando cliente ID: ${id}, Nombre: ${nombre}`); // Log para cada cliente

                return {
                    id: id,
                    idCustomers: Number(id),
                    FullName: nombre || `Cliente ${id}`, // Aseguramos que siempre haya un nombre
                    // Dejamos los otros campos por ahora para simplificar
                    Distintive: cliente.Distintive || "Regular",
                    CustomerCategory: cliente.CustomerCategory || "",
                    Email: cliente.Email || cliente.email || "",
                    Cellphone: cliente.Cellphone || cliente.cellphone || "",
                    Address: cliente.Address || cliente.address || "",
                };
            });
            
            console.log("Resultados normalizados:", normalizedResults); // Log del resultado final
            setClientSearchResults(normalizedResults);

        } else {
            console.log("API no devolvió un array. Vaciando resultados.");
            setClientSearchResults([]);
        }
    } catch (error) {
        console.error("Error catastrófico en handleClientSearch:", error);
        setClientSearchResults([]);
    } finally {
        setIsClientSearchLoading(false);
    }
};


  const selectClient = (cliente) => {
    if (!cliente || (!cliente.idCustomers && cliente.idCustomers !== 0)) {
      setErrors((prev) => ({ ...prev, idCustomers: "Cliente seleccionado inválido" }))
      return
    }
    const idCustomersNum = Number(cliente.idCustomers)
    if (isNaN(idCustomersNum)) {
      setErrors((prev) => ({ ...prev, idCustomers: "ID de cliente inválido" }))
      return
    }

    // Verificar si el cliente ya tiene una reserva en la fecha seleccionada
    if (form.dateTime && checkDuplicateReservation(idCustomersNum, form.dateTime, selectedReserva?.idReservations)) {
      toast.error(
        "Este cliente ya tiene una reserva en esta fecha. No se permiten múltiples reservas para el mismo cliente en un día.",
      )
      setErrors((prev) => ({ ...prev, idCustomers: "Cliente ya tiene reserva en esta fecha" }))
      return
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
    }))
    setClientSearchText("")
    setClientSearchResults([])
    setShowClientSearch(false)
    if (errors.idCustomers) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors.idCustomers
        return newErrors
      })
    }
  }

  const handleAbonoChange = (index, field, value) => {
    // Validar monto mínimo para abonos
    if (field === "cantidad") {
      const numValue = Number.parseFloat(value)
      if (!isNaN(numValue) && numValue < 50000) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          [`pass-${index}-${field}`]: "El monto mínimo debe ser de $50.000",
        }))
      }
    }

    const updatedAbonos = form.pass.map((abono, i) => (i === index ? { ...abono, [field]: value } : abono))
    setForm((prevForm) => ({ ...prevForm, pass: updatedAbonos }))
    if (field === "cantidad") {
      updateRestante(form.totalPay, updatedAbonos)
    }
    setErrors((prevErrors) => ({ ...prevErrors, [`pass-${index}-${field}`]: validateAbonoField(field, value,form) }))
  }

  const addAbono = () => {
    // Añadir abono con fecha actual por defecto y monto mínimo
    const todayStr = new Date().toISOString().split("T")[0]
    setForm((prevForm) => ({ ...prevForm, pass: [...(prevForm.pass || []), { fecha: todayStr, cantidad: "50000" }] }))

    setErrors((prevErrors) => {
      // Limpiar error general de 'pass'
      const newErrors = { ...prevErrors }
      delete newErrors.pass
      return newErrors
    })
  }

  const removeAbono = (index) => {
    const updatedAbonos = (form.pass || []).filter((_, i) => i !== index)
    setForm((prevForm) => ({ ...prevForm, pass: updatedAbonos }))
    updateRestante(form.totalPay, updatedAbonos)
    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors }
      delete newErrors[`pass-${index}-fecha`]
      delete newErrors[`pass-${index}-cantidad`]
      return newErrors
    })
  }

  const updateRestante = useCallback((totalPay, pass) => {
    const totalAbonosNum = (pass || []).reduce((sum, abono) => sum + Number.parseFloat(abono.cantidad || 0), 0)
    const totalPagoNum = Number.parseFloat(totalPay || 0)
    const restanteNum = totalPagoNum - totalAbonosNum
    const restanteFormatted = isNaN(restanteNum) ? "" : restanteNum.toFixed(0)
    setForm((prevForm) => ({ ...prevForm, remaining: restanteFormatted }))
  }, [])

  // --- MODIFICADO: handleMultiServiceChange para manejar servicios adicionales ---
  const handleMultiServiceChange = (selectedOptions) => {
    const currentServices = selectedOptions || []
    const updatedForm = { ...form, servicios: currentServices }

    // --- LÓGICA MODIFICADA PARA MONTO DECORACIÓN Y SERVICIOS ADICIONALES ---
    const tieneDecoracion = currentServices.some((s) => isDecorationService(s.label))
    const tieneOtrosServicios = currentServices.some((s) => !isDecorationService(s.label))
    const esCumpleanos = form.evenType && form.evenType.toLowerCase().includes("cumpleaños")

    // Lógica para decoración
    if (tieneDecoracion) {
      setAdditionalAmountLabel("Monto Decoración")
      if (esCumpleanos) {
        setShowDecorationAmountInput(false)
        updatedForm.decorationAmount = "0"
      } else {
        setShowDecorationAmountInput(true)
        const numPeople = updatedForm.numberPeople || form.numberPeople
        updatedForm.decorationAmount = numPeople
          ? calculateDecorationAmount(numPeople)
          : updatedForm.decorationAmount || ""
      }
    } else {
      setShowDecorationAmountInput(false)
      updatedForm.decorationAmount = "0"
    }

    // NUEVO: Lógica para servicios adicionales no decoración
    if (tieneOtrosServicios) {
      setShowAdditionalServiceAmountInput(true)
      // Si no hay monto previo, inicializar vacío para que el usuario lo complete
      if (!updatedForm.additionalServiceAmount) {
        updatedForm.additionalServiceAmount = ""
      }
    } else {
      setShowAdditionalServiceAmountInput(false)
      updatedForm.additionalServiceAmount = "0"
    }
    

    // Calcular y actualizar el monto total si hay número de personas
    if (updatedForm.numberPeople) {
      const calculatedPrice = calculateServicePrice(updatedForm.numberPeople, currentServices)
      if (calculatedPrice >= 0) {
        updatedForm.totalPay = calculatedPrice.toString()
      }
    }

    setForm(updatedForm)
    setErrors((prevErrors) => ({ ...prevErrors, servicios: validateField("servicios", currentServices) }))
    updateRestante(updatedForm.totalPay, updatedForm.pass) 
  }

  const validateAbonoField = useCallback((fieldName, value,form) => {
     if (fieldName === "fecha") {
    if (!value) return "Fecha requerida.";

   
    const abonoDate = new Date(value);
    abonoDate.setUTCHours(0, 0, 0, 0); 
    
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // 2. VALIDACIÓN: No puede ser una fecha futura
    if (abonoDate > today) {
      return "La fecha del abono no puede ser futura.";
    }

    // 3. VALIDACIÓN: No puede ser posterior a la fecha de la reserva
    if (form && form.dateTime) {
      const reservationDate = new Date(form.dateTime);
      reservationDate.setUTCHours(0, 0, 0, 0);

      if (abonoDate > reservationDate) {
        return "El abono debe ser antes o el mismo día de la reserva.";
      }
    }
    return "";
  }
    
    if (fieldName === "cantidad") {
      if (value === "" || value === null) return "Cantidad requerida."
      const numValue = Number.parseFloat(value)
      if (isNaN(numValue) || numValue <= 0) return "Cantidad debe ser > 0."
      if (numValue < 50000) return "El monto mínimo debe ser de $50.000."
      if (numValue < 50000) return "El monto mínimo del abono debe ser de $50.000."
    }
    return ""
  }, [])

   const validateField = useCallback(
    (name, value) => {
      if (name === "idCustomers") {
        if (value === null || value === undefined || value === "" || value <= 0 || isNaN(Number(value))) {
          return "Debe buscar y seleccionar un cliente válido."
        }
        return ""
      }
      switch (name) {
        case "fullName":
          return value?.trim() ? "" : "Nombre de cliente requerido (seleccione un cliente)."

        
        
case "dateTime": {
    if (!value) return "Fecha y hora requeridas.";

    const selectedDate = new Date(value);
    
    
    const selectedHour = selectedDate.getHours(); 

    
    if (selectedHour < 12 || selectedHour > 21) {
        return "El horario para reservas es únicamente de 12:00 PM a 9:00 PM.";
    }
    

    const now = new Date();
    now.setSeconds(0, 0);

    if (selectedDate < now) {
        if (!selectedReserva) {
            return "La fecha y hora no pueden ser en el pasado.";
        }
        const originalDate = new Date(selectedReserva.dateTime);
        if (selectedDate.getTime() !== originalDate.getTime()) {
            return "No se puede cambiar la fecha a una fecha pasada.";
        }
    }

    if (checkTimeConflict(value, selectedReserva?.idReservations)) {
        return "Ya existe una reserva en esta hora. Por favor, seleccione otra hora.";
    }

    if (form.idCustomers && checkDuplicateReservation(form.idCustomers, value, selectedReserva?.idReservations)) {
        return "Este cliente ya tiene una reserva en esta fecha.";
    }

    return ""; 
}
        

        case "timeDurationR":
          return value ? "" : "Duración requerida."
        case "evenType":
          return value ? "" : "Tipo de Evento requerido."
        case "numberPeople":
          const numPeople = Number.parseInt(value)
          return !isNaN(numPeople) && numPeople > 0 ? "" : "Nro. Personas debe ser > 0."
        case "decorationAmount":
        
          if (showDecorationAmountInput) {
            const decorAmount = Number.parseFloat(value)
            return !isNaN(decorAmount) && decorAmount >= 0 ? "" : `${additionalAmountLabel} debe ser >= 0.`
          }
          return "" 
        case "additionalServiceAmount": 
          if (showAdditionalServiceAmountInput) {
            const additionalAmount = Number.parseFloat(value)
            return !isNaN(additionalAmount) && additionalAmount >= 0 ? "" : "Monto Servicio Adicional debe ser >= 0."
          }
          return ""
        case "totalPay":
          const totalP = Number.parseFloat(value)
          return !isNaN(totalP) && totalP >= 0 ? "" : "Total a Pagar debe ser >= 0." 
        case "cellphone":
          return !value || /^\d{7,15}$/.test(value) ? "" : "Celular inválido (7-15 dígitos)."
        case "email":
          return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "" : "Correo inválido."
        default:
          return ""
      }
    },
    [
      checkDuplicateReservation,
      checkTimeConflict,
      additionalAmountLabel,
      form.idCustomers,
      selectedReserva, 
      showDecorationAmountInput,
      showAdditionalServiceAmountInput,
    ],
  )

  const validateForm = useCallback(() => {
    const newErrors = {}
    let isValid = true
    const fieldsToValidate = [
      "idCustomers",
      "dateTime",
      "timeDurationR",
      "evenType",
      "numberPeople",
      "totalPay",
      "servicios",
    ]
    
    if (showDecorationAmountInput) {
      fieldsToValidate.push("decorationAmount")
    }
    
    if (showAdditionalServiceAmountInput) {
      fieldsToValidate.push("additionalServiceAmount")
    }

    fieldsToValidate.forEach((key) => {
      const error = validateField(key, form[key])
      if (error) {
        newErrors[key] = error
        isValid = false
      }
    })
    if (!form.fullName?.trim()) {
      newErrors.idCustomers = newErrors.idCustomers || "Seleccione un cliente válido."
      isValid = false
    }
    if (!form.pass || form.pass.length === 0) {
      newErrors.pass = "Debe agregar al menos un abono."
      isValid = false
    } else {
      form.pass.forEach((abono, i) => {
         const fe = validateAbonoField("fecha", abono.fecha, form);
         const ce = validateAbonoField("cantidad", abono.cantidad, form);
        if (fe) {
          newErrors[`pass-${i}-fecha`] = fe
          isValid = false
        }
        if (ce) {
          newErrors[`pass-${i}-cantidad`] = ce
          isValid = false
        }
      })
    }
    const totalPagoNum = Number.parseFloat(form.totalPay || 0)
    const totalAbonosNum = (form.pass || []).reduce((sum, abono) => sum + Number.parseFloat(abono.cantidad || 0), 0)
    if (!isNaN(totalPagoNum) && !isNaN(totalAbonosNum) && totalPagoNum < totalAbonosNum) {
      newErrors.remaining = "El total de abonos no puede superar el Total a Pagar."
      isValid = false
    }
    setErrors(newErrors)
    return isValid
  }, [form, validateAbonoField, validateField, showDecorationAmountInput, showAdditionalServiceAmountInput])

  const handleChange = (e) => {
    const { name, value } = e.target
    console.log(`Cambiando ${name} a: ${value}`) 

    const updatedForm = { ...form, [name]: value }

    
    if (name === "dateTime") {
      
      const hasTimeConflict = checkTimeConflict(value, selectedReserva?.idReservations)
      if (hasTimeConflict) {
        console.log("Conflicto de hora detectado:", value)
        setErrors((prevErrors) => ({
          ...prevErrors,
          [name]: "Ya existe una reserva en esta hora. Por favor, seleccione otra hora.",
        }))
      } else {
        
        setErrors((prevErrors) => {
          const newErrors = { ...prevErrors }
          delete newErrors[name]
          return newErrors
        })
      }

     
      if (form.idCustomers && checkDuplicateReservation(form.idCustomers, value, selectedReserva?.idReservations)) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          [name]:
            "Este cliente ya tiene una reserva en esta fecha. No se permiten múltiples reservas para el mismo cliente en un día.",
        }))
      }
    }

    
    if (name === "numberPeople" || name === "evenType") {
      const numPeople = name === "numberPeople" ? value : updatedForm.numberPeople
      const currentEvenType = name === "evenType" ? value : updatedForm.evenType
      const currentServices = updatedForm.servicios

      if (numPeople && currentServices && currentServices.length > 0) {
        const calculatedPrice = calculateServicePrice(numPeople, currentServices)
        if (calculatedPrice >= 0) {
          updatedForm.totalPay = calculatedPrice.toString()
        }
      }

      const tieneDecoracion = currentServices.some((s) => isDecorationService(s.label))
      const tieneOtrosServicios = currentServices.some((s) => !isDecorationService(s.label))
      const esCumpleanos = currentEvenType && currentEvenType.toLowerCase().includes("cumpleaños")

      
      if (tieneDecoracion) {
        setAdditionalAmountLabel("Monto Decoración")
        if (esCumpleanos) {
          setShowDecorationAmountInput(false)
          updatedForm.decorationAmount = "0"
        } else {
          setShowDecorationAmountInput(true)
          updatedForm.decorationAmount = numPeople
            ? calculateDecorationAmount(numPeople)
            : updatedForm.decorationAmount || ""
        }
      } else {
        setShowDecorationAmountInput(false)
        updatedForm.decorationAmount = "0"
      }

      
      if (tieneOtrosServicios) {
        setShowAdditionalServiceAmountInput(true)
      } else {
        setShowAdditionalServiceAmountInput(false)
        updatedForm.additionalServiceAmount = "0"
      }
    }

    setForm(updatedForm)

    if (name === "totalPay" || name === "numberPeople" || name === "evenType") {
      updateRestante(updatedForm.totalPay, updatedForm.pass)
    }

    if (name !== "idCustomers") {
      const error = validateField(name, updatedForm[name])
      setErrors((prevErrors) => ({ ...prevErrors, [name]: error }))
    } else {
      setErrors((prevErrors) => {
        const newErrors = { ...prevErrors }
        delete newErrors.idCustomers
        return newErrors
      })
    }
  }

  const updateDurationOnly = useCallback(async (id, duration) => {
    try {
      setLoading(true)
      await reservasService.updateDuration(id, duration)
      setData((prevData) =>
        prevData.map((r) => (r.idReservations === id ? { ...r, timeDurationR: Number(duration) } : r)),
      )
      return true
    } catch (error) {
      console.error("Error updating duration:", error)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  
  const updateStatusOnly = useCallback(async (id, status) => {
    try {
      setLoading(true)
      await reservasService.updateStatus(id, status)
      setData((prevData) => prevData.map((r) => (r.idReservations === id ? { ...r, status } : r)))
      return true
    } catch (error) {
      console.error("Error updating status:", error)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  
  const clearDateTimeError = () => {
    setErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors.dateTime
      return newErrors
    })
  }

  const requestSaveConfirmation = useCallback(() => {
   
    const tieneDecoracion = form.servicios.some((s) => isDecorationService(s.label))
    const tieneOtrosServicios = form.servicios.some((s) => !isDecorationService(s.label))
    const esCumpleanos = form.evenType && form.evenType.toLowerCase().includes("cumpleaños")
    let finalDecorationAmount = form.decorationAmount
    let finalAdditionalServiceAmount = form.additionalServiceAmount

    if (tieneDecoracion && esCumpleanos) {
      finalDecorationAmount = "0"
    } else if (tieneDecoracion) {
      
      finalDecorationAmount = form.numberPeople
        ? calculateDecorationAmount(form.numberPeople)
        : form.decorationAmount || "0"
    } else {
      
      finalDecorationAmount = "0"
    }

    
    if (!tieneOtrosServicios) {
      finalAdditionalServiceAmount = "0"
    }

    const formToValidate = {
      ...form,
      decorationAmount: finalDecorationAmount,
      additionalServiceAmount: finalAdditionalServiceAmount,
    }

    
    updateRestante(formToValidate.totalPay, formToValidate.pass)
    const tempFormForValidation = { ...formToValidate, remaining: form.remaining } 

    
    const tempValidateForm = () => {
      const newErrors = {}
      let isValid = true
      const fieldsToValidate = [
        "idCustomers",
        "dateTime",
        "timeDurationR",
        "evenType",
        "numberPeople",
        "totalPay",
        "servicios",
      ]
     
      if (showDecorationAmountInput || (tieneDecoracion && !esCumpleanos)) {
        fieldsToValidate.push("decorationAmount")
      }
     
      if (showAdditionalServiceAmountInput || tieneOtrosServicios) {
        fieldsToValidate.push("additionalServiceAmount")
      }

      fieldsToValidate.forEach((key) => {
        const error = validateField(key, tempFormForValidation[key]) 
        if (error) {
          console.log(`Error en campo ${key}:`, error)
          newErrors[key] = error
          isValid = false
        }
      })
      if (!tempFormForValidation.fullName?.trim()) {
        newErrors.idCustomers = newErrors.idCustomers || "Seleccione un cliente válido."
        isValid = false
      }
      if (!tempFormForValidation.pass || tempFormForValidation.pass.length === 0) {
        newErrors.pass = "Debe agregar al menos un abono."
        isValid = false
      } else {
        tempFormForValidation.pass.forEach((abono, i) => {
          const fe = validateAbonoField("fecha", abono.fecha)
          const ce = validateAbonoField("cantidad", abono.cantidad)
          if (fe) {
            newErrors[`pass-${i}-fecha`] = fe
            isValid = false
          }
          if (ce) {
            newErrors[`pass-${i}-cantidad`] = ce
            isValid = false
          }
        })
      }
      const totalPagoNum = Number.parseFloat(tempFormForValidation.totalPay || 0)
      const totalAbonosNum = (tempFormForValidation.pass || []).reduce(
        (sum, abono) => sum + Number.parseFloat(abono.cantidad || 0),
        0,
      )
      if (!isNaN(totalPagoNum) && !isNaN(totalAbonosNum) && totalPagoNum < totalAbonosNum) {
        newErrors.remaining = "El total de abonos no puede superar el Total a Pagar."
        isValid = false
      }
      setErrors(newErrors)
      return isValid
    }

    if (!tempValidateForm()) {
      toast.error("Por favor, complete los campos indicados antes de continuar.")
      return
    }

   
    const isEditing = selectedReserva !== null
    prepareConfirmation(() => executeSaveReserva({ isEditing, formData: tempFormForValidation }), {
      
      title: isEditing ? "¿Guardar Cambios?" : "¿Crear Reserva?",
      message: (
        <p>
          ¿Está seguro que desea {isEditing ? "guardar los cambios de" : "crear"} la reserva para{" "}
          <strong>{tempFormForValidation.fullName}</strong>?
        </p>
      ),
      confirmText: (
        <>
          {isEditing ? <Edit size={16} className="me-1" /> : <Plus size={16} className="me-1" />}
          {isEditing ? "Guardar Cambios" : "Crear Reserva"}
        </>
      ),
      confirmColor: "primary",
      itemDetails: { isEditing, formData: tempFormForValidation }, 
    })
  }, [
    form,
    selectedReserva,
    prepareConfirmation,
    updateRestante,
    validateField,
    validateAbonoField,
    showDecorationAmountInput,
    showAdditionalServiceAmountInput,
  ])

  // Función para ejecutar el guardado
  const executeSaveReserva = useCallback(
    async (details) => {
      const isEditing = details?.isEditing || false
      const formDataToSave = details?.formData || form 

      setIsConfirmActionLoading(true)
      const toastId = toast.loading(isEditing ? "Actualizando reserva..." : "Creando reserva...")

      try {
        const idAditionalServices = (formDataToSave.servicios || []).map((option) => option.value)
        const abonosToSend = (formDataToSave.pass || []).map((ab) => ({
          fecha: ab.fecha,
          cantidad: Number.parseFloat(ab.cantidad || 0),
        }))
        const idCustomersNum = Number(formDataToSave.idCustomers)
        if (isNaN(idCustomersNum)) throw new Error("ID de cliente inválido al guardar.")

        if (isEditing) {
          const reservationId = selectedReserva.idReservations || formDataToSave.id
          if (!reservationId) throw new Error("No se pudo identificar la reserva a actualizar.")
        }

        const dataToSend = {
          ...formDataToSave, 
          idCustomers: idCustomersNum,
          idAditionalServices: idAditionalServices,
          pass: abonosToSend,
          numberPeople: Number.parseInt(formDataToSave.numberPeople || 0),
          decorationAmount: Number.parseFloat(formDataToSave.decorationAmount || 0),
          additionalServiceAmount: Number.parseFloat(formDataToSave.additionalServiceAmount || 0), 
          totalPay: Number.parseFloat(formDataToSave.totalPay || 0),
          remaining: Number.parseFloat(formDataToSave.remaining || 0),
          status: formDataToSave.status,
        }
        dataToSend.timeDurationR = Number(formDataToSave.timeDurationR) || 0
        dataToSend.timeDurationR = dataToSend.timeDurationR

        delete dataToSend.servicios
        delete dataToSend.fullName
        delete dataToSend.distintive
        delete dataToSend.customerCategory
        delete dataToSend.email
        delete dataToSend.cellphone
        delete dataToSend.address

        if (isEditing) {
          const reservationId = selectedReserva.idReservations || formDataToSave.id
          if (!reservationId) throw new Error("No se pudo identificar la reserva a actualizar.")
          await reservasService.updateReservation(reservationId, dataToSend)
          setData((prevData) =>
            prevData.map((r) =>
              r.idReservations === reservationId
                ? { ...formDataToSave, idReservations: reservationId, remaining: dataToSend.remaining }
                : r,
            ),
          )
          toast.success("Reserva actualizada correctamente.", {
            id: toastId,
            icon: <CheckCircle className="text-success" />,
          })
        } else {
          const newReservationResponse = await reservasService.createReservation(dataToSend)
          const newReservationForState = {
            ...formDataToSave,
            ...newReservationResponse,
            idReservations: newReservationResponse.idReservations || newReservationResponse.id,
            remaining: dataToSend.remaining,
          }
          setData((prevData) => [...prevData, newReservationForState])
          toast.success("Reserva creada correctamente.", {
            id: toastId,
            icon: <CheckCircle className="text-success" />,
          })
        }
        toggleConfirmModal()
        setModalOpen(false)
      } catch (error) {
        console.error("Error saving reservation:", error)
        const errorMessage = error.response?.data?.message || error.message || "No se pudo guardar la reserva."
        toast.error(`Error: ${errorMessage}`, {
          id: toastId,
          icon: <XCircle className="text-danger" />,
          duration: 5000,
        })
        toggleConfirmModal()
      } finally {
        setIsConfirmActionLoading(false)
      }
    },
    [form, selectedReserva, toggleConfirmModal],
  )

  // Función para solicitar confirmación de eliminación (esta función aún existe, aunque el botón del modal se oculte)
  const requestDeleteConfirmation = useCallback(
    (id) => {
      if (!id) {
        toast.error("No se proporcionó ID para eliminar.")
        return
      }

      const reservaToDelete = data.find((r) => r.idReservations === id || r.id === id)
      if (!reservaToDelete) {
        toast.error("No se encontró la reserva a eliminar.")
        return
      }

      prepareConfirmation(executeDelete, {
        title: "¿ELIMINAR Reserva?",
        message: (
          <>
            <p>
              ¿Está seguro que desea eliminar permanentemente la reserva de{" "}
              <strong>{reservaToDelete.fullName || "cliente seleccionado"}</strong>?
            </p>
            <p>
              <strong className="text-danger">Esta acción no se puede deshacer.</strong>
            </p>
          </>
        ),
        confirmText: "Eliminar Definitivamente",
        confirmColor: "danger",
        itemDetails: { id },
      })
    },
    [data, prepareConfirmation],
  )

  // Función para ejecutar la eliminación (esta función aún existe, aunque el botón del modal se oculte)
  const executeDelete = useCallback(
    async (details) => {
      if (!details || !details.id) {
        toast.error("Error interno: Datos para eliminar no encontrados.")
        toggleConfirmModal()
        return
      }

      const id = details.id
      setIsConfirmActionLoading(true)
      const toastId = toast.loading("Eliminando reserva...")

      try {
        const response = await reservasService.deleteReservation(id)
        if (response && response.success !== false) {
          setData((prevData) => prevData.filter((reserva) => reserva.idReservations !== id))
          toast.success(response.message || "Reserva eliminada correctamente.", {
            id: toastId,
            icon: <CheckCircle className="text-success" />,
          })
          toggleConfirmModal()
          setModalOpen(false)
          setListModalOpen(false)
        } else {
          toast.error(response?.message || "No se pudo eliminar la reserva.", {
            id: toastId,
            icon: <XCircle className="text-danger" />,
            duration: 5000,
          })
          toggleConfirmModal()
        }
      } catch (error) {
        console.error("Error deleting reservation:", error)
        const errorMessage = error.response?.data?.message || error.message || "Error al eliminar."
        toast.error(`Error: ${errorMessage}`, {
          id: toastId,
          icon: <XCircle className="text-danger" />,
          duration: 5000,
        })
        toggleConfirmModal()
      } finally {
        setIsConfirmActionLoading(false)
      }
    },
    [toggleConfirmModal],
  )

  const handleDownloadExcel = () => {
    if (data.length === 0) {
      toast.error("No hay datos de reservas para exportar.")
      return
    }
    const dataToExport = data.map((r) => ({
      ID: r.idReservations || r.id,
      Cliente: r.fullName || "N/A",
      "Fecha y Hora": r.dateTime
        ? new Date(r.dateTime).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })
        : "N/A",
      "Tipo Evento": r.evenType || "N/A",
      Personas: r.numberPeople || "N/A",
      "Total Pago ($)": r.totalPay || 0,
      "Restante ($)": r.remaining || 0,
      Estado: r.status ? r.status.replace("_", " ") : "N/A",
      Observaciones: r.matter || "",
    }))
    const ws = utils.json_to_sheet(dataToExport)
    ws["!cols"] = [
      { wch: 5 },
      { wch: 25 },
      { wch: 18 },
      { wch: 15 },
      { wch: 8 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 30 },
    ]
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, "Reservas")
    writeFile(wb, "Lista_Reservas.xlsx")
    toast.success("Archivo Excel generado correctamente.")
  }

  const formatCurrency = (value) => {
    const n = Number.parseFloat(value)
    return isNaN(n)
      ? "$0"
      : new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n)
  }

  const toggleListModal = () => {
    if (!listModalOpen) {
      setCurrentPage(1)
    }
    setListModalOpen(!listModalOpen)
  }

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber)
  }

  const totalItems = data.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const sortedData = [...data].sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime))
  const currentItems = sortedData.slice(startIndex, endIndex)

  // Estilos modernos para el componente
  const styles = {
    calendarContainer: {
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      backgroundColor: "#fff",
      padding: "0",
      borderRadius: "8px",
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)",
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      width: "100%",
      margin: "0",
      overflow: "hidden",
    },
    calendarHeader: {
      marginBottom: "0.5rem", 
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: "0.75rem",
      padding: "0.5rem 1rem", 
      borderBottom: "1px solid #f3f4f6",
      flexShrink: 0,
    },
    headerTitle: {
      fontSize: "1.5rem",
      fontWeight: "600",
      color: "#111827",
      margin: "0",
    },
    searchInput: {
      backgroundColor: "white",
      fontSize: "0.875rem",
      border: "1px solid #e5e7eb",
      borderRadius: "6px",
      width: "100%",
      padding: "0.5rem 0.75rem",
      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
    },
    actionButton: {
      width: "auto",
      height: "36px",
      padding: "0 0.75rem",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "6px",
      transition: "all 0.15s ease",
      backgroundColor: "#fff",
      borderColor: "#e5e7eb",
      color: "#374151",
      fontWeight: "500",
      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
    },
    calendarWrapper: {
      backgroundColor: "#fff",
      borderRadius: "8px",
      padding: "0.5rem", 
      position: "relative",
      flex: "1 1 auto",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      margin: "0 0.5rem 0.5rem 0.5rem", 
    },
    modalHeader: {
      backgroundColor: "#9e3535",
      color: "white",
      fontWeight: "bold",
    },
    modalFieldset: {
      border: "1px solid #e5e7eb",
      borderRadius: "6px",
      padding: "0.75rem 1rem 1rem 1rem", 
      marginBottom: "0.75rem", 
    },
    modalLegend: {
      fontSize: "0.875rem",
      fontWeight: 600,
      color: "#111827",
      padding: "0 0.5rem",
      width: "auto",
      marginLeft: "0.5rem",
      float: "none",
      marginBottom: "0.25rem", 
    },
    clientDisplay: {
      backgroundColor: "#e9ecef",
      border: "none",
    },
    loadingOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(255, 255, 255, 0.8)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1060,
      color: "#1f2937",
      fontWeight: "500",
    },
    clientSearchResults: {
      position: "absolute",
      zIndex: 1050,
      width: "100%",
      maxHeight: "200px",
      overflowY: "auto",
      border: "1px solid #d1d5db",
      backgroundColor: "white",
      borderRadius: "0 0 6px 6px",
      marginTop: "-1px",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -1px rgba(0, 0, 0, 0.04)",
    },
    reservationsTable: {
      marginBottom: "1rem",
      borderCollapse: "separate",
      borderSpacing: 0,
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
      overflow: "hidden",
    },
    tableHeader: {
      backgroundColor: "#f9fafb",
      fontSize: "0.75rem",
      fontWeight: 600,
      color: "#4b5563",
      textTransform: "uppercase",
      borderBottom: "1px solid #e5e7eb",
      borderTop: "none",
      borderLeft: "none",
      borderRight: "none",
      whiteSpace: "nowrap",
      padding: "0.75rem 1rem",
    },
    tableCell: {
      fontSize: "0.875rem",
      verticalAlign: "middle",
      borderTop: "1px solid #e5e7eb",
      borderBottom: "none",
      borderLeft: "none",
      borderRight: "none",
      padding: "0.75rem 1rem",
      backgroundColor: "#fff",
    },
    statusBadge: (status) => {
      
      const baseColor = colorMap[status] || colorMap["default"]
      
      let textColor = "#ffffff" 
      if (status === "en_proceso" || status === "pendiente") {
        
        const rgb = baseColor.match(/\d+/g)
        if (rgb && rgb.length >= 3) {
          
          const luminance =
            0.299 * Number.parseInt(rgb[0]) + 0.587 * Number.parseInt(rgb[1]) + 0.114 * Number.parseInt(rgb[2])
          if (luminance > 186) {
           
            textColor = "#333333"
          }
        }
      } else if (status === "terminada") {
        textColor = "#1B5E20" 
      } else if (status === "confirmada") {
        textColor = "#0D47A1" 
      } else if (status === "anulada") {
        textColor = "#B71C1C" 
      }

      return {
        fontSize: "0.7rem",
        padding: "0.3em 0.6em",
        borderRadius: "12px",
        fontWeight: 500,
        backgroundColor: baseColor,
        color: textColor,
        border: `1px solid ${textColor === "#ffffff" ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)"}`, 
      }
    },
    actionEdit: {
      backgroundColor: "#EFF6FF",
      borderColor: "#DBEAFE",
      color: "#3B82F6",
    },
    actionDelete: {
      backgroundColor: "#FEF2F2",
      borderColor: "#FEE2E2",
      color: "#EF4444",
    },
    addButton: {
      backgroundColor: "#111827",
      color: "white",
      border: "none",
      borderRadius: "6px",
      padding: "0.5rem 1rem",
      fontWeight: "500",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
      transition: "all 0.15s ease",
    },
    tabButton: {
      padding: "0.5rem 1rem",
      borderRadius: "6px",
      fontWeight: "500",
      fontSize: "0.875rem",
      backgroundColor: "transparent",
      border: "none",
      color: "#6b7280",
      cursor: "pointer",
      transition: "all 0.15s ease",
    },
    tabButtonActive: {
      backgroundColor: "#f3f4f6",
      color: "#111827",
      fontWeight: "600",
    },
  }

  // --- RENDERIZADO DEL COMPONENTE ---
  return (
    <Container fluid className="p-0" style={styles.calendarContainer}>
     
      <style>{customCalendarStyles}</style>

      {/* Toaster para notificaciones */}
      <Toaster
        position="top-center"
        toastOptions={{
          success: { duration: 3000 },
          error: { duration: 5000 },
          style: { background: "#363636", color: "#fff" },
        }}
      />

      {/* --- Indicador de Carga General --- */}
      {loading && (
        <div style={styles.loadingOverlay}>
          <Spinner color="primary" style={{ width: "3rem", height: "3rem" }} />
          <span className="ms-2">Cargando...</span>
        </div>
      )}

      {/* --- Encabezado y Botones --- */}
      <Row className="align-items-center" style={styles.calendarHeader}>
        <Col>
          <h2 style={styles.headerTitle}>Calendario</h2>
        </Col>
        {/* Input de búsqueda */}
        <Col md={4} lg={3}>
          <Input
            bsSize="sm"
            type="text"
            style={styles.searchInput}
            placeholder="Buscar en calendario..."
            value={searchText}
            onChange={handleSearchChange}
            disabled={loading}
          />
        </Col>
        <Col xs="auto">
          <Button
            color="secondary"
            outline
            size="sm"
            onClick={toggleListModal}
            disabled={loading || data.length === 0}
            title="Ver lista"
            style={styles.actionButton}
          >
            <FaList className="me-1" /> Lista
          </Button>
        </Col>
        <Col xs="auto">
          <Button
            color="secondary"
            outline
            size="sm"
            disabled={loading}
            title="Descargar Excel"
            onClick={handleDownloadExcel}
            style={styles.actionButton}
          >
            <FaFileExcel className="me-1" /> Excel
          </Button>
        </Col>
        <Col xs="auto">
          <Button color="primary" size="sm" onClick={handleDateClick} disabled={loading} style={styles.actionButton}>
            <Plus size={16} />
          </Button>
        </Col>
      </Row>

      {/* --- Calendario --- */}
      <Row
        style={{
          flex: "1 1 auto",
          margin: "0",
          width: "100%",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Col style={{ height: "100%", padding: "0", display: "flex", flexDirection: "column" }}>
          <div style={styles.calendarWrapper}>
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay",
              }}
              locales={[esLocale]}
              locale="es"
              events={events.filter((event) => {
                if (!searchText) return true
                const lowerSearchText = searchText.toLowerCase()
                return (
                  event.title.toLowerCase().includes(lowerSearchText) ||
                  (event.extendedProps?.evenType &&
                    event.extendedProps.evenType.toLowerCase().includes(lowerSearchText)) ||
                  (event.extendedProps?.status && event.extendedProps.status.toLowerCase().includes(lowerSearchText))
                )
              })}
              dateClick={handleDateClick}
              eventClick={handleEventClick}
              eventDrop={handleEventDrop}
              editable={true}
              height="100%"
              contentHeight="auto"
              eventContent={(arg) => {
                const event = arg.event
                const status = event.extendedProps.status || "default"
                const time = arg.timeText
                const title = event.title
                let bgColor, textColor
                switch (status) {
                  case "terminada":
                    bgColor = "rgba(76, 175, 80, 0.7)"
                    textColor = "#1B5E20"
                    break
                  case "anulada":
                    bgColor = "rgba(244, 67, 54, 0.7)"
                    textColor = "#FFFFFF"
                    break
                  case "pendiente":
                    bgColor = "rgba(255, 152, 0, 0.7)"
                    textColor = "#FFFFFF"
                    break
                  case "en_proceso":
                    bgColor = "rgba(255, 235, 59, 0.7)"
                    textColor = "#5C460A"
                    break
                  case "confirmada":
                    bgColor = "rgba(33, 150, 243, 0.7)"
                    textColor = "#FFFFFF"
                    break
                  default:
                    bgColor = "rgba(158, 158, 158, 0.7)"
                    textColor = "#FFFFFF"
                }
                return (
                  <div className="custom-event-container" style={{ backgroundColor: bgColor, color: textColor }}>
                    <span className="custom-event-title">{title}</span>
                    {time && <span className="custom-event-time">{time}</span>}
                  </div>
                )
              }}
              dayCellContent={(arg) => <div style={{ padding: "2px" }}>{arg.dayNumberText}</div>}
            />
          </div>
        </Col>
      </Row>

      {/* --- INICIO: Modal de Reserva por Pasos --- */}
      <Modal 
        isOpen={modalOpen} 
        toggle={() => setModalOpen(!modalOpen)} 
        onClosed={() => setCurrentStep(1)} // Resetear al cerrar
        size="lg" 
        centered 
        backdrop="static"
      >
        <ModalHeader toggle={() => setModalOpen(!modalOpen)} style={styles.modalHeader}>
          {selectedReserva ? "Editar Reserva" : "Nueva Reserva"}
        </ModalHeader>
        <ModalBody>
          {/* --- Indicador de Progreso --- */}
          <ul className="step-wizard-list">
              <li className={`step-wizard-item ${currentStep === 1 ? 'current' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
                  <span className="progress-count">1</span>
                  <span className="progress-label">Cliente</span>
              </li>
              <li className={`step-wizard-item ${currentStep === 2 ? 'current' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
                  <span className="progress-count">2</span>
                  <span className="progress-label">Reserva</span>
              </li>
              <li className={`step-wizard-item ${currentStep === 3 ? 'current' : ''}`}>
                  <span className="progress-count">3</span>
                  <span className="progress-label">Pago</span>
              </li>
          </ul>

          {/* --- Renderizado Condicional del Contenido del Paso --- */}

          {/* --- PASO 1: Datos del Cliente --- */}
          {currentStep === 1 && (
            <fieldset style={styles.modalFieldset}>
              <legend style={styles.modalLegend}>Datos del Cliente</legend>
              <FormGroup>
                <Label for="clientSearch" style={{ fontWeight: "bold" }}>
                  Buscar Cliente
                </Label>
                <Input
                  type="text"
                  id="clientSearch"
                  placeholder="Buscar por nombre, celular o correo..."
                  value={clientSearchText}
                  onChange={(e) => handleClientSearch(e.target.value)}
                  invalid={!!errors.idCustomers}
                  style={{ borderColor: "#9e3535" }}
                />
                {errors.idCustomers && <FormFeedback>{errors.idCustomers}</FormFeedback>}
                {showClientSearch && clientSearchResults.length > 0 && (
                  <div style={styles.clientSearchResults}>
                    {isClientSearchLoading ? (
                      <div className="p-2 text-center">
                        <Spinner size="sm" /> Buscando...
                      </div>
                    ) : (
                      clientSearchResults.map((cliente) => (
                        <div
                          key={cliente.idCustomers}
                          className="p-2 border-bottom"
                          style={{ cursor: "pointer" }}
                          onClick={() => selectClient(cliente)}
                        >
                          {cliente.FullName} {cliente.Cellphone && `(${cliente.Cellphone})`}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </FormGroup>
              <FormGroup>
                <Label for="clientDisplay" style={{ fontWeight: "bold" }}>
                  Cliente Seleccionado
                </Label>
                <Input
                  type="text"
                  id="clientDisplay"
                  value={form.fullName || "N/A"}
                  readOnly
                  style={{ borderColor: "#9e3535", backgroundColor: "#e9ecef" }}
                />
              </FormGroup>
            </fieldset>
          )}

          {/* --- PASO 2: Detalles de la Reserva --- */}
          {currentStep === 2 && (
            <fieldset style={styles.modalFieldset}>
              <legend style={styles.modalLegend}>Detalles de la Reserva</legend>
              <Row>
                <Col md={6}>
                  <FormGroup>
                    <Label for="numberPeople" style={{ fontWeight: "bold" }}>
                      Número de Personas
                    </Label>
                    <Input
                      type="number"
                      name="numberPeople"
                      id="numberPeople"
                      value={form.numberPeople || ""}
                      onChange={handleChange}
                      invalid={!!errors.numberPeople}
                      style={{ borderColor: "#9e3535" }}
                    />
                    {errors.numberPeople && <FormFeedback>{errors.numberPeople}</FormFeedback>}
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label for="evenType" style={{ fontWeight: "bold" }}>
                      Tipo de Evento
                    </Label>
                    <Input
                      type="select"
                      name="evenType"
                      id="evenType"
                      value={form.evenType || ""}
                      onChange={handleChange}
                      invalid={!!errors.evenType}
                      style={{ borderColor: "#9e3535" }}
                    >
                      <option value="">Seleccionar tipo...</option>
                      <option value="Cumpleaños">Cumpleaños</option>
                      <option value="Boda">Boda</option>
                      <option value="Aniversario">Aniversario</option>
                      <option value="Bautizo">Bautizo</option>
                      <option value="Graduación">Graduación</option>
                      <option value="Empresarial">Empresarial</option>
                      <option value="Despedida">Despedida</option>
                      <option value="Baby Shower">Baby Shower</option>
                      <option value="Fiesta Infantil">Fiesta Infantil</option>
                      <option value="Reunión Familiar">Reunión Familiar</option>
                      <option value="Conferencia">Conferencia</option>
                      <option value="Otro">Otro</option>
                    </Input>
                    {errors.evenType && <FormFeedback>{errors.evenType}</FormFeedback>}
                  </FormGroup>
                </Col>
              </Row>
              <FormGroup>
                <Label for="servicios" style={{ fontWeight: "bold" }}>
                  Servicios Adicionales
                </Label>
                <Select
                  isMulti
                  options={serviceOptions}
                  value={form.servicios}
                  onChange={handleMultiServiceChange}
                  placeholder="Seleccione los servicios..."
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      borderColor: errors.servicios ? '#dc3545' : '#9e3535',
                      '&:hover': {
                        borderColor: errors.servicios ? '#dc3545' : '#9e3535',
                      },
                      boxShadow: state.isFocused ? '0 0 0 0.25rem rgba(158, 53, 53, 0.25)' : 'none',
                    }),
                  }}
                />
                {errors.servicios && <div className="text-danger small mt-1">{errors.servicios}</div>}
              </FormGroup>

              {showAdditionalServiceAmountInput && (
                <Row>
                  <Col md={6}>
                    <FormGroup>
                      <Label for="additionalServiceAmount" style={{ fontWeight: "bold" }}>
                        Monto Servicio Adicional
                      </Label>
                      <Input
                        type="number"
                        name="additionalServiceAmount"
                        id="additionalServiceAmount"
                        value={form.additionalServiceAmount || ""}
                        onChange={handleChange}
                        invalid={!!errors.additionalServiceAmount}
                        style={{ borderColor: "#9e3535" }}
                        placeholder="Ingrese el monto"
                      />
                      {errors.additionalServiceAmount && <FormFeedback>{errors.additionalServiceAmount}</FormFeedback>}
                    </FormGroup>
                  </Col>
                </Row>
              )}

              {showDecorationAmountInput && (
                <Row>
                  <Col md={6}>
                    <FormGroup>
                      <Label for="decorationAmount" style={{ fontWeight: "bold" }}>
                        {additionalAmountLabel}
                      </Label>
                      <Input
                        type="number"
                        name="decorationAmount"
                        id="decorationAmount"
                        value={form.decorationAmount || ""}
                        onChange={handleChange}
                        invalid={!!errors.decorationAmount}
                        style={{ borderColor: "#9e3535" }}
                      />
                      {errors.decorationAmount && <FormFeedback>{errors.decorationAmount}</FormFeedback>}
                    </FormGroup>
                  </Col>
                </Row>
              )}
              <Row>
                <Col md={6}>
                  <FormGroup>
                    <Label for="dateTime" style={{ fontWeight: "bold" }}>
                      Fecha y Hora
                    </Label>
                    <Input
                      type="datetime-local"
                      name="dateTime"
                      id="dateTime"
                      value={form.dateTime || ""}
                      onChange={handleChange}
                      invalid={!!errors.dateTime}
                      style={{ borderColor: "#9e3535" }}
                      autoComplete="off"
                    />
                    {errors.dateTime && <FormFeedback>{errors.dateTime}</FormFeedback>}
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label for="timeDurationR" style={{ fontWeight: "bold" }}>
                      Duración (Horas)
                    </Label>
                    <Input
                      type="number"
                      name="timeDurationR"
                      id="timeDurationR"
                      value={form.timeDurationR || ""}
                      onChange={handleChange}
                      invalid={!!errors.timeDurationR}
                      style={{ borderColor: "#9e3535" }}
                    />
                    {errors.timeDurationR && <FormFeedback>{errors.timeDurationR}</FormFeedback>}
                  </FormGroup>
                </Col>
              </Row>
            </fieldset>
          )}

          {/* --- PASO 3: Pago y Estado de la Reserva --- */}
          {currentStep === 3 && (
            <fieldset style={styles.modalFieldset}>
              <legend style={styles.modalLegend}>Pago y Estado</legend>

              <fieldset style={{ ...styles.modalFieldset, marginBottom: "1rem" }}>
                <legend style={styles.modalLegend}>Abonos</legend>
              {(form.pass || []).map((abono, index) => {
        
              const today = new Date();
              const reservationDate = form.dateTime ? new Date(form.dateTime) : null;
              const maxDateForPayment = (reservationDate && reservationDate < today) 
                 ? reservationDate.toISOString().split("T")[0] 
                : today.toISOString().split("T")[0];
       
        return (  
                  <Row key={index} className="mb-2 align-items-end">
                    <Col md={5}>
                      <FormGroup className="mb-0">
                        <Label for={`fecha-${index}`} className="mb-1" style={{ fontWeight: "bold" }}>
                          Fecha
                        </Label>
                        <Input
                          type="date"
                          id={`fecha-${index}`}
                          value={abono.fecha || ""}
                          max={maxDateForPayment}
                          onChange={(e) => handleAbonoChange(index, "fecha", e.target.value)}
                          invalid={!!errors[`pass-${index}-fecha`]}
                          style={{ borderColor: "#9e3535" }}
                        />
                        {errors[`pass-${index}-fecha`] && <FormFeedback>{errors[`pass-${index}-fecha`]}</FormFeedback>}
                      </FormGroup>
                    </Col>

                    <Col md={5}>
                      <FormGroup className="mb-0">
                        <Label for={`cantidad-${index}`} className="mb-1" style={{ fontWeight: "bold" }}>
                          Cantidad
                        </Label>
                        <Input
                          type="number"
                          id={`cantidad-${index}`}
                          value={abono.cantidad || ""}
                          min="50000"
                          onChange={(e) => handleAbonoChange(index, "cantidad", e.target.value)}
                          invalid={!!errors[`pass-${index}-cantidad`]}
                          style={{ borderColor: "#9e3535" }}
                        />
                        {errors[`pass-${index}-cantidad`] && (
                          <FormFeedback>{errors[`pass-${index}-cantidad`]}</FormFeedback>
                        )}
                      </FormGroup>
                    </Col>
                    <Col md={2} className="d-flex">
                      <Button color="danger" outline onClick={() => removeAbono(index)} className="w-100">
                        <FaTrashAlt />
                      </Button>
                    </Col>
                  </Row>
                    );
})}
                <Button color="primary" outline onClick={addAbono} className="mt-2">
                  Agregar Abono
                </Button>
                {errors.pass && <div className="text-danger small mt-1">{errors.pass}</div>}
              </fieldset>

              <Row>
                <Col md={6}>
                  <FormGroup>
                    <Label for="totalPay" style={{ fontWeight: "bold" }}>
                      Total a Pagar
                    </Label>
                    <Input
                      type="number"
                      name="totalPay"
                      id="totalPay"
                      value={form.totalPay || ""}
                      onChange={handleChange}
                      invalid={!!errors.totalPay}
                      style={{ borderColor: "#9e3535" }}
                    />
                    {errors.totalPay && <FormFeedback>{errors.totalPay}</FormFeedback>}
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label for="remaining" style={{ fontWeight: "bold" }}>
                      Restante
                    </Label>
                    <Input
                      type="text"
                      id="remaining"
                      value={formatCurrency(form.remaining)}
                      readOnly
                      style={{ borderColor: "#9e3535" }}
                    />
                    {errors.remaining && <div className="text-danger small mt-1">{errors.remaining}</div>}
                  </FormGroup>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <FormGroup>
                    <Label for="status" style={{ fontWeight: "bold" }}>
                      Estado
                    </Label>
                    <Input
                      type="select"
                      name="status"
                      id="status"
                      value={form.status || "pendiente"}
                      onChange={handleChange}
                      style={{ borderColor: "#9e3535" }}
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="confirmada">Confirmada</option>
                      <option value="en_proceso">En Proceso</option>
                      <option value="terminada">Terminada</option>
                      <option value="anulada">Anulada</option>
                    </Input>
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label for="matter" style={{ fontWeight: "bold" }}>
                      Observaciones
                    </Label>
                    <Input
                      type="textarea"
                      name="matter"
                      id="matter"
                      value={form.matter || ""}
                      onChange={handleChange}
                      rows="1"
                      style={{ borderColor: "#9e3535" }}
                    />
                  </FormGroup>
                </Col>
              </Row>
            </fieldset>
          )}

        </ModalBody>
        <ModalFooter>
          <Button color="secondary" outline onClick={() => setModalOpen(false)}>
            Cancelar
          </Button>

          {/* Botón "Anterior" */}
          {currentStep > 1 && (
             <Button color="secondary" onClick={handlePrevious}>
                Anterior
             </Button>
          )}

          {/* Botón "Siguiente" */}
          {currentStep < totalSteps && (
            <Button color="primary" onClick={handleNext}>
                Siguiente
            </Button>
          )}

          {/* Botón "Guardar/Crear" en el último paso */}
          {currentStep === totalSteps && (
             <Button
                color="primary"
                onClick={() => {
                  clearDateTimeError()
                  requestSaveConfirmation()
                }}
             >
                {selectedReserva ? "Guardar Cambios" : "Crear Reserva"}
            </Button>
          )}
        </ModalFooter>
      </Modal>
      {/* --- FIN: Modal de Reserva por Pasos --- */}


      {/* --- Modal de Lista de Reservas --- */}
      <Modal isOpen={listModalOpen} toggle={toggleListModal} size="xl" centered backdrop="static">
        <ModalHeader toggle={toggleListModal}>Lista de Reservas</ModalHeader>
        <ModalBody>
          <Table responsive striped borderless style={styles.reservationsTable}>
            <thead>
              <tr>
                <th style={styles.tableHeader}>ID</th>
                <th style={styles.tableHeader}>Cliente</th>
                <th style={styles.tableHeader}>Fecha y Hora</th>
                <th style={styles.tableHeader}>Tipo Evento</th>
                <th style={styles.tableHeader}>Personas</th>
                <th style={styles.tableHeader}>Total Pago</th>
                <th style={styles.tableHeader}>Restante</th>
                <th style={styles.tableHeader}>Estado</th>
                <th style={styles.tableHeader}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((item) => (
                <tr key={item.idReservations}>
                  <td style={styles.tableCell}>{item.idReservations}</td>
                  <td style={styles.tableCell}>{item.fullName}</td>
                  <td style={styles.tableCell}>
                    {new Date(item.dateTime).toLocaleString("es-CO", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </td>
                  <td style={styles.tableCell}>{item.evenType}</td>
                  <td style={styles.tableCell}>{item.numberPeople}</td>
                  <td style={styles.tableCell}>{formatCurrency(item.totalPay)}</td>
                  <td style={styles.tableCell}>{formatCurrency(item.remaining)}</td>
                  <td style={styles.tableCell}>
                    <span style={styles.statusBadge(item.status)}>{item.status?.replace("_", " ")}</span>
                  </td>
                  <td style={styles.tableCell}>
                    <div className="d-flex gap-1">
                      <Button
                        color="link"
                        size="sm"
                        style={{ ...styles.actionButton, ...styles.actionEdit }}
                        onClick={() => {
                          const eventInfo = {
                            event: {
                              id: String(item.idReservations),
                            },
                          }
                          handleEventClick(eventInfo)
                          setListModalOpen(false)
                        }}
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        color="link"
                        size="sm"
                        style={{ ...styles.actionButton, ...styles.actionDelete }}
                        onClick={() => requestDeleteConfirmation(item.idReservations)}
                      >
                        <FaTrashAlt size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          {totalPages > 1 && (
            <Pagination aria-label="Page navigation" className="d-flex justify-content-center">
              <PaginationItem disabled={currentPage === 1}>
                <PaginationLink previous onClick={() => handlePageChange(currentPage - 1)} />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page} active={page === currentPage}>
                  <PaginationLink onClick={() => handlePageChange(page)}>{page}</PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem disabled={currentPage === totalPages}>
                <PaginationLink next onClick={() => handlePageChange(currentPage + 1)} />
              </PaginationItem>
            </Pagination>
          )}
        </ModalBody>
      </Modal>

      {/* --- Modal de Confirmación --- */}
      <ConfirmationModal
        isOpen={confirmModalOpen}
        toggle={toggleConfirmModal}
        title={confirmModalProps.title}
        onConfirm={() => {
          if (confirmActionRef.current) {
            setIsConfirmActionLoading(true)
            confirmActionRef.current()
          } else {
            console.error("[CONFIRM ACTION] No action to confirm.")
            toast.error("Error interno al confirmar la acción.")
            toggleConfirmModal()
          }
        }}
        confirmText={confirmModalProps.confirmText}
        confirmColor={confirmModalProps.confirmColor}
        isConfirming={isConfirmActionLoading}
      >
        {confirmModalProps.message}
      </ConfirmationModal>
    </Container>
  )
}

export default Calendario
