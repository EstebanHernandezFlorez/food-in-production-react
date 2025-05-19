
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
  timeDurationR: "", // Inicializar con cadena vacía
  evenType: "",
  numberPeople: "",
  matter: "",
  servicios: [],
  decorationAmount: "",
  pass: [],
  totalPay: "",
  remaining: "",
  status: "pendiente",
}

// Modificar el mapeo de colores para usar colores pastel más suaves
// ESTE colorMap ES PARA LA LISTA, NO PARA EL CALENDARIO DIRECTAMENTE
const colorMap = {
  terminada: "rgba(76, 175, 80, 0.7)", // Verde más vivo
  anulada: "rgba(244, 67, 54, 0.7)", // Rojo más vivo
  pendiente: "rgba(255, 152, 0, 0.7)", // Naranja más vivo
  en_proceso: "rgba(255, 235, 59, 0.7)", // Amarillo más vivo
  confirmada: "rgba(33, 150, 243, 0.7)", // Azul más vivo
  default: "rgba(158, 158, 158, 0.7)", // Gris más vivo
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
    margin-bottom: 1rem !important;
    padding: 0.5rem 1rem;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
  }
  
  .fc .fc-toolbar-title {
    font-size: 1.25rem !important;
    font-weight: 600;
    color: #111827;
  }
  
  /* Estilos para los botones */
  .fc .fc-button {
    padding: 0.375rem 0.75rem !important;
    font-size: 0.875rem !important;
    border-radius: 6px !important;
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
    padding: 0.5rem 0;
    background-color: #fff;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .fc .fc-col-header-cell-cushion {
    padding: 0.5rem;
    font-weight: 500;
    color: #6b7280;
    font-size: 0.875rem;
    text-decoration: none !important;
  }
  
  /* Estilos para las celdas de día */
  .fc .fc-daygrid-day {
    min-height: 6rem; /* Ajustar si es necesario, pero la altura general la controla flex */
  }
  
  .fc .fc-daygrid-day-frame {
    padding: 0.25rem;
  }
  
  .fc .fc-daygrid-day-top {
    justify-content: flex-start;
    padding: 0.25rem;
  }
  
  .fc .fc-daygrid-day-number {
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
    text-decoration: none !important;
    margin: 0.25rem;
  }
  
  /* Estilos para eventos - FullCalendar manejará el fondo con eventContent */
  .fc-event {
    border: none !important;
    background: transparent !important; /* Dejar que eventContent maneje el fondo */
    margin: 2px 0 !important;
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
    margin-top: 2px;
    padding: 0 2px;
  }
    
  /* Estilos para eventos personalizados - NUEVO ESTILO */
  .custom-event-container {
    display: block;
    margin: 2px 0;
    padding: 6px 10px;
    border-radius: 12px; /* Más redondeado para un look moderno */
    font-size: 0.8rem;
    line-height: 1.2;
    cursor: pointer;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0,0,0,0.05); /* Sombra más pronunciada */
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    transition: all 0.15s ease;
    border: 1px solid rgba(0,0,0,0.05); /* Borde sutil */
  }
  
  .custom-event-container:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0,0,0,0.08);
    transform: translateY(-1px); /* Ligero efecto de elevación */
  }
  
  .custom-event-title {
    font-weight: 600; /* Más grueso para destacar */
    /* El color se hereda del contenedor */
  }
  
  .custom-event-time {
    font-weight: 500; /* Un poco menos grueso que el título */
    margin-left: 6px; /* Más espacio */
    opacity: 0.9;
    /* El color se hereda del contenedor */
  }
  
  /* Ajustes para vista móvil */
  @media (max-width: 768px) {
    .fc .fc-toolbar {
      flex-direction: column;
      align-items: flex-start;
    }
    
    .fc .fc-toolbar-chunk {
      margin-bottom: 0.5rem;
    }
    
    .fc .fc-daygrid-day {
      min-height: 4rem;
    }
    .custom-event-container {
      padding: 4px 8px;
      font-size: 0.75rem;
    }
  }
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

  // --- NUEVA FUNCIÓN: Convertir formato de tiempo a número ---
  const convertTimeFormatToNumber = (timeStr) => {
    if (!timeStr) return ""

    // Si ya es un número, devolverlo directamente
    if (!isNaN(Number(timeStr))) return timeStr

    try {
      // Intentar extraer los segundos del formato "00:00:02"
      const parts = timeStr.split(":")
      if (parts.length === 3) {
        // Convertir a segundos totales
        const hours = Number.parseInt(parts[0], 10) || 0
        const minutes = Number.parseInt(parts[1], 10) || 0
        const seconds = Number.parseInt(parts[2], 10) || 0

        // Devolver solo los segundos si es lo que necesitas, o el total en segundos
        return seconds.toString()
      }
      return timeStr // Si no se puede parsear, devolver el original
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
      return "70000" // 70.000 para 2-15 personas
    } else if (people >= 16 && people <= 40) {
      return "90000" // 90.000 para 16-40 personas
    } else if (people > 40) {
      return "90000" // Mantener 90.000 para más de 40 personas
    } else {
      return "" // Para menos de 2 personas o valores inválidos
    }
  }

  // --- Opciones formateadas para react-select ---
  const serviceOptions = availableServices.map((service) => ({
    value: service.id,
    label: service.Nombre || service.name || service.Name || `Servicio ${service.id}`,
    price: service.price || service.Price || service.precio || 0, // Añadimos el precio del servicio
  }))

  // --- Funciones para el modal de confirmación ---
  const toggleConfirmModal = useCallback(() => {
    if (isConfirmActionLoading) return // No permitir cerrar si está procesando
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

  // --- Carga de Datos ---
  const loadInitialData = useCallback(async () => {
    setLoading(true)
    try {
      const [fetchedReservations, fetchedServices] = await Promise.all([
        reservasService.getAllReservations(),
        serviciosService.getAllServicios(),
      ])
      const normalizedServices = (fetchedServices || []).map((service) => ({
        ...service,
        Nombre: service.Nombre || service.name || service.Name || `Servicio ${service.id}`,
        price: service.price || service.Price || service.precio || 0, // Normalizar el precio
      }))
      setData(fetchedReservations || [])
      setAvailableServices(normalizedServices)
    } catch (error) {
      console.error("Error fetching initial data:", error)
      toast.error(`No se pudieron cargar los datos: ${error?.message || "Error desconocido"}`)
      setData([])
      setAvailableServices([])
    } finally {
      setLoading(false)
    }
  }, [])

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

  // --- NUEVA FUNCIÓN: Verificar si ya existe una reserva para el mismo cliente en la misma fecha ---
  const checkDuplicateReservation = useCallback(
    (clientId, dateTime, reservationId = null) => {
      if (!clientId || !dateTime) return false

      const reservationDate = new Date(dateTime)
      const reservationDateString = reservationDate.toISOString().split("T")[0] // Solo la fecha YYYY-MM-DD

      // Verificar si hay alguna reserva del mismo cliente en la misma fecha
      return data.some((reserva) => {
        // Excluir la reserva actual si estamos editando
        if (reservationId && (reserva.idReservations === reservationId || reserva.id === reservationId)) {
          return false
        }

        // Verificar si es el mismo cliente
        const sameClient = reserva.idCustomers === clientId
        if (!sameClient) return false

        // Verificar si es la misma fecha
        const reservaDate = new Date(reserva.dateTime)
        const reservaDateString = reservaDate.toISOString().split("T")[0]

        return reservaDateString === reservationDateString
      })
    },
    [data],
  )

  // --- NUEVA FUNCIÓN: Verificar si ya existe una reserva en la misma hora ---
  const checkTimeConflict = useCallback(
    (dateTime, reservationId = null) => {
      if (!dateTime) return false

      const reservationDateTime = new Date(dateTime)

      // Verificar si hay alguna reserva en la misma hora
      return data.some((reserva) => {
        // Excluir la reserva actual si estamos editando
        if (reservationId && (reserva.idReservations === reservationId || reserva.id === reservationId)) {
          return false
        }

        // Verificar si es la misma hora
        const reservaDateTime = new Date(reserva.dateTime)

        // Comparar año, mes, día, hora y minutos
        return (
          reservationDateTime.getFullYear() === reservaDateTime.getFullYear() &&
          reservationDateTime.getMonth() === reservaDateTime.getMonth() &&
          reservationDateTime.getDate() === reservaDateTime.getDate() &&
          reservationDateTime.getHours() === reservaDateTime.getHours() &&
          reservationDateTime.getMinutes() === reservaDateTime.getMinutes()
        )
      })
    },
    [data],
  )

  // --- NUEVA FUNCIÓN: Calcular precio basado en número de personas ---
  const calculateServicePrice = (numPeople, selectedServices) => {
    if (!numPeople || !selectedServices || selectedServices.length === 0) return 0

    // Convertir a número
    const people = Number.parseInt(numPeople, 10)
    if (isNaN(people) || people <= 0) return 0

    // Calcular precio base por persona para los servicios seleccionados
    let totalPrice = 0
    selectedServices.forEach((service) => {
      if (service && service.price) {
        totalPrice += Number.parseFloat(service.price) * people
      }
    })

    return totalPrice
  }

  // --- Resto de Funciones (handleDateClick, handleEventClick, handleEventDrop, etc.) ---
  const handleDateClick = (arg) => {
    const now = new Date()
    const clickedDateTime = new Date(arg.dateStr)
    const nowUTC = new Date(now.toISOString())
    const clickedUTC = new Date(clickedDateTime.toISOString())

    if (clickedUTC.getTime() < nowUTC.getTime() && arg.dateStr !== now.toISOString().split("T")[0]) {
      // Permitir click en hoy
      toast.error("No se pueden crear reservas en fechas pasadas.")
      return
    }

    setSelectedReserva(null)
    const defaultTime = "T09:00"
    // Establecer fecha/hora. Si es hoy, usar hora actual + 1 hora, si no, usar hora por defecto.
    let initialDateTime = arg.dateStr + defaultTime
    if (arg.dateStr === now.toISOString().split("T")[0]) {
      now.setHours(now.getHours() + 1, 0, 0, 0) // Hora actual + 1 hora, minutos a 00
      initialDateTime = now.toISOString().slice(0, 16)
    }

    // Resetear el label del monto adicional
    setAdditionalAmountLabel("Monto Decoración")

    setForm({
      ...emptyForm,
      dateTime: initialDateTime,
      pass: [{ fecha: new Date().toISOString().split("T")[0], cantidad: "50000" }], // Inicializar pass con 50,000
    }) // Inicializar pass con fecha hoy
    setErrors({})
    setClientSearchText("")
    setClientSearchResults([])
    setShowClientSearch(false)
    setModalOpen(true)
  }

  const handleEventClick = (info) => {
    const idReservations = Number.parseInt(info.event.id, 10)
    if (isNaN(idReservations)) {
      console.error("ID de reserva inválido:", info.event.id)
      toast.error("ID de reserva inválido.")
      return
    }
    setLoading(true)
    reservasService
      .getReservationById(idReservations)
      .then((detailedReservation) => {
        if (detailedReservation && !detailedReservation.error) {
          setSelectedReserva(detailedReservation)
          const selectedServiceValues = (
            Array.isArray(detailedReservation.AditionalServices) ? detailedReservation.AditionalServices : []
          ).map((service) => ({
            value: service.idAditionalServices,
            label: service.name || `Servicio ${service.idAditionalServices}`,
            price: service.price || service.Price || service.precio || 0,
          }))

          // Actualizar el label del monto adicional basado en el primer servicio seleccionado
          if (selectedServiceValues.length > 0) {
            setAdditionalAmountLabel(`Monto ${selectedServiceValues[0].label}`)
          } else {
            setAdditionalAmountLabel("Monto Decoración")
          }

          let formattedPass = []
          if (Array.isArray(detailedReservation.pass)) {
            formattedPass = detailedReservation.pass.map((abono) => ({
              fecha: abono.fecha ? abono.fecha.split("T")[0] : "", // Formatear fecha
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

          // Modificar el objeto form para incluir el estado correcto
          setForm({
            ...emptyForm,
            ...detailedReservation,
            id: detailedReservation.idReservations,
            idCustomers: idCliente,
            fullName:
              detailedReservation.fullName ||
              (detailedReservation.Customer ? detailedReservation.Customer.fullName : ""),
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
            dateTime: detailedReservation.dateTime ? detailedReservation.dateTime.slice(0, 16) : "",
            servicios: selectedServiceValues,
            pass:
              formattedPass.length > 0
                ? formattedPass
                : [{ fecha: new Date().toISOString().split("T")[0], cantidad: "50000" }], // Asegurar al menos un abono con fecha y monto mínimo
            timeDurationR: durationAsNumber, // Usar el valor convertido
            status: statusToUse,
          })
          console.log(
            "Duración cargada:",
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

  const handleClientSearch = async (searchValue) => {
    setClientSearchText(searchValue)
    if (searchValue.length < 2) {
      setClientSearchResults([])
      setShowClientSearch(true)
      return
    }
    setIsClientSearchLoading(true)
    setShowClientSearch(true)
    try {
      const results = await clientesService.searchClientes(searchValue)
      if (Array.isArray(results)) {
        const normalizedResults = results.map((cliente) => ({
          id: cliente.idCustomers || cliente.id,
          idCustomers: Number(cliente.idCustomers || cliente.id),
          FullName:
            cliente.FullName ||
            cliente.NombreCompleto ||
            cliente.name ||
            `Cliente ${cliente.idCustomers || cliente.id}`,
          Distintive: cliente.Distintive || cliente.Distintivo || "Regular",
          CustomerCategory: cliente.CustomerCategory || cliente.CategoriaCliente || "",
          Email: cliente.Email || cliente.Correo || "",
          Cellphone: cliente.Cellphone || cliente.Celular || "",
          Address: cliente.Address || cliente.Direccion || "",
        }))
        setClientSearchResults(normalizedResults)
      } else {
        setClientSearchResults([])
      }
    } catch (error) {
      console.error("Error al buscar clientes:", error)
      setClientSearchResults([])
    } finally {
      setIsClientSearchLoading(false)
    }
  }

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
    setErrors((prevErrors) => ({ ...prevErrors, [`pass-${index}-${field}`]: validateAbonoField(field, value) }))
  }

  const addAbono = () => {
    // Añadir abono con fecha actual por defecto y monto mínimo
    const todayStr = new Date().toISOString().split("T")[0]
    setForm((prevForm) => ({ ...prevForm, pass: [...(prevForm.pass || []), { fecha: todayStr, cantidad: "50000" }] }))
    setErrors((prevErrors) => ({ ...prevErrors, pass: "" }))
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

  const handleMultiServiceChange = (selectedOptions) => {
    setForm((prevForm) => ({ ...prevForm, servicios: selectedOptions || [] }))
    setErrors((prevErrors) => ({ ...prevErrors, servicios: validateField("servicios", selectedOptions || []) }))

    // Actualizar el label del monto adicional basado en el primer servicio seleccionado
    if (selectedOptions && selectedOptions.length > 0) {
      setAdditionalAmountLabel(`Monto ${selectedOptions[0].label}`)
    } else {
      setAdditionalAmountLabel("Monto Decoración")
    }

    // Calcular y actualizar el monto total si hay número de personas
    if (form.numberPeople) {
      const calculatedPrice = calculateServicePrice(form.numberPeople, selectedOptions)
      if (calculatedPrice > 0) {
        setForm((prevForm) => ({
          ...prevForm,
          totalPay: calculatedPrice.toString(),
        }))
        // Actualizar el restante también
        updateRestante(calculatedPrice.toString(), form.pass)
      }
    }
  }

  const validateAbonoField = useCallback((fieldName, value) => {
    if (fieldName === "fecha" && !value) return "Fecha requerida."
    if (fieldName === "cantidad") {
      if (value === "" || value === null) return "Cantidad requerida."
      const numValue = Number.parseFloat(value)
      if (isNaN(numValue) || numValue <= 0) return "Cantidad debe ser > 0."
      if (numValue < 50000) return "El monto mínimo debe ser de $50.000."
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
      if (name === "servicios" && (!Array.isArray(value) || value.length === 0)) {
        return "Seleccione al menos un servicio."
      }
      switch (name) {
        case "fullName":
          return value?.trim() ? "" : "Nombre de cliente requerido (seleccione un cliente)."
        case "dateTime":
          if (!value) return "Fecha y hora requeridas."
          const selectedDate = new Date(value)
          const now = new Date()

          // Verificar si la fecha/hora es pasada
          if (selectedDate < now) return "Fecha/hora no puede ser pasada."

          // Verificar si hay conflicto de hora
          if (checkTimeConflict(value, selectedReserva?.idReservations)) {
            return "Ya existe una reserva en esta hora. Por favor, seleccione otra hora."
          }

          // Verificar si el cliente ya tiene una reserva en esta fecha
          if (form.idCustomers && checkDuplicateReservation(form.idCustomers, value, selectedReserva?.idReservations)) {
            return "Este cliente ya tiene una reserva en esta fecha. No se permiten múltiples reservas para el mismo cliente en un día."
          }

          return ""
        case "timeDurationR":
          return value ? "" : "Duración requerida."
        case "evenType":
          return value ? "" : "Tipo de Evento requerido."
        case "numberPeople":
          const numPeople = Number.parseInt(value)
          return !isNaN(numPeople) && numPeople > 0 ? "" : "Nro. Personas debe ser > 0."
        case "decorationAmount":
          const decorAmount = Number.parseFloat(value)
          return !isNaN(decorAmount) && decorAmount >= 0 ? "" : `${additionalAmountLabel} debe ser >= 0.`
        case "totalPay":
          const totalP = Number.parseFloat(value)
          return !isNaN(totalP) && totalP > 0 ? "" : "Total a Pagar debe ser > 0."
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
      selectedReserva?.idReservations,
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
      "decorationAmount",
      "totalPay",
      "servicios",
    ]
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
    const totalPagoNum = Number.parseFloat(form.totalPay || 0)
    const totalAbonosNum = (form.pass || []).reduce((sum, abono) => sum + Number.parseFloat(abono.cantidad || 0), 0)
    if (!isNaN(totalPagoNum) && !isNaN(totalAbonosNum) && totalPagoNum < totalAbonosNum) {
      newErrors.remaining = "El total de abonos no puede superar el Total a Pagar."
      isValid = false
    }
    setErrors(newErrors)
    return isValid
  }, [form, validateAbonoField, validateField])

  const handleChange = (e) => {
    const { name, value } = e.target
    console.log(`Cambiando ${name} a: ${value}`) // Log para depuración

    // Si cambia la fecha/hora, verificar conflictos
    if (name === "dateTime") {
      // Verificar si hay conflicto de hora
      if (checkTimeConflict(value, selectedReserva?.idReservations)) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          [name]: "Ya existe una reserva en esta hora. Por favor, seleccione otra hora.",
        }))
      }

      // Verificar si el cliente ya tiene una reserva en esta fecha
      if (form.idCustomers && checkDuplicateReservation(form.idCustomers, value, selectedReserva?.idReservations)) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          [name]:
            "Este cliente ya tiene una reserva en esta fecha. No se permiten múltiples reservas para el mismo cliente en un día.",
        }))
      }
    }

    // Lógica especial para el campo numberPeople
    if (name === "numberPeople" && value) {
      const numPeople = Number.parseInt(value, 10)
      if (!isNaN(numPeople) && numPeople > 0) {
        // Calcular el monto de decoración basado en el número de personas
        const decorationAmount = calculateDecorationAmount(numPeople)

        // Actualizar el formulario con el nuevo valor calculado
        const updatedForm = {
          ...form,
          [name]: value,
          decorationAmount: decorationAmount,
        }

        // Si hay servicios seleccionados, calcular también el precio total
        if (form.servicios && form.servicios.length > 0) {
          const calculatedPrice = calculateServicePrice(numPeople, form.servicios)
          if (calculatedPrice > 0) {
            updatedForm.totalPay = calculatedPrice.toString()
          }
        }

        setForm(updatedForm)
        updateRestante(updatedForm.totalPay, updatedForm.pass)

        // Validar el campo
        const error = validateField(name, value)
        setErrors((prevErrors) => ({ ...prevErrors, [name]: error }))
        return
      }
    }

    // Comportamiento normal para otros campos
    const updatedForm = { ...form, [name]: value }
    setForm(updatedForm)
    if (name === "totalPay") {
      updateRestante(value, updatedForm.pass)
    }
    if (name !== "idCustomers") {
      const error = validateField(name, value)
      setErrors((prevErrors) => ({ ...prevErrors, [name]: error }))
    } else {
      setErrors((prevErrors) => {
        const newErrors = { ...prevErrors }
        delete newErrors.idCustomers
        return newErrors
      })
    }
  }

  // NUEVO: Función para actualizar solo la duración
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

  // NUEVO: Función para actualizar solo el estado
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

  // Función para solicitar confirmación de guardar
  const requestSaveConfirmation = useCallback(() => {
    updateRestante(form.totalPay, form.pass)

    if (!validateForm()) {
      toast.error("Por favor, corrija los errores indicados antes de continuar.")
      return
    }

    const isEditing = selectedReserva !== null

    prepareConfirmation(executeSaveReserva, {
      title: isEditing ? "¿Guardar Cambios?" : "¿Crear Reserva?",
      message: (
        <p>
          ¿Está seguro que desea {isEditing ? "guardar los cambios de" : "crear"} la reserva para{" "}
          <strong>{form.fullName}</strong>?
        </p>
      ),
      confirmText: (
        <>
          {isEditing ? <Edit size={16} className="me-1" /> : <Plus size={16} className="me-1" />}
          {isEditing ? "Guardar Cambios" : "Crear Reserva"}
        </>
      ),
      confirmColor: "primary",
      itemDetails: { isEditing },
    })
  }, [form, selectedReserva, prepareConfirmation, updateRestante, validateForm])

  // Función para ejecutar el guardado
  const executeSaveReserva = useCallback(
    async (details) => {
      const isEditing = details?.isEditing || false

      setIsConfirmActionLoading(true)
      const toastId = toast.loading(isEditing ? "Actualizando reserva..." : "Creando reserva...")

      try {
        const idAditionalServices = (form.servicios || []).map((option) => option.value)
        const abonosToSend = (form.pass || []).map((ab) => ({
          fecha: ab.fecha,
          cantidad: Number.parseFloat(ab.cantidad || 0),
        }))
        const idCustomersNum = Number(form.idCustomers)
        if (isNaN(idCustomersNum)) throw new Error("ID de cliente inválido al guardar.")

        // NUEVO: Intentar actualizar duración y estado por separado primero si estamos editando
        if (isEditing) {
          const reservationId = selectedReserva.idReservations || form.id
          if (!reservationId) throw new Error("No se pudo identificar la reserva a actualizar.")

          // Actualizar duración primero
          const durationSuccess = await updateDurationOnly(reservationId, form.timeDurationR)
          if (!durationSuccess) {
            console.warn("No se pudo actualizar la duración por separado, intentando actualización completa")
          }

          // Actualizar estado después
          const statusSuccess = await updateStatusOnly(reservationId, form.status)
          if (!statusSuccess) {
            console.warn("No se pudo actualizar el estado por separado, intentando actualización completa")
          }

          // Si ambas actualizaciones tuvieron éxito, no necesitamos hacer la actualización completa
          if (durationSuccess && statusSuccess) {
            // Actualizar datos locales
            setData((prevData) =>
              prevData.map((r) =>
                r.idReservations === reservationId
                  ? {
                      ...form,
                      idReservations: reservationId,
                      remaining: Number(form.remaining),
                      timeDurationR: Number(form.timeDurationR),
                      status: form.status,
                    }
                  : r,
              ),
            )
            toast.success("Reserva actualizada correctamente.", {
              id: toastId,
              icon: <CheckCircle className="text-success" />,
            })
            toggleConfirmModal()
            setModalOpen(false)
            return
          }
        }

        // Si las actualizaciones separadas fallaron o estamos creando, procedemos con la actualización/creación completa
        const dataToSend = {
          ...form,
          idCustomers: idCustomersNum,
          idAditionalServices: idAditionalServices,
          pass: abonosToSend,
          numberPeople: Number.parseInt(form.numberPeople || 0),
          decorationAmount: Number.parseFloat(form.decorationAmount || 0),
          totalPay: Number.parseFloat(form.totalPay || 0),
          remaining: Number.parseFloat(form.remaining || 0),
          status: form.status, // Asegurarse de que el estado se incluye correctamente
        }
        // Asegurarse de que la duración se envía correctamente
        dataToSend.timeDurationR = Number(form.timeDurationR) || 0
        dataToSend.duration = dataToSend.timeDurationR // Campo alternativo por si la API espera otro nombre
        console.log("Duración a guardar:", dataToSend.timeDurationR, "tipo:", typeof dataToSend.timeDurationR)

        delete dataToSend.servicios
        delete dataToSend.fullName
        delete dataToSend.distintive
        delete dataToSend.customerCategory
        delete dataToSend.email
        delete dataToSend.cellphone
        delete dataToSend.address
        console.log("Datos enviados:", dataToSend)
        console.log("Duración a guardar:", form.timeDurationR, "tipo:", typeof form.timeDurationR)

        if (isEditing) {
          const reservationId = selectedReserva.idReservations || form.id
          if (!reservationId) throw new Error("No se pudo identificar la reserva a actualizar.")
          await reservasService.updateReservation(reservationId, dataToSend)
          setData((prevData) =>
            prevData.map((r) =>
              r.idReservations === reservationId
                ? { ...form, idReservations: reservationId, remaining: dataToSend.remaining }
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
            ...form,
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
    [form, selectedReserva, toggleConfirmModal, updateDurationOnly, updateStatusOnly],
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
      padding: "0", // Quitamos padding para que el contenedor ocupe todo
      borderRadius: "8px",
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)",
      height: "calc(100vh - 60px)", // Ajustar 60px si tienes una barra de navegación fija arriba, sino '100vh'
      display: "flex",
      flexDirection: "column",
      width: "100%",
      margin: "0",
      overflow: "hidden", // Prevenir scroll en el contenedor principal
    },
    calendarHeader: {
      marginBottom: "0", // Quitar margen para que no reste espacio vertical
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: "0.75rem",
      padding: "1rem", // Padding para el contenido del header
      borderBottom: "1px solid #f3f4f6",
      flexShrink: 0, // Para que el header no se encoja
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
      // border: "1px solid #e5e7eb", // Se puede quitar si el .fc ya tiene borde
      borderRadius: "8px",
      padding: "1rem", // Padding interno para el calendario
      // boxShadow: "0 1px 3px rgba(0, 0, 0, 0.03), 0 1px 2px rgba(0, 0, 0, 0.02)", // Opcional
      position: "relative",
      flex: "1 1 auto", // Permite que crezca y se encoja, tomando el espacio disponible
      overflow: "hidden", // Esencial para que FullCalendar no cause scroll en este wrapper
      display: "flex", // Para que FullCalendar (su hijo) pueda usar height: 100%
      flexDirection: "column", // Para que FullCalendar (su hijo) pueda usar height: 100%
      margin: "0 1rem 1rem 1rem", // Margen alrededor del calendario
    },
    modalHeader: {
      backgroundColor: "#9e3535",
      color: "white",
      fontWeight: "bold",
    },
    modalFieldset: {
      border: "1px solid #e5e7eb",
      borderRadius: "6px",
      padding: "1rem 1.5rem 1.5rem 1.5rem",
      marginBottom: "1.5rem",
    },
    modalLegend: {
      fontSize: "0.875rem",
      fontWeight: 600,
      color: "#111827",
      padding: "0 0.5rem",
      width: "auto",
      marginLeft: "0.5rem",
      float: "none",
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
      fontWeight: 500,
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
        // Usar los colores del colorMap (que ahora son más vivos y transparentes)
        const baseColor = colorMap[status] || colorMap["default"];
        // Determinar el color del texto para buen contraste
        let textColor = "#ffffff"; // Default blanco para la mayoría
        if (status === "en_proceso" || status === "pendiente") { // Amarillo o Naranja
            const rgb = baseColor.match(/\d+/g);
            if (rgb && rgb.length >=3) {
                // Fórmula simple de luminancia para decidir el color del texto
                const luminance = 0.299 * parseInt(rgb[0]) + 0.587 * parseInt(rgb[1]) + 0.114 * parseInt(rgb[2]);
                if (luminance > 186) { // Si el fondo es claro
                    textColor = "#333333"; // Texto oscuro
                }
            }
        } else if (status === "terminada") {
             textColor = "#1B5E20"; // Verde oscuro para fondo verde claro
        } else if (status === "confirmada") {
             textColor = "#0D47A1"; // Azul oscuro para fondo azul claro
        } else if (status === "anulada") {
             textColor = "#B71C1C"; // Rojo oscuro para fondo rojo claro
        }


        return {
            fontSize: "0.7rem",
            padding: "0.3em 0.6em",
            borderRadius: "12px",
            fontWeight: 500,
            backgroundColor: baseColor,
            color: textColor,
            border: `1px solid ${textColor === "#ffffff" ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'}` // Borde sutil
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
      {/* Estilos CSS personalizados */}
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
      </Row>

      {/* --- Calendario --- */}
      {/* Esta Row debe ser flexible para ocupar el espacio restante */}
      <Row style={{ flex: "1 1 auto", margin: "0", width: "100%", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {/* Esta Col debe ocupar toda la altura de la Row flexible */}
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
              locale="es"
              events={events.filter(event => { // Filtrar eventos basado en searchText
                  if (!searchText) return true;
                  const lowerSearchText = searchText.toLowerCase();
                  return event.title.toLowerCase().includes(lowerSearchText) ||
                         (event.extendedProps?.evenType && event.extendedProps.evenType.toLowerCase().includes(lowerSearchText)) ||
                         (event.extendedProps?.status && event.extendedProps.status.toLowerCase().includes(lowerSearchText));
              })}
              dateClick={handleDateClick}
              eventClick={handleEventClick}
              eventDrop={handleEventDrop}
              editable={true}
              height="100%"             // FullCalendar toma el 100% de la altura de calendarWrapper
              contentHeight="auto"      // El contenido se ajusta automáticamente
              // aspectRatio={2.5}      // Quitar aspectRatio para que height y contentHeight dominen
              eventContent={(arg) => {
                const event = arg.event
                const status = event.extendedProps.status || "default"
                const time = arg.timeText
                const title = event.title
                // const reservaId = event.id // No se usa aquí

                // Determinar el color de fondo y texto según el estado
                // COLORES MÁS VIVOS Y TRANSPARENCIA AL 70% (alpha 0.7)
                let bgColor, textColor
                switch (status) {
                  case "terminada":
                    bgColor = "rgba(76, 175, 80, 0.7)" // Verde más vivo
                    textColor = "#1B5E20" // Verde oscuro para contraste
                    break
                  case "anulada":
                    bgColor = "rgba(244, 67, 54, 0.7)" // Rojo más vivo
                    textColor = "#FFFFFF" // Blanco para contraste
                    break
                  case "pendiente":
                    bgColor = "rgba(255, 152, 0, 0.7)" // Naranja más vivo
                    textColor = "#FFFFFF" // Blanco para contraste
                    break
                  case "en_proceso":
                    bgColor = "rgba(255, 235, 59, 0.7)" // Amarillo más vivo
                    textColor = "#5C460A" // Texto oscuro para contraste con amarillo
                    break
                  case "confirmada":
                    bgColor = "rgba(33, 150, 243, 0.7)" // Azul más vivo
                    textColor = "#FFFFFF" // Blanco para contraste
                    break
                  default:
                    bgColor = "rgba(158, 158, 158, 0.7)" // Gris más vivo
                    textColor = "#FFFFFF" // Blanco para contraste
                }

                return (
                  <div
                    className="custom-event-container"
                    style={{
                      backgroundColor: bgColor,
                      color: textColor,
                    }}
                  >
                    <span className="custom-event-title">{title}</span>
                    {time && <span className="custom-event-time">{time}</span>}
                  </div>
                )
              }}
              dayCellContent={(arg) => <div style={{ padding: "4px" }}>{arg.dayNumberText}</div>}
            />
          </div>
        </Col>
      </Row>

      {/* --- Modal de Reserva --- */}
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)} size="lg" centered backdrop="static">
        <ModalHeader toggle={() => setModalOpen(!modalOpen)} style={styles.modalHeader}>
          {selectedReserva ? "Editar Reserva" : "Nueva Reserva"}
        </ModalHeader>
        <ModalBody>
          <FormGroup>
            <Label for="clientSearch">Buscar Cliente</Label>
            <Input
              type="text"
              id="clientSearch"
              placeholder="Buscar por nombre, celular o correo..."
              value={clientSearchText}
              onChange={(e) => handleClientSearch(e.target.value)}
              invalid={!!errors.idCustomers}
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
                      {cliente.FullName} ({cliente.Cellphone})
                    </div>
                  ))
                )}
              </div>
            )}
          </FormGroup>
          <FormGroup>
            <Label for="clientDisplay">Cliente Seleccionado</Label>
            <Input
              type="text"
              id="clientDisplay"
              style={styles.clientDisplay}
              value={form.fullName || "N/A"}
              readOnly
            />
          </FormGroup>
          <Row>
            <Col md={6}>
              <FormGroup>
                <Label for="dateTime">Fecha y Hora</Label>
                <Input
                  type="datetime-local"
                  name="dateTime"
                  id="dateTime"
                  value={form.dateTime || ""}
                  onChange={handleChange}
                  invalid={!!errors.dateTime}
                />
                {errors.dateTime && <FormFeedback>{errors.dateTime}</FormFeedback>}
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <Label for="timeDurationR">Duración (segundos)</Label>
                <Input
                  type="number"
                  name="timeDurationR"
                  id="timeDurationR"
                  value={form.timeDurationR || ""}
                  onChange={handleChange}
                  invalid={!!errors.timeDurationR}
                />
                {errors.timeDurationR && <FormFeedback>{errors.timeDurationR}</FormFeedback>}
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <FormGroup>
                <Label for="evenType">Tipo de Evento</Label>
                <Input
                  type="text"
                  name="evenType"
                  id="evenType"
                  value={form.evenType || ""}
                  onChange={handleChange}
                  invalid={!!errors.evenType}
                />
                {errors.evenType && <FormFeedback>{errors.evenType}</FormFeedback>}
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <Label for="numberPeople">Número de Personas</Label>
                <Input
                  type="number"
                  name="numberPeople"
                  id="numberPeople"
                  value={form.numberPeople || ""}
                  onChange={handleChange}
                  invalid={!!errors.numberPeople}
                />
                {errors.numberPeople && <FormFeedback>{errors.numberPeople}</FormFeedback>}
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <FormGroup>
                <Label for="decorationAmount">{additionalAmountLabel}</Label>
                <Input
                  type="number"
                  name="decorationAmount"
                  id="decorationAmount"
                  value={form.decorationAmount || ""}
                  onChange={handleChange}
                  invalid={!!errors.decorationAmount}
                />
                {errors.decorationAmount && <FormFeedback>{errors.decorationAmount}</FormFeedback>}
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <Label for="totalPay">Total a Pagar</Label>
                <Input
                  type="number"
                  name="totalPay"
                  id="totalPay"
                  value={form.totalPay || ""}
                  onChange={handleChange}
                  invalid={!!errors.totalPay}
                />
                {errors.totalPay && <FormFeedback>{errors.totalPay}</FormFeedback>}
              </FormGroup>
            </Col>
          </Row>
          <FormGroup>
            <Label for="servicios">Servicios Adicionales</Label>
            <Select
              isMulti
              options={serviceOptions}
              value={form.servicios}
              onChange={handleMultiServiceChange}
              placeholder="Seleccione los servicios..."
            />
            {errors.servicios && <div className="text-danger small mt-1">{errors.servicios}</div>}
          </FormGroup>
          <fieldset style={styles.modalFieldset}>
            <legend style={styles.modalLegend}>Abonos</legend>
            {(form.pass || []).map((abono, index) => (
              <Row key={index} className="mb-2">
                <Col md={5}>
                  <FormGroup>
                    <Label for={`fecha-${index}`}>Fecha</Label>
                    <Input
                      type="date"
                      id={`fecha-${index}`}
                      value={abono.fecha || ""}
                      onChange={(e) => handleAbonoChange(index, "fecha", e.target.value)}
                      invalid={!!errors[`pass-${index}-fecha`]}
                    />
                    {errors[`pass-${index}-fecha`] && <FormFeedback>{errors[`pass-${index}-fecha`]}</FormFeedback>}
                  </FormGroup>
                </Col>
                <Col md={5}>
                  <FormGroup>
                    <Label for={`cantidad-${index}`}>Cantidad</Label>
                    <Input
                      type="number"
                      id={`cantidad-${index}`}
                      value={abono.cantidad || ""}
                      onChange={(e) => handleAbonoChange(index, "cantidad", e.target.value)}
                      invalid={!!errors[`pass-${index}-cantidad`]}
                    />
                    {errors[`pass-${index}-cantidad`] && (
                      <FormFeedback>{errors[`pass-${index}-cantidad`]}</FormFeedback>
                    )}
                  </FormGroup>
                </Col>
                <Col md={2} className="d-flex align-items-end">
                  <Button color="danger" outline onClick={() => removeAbono(index)}>
                    <FaTrashAlt />
                  </Button>
                </Col>
              </Row>
            ))}
            <Button color="primary" outline onClick={addAbono}>
              Agregar Abono
            </Button>
            {errors.pass && <div className="text-danger small mt-1">{errors.pass}</div>}
          </fieldset>
          <FormGroup>
            <Label for="remaining">Restante</Label>
            <Input type="text" id="remaining" value={formatCurrency(form.remaining)} readOnly />
            {errors.remaining && <div className="text-danger small mt-1">{errors.remaining}</div>}
          </FormGroup>
          <FormGroup>
            <Label for="status">Estado</Label>
            <Input type="select" name="status" id="status" value={form.status || "pendiente"} onChange={handleChange}>
              <option value="pendiente">Pendiente</option>
              <option value="confirmada">Confirmada</option>
              <option value="en_proceso">En Proceso</option>
              <option value="terminada">Terminada</option>
              <option value="anulada">Anulada</option>
            </Input>
          </FormGroup>
          <FormGroup>
            <Label for="matter">Observaciones</Label>
            <Input type="textarea" name="matter" id="matter" value={form.matter || ""} onChange={handleChange} />
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" outline onClick={() => setModalOpen(!modalOpen)}>
            Cancelar
          </Button>
          <Button color="primary" onClick={requestSaveConfirmation}>
            {selectedReserva ? "Guardar Cambios" : "Crear Reserva"}
          </Button>
          {/* El botón de eliminar reserva ha sido removido de aquí */}
        </ModalFooter>
      </Modal>

      {/* --- Modal de Lista de Reservas --- */}
      <Modal isOpen={listModalOpen} toggle={toggleListModal} size="xl" centered backdrop="static"> {/* Cambiado a xl para más espacio */}
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
              {currentItems // Ya no filtramos aquí, el filtrado general del calendario se aplica a 'events'
                .map((item) => (
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
                                id: String(item.idReservations), // Asegurar que ID es string
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