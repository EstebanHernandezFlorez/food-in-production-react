import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { Container, Input, Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from "@fullcalendar/interaction";

const initialData = [
  { id: 1, Nombre: "Boda Juan y María", Distintivo: "7867", Evento: "Boda", Fechahora: "2024-09-01T18:00", Cantidadmesas: "15", Nropersonas: "150", Abono: "500", Totalpag: "1500", Restante: "1000", Estado: "terminada" },
  { id: 2, Nombre: "Fiesta de Empresa", Distintivo: "7576", Evento: "Corporativo", Fechahora: "2024-09-15T20:00", Cantidadmesas: "20", Nropersonas: "200", Abono: "700", Totalpag: "2000", Restante: "1300", Estado: "confirmada" },
];

const Reserva = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(initialData);
  const [form, setForm] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [selectedReserva, setSelectedReserva] = useState(null); // Para la reserva seleccionada

  // Abrir formulario para nueva reserva
  const openForm = (selectedDate) => {
    setForm({ ...form, Fechahora: selectedDate });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setForm({});
  };

  // Manejar click en una fecha del calendario
  const handleDateClick = (info) => {
    openForm(info.dateStr);
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
      setForm(selectedReserva); // Rellenar el formulario con los datos de la reserva seleccionada
      setShowForm(true);
      setSelectedReserva(null);
    }
  };

  // Reprogramar reserva (se podría añadir un campo para seleccionar la nueva fecha)
  const handleReprogram = (newDate) => {
    if (selectedReserva) {
      setData(data.map(res => res.id === selectedReserva.id ? { ...res, Fechahora: newDate } : res));
      setSelectedReserva(null);
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
    'en proceso': 'orange',
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
        <ModalHeader toggle={closeForm}>Agregar/Editar Reserva</ModalHeader>
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
          <Button color="secondary" onClick={closeForm}>Cancelar</Button>
        </ModalFooter>
      </Modal>

      {/* Modal de detalles de reserva */}
      <Modal isOpen={!!selectedReserva} toggle={() => setSelectedReserva(null)}>
        <ModalHeader toggle={() => setSelectedReserva(null)}>Detalles de Reserva</ModalHeader>
        <ModalBody>
          {selectedReserva && (
            <>
              <p><strong>Nombre:</strong> {selectedReserva.Nombre}</p>
              <p><strong>Distintivo:</strong> {selectedReserva.Distintivo}</p>
              <p><strong>Evento:</strong> {selectedReserva.Evento}</p>
              <p><strong>Fecha y Hora:</strong> {selectedReserva.Fechahora}</p>
              <p><strong>Cantidad de Mesas:</strong> {selectedReserva.Cantidadmesas}</p>
              <p><strong>Número de Personas:</strong> {selectedReserva.Nropersonas}</p>
              <p><strong>Estado:</strong> {selectedReserva.Estado}</p>
              <p><strong>Total a Pagar:</strong> {selectedReserva.Totalpag}</p>
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="warning" onClick={handleEdit}>Editar</Button>
          <Button color="danger" onClick={handleCancel}>Cancelar</Button>
          <Button color="primary" onClick={() => handleReprogram("2024-09-20T18:00")}>Reprogramar</Button>
        </ModalFooter>
      </Modal>
    </Container>
  );
};

export default Reserva;
