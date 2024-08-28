import React, { useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Table, Button, Container, Row, Col, Form, FormGroup, Input, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import { Snackbar, Alert } from '@mui/material';

const initialData = [
  {id: 1, NombreCompleto: "Carolina Guzman", TipoDocument: 13132312, Document: 16514416, Telefono: 3527158372, Empresa: "Sena"},
  {id: 2, NombreCompleto: "Andra Torres", TipoDocument: 0, Document: 18761919, Telefono: 0, Empresa: "Desconocida"},
  {id: 3, NombreCompleto: "Natalia Muriel", TipoDocument: 0, Document: 1016177143, Telefono: 0, Empresa: "Desconocida"},
  {id: 4, NombreCompleto: "Luis Pérez", TipoDocument: 0, Document: 12345678, Telefono: 0, Empresa: "Desconocida"},
  {id: 5, NombreCompleto: "María Gómez", TipoDocument: 0, Document: 23456789, Telefono: 0, Empresa: "Desconocida"},
  {id: 6, NombreCompleto: "Pedro Martínez", TipoDocument: 0, Document: 34567890, Telefono: 0, Empresa: "Desconocida"},
  {id: 7, NombreCompleto: "Laura Fernández", TipoDocument: 0, Document: 45678901, Telefono: 0, Empresa: "Desconocida"},
  {id: 8, NombreCompleto: "Carlos Rodríguez", TipoDocument: 0, Document: 56789012, Telefono: 0, Empresa: "Desconocida"}  
];

const Proveedores = () => {
  const [data, setData] = useState(initialData);
  const [form, setForm] = useState({
    id: '',
    NombreCompleto: '',
    TipoDocument:'',
    Document:'',
    Telefono:'',
    Empresa:'',
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

  // States for validation
  const [formErrors, setFormErrors] = useState({
    NombreCompleto: false,
    TipoDocument: false,
    Document: false,
    Telefono: false,
    Empresa: false,
  });

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

  const validateForm = () => {
    const errors = {
      NombreCompleto: !form.NombreCompleto,
      TipoDocument: !form.TipoDocument,
      Document: !form.Document,
      Telefono: !form.Telefono,
      Empresa: !form.Empresa
    };
    setFormErrors(errors);
    return !Object.values(errors).includes(true);
  };
  
  const handleSubmit = () => {
    if (!validateForm()) {
      openSnackbar("Por favor, ingrese todos los campos", 'warning');
      return;
    }

    const { NombreCompleto, TipoDocument,  Document, Telefono, Empresa} = form;
  
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
      NombreCompleto: '',
      TipoDocument:'',
      Document: '',
      Telefono:'',
      Empresa:'',
      Estado: true
    });
    setShowForm(false);
    openSnackbar("Empleado agregado exitosamente", 'success');
  };

  const editar = () => {
    if (!validateForm()) {
      openSnackbar("Por favor, ingrese todos los campos", 'warning');
      return;
    }
  
    const empleadoExistente = data.find(
      (registro) => registro.Document.toString() === form.Document.toString() &&
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
    item.NombreCompleto.toLowerCase().includes(tableSearchText) ||
    item.Document.toString().includes(tableSearchText) ||
    item.Empresa.toLowerCase().includes(tableSearchText)
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
          <h2>Lista de Proveedores</h2>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Input
              type="text"
              placeholder="Buscar proveedor"
              value={tableSearchText}
              onChange={handleTableSearch}
              style={{ width: '50%' }}
            />
            <Button color="success" onClick={() => { setForm({ id: '', NombreCompleto: '', TipoDocument:'', Document: '', Telefono:'',Empresa:'', Estado: true }); setIsEditing(false); setShowForm(true); }}>
              Agregar Empleado
            </Button>
          </div>
          <Table className="table table-sm table-hover">
            <thead>
              <tr>
                <th>id</th>
                <th>Nombre Completo</th>
                <th>Tipo documento</th>
                <th>Documento</th>
                <th>Telefono</th>
                <th>Empresa</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.NombreCompleto}</td>
                    <td>{item.TipoDocument}</td>
                    <td>{item.Document}</td>
                    <td>{item.Telefono}</td>
                    <td>{item.Empresa}</td>
                    <td>
                      <Button
                        color={item.Estado ? "success" : "danger"}
                        onClick={() => cambiarEstado(item.id)}
                        className="me-2 btn-sm"
                      >
                        {item.Estado ? "On" : "Off"}
                      
                      </Button>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <Button color="info" onClick={() => { setForm(item); setIsEditing(true); setModalOpen(true); }} className="me-2 btn-sm">
                          <FaEdit />
                        </Button>
                        <Button color="danger" onClick={() => eliminar(item)} className="me-2 btn-sm">
                          <FaTrashAlt />
                        </Button>
                      </div>
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

          <ul className="pagination">
        {pageNumbers.map(number => (
          <li key={number} className={`page-item ${currentPage === number ? 'active' : ''}`}>
            <Button className="page-link" onClick={() => handlePageChange(number)}>
              {number}
            </Button>
          </li>
        ))}
      </ul>


        </>
      )}

      {/* Formulario de inserción */}
      {showForm && (
        <div className="container">
          <h1 className="text-center">Crear Proveedores</h1>
            <br />
            <Form>
              <Row className="justify-content-center">
                <Col md={12}>
                  <FormGroup>
                    <label style={{ fontSize: '15px', padding: '5px' }}>
                      Nombre Completo
                    </label>
                    <Input
                      type="text"
                      name="NombreCompleto"
                      value={form.NombreCompleto}
                      onChange={handleChange}
                      placeholder="Nombre Completo del empleado"
                      className={`form-control ${formErrors.NombreCompleto ? 'is-invalid' : ''}`}
                      style={{ border: '2px solid black', width: '50%' }}
                    />
                    {formErrors.NombreCompleto && <div className="invalid-feedback">Este campo es obligatorio.</div>}
                  </FormGroup>
                </Col>
              </Row>

              <Row className="justify-content-center">
                <Col md={12}>
                  <FormGroup>
                    <label style={{ fontSize: '15px', padding: '5px' }}>
                      Tipo de Documento
                    </label>
                    <Input
                      type="text"
                      name="TipoDocument"
                      value={form.TipoDocument}
                      onChange={handleChange}
                      placeholder="Tipo de documento"
                      className={`form-control ${formErrors.TipoDocument ? 'is-invalid' : ''}`}
                      style={{ border: '2px solid black', width: '50%' }}
                    />
                    {formErrors.TipoDocument && <div className="invalid-feedback">Este campo es obligatorio.</div>}
                  </FormGroup>
                </Col>
              </Row>

              <Row className="justify-content-center">
                <Col md={12}>
                  <FormGroup>
                    <label style={{ fontSize: '15px', padding: '5px' }}>
                      Documento
                    </label>
                    <Input
                      type="text"
                      name="Document"
                      value={form.Document}
                      onChange={handleChange}
                      placeholder="Número de documento"
                      className={`form-control ${formErrors.Document ? 'is-invalid' : ''}`}
                      style={{ border: '2px solid black', width: '50%' }}
                    />
                    {formErrors.Document && <div className="invalid-feedback">Este campo es obligatorio.</div>}
                  </FormGroup>
                </Col>
              </Row>

              <Row className="justify-content-center">
                <Col md={12}>
                  <FormGroup>
                    <label style={{ fontSize: '15px', padding: '5px' }}>
                      Teléfono
                    </label>
                    <Input
                      type="text"
                      name="Telefono"
                      value={form.Telefono}
                      onChange={handleChange}
                      placeholder="Número de contacto"
                      className={`form-control ${formErrors.Telefono ? 'is-invalid' : ''}`}
                      style={{ border: '2px solid black', width: '50%' }}
                    />
                    {formErrors.Telefono && <div className="invalid-feedback">Este campo es obligatorio.</div>}
                  </FormGroup>
                </Col>
              </Row>

              <Row className="justify-content-center">
                <Col md={12}>
                  <FormGroup>
                    <label style={{ fontSize: '15px', padding: '5px' }}>
                      Empresa
                    </label>
                    <Input
                      type="text"
                      name="Empresa"
                      value={form.Empresa}
                      onChange={handleChange}
                      placeholder="Nombre de la empresa"
                      className={`form-control ${formErrors.Empresa ? 'is-invalid' : ''}`}
                      style={{ border: '2px solid black', width: '50%' }}
                    />
                    {formErrors.Empresa && <div className="invalid-feedback">Este campo es obligatorio.</div>}
                  </FormGroup>
                </Col>
              </Row>

              <Row className="justify-content-center mt-3">
                <Col md={12} className="d-flex justify-content-between">
                  <Button style={{ background: '#2e8322' }} onClick={handleSubmit}>
                    {isEditing ? 'Actualizar' : 'Agregar'}
                  </Button>
                  
                  <Button style={{ background: '#6d0f0f' }} onClick={() => { setShowForm(false); setIsEditing(false); }}>
                    Cancelar
                  </Button>
                </Col>
              </Row>
            </Form>
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
                <label style={{fontSize:'15px', padding:'5px'}}>
                  Nombre Completo 
                </label>
                <Input
                  type="text"
                  name="NombreCompleto"
                  value={form.NombreCompleto}
                  onChange={handleChange}
                  placeholder="Nombre Completo del empleado"
                  className={`form-control ${formErrors.NombreCompleto ? 'is-invalid' : ''}`}
                />
                {formErrors.NombreCompleto && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label style={{fontSize:'15px', padding:'5px'}}>Tipo de Documento</label>
                <Input
                  type="text"
                  name="TipoDocument"
                  value={form.TipoDocument}
                  onChange={handleChange}
                  placeholder="Número de documento"
                  className={`form-control ${formErrors.TipoDocument ? 'is-invalid' : ''}`}
                />
                {formErrors.TipoDocument && <div className="invalid-feedback">Este campo es obligatorio.</div>}
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
                  className={`form-control ${formErrors.Document ? 'is-invalid' : ''}`}
                />
                {formErrors.Document && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md={4}>
              <FormGroup>
                <label style={{fontSize:'15px', padding:'5px'}}>Telefono</label>
                <Input
                  type="text"
                  name="Telefono"
                  value={form.Telefono}
                  onChange={handleChange}
                  placeholder="Número de contacto de emergencia"
                  className={`form-control ${formErrors.Telefono ? 'is-invalid' : ''}`}
                />
                {formErrors.Telefono && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label style={{fontSize:'15px', padding:'5px'}}>Empresa</label>
                <Input
                  type="text"
                  name="Empresa"
                  value={form.Empresa}
                  onChange={handleChange}
                  placeholder="Número de Empresa"
                  className={`form-control ${formErrors.Empresa ? 'is-invalid' : ''}`}
                />
                {formErrors.Empresa && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
            </Col>
          </Row>
        </ModalBody>
        <ModalFooter>
        <Button color="danger" onClick={() => setModalOpen(false)}>
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

export default Proveedores;
