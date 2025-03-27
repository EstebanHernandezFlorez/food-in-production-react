import React, { useState, useEffect } from "react";
import axios from "axios";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Table, Button, Container, Row, Col, FormGroup, Input, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { FaTrashAlt, FaEye } from 'react-icons/fa';
import { FiEdit } from "react-icons/fi";
import { PlusOutlined } from '@ant-design/icons';
import { Snackbar, Alert } from '@mui/material';
import toast, { Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2';

const Empleados = () => {
  const [data, setData] = useState([]);
  const [form, setForm] = useState({
    idEmployee: '', 
    fullName: '', 
    typeDocument: '', 
    document: '', 
    cellPhone: '',
    email: '',
    dateOfEntry: '', 
    emergencyContact: '', 
    Relationship: '',
    nameFamilyMember: '', 
    BloodType: '',
    socialSecurityNumber: '', 
    Address: '', 
    contractType: '', 
    status: true
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
  const itemsPerPage = 10;
  
  // States for validation
  const [formErrors, setFormErrors] = useState({
    fullName: false,
    typeDocument: false,
    document: false,
    cellPhone: false,
    email: false,
    dateOfEntry: false,
    emergencyContact: false,
    Relationship: false,
    nameFamilyMember: false,
    BloodType: false,
    socialSecurityNumber: false,
    Address: false,
    contractType: false
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get('http://localhost:3000/employee');
      setData(response.data);
    } catch (error) {
      console.error("Error fetching employees:", error);
      Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
    }
  };  

  const handleCancel = () => {
    setModalOpen(false);
    setSelectedEmployee(null);
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
    setForm({ ...form, [name]: value });
    setFormErrors({ ...formErrors, [name]: false }); // Clear error for this field
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
      fullName: !form.fullName?.trim(),
      typeDocument: !form.typeDocument?.trim(),
      document: !form.document?.toString().trim(),
      cellPhone: !form.cellPhone?.toString().trim(),
      email: !form.email?.trim(),
      dateOfEntry: !form.dateOfEntry?.trim(),
      emergencyContact: !form.emergencyContact?.toString().trim(),
      Relationship: !form.Relationship?.trim(),
      nameFamilyMember: !form.nameFamilyMember?.trim(),
      BloodType: !form.BloodType?.trim(),
      socialSecurityNumber: !form.socialSecurityNumber?.trim(),
      Address: !form.Address?.trim(),
      contractType: !form.contractType?.trim()
    };
  
    setFormErrors(errors);
    return !Object.values(errors).includes(true);
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) {
      openSnackbar("Por favor, ingrese todos los campos", "warning");
      return;
    }
    try {
      console.log("Datos enviados a la API:", form);
      
  
      const employeeExists = data.find(emp => emp.document?.toString() === form.document?.toString());
      
      if (employeeExists && !isEditing) {
        openSnackbar("El empleado ya existe. Ingrese un documento diferente.", "error");
        return;
      }
  
      const employeeData = {
        fullName: form.fullName,
        typeDocument: form.typeDocument,
        document: form.document,
        dateOfEntry: form.dateOfEntry,
        cellPhone: form.cellPhone,
        email: form.email,
        emergencyContact: form.emergencyContact,
        Relationship: form.Relationship,
        nameFamilyMember: form.nameFamilyMember,
        BloodType: form.BloodType,
        socialSecurityNumber: form.socialSecurityNumber,
        Address: form.Address,
        contractType: form.contractType,
        status: form.status || true
      };
  
      let response;
      if (isEditing) {
        console.log("Editando empleado con ID:", form.idEmployee);
        response = await axios.put(`http://localhost:3000/employee/${form.idEmployee}`, employeeData);
      } else {
        console.log("Creando nuevo empleado...");
        response = await axios.post("http://localhost:3000/employee", employeeData);
      }
      const idEmployee = Number(form.idEmployee); // Convierte a número
        if (!Number.isInteger(idEmployee) || idEmployee <= 0) {
          console.error("El ID del empleado no es válido:", idEmployee);
          return;
        }

  
      console.log("Respuesta del servidor:", response.data);
  
      openSnackbar(isEditing ? "Empleado actualizado exitosamente" : "Empleado agregado exitosamente", "success");
  
      fetchData(); 
      resetForm();
      setShowForm(false);
      setIsEditing(false);
    } catch (error) {
      console.error("Error en la solicitud:", error);
      
      if (error.response) {
        console.error("Error en la respuesta:", error.response.data);
        openSnackbar(`Error del servidor: ${JSON.stringify(error.response.data.errors)}`, "error");
      } else if (error.request) {
        console.error("No hubo respuesta del servidor");
        openSnackbar("No hubo respuesta del servidor. Verifica la conexión", "error");
      } else {
        console.error("Error al configurar la solicitud");
        openSnackbar("Error al configurar la solicitud", "error");
      }
    }
 };    
  

  const resetForm = () => {
    setForm({
      idEmployee: '',
      fullName: '',
      typeDocument: '',
      document: '',
      cellPhone: '',
      email: '',
      dateOfEntry: '',
      emergencyContact: '',
      Relationship: '',
      nameFamilyMember: '',
      BloodType: '',
      socialSecurityNumber: '',
      Address: '',
      contractType: '',
      status: true
    });
    setShowForm(false);
    setFormErrors({});
  };
  
  const editar = () => {
    // Show confirmation toast
    toast((t) => (
      <div>
        <p>¿Desea editar el usuario?</p>
        <div>
          <Button
            color="primary"
            onClick={() => {
              handleSubmit(); // Use the same handler for update
              toast.dismiss(t.id);
            }}
          >
            Editar
          </Button>
          <Button
            color="secondary"
            onClick={() => toast.dismiss(t.id)}
          >
            Cancelar
          </Button>
        </div>
      </div>
    ), { duration: 5000 });
  };
  
  const cambiarEstado = async (idEmployee) => {
    toast((t) => (
      <div>
        <p>¿Desea cambiar el estado del usuario?</p>
        <div>
          <Button
            color="primary"
            onClick={async () => {
              try {
                // Find employee to update
                const employee = data.find(emp => emp.idEmployee === idEmployee);
                if (!employee) {
                  toast.error("Empleado no encontrado");
                  toast.dismiss(t.id);
                  return;
                }

                // Toggle status
                const updatedStatus = !employee.status;
                
                // Send update to API
                await axios.patch(`http://localhost:3000/employee/${idEmployee}`, { 
                  status: updatedStatus 
                });
                
                // Update local data
                const updatedData = data.map(emp => 
                  emp.idEmployee === idEmployee ? { ...emp, status: updatedStatus } : emp
                );
                setData(updatedData);
                
                toast.success(`Estado actualizado a ${updatedStatus ? 'Activo' : 'Inactivo'}`);
                toast.dismiss(t.id);
              } catch (error) {
                console.error("Error updating status:", error);
                toast.error("Error al actualizar estado");
                toast.dismiss(t.id);
              }
            }}
          >
            Cambiar
          </Button>
          <Button
            color="secondary"
            onClick={() => toast.dismiss(t.id)}
          >
            Cancelar
          </Button>
        </div>
      </div>
    ), { duration: 5000 });
  };
  
  const eliminar = (employee) => {
    toast((t) => (
      <div>
        <p>¿Desea eliminar el empleado?</p>
        <div>
          <Button
            color="primary"
            onClick={async () => {
              try {
                await axios.delete(`http://localhost:3000/employee/${employee.idEmployee}`);
                const updatedData = data.filter(emp => emp.idEmployee !== employee.idEmployee);
                setData(updatedData);
                toast.success('Empleado eliminado exitosamente');
              } catch (error) {
                console.error("Error deleting employee:", error);
                toast.error('Error al eliminar el empleado');
              }
              toast.dismiss(t.id);
            }}
          >
            Eliminar
          </Button>
          <Button
            color="secondary"
            onClick={() => toast.dismiss(t.id)}
          >
            Cancelar
          </Button>
        </div>
      </div>
    ), { duration: 5000 });
  };

  const tiposDocumento = [
    { value: "CC", label: "Cédula de Ciudadanía" },
    { value: "CE", label: "Cédula de Extranjería" },
    { value: "PA", label: "Pasaporte" },
    { value: "PEP", label: "Permiso Especial de Permanencia" },
  ];
  
  const filteredData = data.filter(item =>
    (item.fullName && item.fullName.toLowerCase().includes(tableSearchText)) ||
    (item.document && item.document.toString().includes(tableSearchText)) ||
    (item.dateOfEntry && item.dateOfEntry.toLowerCase().includes(tableSearchText)) ||
    (item.socialSecurityNumber && item.socialSecurityNumber.toString().includes(tableSearchText))
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
      <Toaster position="top-center" />
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
            <Button style={{backgroundColor:'#228b22', color:'black'}} onClick={() => { setForm(
              { idEmployee: '', 
                fullName: '', 
                typeDocument: '', 
                document: '', 
                cellPhone: '',
                email: '',
                dateOfEntry: '', 
                emergencyContact: '', 
                Relationship: '',
                nameFamilyMember: '', 
                BloodType: '',
                socialSecurityNumber: '', 
                Address: '', 
                contractType: '', 
                status: true
               }); setIsEditing(false); setShowForm(true); }}>
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
                <th>Dirección</th>
                <th>Tipo de Contrato</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              
              {currentItems.length > 0 ? (
                currentItems.map((item) => (
                  <tr key={item.idEmployee}>
                    <td style={{ textAlign: 'center' }}>{item.idEmployee}</td>
                    <td>{item.fullName}</td>
                    <td >{item.Document}</td>
                    <td style={{ textAlign: 'center' }}>{item.dateOfEntry}</td>
                    <td style={{ textAlign: 'center' }}>{item.Address}</td>
                    <td style={{ textAlign: 'center' }}>{item.contractType}</td>
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
                      <div className="d-flex justify-content-between align-items-center w-100"> {/* Cambié a w-100 para asegurar que ocupe todo el ancho disponible */}
                        <Button 
                          color="dark" 
                          onClick={() => { setForm(item); setIsEditing(true); setModalOpen(true); }} 
                          className="btn-sm" // Usa btn-sm para botones más pequeños
                          style={{ padding: '0.25rem 0.5rem' }} // Ajusta el relleno si es necesario
                        >
                          <FiEdit style={{ fontSize: '0.75rem' }} /> {/* Tamaño del ícono reducido */}
                        </Button>
                        
                        <Button 
                          color="danger" 
                          onClick={() => eliminar(item)}
                          className="btn-sm" // Usa btn-sm para botones más pequeños
                          style={{ padding: '0.15rem 0.5rem' }} // Ajusta el relleno si es necesario
                        >
                          <FaTrashAlt style={{ fontSize: '0.75rem' }} /> {/* Tamaño del ícono reducido */}
                        </Button>
                        
                        <Button 
                          onClick={() => viewDetails(item)}
                          className="btn-sm" 
                          style={{ 
                            backgroundColor: '#F5C300', // Color dorado miel
                            border: 'none', // Elimina el borde del botón
                            padding: '0.45rem', // Ajusta el relleno para hacer el botón más pequeño
                            display: 'flex', // Asegura que el icono esté centrado
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 'auto' // Se ajusta al contenido
                          }}
                        >
                          <FaEye style={{ color: 'black', fontSize: '1.10rem', top: '5px' }} /> {/* Tamaño del ícono reducido */}
                        </Button> 
                      </div>
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
          <div className="d-flex justify-content-center align-items-center mb-3">
            <h2 className="text-end">{isEditing ? 'Editar Empleado' : 'Agregar Empleado'}</h2>
          </div>
          <br />

          {/* First Row */}
          <Row>
            <Col md={4}>
              <FormGroup>
                <label style={{ fontSize: '15px', padding: '5px' }}>Nombre Completo</label>
                <Input
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Nombre del Empleado"
                  style={{ border: '1px solid black' }} // Borde negro de 1px
                  className={`form-control ${formErrors.fullName ? 'is-invalid' : ''}`}
                />
                {formErrors.fullName && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label style={{ fontSize: '15px', padding: '5px' }}>Tipo Documento</label>
                <Input
                  type="select"
                  name="typeDocument"
                  value={form.typeDocument}
                  onChange={handleChange}
                  className={`form-control ${formErrors.typeDocument ? 'is-invalid' : ''}`}
                  style={{ border: '1px solid black' }} // Borde negro de 1px
                >
                  <option value="">Seleccione un tipo de documento</option>
                  {tiposDocumento.map((tipo) => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </Input>
                {formErrors.typeDocument && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label style={{ fontSize: '15px', padding: '5px' }}>Documento</label>
                <Input
                  type="text"
                  name="document"
                  value={form.document}
                  onChange={handleChange}
                  placeholder="Número de Documento"
                  className={`form-control ${formErrors.document ? 'is-invalid' : ''}`}
                  style={{ border: '1px solid black' }} // Borde negro de 1px
                />
                {formErrors.document && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
            </Col>
          </Row>

          {/* Second Row */}
          <Row>
            <Col md={4}>
              <FormGroup>
                <label style={{ fontSize: '15px', padding: '5px' }}>Celular</label>
                <Input
                  type="number"
                  name="cellPhone"
                  value={form.cellPhone}
                  onChange={handleChange}
                  placeholder="celular del Empleado"
                  style={{ border: '1px solid black' }} // Borde negro de 1px
                  className={`form-control ${formErrors.cellPhone ? 'is-invalid' : ''}`}
                />
                {formErrors.cellPhone && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label style={{ fontSize: '15px', padding: '5px' }}>Correo</label>
                <Input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="email del Empleado"
                  style={{ border: '1px solid black' }} // Borde negro de 1px
                  className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
                />
                {formErrors.email && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label style={{ fontSize: '15px', padding: '5px' }}>Dirección</label>
                <Input
                  type="text"
                  name="Address"
                  value={form.Address}
                  onChange={handleChange}
                  placeholder="Dirección"
                  style={{ border: '1px solid black' }} // Borde negro de 1px
                  className={`form-control ${formErrors.Address ? 'is-invalid' : ''}`}
                />
                {formErrors.Address && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
            </Col>
          </Row>

          {/* Third Row */}
          <Row>
            <Col md={4}>
              <FormGroup>
                <label style={{ fontSize: '15px', padding: '5px' }}>Contacto de Emergencia</label>
                <Input
                  type="text"
                  name="emergencyContact"
                  value={form.emergencyContact}
                  onChange={handleChange}
                  placeholder="Número de Contacto de Emergencia"
                  className={`form-control ${formErrors.emergencyContact ? 'is-invalid' : ''}`}
                  style={{ border: '1px solid black' }} // Borde negro de 1px
                />
                {formErrors.emergencyContact && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label style={{ fontSize: '15px', padding: '5px' }}>Nombre Familiar</label>
                <Input
                  type="text"
                  name="nameFamilyMember"
                  value={form.nameFamilyMember}
                  onChange={handleChange}
                  placeholder="Nombre del Familiar"
                  style={{ border: '1px solid black' }} // Borde negro de 1px
                  className={`form-control ${formErrors.nameFamilyMember ? 'is-invalid' : ''}`}
                />
                {formErrors.nameFamilyMember && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label style={{ fontSize: '15px', padding: '5px' }}>Parentesco</label>
                <Input
                  type="text"
                  name="Relationship"
                  value={form.Relationship}
                  onChange={handleChange}
                  placeholder="Parentesco"
                  style={{ border: '1px solid black' }} // Borde negro de 1px
                  className={`form-control ${formErrors.Relationship ? 'is-invalid' : ''}`}
                />
                {formErrors.Relationship && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
            </Col>
          </Row>

          {/* Fourth Row */}
          <Row>
            <Col md={4}>
              <FormGroup>
                <label style={{ fontSize: '15px', padding: '5px' }}>Grupo Sanguíneo</label>
                <Input
                  type="text"
                  name="BloodType"
                  value={form.BloodType}
                  onChange={handleChange}
                  placeholder="Grupo Sanguíneo"
                  className={`form-control ${formErrors.BloodType ? 'is-invalid' : ''}`}
                  style={{ border: '1px solid black' }} // Borde negro de 1px
                />
                {formErrors.BloodType && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label style={{ fontSize: '15px', padding: '5px' }}>Número de Seguridad Social</label>
                <Input
                  type="text"
                  name="socialSecurityNumber"
                  value={form.socialSecurityNumber}
                  onChange={handleChange}
                  placeholder="Número de Seguridad Social"
                  style={{ border: '1px solid black' }} // Borde negro de 1px
                  className={`form-control ${formErrors.socialSecurityNumber ? 'is-invalid' : ''}`}
                />
                {formErrors.socialSecurityNumber && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label style={{ fontSize: '15px', padding: '5px' }}>Fecha de Ingreso</label>
                <Input
                  type="date"
                  name="dateOfEntry"
                  value={form.dateOfEntry}
                  onChange={handleChange}
                  className={`form-control ${formErrors.dateOfEntry ? 'is-invalid' : ''}`}
                  style={{ border: '1px solid black' }} // Borde negro de 1px
                />
                {formErrors.dateOfEntry && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
            </Col>
          </Row>

          {/* Fifth Row */}
          <Row>
            <Col md={6}>
              <FormGroup>
                <label style={{ fontSize: '15px', padding: '5px' }}>Tipo de Contrato</label>
                <Input
                  type="text"
                  name="contractType"
                  value={form.contractType}
                  onChange={handleChange}
                  placeholder="Tipo de Contrato"
                  style={{ border: '1px solid black' }} // Borde negro de 1px
                  className={`form-control ${formErrors.contractType ? 'is-invalid' : ''}`}
                />
                {formErrors.contractType && <div className="invalid-feedback">Este campo es obligatorio.</div>}
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
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Nombre del empleado"
                  className={`form-control ${formErrors.fullName ? 'is-invalid' : ''}`}
                />
                {formErrors.fullName && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label>Documento</label>
                <Input
                  type="text"
                  name="document"
                  value={form.document}
                  onChange={handleChange}
                  placeholder="Número de documento"
                  className={`form-control ${formErrors.document ? 'is-invalid' : ''}`}
                />
                {formErrors.document && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label>Fecha de Inicio</label>
                <Input
                  type="date"
                  name="dateOfEntry"
                  value={form.dateOfEntry}
                  onChange={handleChange}
                  placeholder="Fecha de inicio"
                  className={`form-control ${formErrors.dateOfEntry ? 'is-invalid' : ''}`}
                />
                {formErrors.dateOfEntry && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md={4}>
              <FormGroup>
                <label style={{fontSize:'15px', padding:'5px'}}>Celular</label>
                <Input
                  type="text"
                  name="cellPhone"
                  value={form.cellPhone}
                  onChange={handleChange}
                  placeholder="Número de celular"
                  className={`form-control ${formErrors.cellPhone ? 'is-invalid' : ''}`}
                />
                {formErrors.cellPhone  && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label style={{fontSize:'15px', padding:'5px'}}>Email</label>
                <Input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Correo electrónico"
                  className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
                />
                {formErrors.email && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label style={{fontSize:'15px', padding:'5px'}}>Contacto de emergencia</label>
                <Input
                  type="text"
                  name="emergencyContact"
                  value={form.emergencyContact}
                  onChange={handleChange}
                  placeholder="Número de contacto de emergencia"
                  className={`form-control ${formErrors.emergencyContact ? 'is-invalid' : ''}`}
                />
                {formErrors.emergencyContact && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md={4}>
              <FormGroup>
                <label style={{fontSize:'15px', padding:'5px'}}>Parentesco</label>
                <Input
                  type="text"
                  name="Relationship"
                  value={form.Relationship}
                  onChange={handleChange}
                  placeholder="Número de Parentesco"
                  className={`form-control ${formErrors.Relationship ? 'is-invalid' : ''}`}
                />
                {formErrors.Relationship && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label style={{fontSize:'15px', padding:'5px'}}>Nombre del familiar</label>
                <Input
                  type="text"
                  name="nameFamilyMember"
                  value={form.nameFamilyMember}
                  onChange={handleChange}
                  placeholder="Nombre del familiar"
                  className={`form-control ${formErrors.nameFamilyMember ? 'is-invalid' : ''}`}
                />
                {formErrors.nameFamilyMember && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label style={{fontSize:'15px', padding:'5px'}}>Grupo sanguineo</label>
                <Input
                  type="text"
                  name="BloodType"
                  value={form.BloodType}
                  onChange={handleChange}
                  placeholder="Grupo Sanguineo"
                  className={`form-control ${formErrors.BloodType ? 'is-invalid' : ''}`}
                />
                {formErrors.BloodType && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md={4}>
              <FormGroup>
                <label>Número de Seguridad Social</label>
                <Input
                  type="text"
                  name="socialSecurityNumber"
                  value={form.socialSecurityNumber}
                  onChange={handleChange}
                  placeholder="Número de seguridad social"
                  className={`form-control ${formErrors.socialSecurityNumber ? 'is-invalid' : ''}`}
                />
                {formErrors.socialSecurityNumber && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label>Dirección</label>
                <Input
                  type="text"
                  name="Address"
                  value={form.Address}
                  onChange={handleChange}
                  placeholder="Dirección"
                  className={`form-control ${formErrors.Address ? 'is-invalid' : ''}`}
                />
                {formErrors.Address && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label>Tipo de Contrato</label>
                <Input
                  type="text"
                  name="contractType"
                  value={form.contractType}
                  onChange={handleChange}
                  placeholder="Tipo de contrato"
                  className={`form-control ${formErrors.contractType ? 'is-invalid' : ''}`}
                />
                {formErrors.contractType && <div className="invalid-feedback">Este campo es obligatorio.</div>}
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
              <p><strong>Nombre:</strong> {selectedItem.fullName}</p>
              <p><strong>Documento:</strong> {selectedItem.document}</p>
              <p><strong>Fecha de Ingreso:</strong> {selectedItem.dateOfEntry}</p>
              <p><strong>Celular:</strong> {selectedItem.cellPhone}</p>
              <p><strong>Email:</strong> {selectedItem.email}</p>
              <p><strong>Contacto de Emergencia:</strong> {selectedItem.emergencyContact}</p>
              <p><strong>Parentesco:</strong> {selectedItem.Relationship}</p>
              <p><strong>Nombre del Familiar:</strong> {selectedItem.nameFamilyMember}</p>
              <p><strong>Grupo Sanguíneo:</strong> {selectedItem.BloodType}</p>
              <p><strong>Número de Seguro Social:</strong> {selectedItem.socialSecurityNumber}</p>
              <p><strong>Dirección:</strong> {selectedItem.Address}</p>
              <p><strong>Tipo de Contrato:</strong> {selectedItem.contractType}</p>
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