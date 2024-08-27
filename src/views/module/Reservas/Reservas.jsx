// Importación de React y hooks
import React, { useState } from "react";

// Importación de Bootstrap y otros componentes necesarios
import 'bootstrap/dist/css/bootstrap.min.css';
import { Table, Button, Container, Row, Col, FormGroup, Input, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { FaEdit, FaTrashAlt } from 'react-icons/fa'; // Iconos de edición y eliminación
import { Snackbar, Alert } from '@mui/material'; // Componentes para notificaciones

// Datos iniciales de ejemplo
const initialData = [
  { id: 1, NombreCompleto: "Juan Pérez", Distintivo: "7867", CategoriaCliente: "regular", Correo: "juan.perez@example.com", Celular: "3123456789", Estado: "Activo", Direccion: "Cl 76 j 12b 55", NroPersonas: 50, CantidadMesas: 10, TipoEvento: "Boda", DuracionEvento: "4 horas", FechaHora: "2024-09-15T14:00", ServiciosAdicionales: "Decoración", Observaciones: "Preferencia en flores", MontoDecoracion: 500, TotalPagar: 1000, Abono: 200, Restante: 800, FormaPago: "Efectivo" },
  { id: 2, NombreCompleto: "Ana Torres", Distintivo: "7576", CategoriaCliente: "familiar", Correo: "ana.torres@example.com", Celular: "3109876543", Estado: "Inactivo", Direccion: "Av. El Dorado 92-45", NroPersonas: 30, CantidadMesas: 6, TipoEvento: "Cumpleaños", DuracionEvento: "3 horas", FechaHora: "2024-10-05T18:00", ServiciosAdicionales: "Catering", Observaciones: "Sin gluten", MontoDecoracion: 300, TotalPagar: 600, Abono: 100, Restante: 500, FormaPago: "Tarjeta" },
  // Más datos de ejemplo...
];

// Componente principal "Reservas"
const Reservas = () => {
  // Estado para manejar los datos de reservas
  const [data, setData] = useState(initialData);

  // Estado para manejar los datos del formulario
  const [form, setForm] = useState({
    id: '',
    NombreCompleto: '',
    Distintivo: '',
    CategoriaCliente: '',
    Correo: '',
    Celular: '',
    Estado: 'Activo',
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

  // Estado para manejar si se está editando una reserva
  const [isEditing, setIsEditing] = useState(false);

  // Estado para manejar si se muestra el formulario
  const [showForm, setShowForm] = useState(false);

  // Estado para manejar el texto de búsqueda
  const [searchText, setSearchText] = useState('');

  // Estado para manejar la apertura y cierre del Snackbar (notificaciones)
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  // Estado para manejar la página actual en la paginación
  const [currentPage, setCurrentPage] = useState(1);

  // Estado para manejar la apertura del modal de edición
  const [modalOpen, setModalOpen] = useState(false);

  // Número de elementos por página
  const itemsPerPage = 7;

  // Función para manejar la búsqueda de reservas
  const handleSearch = (e) => {
    setSearchText(e.target.value.toLowerCase());
  };

  // Función para manejar los cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prevForm => ({
      ...prevForm,
      [name]: value
    }));
  };

  // Función para manejar el cambio de página
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Función para abrir el Snackbar con un mensaje
  const openSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Función para cerrar el Snackbar
  const closeSnackbar = () => {
    setSnackbarOpen(false);
  };

  // Función para manejar el envío del formulario (agregar reserva)
  const handleSubmit = () => {
    const { NombreCompleto, Distintivo, CategoriaCliente, Correo, Celular, Direccion, NroPersonas, CantidadMesas, TipoEvento, DuracionEvento, FechaHora, ServiciosAdicionales, Observaciones, MontoDecoracion, TotalPagar, Abono, Restante, FormaPago } = form;

    // Validación de campos
    if (!NombreCompleto || !Distintivo || !CategoriaCliente || !Correo || !Celular || !Direccion || !NroPersonas || !CantidadMesas || !TipoEvento || !DuracionEvento || !FechaHora || !ServiciosAdicionales || !Observaciones || !MontoDecoracion || !TotalPagar || !Abono || !Restante || !FormaPago) {
      openSnackbar("Por favor, ingrese todos los campos", 'warning');
      return;
    }

    // Verificación de reserva existente por distintivo
    const reservaExistente = data.find(registro => registro.Distintivo.toString() === Distintivo.toString());
    if (reservaExistente) {
      openSnackbar("La reserva ya existe. Por favor, ingrese un distintivo diferente.", 'error');
      return;
    }

    // Creación de una nueva reserva
    const nuevaReserva = {
      ...form,
      id: data.length ? Math.max(...data.map(res => res.id)) + 1 : 1
    };

    // Actualización del estado con la nueva reserva
    setData([...data, nuevaReserva]);

    // Reinicio del formulario
    setForm({
      id: '',
      NombreCompleto: '',
      Distintivo: '',
      CategoriaCliente: '',
      Correo: '',
      Celular: '',
      Estado: 'Activo',
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

  // Función para manejar la edición de una reserva
  const editar = () => {
    const { NombreCompleto, Distintivo, CategoriaCliente, Correo, Celular, Direccion, NroPersonas, CantidadMesas, TipoEvento, DuracionEvento, FechaHora, ServiciosAdicionales, Observaciones, MontoDecoracion, TotalPagar, Abono, Restante, FormaPago } = form;

    // Validación de campos
    if (!NombreCompleto || !Distintivo || !CategoriaCliente || !Correo || !Celular || !Direccion || !NroPersonas || !CantidadMesas || !TipoEvento || !DuracionEvento || !FechaHora || !ServiciosAdicionales || !Observaciones || !MontoDecoracion || !TotalPagar || !Abono || !Restante || !FormaPago) {
      openSnackbar("Por favor, ingrese todos los campos", 'warning');
      return;
    }

    // Verificación de reserva existente por distintivo, excluyendo la actual
    const reservaExistente = data.find(
      (registro) => registro.Distintivo.toString() === Distintivo.toString() &&
      registro.id !== form.id
    );
    if (reservaExistente) {
      openSnackbar("Ya existe una reserva con el mismo distintivo. Por favor, ingresa un distintivo diferente.", 'error');
      return;
    }

    // Actualización de la reserva existente
    const updatedData = data.map((registro) =>
      registro.id === form.id ? { ...form } : registro
    );

    setData(updatedData);
    setIsEditing(false);
    setModalOpen(false);
    openSnackbar("Reserva editada exitosamente", 'success');
  };

  // Función para manejar la eliminación de una reserva
  const eliminar = (dato) => {
    if (window.confirm(`¿Realmente desea eliminar el registro ${dato.id}?`)) {
      const updatedData = data.filter(registro => registro.id !== dato.id);
      setData(updatedData);
      openSnackbar("Reserva eliminada exitosamente", 'success');
    }
  };

  // Función para cambiar el estado (activo/inactivo) de una reserva
  const cambiarEstado = (id) => {
    const updatedData = data.map((registro) => {
      if (registro.id === id) {
        registro.Estado = registro.Estado === 'Activo' ? 'Inactivo' : 'Activo';
      }
      return registro;
    });

    setData(updatedData);
    openSnackbar("Estado de la reserva actualizado exitosamente", 'success');
  };

  // Filtrado de datos según el texto de búsqueda
  const filteredData = data.filter(item =>
    item.NombreCompleto.toLowerCase().includes(searchText) ||
    item.Distintivo.toLowerCase().includes(searchText) ||
    item.CategoriaCliente.toLowerCase().includes(searchText) ||
    item.Celular.toString().includes(searchText) ||
    item.Correo.toLowerCase().includes(searchText) ||
    item.Direccion.toLowerCase().includes(searchText)
  );

  // Cálculo de los índices para la paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  // Cálculo de los números de página
  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(filteredData.length / itemsPerPage); i++) {
    pageNumbers.push(i);
  }

  return (
    <Container>
      <br />

      {/* Solo se muestra cuando no se está en la pantalla de agregar o editar reserva */}
      {!showForm && (
        <>
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
            <Button color="success" onClick={() => { setForm({ id: '', NombreCompleto: '', Distintivo: '', CategoriaCliente: '', Correo: '', Celular: '', Estado: 'Activo', Direccion: '', NroPersonas: '', CantidadMesas: '', TipoEvento: '', DuracionEvento: '', FechaHora: '', ServiciosAdicionales: '', Observaciones: '', MontoDecoracion: '', TotalPagar: '', Abono: '', Restante: '', FormaPago: '' }); setIsEditing(false); setShowForm(true); }}>
              Agregar Reserva
            </Button>
          </div>
        </>
      )}

      {!showForm && (
        <>
          <Table className="table table-hover">
            <thead>
              <tr>
                <th>id</th>
                <th>Nombre Completo</th>
                <th>Distintivo</th>
                <th>Categoria Cliente</th>
                <th>Correo</th>
                <th>Celular</th>
                <th>Dirección</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((dato) => (
                <tr key={dato.id}>
                  <td>{dato.id}</td>
                  <td>{dato.NombreCompleto}</td>
                  <td>{dato.Distintivo}</td>
                  <td>{dato.CategoriaCliente}</td>
                  <td>{dato.Correo}</td>
                  <td>{dato.Celular}</td>
                  <td>{dato.Direccion}</td>
                  <td>
                    <Button color={dato.Estado === 'Activo' ? "success" : "secondary"} onClick={() => cambiarEstado(dato.id)}>
                      {dato.Estado}
                    </Button>
                  </td>
                  <td>
                    <Button color="primary" onClick={() => { setForm(dato); setIsEditing(true); setModalOpen(true); }}>
                      <FaEdit />
                    </Button>{" "}
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
            {pageNumbers.map(number => (
              <Button
                key={number}
                color="info"
                onClick={() => handlePageChange(number)}
                className="mx-1"
              >
                {number}
              </Button>
            ))}
          </div>
        </>
      )}

      {/* Mostrar formulario cuando `showForm` sea verdadero */}
      {showForm && (
        <div className="mt-4">
          <h2>{isEditing ? "Editar Reserva" : "Agregar Reserva"}</h2>
          <br />
          <Row>
            <Col md={6}>
              <FormGroup>
                <label>Nombre Completo:</label>
                <Input
                  type="text"
                  name="NombreCompleto"
                  value={form.NombreCompleto}
                  onChange={handleChange}
                  style={{ border: '2px solid #000000' }}
                />
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <label>Distintivo:</label>
                <Input
                  type="text"
                  name="Distintivo"
                  value={form.Distintivo}
                  onChange={handleChange}
                  style={{ border: '2px solid #000000' }}
                />
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <FormGroup>
                <label>Categoría Cliente:</label>
                <Input
                  type="text"
                  name="CategoriaCliente"
                  value={form.CategoriaCliente}
                  onChange={handleChange}
                  style={{ border: '2px solid #000000' }}
                />
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <label>Correo:</label>
                <Input
                  type="text"
                  name="Correo"
                  value={form.Correo}
                  onChange={handleChange}
                  style={{ border: '2px solid #000000' }}
                />
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <FormGroup>
                <label>Celular:</label>
                <Input
                  type="text"
                  name="Celular"
                  value={form.Celular}
                  onChange={handleChange}
                  style={{ border: '2px solid #000000' }}
                />
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <label>Dirección:</label>
                <Input
                  type="text"
                  name="Direccion"
                  value={form.Direccion}
                  onChange={handleChange}
                  style={{ border: '2px solid #000000' }}
                />
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <FormGroup>
                <label>Número de Personas:</label>
                <Input
                  type="number"
                  name="NroPersonas"
                  value={form.NroPersonas}
                  onChange={handleChange}
                  style={{ border: '2px solid #000000' }}
                />
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <label>Cantidad de Mesas:</label>
                <Input
                  type="number"
                  name="CantidadMesas"
                  value={form.CantidadMesas}
                  onChange={handleChange}
                  style={{ border: '2px solid #000000' }}
                />
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <FormGroup>
                <label>Tipo de Evento:</label>
                <Input
                  type="text"
                  name="TipoEvento"
                  value={form.TipoEvento}
                  onChange={handleChange}
                  style={{ border: '2px solid #000000' }}
                />
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <label>Duración del Evento:</label>
                <Input
                  type="text"
                  name="DuracionEvento"
                  value={form.DuracionEvento}
                  onChange={handleChange}
                  style={{ border: '2px solid #000000' }}
                />
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <FormGroup>
                <label>Fecha y Hora:</label>
                <Input
                  type="datetime-local"
                  name="FechaHora"
                  value={form.FechaHora}
                  onChange={handleChange}
                  style={{ border: '2px solid #000000' }}
                />
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <label>Servicios Adicionales:</label>
                <Input
                  type="text"
                  name="ServiciosAdicionales"
                  value={form.ServiciosAdicionales}
                  onChange={handleChange}
                  style={{ border: '2px solid #000000' }}
                />
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <FormGroup>
                <label>Observaciones:</label>
                <Input
                  type="text"
                  name="Observaciones"
                  value={form.Observaciones}
                  onChange={handleChange}
                  style={{ border: '2px solid #000000' }}
                />
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <label>Monto de Decoración:</label>
                <Input
                  type="number"
                  name="MontoDecoracion"
                  value={form.MontoDecoracion}
                  onChange={handleChange}
                  style={{ border: '2px solid #000000' }}
                />
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <FormGroup>
                <label>Total a Pagar:</label>
                <Input
                  type="number"
                  name="TotalPagar"
                  value={form.TotalPagar}
                  onChange={handleChange}
                  style={{ border: '2px solid #000000' }}
                />
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <label>Abono:</label>
                <Input
                  type="number"
                  name="Abono"
                  value={form.Abono}
                  onChange={handleChange}
                  style={{ border: '2px solid #000000' }}
                />
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <FormGroup>
                <label>Restante:</label>
                <Input
                  type="number"
                  name="Restante"
                  value={form.Restante}
                  onChange={handleChange}
                  style={{ border: '2px solid #000000' }}
                />
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <label>Forma de Pago:</label>
                <Input
                  type="text"
                  name="FormaPago"
                  value={form.FormaPago}
                  onChange={handleChange}
                  style={{ border: '2px solid #000000' }}
                />
              </FormGroup>
            </Col>
          </Row>
          <Button style={{ background: '#2e8322' }} onClick={isEditing ? editar : handleSubmit}>
            {isEditing ? "Guardar Cambios" : "Agregar"}
          </Button>{" "}
          <Button style={{ background: '#6d0f0f' }} onClick={() => setShowForm(false)}>
            Cancelar
          </Button>
        </div>
      )}

      {/* Modal de edición */}
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)}>
        <ModalHeader toggle={() => setModalOpen(!modalOpen)}>Editar Reserva</ModalHeader>
        <ModalBody>
          {/* Formulario de edición dentro del modal */}
          <Row>
            <Col md={6}>
              <FormGroup>
                <label>Nombre Completo:</label>
                <Input
                  type="text"
                  name="NombreCompleto"
                  value={form.NombreCompleto}
                  onChange={handleChange}
                  style={{ border: '2px solid #000000' }}
                />
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <label>Distintivo:</label>
                <Input
                  type="text"
                  name="Distintivo"
                  value={form.Distintivo}
                  onChange={handleChange}
                  style={{ border: '2px solid #000000' }}
                />
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <FormGroup>
                <label>Categoría Cliente:</label>
                <Input
                  type="text"
                  name="CategoriaCliente"
                  value={form.CategoriaCliente}
                  onChange={handleChange}
                  style={{ border: '2px solid #000000' }}
                />
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <label>Correo:</label>
                <Input
                  type="text"
                  name="Correo"
                  value={form.Correo}
                  onChange={handleChange}
                  style={{ border: '2px solid #000000' }}
                />
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <FormGroup>
                <label>Celular:</label>
                <Input
                  type="text"
                  name="Celular"
                  value={form.Celular}
                  onChange={handleChange}
                  style={{ border: '2px solid #000000' }}
                />
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <label>Dirección:</label>
                <Input
                  type="text"
                  name="Direccion"
                  value={form.Direccion}
                  onChange={handleChange}
                  style={{ border: '2px solid #000000' }}
                />
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <FormGroup>
                <label>Número de Personas:</label>
                <Input
                  type="number"
                  name="NroPersonas"
                  value={form.NroPersonas}
                  onChange={handleChange}
                  style={{ border: '2px solid #000000' }}
                />
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <label>Cantidad de Mesas:</label>
                <Input
                  type="number"
                  name="CantidadMesas"
                  value={form.CantidadMesas}
                  onChange={handleChange}
                  style={{ border: '2px solid #000000' }}
                />
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <FormGroup>
                <label>Tipo de Evento:</label>
                <Input
                  type="text"
                  name="TipoEvento"
                  value={form.TipoEvento}
                  onChange={handleChange}
                  style={{ border: '2px solid #000000' }}
                />
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <label>Duración del Evento:</label>
                <Input
                  type="text"
                  name="DuracionEvento"
                  value={form.DuracionEvento}
                  onChange={handleChange}
                  style={{ border: '2px solid #000000' }}
                />
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <FormGroup>
                <label>Fecha y Hora:</label>
                <Input
                  type="datetime-local"
                  name="FechaHora"
                  value={form.FechaHora}
                  onChange={handleChange}
                  style={{ border: '2px solid #000000' }}
                />
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <label>Servicios Adicionales:</label>
                <Input
                  type="text"
                  name="ServiciosAdicionales"
                  value={form.ServiciosAdicionales}
                  onChange={handleChange}
                  style={{ border: '2px solid #000000' }}
                />
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <FormGroup>
                <label>Observaciones:</label>
                <Input
                  type="text"
                  name="Observaciones"
                  value={form.Observaciones}
                  onChange={handleChange}
                  style={{ border: '2px solid #000000' }}
                />
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <label>Monto de Decoración:</label>
                <Input
                  type="number"
                  name="MontoDecoracion"
                  value={form.MontoDecoracion}
                  onChange={handleChange}
                  style={{ border: '2px solid #000000' }}
                />
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <FormGroup>
                <label>Total a Pagar:</label>
                <Input
                  type="number"
                  name="TotalPagar"
                  value={form.TotalPagar}
                  onChange={handleChange}
                  style={{ border: '2px solid #000000' }}
                />
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <label>Abono:</label>
                <Input
                  type="number"
                  name="Abono"
                  value={form.Abono}
                  onChange={handleChange}
                  style={{ border: '2px solid #000000' }}
                />
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <FormGroup>
                <label>Restante:</label>
                <Input
                  type="number"
                  name="Restante"
                  value={form.Restante}
                  onChange={handleChange}
                  style={{ border: '2px solid #000000' }}
                />
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <label>Forma de Pago:</label>
                <Input
                  type="text"
                  name="FormaPago"
                  value={form.FormaPago}
                  onChange={handleChange}
                  style={{ border: '2px solid #000000' }}
                />
              </FormGroup>
            </Col>
          </Row>
          <Button style={{ background: '#2e8322' }} onClick={editar}>
            Guardar Cambios
          </Button>{" "}
          <Button style={{ background: '#6d0f0f' }} onClick={() => setModalOpen(false)}>
            Cancelar
          </Button>
        </ModalBody>
      </Modal>
    </Container>
  );
};

export default Reservas;
