import React, { useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Table, Button, Container, Row, Col, FormGroup, Input, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import { Snackbar, Alert } from '@mui/material';

// Datos iniciales de ejemplo
const initialData = [
  { id: 1, NombreCompleto: "Carolina Guzman", Distintivo: "VIP", CategoriaCliente: "Frecuente", Correo: "carolina@example.com", Celular: "1234567890", Estado: "Confirmado", Direccion: "cl 76 j 12b 55", NroPersonas: 5, CantidadMesas: 2, TipoEvento: "Cumpleaños", DuracionEvento: "3 horas", FechaHora: "2024-08-22T15:00", ServiciosAdicionales: "DJ", Observaciones: "Decoración azul", MontoDecoracion: 500, TotalPagar: 1500, Abono: 500, Restante: 1000, FormaPago: "Tarjeta" },
  // Puedes agregar más datos de ejemplo aquí
];

const Reservas = () => {
  const [data, setData] = useState(initialData); // Estado para almacenar las reservas
  const [form, setForm] = useState({ // Estado para el formulario
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
    FormaPago: ''
  });
  const [isEditing, setIsEditing] = useState(false); // Estado para saber si se está editando una reserva
  const [showForm, setShowForm] = useState(false); // Estado para mostrar el formulario
  const [searchText, setSearchText] = useState(''); // Estado para el texto de búsqueda
  const [snackbarOpen, setSnackbarOpen] = useState(false); // Estado para el snackbar (notificaciones)
  const [snackbarMessage, setSnackbarMessage] = useState(''); // Estado para el mensaje del snackbar
  const [snackbarSeverity, setSnackbarSeverity] = useState('success'); // Estado para la severidad del snackbar
  const [currentPage, setCurrentPage] = useState(1); // Estado para la paginación
  const [modalOpen, setModalOpen] = useState(false); // Estado para el modal de edición
  const itemsPerPage = 7; // Número de elementos por página

  // Función para manejar la búsqueda
  const handleSearch = (e) => {
    setSearchText(e.target.value.toLowerCase());
  };

  // Función para manejar los cambios en los campos del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prevForm => ({
      ...prevForm,
      [name]: value
    }));
  };

  // Función para cambiar de página en la paginación
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Función para abrir el snackbar con un mensaje y severidad específicos
  const openSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Función para cerrar el snackbar
  const closeSnackbar = () => {
    setSnackbarOpen(false);
  };

  // Función para agregar una nueva reserva
  const handleSubmit = () => {
    const { NombreCompleto, Correo, Celular, Estado, Direccion, NroPersonas, CantidadMesas, TipoEvento, DuracionEvento, FechaHora, ServiciosAdicionales, MontoDecoracion, TotalPagar, Abono, Restante, FormaPago } = form;

    // Validación de campos obligatorios
    if (!NombreCompleto || !Correo || !Celular || !Estado || !Direccion || !NroPersonas || !CantidadMesas || !TipoEvento || !DuracionEvento || !FechaHora || !MontoDecoracion || !TotalPagar || !Abono || !Restante || !FormaPago) {
      openSnackbar("Por favor, ingrese todos los campos obligatorios", 'warning');
      return;
    }

    const nuevaReserva = {
      ...form,
      id: data.length ? Math.max(...data.map(emp => emp.id)) + 1 : 1
    };

    setData([...data, nuevaReserva]); // Agregar la nueva reserva a la lista de datos
    setForm({ // Restablecer el formulario
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
      FormaPago: ''
    });
    setShowForm(false);
    openSnackbar("Reserva agregada exitosamente", 'success');
  };

  // Función para editar una reserva existente
  const editar = () => {
    const { NombreCompleto, Correo, Celular, Estado, Direccion, NroPersonas, CantidadMesas, TipoEvento, DuracionEvento, FechaHora, ServiciosAdicionales, MontoDecoracion, TotalPagar, Abono, Restante, FormaPago } = form;

    // Validación de campos obligatorios
    if (!NombreCompleto || !Correo || !Celular || !Estado || !Direccion || !NroPersonas || !CantidadMesas || !TipoEvento || !DuracionEvento || !FechaHora || !MontoDecoracion || !TotalPagar || !Abono || !Restante || !FormaPago) {
      openSnackbar("Por favor, ingrese todos los campos obligatorios", 'warning');
      return;
    }

    const updatedData = data.map((registro) =>
      registro.id === form.id ? { ...form } : registro
    );

    setData(updatedData); // Actualizar la lista de datos con la reserva editada
    setIsEditing(false);
    setModalOpen(false); // Cerrar el modal después de actualizar
    openSnackbar("Reserva editada exitosamente", 'success');
  };

  // Función para eliminar una reserva
  const eliminar = (dato) => {
    if (window.confirm(`¿Realmente desea eliminar la reserva de ${dato.NombreCompleto}?`)) {
      const updatedData = data.filter(registro => registro.id !== dato.id);
      setData(updatedData);
      openSnackbar("Reserva eliminada exitosamente", 'success');
    }
  };

  // Filtrado de datos en base al texto de búsqueda
  const filteredData = data.filter(item =>
    item.NombreCompleto.toLowerCase().includes(searchText) ||
    item.Correo.toLowerCase().includes(searchText) ||
    item.Celular.toString().includes(searchText) ||
    item.Direccion.toLowerCase().includes(searchText)
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(filteredData.length / itemsPerPage); i++) {
    pageNumbers.push(i);
  }

  return (
    <Container>
      <br />
      <h2>Lista de Reservas</h2>
      <br />
      <div className="d-flex justify-content-between align-items-center mb-3">
        <Input
          type="text"
          placeholder="Buscar reserva"
          value={searchText}
          onChange={handleSearch}
          style={{ width: '50%' }}
        />
        <Button color="success" onClick={() => { setForm({ id: '', NombreCompleto: '', Distintivo: '', CategoriaCliente: '', Correo: '', Celular: '', Estado: '', Direccion: '', NroPersonas: '', CantidadMesas: '', TipoEvento: '', DuracionEvento: '', FechaHora: '', ServiciosAdicionales: '', Observaciones: '', MontoDecoracion: '', TotalPagar: '', Abono: '', Restante: '', FormaPago: '' }); setIsEditing(false); setShowForm(true); }}>
          Agregar Reserva
        </Button>
      </div>

      {/* Mostrar la tabla solo si no se está mostrando el formulario */}
      {!showForm && (
        <>
          <Table className="table table-hover">
            <thead>
              <tr>
                <th>id</th>
                <th>Nombre Completo</th>
                <th>Correo</th>
                <th>Celular</th>
                <th>Dirección</th>
                <th>Número de Personas</th>
                <th>Estado</th>
                <th>Cantidad de Mesas</th>
                <th>Tipo de Evento</th>
                <th>Fecha y Hora</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((dato) => (
                <tr key={dato.id}>
                  <td>{dato.id}</td>
                  <td>{dato.NombreCompleto}</td>
                  <td>{dato.Correo}</td>
                  <td>{dato.Celular}</td>
                  <td>{dato.Direccion}</td>
                  <td>{dato.NroPersonas}</td>
                  <td>{dato.Estado}</td>
                  <td>{dato.CantidadMesas}</td>
                  <td>{dato.TipoEvento}</td>
                  <td>{dato.FechaHora}</td>
                  <td>
                    <Button color="primary" className="me-2" onClick={() => { setForm(dato); setIsEditing(true); setModalOpen(true); }}>
                      <FaEdit />
                    </Button>
                    <Button color="danger" onClick={() => eliminar(dato)}>
                      <FaTrashAlt />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          {/* Paginación */}
          <div className="d-flex justify-content-center">
            {pageNumbers.map((number) => (
              <Button
                key={number}
                color="primary"
                onClick={() => handlePageChange(number)}
                className={number === currentPage ? 'active' : ''}
              >
                {number}
              </Button>
            ))}
          </div>
        </>
      )}

      {/* Formulario para agregar/editar reserva */}
      {showForm && (
        <div>
          <h3>{isEditing ? "Editar Reserva" : "Agregar Nueva Reserva"}</h3>
          <Row>
            <Col md="6">
              <FormGroup>
                <label>Nombre Completo</label>
                <Input type="text" name="NombreCompleto" value={form.NombreCompleto} onChange={handleChange} />
              </FormGroup>
            </Col>
            <Col md="6">
              <FormGroup>
                <label>Correo</label>
                <Input type="email" name="Correo" value={form.Correo} onChange={handleChange} />
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md="6">
              <FormGroup>
                <label>Celular</label>
                <Input type="text" name="Celular" value={form.Celular} onChange={handleChange} />
              </FormGroup>
            </Col>
            <Col md="6">
              <FormGroup>
                <label>Estado</label>
                <Input type="text" name="Estado" value={form.Estado} onChange={handleChange} />
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md="6">
              <FormGroup>
                <label>Dirección</label>
                <Input type="text" name="Direccion" value={form.Direccion} onChange={handleChange} />
              </FormGroup>
            </Col>
            <Col md="6">
              <FormGroup>
                <label>Número de Personas</label>
                <Input type="number" name="NroPersonas" value={form.NroPersonas} onChange={handleChange} />
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md="6">
              <FormGroup>
                <label>Cantidad de Mesas</label>
                <Input type="number" name="CantidadMesas" value={form.CantidadMesas} onChange={handleChange} />
              </FormGroup>
            </Col>
            <Col md="6">
              <FormGroup>
                <label>Tipo de Evento</label>
                <Input type="text" name="TipoEvento" value={form.TipoEvento} onChange={handleChange} />
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md="6">
              <FormGroup>
                <label>Duración del Evento</label>
                <Input type="text" name="DuracionEvento" value={form.DuracionEvento} onChange={handleChange} />
              </FormGroup>
            </Col>
            <Col md="6">
              <FormGroup>
                <label>Fecha y Hora</label>
                <Input type="datetime-local" name="FechaHora" value={form.FechaHora} onChange={handleChange} />
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md="6">
              <FormGroup>
                <label>Servicios Adicionales</label>
                <Input type="text" name="ServiciosAdicionales" value={form.ServiciosAdicionales} onChange={handleChange} />
              </FormGroup>
            </Col>
            <Col md="6">
              <FormGroup>
                <label>Observaciones</label>
                <Input type="text" name="Observaciones" value={form.Observaciones} onChange={handleChange} />
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md="4">
              <FormGroup>
                <label>Monto Decoración</label>
                <Input type="number" name="MontoDecoracion" value={form.MontoDecoracion} onChange={handleChange} />
              </FormGroup>
            </Col>
            <Col md="4">
              <FormGroup>
                <label>Total a Pagar</label>
                <Input type="number" name="TotalPagar" value={form.TotalPagar} onChange={handleChange} />
              </FormGroup>
            </Col>
            <Col md="4">
              <FormGroup>
                <label>Abono</label>
                <Input type="number" name="Abono" value={form.Abono} onChange={handleChange} />
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md="6">
              <FormGroup>
                <label>Restante</label>
                <Input type="number" name="Restante" value={form.Restante} onChange={handleChange} />
              </FormGroup>
            </Col>
            <Col md="6">
              <FormGroup>
                <label>Forma de Pago</label>
                <Input type="text" name="FormaPago" value={form.FormaPago} onChange={handleChange} />
              </FormGroup>
            </Col>
          </Row>
          <div className="d-flex justify-content-between">
            <Button color="primary" onClick={isEditing ? editar : handleSubmit}>
              {isEditing ? "Guardar Cambios" : "Agregar Reserva"}
            </Button>
            <Button color="secondary" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Modal de edición */}
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)}>
        <ModalHeader toggle={() => setModalOpen(!modalOpen)}>
          Editar Reserva
        </ModalHeader>
        <ModalBody>
          <Row>
            <Col md="6">
              <FormGroup>
                <label>Nombre Completo</label>
                <Input type="text" name="NombreCompleto" value={form.NombreCompleto} onChange={handleChange} />
              </FormGroup>
            </Col>
            <Col md="6">
              <FormGroup>
                <label>Correo</label>
                <Input type="email" name="Correo" value={form.Correo} onChange={handleChange} />
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md="6">
              <FormGroup>
                <label>Celular</label>
                <Input type="text" name="Celular" value={form.Celular} onChange={handleChange} />
              </FormGroup>
            </Col>
            <Col md="6">
              <FormGroup>
                <label>Estado</label>
                <Input type="text" name="Estado" value={form.Estado} onChange={handleChange} />
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md="6">
              <FormGroup>
                <label>Dirección</label>
                <Input type="text" name="Direccion" value={form.Direccion} onChange={handleChange} />
              </FormGroup>
            </Col>
            <Col md="6">
              <FormGroup>
                <label>Número de Personas</label>
                <Input type="number" name="NroPersonas" value={form.NroPersonas} onChange={handleChange} />
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md="6">
              <FormGroup>
                <label>Cantidad de Mesas</label>
                <Input type="number" name="CantidadMesas" value={form.CantidadMesas} onChange={handleChange} />
              </FormGroup>
            </Col>
            <Col md="6">
              <FormGroup>
                <label>Tipo de Evento</label>
                <Input type="text" name="TipoEvento" value={form.TipoEvento} onChange={handleChange} />
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md="6">
              <FormGroup>
                <label>Duración del Evento</label>
                <Input type="text" name="DuracionEvento" value={form.DuracionEvento} onChange={handleChange} />
              </FormGroup>
            </Col>
            <Col md="6">
              <FormGroup>
                <label>Fecha y Hora</label>
                <Input type="datetime-local" name="FechaHora" value={form.FechaHora} onChange={handleChange} />
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md="6">
              <FormGroup>
                <label>Servicios Adicionales</label>
                <Input type="text" name="ServiciosAdicionales" value={form.ServiciosAdicionales} onChange={handleChange} />
              </FormGroup>
            </Col>
            <Col md="6">
              <FormGroup>
                <label>Observaciones</label>
                <Input type="text" name="Observaciones" value={form.Observaciones} onChange={handleChange} />
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md="4">
              <FormGroup>
                <label>Monto Decoración</label>
                <Input type="number" name="MontoDecoracion" value={form.MontoDecoracion} onChange={handleChange} />
              </FormGroup>
            </Col>
            <Col md="4">
              <FormGroup>
                <label>Total a Pagar</label>
                <Input type="number" name="TotalPagar" value={form.TotalPagar} onChange={handleChange} />
              </FormGroup>
            </Col>
            <Col md="4">
              <FormGroup>
                <label>Abono</label>
                <Input type="number" name="Abono" value={form.Abono} onChange={handleChange} />
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md="6">
              <FormGroup>
                <label>Restante</label>
                <Input type="number" name="Restante" value={form.Restante} onChange={handleChange} />
              </FormGroup>
            </Col>
            <Col md="6">
              <FormGroup>
                <label>Forma de Pago</label>
                <Input type="text" name="FormaPago" value={form.FormaPago} onChange={handleChange} />
              </FormGroup>
            </Col>
          </Row>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={editar}>
            Guardar Cambios
          </Button>{' '}
          <Button color="secondary" onClick={() => setModalOpen(false)}>
            Cancelar
          </Button>
        </ModalFooter>
      </Modal>
    
    </Container>
    
  );
};

export default Reservas;
