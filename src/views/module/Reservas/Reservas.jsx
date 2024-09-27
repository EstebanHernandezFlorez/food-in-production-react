import React, { useEffect, useState } from "react";
import { Container, Button, FormGroup, Input, Modal, ModalHeader, ModalBody, ModalFooter, Row, Col, Label, InputGroup, InputGroupText } from 'reactstrap';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from "@fullcalendar/interaction";
import { utils, writeFile } from "xlsx";
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import { FaSearch, FaTrash, FaFileExcel } from 'react-icons/fa';

const initialReservas = [
  {
    id: 1,
    nombre: "Boda Juan y María",
    distintivo: "7867",
    categoriaCliente: "Privado",
    correo: "juan.maria@example.com",
    celular: "1234567890",
    direccion: "Cl 76 j 12b 55",
    evento: "Boda",
    fechaHora: "2024-09-01T18:00",
    cantidadMesas: "15",
    duracionEvento: "5",
    tipoEvento: "Celebración",
    nroPersonas: "150",
    observaciones: "Decoración elegante",
    servicios: "DJ, Fotografía",
    montoDecoracion: "200000",
    abonos: [{ fecha: "2024-08-01", cantidad: "500000" }],
    totalPago: "1500000",
    restante: "1000000",
    formaPago: "Tarjeta",
    estado: "terminada"
  },
  {
    id: 2,
    nombre: "Fiesta de Empresa",
    distintivo: "7576",
    categoriaCliente: "Corporativo",
    correo: "empresa@example.com",
    celular: "0987654321",
    direccion: "Avenida Siempre Viva 456",
    evento: "Corporativo",
    fechaHora: "2024-09-15T20:00",
    cantidadMesas: "20",
    duracionEvento: "6",
    tipoEvento: "Conferencia",
    nroPersonas: "200",
    observaciones: "Requiere equipo audiovisual",
    servicios: "Catering, Audio",
    montoDecoracion: "300000",
    abonos: [{ fecha: "2024-08-15", cantidad: "700000" }],
    totalPago: "2000000",
    restante: "1300000",
    formaPago: "Transferencia",
    estado: "confirmada"
  }
];

const mockClientes = [
  { id: 1, nombre: "Juan Pérez", distintivo: "7867", categoriaCliente: "VIP", correo: "juan@example.com", celular: "1234567890", direccion: "Calle 123" },
  { id: 2, nombre: "María López", distintivo: "7576", categoriaCliente: "Regular", correo: "maria@example.com", celular: "0987654321", direccion: "Avenida 456" },
];

const emptyForm = {
  id: '',
  nombre: '',
  distintivo: '',
  categoriaCliente: '',
  correo: '',
  celular: '',
  direccion: '',
  evento: '',
  fechaHora: '',
  cantidadMesas: '',
  duracionEvento: '',
  tipoEvento: '',
  nroPersonas: '',
  observaciones: '',
  servicios: '',
  montoDecoracion: '',
  abonos: [],
  totalPago: '',
  restante: '',
  formaPago: '',
  estado: 'pendiente'
};

export default function Calendario() {
  const [data, setData] = useState(initialReservas);
  const [selectedReserva, setSelectedReserva] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [searchText, setSearchText] = useState('');
  const [clientSearchText, setClientSearchText] = useState('');
  const [clientSearchResults, setClientSearchResults] = useState([]);
  const [showClientSearch, setShowClientSearch] = useState(false);

  const handleDateClick = (arg) => {
    if (new Date(arg.dateStr) < new Date()) {
      Swal.fire({
        title: "Error",
        text: "No se pueden crear reservas en fechas pasadas.",
        icon: "error",
        confirmButtonColor: '#3085d6',
      });
      return;
    }
    setSelectedDate(arg.dateStr);
    setSelectedReserva(null);
    setForm({...emptyForm, fechaHora: arg.dateStr + 'T00:00'});
    setModalOpen(true);
  };

  const handleEventClick = (info) => {
    const reserva = data.find(res => res.id.toString() === info.event.id);
    if (reserva) {
      setSelectedReserva(reserva);
      setForm(reserva);
      setSelectedDate(null);
      setModalOpen(true);
    }
  };

  const handleEventDrop = (info) => {
    const { event } = info;
    const updatedReserva = data.find(res => res.id.toString() === event.id);
    if (updatedReserva) {
      const newDate = new Date(event.start);
      if (newDate < new Date()) {
        Swal.fire({
          title: "Error",
          text: "No se pueden reprogramar reservas a fechas pasadas.",
          icon: "error",
          confirmButtonColor: '#3085d6',
        });
        info.revert();
        return;
      }
      
      const conflictingReserva = data.find(res => 
        res.id.toString() !== event.id && 
        new Date(res.fechaHora).toDateString() === newDate.toDateString()
      );
      
      if (conflictingReserva) {
        Swal.fire({
          title: "Error",
          text: "Ya existe una reserva en esta fecha y hora.",
          icon: "error",
          confirmButtonColor: '#3085d6',
        });
        info.revert();
        return;
      }

      const updatedData = data.map(res => 
        res.id.toString() === event.id 
          ? {...res, fechaHora: event.start.toISOString().slice(0, 16)} 
          : res
      );
      setData(updatedData);
      Swal.fire({
        title: "Reserva reprogramada",
        text: "La reserva ha sido reprogramada exitosamente.",
        icon: "success",
        confirmButtonColor: '#3085d6',
      });
    }
  };

  const colorMap = {
    terminada: '#28a745',
    anulada: '#dc3545',
    pendiente: '#ffc107',
    en_proceso: '#fd7e14',
    confirmada: '#007bff'
  };

  const events = data.map(reserva => ({
    id: reserva.id.toString(),
    title: reserva.nombre,
    start: reserva.fechaHora,
    backgroundColor: colorMap[reserva.estado],
    borderColor: colorMap[reserva.estado],
    textColor: reserva.estado === 'pendiente' ? '#000' : '#fff'
  }));

  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
  };

  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleClientSearch = (e) => {
    const searchValue = e.target.value;
    setClientSearchText(searchValue);
    const results = mockClientes.filter(cliente => 
      cliente.nombre.toLowerCase().includes(searchValue.toLowerCase()) ||
      cliente.distintivo.includes(searchValue)
    );
    setClientSearchResults(results);
  };

  const selectClient = (cliente) => {
    setForm(prevForm => ({
      ...prevForm,
      nombre: cliente.nombre,
      distintivo: cliente.distintivo,
      categoriaCliente: cliente.categoriaCliente,
      correo: cliente.correo,
      celular: cliente.celular,
      direccion: cliente.direccion
    }));
    setClientSearchText('');
    setClientSearchResults([]);
    setShowClientSearch(false);
  };

  const handleAbonoChange = (index, field, value) => {
    const newAbonos = [...form.abonos];
    newAbonos[index] = { ...newAbonos[index], [field]: value };
    setForm(prevForm => ({
      ...prevForm,
      abonos: newAbonos
    }));
    updateRestante(prevForm.totalPago, newAbonos);
  };

  const addAbono = () => {
    setForm(prevForm => ({
      ...prevForm,
      abonos: [...prevForm.abonos, { fecha: '', cantidad: '' }]
    }));
  };

  const removeAbono = (index) => {
    setForm(prevForm => {
      const newAbonos = prevForm.abonos.filter((_, i) => i !== index);
      updateRestante(prevForm.totalPago, newAbonos);
      return {
        ...prevForm,
        abonos: newAbonos
      };
    });
  };

  const updateRestante = (totalPago, abonos) => {
    const totalAbonos = abonos.reduce((sum, abono) => sum + parseFloat(abono.cantidad || 0), 0);
    const restante = parseFloat(totalPago || 0) - totalAbonos;
    setForm(prevForm => ({
      ...prevForm,
      restante: restante.toFixed(0)
    }));
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'nombre':
        return value.trim() && /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value) ? '' : 'El nombre es requerido y solo debe contener letras.';
      case 'distintivo':
        return /^\d+$/.test(value) ? '' : 'Distintivo es requerido y solo debe contener números.';
      case 'categoriaCliente':
        return value.trim() ? '' : 'Categoría Cliente es requerida.';
      case 'celular':
        return /^\d{10}$/.test(value) ? '' : 'Celular es requerido y debe tener exactamente 10 dígitos.';
      case 'correo':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : 'Correo electrónico es requerido y debe ser válido.';
      case 'direccion':
        return value.trim() ? '' : 'Dirección es requerida.';
      case 'evento':
        return value.trim() && /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value) ? '' : 'Evento es requerido y solo debe contener letras.';
      case 'fechaHora':
        return value && new Date(value) > new Date() ? '' : 'Fecha y hora son requeridas y deben ser futuras.';
      case 'cantidadMesas':
        return parseInt(value) > 0 ? '' : 'Cantidad de mesas es requerida y debe ser mayor a 0.';
      case 'duracionEvento':
        return parseFloat(value) > 0 ? '' : 'Duración del evento es requerida y debe ser mayor a 0.';
      case 'tipoEvento':
        return value.trim() ? '' : 'Tipo de Evento es requerido.';
      case 'nroPersonas':
        return parseInt(value) > 0 ? '' : 'Número de personas es requerido y debe ser mayor a 0.';
      case 'servicios':
        return value.trim() ? '' : 'Servicios es requerido.';
      case 'montoDecoracion':
        return parseFloat(value) >= 0 ? '' : 'Monto de decoración es requerido y no puede ser negativo.';
      case 'totalPago':
        return parseFloat(value) > 0 ? '' : 'Total a pagar es requerido y debe ser mayor a 0.';
      case 'restante':
        return parseFloat(value) >= 0 ? '' : 'El monto restante es requerido y no puede ser negativo.';
      case 'formaPago':
        return value.trim() ? '' : 'Forma de Pago es requerida.';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prevForm => {
      const updatedForm = {
        ...prevForm,
        [name]: value
      };
      if (name === 'totalPago') {
        updateRestante(value, prevForm.abonos);
      }
      return updatedForm;
    });
    setErrors(prevErrors => ({
      ...prevErrors,
      [name]: validateField(name, value)
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    Object.keys(form).forEach(key => {
      if (key !== 'id' && key !== 'observaciones' && key !== 'abonos') {
        const error = validateField(key, form[key]);
        newErrors[key] = error;
        if (error) isValid = false;
      }
    });

    // Validate abonos
    if (form.abonos.length === 0) {
      newErrors.abonos = 'Debe agregar al menos un abono.';
      isValid = false;
    } else {
      form.abonos.forEach((abono, index) => {
        if (!abono.fecha || !abono.cantidad) {
          newErrors[`abono${index}`] = 'Fecha y cantidad son requeridas para cada abono.';
          isValid = false;
        }
      });
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSaveReserva = async () => {
    if (!validateForm()) {
      Swal.fire({
        title: "Error",
        text: "Por favor, corrija los errores en el formulario.",
        icon: "error",
        confirmButtonColor: '#3085d6',
      });
      return;
    }

    // Check for conflicting reservations
    const conflictingReserva = data.find(res => 
      res.id !== form.id && 
      new Date(res.fechaHora).toDateString() === new Date(form.fechaHora).toDateString()
    );
    
    if (conflictingReserva) {
      Swal.fire({
        title: "Error",
        text: "Ya existe una reserva en esta fecha y hora.",
        icon: "error",
        confirmButtonColor: '#3085d6',
      });
      return;
    }

    const result = await Swal.fire({
      title: selectedReserva ? '¿Desea editar esta reserva?' : '¿Desea agregar esta reserva?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: selectedReserva ? 'Sí, editar' : 'Sí, agregar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      if (selectedReserva) {
        setData(data.map(reserva => reserva.id === form.id ? form : reserva));
      } else {
        const newId = Math.max(...data.map(r => r.id)) + 1;
        setData([...data, { ...form, id: newId }]);
      }
      setModalOpen(false);
      Swal.fire({
        title: selectedReserva ? "Reserva editada" : "Reserva agregada",
        text: selectedReserva ? "La reserva ha sido editada exitosamente." : "La reserva ha sido agregada exitosamente.",
        icon: "success",
        confirmButtonColor: '#3085d6',
      });
    }
  };

  const handleCancel = async (id) => {
    const result = await Swal.fire({
      title: '¿Está seguro de cancelar esta reserva?',
      text: "Esta acción no se puede deshacer",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, cancelar reserva',
      cancelButtonText: 'No, mantener reserva'
    });

    if (result.isConfirmed) {
      setData(data.map(reserva => reserva.id === id ? {...reserva, estado: 'anulada'} : reserva));
      setModalOpen(false);
      Swal.fire({
        title: "Reserva cancelada",
        text: "La reserva ha sido cancelada exitosamente.",
        icon: "success",
        confirmButtonColor: '#3085d6',
      });
    }
  };

  const handleDownloadExcel = () => {
    const worksheet = utils.json_to_sheet(data);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Reservas');
    writeFile(workbook, 'Reservas.xlsx');
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);
  };

  return (
    <Container fluid className="p-0">
      <Row className="mb-3 align-items-center">
        <Col>
          <h2>Calendario de Reservas</h2>
        </Col>
        <Col xs="auto">
          <Button color="success" onClick={handleDownloadExcel}>
            <FaFileExcel className="me-2" />
            Descargar Excel
          </Button>
        </Col>
      </Row>
      <Row className="mb-3">
        <Col>
          <Input
            type="text"
            style={{ width: '300px' }} placeholder="Buscar reservas..."
            value={searchText}
            onChange={handleSearchChange}
          />
        </Col>
      </Row>
      <Row>
        <Col>
          <div style={{ height: 'calc(100vh - 200px)' }}>
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              events={filteredEvents}
              dateClick={handleDateClick}
              eventClick={handleEventClick}
              editable={true}
              eventDrop={handleEventDrop}
              height="100%"
            />
          </div>
        </Col>
      </Row>

      <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)} size="lg">
        <ModalHeader style={{background:'#6d0f0f'}} toggle={() => setModalOpen(!modalOpen)}>
          <h3 className="text-white">{selectedReserva ? 'Editar Reserva' : 'Nueva Reserva'}</h3>
        </ModalHeader>
        <ModalBody>
          <FormGroup>
            <Row>
              <Col md={6}>
                <Label for="nombre"><b>Nombre</b></Label>
                <InputGroup>
                  <Input
                    id="nombre"
                    style={{ border: '2px solid #000000' }}
                    type="text"
                    name="nombre"
                    value={form.nombre}
                    onChange={handleChange}
                    invalid={!!errors.nombre}
                  />
                  <InputGroupText style={{ cursor: 'pointer' }} onClick={() => setShowClientSearch(!showClientSearch)}>
                    <FaSearch />
                  </InputGroupText>
                </InputGroup>
                {errors.nombre && <span className="text-danger">{errors.nombre}</span>}
              </Col>
              <Col md={6}>
                <Label for="distintivo"><b>Distintivo</b></Label>
                <Input
                  id="distintivo"
                  style={{ border: '2px solid #000000' }}
                  type="text"
                  name="distintivo"
                  value={form.distintivo}
                  onChange={handleChange}
                  invalid={!!errors.distintivo}
                />
                {errors.distintivo && <span className="text-danger">{errors.distintivo}</span>}
              </Col>
            </Row>
            {showClientSearch && (
              <Row className="mt-2">
                <Col md={12}>
                  <Input
                    type="text"
                    
                    placeholder="Buscar cliente..."
                    value={clientSearchText}
                    onChange={handleClientSearch}
                  />
                  {clientSearchResults.length > 0 && (
                    <div className="border rounded mt-1 p-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {clientSearchResults.map(cliente => (
                        <div 
                          key={cliente.id} 
                          className="p-2 hover-bg-light cursor-pointer"
                          onClick={() => selectClient(cliente)}
                        >
                          {cliente.nombre} - {cliente.distintivo}
                        </div>
                      ))}
                    </div>
                  )}
                </Col>
              </Row>
            )}
            <Row className="mt-3">
              <Col md={6}>
                <Label for="categoriaCliente"><b>Categoría Cliente</b></Label>
                <Input
                  id="categoriaCliente"
                  style={{ border: '2px solid #000000' }}
                  type="select"
                  name="categoriaCliente"
                  value={form.categoriaCliente}
                  onChange={handleChange}
                  invalid={!!errors.categoriaCliente}
                >
                  <option value="">Seleccione una categoría</option>
                  <option value="VIP">VIP</option>
                  <option value="Frecuente">Frecuente</option>
                  <option value="Regular">Regular</option>
                  <option value="Nuevo">Nuevo</option>
                </Input>
                {errors.categoriaCliente && <span className="text-danger">{errors.categoriaCliente}</span>}
              </Col>
              <Col md={6}>
                <Label for="correo"><b>Correo</b></Label>
                <Input
                  id="correo"
                  style={{ border: '2px solid #000000' }}
                  type="email"
                  name="correo"
                  value={form.correo}
                  onChange={handleChange}
                  invalid={!!errors.correo}
                />
                {errors.correo && <span className="text-danger">{errors.correo}</span>}
              </Col>
            </Row>
            <Row className="mt-3">
              <Col md={6}>
                <Label for="celular"><b>Celular</b></Label>
                <Input
                  id="celular"
                  style={{ border: '2px solid #000000' }}
                  type="text"
                  name="celular"
                  value={form.celular}
                  onChange={handleChange}
                  invalid={!!errors.celular}
                />
                {errors.celular && <span className="text-danger">{errors.celular}</span>}
              </Col>
              <Col md={6}>
                <Label for="direccion"><b>Dirección</b></Label>
                <Input
                  id="direccion"
                  style={{ border: '2px solid #000000' }}
                  type="text"
                  name="direccion"
                  value={form.direccion}
                  onChange={handleChange}
                  invalid={!!errors.direccion}
                />
                {errors.direccion && <span className="text-danger">{errors.direccion}</span>}
              </Col>
            </Row>
            <Row className="mt-3">
              <Col md={12}>
                <Label for="fechaHora"><b>Fecha y Hora</b></Label>
                <Input
                  id="fechaHora"
                  style={{ border: '2px solid #000000' }}
                  type="datetime-local"
                  name="fechaHora"
                  value={form.fechaHora}
                  onChange={handleChange}
                  invalid={!!errors.fechaHora}
                />
                {errors.fechaHora && <span className="text-danger">{errors.fechaHora}</span>}
              </Col>
            </Row>
            <Row className="mt-3">
              <Col md={6}>
                <Label for="cantidadMesas"><b>Cantidad de Mesas</b></Label>
                <Input
                  id="cantidadMesas"
                  style={{ border: '2px solid #000000' }}
                  type="number"
                  name="cantidadMesas"
                  value={form.cantidadMesas}
                  onChange={handleChange}
                  invalid={!!errors.cantidadMesas}
                />
                {errors.cantidadMesas && <span className="text-danger">{errors.cantidadMesas}</span>}
              </Col>
              <Col md={6}>
                <Label for="duracionEvento"><b>Duración del Evento (horas)</b></Label>
                <Input
                  id="duracionEvento"
                  style={{ border: '2px solid #000000' }}
                  type="number"
                  name="duracionEvento"
                  value={form.duracionEvento}
                  onChange={handleChange}
                  invalid={!!errors.duracionEvento}
                />
                {errors.duracionEvento && <span className="text-danger">{errors.duracionEvento}</span>}
              </Col>
            </Row>
            <Row className="mt-3">
              <Col md={6}>
                <Label for="tipoEvento"><b>Tipo de Evento</b></Label>
                <Input
                  id="tipoEvento"
                  style={{ border: '2px solid #000000' }}
                  type="select"
                  name="tipoEvento"
                  value={form.tipoEvento}
                  onChange={handleChange}
                  invalid={!!errors.tipoEvento}
                >
                  <option value="">Seleccione un tipo</option>
                  <option value="Empresarial">Empresarial</option>
                  <option value="Cumpleaños">Cumpleaños</option>
                  <option value="Grado">Grado</option>
                  <option value="Aniversario">Aniversario</option>
                  <option value="Bautizo">Bautizo</option>
                  <option value="PrimeraComunion">Primera Comunión</option>
                  <option value="Matrimonio">Matrimonio</option>
                </Input>
                {errors.tipoEvento && <span className="text-danger">{errors.tipoEvento}</span>}
              </Col>
              <Col md={6}>
                <Label for="nroPersonas"><b>Número de Personas</b></Label>
                <Input
                  id="nroPersonas"
                  style={{ border: '2px solid #000000' }}
                  type="number"
                  name="nroPersonas"
                  value={form.nroPersonas}
                  onChange={handleChange}
                  invalid={!!errors.nroPersonas}
                />
                {errors.nroPersonas && <span className="text-danger">{errors.nroPersonas}</span>}
              </Col>
            </Row>
            <Row className="mt-3">
              <Col md={12}>
                <Label for="observaciones"><b>Observaciones</b></Label>
                <Input
                  id="observaciones"
                  style={{ border: '2px solid #000000' }}
                  type="textarea"
                  name="observaciones"
                  value={form.observaciones}
                  onChange={handleChange}
                  rows="3"
                />
              </Col>
            </Row>
            <Row className="mt-3">
              <Col md={6}>
                <Label for="servicios"><b>Servicios</b></Label>
                <Input
                  id="servicios"
                  style={{ border: '2px solid #000000' }}
                  type="select"
                  name="servicios"
                  value={form.servicios}
                  onChange={handleChange}
                  invalid={!!errors.servicios}
                >
                  <option value="">Seleccione un servicio</option>
                  <option value="Decoracion">Decoración</option>
                  <option value="DJ">DJ</option>
                  <option value="Catering">Catering</option>
                  <option value="Fotografia">Fotografía</option>
                </Input>
                {errors.servicios && <span className="text-danger">{errors.servicios}</span>}
              </Col>
              <Col md={6}>
                <Label for="montoDecoracion"><b>Monto Decoración</b></Label>
                <Input
                  id="montoDecoracion"
                  style={{ border: '2px solid #000000' }}
                  type="select"
                  name="montoDecoracion"
                  value={form.montoDecoracion}
                  onChange={handleChange}
                  invalid={!!errors.montoDecoracion}
                >
                  <option value="">Seleccione un monto</option>
                  <option value="70000">$70.000 (2 a 15 personas)</option>
                  <option value="90000">$90.000 (16 a 40 personas)</option>
                </Input>
                {errors.montoDecoracion && <span className="text-danger">{errors.montoDecoracion}</span>}
              </Col>
            </Row>
            <Row className="mt-3">
              <Col md={12}>
                <Label><b>Abonos</b></Label>
                {form.abonos.map((abono, index) => (
                  <Row key={index} className="mb-2">
                    <Col md={5}>
                      <Input
                        type="date"
                        value={abono.fecha}
                        onChange={(e) => handleAbonoChange(index, 'fecha', e.target.value)}
                        style={{ border: '2px solid #000000' }}
                      />
                    </Col>
                    <Col md={5}>
                      <Input
                        type="number"
                        value={abono.cantidad}
                        onChange={(e) => handleAbonoChange(index, 'cantidad', e.target.value)}
                        placeholder="Cantidad"
                        style={{ border: '2px solid #000000' }}
                      />
                    </Col>
                    <Col md={2}>
                      <Button color="danger" onClick={() => removeAbono(index)}>
                        <FaTrash />
                      </Button>
                    </Col>
                  </Row>
                ))}
                {errors.abonos && <span className="text-danger">{errors.abonos}</span>}
                {form.abonos.map((_, index) => (
                  errors[`abono${index}`] && <span key={index} className="text-danger d-block">{errors[`abono${index}`]}</span>
                ))}
                <Button color="primary" onClick={addAbono}>Agregar Abono</Button>
              </Col>
            </Row>
            <Row className="mt-3">
              <Col md={4}>
                <Label for="totalPago"><b>Total a Pagar</b></Label>
                <Input
                  id="totalPago"
                  style={{ border: '2px solid #000000' }}
                  type="number"
                  name="totalPago"
                  value={form.totalPago}
                  onChange={handleChange}
                  invalid={!!errors.totalPago}
                />
                {errors.totalPago && <span className="text-danger">{errors.totalPago}</span>}
              </Col>
              <Col md={4}>
                <Label for="restante"><b>Restante</b></Label>
                <Input
                  id="restante"
                  style={{ border: '2px solid #000000' }}
                  type="number"
                  name="restante"
                  value={form.restante}
                  onChange={handleChange}
                  invalid={!!errors.restante}
                  readOnly
                />
                {errors.restante && <span className="text-danger">{errors.restante}</span>}
              </Col>
              <Col md={4}>
                <Label for="formaPago"><b>Forma de Pago</b></Label>
                <Input
                  id="formaPago"
                  style={{ border: '2px solid #000000' }}
                  type="select"
                  name="formaPago"
                  value={form.formaPago}
                  onChange={handleChange}
                  invalid={!!errors.formaPago}
                >
                  <option value="">Seleccione una forma de pago</option>
                  <option value="Bancolombia">Bancolombia</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Tarjeta">Tarjeta</option>
                </Input>
                {errors.formaPago && <span className="text-danger">{errors.formaPago}</span>}
              </Col>
            </Row>
            <Row className="mt-3">
              <Col md={12}>
                <Label for="estado"><b>Estado</b></Label>
                <Input
                  id="estado"
                  style={{ border: '2px solid #000000' }}
                  type="select"
                  name="estado"
                  value={form.estado}
                  onChange={handleChange}
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
        <ModalFooter>
          <Button style={{ background: '#2e8329' }} onClick={handleSaveReserva}>
            {selectedReserva ? 'Guardar Cambios' : 'Crear Reserva'}
          </Button>
          {selectedReserva && (
            <Button color="danger" onClick={() => handleCancel(selectedReserva.id)}>Cancelar Reserva</Button>
          )}
          <Button style={{background:'#6d0f0f'}} onClick={() => setModalOpen(false)}>Cerrar</Button>
        </ModalFooter>
      </Modal>
    </Container>
  );
}