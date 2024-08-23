import React, { useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Table, Button, Container, Row, Col, FormGroup, Input, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import { Snackbar, Alert } from '@mui/material';

const initialData = [
  { id: 1, Nombre: "Carolina Guzman", Document: 16514416, FechaIni: "15-07-2020", NumeroSS: 61515371, Direccion: "cl 76 j 12b 55", TipoContrato: "doble tiempo" },
  { id: 2, Nombre: "Andra Torres", Document: 18761919, FechaIni: "01-02-2023", NumeroSS: 12345678, Direccion: "Av. El Dorado 92-45", TipoContrato: "tiempo completo" },
  { id: 3, Nombre: "Natalia Muriel", Document: 1016177143, FechaIni: "15-03-2022", NumeroSS: 23456789, Direccion: "Cra 15 #76-30", TipoContrato: "tiempo completo" },
  { id: 4, Nombre: "Luis Pérez", Document: 12345678, FechaIni: "10-11-2021", NumeroSS: 34567890, Direccion: "Cl 10 #15-20", TipoContrato: "medio tiempo" },
  { id: 5, Nombre: "María Gómez", Document: 23456789, FechaIni: "20-09-2020", NumeroSS: 45678901, Direccion: "Cra 7 #22-12", TipoContrato: "tiempo completo" },
  { id: 6, Nombre: "Pedro Martínez", Document: 34567890, FechaIni: "05-06-2021", NumeroSS: 56789012, Direccion: "Cl 80 #14-05", TipoContrato: "tiempo completo" },
  { id: 7, Nombre: "Laura Fernández", Document: 45678901, FechaIni: "12-04-2023", NumeroSS: 67890123, Direccion: "Av. 68 #10-20", TipoContrato: "medio tiempo" },
  { id: 8, Nombre: "Carlos Rodríguez", Document: 56789012, FechaIni: "01-01-2020", NumeroSS: 78901234, Direccion: "Cra 50 #30-40", TipoContrato: "tiempo completo" }
];

const Empleados = () => {
  const [data, setData] = useState(initialData);
  const [form, setForm] = useState({
    id: '',
    Nombre: '',
    Document: '',
    FechaIni: '',
    NumeroSS: '',
    Direccion: '',
    TipoContrato: '',
    Estado: true
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false); // Estado para el modal de edición
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
    const { Nombre, Document, FechaIni, NumeroSS, Direccion, TipoContrato } = form;
  
    if (!Nombre || !Document || !FechaIni || !NumeroSS || !Direccion || !TipoContrato) {
      openSnackbar("Por favor, ingrese todos los campos", 'warning');
      return;
    }
  
    const empleadoExistente = data.find(registro => registro.Document.toString() === Document.toString());
    if (empleadoExistente) {
      openSnackbar("El empleado ya existe. Por favor, ingrese un documento de empleado diferente.", 'error');
      return;
    }
  
    const nuevoEmpleado = {
      ...form,
      id: data.length ? Math.max(...data.map(emp => emp.id)) + 1 : 1
    };
  
    setData([...data, nuevoEmpleado]);
    setForm({
      id: '',
      Nombre: '',
      Document: '',
      FechaIni: '',
      NumeroSS: '',
      Direccion: '',
      TipoContrato: '',
      Estado: true
    });
    setShowForm(false);
    openSnackbar("Empleado agregado exitosamente", 'success');
  };

  const editar = () => {
    const { Nombre, Document, FechaIni, NumeroSS, Direccion, TipoContrato } = form;
  
    if (!Nombre || !Document || !FechaIni || !NumeroSS || !Direccion || !TipoContrato) {
      openSnackbar("Por favor, ingrese todos los campos", 'warning');
      return;
    }
  
    const empleadoExistente = data.find(
      (registro) => registro.Document.toString() === Document.toString() &&
      registro.id !== form.id
    );
  
    if (empleadoExistente) {
      openSnackbar("Ya existe un empleado con el mismo documento. Por favor, ingresa un documento diferente.", 'error');
      return;
    }
  
    const updatedData = data.map((registro) =>
      registro.id === form.id ? { ...form } : registro
    );
  
    setData(updatedData);
    setIsEditing(false);
    setModalOpen(false); // Cierra el modal después de actualizar
    openSnackbar("Empleado editado exitosamente", 'success');
  };

  const eliminar = (dato) => {
    if (window.confirm(`¿Realmente desea eliminar el registro ${dato.id}?`)) {
      const updatedData = data.filter(registro => registro.id !== dato.id);
      setData(updatedData);
      openSnackbar("Empleado eliminado exitosamente", 'success');
    }
  };

  const cambiarEstado = (id) => {
    const updatedData = data.map((registro) => {
      if (registro.id === id) {
        registro.Estado = !registro.Estado;
      }
      return registro;
    });

    setData(updatedData);
    openSnackbar("Estado del empleado actualizado exitosamente", 'success');
  };

  const filteredData = data.filter(item =>
    item.Nombre.toLowerCase().includes(searchText) ||
    item.Document.toString().includes(searchText) ||
    item.FechaIni.toLowerCase().includes(searchText) ||
    item.NumeroSS.toString().includes(searchText)
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
      <h2>Lista de Empleados</h2>
      <br />
      <div className="d-flex justify-content-between align-items-center mb-3">
        <Input
          type="text"
          placeholder="Buscar empleado"
          value={searchText}
          onChange={handleSearch}
          style={{ width: '50%' }}
        />
        <Button color="success" onClick={() => { setForm({ id: '', Nombre: '', Document: '', FechaIni: '', NumeroSS: '', Direccion: '', TipoContrato: '', Estado: true }); setIsEditing(false); setShowForm(true); }}>
          Agregar Empleado
        </Button>
      </div>

      {/* Mostrar la tabla solo si no se está mostrando el formulario */}
      {!showForm && (
        <>
          <Table className="table table-hover">
            <thead>
              <tr>
                <th>id</th>
                <th>Nombre</th>
                <th>Documento</th>
                <th>Fecha Inicio</th>
                <th>Número SS</th>
                <th>Dirección</th>
                <th>Tipo de Contrato</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.Nombre}</td>
                    <td>{item.Document}</td>
                    <td>{item.FechaIni}</td>
                    <td>{item.NumeroSS}</td>
                    <td>{item.Direccion}</td>
                    <td>{item.TipoContrato}</td>
                    <td>{item.Estado ? 'Activo' : 'Inactivo'}</td>
                    <td>
                      <Button color="info" onClick={() => { setForm(item); setIsEditing(true); setModalOpen(true); }}> <FaEdit /> </Button>{' '}
                      <Button color="danger" onClick={() => eliminar(item)}> <FaTrashAlt /> </Button>{' '}
                      <Button color={item.Estado ? "warning" : "success"} onClick={() => cambiarEstado(item.id)}>
                        {item.Estado ? 'Desactivar' : 'Activar'}
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center">No hay datos disponibles</td>
                </tr>
              )}
            </tbody>
          </Table>

          <div className="d-flex justify-content-center mt-3">
            <nav>
              <ul className="pagination">
                {pageNumbers.map(number => (
                  <li key={number} className={`page-item ${currentPage === number ? 'active' : ''}`}>
                    <Button className="page-link" onClick={() => handlePageChange(number)}>
                      {number}
                    </Button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </>
      )}

      {/* Formulario de inserción */}
      {showForm && (
        <div className="mb-3">
          <h2>{isEditing ? 'Editar empleado' : 'Agregar empleado'}</h2>
          <Row>
            <Col md={4}>
              <FormGroup>
                <label>Nombre</label>
                <Input
                  type="text"
                  name="Nombre"
                  value={form.Nombre}
                  onChange={handleChange}
                  placeholder="Nombre del empleado"
                />
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label>Documento</label>
                <Input
                  type="text"
                  name="Document"
                  value={form.Document}
                  onChange={handleChange}
                  placeholder="Número de documento"
                />
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label>Fecha de Inicio</label>
                <Input
                  type="date"
                  name="FechaIni"
                  value={form.FechaIni}
                  onChange={handleChange}
                  placeholder="Fecha de inicio"
                />
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md={4}>
              <FormGroup>
                <label>Número de Seguridad Social</label>
                <Input
                  type="text"
                  name="NumeroSS"
                  value={form.NumeroSS}
                  onChange={handleChange}
                  placeholder="Número de seguridad social"
                />
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label>Dirección</label>
                <Input
                  type="text"
                  name="Direccion"
                  value={form.Direccion}
                  onChange={handleChange}
                  placeholder="Dirección"
                />
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label>Tipo de Contrato</label>
                <Input
                  type="text"
                  name="TipoContrato"
                  value={form.TipoContrato}
                  onChange={handleChange}
                  placeholder="Tipo de contrato"
                />
              </FormGroup>
            </Col>
          </Row>
          <div className="d-flex justify-content-between">
            <Button color="secondary" onClick={() => { setShowForm(false); setIsEditing(false); }}>
              Cancelar
            </Button>
            <Button color="primary" onClick={handleSubmit}>
              {isEditing ? 'Actualizar' : 'Agregar'}
            </Button>
          </div>
        </div>
      )}

      {/* Modal de edición */}
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)}>
        <ModalHeader toggle={() => setModalOpen(!modalOpen)}>
          Editar Empleado
        </ModalHeader>
        <ModalBody>
          <Row>
            <Col md={4}>
              <FormGroup>
                <label>Nombre</label>
                <Input
                  type="text"
                  name="Nombre"
                  value={form.Nombre}
                  onChange={handleChange}
                  placeholder="Nombre del empleado"
                />
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label>Documento</label>
                <Input
                  type="text"
                  name="Document"
                  value={form.Document}
                  onChange={handleChange}
                  placeholder="Número de documento"
                />
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label>Fecha de Inicio</label>
                <Input
                  type="text"
                  name="FechaIni"
                  value={form.FechaIni}
                  onChange={handleChange}
                  placeholder="Fecha de inicio"
                />
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md={4}>
              <FormGroup>
                <label>Número de Seguridad Social</label>
                <Input
                  type="text"
                  name="NumeroSS"
                  value={form.NumeroSS}
                  onChange={handleChange}
                  placeholder="Número de seguridad social"
                />
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label>Dirección</label>
                <Input
                  type="text"
                  name="Direccion"
                  value={form.Direccion}
                  onChange={handleChange}
                  placeholder="Dirección"
                />
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label>Tipo de Contrato</label>
                <Input
                  type="text"
                  name="TipoContrato"
                  value={form.TipoContrato}
                  onChange={handleChange}
                  placeholder="Tipo de contrato"
                />
              </FormGroup>
            </Col>
          </Row>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setModalOpen(false)}>
            Cancelar
          </Button>
          <Button color="primary" onClick={editar}>
            Actualizar
          </Button>
        </ModalFooter>
      </Modal>

      {/* Snackbar */}
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={closeSnackbar}>
        <Alert onClose={closeSnackbar} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Empleados;
