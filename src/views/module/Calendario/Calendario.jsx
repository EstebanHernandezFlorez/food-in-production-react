import React, { useState, useEffect } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Modal, Button, Form, Popover, OverlayTrigger } from 'react-bootstrap';

const CalendarComponent = () => {
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [form, setForm] = useState({
    id: '',
    NombreCompleto: '',
    Distintivo: '',
    CategoriaCliente: '',
    Correo: '',
    Celular: '',
    Estado: '',
    Direccion: '',
    NroPersonas: '',
    CantidadMesas: '',
    TipoEvento: '',
    DuracionEvento: '',
    FechaHora: '',
    ServiciosAdicionales: '',
    Observaciones: '',
    MontoDecoracion: '',
    TotalPagar: '',
    Abono: '',
    Restante: '',
    FormaPago: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // Load events from localStorage when component mounts
    const savedEvents = JSON.parse(localStorage.getItem('events')) || [];
    setEvents(savedEvents);
  }, []);

  useEffect(() => {
    // Save events to localStorage whenever events state changes
    localStorage.setItem('events', JSON.stringify(events));
  }, [events]);

  const handleDateClick = (arg) => {
    setSelectedDate(arg.dateStr);
    setIsEditing(false);
    setShowModal(true);
  };

  const handleEventClick = (clickInfo) => {
    const reservation = events.find(event => event.id === clickInfo.event.id);
    setForm(reservation);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    const errors = {};
    Object.keys(form).forEach((field) => {
      if (form[field] === '' && field !== 'id') {
        errors[field] = 'Este campo es requerido';
      }
    });
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveReservation = () => {
    if (validateForm()) {
      const newEvent = {
        ...form,
        id: isEditing ? form.id : String(events.length + 1),
        date: selectedDate || form.FechaHora,
      };
      if (isEditing) {
        setEvents(events.map(event => (event.id === form.id ? newEvent : event)));
      } else {
        setEvents([...events, newEvent]);
      }
      setShowModal(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setForm({
      id: '',
      NombreCompleto: '',
      Distintivo: '',
      CategoriaCliente: '',
      Correo: '',
      Celular: '',
      Estado: '',
      Direccion: '',
      NroPersonas: '',
      CantidadMesas: '',
      TipoEvento: '',
      DuracionEvento: '',
      FechaHora: '',
      ServiciosAdicionales: '',
      Observaciones: '',
      MontoDecoracion: '',
      TotalPagar: '',
      Abono: '',
      Restante: '',
      FormaPago: '',
    });
    setFormErrors({});
    setSelectedDate(null);
    setIsEditing(false);
  };

  const deleteReservation = () => {
    setEvents(events.filter(event => event.id !== form.id));
    setShowModal(false);
    resetForm();
  };

  const eventPopover = (event) => (
    <Popover id={`popover-${event.id}`}>
      <Popover.Header as="h3">Reserva: {event.NombreCompleto}</Popover.Header>
      <Popover.Body>
        <strong>Fecha:</strong> {event.FechaHora}<br />
        <strong>Tipo de Evento:</strong> {event.TipoEvento}<br />
        <strong>Estado:</strong> {event.Estado}
        <div className="mt-2">
          <Button variant="primary" onClick={() => handleEventClick({ event: { id: event.id } })}>
            Editar
          </Button>{' '}
          <Button variant="danger" onClick={() => deleteReservation()}>
            Eliminar
          </Button>
        </div>
      </Popover.Body>
    </Popover>
  );

  return (
    <div className="container mt-4">
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        eventContent={(eventInfo) => (
          <OverlayTrigger
            trigger="click"
            placement="top"
            overlay={eventPopover(eventInfo.event)}
          >
            <div className="event-content">{eventInfo.event.title}</div>
          </OverlayTrigger>
        )}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,dayGridWeek,dayGridDay'
        }}
      />

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{isEditing ? "Editar Reserva" : "Agregar Reserva"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            {Object.keys(form).map((key) => (
              key !== 'id' && (
                <Form.Group key={key} controlId={key} className="mb-3">
                  <Form.Label>{key.replace(/([A-Z])/g, ' $1').trim()}</Form.Label>
                  <Form.Control
                    type="text"
                    name={key}
                    value={form[key]}
                    onChange={handleChange}
                    isInvalid={formErrors[key]}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors[key]}
                  </Form.Control.Feedback>
                </Form.Group>
              )
            ))}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          {isEditing && (
            <Button variant="danger" onClick={deleteReservation}>
              Eliminar
            </Button>
          )}
          <Button variant="secondary" onClick={resetForm}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={saveReservation}>
            {isEditing ? "Actualizar" : "Agregar"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CalendarComponent;
