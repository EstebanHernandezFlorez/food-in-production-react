import React, { useEffect, useState, useCallback } from "react";
import {
  Container, Button, FormGroup, Input, Modal, ModalHeader, ModalBody, ModalFooter,
  Row, Col, Label, InputGroup, InputGroupText, Spinner, FormFeedback, ListGroup, ListGroupItem
} from 'reactstrap';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from "@fullcalendar/interaction";
import { utils, writeFile } from "xlsx";
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import { FaSearch, FaFileExcel, FaTrashAlt } from 'react-icons/fa';
import Select from 'react-select'; // Importación para el selector múltiple

// --- IMPORTAR SERVICIOS REALES ---
// ¡¡VERIFICA QUE ESTAS RUTAS SEAN CORRECTAS PARA TU ESTRUCTURA DE PROYECTO!!
import reservasService from '../../services/reservasService';
import clientesService from '../../services/clientesService';
import serviciosService from '../../services/serviciosService';

// --- ESTADO INICIAL DEL FORMULARIO ---
const emptyForm = {
  id: null,
  customerId: null,
  nombre: '',
  distintivo: '',
  categoriaCliente: '',
  correo: '',
  celular: '',
  direccion: '',
  evento: '',
  fechaHora: '',
  duracionEvento: '',
  tipoEvento: '',
  nroPersonas: '',
  observaciones: '',
  servicios: [], // Array de OBJETOS {value, label} para react-select
  montoDecoracion: '',
  abonos: [], // Array de objetos { fecha: '', cantidad: '' }
  totalPago: '',
  restante: '', // Calculado
  formaPago: '',
  estado: 'pendiente' // Estado workflow/visual
};

// --- COMPONENTE PRINCIPAL ---
// Asegúrate que el nombre de la función coincide con el export default si es necesario
export default function Calendario() {
  // --- Estados del Componente ---
  const [data, setData] = useState([]); // Almacena las reservas cargadas
  const [availableServices, setAvailableServices] = useState([]); // Servicios disponibles para el Select
  const [selectedReserva, setSelectedReserva] = useState(null); // Reserva en edición (o null si es nueva)
  const [modalOpen, setModalOpen] = useState(false); // Visibilidad del modal
  const [form, setForm] = useState(emptyForm); // Estado del formulario del modal
  const [errors, setErrors] = useState({}); // Errores de validación del form
  const [searchText, setSearchText] = useState(''); // Búsqueda en el calendario
  // Estados para búsqueda de cliente integrada
  const [clientSearchText, setClientSearchText] = useState('');
  const [clientSearchResults, setClientSearchResults] = useState([]);
  const [showClientSearch, setShowClientSearch] = useState(false); // Mostrar/ocultar resultados búsqueda
  const [isClientSearchLoading, setIsClientSearchLoading] = useState(false); // Cargando búsqueda cliente
  const [loading, setLoading] = useState(true); // Carga general

  // --- Opciones formateadas para react-select a partir de los servicios disponibles ---
  const serviceOptions = availableServices.map(service => ({
    value: service.id,
    label: service.Nombre || service.name || `Servicio ${service.id}` // Nombre a mostrar
  }));

  // --- FUNCIÓN PARA CARGAR DATOS INICIALES (Reservas y Servicios) ---
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [fetchedReservations, fetchedServices] = await Promise.all([
        reservasService.getAllReservations(),
        serviciosService.getAllServicios()
      ]);
      setData(fetchedReservations || []);
      setAvailableServices(fetchedServices || []);
      console.log("Datos iniciales cargados:", { reservations: fetchedReservations?.length, services: fetchedServices?.length });
    } catch (error) {
      console.error("Error fetching initial data:", error);
      Swal.fire("Error Carga Inicial", `No se pudieron cargar los datos: ${error?.message || 'Error desconocido'}`, "error");
      setData([]);
      setAvailableServices([]);
    } finally {
      setLoading(false);
    }
  }, []); // useCallback con [] para que se cree solo una vez

  // --- useEffect PARA CARGAR DATOS AL MONTAR EL COMPONENTE ---
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]); // Ejecutar cuando loadInitialData cambia (solo al montar)

  // --- Abrir modal para NUEVA reserva ---
  const handleDateClick = (arg) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const clickedDate = new Date(arg.dateStr); clickedDate.setHours(0, 0, 0, 0);
    if (clickedDate < today) {
      Swal.fire("Fecha Inválida", "No se pueden crear reservas en fechas pasadas.", "warning");
      return;
    }
    setSelectedReserva(null); // Indicar que es nueva
    const defaultTime = 'T09:00'; // Hora por defecto
    setForm({ ...emptyForm, fechaHora: arg.dateStr + defaultTime }); // Resetear form + fecha
    setErrors({}); // Limpiar errores
    setClientSearchText(''); // Limpiar búsqueda de cliente
    setClientSearchResults([]);
    setShowClientSearch(false);
    setModalOpen(true); // Abrir modal
  };

  // --- Abrir modal para EDITAR reserva ---
  const handleEventClick = (info) => {
    const reservaId = parseInt(info.event.id, 10);
    const reserva = data.find(res => res.id === reservaId);
    if (reserva) {
      setSelectedReserva(reserva); // Indicar que se edita

      // Formatear servicios para react-select
      const selectedServiceValues = (Array.isArray(reserva.servicios) ? reserva.servicios : [])
        .map(service => {
          if (typeof service === 'object' && service !== null && service.id) {
            return { value: service.id, label: service.Nombre || service.name || `Servicio ${service.id}` };
          }
          const foundService = availableServices.find(s => s.id === service);
          return foundService ? { value: foundService.id, label: foundService.Nombre || foundService.name || `Servicio ${foundService.id}` } : null;
        })
        .filter(option => option !== null);

      // Llenar formulario (incluyendo datos del cliente y servicios formateados)
      setForm({
        ...emptyForm, ...reserva,
        customerId: reserva.customerId || reserva.idCustomers || (reserva.Customer ? reserva.Customer.id : null),
        servicios: selectedServiceValues,
        abonos: Array.isArray(reserva.abonos) ? reserva.abonos : []
      });
      setErrors({}); // Limpiar errores
      setClientSearchText(''); // Limpiar búsqueda de cliente
      setClientSearchResults([]);
      setShowClientSearch(false);
      setModalOpen(true); // Abrir modal
    } else {
      console.error("Reserva no encontrada para editar. ID:", reservaId);
      Swal.fire("Error", "No se pudo encontrar la reserva seleccionada.", "error");
    }
  };

  // --- REPROGRAMAR reserva (Drag & Drop) ---
  const handleEventDrop = async (info) => {
    const { event } = info;
    const reservaId = parseInt(event.id, 10);
    const reservaOriginal = data.find(res => res.id === reservaId);

    if (!reservaOriginal) {
      console.error("Error: No se encontró reserva original para reprogramar. ID:", reservaId);
      Swal.fire("Error Interno", "No se pudo encontrar la reserva.", "error");
      return;
    }

    const newStartDate = new Date(event.start);
    const today = new Date(); today.setHours(0, 0, 0, 0);

    if (newStartDate < today) {
      Swal.fire("Error", "No se pueden reprogramar a fechas pasadas.", "error");
      info.revert(); return;
    }

    const conflictingReserva = data.find(res =>
      res.id !== reservaId &&
      new Date(res.fechaHora).toDateString() === newStartDate.toDateString()
    );

    if (conflictingReserva) {
      Swal.fire("Conflicto", "Ya existe otra reserva en esta fecha.", "error");
      info.revert(); return;
    }

    // Asegurar enviar todos los datos necesarios para la actualización
    const updatedReservaData = {
      ...reservaOriginal,
      // Convertir servicios de {value, label} a IDs si es necesario para la API de update
      // Si la API de update espera IDs:
      // servicios: (reservaOriginal.servicios || []).map(s => typeof s === 'object' ? s.value : s),
      fechaHora: event.start.toISOString().slice(0, 16)
    };
     // Si la API espera objetos {value, label}, no necesitas convertir `servicios`
     // const updatedReservaData = { ...reservaOriginal, fechaHora: event.start.toISOString().slice(0, 16) };


    try {
      setLoading(true);
      await reservasService.updateReservation(reservaId, updatedReservaData);
      // Actualizar estado local. IMPORTANTE: mantener el formato correcto para servicios en el estado local
      setData(prevData => prevData.map(res => res.id === reservaId ? { ...updatedReservaData, servicios: reservaOriginal.servicios } : res)); // Mantener formato original de servicios
      Swal.fire("Reserva reprogramada", "La reserva se actualizó.", "success");
    } catch (error) {
      console.error("Error updating reservation on drop:", error);
      Swal.fire("Error", "No se pudo reprogramar la reserva.", "error");
      info.revert();
    } finally {
      setLoading(false);
    }
  };

  // --- Mapeo de colores y eventos para FullCalendar ---
  const colorMap = { terminada: '#28a745', anulada: '#dc3545', pendiente: '#ffc107', en_proceso: '#fd7e14', confirmada: '#007bff' };
  const events = data.map(reserva => ({ id: reserva.id.toString(), title: reserva.nombre || reserva.evento || `Reserva ${reserva.id}`, start: reserva.fechaHora, backgroundColor: colorMap[reserva.estado] || '#6c757d', borderColor: colorMap[reserva.estado] || '#6c757d', textColor: reserva.estado === 'pendiente' ? '#212529' : '#ffffff' }));
  const handleSearchChange = (e) => { setSearchText(e.target.value); };
  const filteredEvents = events.filter(event => event.title.toLowerCase().includes(searchText.toLowerCase()));

  // --- BÚSQUEDA DE CLIENTES ---
  const handleClientSearch = async (e) => { // Quitamos el tipado TS
    const searchValue = e.target.value;
    setClientSearchText(searchValue);
    setShowClientSearch(true);
    console.log("Buscando cliente con término:", searchValue);
    if (searchValue.length < 2) {
        setClientSearchResults([]);
        setErrors(prev => ({ ...prev, clientSearch: searchValue.length > 0 ? 'Mínimo 2 caracteres' : '' }));
        return;
    }
    setIsClientSearchLoading(true);
    setErrors(prev => ({ ...prev, clientSearch: '' }));
    try {
      const results = await clientesService.searchClientes(searchValue); // Llamada real al servicio
      console.log("Resultados búsqueda cliente:", results);
      setClientSearchResults(results || []);
      if (!results || results.length === 0) {
          setErrors(prev => ({ ...prev, clientSearch: 'No se encontraron clientes.' }));
      }
    } catch (error) { // Quitamos el tipado TS
      console.error("Error searching clients:", error);
      setErrors(prev => ({ ...prev, clientSearch: `Error: ${error?.message || 'No se pudo buscar'}` }));
      setClientSearchResults([]);
    } finally {
      setIsClientSearchLoading(false);
    }
  };

  // --- SELECCIONAR CLIENTE ---
  const selectClient = (cliente) => { // Quitamos el tipado TS
    console.log("Cliente seleccionado:", cliente);
    setForm(prevForm => ({
      ...prevForm, customerId: cliente.id, nombre: cliente.NombreCompleto || '',
      distintivo: cliente.Distintivo || '', categoriaCliente: cliente.CategoriaCliente || '',
      correo: cliente.Correo || '', celular: cliente.Celular || '', direccion: cliente.Direccion || '',
    }));
    setClientSearchText(''); setClientSearchResults([]); setShowClientSearch(false);
    setErrors(prev => ({ ...prev, customerId: '', clientSearch: '' }));
  };

  // --- MANEJO DE ABONOS ---
  const handleAbonoChange = (index, field, value) => {
    const updatedAbonos = form.abonos.map((abono, i) => i === index ? { ...abono, [field]: value } : abono);
    setForm(prevForm => ({ ...prevForm, abonos: updatedAbonos }));
    if (field === 'cantidad') { updateRestante(form.totalPago, updatedAbonos); }
    setErrors(prevErrors => ({ ...prevErrors, [`abono-${index}-${field}`]: validateAbonoField(field, value) }));
  };
  const addAbono = () => {
    setForm(prevForm => ({ ...prevForm, abonos: [...(prevForm.abonos || []), { fecha: '', cantidad: '' }] }));
    setErrors(prevErrors => ({ ...prevErrors, abonos: '' }));
  };
  const removeAbono = (index) => {
    const updatedAbonos = (form.abonos || []).filter((_, i) => i !== index);
    setForm(prevForm => ({ ...prevForm, abonos: updatedAbonos }));
    updateRestante(form.totalPago, updatedAbonos);
    setErrors(prevErrors => { const newErrors = { ...prevErrors }; delete newErrors[`abono-${index}-fecha`]; delete newErrors[`abono-${index}-cantidad`]; return newErrors; });
  };
  const updateRestante = useCallback((totalPago, abonos) => {
    const totalAbonosNum = (abonos || []).reduce((sum, abono) => sum + parseFloat(abono.cantidad || 0), 0);
    const totalPagoNum = parseFloat(totalPago || 0);
    const restanteNum = totalPagoNum - totalAbonosNum;
    const restanteFormatted = isNaN(restanteNum) ? '' : restanteNum.toFixed(0);
    setForm(prevForm => ({ ...prevForm, restante: restanteFormatted }));
    setErrors(prevErrors => ({ ...prevErrors, restante: validateField('restante', restanteFormatted) }));
  }, []);

  // --- MANEJO DE SELECCIÓN DE SERVICIOS (react-select) ---
  const handleMultiServiceChange = (selectedOptions) => {
    setForm(prevForm => ({ ...prevForm, servicios: selectedOptions || [] })); // Guardar array {value, label}
    setErrors(prevErrors => ({ ...prevErrors, servicios: validateField('servicios', selectedOptions || []) }));
  };

   // --- VALIDACIÓN ---
   const validateAbonoField = (fieldName, value) => {
     if (fieldName === 'fecha' && !value) return 'Fecha req.';
     if (fieldName === 'cantidad') { const numValue = parseFloat(value); if (isNaN(numValue) || numValue <= 0) return 'Cantidad > 0.'; }
     return '';
   };
   const validateField = (name, value) => {
     if (name === 'customerId' && !value) return 'Debe seleccionar un cliente.';
     // Descomentar si servicios son obligatorios
     // if (name === 'servicios' && (!Array.isArray(value) || value.length === 0)) { return 'Seleccione al menos un servicio.'; }

    switch (name) {
      case 'nombre': return value.trim() ? '' : 'Nombre es requerido.'; // Cliente
      case 'evento': return value.trim() && value.length <= 100 ? '' : 'Asunto/Evento requerido (máx 100).';
      case 'fechaHora': if (!value) return 'Fecha y hora requeridas.'; return new Date(value) > new Date() ? '' : 'Fecha/hora debe ser futura.';
      case 'duracionEvento': return value ? '' : 'Duración requerida.';
      case 'tipoEvento': return value ? '' : 'Tipo de Evento requerido.';
      case 'nroPersonas': return parseInt(value) > 0 ? '' : 'Nro. Personas > 0.';
      case 'montoDecoracion': return !isNaN(parseFloat(value)) && parseFloat(value) >= 0 ? '' : 'Monto Decoración >= 0.';
      case 'totalPago': return !isNaN(parseFloat(value)) && parseFloat(value) > 0 ? '' : 'Total a Pagar > 0.';
      case 'restante': return !isNaN(parseFloat(value)) && parseFloat(value) >= 0 ? '' : 'Restante >= 0.';
      case 'formaPago': return value ? '' : 'Forma de Pago requerida.';
      // Campos cliente (solo formato si existen, ya que vienen de selección)
      case 'distintivo': return !value || value.trim() ? '' : 'Distintivo inválido.';
      case 'categoriaCliente': return !value || value ? '' : 'Categoría inválida.';
      case 'celular': return !value || /^\d{7,15}$/.test(value) ? '' : 'Celular inválido (7-15 dígitos).';
      case 'correo': return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : 'Correo inválido.';
      case 'direccion': return !value || value.trim() ? '' : 'Dirección inválida.';
      default: return '';
    }
   };
   const validateForm = () => {
     const newErrors = {}; let isValid = true;
     const fieldsToValidate = [ 'customerId', 'evento', 'fechaHora', 'duracionEvento', 'tipoEvento', 'nroPersonas', 'montoDecoracion', 'totalPago', 'restante', 'formaPago' /*, 'servicios'*/ ];
     const clientFields = ['nombre']; // Verificar que al menos el nombre esté (indicador de cliente seleccionado)
     [...fieldsToValidate, ...clientFields].forEach(key => { const error = validateField(key, form[key]); if (error) { newErrors[key] = error; isValid = false; } });
     // Validar Abonos
     if (!form.abonos || form.abonos.length === 0) { newErrors.abonos = 'Agregar al menos un abono.'; isValid = false; }
     else { form.abonos.forEach((abono, i) => { const fe = validateAbonoField('fecha', abono.fecha); const ce = validateAbonoField('cantidad', abono.cantidad); if (fe) newErrors[`abono-${i}-fecha`] = fe; if (ce) newErrors[`abono-${i}-cantidad`] = ce; if (fe || ce) isValid = false; }); }
     setErrors(newErrors); return isValid;
   };

  // --- Cambio General en campos del Formulario ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedForm = { ...form, [name]: value };
    setForm(updatedForm);
    if (name === 'totalPago') { updateRestante(value, updatedForm.abonos); }
    // Validar el campo que cambió
    setErrors(prevErrors => ({ ...prevErrors, [name]: validateField(name, value),
      // Limpiar errores de abono si cambia otro campo
      ...(name !== 'abonos' && Object.keys(prevErrors).filter(k => k.startsWith('abono-')).reduce((acc, key) => ({ ...acc, [key]: undefined }), {}))
    }));
  };

  // --- GUARDAR (Crear o Editar) ---
  const handleSaveReserva = async () => {
     if (!validateForm()) { Swal.fire("Error Validación", "Corrija los errores indicados.", "warning"); return; }
     const isEditing = selectedReserva !== null;
     const result = await Swal.fire({ title: isEditing ? '¿Guardar Cambios?' : '¿Crear Reserva?', icon: 'question', showCancelButton: true, confirmButtonColor: '#3085d6', cancelButtonColor: '#d33', confirmButtonText: 'Sí', cancelButtonText: 'No' });

     if (result.isConfirmed) {
         setLoading(true);
         try {
             // Convertir servicios de {value, label} a [id] antes de enviar
             const serviceIds = (form.servicios || []).map(option => option.value);
             // Asegurarse que abonos tengan formato numérico si es necesario
             const abonosToSend = (form.abonos || []).map(ab => ({
                 fecha: ab.fecha,
                 cantidad: parseFloat(ab.cantidad || 0) // Convertir a número
             }));

             const dataToSend = { ...form, servicios: serviceIds, abonos: abonosToSend };

             if (isEditing) {
                 await reservasService.updateReservation(selectedReserva.id, dataToSend);
                 // Actualizar estado local manteniendo el formato {value, label} para servicios
                 setData(prevData => prevData.map(r => r.id === selectedReserva.id ? { ...dataToSend, id: selectedReserva.id, servicios: form.servicios, abonos: form.abonos } : r));
                 Swal.fire("Actualizado", "Reserva actualizada.", "success");
             } else {
                 const newReservation = await reservasService.createReservation(dataToSend);
                 // Poner formato {value, label} en el estado local para servicios
                 const newReservationForState = { ...newReservation, servicios: form.servicios, abonos: form.abonos };
                 setData(prevData => [...prevData, newReservationForState]);
                 Swal.fire("Creada", "Reserva creada.", "success");
             }
             setModalOpen(false);
         } catch (error) { // Quitamos tipado TS
            console.error("Error saving reservation:", error);
            const errorMessage = error.response?.data?.message || error.message || "No se pudo guardar la reserva.";
            Swal.fire("Error", errorMessage, "error");
         } finally { setLoading(false); }
     }
  };

  // --- CANCELAR (Eliminar) ---
  const handleCancel = async (id) => {
     if (!id) return;
     const result = await Swal.fire({ title: '¿ELIMINAR Reserva?', text: "¡Acción irreversible!", icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6', confirmButtonText: 'Sí, eliminar', cancelButtonText: 'No' });
     if (result.isConfirmed) {
         setLoading(true);
         try {
             const response = await reservasService.deleteReservation(id);
             if (response && response.success !== false) {
                setData(prevData => prevData.filter(reserva => reserva.id !== id));
                setModalOpen(false);
                Swal.fire("Eliminada", response.message || "Reserva eliminada.", "success");
             } else { Swal.fire("Error", response?.message || "No se pudo eliminar.", "error"); }
         } catch (error) { // Quitamos tipado TS
             console.error("Error deleting reservation:", error);
             const errorMessage = error.response?.data?.message || error.message || "Error al eliminar.";
             Swal.fire("Error", errorMessage, "error");
         } finally { setLoading(false); }
     }
  };

  // --- Descargar Excel ---
  const handleDownloadExcel = () => {
    if (data.length === 0) { Swal.fire("Vacío", "No hay datos.", "info"); return; }
    const dataToExport = data.map(r => ({ ID: r.id, Cliente: r.nombre, Asunto: r.evento, Fecha_Hora: r.fechaHora, Duracion: r.duracionEvento, Tipo: r.tipoEvento, Personas: r.nroPersonas, Total: r.totalPago, Restante: r.restante, Pago: r.formaPago, Estado: r.estado }));
    const ws = utils.json_to_sheet(dataToExport); const wb = utils.book_new(); utils.book_append_sheet(wb, ws, 'Reservas'); writeFile(wb, 'Reservas.xlsx');
  };

  // --- Formato de Moneda ---
  const formatCurrency = (value) => { const n = parseFloat(value); return isNaN(n) ? '' : new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n); };

  // --- RENDERIZADO DEL COMPONENTE ---
  return (
    <Container fluid className="p-0">
      {/* --- Indicador de Carga General --- */}
      {loading && ( <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(255, 255, 255, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}> <Spinner color="primary" style={{ width: '3rem', height: '3rem' }} /> <span className="ms-2">Cargando...</span> </div> )}

      {/* --- Encabezado y Botones --- */}
      <Row className="mb-3 align-items-center">
          <Col> <h2>Calendario de Reservas</h2> </Col>
          <Col xs="auto"> <Button color="success" onClick={handleDownloadExcel} disabled={data.length === 0 || loading}> <FaFileExcel className="me-2" /> Descargar Excel </Button> </Col>
      </Row>

      {/* --- Búsqueda Principal Calendario--- */}
      <Row className="mb-3">
          <Col> <Input type="text" style={{ width: '300px' }} placeholder="Buscar por nombre/evento..." value={searchText} onChange={handleSearchChange} disabled={loading} /> </Col>
      </Row>

      {/* --- Calendario --- */}
      <Row>
          <Col>
            <div style={{ height: 'calc(100vh - 250px)', position: 'relative' }}>
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
                      buttonText={{ today: 'Hoy' }}
                      height="100%"
                  />
               ) : (
                   <p className="text-center mt-5">{loading ? '' : 'No hay reservas para mostrar.'}</p>
               )}
            </div>
          </Col>
      </Row>

      {/* --- MODAL PARA CREAR/EDITAR RESERVA --- */}
      <Modal isOpen={modalOpen} toggle={() => !loading && setModalOpen(!modalOpen)} size="lg" backdrop="static" scrollable>
        <ModalHeader toggle={() => !loading && setModalOpen(!modalOpen)} style={{background:'#6d0f0f', color: 'white'}}>
            {selectedReserva ? 'Editar Reserva' : 'Nueva Reserva'}
        </ModalHeader>
        <ModalBody>
          {/* --- Datos del Cliente (CON BÚSQUEDA INTEGRADA) --- */}
          <FormGroup tag="fieldset" className="border p-3 mb-3">
            <legend className="w-auto px-2" style={{fontSize: '1rem', fontWeight: 'bold'}}>Datos del Cliente</legend>
            <Row>
              <Col md={7} style={{ position: 'relative' }}>
                <Label for="clienteBusqueda"><b>Buscar Cliente*</b></Label>
                <InputGroup>
                  <Input id="clienteBusqueda" type="text" placeholder="Buscar por nombre o distintivo..." value={clientSearchText} onChange={handleClientSearch} onFocus={() => setShowClientSearch(true)} onBlur={() => setTimeout(() => setShowClientSearch(false), 200)} disabled={loading || isClientSearchLoading} invalid={!!errors.customerId && !form.customerId}/>
                  <InputGroupText> {isClientSearchLoading ? <Spinner size="sm" /> : <FaSearch />} </InputGroupText>
                </InputGroup>
                {errors.customerId && !form.customerId && <FormFeedback style={{ display: 'block' }}>{errors.customerId}</FormFeedback>}
                {showClientSearch && (clientSearchResults.length > 0 || errors.clientSearch) && (
                   <ListGroup style={{ position: 'absolute', top: 'calc(100% - 10px)', left: '15px', right: '15px', zIndex: 10, maxHeight: '150px', overflowY: 'auto', border: '1px solid #ccc', borderRadius: '0 0 0.25rem 0.25rem', background: 'white' }}>
                    {clientSearchResults.map(cliente => ( <ListGroupItem key={cliente.id} action tag="button" onClick={() => selectClient(cliente)} style={{ textAlign: 'left', width: '100%', fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}> {cliente.NombreCompleto} ({cliente.Distintivo}) </ListGroupItem> ))}
                    {errors.clientSearch && <ListGroupItem className="text-danger small" style={{ fontStyle: 'italic' }}>{errors.clientSearch}</ListGroupItem>}
                   </ListGroup>
                )}
              </Col>
              <Col md={5}>
                 <Label for="categoriaClienteDisplay"><b>Categoría</b></Label>
                 <Input id="categoriaClienteDisplay" name="categoriaCliente" value={form.categoriaCliente} readOnly disabled/>
              </Col>
               <Col md={12} className="mt-2">
                   <Input bsSize="sm" type="text" value={form.nombre ? `Seleccionado: ${form.nombre} (ID: ${form.customerId})` : 'Ningún cliente seleccionado'} readOnly disabled title={form.nombre ? `ID: ${form.customerId}` : ''}/>
               </Col>
            </Row>
          </FormGroup>

          {/* --- Detalles de la Reserva --- */}
          <FormGroup tag="fieldset" className="border p-3 mb-3">
            <legend className="w-auto px-2" style={{fontSize: '1rem', fontWeight: 'bold'}}>Detalles de la Reserva</legend>
            <Row>
                <Col md={6}> <Label for="evento"><b>Asunto/Evento*</b></Label> <Input id="evento" name="evento" type="text" value={form.evento} onChange={handleChange} invalid={!!errors.evento} disabled={loading}/> {errors.evento && <FormFeedback>{errors.evento}</FormFeedback>} </Col>
                <Col md={6}> <Label for="fechaHora"><b>Fecha y Hora*</b></Label> <Input id="fechaHora" name="fechaHora" type="datetime-local" value={form.fechaHora} onChange={handleChange} invalid={!!errors.fechaHora} disabled={loading}/> {errors.fechaHora && <FormFeedback>{errors.fechaHora}</FormFeedback>} </Col>
            </Row>
            <Row className="mt-3">
                <Col md={6}> <Label for="duracionEvento"><b>Duración (HH:MM)*</b></Label> <Input id="duracionEvento" name="duracionEvento" type="time" value={form.duracionEvento} onChange={handleChange} invalid={!!errors.duracionEvento} step="1800" disabled={loading}/> {errors.duracionEvento && <FormFeedback>{errors.duracionEvento}</FormFeedback>} </Col>
                <Col md={6}> <Label for="tipoEvento"><b>Tipo de Evento*</b></Label> <Input id="tipoEvento" name="tipoEvento" type="select" value={form.tipoEvento} onChange={handleChange} invalid={!!errors.tipoEvento} disabled={loading}> <option value="">Seleccione...</option> <option value="Empresarial">Empresarial</option> <option value="Cumpleaños">Cumpleaños</option> <option value="Grado">Grado</option> <option value="Aniversario">Aniversario</option> <option value="Bautizo">Bautizo</option> <option value="PrimeraComunion">Primera Comunión</option> <option value="Matrimonio">Matrimonio</option> </Input> {errors.tipoEvento && <FormFeedback>{errors.tipoEvento}</FormFeedback>} </Col>
            </Row>
            <Row className="mt-3">
                <Col md={6}> <Label for="nroPersonas"><b>Número de Personas*</b></Label> <Input id="nroPersonas" name="nroPersonas" type="number" value={form.nroPersonas} onChange={handleChange} invalid={!!errors.nroPersonas} min="1" disabled={loading}/> {errors.nroPersonas && <FormFeedback>{errors.nroPersonas}</FormFeedback>} </Col>
                <Col md={6}> <Label for="observaciones"><b>Observaciones</b></Label> <Input id="observaciones" name="observaciones" type="textarea" value={form.observaciones} onChange={handleChange} rows="1" disabled={loading}/> </Col>
            </Row>
          </FormGroup>

          {/* --- Servicios Adicionales --- */}
          <FormGroup tag="fieldset" className="border p-3 mb-3">
            <legend className="w-auto px-2" style={{fontSize: '1rem', fontWeight: 'bold'}}>Servicios Adicionales</legend>
            <Select id="servicios" name="servicios" options={serviceOptions} isMulti onChange={handleMultiServiceChange} value={form.servicios} placeholder="Seleccione servicios..." isLoading={loading && availableServices.length === 0} isDisabled={loading} closeMenuOnSelect={false} styles={{ control: (base, status) => ({ ...base, borderColor: errors.servicios ? '#dc3545' : '#ced4da' }) }} /> {errors.servicios && <div className="text-danger mt-1 small">{errors.servicios}</div>}
          </FormGroup>

          {/* --- Detalles de Pago y Abonos --- */}
          <FormGroup tag="fieldset" className="border p-3 mb-3">
             <legend className="w-auto px-2" style={{fontSize: '1rem', fontWeight: 'bold'}}>Detalles de Pago</legend>
             <Row>
                 <Col md={6}> <Label for="montoDecoracion"><b>Monto Decoración*</b></Label> <Input id="montoDecoracion" name="montoDecoracion" type="number" value={form.montoDecoracion} onChange={handleChange} invalid={!!errors.montoDecoracion} min="0" disabled={loading}/> {errors.montoDecoracion && <FormFeedback>{errors.montoDecoracion}</FormFeedback>} </Col>
                 <Col md={6}> <Label for="totalPago"><b>Total a Pagar*</b></Label> <Input id="totalPago" name="totalPago" type="number" value={form.totalPago} onChange={handleChange} invalid={!!errors.totalPago} min="0" disabled={loading}/> {errors.totalPago && <FormFeedback>{errors.totalPago}</FormFeedback>} </Col>
             </Row>
             <Row className="mt-3">
                 <Col md={12}> <Label><b>Abonos*</b></Label> {errors.abonos && <div className="text-danger mb-2 small">{errors.abonos}</div>} {(form.abonos || []).map((abono, index) => ( <Row key={index} className="mb-2 align-items-center"> <Col md={5}> <Input type="date" value={abono.fecha} onChange={(e) => handleAbonoChange(index, 'fecha', e.target.value)} invalid={!!errors[`abono-${index}-fecha`]} disabled={loading} /> {errors[`abono-${index}-fecha`] && <FormFeedback>{errors[`abono-${index}-fecha`]}</FormFeedback>} </Col> <Col md={5}> <Input type="number" placeholder="Cantidad" value={abono.cantidad} onChange={(e) => handleAbonoChange(index, 'cantidad', e.target.value)} invalid={!!errors[`abono-${index}-cantidad`]} min="1" disabled={loading} /> {errors[`abono-${index}-cantidad`] && <FormFeedback>{errors[`abono-${index}-cantidad`]}</FormFeedback>} </Col> <Col md={2}> <Button size="sm" color="danger" onClick={() => removeAbono(index)} disabled={loading}> <FaTrashAlt /> </Button> </Col> </Row> ))} <Button color="info" size="sm" onClick={addAbono} className="mt-1" disabled={loading}>+ Agregar Abono</Button> </Col>
             </Row>
             <Row className="mt-3">
                 <Col md={6}> <Label for="restante"><b>Restante*</b></Label> <Input id="restante" name="restante" type="number" value={form.restante} readOnly invalid={!!errors.restante}/> {errors.restante && <FormFeedback>{errors.restante}</FormFeedback>} </Col>
                 <Col md={6}> <Label for="formaPago"><b>Forma de Pago*</b></Label> <Input id="formaPago" name="formaPago" type="select" value={form.formaPago} onChange={handleChange} invalid={!!errors.formaPago} disabled={loading}> <option value="">Seleccione...</option> <option value="Bancolombia">Bancolombia</option> <option value="Efectivo">Efectivo</option> <option value="Tarjeta">Tarjeta</option> <option value="Nequi">Nequi</option> <option value="Daviplata">Daviplata</option> </Input> {errors.formaPago && <FormFeedback>{errors.formaPago}</FormFeedback>} </Col>
             </Row>
          </FormGroup>

          {/* --- Estado Visual --- */}
          <FormGroup tag="fieldset" className="border p-3">
             <legend className="w-auto px-2" style={{fontSize: '1rem', fontWeight: 'bold'}}>Estado de la Reserva</legend>
             <Row>
                 <Col md={12}> <Label for="estado"><b>Estado (Visual)</b></Label> <Input id="estado" name="estado" type="select" value={form.estado} onChange={handleChange} disabled={loading}> <option value="pendiente">Pendiente</option> <option value="confirmada">Confirmada</option> <option value="en_proceso">En Proceso</option> <option value="terminada">Terminada</option> <option value="anulada">Anulada</option> </Input> </Col>
             </Row>
          </FormGroup>

        </ModalBody>
        {/* --- Footer del Modal con Botones --- */}
        <ModalFooter>
            <Button style={{ background: '#2e8329', color: 'white' }} onClick={handleSaveReserva} disabled={loading}> {loading ? <Spinner size="sm"/> : (selectedReserva ? 'Guardar Cambios' : 'Crear Reserva')} </Button>
            {selectedReserva && ( <Button color="danger" onClick={() => handleCancel(selectedReserva.id)} disabled={loading}> {loading ? <Spinner size="sm"/> : 'Eliminar Reserva'} </Button> )}
            <Button style={{background:'#6d0f0f', color: 'white'}} onClick={() => setModalOpen(false)} disabled={loading}>Cerrar</Button>
        </ModalFooter>
      </Modal>
    </Container>
  );
}