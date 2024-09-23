import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { Container, Input, Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from "@fullcalendar/interaction";

const Reservas = [
  { id: 1, Nombre: "Boda Juan y María", Distintivo: "7867", Evento: "Boda", Fechahora: "2024-09-01T18:00", Cantidadmesas: "15", Nropersonas: "150", Abono: "500", Totalpag: "1500", Restante: "1000", Estado: "terminada" },
  { id: 2, Nombre: "Fiesta de Empresa", Distintivo: "7576", Evento: "Corporativo", Fechahora: "2024-09-15T20:00", Cantidadmesas: "20", Nropersonas: "200", Abono: "700", Totalpag: "2000", Restante: "1300", Estado: "confirmada" },
];

export default function Calendario () {
  const navigate = useNavigate();
  const [data, setData] = useState(Reservas);
  const [form, setForm] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [selectedReserva, setSelectedReserva] = useState(null); // Para la reserva seleccionada

  // Abrir formulario con los datos prellenados de la reserva
  const openForm = (reserva) => {
    setForm(reserva); // Llenar el formulario con los datos de la reserva seleccionada
    setShowForm(true); // Mostrar el formulario
  };

  const closeForm = () => {
    setShowForm(false);
    setForm({});
  };

  // Manejar click en una fecha del calendario
  const handleDateClick = (info) => {
    openForm({ Fechahora: info.dateStr });
    navigate("/reservas");
  };

  // Manejar el click en un evento del calendario
  const handleEventClick = (info) => {
    const reserva = data.find(res => res.id.toString() === info.event.id); // Buscar reserva por ID
    if (reserva) {
      setSelectedReserva(reserva); // Asignar reserva seleccionada
    }
  };

  // Cancelar reserva (actualizar estado a 'anulada')
  const handleCancel = () => {
    if (selectedReserva) {
      setData(data.map(res => res.id === selectedReserva.id ? { ...res, Estado: 'anulada' } : res));
      setSelectedReserva(null);
    }
  };

  // Editar reserva (abrir modal de edición con los datos de la reserva)
  const handleEdit = () => {
    if (selectedReserva) {
      openForm(selectedReserva); // Llenar el formulario con los datos de la reserva seleccionada
      setSelectedReserva(null);
    }
  };

  // Reprogramar reserva
  const handleReprogram = () => {
    if (selectedReserva) {
      openForm(selectedReserva); // Llenar el formulario para editar la fecha
      setSelectedReserva(null); // Ocultar detalles de la reserva
    }
  };

  // Guardar nueva reserva o edición
  const handleSubmit = () => {
    if (form.id) {
      // Si ya existe, actualizar
      setData(data.map(res => res.id === form.id ? form : res));
    } else {
      // Si no existe, crear nueva reserva
      const nuevaReserva = { ...form, id: data.length ? Math.max(...data.map(res => res.id)) + 1 : 1 };
      setData([...data, nuevaReserva]);
    }
    closeForm();
  };

  // Mapa de colores según el estado de la reserva
  const colorMap = {
    terminada: 'green',
    anulada: 'red',
    pendiente: 'yellow',
    en_proceso: 'orange',
    confirmada: 'blue'
  };

  // Mapeo de eventos para el calendario
  const events = data.map(reserva => ({
    id: reserva.id.toString(), // Asegúrate de pasar un ID como string
    title: reserva.Nombre,
    start: reserva.Fechahora,
    backgroundColor: colorMap[reserva.Estado],
    borderColor: colorMap[reserva.Estado]
  }));

  return (
    <Container>
      <h2>Calendario de Reservas</h2>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        dateClick={handleDateClick}
        eventClick={handleEventClick} // Manejar clic en evento del calendario
      />

      {/* Modal para crear/editar reservas */}
      <Modal isOpen={showForm} toggle={closeForm}>
        <ModalHeader style={{ background: '#6d0f0f' }} toggle={closeForm}><h3 className="text-white"> Editar Reserva</h3></ModalHeader>
        <ModalBody>
          <Input
            type="text"
            name="Nombre"
            placeholder="Nombre del Evento"
            value={form.Nombre || ''}
            onChange={(e) => setForm({ ...form, Nombre: e.target.value })}
          />
          {/* Otros campos del formulario */}
          <Input
            type="select"
            name="Estado"
            value={form.Estado || ''}
            onChange={(e) => setForm({ ...form, Estado: e.target.value })}
          >
            <option value="">Seleccionar Estado</option>
            <option value="terminada">Terminada</option>
            <option value="anulada">Anulada</option>
            <option value="pendiente">Pendiente</option>
            <option value="en proceso">En Proceso</option>
            <option value="confirmada">Confirmada</option>
          </Input>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={handleSubmit}>Guardar</Button>
          <Button style={{ background: '#6d0f0f' }} onClick={closeForm}>Cancelar</Button>
        </ModalFooter>
      </Modal>

      {/* Modal de detalles de reserva */}
      <Modal isOpen={!!selectedReserva} toggle={() => setSelectedReserva(null)}>
        <ModalHeader style={{ background: '#6d0f0f' }} toggle={() => setSelectedReserva(null)}>
          <h3 className="text-white"> Detalles de reserva</h3>
        </ModalHeader>
        <ModalBody>
          {selectedReserva && (
            <>
              <p><strong>Nombre Completo:</strong> {selectedReserva.NombreCompleto}</p>
              <p><strong>Distintivo:</strong> {selectedReserva.Distintivo}</p>
              <p><strong>Categoría Cliente:</strong> {selectedReserva.CategoriaCliente}</p>
              <p><strong>Correo:</strong> {selectedReserva.Correo}</p>
              <p><strong>Celular:</strong> {selectedReserva.Celular}</p>
              <p><strong>Dirección:</strong> {selectedReserva.Direccion}</p>
              <p><strong>Nro de personas:</strong> {selectedReserva.Nropersonas}</p>
              <p><strong>Cantidad de mesas:</strong> {selectedReserva.Cantidadmesas}</p>
              <p><strong>Evento:</strong> {selectedReserva.Evento}</p>
              <p><strong>Duración del evento:</strong> {selectedReserva.Duracionevento}</p>
              <p><strong>Fecha y hora:</strong> {selectedReserva.Fecha_Hora}</p>
              <p><strong>Servicio:</strong> {selectedReserva.Servicio}</p>
              <p><strong>Observaciones:</strong> {selectedReserva.Observaciones}</p>
              <p><strong>Monto de decoración:</strong> {selectedReserva.Montodeco}</p>
              <p><strong>Total a pagar:</strong> {selectedReserva.Totalpag}</p>
              <p><strong>Abono:</strong> {selectedReserva.Abono}</p>
              <p><strong>Restante:</strong> {selectedReserva.Restante}</p>
              <p><strong>Forma de pago:</strong> {selectedReserva.Formapag}</p>
              <p><strong>Estado:</strong> {selectedReserva.Estado ? 'Activo' : 'Inactivo'}</p>
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button style={{ background: '#2e8329' }} onClick={handleEdit}>Editar</Button>
          <Button style={{ background: '#6d0f0f' }} onClick={handleCancel}>Cancelar</Button>
          <Button style={{ background: '#4682B4' }} onClick={handleReprogram}>Reprogramar</Button>
        </ModalFooter>
      </Modal>
    </Container>
  );
};
