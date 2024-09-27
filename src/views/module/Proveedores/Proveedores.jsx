import React, { useState, useEffect } from "react";
import axios from "axios";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Table, Button, Container, Row, Col, Form, FormGroup, Input, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { FaTrashAlt } from 'react-icons/fa';
import { PlusOutlined } from '@ant-design/icons';
import { Snackbar, Alert } from '@mui/material';
import FondoForm from '../../../assets/login.jpg'
import { FiEdit } from "react-icons/fi";
import '../../../App.css'
import Swal from "sweetalert2";

const Proveedores = () => {
  const [data, setData] = useState([]);
  const [form, setForm] = useState({
    id: '',
    NombreCompleto: '',
    TipoDocument: '',
    Document: '',
    Telefono: '',
    Empresa: '',
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
  const [selectedProveedor, setSelectedProveedor] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const itemsPerPage = 10;

  // States for validation
  const [formErrors, setFormErrors] = useState({
    NombreCompleto: false,
    TipoDocument: false,
    Document: false,
    Telefono: false,
    Empresa: false,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get('http://localhost:3000/provider');
      setData(response.data);
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
    }
  };

  const handleCancel = () => {
    setModalOpen(false);
    setSelectedEmployee(null);
  };

  const handleOk = async () => {
    if (selectedProveedor) {
      try {
        await axios.delete(`http://localhost:3000/provider/${selectedProveedor._id}`);
        const updatedData = data.filter(registro => registro._id !== selectedProveedor._id);
        setData(updatedData);
        fetchData()
        openSnackbar('Éxito', 'Empleado eliminado exitosamente');
      } catch (error) {
        console.error('Error deleting provider:', error);
      }
    }
    setIsDeleteModalOpen(false);
    setSelectedProveedor(null);
  };

  const openDeleteModal = (employee) => {
    setSelectedProveedor(employee);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteModalClose = () => {
    setIsDeleteModalOpen(false);
    setSelectedProveedor(null);
  };

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

  const tiposDocumentos = [
    { value: "CC", label: "Cédula de Ciudadanía" },
    { value: "CE", label: "Cédula de Extranjería" },
    { value: "PA", label: "Pasaporte" },
    { value: "PEP", label: "Permiso Especial de Permanencia" },
  ];

  const handleSubmit = async () => {
    if (!validateForm()) {
        openSnackbar("Por favor, ingrese todos los campos", 'warning');
        return;
    }

    try {
        const { NombreCompleto, TipoDocument, Document, Telefono, Empresa } = form;
        const empleadoExistente = data.find(registro => registro.Document.toString() === Document.toString());
        if (empleadoExistente) {
            openSnackbar("El empleado ya existe. Por favor, ingrese un documento de empleado diferente.", 'error');
            return;
        }

        // Generar ID auto-incrementable
        const nuevoId = data.length ? Math.max(...data.map(emp => emp.id)) + 1 : 1;

        const nuevoProveedor = {
            ...form,
            id: nuevoId // Agregar el nuevo ID generado
        };

        const response = await axios.post('http://localhost:3000/provider', nuevoProveedor); // Asegúrate de enviar el nuevo objeto
        setData([...data, response.data]);
        setForm({
            id: "",
            NombreCompleto: "",
            TipoDocument: "",
            Document: "",
            Telefono: "",
            Empresa: "",
            Estado: true,
        });
        setShowForm(false);
        openSnackbar("Usuario agregado exitosamente", "success");
    } catch (error) {
        console.error(error);
        openSnackbar("Error al agregar usuario", "error");
    }
};

  const editar = async () => {
    if (!validateForm()) {
      openSnackbar("Por favor, ingrese todos los campos", "warning");
      return;
    }

    const empleadoExistente = data.find(
      (registro) => registro.Document.toString() === form.Document.toString() &&
        registro._id !== form._id
    );
    if (empleadoExistente) {
      openSnackbar("Ya existe un empleado con el mismo documento. Por favor, ingresa un documento diferente.", "error");
      return;
    }

    try {
      const response = await axios.put(`http://localhost:3000/provider/${form._id}`, form);
      const updatedData =
        data.map
          (item => item._id === form._id ?
            response.data
            : item);
      setData(updatedData);
      setIsEditing(false);
      setModalOpen(false);
      fetchData(); // Refresca la tabla <------------------------------------
      openSnackbar("Usuario editado exitosamente", "success");
    } catch (error) {
      console.error(error);
      openSnackbar("Error al editar usuario", "error");
    }
  };

  const cambiarEstado = async (_id) => {
    const response = await
      Swal.fire
        ({
          title: "¿Desea cambiar el estado del usuario?",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#3085d6",
          cancelButtonColor: "#d33",
          confirmButtonText: "Cambiar",
          cancelButtonText: "Cancelar",
        });
    if (response.isConfirmed) {
      try {
        const userToUpdate = data.find(user => user._id === _id);
        const updatedUser = { ...userToUpdate, Estado: !userToUpdate.Estado };
        await axios.put(`http://localhost:3000/provider/${_id}`, updatedUser);
        const updatedData =
          data.map
            ((registro) => {
              if (registro._id === _id) {
                registro.Estado = !registro.Estado;
              }
              return registro;
            });
        setData(updatedData);
        openSnackbar("Estado del usuario actualizado exitosamente", "success");
      } catch (error) {
        console.error(error);
        openSnackbar("Error al actualizar el estado del usuario", "error");
      }
    }
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
            <Button style={{ backgroundColor: '#228b22', color: 'black' }} onClick={() => { setForm({ id: '', NombreCompleto: '', TipoDocument: '', Document: '', Telefono: '', Empresa: '', Estado: true }); setIsEditing(false); setShowForm(true); }}>
              Agregar Proveedor
              <PlusOutlined style={{ fontSize: '16px', color: 'black', padding: '5px' }} />
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
                  <tr key={item._id}>
                    <td>{item.id}</td>
                    <td>{item.NombreCompleto}</td>
                    <td>{item.TipoDocument}</td>
                    <td>{item.Document}</td>
                    <td>{item.Telefono}</td>
                    <td>{item.Empresa}</td>
                    <td>
                      <Button
                        color={item.Estado ? "success" : "secondary"}
                        onClick={() => cambiarEstado(item._id)}
                        className=" btn-sm" // Usa btn-sm para botones más pequeños
                      >
                        {item.Estado ? "Activo" : "Inactivo"}
                      </Button>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <Button
                          color="dark"
                          onClick={() => { setForm(item); setIsEditing(true); setModalOpen(true); }}
                          className="me-2 " // Usa btn-sm para botones más pequeños
                          style={{ padding: '0.25rem 0.5rem' }} // Ajusta el relleno si es necesario
                        >
                          <FiEdit style={{ fontSize: '0.75rem' }} /> {/* Tamaño del ícono reducido */}
                        </Button>
                        <Button
                          color="danger"
                          onClick={() => openDeleteModal(item)}
                          className="btn-sm" // Usa btn-sm para botones más pequeños
                          style={{ padding: '0.25rem 0.5rem' }} // Ajusta el relleno si es necesario
                        >
                          <FaTrashAlt style={{ fontSize: '0.75rem' }} /> {/* Tamaño del ícono reducido */}
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

      {showForm && (
        <div className="container">
          <h1 className="text-start left-2">Crear Proveedores</h1>
          <br />
          <Row>
            <Col md={8}>
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
                        style={{ border: '2px solid black', width: '100%' }}
                      />
                      {formErrors.NombreCompleto && <div className="invalid-feedback">Este campo es obligatorio.</div>}
                    </FormGroup>
                  </Col>
                </Row>

                <Row className="justify-content-center">
                  <Col md={6}>
                  <FormGroup>
                  <label style={{ fontSize: "15px", padding: "5px" }}>
                    Tipo Documento
                  </label>
                  <Input
                    type="select" // Cambiado a "select"
                    name="TipoDocument"
                    value={form.TipoDocument}
                    onChange={handleChange}
                    className={`form-control ${
                      formErrors.TipoDocument ? "is-invalid" : ""
                    }`}
                  >
                    <option value="">Seleccione un tipo de documento</option>
                    {tiposDocumentos.map((tipo) => (
                      <option key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </option>
                    ))}
                  </Input>
                  {formErrors.TipoDocumento && (
                    <div className="invalid-feedback">
                      Este campo es obligatorio.
                    </div>
                  )}
                </FormGroup>
                  </Col>

                  <Col md={6}>
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
                        style={{ border: '2px solid black', width: '100%' }}
                      />
                      {formErrors.Document && <div className="invalid-feedback">Este campo es obligatorio.</div>}
                    </FormGroup>
                  </Col>
                </Row>

                <Row className="justify-content-center">
                  <Col md={6}>
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
                        style={{ border: '2px solid black', width: '100%' }}
                      />
                      {formErrors.Telefono && <div className="invalid-feedback">Este campo es obligatorio.</div>}
                    </FormGroup>
                  </Col>

                  <Col md={6}>
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
                        style={{ border: '2px solid black', width: '100%' }}
                      />
                      {formErrors.Empresa && <div className="invalid-feedback">Este campo es obligatorio.</div>}
                    </FormGroup>
                  </Col>
                </Row>

                <Row className="justify-content-center mt-3">
                  <Col md={12} className="d-flex justify-content-end">
                    <Button style={{ background: '#2e8322' }} onClick={handleSubmit}>
                      {isEditing ? 'Actualizar' : 'Agregar'}
                    </Button>
                    <Button style={{ background: '#6d0f0f' }} onClick={() => { setShowForm(false); setIsEditing(false); }}>
                      Cancelar
                    </Button>
                  </Col>
                </Row>
              </Form>
            </Col>

            <Col md={4} className="d-flex align-items-center justify-content-center">
              <img
                src={FondoForm} // Usa el atributo src para proporcionar la URL de la imagen
                alt="Descripción de la Imagen" // Agrega una descripción adecuada para la accesibilidad
                style={{
                  width: '100%',
                  height: '60vh',
                  objectFit: 'cover',
                }}
              />
            </Col>

          </Row>
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
                />
                {formErrors.NombreCompleto && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label style={{ fontSize: '15px', padding: '5px' }}>Tipo de Documento</label>
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
                <label style={{ fontSize: '15px', padding: '5px' }}>Documento</label>
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
                <label style={{ fontSize: '15px', padding: '5px' }}>Telefono</label>
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
                <label style={{ fontSize: '15px', padding: '5px' }}>Empresa</label>
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
          <Button color="primary" onClick={isEditing ? editar : handleSubmit}>
            {isEditing ? 'Update' : 'Submit'}
          </Button>
          <Button color="danger" onClick={handleCancel}>
            Cancelar
          </Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} toggle={handleDeleteModalClose}>
        <ModalHeader toggle={handleDeleteModalClose}>
          Confirmar Eliminación
        </ModalHeader>
        <ModalBody>
          ¿Está seguro de que desea eliminar al empleado seleccionado <strong>{selectedProveedor?.NombreCompleto}</strong>?
        </ModalBody>
        <ModalFooter>
          <Button color="danger" onClick={handleOk}>
            Eliminar
          </Button>
          <Button color="secondary" onClick={handleDeleteModalClose}>
            Cancelar
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
