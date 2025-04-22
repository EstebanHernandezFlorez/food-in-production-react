"use client";

import { useEffect, useState, useCallback } from "react"
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
} from "reactstrap"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import interactionPlugin from "@fullcalendar/interaction"
import { utils, writeFile } from "xlsx"
import Swal from "sweetalert2"
import "sweetalert2/dist/sweetalert2.min.css"
import { FaFileExcel, FaTrashAlt } from "react-icons/fa"
import Select from "react-select" // Importación para el selector múltiple

// --- IMPORTAR SERVICIOS REALES ---
import reservasService from "../../services/reservasService"
import clientesService from "../../services/clientesService"
import serviciosService from "../../services/serviciosService"

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
  servicios: [], // Array de OBJETOS {value, label} para react-select
  decorationAmount: "",
  pass: [], // Array de objetos { fecha: '', cantidad: '' }
  totalPay: "",
  remaining: "", // Calculado
  paymentMethod: "",
  status: "pendiente", // Estado workflow/visual
}

// --- COMPONENTE PRINCIPAL ---
export default function Calendario() {
  // --- Estados del Componente ---
  const [data, setData] = useState([]) // Almacena las reservas cargadas
  const [availableServices, setAvailableServices] = useState([]) // Servicios disponibles para el Select
  const [selectedReserva, setSelectedReserva] = useState(null) // Reserva en edición (o null si es nueva)
  const [modalOpen, setModalOpen] = useState(false) // Visibilidad del modal
  const [form, setForm] = useState(emptyForm) // Estado del formulario del modal
  const [errors, setErrors] = useState({}) // Errores de validación del form
  const [searchText, setSearchText] = useState("") // Búsqueda en el calendario
  // Estados para búsqueda de cliente integrada
  const [clientSearchText, setClientSearchText] = useState("")
  const [clientSearchResults, setClientSearchResults] = useState([])
  const [showClientSearch, setShowClientSearch] = useState(false) // Mostrar/ocultar resultados búsqueda
  const [isClientSearchLoading, setIsClientSearchLoading] = useState(false) // Cargando búsqueda cliente
  const [loading, setLoading] = useState(true) // Carga general

  // --- Opciones formateadas para react-select a partir de los servicios disponibles ---
  const serviceOptions = availableServices.map((service) => ({
    value: service.id,
    label: service.Nombre || service.name || service.Name || `Servicio ${service.id}`, // Múltiples fallbacks para el nombre
  }))

  // --- FUNCIÓN PARA CARGAR DATOS INICIALES (Reservas y Servicios) ---
  const loadInitialData = useCallback(async () => {
    setLoading(true)
    try {
      const [fetchedReservations, fetchedServices] = await Promise.all([
        reservasService.getAllReservations(),
        serviciosService.getAllServicios(),
      ])

      // Normalizar los servicios para asegurar que tengan un nombre
      const normalizedServices = (fetchedServices || []).map((service) => ({
        ...service,
        Nombre: service.Nombre || service.name || service.Name || `Servicio ${service.id}`,
      }))

      setData(fetchedReservations || [])
      setAvailableServices(normalizedServices)
      console.log("Datos iniciales cargados:", {
        reservations: fetchedReservations?.length,
        services: normalizedServices?.length,
        serviceDetails: normalizedServices,
      })
    } catch (error) {
      console.error("Error fetching initial data:", error)
      Swal.fire(
        "Error Carga Inicial",
        `No se pudieron cargar los datos: ${error?.message || "Error desconocido"}`,
        "error",
      )
      setData([])
      setAvailableServices([])
    } finally {
      setLoading(false)
    }
  }, []) // useCallback con [] para que se cree solo una vez

  // --- useEffect PARA CARGAR DATOS AL MONTAR EL COMPONENTE ---
  useEffect(() => {
    loadInitialData()
  }, [loadInitialData]) // Ejecutar cuando loadInitialData cambia (solo al montar)

  // --- Abrir modal para NUEVA reserva ---
  const handleDateClick = (arg) => {
    const now = new Date() // Fecha y hora actuales en la zona horaria local
    const clickedDateTime = new Date(arg.dateStr)

    // Convertir ambas fechas a UTC para evitar conflictos de zona horaria
    const nowUTC = new Date(now.toISOString())
    const clickedUTC = new Date(clickedDateTime.toISOString())

    if (clickedUTC.getTime() < nowUTC.getTime()) {
      Swal.fire("Fecha Inválida", "No se pueden crear reservas en fechas pasadas.", "warning")
      return
    }

    setSelectedReserva(null) // Indicar que es nueva
    const defaultTime = "T09:00" // Hora por defecto
    setForm({ ...emptyForm, dateTime: arg.dateStr + defaultTime }) // Resetear form + fecha
    setErrors({}) // Limpiar errores
    setClientSearchText("") // Limpiar búsqueda de cliente
    setClientSearchResults([])
    setShowClientSearch(false)
    setModalOpen(true) // Abrir modal
  }

  // --- Abrir modal para EDITAR reserva ---
  // --- Abrir modal para EDITAR reserva ---
// --- Abrir modal para EDITAR reserva ---
  // En tu archivo calendario.tsx

// --- Abrir modal para EDITAR reserva ---
const handleEventClick = (info) => {
  const idReservations = Number.parseInt(info.event.id, 10);
  console.log(`Clicked on reservation ID: ${idReservations}`);
  
  setLoading(true); // Mostrar indicador de carga
  
  // Obtener los detalles de la reserva
  reservasService.getReservationById(idReservations)
    .then(detailedReservation => {
      console.log("Detailed reservation data:", detailedReservation);
      
      if (detailedReservation) {
        // Verificar si hay un error en la respuesta
        if (detailedReservation.error) {
          throw new Error(detailedReservation.errorMessage || "Error al cargar los detalles");
        }
        
        setSelectedReserva(detailedReservation); // Indicar que se edita

        // Formatear servicios para react-select
        const selectedServiceValues = (Array.isArray(detailedReservation.AditionalServices) 
          ? detailedReservation.AditionalServices 
          : [])
          .map(service => ({
            value: service.idAditionalServices,
            label: service.name || `Servicio ${service.idAditionalServices}`
          }));

        // Asegurarse de que pass sea un array válido
        let formattedPass = [];
        if (Array.isArray(detailedReservation.pass)) {
          formattedPass = detailedReservation.pass.map(abono => ({
            fecha: abono.fecha || '',
            cantidad: abono.cantidad || 0
          }));
        } else if (detailedReservation.pass && typeof detailedReservation.pass === 'object') {
          // Si pass es un objeto pero no un array, intentar convertirlo
          formattedPass = [{ fecha: '', cantidad: 0 }];
        }
        
        console.log("Abonos formateados:", formattedPass);

        // Llenar formulario con datos del cliente, servicios y abonos formateados
        setForm({
          ...emptyForm,
          ...detailedReservation,
          idCustomers: detailedReservation.idCustomers || 
                      (detailedReservation.Customer ? detailedReservation.Customer.idCustomers : null),
          fullName: detailedReservation.fullName || 
                   (detailedReservation.Customer ? detailedReservation.Customer.fullName : ""),
          distintive: detailedReservation.distintive || 
                     (detailedReservation.Customer ? detailedReservation.Customer.distintive : ""),
          customerCategory: detailedReservation.customerCategory || 
                           (detailedReservation.Customer ? detailedReservation.Customer.customerCategory : ""),
          servicios: selectedServiceValues,
          pass: formattedPass.length > 0 ? formattedPass : [{ fecha: '', cantidad: 0 }], // Asegurar que haya al menos un abono
        });
        
        // Calcular el restante basado en los abonos
        updateRestante(detailedReservation.totalPay, formattedPass);
        
        setErrors({}); // Limpiar errores
        setClientSearchText(""); // Limpiar búsqueda de cliente
        setClientSearchResults([]);
        setShowClientSearch(false);
        setModalOpen(true); // Abrir modal
      } else {
        console.error("Reserva no encontrada para editar. ID:", idReservations);
        Swal.fire("Error", "No se pudo encontrar la reserva seleccionada.", "error");
      }
    })
    .catch(error => {
      console.error("Error fetching reservation details:", error);
      Swal.fire("Error", "No se pudo cargar los detalles de la reserva.", "error");
    })
    .finally(() => {
      setLoading(false); // Ocultar indicador de carga
    });
};

  // --- REPROGRAMAR reserva (Drag & Drop) ---
  const handleEventDrop = async (info) => {
    const { event } = info
    const idReservations = Number.parseInt(event.id, 10)
    console.log(idReservations)
    const reservaOriginal = data.find((res) => res.idReservations === idReservations)

    if (!reservaOriginal) {
      console.error("Error: No se encontró reserva original para reprogramar. ID:", idReservations)
      Swal.fire("Error Interno", "No se pudo encontrar la reserva.", "error")
      return
    }

    const newStartDate = new Date(event.start)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (newStartDate < today) {
      Swal.fire("Error", "No se pueden reprogramar a fechas pasadas.", "error")
      info.revert()
      return
    }

    const conflictingReserva = data.find(
      (res) => res.id !== idReservations && new Date(res.dateTime).toDateString() === newStartDate.toDateString(),
    )

    if (conflictingReserva) {
      Swal.fire("Conflicto", "Ya existe otra reserva en esta fecha.", "error")
      info.revert()
      return
    }

    // Asegurar enviar todos los datos necesarios para la actualización
    const updatedReservaData = {
      ...reservaOriginal,
      dateTime: event.start.toISOString().slice(0, 16),
      // Convertir servicios de {value, label} a IDs si es necesario para la API de update
      idAditionalServices: (reservaOriginal.servicios || []).map((s) => (typeof s === "object" ? s.value : s)),
    }

    try {
      setLoading(true)
      await reservasService.updateReservation(idReservations, updatedReservaData)
      // Actualizar estado local. IMPORTANTE: mantener el formato correcto para servicios en el estado local
      setData((prevData) =>
        prevData.map((res) =>
          res.id === idReservations ? { ...updatedReservaData, servicios: reservaOriginal.servicios } : res,
        ),
      ) // Mantener formato original de servicios
      Swal.fire("Reserva reprogramada", "La reserva se actualizó.", "success")
    } catch (error) {
      console.error("Error updating reservation on drop:", error)
      Swal.fire("Error", "No se pudo reprogramar la reserva.", "error")
      info.revert()
    } finally {
      setLoading(false)
    }
  }

  // --- Mapeo de colores y eventos para FullCalendar ---
  const colorMap = {
    terminada: "#28a745",
    anulada: "#dc3545",
    pendiente: "#ffc107",
    en_proceso: "#fd7e14",
    confirmada: "#007bff",
  }
  const events = data.map((reserva) => ({
    id: reserva.idReservations.toString(),
    title: reserva.fullName || reserva.evento || `Reserva ${reserva.id}`,
    start: reserva.dateTime,
    backgroundColor: colorMap[reserva.status] || "#6c757d",
    borderColor: colorMap[reserva.status] || "#6c757d",
    textColor: reserva.status === "pendiente" ? "#212529" : "#ffffff",
  }))

  const handleSearchChange = (e) => {
    setSearchText(e.target.value)
  }

  const filteredEvents = events.filter((event) => event.title.toLowerCase().includes(searchText.toLowerCase()))

  // --- BÚSQUEDA DE CLIENTES ---
  // CAMBIO 1: Función mejorada para buscar clientes
  const handleClientSearch = async (searchValue) => {
    setClientSearchText(searchValue)

    // No buscar si el texto tiene menos de 2 caracteres
    if (searchValue.length < 2) {
      setClientSearchResults([]) // Vaciar resultados
      return
    }

    setIsClientSearchLoading(true) // Mostrar indicador de carga

    try {
      const results = await clientesService.searchClientes(searchValue)
      console.log("Resultados de búsqueda de clientes:", results) // Depuración

      // Verificar la estructura de cada cliente
      if (Array.isArray(results)) {
        results.forEach((cliente, index) => {
          if (!cliente.idCustomers && cliente.idCustomers !== 0) {
            console.error(`ERROR: Cliente #${index} no tiene idCustomers:`, cliente)
          } else {
            console.log(`Cliente #${index} idCustomers: ${cliente.idCustomers}, tipo: ${typeof cliente.idCustomers}`)
          }
        })
        
        // Normalizar los resultados para manejar diferentes formatos de respuesta
        const normalizedResults = results.map((cliente) => ({
          id: cliente.id || cliente.idCustomers, // Usar idCustomers como fallback
          idCustomers: Number(cliente.idCustomers || cliente.id), // Asegurar que idCustomers sea un número
          FullName:
            cliente.FullName || cliente.NombreCompleto || cliente.name || cliente.nombre || `Cliente ${cliente.id}`,
          Distintive: cliente.Distintive || cliente.Distintivo || cliente.distintivo || "Regular",
          CustomerCategory: cliente.CustomerCategory || cliente.CategoriaCliente || cliente.categoria || "",
          Email: cliente.Email || cliente.Correo || cliente.email || "",
          Cellphone: cliente.Cellphone || cliente.Celular || cliente.celular || cliente.phone || "",
          Address: cliente.Address || cliente.Direccion || cliente.direccion || cliente.address || "",
        }))
        setClientSearchResults(normalizedResults)
      } else {
        console.error("El backend devolvió un formato no esperado:", results)
        setClientSearchResults([])
      }
    } catch (error) {
      console.error("Error al buscar clientes:", error)
      setClientSearchResults([])
    } finally {
      setIsClientSearchLoading(false) // Ocultar indicador de carga
    }
  }

  // --- SELECCIONAR CLIENTE ---
  // CAMBIO 2: Función mejorada para seleccionar cliente
  const selectClient = (cliente) => {
    console.log("Cliente seleccionado:", cliente) // Debug
    
    if (!cliente || (!cliente.id && !cliente.idCustomers)) {
      console.error("ERROR: Cliente seleccionado inválido o sin ID", cliente)
      setErrors(prev => ({...prev, idCustomers: "Cliente seleccionado inválido"}))
      return
    }
    
    // Asegurar que idCustomers sea un número
    const idCustomersNum = Number(cliente.idCustomers || cliente.id)
    
    if (isNaN(idCustomersNum)) {
      console.error(`ERROR: idCustomers no es un número válido: ${cliente.idCustomers || cliente.id}`)
      setErrors(prev => ({...prev, idCustomers: "ID de cliente inválido"}))
      return
    }
    
    setForm((prevForm) => ({
      ...prevForm,
      idCustomers: idCustomersNum, // Guardar como número
      fullName: cliente.FullName || cliente.NombreCompleto || "",
      distintive: cliente.Distintive || cliente.Distintivo || "",
      customerCategory: cliente.CustomerCategory || cliente.CategoriaCliente || "",
      email: cliente.Email || cliente.Correo || "",
      cellphone: cliente.Cellphone || cliente.Celular || "",
      address: cliente.Address || cliente.Direccion || "",
    }))
    
    console.log("Formulario actualizado con cliente:", {
      idCustomers: idCustomersNum,
      fullName: cliente.FullName || cliente.NombreCompleto || ""
    })
    
    setClientSearchText("") // Limpia el texto de búsqueda
    setClientSearchResults([]) // Limpia los resultados de búsqueda
    setShowClientSearch(false) // Cierra los resultados de búsqueda
    
    // Limpiar error si existía
    if (errors.idCustomers) {
      setErrors((prev) => {
        const newErrors = {...prev}
        delete newErrors.idCustomers
        delete newErrors.clientSearch
        return newErrors
      })
    }
  }

  // --- MANEJO DE ABONOS ---
  const handleAbonoChange = (index, field, value) => {
    const updatedAbonos = form.pass.map((abono, i) => (i === index ? { ...abono, [field]: value } : abono))
    setForm((prevForm) => ({ ...prevForm, pass: updatedAbonos }))
    if (field === "cantidad") {
      updateRestante(form.totalPay, updatedAbonos)
    }
    setErrors((prevErrors) => ({ ...prevErrors, [`pass-${index}-${field}`]: validateAbonoField(field, value) }))
  }

  const addAbono = () => {
    setForm((prevForm) => ({ ...prevForm, pass: [...(prevForm.pass || []), { fecha: "", cantidad: "" }] }))
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
    setErrors((prevErrors) => ({ ...prevErrors, remaining: validateField("remaining", restanteFormatted) }))
  }, [])

  // --- MANEJO DE SELECCIÓN DE SERVICIOS (react-select) ---
  const handleMultiServiceChange = (selectedOptions) => {
    setForm((prevForm) => ({ ...prevForm, servicios: selectedOptions || [] })) // Guardar array {value, label}
    setErrors((prevErrors) => ({ ...prevErrors, servicios: validateField("servicios", selectedOptions || []) }))
  }

  // --- VALIDACIÓN ---
  const validateAbonoField = (fieldName, value) => {
    if (fieldName === "fecha" && !value) return "Fecha req."
    if (fieldName === "cantidad") {
      const numValue = Number.parseFloat(value)
      if (isNaN(numValue) || numValue <= 0) return "Cantidad > 0."
    }
    return ""
  }

  // CAMBIO 3: Función mejorada para validar campos
  const validateField = (name, value) => {
    if (name === "idCustomers") {
      if (value === null || value === undefined || value === "") {
        console.error("ERROR: idCustomers es null, undefined o vacío en validateField")
        return "Debe seleccionar un cliente."
      }
      
      const idNum = Number(value)
      console.log(`Validando idCustomers: ${value} -> ${idNum}, tipo: ${typeof idNum}`)
      
      if (isNaN(idNum) || idNum <= 0) {
        console.error(`ERROR: idCustomers no es un número válido en validateField: ${value}`)
        return "ID de cliente inválido."
      }
      
      return ""
    }
    
    if (name === "servicios" && (!Array.isArray(value) || value.length === 0)) {
      return "Seleccione al menos un servicio."
    }
  
    switch (name) {
      case "fullName":
        return value.trim() ? "" : "Nombre es requerido." // Cliente
      case "dateTime":
        if (!value) return "Fecha y hora requeridas."
        return new Date(value) > new Date() ? "" : "Fecha/hora debe ser futura."
      case "timeDurationR":
        return value ? "" : "Duración requerida."
      case "evenType":
        return value ? "" : "Tipo de Evento requerido."
      case "numberPeople":
        return Number.parseInt(value) > 0 ? "" : "Nro. Personas > 0."
      case "decorationAmount":
        return !isNaN(Number.parseFloat(value)) && Number.parseFloat(value) >= 0 ? "" : "Monto Decoración >= 0."
      case "totalPay":
        return !isNaN(Number.parseFloat(value)) && Number.parseFloat(value) > 0 ? "" : "Total a Pagar > 0."
      case "remaining":
        return !isNaN(Number.parseFloat(value)) && Number.parseFloat(value) >= 0 ? "" : "Restante >= 0."
      case "paymentMethod":
        return value ? "" : "Forma de Pago requerida."
      // Campos cliente (solo formato si existen, ya que vienen de selección)
      case "distintive":
        return !value || value.trim() ? "" : "Distintivo inválido."
      case "customerCategory":
        return !value || value ? "" : "Categoría inválida."
      case "cellphone":
        return !value || /^\d{7,15}$/.test(value) ? "" : "Celular inválido (7-15 dígitos)."
      case "email":
        return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "" : "Correo inválido."
      case "address":
        return !value || value.trim() ? "" : "Dirección inválida."
      default:
        return ""
    }
  }

  // CAMBIO 4: Función para verificar el formulario antes de enviarlo
  const verifyFormBeforeSending = () => {
    console.log("Verificando formulario antes de enviar:", form)
    
    // Verificar idCustomers
    if (!form.idCustomers && form.idCustomers !== 0) {
      console.error("ERROR CRÍTICO: idCustomers es null o undefined en verificación final")
      return false
    }
    
    const idCustomersNum = Number(form.idCustomers)
    if (isNaN(idCustomersNum) || idCustomersNum <= 0) {
      console.error(`ERROR: idCustomers no es un número válido en verificación final: ${form.idCustomers}`)
      return false
    }
    
    // Verificar otros campos críticos
    if (!form.dateTime) {
      console.error("ERROR: dateTime es null o undefined en verificación final")
      return false
    }
    
    if (!form.pass || !Array.isArray(form.pass) || form.pass.length === 0) {
      console.error("ERROR: pass no es un array válido en verificación final:", form.pass)
      return false
    }
    
    return true
  }

  // CAMBIO 5: Función mejorada para validar el formulario completo
  const validateForm = () => {
    const newErrors = {}
    let isValid = true
  
    // Campos obligatorios
    const fieldsToValidate = [
      "idCustomers",
      "dateTime",
      "timeDurationR",
      "evenType",
      "numberPeople",
      "decorationAmount",
      "totalPay",
      "remaining",
      "paymentMethod",
      "servicios",
    ]
  
    // Verificar que el cliente esté seleccionado
    const clientFields = ["fullName"]
    
    // Validación más robusta del cliente
    if (!form.idCustomers && form.idCustomers !== 0) {
      console.error("ERROR: idCustomers es null o undefined en validateForm")
      newErrors.idCustomers = "Debe seleccionar un cliente válido."
      isValid = false
    } else {
      // Verificar que idCustomers sea un número válido
      const idNum = Number(form.idCustomers)
      console.log(`Validando idCustomers en validateForm: ${form.idCustomers} -> ${idNum}, tipo: ${typeof idNum}`)
      
      if (isNaN(idNum) || idNum <= 0) {
        console.error(`ERROR: idCustomers no es un número válido en validateForm: ${form.idCustomers}`)
        newErrors.idCustomers = "ID de cliente inválido."
        isValid = false
      }
    }
    
    // Validar campos obligatorios
    ;[...fieldsToValidate, ...clientFields].forEach((key) => {
      const error = validateField(key, form[key])
      if (error) {
        newErrors[key] = error
        isValid = false
      }
    })
  
    // Validar abonos
    if (!form.pass || form.pass.length === 0) {
      newErrors.pass = "Agregar al menos un abono."
      isValid = false
    } else {
      form.pass.forEach((abono, i) => {
        const fe = validateAbonoField("fecha", abono.fecha)
        const ce = validateAbonoField("cantidad", abono.cantidad)
        if (fe) newErrors[`pass-${i}-fecha`] = fe
        if (ce) newErrors[`pass-${i}-cantidad`] = ce
        if (fe || ce) isValid = false
      })
    }
    console.log("Errores detectados en el formulario:", newErrors) // Depuración
    // Actualizar errores en el estado
    setErrors(newErrors)
  
    return isValid
  }

  // --- Cambio General en campos del Formulario ---
  const handleChange = (e) => {
    const { name, value } = e.target
    const updatedForm = { ...form, [name]: value }
    setForm(updatedForm)
    if (name === "totalPay") {
      updateRestante(value, updatedForm.pass)
    }
    // Validar el campo que cambió
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: validateField(name, value),
      // Limpiar errores de abono si cambia otro campo
      ...(name !== "pass" &&
        Object.keys(prevErrors)
          .filter((k) => k.startsWith("pass-"))
          .reduce((acc, key) => ({ ...acc, [key]: undefined }), {})),
    }))
  }

  // --- GUARDAR (Crear o Editar) ---
  // CAMBIO 6: Función mejorada para guardar la reserva
  const handleSaveReserva = async () => {
    // Verificación adicional para idCustomers antes de validar el formulario
    if (!form.idCustomers && form.idCustomers !== 0) {
      console.error("ERROR CRÍTICO: idCustomers es null o undefined al guardar", form)
      setErrors(prev => ({...prev, idCustomers: "Debe seleccionar un cliente."}))
      Swal.fire("Error", "Debe seleccionar un cliente válido.", "warning")
      return
    }
    
    // Verificar que idCustomers sea un número válido
    const idCustomersNum = Number(form.idCustomers)
    if (isNaN(idCustomersNum)) {
      console.error(`ERROR: idCustomers no es un número válido al guardar: ${form.idCustomers}`)
      setErrors(prev => ({...prev, idCustomers: "ID de cliente inválido."}))
      Swal.fire("Error", "ID de cliente inválido.", "warning")
      return
    }
    
    if (!validateForm()) {
      Swal.fire("Error Validación", "Corrija los errores indicados.", "warning")
      return
    }
    
    // Verificación final del formulario
    if (!verifyFormBeforeSending()) {
      Swal.fire("Error", "Datos del formulario inválidos. Revise los campos obligatorios.", "error")
      return
    }
    
    console.log("Datos validados del formulario:", form)
    const isEditing = selectedReserva !== null
  
    const result = await Swal.fire({
      title: isEditing ? "¿Guardar Cambios?" : "¿Crear Reserva?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí",
      cancelButtonText: "No",
    })
  
    if (result.isConfirmed) {
      setLoading(true)
      try {
        // Extraer solo los IDs de los servicios seleccionados
        const idAditionalServices = (form.servicios || []).map((option) => option.value)
  
        // Asegurar que los abonos tengan el formato correcto
        const abonosToSend = (form.pass || []).map((ab) => ({
          fecha: ab.fecha,
          cantidad: Number.parseFloat(ab.cantidad || 0),
        }))
  
        // Crear una copia limpia del formulario para enviar
        const dataToSend = {
          ...form,
          idCustomers: idCustomersNum, // Asegurar que sea un número
          idAditionalServices: idAditionalServices,
          pass: abonosToSend,
        }
        
        // Verificación final de idCustomers
        console.log("Verificación final de idCustomers:", {
          original: form.idCustomers,
          convertido: idCustomersNum,
          tipo: typeof idCustomersNum
        })
        
        console.log("Datos enviados al backend:", dataToSend)

        if (isEditing) {
          // MODIFICADO: Obtener el ID correcto de la reserva
          const reservationId = selectedReserva.idReservations || form.idReservations;
          
          // NUEVO: Verificar que el ID sea válido
          if (!reservationId) {
            console.error("ERROR: No se encontró ID de reserva para actualizar", {
              selectedReserva,
              formIdReservations: form.idReservations
            });
            Swal.fire("Error", "No se pudo identificar la reserva a actualizar", "error");
            setLoading(false);
            return;
          }
          
          console.log("Actualizando reserva con ID:", reservationId);
          
          // MODIFICADO: Pasar el ID correcto a updateReservation
          await reservasService.updateReservation(reservationId, dataToSend);
          
          setData((prevData) =>
            prevData.map((r) =>
              // MODIFICADO: Usar el ID correcto para la comparación
              r.idReservations === reservationId
                ? { ...dataToSend, idReservations: reservationId, servicios: form.servicios, pass: form.pass }
                : r,
            ),
          )
          Swal.fire("Actualizado", "Reserva actualizada.", "success")
        } else {
          const newReservation = await reservasService.createReservation(dataToSend)
          setData((prevData) => [...prevData, { ...newReservation, servicios: form.servicios, pass: form.pass }])
          Swal.fire("Creada", "Reserva creada.", "success")
        }

        setModalOpen(false)
      } catch (error) {
        console.log("Error saving reservation:", error)
        Swal.fire("Error", error.message || "No se pudo guardar la reserva.", "error")  
      } finally {
        setLoading(false)
      }
    }
}
  
  // --- CANCELAR (Eliminar) ---
  const handleCancel = async (id) => {
    if (!id) return
    const result = await Swal.fire({
      title: "¿ELIMINAR Reserva?",
      text: "¡Acción irreversible!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "No",
    })
    if (result.isConfirmed) {
      setLoading(true)
      try {
        const response = await reservasService.deleteReservation(id)
        if (response && response.success !== false) {
          setData((prevData) => prevData.filter((reserva) => reserva.id !== id))
          setModalOpen(false)
          Swal.fire("Eliminada", response.message || "Reserva eliminada.", "success")
        } else {
          Swal.fire("Error", response?.message || "No se pudo eliminar.", "error")
        }
      } catch (error) {
        console.error("Error deleting reservation:", error)
        const errorMessage = error.response?.data?.message || error.message || "Error al eliminar."
        Swal.fire("Error", errorMessage, "error")
      } finally {
        setLoading(false)
      }
    }
  }

  // --- Descargar Excel ---
  const handleDownloadExcel = () => {
    if (data.length === 0) {
      Swal.fire("Vacío", "No hay datos.", "info")
      return
    }
    const dataToExport = data.map((r) => ({
      ID: r.id,
      Cliente: r.fullName,
      Asunto: r.matter,
      FechaHora: r.dateTime,
      Duracion: r.timeDurationR,
      TipoEvento: r.evenType,
      NumPersonas: r.numberPeople,
      TotalPago: r.totalPay,
      Restante: r.remaining,
      FormaPago: r.paymentMethod,
      Estado: r.status,
    }))
    const ws = utils.json_to_sheet(dataToExport)
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, "Reservas")
    writeFile(wb, "Reservas.xlsx")
  }

  // --- Formato de Moneda ---
  const formatCurrency = (value) => {
    const n = Number.parseFloat(value)
    return isNaN(n)
      ? ""
      : new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n)
  }

  // --- RENDERIZADO DEL COMPONENTE ---
  return (
    <Container fluid className="p-0">
      {/* --- Indicador de Carga General --- */}
      {loading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(255, 255, 255, 0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <Spinner color="primary" style={{ width: "3rem", height: "3rem" }} />
          <span className="ms-2">Cargando...</span>
        </div>
      )}

      {/* --- Encabezado y Botones --- */}
      <Row className="mb-3 align-items-center">
        <Col>
          {" "}
          <h2>Calendario de Reservas</h2>{" "}
        </Col>
        <Col xs="auto">
          <Button color="success" onClick={handleDownloadExcel} disabled={data.length === 0 || loading}>
            <FaFileExcel className="me-2" /> Descargar Excel
          </Button>
        </Col>
      </Row>

      {/* --- Búsqueda Principal Calendario--- */}
      <Row className="mb-3">
        <Col>
          <Input
            type="text"
            style={{ width: "300px" }}
            placeholder="Buscar por nombre/evento..."
            value={searchText}
            onChange={handleSearchChange}
            disabled={loading}
          />
        </Col>
      </Row>

      {/* --- Calendario --- */}
      <Row>
        <Col>
          <div style={{ height: "calc(100vh - 250px)", position: "relative" }}>
            {data.length > 0 || !loading ? (
              <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                events={filteredEvents}
                dateClick={handleDateClick}
                eventClick={handleEventClick}
                editable={true}
                eventDrop={handleEventDrop}
                locale="es"
                buttonText={{ today: "Hoy" }}
                height="100%"
              />
            ) : (
              <p className="text-center mt-5">{loading ? "" : "No hay reservas para mostrar."}</p>
            )}
          </div>
        </Col>
      </Row>

      {/* --- MODAL PARA CREAR/EDITAR RESERVA --- */}
      <Modal
        isOpen={modalOpen}
        toggle={() => !loading && setModalOpen(!modalOpen)}
        size="lg"
        backdrop="static"
        scrollable
      >
        <ModalHeader
          toggle={() => !loading && setModalOpen(!modalOpen)}
          style={{ background: "#6d0f0f", color: "white" }}
        >
          {selectedReserva ? "Editar Reserva" : "Nueva Reserva"}
        </ModalHeader>
        <ModalBody>
          {/* --- Datos del Cliente (CON BÚSQUEDA INTEGRADA) --- */}
          <FormGroup tag="fieldset" className="border p-3 mb-3">
            <legend className="w-auto px-2" style={{ fontSize: "1rem", fontWeight: "bold" }}>
              Datos del Cliente
            </legend>
            <Row>
              <Col md={7}>
                <Label for="clienteBusqueda">
                  <b>Seleccionar Cliente*</b>
                </Label>
                <Select
                  value={
                    form.idCustomers
                      ? { value: form.idCustomers, label: `${form.fullName} (${form.distintive || "Sin distintivo"})` }
                      : null
                  }
                  onChange={(selectedOption) =>
                    setForm({
                      ...form,
                      idCustomers: selectedOption.value,
                      fullName: selectedOption.label.split(" (")[0],
                      distintive: selectedOption.label.includes("(")
                        ? selectedOption.label.split("(")[1].replace(")", "")
                        : "",
                    })
                  }
                  onInputChange={(inputValue) => {
                    handleClientSearch(inputValue) // Conectar la búsqueda
                  }}
                  options={clientSearchResults.map((cliente) => ({
                    value: cliente.id,
                    label: `${cliente.FullName} (${cliente.Distintive || "Sin distintivo"})`,
                  }))}
                  placeholder="Seleccione un cliente"
                  isLoading={isClientSearchLoading}
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderColor: errors.idCustomers ? "#dc3545" : base.borderColor,
                    }),
                  }}
                />

                {errors.idCustomers && <div className="text-danger mt-1 small">{errors.idCustomers}</div>}
              </Col>
              <Col md={5}>
                <Label for="categoriaClienteDisplay">
                  <b>Categoría</b>
                </Label>
                <Input
                  id="categoriaClienteDisplay"
                  name="customerCategory"
                  value={form.customerCategory}
                  readOnly
                  disabled
                />
              </Col>
              <Col md={12} className="mt-2">
                <Input
                  bsSize="sm"
                  type="text"
                  value={
                    form.fullName
                      ? `Seleccionado: ${form.fullName} (ID: ${form.idCustomers})`
                      : "Ningún cliente seleccionado"
                  }
                  readOnly
                  disabled
                  title={form.fullName ? `ID: ${form.idCustomers}` : ""}
                />
              </Col>
            </Row>
          </FormGroup>

          {/* --- Detalles de la Reserva --- */}
          <FormGroup tag="fieldset" className="border p-3 mb-3">
            <legend className="w-auto px-2" style={{ fontSize: "1rem", fontWeight: "bold" }}>
              Detalles de la Reserva
            </legend>
            <Row className="mt-3">
              <Col md={6}>
                <Label for="timeDurationR">
                  <b>Duración (HH:MM)*</b>
                </Label>
                <Input
                  id="timeDurationR"
                  name="timeDurationR"
                  type="time"
                  value={form.timeDurationR}
                  onChange={handleChange}
                  invalid={!!errors.timeDurationR}
                  step="1800"
                  disabled={loading}
                />
                {errors.timeDurationR && <FormFeedback>{errors.timeDurationR}</FormFeedback>}
              </Col>
              <Col md={6}>
                <Label for="evenType">
                  <b>Tipo de Evento*</b>
                </Label>
                <Input
                  id="evenType"
                  name="evenType"
                  type="select"
                  value={form.evenType}
                  onChange={handleChange}
                  invalid={!!errors.evenType}
                  disabled={loading}
                >
                  <option value="">Seleccione...</option>
                  <option value="Empresarial">Empresarial</option>
                  <option value="Cumpleaños">Cumpleaños</option>
                  <option value="Grado">Grado</option>
                  <option value="Aniversario">Aniversario</option>
                  <option value="Bautizo">Bautizo</option>
                  <option value="PrimeraComunion">Primera Comunión</option>
                  <option value="Matrimonio">Matrimonio</option>
                </Input>
                {errors.evenType && <FormFeedback>{errors.evenType}</FormFeedback>}
              </Col>
            </Row>
            <Row className="mt-3">
              <Col md={6}>
                <Label for="numberPeople">
                  <b>Número de Personas*</b>
                </Label>
                <Input
                  id="numberPeople"
                  name="numberPeople"
                  type="number"
                  value={form.numberPeople}
                  onChange={handleChange}
                  invalid={!!errors.numberPeople}
                  min="1"
                  disabled={loading}
                />
                {errors.numberPeople && <FormFeedback>{errors.numberPeople}</FormFeedback>}
              </Col>
              <Col md={6}>
                <Label for="matter">
                  <b>Observaciones</b>
                </Label>
                <Input
                  id="matter"
                  name="matter"
                  type="textarea"
                  value={form.matter}
                  onChange={handleChange}
                  rows="1"
                  disabled={loading}
                />
              </Col>
            </Row>
          </FormGroup>

          {/* --- Servicios Adicionales --- */}
          <FormGroup tag="fieldset" className="border p-3 mb-3">
            <legend className="w-auto px-2" style={{ fontSize: "1rem", fontWeight: "bold" }}>
              Servicios Adicionales
            </legend>
            <Select
              id="servicios"
              name="servicios"
              options={serviceOptions}
              isMulti
              onChange={handleMultiServiceChange}
              value={form.servicios}
              placeholder="Seleccione servicios..."
              isLoading={loading && availableServices.length === 0}
              isDisabled={loading}
              closeMenuOnSelect={false}
              styles={{
                control: (base, status) => ({
                  ...base,
                  borderColor: errors.servicios ? "#dc3545" : "#ced4da",
                }),
              }}
            />
            {errors.servicios && <div className="text-danger mt-1 small">{errors.servicios}</div>}
          </FormGroup>

          {/* --- Detalles de Pago y Abonos --- */}
          <FormGroup tag="fieldset" className="border p-3 mb-3">
            <legend className="w-auto px-2" style={{ fontSize: "1rem", fontWeight: "bold" }}>
              Detalles de Pago
            </legend>
            <Row>
              <Col md={6}>
                <Label for="decorationAmount">
                  <b>Monto Decoración*</b>
                </Label>
                <Input
                  id="decorationAmount"
                  name="decorationAmount"
                  type="number"
                  value={form.decorationAmount}
                  onChange={handleChange}
                  invalid={!!errors.decorationAmount}
                  min="0"
                  disabled={loading}
                />
                {errors.decorationAmount && <FormFeedback>{errors.decorationAmount}</FormFeedback>}
              </Col>
              <Col md={6}>
                <Label for="totalPay">
                  <b>Total a Pagar*</b>
                </Label>
                <Input
                  id="totalPay"
                  name="totalPay"
                  type="number"
                  value={form.totalPay}
                  onChange={handleChange}
                  invalid={!!errors.totalPay}
                  min="0"
                  disabled={loading}
                />
                {errors.totalPay && <FormFeedback>{errors.totalPay}</FormFeedback>}
              </Col>
            </Row>
            <Row className="mt-3">
              <Col md={12}>
                <Label>
                  <b>Abonos*</b>
                </Label>
                {errors.pass && <div className="text-danger mb-2 small">{errors.pass}</div>}
                {(form.pass || []).map((abono, index) => (
                  <Row key={index} className="mb-2 align-items-center">
                    <Col md={5}>
                      <Input
                        type="date"
                        value={abono.fecha}
                        onChange={(e) => handleAbonoChange(index, "fecha", e.target.value)}
                        invalid={!!errors[`pass-${index}-fecha`]}
                        disabled={loading}
                      />
                      {errors[`pass-${index}-fecha`] && <FormFeedback>{errors[`pass-${index}-fecha`]}</FormFeedback>}
                    </Col>
                    <Col md={5}>
                      <Input
                        type="number"
                        placeholder="Cantidad"
                        value={abono.cantidad}
                        onChange={(e) => handleAbonoChange(index, "cantidad", e.target.value)}
                        invalid={!!errors[`pass-${index}-cantidad`]}
                        min="1"
                        disabled={loading}
                      />
                      {errors[`pass-${index}-cantidad`] && (
                        <FormFeedback>{errors[`pass-${index}-cantidad`]}</FormFeedback>
                      )}
                    </Col>
                    <Col md={2}>
                      <Button size="sm" color="danger" onClick={() => removeAbono(index)} disabled={loading}>
                        <FaTrashAlt />
                      </Button>
                    </Col>
                  </Row>
                ))}
                <Button color="info" size="sm" onClick={addAbono} className="mt-1" disabled={loading}>
                  + Agregar Abono
                </Button>
              </Col>
            </Row>
            <Row className="mt-3">
              <Col md={6}>
                <Label for="remaining">
                  <b>Restante*</b>
                </Label>
                <Input
                  id="remaining"
                  name="remaining"
                  type="number"
                  value={form.remaining}
                  readOnly
                  invalid={!!errors.remaining}
                />
                {errors.remaining && <FormFeedback>{errors.remaining}</FormFeedback>}
              </Col>
              <Col md={6}>
                <Label for="paymentMethod">
                  <b>Forma de Pago*</b>
                </Label>
                <Input
                  id="paymentMethod"
                  name="paymentMethod"
                  type="select"
                  value={form.paymentMethod}
                  onChange={handleChange}
                  invalid={!!errors.paymentMethod}
                  disabled={loading}
                >
                  <option value="">Seleccione...</option>
                  <option value="Bancolombia">Bancolombia</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Tarjeta">Tarjeta</option>
                  <option value="Nequi">Nequi</option>
                  <option value="Daviplata">Daviplata</option>
                </Input>
                {errors.paymentMethod && <FormFeedback>{errors.paymentMethod}</FormFeedback>}
              </Col>
            </Row>
          </FormGroup>

          {/* --- Estado Visual --- */}
          <FormGroup tag="fieldset" className="border p-3">
            <legend className="w-auto px-2" style={{ fontSize: "1rem", fontWeight: "bold" }}>
              Estado de la Reserva
            </legend>
            <Row>
              <Col md={12}>
                <Label for="status">
                  <b>Estado (Visual)</b>
                </Label>
                <Input
                  id="status"
                  name="status"
                  type="select"
                  value={form.status}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="confirmada">Confirmada</option>
                  <option value="en_proceso">En Proceso</option>
                  <option value="terminada">Terminada</option>
                  <option value="anulada">Anulada</option>
                </Input>
              </Col>
            </Row>
          </FormGroup>
        </ModalBody>
        {/* --- Footer del Modal con Botones --- */}
        <ModalFooter>
          <Button style={{ background: "#2e8329", color: "white" }} onClick={handleSaveReserva} disabled={loading}>
            {loading ? <Spinner size="sm" /> : selectedReserva ? "Guardar Cambios" : "Crear Reserva"}
          </Button>
          {selectedReserva && (
            <Button color="danger" onClick={() => handleCancel(selectedReserva.id)} disabled={loading}>
              {loading ? <Spinner size="sm" /> : "Eliminar Reserva"}
            </Button>
          )}
          <Button
            style={{ background: "#6d0f0f", color: "white" }}
            onClick={() => setModalOpen(false)}
            disabled={loading}
          >
            Cerrar
          </Button>
        </ModalFooter>
      </Modal>
    </Container>
  )
}