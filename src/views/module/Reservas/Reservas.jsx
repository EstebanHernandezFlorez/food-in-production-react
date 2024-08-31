import React, { useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Table, Button, Container, Row, Col, FormGroup, Input, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import { Snackbar, Alert } from '@mui/material';

const initialData = [
  // Asegúrate de que los datos aquí estén correctamente formateados
];

const Reservas = () => {
  const [data, setData] = useState(initialData);
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
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  const handleSearch = (e) => {
    setSearchText(e.target.value.toLowerCase());
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prevForm => ({
      ...prevForm,
      [name]: value
    }));
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const openSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const closeSnackbar = () => {
    setSnackbarOpen(false);
  };

  const handleSubmit = () => {
    const { NombreCompleto, Distintivo, CategoriaCliente, Correo, Celular, Direccion, NroPersonas, CantidadMesas, TipoEvento, DuracionEvento, FechaHora, ServiciosAdicionales, Observaciones, MontoDecoracion, TotalPagar, Abono, Restante, FormaPago } = form;

    if (!NombreCompleto || !Distintivo || !CategoriaCliente || !Correo || !Celular || !Direccion || !NroPersonas || !CantidadMesas || !TipoEvento || !DuracionEvento || !FechaHora || !ServiciosAdicionales || !Observaciones || !MontoDecoracion || !TotalPagar || !Abono || !Restante || !FormaPago) {
      openSnackbar("Por favor, ingrese todos los campos", 'warning');
      return;
    }

    const reservaExistente = data.find(registro => registro.Distintivo.toString() === Distintivo.toString());
    if (reservaExistente) {
      openSnackbar("La reserva ya existe. Por favor, ingrese un distintivo diferente.", 'error');
      return;
    }

    const nuevaReserva = {
      ...form,
      id: data.length ? Math.max(...data.map(res => res.id)) + 1 : 1
    };

    setData([...data, nuevaReserva]);

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

  const editar = () => {
    const { NombreCompleto, Distintivo, CategoriaCliente, Correo, Celular, Direccion, NroPersonas, CantidadMesas, TipoEvento, DuracionEvento, FechaHora, ServiciosAdicionales, Observaciones, MontoDecoracion, TotalPagar, Abono, Restante, FormaPago } = form;

    if (!NombreCompleto || !Distintivo || !CategoriaCliente || !Correo || !Celular || !Direccion || !NroPersonas || !CantidadMesas || !TipoEvento || !DuracionEvento || !FechaHora || !ServiciosAdicionales || !Observaciones || !MontoDecoracion || !TotalPagar || !Abono || !Restante || !FormaPago) {
      openSnackbar("Por favor, ingrese todos los campos", 'warning');
      return;
    }

    const reservaExistente = data.find(
      (registro) => registro.Distintivo.toString() === Distintivo.toString() &&
      registro.id !== form.id
    );
    if (reservaExistente) {
      openSnackbar("Ya existe una reserva con el mismo distintivo. Por favor, ingresa un distintivo diferente.", 'error');
      return;
    }

    const updatedData = data.map((registro) =>
      registro.id === form.id ? { ...form } : registro
    );

    setData(updatedData);
    setIsEditing(false);
    setShowForm(false);
    openSnackbar("Reserva editada exitosamente", 'success');
  };

  const eliminar = (dato) => {
    if (window.confirm(`¿Realmente desea eliminar el registro ${dato.id}?`)) {
      const updatedData = data.filter(registro => registro.id !== dato.id);
      setData(updatedData);
      openSnackbar("Reserva eliminada exitosamente", 'success');
    }
  };

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

  const filteredData = data.filter(item =>
    item.NombreCompleto.toLowerCase().includes(searchText) ||
    item.Distintivo.toLowerCase().includes(searchText) ||
    item.CategoriaCliente.toLowerCase().includes(searchText) ||
    item.Celular.toString().includes(searchText) ||
    item.Correo.toLowerCase().includes(searchText) ||
    item.Direccion.toLowerCase().includes(searchText)
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  return (
    <Container>
      <Row>
        <Col md="12">
          <Button color="primary" onClick={() => setShowForm(true)}>Agregar Reserva</Button>
          <Input
            type="text"
            placeholder="Buscar..."
            value={searchText}
            onChange={handleSearch}
            style={{ margin: '10px 0' }}
          />
          <Table striped>
            <thead>
              <tr>
                <th>Nombre Completo</th>
                <th>Distintivo</th>
                <th>Categoria</th>
                <th>Correo</th>
                <th>Celular</th>
                <th>Dirección</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((dato) => (
                <tr key={dato.id}>
                  <td>{dato.NombreCompleto}</td>
                  <td>{dato.Distintivo}</td>
                  <td>{dato.CategoriaCliente}</td>
                  <td>{dato.Correo}</td>
                  <td>{dato.Celular}</td>
                  <td>{dato.Direccion}</td>
                  <td>
                    <Button color="warning" onClick={() => {
                      setForm(dato);
                      setIsEditing(true);
                      setShowForm(true);
                    }}>
                      <FaEdit />
                    </Button>
                    <Button color="danger" onClick={() => eliminar(dato)}>
                      <FaTrashAlt />
                    </Button>
                    <Button color={dato.Estado === 'Activo' ? 'success' : 'secondary'} onClick={() => cambiarEstado(dato.id)}>
                      {dato.Estado}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Row>
            <Col>
              <Button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>Anterior</Button>
              <Button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>Siguiente</Button>
            </Col>
          </Row>
        </Col>
      </Row>

      <Modal isOpen={showForm}>
        <ModalHeader>{isEditing ? 'Editar Reserva' : 'Agregar Reserva'}</ModalHeader>
        <ModalBody>
          <FormGroup>
            <label>Nombre Completo:</label>
            <Input type="text" name="NombreCompleto" value={form.NombreCompleto} onChange={handleChange} />
          </FormGroup>
          <FormGroup>
            <label>Distintivo:</label>
            <Input type="text" name="Distintivo" value={form.Distintivo} onChange={handleChange} />
          </FormGroup>
          <FormGroup>
            <label>Categoria Cliente:</label>
            <Input type="text" name="CategoriaCliente" value={form.CategoriaCliente} onChange={handleChange} />
          </FormGroup>
          <FormGroup>
            <label>Correo:</label>
            <Input type="email" name="Correo" value={form.Correo} onChange={handleChange} />
          </FormGroup>
          <FormGroup>
            <label>Celular:</label>
            <Input type="text" name="Celular" value={form.Celular} onChange={handleChange} />
          </FormGroup>
          <FormGroup>
            <label>Dirección:</label>
            <Input type="text" name="Direccion" value={form.Direccion} onChange={handleChange} />
          </FormGroup>
          <FormGroup>
            <label>Número de Personas:</label>
            <Input type="number" name="NroPersonas" value={form.NroPersonas} onChange={handleChange} />
          </FormGroup>
          <FormGroup>
            <label>Cantidad de Mesas:</label>
            <Input type="number" name="CantidadMesas" value={form.CantidadMesas} onChange={handleChange} />
          </FormGroup>
          <FormGroup>
            <label>Tipo de Evento:</label>
            <Input type="text" name="TipoEvento" value={form.TipoEvento} onChange={handleChange} />
          </FormGroup>
          <FormGroup>
            <label>Duración del Evento:</label>
            <Input type="text" name="DuracionEvento" value={form.DuracionEvento} onChange={handleChange} />
          </FormGroup>
          <FormGroup>
            <label>Fecha y Hora:</label>
            <Input type="datetime-local" name="FechaHora" value={form.FechaHora} onChange={handleChange} />
          </FormGroup>
          <FormGroup>
            <label>Servicios Adicionales:</label>
            <Input type="text" name="ServiciosAdicionales" value={form.ServiciosAdicionales} onChange={handleChange} />
          </FormGroup>
          <FormGroup>
            <label>Observaciones:</label>
            <Input type="text" name="Observaciones" value={form.Observaciones} onChange={handleChange} />
          </FormGroup>
          <FormGroup>
            <label>Monto Decoración:</label>
            <Input type="number" name="MontoDecoracion" value={form.MontoDecoracion} onChange={handleChange} />
          </FormGroup>
          <FormGroup>
            <label>Total a Pagar:</label>
            <Input type="number" name="TotalPagar" value={form.TotalPagar} onChange={handleChange} />
          </FormGroup>
          <FormGroup>
            <label>Abono:</label>
            <Input type="number" name="Abono" value={form.Abono} onChange={handleChange} />
          </FormGroup>
          <FormGroup>
            <label>Restante:</label>
            <Input type="number" name="Restante" value={form.Restante} onChange={handleChange} />
          </FormGroup>
          <FormGroup>
            <label>Forma de Pago:</label>
            <Input type="text" name="FormaPago" value={form.FormaPago} onChange={handleChange} />
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={isEditing ? editar : handleSubmit}>
            {isEditing ? 'Editar' : 'Agregar'}
          </Button>
          <Button color="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
        </ModalFooter>
      </Modal>

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={closeSnackbar}>
        <Alert onClose={closeSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Reservas;
