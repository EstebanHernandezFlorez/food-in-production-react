import React, { useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Table, Button, Container, Row, Col, FormGroup, Input, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { FaTrashAlt, FaEye } from 'react-icons/fa';
import { FiEdit } from "react-icons/fi";
import { IoSearchOutline } from "react-icons/io5";
import { PlusOutlined } from '@ant-design/icons';
import { Snackbar, Alert } from '@mui/material';
import { notification } from 'antd';

const initialData = [
  {id: 1, Nombre: "Carolina Guzman", Document: 16514416,FechaIni: "15-07-2020",ContactoEmerg: "319898119",Parentesco: "Madre",NombreFamiliar: "Carolina Zapata", GrupoSang: "O+",NumeroSS: 61515371,Direccion: "cl 76 j 12b 55",TipoContrato: "doble tiempo"},
  {id: 2,Nombre: "Andra Torres",Document: 18761919,FechaIni: "01-02-2023",ContactoEmerg: "3001234567",Parentesco: "Hermano",NombreFamiliar: "Juan Torres",GrupoSang: "A+",NumeroSS: 12345678,Direccion: "Av. El Dorado 92-45",TipoContrato: "tiempo completo"}, 
  {id: 3,Nombre: "Natalia Muriel",Document: 1016177143,FechaIni: "15-03-2022",ContactoEmerg: "3207654321",Parentesco: "Padre",NombreFamiliar: "Carlos Muriel",GrupoSang: "B+",NumeroSS: 23456789,Direccion: "Cra 15 #76-30",TipoContrato: "tiempo completo"},
  {id: 4,Nombre: "Luis Pérez",Document: 12345678,FechaIni: "10-11-2021",ContactoEmerg: "3109876543",Parentesco: "Esposa",NombreFamiliar: "Ana Pérez",GrupoSang: "AB+",NumeroSS: 34567890,Direccion: "Cl 10 #15-20",TipoContrato: "medio tiempo"},
  {id: 5,Nombre: "María Gómez",Document: 23456789,FechaIni: "20-09-2020",ContactoEmerg: "3134567890",Parentesco: "Hermano",NombreFamiliar: "David Gómez",GrupoSang: "O-",NumeroSS: 45678901,Direccion: "Cra 7 #22-767",TipoContrato: "medio tiempo"},
  {id: 6,Nombre: "Pedro Martínez",Document: 34567890,FechaIni: "05-06-2021",ContactoEmerg: "3145678901",Parentesco: "Madre",NombreFamiliar: "Elena Martínez",GrupoSang: "A-",NumeroSS: 56789012,Direccion: "Cl 80 #14-05",TipoContrato: "tiempo completo"},
  {id: 7,Nombre: "Laura Fernández",Document: 45678901,FechaIni: "12-04-2023",ContactoEmerg: "3156789012",Parentesco: "Hijo",NombreFamiliar: "Jorge Fernández",GrupoSang: "B-",NumeroSS: 67890123,Direccion: "Av. 68 #10-20",TipoContrato: "medio tiempo"},
  {id: 8,Nombre: "Carlos Rodríguez",Document: 56789012,FechaIni: "01-01-2020",ContactoEmerg: "3167890123",Parentesco: "Esposa",NombreFamiliar: "María Rodríguez",GrupoSang: "AB-",NumeroSS: 78901234,Direccion: "Cra 50 #30-40",TipoContrato: "tiempo completo"}
   
];
const Empleados = () => {
  const [data, setData] = useState(initialData);
  const [form, setForm] = useState({
    id: '',
    Nombre: '',
    Document: '',
    FechaIni: '',
    ContactoEmerg: '',
    Parentesco: '',
    NombreFamiliar: '',
    GrupoSang:'',
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
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const itemsPerPage = 7;
  // States for validation
  const [formErrors, setFormErrors] = useState({
    Nombre: false,
    Document: false,
    FechaIni: false,
    ContactoEmerg: false,
    Parentesco: false,
    NombreFamiliar: false,
    GrupoSang: false,
    NumeroSS: false,
    Direccion: false,
    TipoContrato: false
  });

  const handleOk = () => {
  if (selectedEmployee) {
    const updatedData = data.filter(registro => registro.id !== selectedEmployee.id);
    setData(updatedData);
  }
  handleDeleteModalClose();
};  

  const handleCancel = () => {
    setModalOpen(false);
    setSelectedEmployee(null);
  };

  const openDeleteModal = (employee) => {
    setSelectedEmployee(employee);
    setIsDeleteModalOpen(true);
  };
  
  const handleDeleteModalClose = () => {
    setIsDeleteModalOpen(false);
    setSelectedEmployee(null);
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
      Nombre: !form.Nombre,
      Document: !form.Document,
      FechaIni: !form.FechaIni,
      ContactoEmerg: !form.ContactoEmerg,
      Parentesco: !form.Parentesco,
      NombreFamiliar: !form.NombreFamiliar,
      GrupoSang: !form.GrupoSang,
      NumeroSS: !form.NumeroSS,
      Direccion: !form.Direccion,
      TipoContrato: !form.TipoContrato
    };
    setFormErrors(errors);
    return !Object.values(errors).includes(true);
  };
  
  const formatDate = (date) => {
    const [day, month, year] = date.split('-');
    return `${year}-${month}-${day}`;
  };
  const handleSubmit = () => {
    if (!validateForm()) {
      openSnackbar("Por favor, ingrese todos los campos", 'warning');
      return;
    }
    const { Nombre, Document, FechaIni, ContactoEmerg, Parentesco, NombreFamiliar, GrupoSang,  NumeroSS, Direccion, TipoContrato } = form;
  
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
      ContactoEmerg: '',
      Parentesco: '',
      NombreFamiliar: '',
      GrupoSang:'',
      NumeroSS: '',
      Direccion: '',
      TipoContrato: '',
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

  const toggleDetailModal = () => setDetailModalOpen(!detailModalOpen);

  const viewDetails = (item) => {
    setSelectedItem(item);
    toggleDetailModal();
  };
  return (
    <Container>
      <br />
      {/* Mostrar la sección de búsqueda y el botón solo si no se está mostrando el formulario */}
      {!showForm && (
        <>
          <h2>Lista de empleados</h2>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Input
              type="text"
              placeholder="Buscar empleados"
              value={tableSearchText}
              onChange={handleTableSearch}
              style={{ width: '50%' }}
            />
            <Button style={{backgroundColor:'#228b22', color:'black'}} onClick={() => { setForm({ id: '', Nombre: '', Document: '',
               FechaIni: '', ContactoEmerg:'', Parentesco:'', NombreFamiliar:'',GrupoSang:'', NumeroSS: '', Direccion: '', 
               TipoContrato: '', Estado: true }); setIsEditing(false); setShowForm(true); }}>
              Agregar empleado
              <PlusOutlined style={{ fontSize: '16px', color: 'black', padding:'5px' }} />
            </Button>
          </div>
          
          <Table className="table table-sm table-hover">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Documento</th>
                <th>Fecha de Ingreso</th>
                <th>Grupo Sanguíneo</th>
                <th>Numero de SS</th>
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
                    <td style={{ textAlign: 'center' }}>{item.id}</td>
                    <td>{item.Nombre}</td>
                    <td >{item.Document}</td>
                    <td style={{ textAlign: 'center' }}>{item.FechaIni}</td>
                    <td style={{ textAlign: 'center' }}>{item.GrupoSang}</td>
                    <td style={{ textAlign: 'center' }}>{item.NumeroSS}</td>
                    <td style={{ textAlign: 'center' }}>{item.Direccion}</td>
                    <td style={{ textAlign: 'center' }}>{item.TipoContrato}</td>
                    <td>
                      <Button
                        color={item.Estado ? "success" : "secondary"}
                        onClick={() => cambiarEstado(item.id)}
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
                    <td>
                      <Button 
                        onClick={() => viewDetails(item)}
                        className="me-3 btn-sm" 
                        style={{ 
                          backgroundColor: '#F5C300', // Color dorado miel
                          border: 'none', // Elimina el borde del botón
                          padding: '0.45rem', // Ajusta el relleno para hacer el botón más pequeño
                          display: 'flex', // Asegura que el icono esté centrado
                          alignItems: 'center',
                          justifyContent: 'center',
                          // Ajusta el tamaño del texto si es necesario
                          
                        }}
                      >
                        <FaEye style={{ color: 'black', fontSize: '1.10rem', top: '5px' }} /> {/* Tamaño del ícono reducido */}
                      </Button> 
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="13" className="text-center">No hay datos disponibles</td>
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
        <div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="text-star">{isEditing ? 'Editar Empleado' : 'Agregar Empleado'}</h2>
            <div className="d-flex align-items-center">
              <Input
                type="text"
                placeholder="Buscar documento de usuario"
                value={tableSearchText}
                onChange={handleTableSearch}
                style={{ width: '60vh', marginRight: '8px', border: '2px solid #353535' }} // Ajustar ancho y margen según sea necesario
              />
              <IoSearchOutline size={24} />
            </div>
          </div>
          <br />
          <Row>
            <Col md={4}>
              <FormGroup>
                <label style={{ fontSize: '15px', padding: '5px' }}>
                  Nombre Completo
                </label>
                <Input
                  type="text"
                  name="Nombre"
                  value={form.Nombre}
                  onChange={handleChange}
                  placeholder="Nombre del Empleado"
                  style={{ border: '2px solid black' }} // Borde negro
                  className={`form-control ${formErrors.Nombre ? 'is-invalid' : ''}`}
                />
                {formErrors.Nombre && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label style={{ fontSize: '15px', padding: '5px' }}>Documento</label>
                <Input
                  type="text"
                  name="Documento"
                  value={form.Document}
                  onChange={handleChange}
                  placeholder="Número de Documento"
                  style={{ border: '2px solid black' }} // Borde negro
                  className={`form-control ${formErrors.Document ? 'is-invalid' : ''}`}
                />
                {formErrors.Document && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label style={{ fontSize: '15px', padding: '5px' }}>Fecha de Ingreso</label>
                <Input
                  type="date"
                  name="FechaIngreso"
                  value={formatDate(form.FechaIni)}
                  onChange={handleChange}
                  placeholder="Fecha de Ingreso"
                  style={{ border: '2px solid black' }} // Borde negro
                  className={`form-control ${formErrors.FechaIni ? 'is-invalid' : ''}`}
                />
                {formErrors.FechaIni && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md={4}>
              <FormGroup>
                <label style={{ fontSize: '15px', padding: '5px' }}>Contacto de Emergencia</label>
                <Input
                  type="text"
                  name="ContactoEmergencia"
                  value={form.ContactoEmerg}
                  onChange={handleChange}
                  placeholder="Número de Contacto de Emergencia"
                  style={{ border: '2px solid black' }} // Borde negro
                  className={`form-control ${formErrors.ContactoEmerg ? 'is-invalid' : ''}`}
                />
                {formErrors.ContactoEmerg && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label style={{ fontSize: '15px', padding: '5px' }}>Parentesco</label>
                <Input
                  type="text"
                  name="Parentesco"
                  value={form.Parentesco}
                  onChange={handleChange}
                  placeholder="Parentesco"
                  style={{ border: '2px solid black' }} // Borde negro
                  className={`form-control ${formErrors.Parentesco ? 'is-invalid' : ''}`}
                />
                {formErrors.Parentesco && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label style={{ fontSize: '15px', padding: '5px' }}>Nombre del Familiar</label>
                <Input
                  type="text"
                  name="NombreFamiliar"
                  value={form.NombreFamiliar}
                  onChange={handleChange}
                  placeholder="Nombre del Familiar"
                  style={{ border: '2px solid black' }} // Borde negro
                  className={`form-control ${formErrors.NombreFamiliar ? 'is-invalid' : ''}`}
                />
                {formErrors.NombreFamiliar && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md={4}>
              <FormGroup>
                <label style={{ fontSize: '15px', padding: '5px' }}>Grupo Sanguíneo</label>
                <Input
                  type="text"
                  name="GrupoSanguineo"
                  value={form.GrupoSang}
                  onChange={handleChange}
                  placeholder="Grupo Sanguíneo"
                  style={{ border: '2px solid black' }} // Borde negro
                  className={`form-control ${formErrors.GrupoSang ? 'is-invalid' : ''}`}
                />
                {formErrors.GrupoSang && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label style={{ fontSize: '15px', padding: '5px' }}>Número de Seguridad Social</label>
                <Input
                  type="text"
                  name="NumeroSS"
                  value={form.NumeroSS}
                  onChange={handleChange}
                  placeholder="Número de Seguridad Social"
                  style={{ border: '2px solid black' }} // Borde negro
                  className={`form-control ${formErrors.NumeroSS ? 'is-invalid' : ''}`}
                />
                {formErrors.NumeroSS && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label style={{ fontSize: '15px', padding: '5px' }}>Dirección</label>
                <Input
                  type="text"
                  name="Direccion"
                  value={form.Direccion}
                  onChange={handleChange}
                  placeholder="Dirección"
                  style={{ border: '2px solid black' }} // Borde negro
                  className={`form-control ${formErrors.Direccion ? 'is-invalid' : ''}`}
                />
                {formErrors.Direccion && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md={4}>
              <FormGroup>
                <label style={{ fontSize: '15px', padding: '5px' }}>Tipo de Contrato</label>
                <Input
                  type="text"
                  name="TipoContrato"
                  value={form.TipoContrato}
                  onChange={handleChange}
                  placeholder="Tipo de Contrato"
                  style={{ border: '2px solid black' }} // Borde negro
                  className={`form-control ${formErrors.TipoContrato ? 'is-invalid' : ''}`}
                />
                {formErrors.TipoContrato && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
            </Col>
          </Row>
        <div className="d-flex justify-content-start mt-3">
          <Button style={{ background: '#2e8322' }} onClick={handleSubmit}>
            {isEditing ? 'Actualizar' : 'Guardar'}
          </Button>
      
          <Button style={{ background: '#6d0f0f' }} onClick={() => { setShowForm(false); setIsEditing(false); }}>
            Cancelar
          </Button>
        </div>
      </div>
      
      
      )}
      {/* Modal de edición */}
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)} style={{ maxWidth: '50%' }}>
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
                  className={`form-control ${formErrors.Nombre ? 'is-invalid' : ''}`}
                />
                {formErrors.Nombre && <div className="invalid-feedback">Este campo es obligatorio.</div>}
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
                  className={`form-control ${formErrors.Document ? 'is-invalid' : ''}`}
                />
                {formErrors.Document && <div className="invalid-feedback">Este campo es obligatorio.</div>}
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
                  className={`form-control ${formErrors.FechaIni ? 'is-invalid' : ''}`}
                />
                {formErrors.FechaIni && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md={4}>
              <FormGroup>
                <label style={{fontSize:'15px', padding:'5px'}}>Contacto de emergencia</label>
                <Input
                  type="text"
                  name="ContactoEmerg"
                  value={form.ContactoEmerg}
                  onChange={handleChange}
                  placeholder="Número de contacto de emergencia"
                  className={`form-control ${formErrors.ContactoEmerg ? 'is-invalid' : ''}`}
                />
                {formErrors.ContactoEmerg && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label style={{fontSize:'15px', padding:'5px'}}>Parentesco</label>
                <Input
                  type="text"
                  name="Parentesco"
                  value={form.Parentesco}
                  onChange={handleChange}
                  placeholder="Número de Parentesco"
                  className={`form-control ${formErrors.Parentesco ? 'is-invalid' : ''}`}
                />
                {formErrors.Parentesco && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label style={{fontSize:'15px', padding:'5px'}}>Nombre del familiar</label>
                <Input
                  type="text"
                  name="NombreFamiliar"
                  value={form.NombreFamiliar}
                  onChange={handleChange}
                  placeholder="Nombre del familiar"
                  className={`form-control ${formErrors.NombreFamiliar ? 'is-invalid' : ''}`}
                />
                {formErrors.NombreFamiliar && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md={4}>
              <FormGroup>
                <label style={{fontSize:'15px', padding:'5px'}}>Grupo sanguineo</label>
                <Input
                  type="text"
                  name="GrupoSang"
                  value={form.GrupoSang}
                  onChange={handleChange}
                  placeholder="Grupo Sanguineo"
                  className={`form-control ${formErrors.GrupoSang ? 'is-invalid' : ''}`}
                />
                {formErrors.GrupoSang && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label>Número de Seguridad Social</label>
                <Input
                  type="text"
                  name="NumeroSS"
                  value={form.NumeroSS}
                  onChange={handleChange}
                  placeholder="Número de seguridad social"
                  className={`form-control ${formErrors.NumeroSS ? 'is-invalid' : ''}`}
                />
                {formErrors.NumeroSS && <div className="invalid-feedback">Este campo es obligatorio.</div>}
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
                  className={`form-control ${formErrors.Direccion ? 'is-invalid' : ''}`}
                />
                {formErrors.Direccion && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
            </Col>
          </Row>
          <Row>
          <Col md={4}>
              <FormGroup>
                <label>Tipo de Contrato</label>
                <Input
                  type="text"
                  name="TipoContrato"
                  value={form.TipoContrato}
                  onChange={handleChange}
                  placeholder="Tipo de contrato"
                  className={`form-control ${formErrors.TipoContrato ? 'is-invalid' : ''}`}
                />
                {formErrors.TipoContrato && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
            </Col>
          </Row>
        </ModalBody>
        <ModalFooter>
        <Button style={{ background: '#2e8322' }} onClick={isEditing ? editar : handleSubmit}>
              {isEditing ? 'Actualizar' : 'Guardar'}
            </Button>
          <Button style={{ background: '#6d0f0f' }} onClick={handleCancel}>
            Cancelar
          </Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} toggle={handleDeleteModalClose}>
        <ModalHeader toggle={handleDeleteModalClose}>
          Confirmar Eliminación
        </ModalHeader>
        <ModalBody>
          ¿Está seguro de que desea eliminar al empleado seleccionado <strong>{selectedEmployee?.Nombre}</strong>?
        </ModalBody>
        <ModalFooter>
          <Button style={{ background: '#6d0f0f' }} onClick={handleOk}>
            Eliminar
          </Button>
          <Button style={{ background: '#2e8322' }} onClick={handleDeleteModalClose}>
            Cancelar
          </Button>
        </ModalFooter>
      </Modal>

      {/* Modal de detalle */}
      <Modal 
        isOpen={detailModalOpen} 
        toggle={toggleDetailModal} 
        style={{ maxWidth: '40%', marginTop:'10px', marginBottom:'3px'}}
      >
        <ModalHeader toggle={toggleDetailModal} style={{ color: '#8C1616' }}>
          Detalles del Empleado
        </ModalHeader>
        <ModalBody style={{ overflowY: 'auto', maxHeight: 'calc(120vh - 120px)' }}>
          {selectedItem && (
            <div style={{ padding: '10px' }}>
              <p><strong>Nombre:</strong> {selectedItem.Nombre}</p>
              <p><strong>Documento:</strong> {selectedItem.Document}</p>
              <p><strong>Fecha de Ingreso:</strong> {selectedItem.FechaIni}</p>
              <p><strong>Contacto de Emergencia:</strong> {selectedItem.ContactoEmerg}</p>
              <p><strong>Parentesco:</strong> {selectedItem.Parentesco}</p>
              <p><strong>Nombre del Familiar:</strong> {selectedItem.NombreFamiliar}</p>
              <p><strong>Grupo Sanguíneo:</strong> {selectedItem.GrupoSang}</p>
              <p><strong>Número de Seguro Social:</strong> {selectedItem.NumeroSS}</p>
              <p><strong>Dirección:</strong> {selectedItem.Direccion}</p>
              <p><strong>Tipo de Contrato:</strong> {selectedItem.TipoContrato}</p>
              <p><strong>Estado:</strong> {selectedItem.Estado ? 'Activo' : 'Inactivo'}</p>
            </div>
          )}
            <ModalFooter style={{display: 'flex', justifyContent: 'flex-end', padding:0 }}>
              <Button style={{ background: '#6d0f0f' }} onClick={toggleDetailModal}>Cerrar</Button>
            </ModalFooter>
        </ModalBody>
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
