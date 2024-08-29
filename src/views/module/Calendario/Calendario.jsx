import React, { useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Modal, Button } from 'react-bootstrap';

const CalendarComponent = () => {
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [reservationDetails, setReservationDetails] = useState("");

  const handleDateClick = (arg) => {
    setSelectedDate(arg.dateStr);
    setShowModal(true);
  };

  const handleEventClick = (clickInfo) => {
    const reservation = events.find(event => event.id === clickInfo.event.id);
    setReservationDetails(reservation ? reservation.title : '');
    setShowModal(true);
  };

  const addReservation = () => {
    const newEvent = {
      id: String(events.length + 1),
      title: 'Reserva Agregada',
      date: selectedDate
    };
    setEvents([...events, newEvent]);
    setShowModal(false);
  };

  return (
    <div className="container mt-4">
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,dayGridWeek,dayGridDay'
        }}
      />

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{selectedDate ? "Agregar Reserva" : "Detalle de la Reserva"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedDate ? (
            <div>
              <p>¿Desea agregar una reserva para el {selectedDate}?</p>
              <Button variant="primary" onClick={addReservation}>
                Agregar
              </Button>
            </div>
          ) : (
            <div>
              <p>Detalle de la reserva:</p>
              <p>{reservationDetails}</p>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default CalendarComponent;
