import  { useEffect, useState } from "react";
import { Container, Button, FormGroup, Input, Modal, ModalHeader, ModalBody, ModalFooter, Row, Col, Label } from 'reactstrap';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from "@fullcalendar/interaction";
import { utils, writeFile } from "xlsx";
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

const initialReservas = [
  {
    id: 1,
    nombre: "Boda Juan y María",
    distintivo: "7867",
    categoriaCliente: "Privado",
    correo: "juan.maria@example.com",
    celular: "1234567890",
    direccion: "Calle Falsa 123",
    evento: "Boda",
    fechaHora: "2024-09-01T18:00",
    cantidadMesas: "15",
    duracionEvento: "5",
    tipoEvento: "Celebración",
    nroPersonas: "150",
    observaciones: "Decoración elegante",
    servicios: "DJ, Fotografía",
    montoDecoracion: "200",
    abono: "500",
    totalPago: "1500",
    restante: "1000",
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
    montoDecoracion: "300",
    abono: "700",
    totalPago: "2000",
    restante: "1300",
    formaPago: "Transferencia",
    estado: "confirmada"
  }
];

export default function Calendario() {
  const [data, setData] = useState(initialReservas);
  const [selectedReserva, setSelectedReserva] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [form, setForm] = useState({
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
    abono: '',
    totalPago: '',
    restante: '',
    formaPago: '',
    estado: 'pendiente'
  });
  const [errors, setErrors] = useState({});

  const handleDateClick = (arg) => {
    setSelectedDate(arg.dateStr);
    setSelectedReserva(null);
    setForm({...form, fechaHora: arg.dateStr + 'T00:00'});
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

  const colorMap = {
    terminada: '#28a745',  // Green
    anulada: '#dc3545',    // Red
    pendiente: '#ffc107',  // Yellow
    en_proceso: '#fd7e14', // Orange
    confirmada: '#007bff'  // Blue
  };

  const events = data.map(reserva => ({
    id: reserva.id.toString(),
    title: reserva.nombre,
    start: reserva.fechaHora,
    backgroundColor: colorMap[reserva.estado],
    borderColor: colorMap[reserva.estado],
    textColor: reserva.estado === 'pendiente' ? '#000' : '#fff'  // Black text for yellow background
  }));

  useEffect(() => {
    if (!modalOpen) {
      setSelectedReserva(null);
      setSelectedDate(null);
      setForm({
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
        abono: '',
        totalPago: '',
        restante: '',
        formaPago: '',
        estado: 'pendiente'
      });
      setErrors({});
    }
  }, [modalOpen]);

  const handleDownloadExcel = () => {
    const worksheet = utils.json_to_sheet(data);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Reservas');
    writeFile(workbook, 'Reservas.xlsx');
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'nombre':
        return value.trim() ? '' : 'El nombre es requerido.';
      case 'distintivo':
        return /^\d+$/.test(value) ? '' : 'Distintivo solo debe contener números.';
      case 'categoriaCliente':
        return value.trim() ? '' : 'Categoría Cliente es requerida.';
      case 'celular':
        return /^\d{10}$/.test(value) ? '' : 'Celular debe tener exactamente 10 dígitos.';
      case 'correo':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : 'Correo electrónico inválido.';
      case 'direccion':
        return value.trim() ? '' : 'Dirección es requerida.';
      case 'evento':
        return value.trim() ? '' : 'Evento es requerido.';
      case 'fechaHora':
        return value ? '' : 'Fecha y hora son requeridas.';
      case 'cantidadMesas':
        return parseInt(value) > 0 ? '' : 'Cantidad de mesas debe ser mayor a 0.';
      case 'duracionEvento':
        return parseFloat(value) > 0 ? '' : 'Duración del evento debe ser mayor a 0.';
      case 'tipoEvento':
        return value.trim() ? '' : 'Tipo de Evento es requerido.';
      case 'nroPersonas':
        return parseInt(value) > 0 ? '' : 'Número de personas debe ser mayor a 0.';
      case 'servicios':
        return value.trim() ? '' : 'Servicios es requerido.';
      case 'montoDecoracion':
        return parseFloat(value) >= 0 ? '' : 'Monto de decoración no puede ser negativo.';
      case 'abono':
        return parseFloat(value) >= 0 ? '' : 'El abono no puede ser negativo.';
      case 'totalPago':
        return parseFloat(value) > 0 ? '' : 'Total a pagar debe ser mayor a 0.';
      case 'restante':
        return parseFloat(value) >= 0 ? '' : 'El monto restante no puede ser negativo.';
      case 'formaPago':
        return value.trim() ? '' : 'Forma de Pago es requerida.';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prevForm => ({
      ...prevForm,
      [name]: value
    }));
    setErrors(prevErrors => ({
      ...prevErrors,
      [name]: validateField(name, value)
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    Object.keys(form).forEach(key => {
      if (key !== 'id' && key !== 'observaciones') {
        const error = validateField(key, form[key]);
        newErrors[key] = error;
        if (error) isValid = false;
      }
    });

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
        // Editar reserva existente
        setData(data.map(reserva => reserva.id === form.id ? form : reserva));
      } else {
        // Agregar nueva reserva
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

  const handleReschedule = async (id) => {
    const result = await Swal.fire({
      title: '¿Desea reprogramar esta reserva?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, reprogramar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      console.log('Reprogramar reserva', id);
      setModalOpen(false);
      Swal.fire({
        title: "Reserva reprogramada",
        text: "La reserva ha sido reprogramada exitosamente.",
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

  return (
    <Container className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <h2>Calendario de Reservas</h2>
      <div style={{ width: '100%', maxWidth: '900px', overflow: 'hidden' }}>
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
        />
      </div>

      <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)} style={{ maxWidth: '900px', width: '80%',overflowX: 'auto',maxHeight: '93vh' }}>
        <ModalHeader style={{background:'#6d0f0f'}} toggle={() => setModalOpen(!modalOpen)}>
          <h3 className="text-white">{selectedReserva ? 'Editar Reserva' : 'Nueva Reserva'}</h3>
        </ModalHeader>
        <ModalBody>
          <FormGroup>
            <Row>
              <Col md={6}>
                <Label for="nombre"><b>Nombre</b></Label>
                <Input
                  id="nombre"
                  style={{ border: '2px solid #000000' }}
                  type="text"
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  invalid={!!errors.nombre}
                />
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
                  <option value="VIP">VIP</option>
                  <option value="Frecuente">Frecuente</option>
                  <option value="Regular">Regular</option>
                  <option value="Nuevo">Nuevo</option>
                  
                
                {errors.categoriaCliente && <span className="text-danger">{errors.categoriaCliente}</span>}
                </Input>
               
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
                  <option value="Empresarial">Empresarial</option>
                  <option value="Cumpleaños">Cumpleaños</option>
                  <option value="Grado">En Grado</option>
                  <option value="Aniversario">Aniversario</option>
                  <option value="Bautizo">Bautizo</option>
                  <option value="PrimeraComunion">Primera Comunion</option>
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
                    <option value="Decoracion">Decoracion</option>
                  {errors.servicios && <span className="text-danger">{errors.servicios}</span>}
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
                  <option value="2 a 15 personas">$70.000</option>
                  <option value="16 a 40 personas">$90.000</option>
                  {errors.montoDecoracion && <span className="text-danger">{errors.montoDecoracion}</span>}
                </Input>
              </Col>
            </Row>
            <Row className="mt-3">
              <Col md={4}>
                <Label for="abono"><b>Abono</b></Label>
                <Input
                  id="abono"
                  style={{ border: '2px solid #000000' }}
                  type="number"
                  name="abono"
                  value={form.abono}
                  onChange={handleChange}
                  invalid={!!errors.abono}
                />
                {errors.abono && <span className="text-danger">{errors.abono}</span>}
              </Col>
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
                />
                {errors.restante && <span className="text-danger">{errors.restante}</span>}
              </Col>
            </Row>
            <Row className="mt-3">
              <Col md={6}>
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
                   <option value="Bancolombia">Bancolombia</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Tarjeta">Tarjeta</option>
                </Input>
                {errors.formaPago && <span className="text-danger">{errors.formaPago}</span>}
              </Col>
              <Col md={6}>
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
            <>
              <Button color="warning" onClick={() => handleReschedule(selectedReserva.id)}>Reprogramar</Button>
              <Button color="danger" onClick={() => handleCancel(selectedReserva.id)}>Cancelar Reserva</Button>
            </>
          )}
          <Button style={{background:'#6d0f0f'}} onClick={() => setModalOpen(false)}>Cerrar</Button>
        </ModalFooter>
      </Modal>

      <Button style={{ background: '#2e8329' }} className="mt-3" onClick={handleDownloadExcel}>Descargar Excel</Button>
    </Container>
  );
}