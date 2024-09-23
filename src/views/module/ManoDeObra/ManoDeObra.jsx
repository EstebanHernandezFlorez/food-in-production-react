import React, { useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Table, Button, Container, Row, Col, FormGroup, Input, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { FaEye } from 'react-icons/fa';
import { PlusCircleOutlined } from '@ant-design/icons';
import { SelectOutlined, EditOutlined, TeamOutlined }  from '@ant-design/icons';
import { Snackbar, Alert } from '@mui/material';
import FondoIcono from '../../../assets/logoFIP.png'
import { useNavigate } from 'react-router-dom';

const initialData = [
    {
      id: 1,
      Mes: "Enero",
      Año: 2024,
      ValorTotalG: 1300900,
      Novedades: "mes bimestral, se pago el ...",
      Alquiler: 2000000,
      Seguro: 200000,
      Internet: 400000,
      Servicios: 500000,
      Contador: 1200000,
      Publicidad: 320000,
      TramitadoraSS: 200000,
      PlanCelular: 50000,
      ControlIPlag: 200000,
      SueldoEmple: "Aux de cocina",
      valorSueld: 1200000,
      CantidadEmpl: 4,
      SueldoEmplea: "Jefe de cocina",
      valorSueldoJ: 2000000,
      bonoAdi: 200000
    }
  ];
  
const ManoDeObra = () => {
  const [data, setData] = useState(initialData);
  const [form, setForm] = useState({
    id: '',
    Mes: '',
    Año: '',
    ValorTotalG: '',
    Novedades: '',
    Alquiler: '',           
    Seguro: '',             
    Internet: '',           
    Servicios: '',          
    Contador: '',           
    Publicidad: '',         
    TramitadoraSS: '',      
    PlanCelular: '',        
    ControlIPlag: '',       
    SueldoEmple: '',        
    valorSueld: '',         
    CantidadEmpl: '',       
    SueldoEmplea: '',       
    valorSueldoJ: '',       
    bonoAdi: '',   
    Estado: true
  });
  const navigate = useNavigate(); 
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [tableSearchText, setTableSearchText] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedManoObra, setSelectedManoObra] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedItem, setSelectedtoggle] = useState(null);
  const itemsPerPage = 7;
  // States for validation
  const [formErrors, setFormErrors] = useState({
    Mes: false,
    Año: false,
    ValorTotalG: false,
    Novedades: false,
    Alquiler: false,           
    Seguro: false,             
    Internet: false,           
    Servicios: false,          
    Contador: false,           
    Publicidad: false,         
    TramitadoraSS: false,      
    PlanCelular: false,        
    ControlIPlag: false,       
    SueldoEmple: false,        
    valorSueld: false,         
    CantidadEmpl: false,       
    SueldoEmplea: false,       
    valorSueldoJ: false,       
    bonoAdi: false,
  });

  const handleOk = () => {
  if (selectedManoObra) {
    const updatedData = data.filter(registro => registro.id !== selectedManoObra.id);
    setData(updatedData);
  }
  handleDeleteModalClose();
};  

  const handleCancel = () => {
    setModalOpen(false);
    setSelectedManoObra(null);
  };

  const openDeleteModal = (ManoObra) => {
    setSelectedManoObra(ManoObra);
    setIsDeleteModalOpen(true);
  };
  
  const handleDeleteModalClose = () => {
    setIsDeleteModalOpen(false);
    setSelectedManoObra(null);
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
    calculateTotalGastoMensual(name, value);
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
      Mes: !form.Mes,
      Año: !form.Año,
      Novedades: !form.Novedades,
      Alquiler: !form.Alquiler,           
      Seguro: !form.Seguro,             
      Internet: !form.Internet,           
      Servicios: !form.Servicios,          
      Contador: !form.Contador,           
      Publicidad: !form.Publicidad,         
      TramitadoraSS: !form.TramitadoraSS,      
      PlanCelular: !form.PlanCelular,        
      ControlIPlag: !form.ControlIPlag,       
      SueldoEmple: !form.SueldoEmple,        
      valorSueld: !form.valorSueld,         
      CantidadEmpl: !form.CantidadEmpl,       
      SueldoEmplea: !form.SueldoEmplea,       
      valorSueldoJ: !form.valorSueldoJ,       
      bonoAdi: !form.bonoAdi, 
    };
    setFormErrors(errors);
    return !Object.values(errors).includes(true);
  };
  
  const handleSubmit = () => {
    // Validar el formulario
    if (!validateForm()) {
      openSnackbar("Por favor, ingrese todos los campos", 'warning');
      return;
    }
  
    const { Mes, Año, ValorTotalG, Novedades, Alquiler, Seguro, Internet, Servicios, Contador, Publicidad, TramitadoraSS, PlanCelular, ControlIPlag, SueldoEmple, valorSueld, CantidadEmpl, SueldoEmplea, valorSueldoJ, bonoAdi } = form;
  
    // Verificar si ya existe un gasto mensual con el mismo mes
    const GastoMensualExistente = data.find(registro => registro.Mes.toString() === Mes.toString());
    if (GastoMensualExistente) {
      openSnackbar("El gasto mensual ya existe. Por favor, ingrese un mes de gasto diferente.", 'error');
      return;
    }
  
    // Verificar campos obligatorios
    if (!form.Mes || !form.Año) {
      setFormErrors({
        Mes: !form.Mes ? 'Este campo es obligatorio.' : '',
        Año: !form.Año ? 'Este campo es obligatorio.' : '',
      });
      return;
    }
  
    // Calcular el total
    const valorTotalG = calculateTotal();

    if (isEditing) {
      // Actualizar el registro existente con el valor total
      const updatedData = data.map((item) =>
        item.id === form.id
          ? { ...form, ValorTotalG: valorTotalG }
          : item
      );
      setData(updatedData);
      openSnackbar("Gasto mensual editado exitosamente", 'success');
    } else {
      // Agregar un nuevo registro con el valor total
      const nuevoGastoMensual = {
        ...form,
        id: data.length ? Math.max(...data.map(item => item.id)) + 1 : 1,
        ValorTotalG: valorTotalG
      };
      setData([...data, nuevoGastoMensual]);
      openSnackbar("Gasto mensual agregado exitosamente", 'success');
    }
    
  
    // Resetear formulario y ocultar el formulario
    setForm({
      id: '',
      Mes: '',
      Año: '',
      ValorTotalG: '',
      Novedades: '',
      Alquiler: '',           
      Seguro: '',             
      Internet: '',           
      Servicios: '',          
      Contador: '',           
      Publicidad: '',         
      TramitadoraSS: '',      
      PlanCelular: '',        
      ControlIPlag: '',       
      SueldoEmple: '',        
      valorSueld: '',         
      CantidadEmpl: '',       
      SueldoEmplea: '',       
      valorSueldoJ: '',       
      bonoAdi: '',   
      Estado: true
    });
    setShowForm(false);
  };
  
  const handleClick = () => {
    navigate('/tabla-gastos')
  };
  const handleRendimientoEmp = () => {
    navigate('/rendimiento-empleado');
  }; 

  const calculateTotal = () => {
    // Extraer valores del formulario
    const {
      Alquiler,           
      Seguro,             
      Internet,           
      Servicios,          
      Contador,           
      Publicidad,         
      TramitadoraSS,      
      PlanCelular,        
      ControlIPlag,       
      valorSueld,         
      CantidadEmpl,       
      valorSueldoJ,       
      bonoAdi
    } = form;
  
    // Calcular el total
    const total = [
      Alquiler,           
      Seguro,             
      Internet,           
      Servicios,          
      Contador,           
      Publicidad,         
      TramitadoraSS,      
      PlanCelular,        
      ControlIPlag,       
      valorSueld,         
      CantidadEmpl,       
      valorSueldoJ,       
      bonoAdi
    ]
      .map(Number) // Convertir cada valor a número
      .reduce((acc, val) => acc + (isNaN(val) ? 0 : val), 0); // Sumar valores, tratando NaN como 0
  
    return total;
  };
  
  const editar = () => {
    if (!validateForm()) {
      openSnackbar("Por favor, ingrese todos los campos", 'warning');
      return;
    }
  
    const gastoMensualExistente = data.find(
      (registro) => registro.Mes.toString() === form.Mes.toString() &&
      registro.id !== form.id
    );
  
    if (gastoMensualExistente) {
      openSnackbar("Ya existe un gasto mensual con el mismo mes. Por favor, ingresa un mes diferente.", 'error');
      return;
    }
  
    const updatedData = data.map((registro) =>
      registro.id === form.id ? { ...form } : registro
    );
  
    setData(updatedData);
    setIsEditing(false);
    setModalOpen(false); // Cierra el modal después de actualizar
    openSnackbar("Gasto mensual editado exitosamente", 'success');
  };

  const cambiarEstado = (id) => {
    const updatedData = data.map((registro) => {
      if (registro.id === id) {
        registro.Estado = !registro.Estado;
      }
      return registro;
    });
  
    setData(updatedData);
    openSnackbar("Estado del gasto mensual actualizado exitosamente", 'success');
  };
  
  const filteredData = data.filter(item =>
    item.Mes.toLowerCase().includes(tableSearchText) ||
    item.Año.toString().includes(tableSearchText) ||
    item.ValorTotalG.toLowerCase().includes(tableSearchText)
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
            <div className="d-flex align-items-center mb-3">
            <img
              src={FondoIcono}
              alt="Descripción de la Imagen"
              style={{
                width: '5%',
                height: '10vh',
                objectFit: 'cover',
                marginRight: '20px', 
              }}
            />
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0 }}>Administrar Lista</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Button
                style={{
                  background: 'transparent', 
                  border: 'none', 
                  padding: '0', 
                }}
                onClick={handleRendimientoEmp}
              >
                <TeamOutlined style={{ fontSize: '34px', color: 'black' }} />
              </Button>
              <span style={{ fontSize: '14px', color: 'black', marginTop: '5px' }}>Empleados</span>
            </div>
          </div>
          <br />
          <h5>Gastos mensuales del restaurante</h5>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Input
              type="text" placeholder="Buscar gasto mensual" value={tableSearchText} onChange={e => setTableSearchText(e.target.value.toLowerCase())}
              style={{ width: '50%' }}
            />
            <div className="d-flex">
              <Button
                style={{ backgroundColor: '#228b22', color: 'black', marginRight: '10px' }}
                onClick={handleClick}
              >
                Gastos
                <SelectOutlined style={{ fontSize: '16px', color: 'black', paddingLeft: '5px' }} />
              </Button>
              <Button
                style={{
                  backgroundColor: '#228b22',
                  color: 'black',
                }}
                onClick={() => { 
                  setForm({ id: '', Mes: '', Año: '', ValorTotalG: '', Novedades: '', Estado: true }); 
                  setShowForm(true); 
                }}
              >
                Crear registro de mes 
                <PlusCircleOutlined style={{ fontSize: '16px', color: 'black', paddingLeft: '5px' }} />
              </Button>
            </div>
          </div>
          
          <Table className="table table-sm table-hover">
            <thead>
              <tr>
                <th  style={{ textAlign: 'center' }}>ID</th>
                <th style={{ textAlign: 'center' }}>Mes</th>
                <th style={{ textAlign: 'center' }}>Año</th>
                <th style={{ textAlign: 'center' }}>Valor total gasto Mensual</th>
                <th style={{ textAlign: 'center' }}>Novedades</th>
                <th>Estado</th>
                <th >Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((item) => (
                  <tr key={item.id}>
                    <td style={{ textAlign: 'center' }}>{item.id}</td>
                    <td style={{ textAlign: 'center' }}>{item.Mes}</td>
                    <td style={{ textAlign: 'center' }}>{item.Año}</td>
                    <td style={{ textAlign: 'center' }}>{item.ValorTotalG}</td>
                    <td style={{ textAlign: 'center' }}>{item.Novedades}</td>
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
                          <EditOutlined style={{ fontSize: '0.75rem' }} /> {/* Tamaño del ícono reducido */}
                        </Button>
                        <br />
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
            <h2 className="text-center">{isEditing ? 'Editar Registro mensual de gastos' : 'Crear Registro mensual de gastos'}</h2>
            <br />
            <div style={{ border: '2px solid black', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                <Row>
                    <Col md={4}>
                    <FormGroup>
                        <div style={{ display: 'flex', alignItems: 'center', padding:'10px'}}>
                        <div style={{ marginRight: '10px' }}>
                            <label style={{ fontSize: '15px', padding: '5px' }}>Mes</label>
                            <Input
                            type="text"
                            name="Mes"
                            value={form.Mes}
                            onChange={handleChange}
                            placeholder="Mes"
                            style={{ border: '2px solid black', width: '100px' }} // Borde negro
                            className={`form-control ${formErrors.Mes ? 'is-invalid' : ''}`}
                            />
                            {formErrors.Mes && <div className="invalid-feedback">Este campo es obligatorio.</div>}
                        </div>
                        <div>
                            <label style={{ fontSize: '15px', padding: '5px' }}>Año</label>
                            <Input
                            type="number"
                            name="Año"
                            value={form.Año}
                            onChange={handleChange}
                            placeholder="Año"
                            style={{ border: '2px solid black', width: '100px' }} // Borde negro
                            className={`form-control ${formErrors.Año ? 'is-invalid' : ''}`}
                            />
                            {formErrors.Año && <div className="invalid-feedback">Este campo es obligatorio.</div>}
                        </div>
                        </div>
                    </FormGroup>
                    </Col>
                    <Col md={4}>
                    <FormGroup>
                        <label style={{ fontSize: '15px', padding: '5px' }}>Novedades para este mes</label>
                        <Input
                        type="textarea"
                        name="Novedades"
                        value={form.Novedades}
                        onChange={handleChange}
                        placeholder="Novedades"
                        style={{
                            border: '2px solid black', // Borde negro
                            width: '670px', // Ajusta el ancho del textarea
                            maxHeight: '100px', // Altura máxima del textarea
                            overflowY: 'auto', // Muestra una barra de desplazamiento vertical si el contenido excede la altura máxima
                        }}
                        className={`form-control ${formErrors.Novedades ? 'is-invalid' : ''}`}
                        />
                        {formErrors.Novedades && <div className="invalid-feedback">Este campo es obligatorio.</div>}
                    </FormGroup>
                    </Col>

                </Row>
            </div>

            <div style={{ border: '2px solid black', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
            <Row>
              <Col md={4}>
                  <FormGroup>
                  <label style={{ fontSize: '15px', padding: '5px' }}>Alquiler</label>
                  <Input
                      type="number"
                      name="Alquiler"
                      value={form.Alquiler}
                      onChange={handleChange}
                      placeholder="Alquiler"
                      style={{ border: '2px solid black' }} // Borde negro
                      className={`form-control ${formErrors.Alquiler ? 'is-invalid' : ''}`}
                  />
                  {formErrors.Alquiler && <div className="invalid-feedback">Este campo es obligatorio.</div>}
                  </FormGroup>
                  <FormGroup>
                  <label style={{ fontSize: '15px', padding: '5px' }}>Seguro</label>
                  <Input
                      type="number"
                      name="Seguro"
                      value={form.Seguro}
                      onChange={handleChange}
                      placeholder="Seguro"
                      style={{ border: '2px solid black' }} // Borde negro
                      className={`form-control ${formErrors.Seguro ? 'is-invalid' : ''}`}
                  />
                  {formErrors.Seguro && <div className="invalid-feedback">Este campo es obligatorio.</div>}
                  </FormGroup>
                  <FormGroup>
                  <label style={{ fontSize: '15px', padding: '5px' }}>Internet</label>
                  <Input
                      type="number"
                      name="Internet"
                      value={form.Internet}
                      onChange={handleChange}
                      placeholder="Internet"
                      style={{ border: '2px solid black' }} // Borde negro
                      className={`form-control ${formErrors.Internet ? 'is-invalid' : ''}`}
                  />
                  {formErrors.Internet && <div className="invalid-feedback">Este campo es obligatorio.</div>}
                  </FormGroup>
                  <FormGroup>
                  <label style={{ fontSize: '15px', padding: '5px' }}>Servicios</label>
                  <Input
                      type="number"
                      name="Servicios"
                      value={form.Servicios}
                      onChange={handleChange}
                      placeholder="Servicios"
                      style={{ border: '2px solid black' }} // Borde negro
                      className={`form-control ${formErrors.Servicios ? 'is-invalid' : ''}`}
                  />
                  {formErrors.Servicios && <div className="invalid-feedback">Este campo es obligatorio.</div>}
                  </FormGroup>
                  <FormGroup>
                  <label style={{ fontSize: '15px', padding: '5px' }}>Tramitadora SS</label>
                  <Input
                      type="number"
                      name="TramitadoraSS"
                      value={form.TramitadoraSS}
                      onChange={handleChange}
                      placeholder="Tramitadora SS"
                      style={{ border: '2px solid black' }} // Borde negro
                      className={`form-control ${formErrors.TramitadoraSS ? 'is-invalid' : ''}`}
                  />
                  {formErrors.TramitadoraSS && <div className="invalid-feedback">Este campo es obligatorio.</div>}
                  </FormGroup>
                  <FormGroup>
                  <label style={{ fontSize: '15px', padding: '5px' }}>Plan Celular</label>
                  <Input
                      type="number"
                      name="PlanCelular"
                      value={form.PlanCelular}
                      onChange={handleChange}
                      placeholder="Plan Celular"
                      style={{ border: '2px solid black' }} // Borde negro
                      className={`form-control ${formErrors.PlanCelular ? 'is-invalid' : ''}`}
                  />
                  {formErrors.PlanCelular && <div className="invalid-feedback">Este campo es obligatorio.</div>}
                  </FormGroup>
              </Col>
              <Col md={4}>
                  <FormGroup>
                  <label style={{ fontSize: '15px', padding: '5px' }}>Contador</label>
                  <Input
                      type="number"
                      name="Contador"
                      value={form.Contador}
                      onChange={handleChange}
                      placeholder="Contador"
                      style={{ border: '2px solid black' }} // Borde negro
                      className={`form-control ${formErrors.Contador ? 'is-invalid' : ''}`}
                  />
                  {formErrors.Contador && <div className="invalid-feedback">Este campo es obligatorio.</div>}
                  </FormGroup>
                  <FormGroup>
                  <label style={{ fontSize: '15px', padding: '5px' }}>Publicidad</label>
                  <Input
                      type="number"
                      name="Publicidad"
                      value={form.Publicidad}
                      onChange={handleChange}
                      placeholder="Publicidad"
                      style={{ border: '2px solid black' }} // Borde negro
                      className={`form-control ${formErrors.Publicidad ? 'is-invalid' : ''}`}
                  />
                  {formErrors.Publicidad && <div className="invalid-feedback">Este campo es obligatorio.</div>}
                  </FormGroup>
                  <FormGroup>
                  <label style={{ fontSize: '15px', padding: '5px' }}>Sueldo Empleado</label>
                  <Input
                      type="text"
                      name="SueldoEmple"
                      value={form.SueldoEmple}
                      onChange={handleChange}
                      placeholder="Sueldo Empleado"
                      style={{ border: '2px solid black' }} // Borde negro
                      className={`form-control ${formErrors.SueldoEmple ? 'is-invalid' : ''}`}
                  />
                  {formErrors.SueldoEmple && <div className="invalid-feedback">Este campo es obligatorio.</div>}
                  </FormGroup>

                  <FormGroup>
                  <label style={{ fontSize: '15px', padding: '5px' }}>Cantidad de Empleados</label>
                  <Input
                      type="number"
                      name="CantidadEmpl"
                      value={form.CantidadEmpl}
                      onChange={handleChange}
                      placeholder="Cantidad Empleados"
                      style={{ border: '2px solid black' }} // Borde negro
                      className={`form-control ${formErrors.CantidadEmpl ? 'is-invalid' : ''}`}
                  />
                  {formErrors.CantidadEmpl && <div className="invalid-feedback">Este campo es obligatorio.</div>}
                  </FormGroup>
                  <FormGroup>
                  <label style={{ fontSize: '15px', padding: '5px' }}>Sueldo Jefe de Cocina</label>
                  <Input
                      type="text"
                      name="SueldoEmplea"
                      value={form.SueldoEmplea}
                      onChange={handleChange}
                      placeholder="Sueldo Jefe de cocina"
                      style={{ border: '2px solid black' }} // Borde negro
                      className={`form-control ${formErrors.SueldoEmplea ? 'is-invalid' : ''}`}
                  />
                  {formErrors.SueldoEmplea && <div className="invalid-feedback">Este campo es obligatorio.</div>}
                  </FormGroup>
                  <FormGroup>
                  <label style={{ fontSize: '15px', padding: '5px' }}>Control IP Plag</label>
                  <Input
                      type="number"
                      name="ControlIPlag"
                      value={form.ControlIPlag}
                      onChange={handleChange}
                      placeholder="Control IP Plag"
                      style={{ border: '2px solid black' }} // Borde negro
                      className={`form-control ${formErrors.ControlIPlag ? 'is-invalid' : ''}`}
                  />
                  {formErrors.ControlIPlag && <div className="invalid-feedback">Este campo es obligatorio.</div>}
                  </FormGroup>
              </Col>
                <Col md={4}>
                <FormGroup style={{ visibility: 'hidden', height: 'auto', margin: '0', padding: '0' }}>
                <label style={{ fontSize: '15px', padding: '5px' }}>Valor calculado de cantidad empl por val</label>
                  <Input
                    type="number"
                    name="valorSueld"
                    value={form.Calulado}
                    onChange={handleChange}
                    placeholder="Valor Sueldo"
                    style={{ border: '2px solid black', width:'50%' }} // Borde negro
                    />
                </FormGroup>                
                <FormGroup style={{ visibility: 'hidden', height: 'auto', margin: '0', padding: '0' }}>
                  <label style={{ fontSize: '15px', padding: '5px' }}>Valor calculado de cantidad empl por val</label>
                  <Input
                    type="number"
                    name="valorSueld"
                    value={form.Calulado}
                    onChange={handleChange}
                    placeholder="Valor Sueldo"
                    style={{ border: '2px solid black', width:'50%' }} // Borde negro
                  />
                </FormGroup>
                <FormGroup>
                  <label style={{ fontSize: '15px', padding: '5px' }}>Valor Sueldo</label>
                  <Input
                      type="number"
                      name="valorSueld"
                      value={form.valorSueld}
                      onChange={handleChange}
                      placeholder="Valor Sueldo"
                      style={{ border: '2px solid black', width:'50%' }} // Borde negro
                      className={`form-control ${formErrors.valorSueld ? 'is-invalid' : ''}`}
                  />
                  {formErrors.valorSueld && <div className="invalid-feedback">Este campo es obligatorio.</div>}
                </FormGroup>
                <FormGroup style={{ visibility: 'hidden', height: 'auto', margin: '0', padding: '0' }}>
                  <label style={{ fontSize: '15px', padding: '5px' }}>Valor calculado de cantidad empl por val</label>
                  <Input
                      type="number"
                      name="valorSueld"
                      value={form.Calulado}
                      onChange={handleChange}
                      placeholder="Valor Sueldo"
                      style={{ border: '2px solid black', width:'50%' }} // Borde negro
                  />
                </FormGroup>
                <FormGroup>
                <label style={{ fontSize: '15px', padding: '5px' }}>Valor Sueldo</label>
                <Input
                    type="number"
                    name="valorSueldoJ" // Nombre del campo debe coincidir con el estado
                    value={form.valorSueldoJ} // Valor del estado
                    onChange={handleChange} // Manejo del cambio del input
                    placeholder="Valor Sueldo"
                    style={{ border: '2px solid black', width:'50%' }}
                    className={`form-control ${formErrors.valorSueldoJ ? 'is-invalid' : ''}`} // Clase condicional para errores
                />
                {formErrors.valorSueldoJ && <div className="invalid-feedback">Este campo es obligatorio.</div>}  
               </FormGroup>
              <FormGroup>
                <label style={{ fontSize: '15px', padding: '5px' }}>Bono Adicional</label>
                <Input
                    type="number"
                    name="bonoAdi"
                    value={form.bonoAdi}
                    onChange={handleChange}
                    placeholder="Valor Sueldo"
                    style={{ border: '2px solid black', width:'50%' }} // Borde negro
                    className={`form-control ${formErrors.bonoAdi ? 'is-invalid' : ''}`}
                />
                {formErrors.bonoAdi && <div className="invalid-feedback">Este campo es obligatorio.</div>}
                </FormGroup>
                </Col>
              </Row>
            </div>

            <div className="d-flex justify-content-end mt-3">
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
                <label>Mes</label>
                <Input
                  type="text"
                  name="Mes"
                  value={form.Mes}
                  onChange={handleChange}
                  style={{ border: '2px solid black' }}
                  placeholder="Mes del empleado"
                  className={`form-control ${formErrors.Mes ? 'is-invalid' : ''}`}
                />
                {formErrors.Mes && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label>Año</label>
                <Input
                  type="text"
                  name="Año"
                  value={form.Año}
                  onChange={handleChange}
                  style={{ border: '2px solid black' }}
                  placeholder="Número de Año"
                  className={`form-control ${formErrors.Año ? 'is-invalid' : ''}`}
                />
                {formErrors.Año && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label>Novedades del mes</label>
                <Input
                  type="textarea"
                  name="Novedades"
                  value={form.Novedades}
                  onChange={handleChange}
                  style={{
                    border: '2px solid black', // Borde negro
                    maxHeight: '130px', // Altura máxima del textarea
                    overflowY: 'auto', // Muestra una barra de desplazamiento vertical si el contenido excede la altura máxima
                }}
                  placeholder="Novedades del mes"
                  className={`form-control ${formErrors.Novedades ? 'is-invalid' : ''}`}
                />
                {formErrors.Novedades && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
            </Col>
          </Row>
          <Row>
          <Col md={4}>
              <FormGroup>
              <label style={{ fontSize: '15px', padding: '5px' }}>Alquiler</label>
              <Input
                  type="number"
                  name="Alquiler"
                  value={form.Alquiler}
                  onChange={handleChange}
                  placeholder="Alquiler"
                  style={{ border: '2px solid black' }} // Borde negro
                  className={`form-control ${formErrors.Alquiler ? 'is-invalid' : ''}`}
              />
              {formErrors.Alquiler && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
              <FormGroup>
              <label style={{ fontSize: '15px', padding: '5px' }}>Seguro</label>
              <Input
                  type="number"
                  name="Seguro"
                  value={form.Seguro}
                  onChange={handleChange}
                  placeholder="Seguro"
                  style={{ border: '2px solid black' }} // Borde negro
                  className={`form-control ${formErrors.Seguro ? 'is-invalid' : ''}`}
              />
              {formErrors.Seguro && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
              <FormGroup>
              <label style={{ fontSize: '15px', padding: '5px' }}>Internet</label>
              <Input
                  type="number"
                  name="Internet"
                  value={form.Internet}
                  onChange={handleChange}
                  placeholder="Internet"
                  style={{ border: '2px solid black' }} // Borde negro
                  className={`form-control ${formErrors.Internet ? 'is-invalid' : ''}`}
              />
              {formErrors.Internet && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
              <FormGroup>
              <label style={{ fontSize: '15px', padding: '5px' }}>Servicios</label>
              <Input
                  type="number"
                  name="Servicios"
                  value={form.Servicios}
                  onChange={handleChange}
                  placeholder="Servicios"
                  style={{ border: '2px solid black' }} // Borde negro
                  className={`form-control ${formErrors.Servicios ? 'is-invalid' : ''}`}
              />
              {formErrors.Servicios && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
              <FormGroup>
              <label style={{ fontSize: '15px', padding: '5px' }}>Tramitadora SS</label>
              <Input
                  type="number"
                  name="TramitadoraSS"
                  value={form.TramitadoraSS}
                  onChange={handleChange}
                  placeholder="Tramitadora SS"
                  style={{ border: '2px solid black' }} // Borde negro
                  className={`form-control ${formErrors.TramitadoraSS ? 'is-invalid' : ''}`}
              />
              {formErrors.TramitadoraSS && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
              <FormGroup>
              <label style={{ fontSize: '15px', padding: '5px' }}>Plan Celular</label>
              <Input
                  type="number"
                  name="PlanCelular"
                  value={form.PlanCelular}
                  onChange={handleChange}
                  placeholder="Plan Celular"
                  style={{ border: '2px solid black' }} // Borde negro
                  className={`form-control ${formErrors.PlanCelular ? 'is-invalid' : ''}`}
              />
              {formErrors.PlanCelular && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
          </Col>
          <Col md={4}>
              <FormGroup>
              <label style={{ fontSize: '15px', padding: '5px' }}>Contador</label>
              <Input
                  type="number"
                  name="Contador"
                  value={form.Contador}
                  onChange={handleChange}
                  placeholder="Contador"
                  style={{ border: '2px solid black' }} // Borde negro
                  className={`form-control ${formErrors.Contador ? 'is-invalid' : ''}`}
              />
              {formErrors.Contador && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
              <FormGroup>
              <label style={{ fontSize: '15px', padding: '5px' }}>Publicidad</label>
              <Input
                  type="number"
                  name="Publicidad"
                  value={form.Publicidad}
                  onChange={handleChange}
                  placeholder="Publicidad"
                  style={{ border: '2px solid black' }} // Borde negro
                  className={`form-control ${formErrors.Publicidad ? 'is-invalid' : ''}`}
              />
              {formErrors.Publicidad && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
              <FormGroup>
              <label style={{ fontSize: '15px', padding: '5px' }}>Sueldo Empleado</label>
              <Input
                  type="text"
                  name="SueldoEmple"
                  value={form.SueldoEmple}
                  onChange={handleChange}
                  placeholder="Sueldo Empleado"
                  style={{ border: '2px solid black' }} // Borde negro
                  className={`form-control ${formErrors.SueldoEmple ? 'is-invalid' : ''}`}
              />
              {formErrors.SueldoEmple && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>

              <FormGroup>
              <label style={{ fontSize: '15px', padding: '5px' }}>Cantidad de Empleados</label>
              <Input
                  type="number"
                  name="CantidadEmpl"
                  value={form.CantidadEmpl}
                  onChange={handleChange}
                  placeholder="Cantidad Empleados"
                  style={{ border: '2px solid black' }} // Borde negro
                  className={`form-control ${formErrors.CantidadEmpl ? 'is-invalid' : ''}`}
              />
              {formErrors.CantidadEmpl && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
              <FormGroup>
              <label style={{ fontSize: '15px', padding: '5px' }}>Sueldo Jefe de Cocina</label>
              <Input
                  type="text"
                  name="SueldoEmplea"
                  value={form.SueldoEmplea}
                  onChange={handleChange}
                  placeholder="Sueldo Jefe de cocina"
                  style={{ border: '2px solid black' }} // Borde negro
                  className={`form-control ${formErrors.SueldoEmplea ? 'is-invalid' : ''}`}
              />
              {formErrors.SueldoEmplea && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
              <FormGroup>
              <label style={{ fontSize: '15px', padding: '5px' }}>Control IP Plag</label>
              <Input
                  type="number"
                  name="ControlIPlag"
                  value={form.ControlIPlag}
                  onChange={handleChange}
                  placeholder="Control IP Plag"
                  style={{ border: '2px solid black' }} // Borde negro
                  className={`form-control ${formErrors.ControlIPlag ? 'is-invalid' : ''}`}
              />
              {formErrors.ControlIPlag && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
          </Col>
            <Col md={4}>
            <FormGroup style={{ visibility: 'hidden', height: 'auto', margin: '0', padding: '0' }}>
            <label style={{ fontSize: '15px', padding: '5px' }}>Valor calculado de cantidad empl por val</label>
              <Input
                type="number"
                name="valorSueld"
                value={form.Calulado}
                onChange={handleChange}
                placeholder="Valor Sueldo"
                style={{ border: '2px solid black', width:'50%' }} // Borde negro
                />
            </FormGroup>                
            <FormGroup style={{ visibility: 'hidden', height: 'auto', margin: '0', padding: '0' }}>
              <label style={{ fontSize: '15px', padding: '5px' }}>Valor calculado de cantidad empl por val</label>
              <Input
                type="number"
                name="valorSueld"
                value={form.Calulado}
                onChange={handleChange}
                placeholder="Valor Sueldo"
                style={{ border: '2px solid black', width:'50%' }} // Borde negro
              />
            </FormGroup>
            <FormGroup>
              <label style={{ fontSize: '15px', padding: '5px' }}>Valor Sueldo</label>
              <Input
                  type="number"
                  name="valorSueld"
                  value={form.valorSueld}
                  onChange={handleChange}
                  placeholder="Valor Sueldo"
                  style={{ border: '2px solid black', width:'50%' }} // Borde negro
                  className={`form-control ${formErrors.valorSueld ? 'is-invalid' : ''}`}
              />
              {formErrors.valorSueld && <div className="invalid-feedback">Este campo es obligatorio.</div>}
            </FormGroup>
            <FormGroup style={{ visibility: 'hidden', height: 'auto', margin: '0', padding: '0' }}>
              <label style={{ fontSize: '15px', padding: '5px' }}>Valor calculado de cantidad empl por val</label>
              <Input
                  type="number"
                  name="valorSueld"
                  value={form.Calulado}
                  onChange={handleChange}
                  placeholder="Valor Sueldo"
                  style={{ border: '2px solid black', width:'50%' }} // Borde negro
              />
            </FormGroup>
            <FormGroup>
            <label style={{ fontSize: '15px', padding: '5px' }}>Valor Sueldo</label>
            <Input
                type="number"
                name="valorSueldoJ" // Nombre del campo debe coincidir con el estado
                value={form.valorSueldoJ} // Valor del estado
                onChange={handleChange} // Manejo del cambio del input
                placeholder="Valor Sueldo"
                style={{ border: '2px solid black', width:'50%' }}
                className={`form-control ${formErrors.valorSueldoJ ? 'is-invalid' : ''}`} // Clase condicional para errores
            />
            {formErrors.valorSueldoJ && <div className="invalid-feedback">Este campo es obligatorio.</div>}  
            </FormGroup>
          <FormGroup>
            <label style={{ fontSize: '15px', padding: '5px' }}>Bono Adicional</label>
            <Input
                type="number"
                name="bonoAdi"
                value={form.bonoAdi}
                onChange={handleChange}
                placeholder="Valor Sueldo"
                style={{ border: '2px solid black', width:'50%' }} // Borde negro
                className={`form-control ${formErrors.bonoAdi ? 'is-invalid' : ''}`}
            />
            {formErrors.bonoAdi && <div className="invalid-feedback">Este campo es obligatorio.</div>}
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
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td><strong>Mes:</strong></td>
                    <td>{selectedItem.Mes}</td>
                  </tr>
                  <tr>
                    <td><strong>Año:</strong></td>
                    <td>{selectedItem.Año}</td>
                  </tr>
                  <tr>
                    <td><strong>Novedades:</strong></td>
                    <td>{selectedItem.Novedades}</td>
                  </tr>
                  <tr>
                    <td><strong>Alquiler:</strong></td>
                    <td>{selectedItem.Alquiler}</td>
                  </tr>
                  <tr>
                    <td><strong>Seguro:</strong></td>
                    <td>{selectedItem.Seguro}</td>
                  </tr>
                  <tr>
                    <td><strong>Internet:</strong></td>
                    <td>{selectedItem.Internet}</td>
                  </tr>
                  <tr>
                    <td><strong>Servicios:</strong></td>
                    <td>{selectedItem.Servicios}</td>
                  </tr>
                  <tr>
                    <td><strong>Contador:</strong></td>
                    <td>{selectedItem.Contador}</td>
                  </tr>
                  <tr>
                    <td><strong>Publicidad:</strong></td>
                    <td>{selectedItem.Publicidad}</td>
                  </tr>
                  <tr>
                    <td><strong>Tramitadora SS:</strong></td>
                    <td>{selectedItem.TramitadoraSS}</td>
                  </tr>
                  <tr>
                    <td><strong>Plan Celular:</strong></td>
                    <td>{selectedItem.PlanCelular}</td>
                  </tr>
                  <tr>
                    <td><strong>Control IP Plag:</strong></td>
                    <td>{selectedItem.ControlIPlag}</td>
                  </tr>
                  <tr>
                    <td><strong>Sueldo Empleado:</strong></td>
                    <td>{selectedItem.SueldoEmple}</td>
                  </tr>
                  <tr>
                    <td><strong>Valor Sueldo:</strong></td>
                    <td>{selectedItem.valorSueld}</td>
                  </tr>
                  <tr>
                    <td><strong>Cantidad Empleados:</strong></td>
                    <td>{selectedItem.CantidadEmpl}</td>
                  </tr>
                  <tr>
                    <td><strong>Sueldo Empleado Adicional:</strong></td>
                    <td>{selectedItem.SueldoEmplea}</td>
                  </tr>
                  <tr>
                    <td><strong>Valor Sueldo Jefe:</strong></td>
                    <td>{selectedItem.valorSueldoJ}</td>
                  </tr>
                  <tr>
                    <td><strong>Bono Adicional:</strong></td>
                    <td>{selectedItem.bonoAdi}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
          <ModalFooter style={{ display: 'flex', justifyContent: 'flex-end', padding: 0 }}>
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


export default ManoDeObra
