import React, { useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Table, Button, Container, Row, Col, FormGroup, Input, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import { IoSearchOutline } from "react-icons/io5";
import { Snackbar, Alert } from '@mui/material';

const initialData = [
  // Los datos iniciales se mantienen igual
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
  const [tableSearchText, setTableSearchText] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false); // Estado para el modal de edición
  const itemsPerPage = 7;

  const handleTableSearch = (e) => {
    setTableSearchText(e.target.value.toLowerCase());
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
    item.Nombre.toLowerCase().includes(tableSearchText) ||
    item.Document.toString().includes(tableSearchText) ||
    item.FechaIni.toLowerCase().includes(tableSearchText) ||
    item.NumeroSS.toString().includes(tableSearchText)
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
      {/* Mostrar la sección de búsqueda y el botón solo si no se está mostrando el formulario */}
      {!showForm && (
        <>
          <h2>Lista de Empleados</h2>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Input
              type="text"
              placeholder="Buscar empleado en la tabla"
              value={tableSearchText}
              onChange={handleTableSearch}
              style={{ width: '50%' }}
            />
            <Button color="success" onClick={() => { setForm({ id: '', Nombre: '', Document: '', FechaIni: '', NumeroSS: '', Direccion: '', TipoContrato: '', Estado: true }); setIsEditing(false); setShowForm(true); }}>
              Agregar Empleado
            </Button>
          </div>
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
                  <td colSpan="9" className="text-center">No hay datos disponibles</td>
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
        <div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="text-star" >{isEditing ? 'Editar empleado' : 'Agregar empleado'}</h2>
            <div className="d-flex align-items-center">
              <Input
                type="text"
                placeholder="Buscar documento de usuario"
                value={tableSearchText}
                onChange={handleTableSearch}
                style={{ width: '60vh', marginRight: '8px' ,border:'2px solid #353535'}} // Ajusta el ancho y el margen a tu preferencia
              />
              <IoSearchOutline size={24} />
            </div>
          </div>     
          <br />
          <Row>
            <Col md={4}>
              <FormGroup>
                <label style={{fontSize:'15px', padding:'5px'}}>
                  Nombre completo 
                </label>
                <Input
                  type="text"
                  name="Nombre"
                  value={form.Nombre}
                  onChange={handleChange}
                  placeholder="Nombre del empleado"
                  style={{ border: '2px solid #000000' }}
                />
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label style={{fontSize:'15px', padding:'5px'}}>Documento</label>
                <Input
                  type="text"
                  name="Document"
                  value={form.Document}
                  onChange={handleChange}
                  placeholder="Número de documento"
                  style={{ border: '2px solid #000000' }}
                />
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label style={{fontSize:'15px', padding:'5px'}}>Fecha de Inicio</label>
                <Input
                  type="date"
                  name="FechaIni"
                  value={form.FechaIni}
                  onChange={handleChange}
                  placeholder="Fecha de inicio"
                  style={{ border: '2px solid #000000' }}
                />
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md={4} style={{fontSize:'15px', padding:'5px'}}>
              <FormGroup>
                <label>Número de Seguridad Social</label>
                <Input
                  type="text"
                  name="NumeroSS"
                  value={form.NumeroSS}
                  onChange={handleChange}
                  placeholder="Número de seguridad social"
                  style={{ border: '2px solid #000000' }}
                />
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label style={{fontSize:'15px', padding:'5px'}}>Dirección</label>
                <Input
                  type="text"
                  name="Direccion"
                  value={form.Direccion}
                  onChange={handleChange}
                  placeholder="Dirección"
                  style={{ border: '2px solid #000000' }}
                />
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label style={{fontSize:'15px', padding:'5px'}}>Tipo de Contrato</label>
                <Input
                  type="text"
                  name="TipoContrato"
                  value={form.TipoContrato}
                  onChange={handleChange}
                  placeholder="Tipo de contrato"
                  style={{ border: '2px solid #000000' }}
                />
              </FormGroup>
            </Col>
          </Row>
          <div className="d-flex justify-content-star mt-3">
          <Button style={{background:'#2e8322'}} onClick={handleSubmit}>
              {isEditing ? 'Actualizar' : 'Agregar'}
            </Button>
            
            <Button style={{background:'#6d0f0f'}} onClick={() => { setShowForm(false); setIsEditing(false); }}>
              Cancelar
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
        </ModalBody>
        <ModalFooter>
          <Button color="6d0f0f" onClick={() => setModalOpen(false)}>
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
