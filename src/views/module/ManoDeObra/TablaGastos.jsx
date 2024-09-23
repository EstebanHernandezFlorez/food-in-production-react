import React, { useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Table, Button, Container, FormGroup, Input, Modal, ModalHeader, ModalBody } from 'reactstrap';
import { FaEye } from 'react-icons/fa';
import { PlusCircleOutlined, SelectOutlined, EditOutlined, TeamOutlined } from '@ant-design/icons';
import { Snackbar, Alert } from '@mui/material';
import { FiEdit } from "react-icons/fi";
import FondoIcono from '../../../assets/logoFIP.png';
import { useNavigate } from 'react-router-dom';

const initialData = [
  { id: 1, nombreGasto: "Alquiler", opciones: [
      { tipo: "Enero", valor: 2000000 },
      { tipo: "Febrero", valor: 2100000 },
    ], conceptoGasto: "Pago mensual por alquiler de espacio", valor: 0, Estado: true },
  { id: 2, nombreGasto: "Seguro", opciones: [
      { tipo: "Enero", valor: 200000 },
      { tipo: "Febrero", valor: 210000 },
    ], conceptoGasto: "Pago de seguro para el año 2024", valor: 0, Estado: true }
];

const TablaGastos = () => {
  const [data, setData] = useState(initialData);
  const [form, setForm] = useState({
    id: '',
    nombreGasto: '',
    tipoOpcion: '',
    valorOpcion: '',
    conceptoGasto: '',
    valor: '',
    Estado: true,
    hasOptions: false,
    options: []
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
  const [selectedItem, setSelectedItem] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const itemsPerPage = 7;

  const [formErrors, setFormErrors] = useState({
    nombreGasto: false,
    tipoOpcion: false,
    valorOpcion: false,
    conceptoGasto: false,
    valor: false
  });

  const handleClick = () => {
    navigate('/mano_de_obra');
  };
  
  const handleRendimientoEmp = () => {
    navigate('/rendimiento-empleado');
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setForm({
        id: item.id,
        nombreGasto: item.nombreGasto,
        tipoOpcion: '',
        valorOpcion: '',
        conceptoGasto: item.conceptoGasto,
        valor: item.valor,
        Estado: item.Estado,
        hasOptions: item.opciones.length > 0,
        options: item.opciones
      });
      setSelectedItem(item);
      setIsEditing(true);
    } else {
      setForm({
        id: '',
        nombreGasto: '',
        tipoOpcion: '',
        valorOpcion: '',
        conceptoGasto: '',
        valor: '',
        Estado: true,
        hasOptions: false,
        options: []
      });
      setIsEditing(false);
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setForm({
      id: '',
      nombreGasto: '',
      tipoOpcion: '',
      valorOpcion: '',
      conceptoGasto: '',
      valor: '',
      Estado: true,
      hasOptions: false,
      options: []
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prevForm => ({
      ...prevForm,
      [name]: value
    }));
  };

  const handleOptionChange = (e) => {
    const { name, value } = e.target;
    setForm(prevForm => ({
      ...prevForm,
      [name]: value
    }));
  };

  const handleHasOptionsChange = (e) => {
    setForm(prevForm => ({
      ...prevForm,
      hasOptions: e.target.checked
    }));
  };

  const addOption = () => {
    if (form.tipoOpcion && form.valorOpcion) {
      setForm(prevForm => ({
        ...prevForm,
        options: [...prevForm.options, { tipo: form.tipoOpcion, valor: parseFloat(form.valorOpcion) }],
        tipoOpcion: '',
        valorOpcion: ''
      }));
    }
  };

  const removeOption = (index) => {
    setForm(prevForm => ({
      ...prevForm,
      options: prevForm.options.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const errors = {
      nombreGasto: !form.nombreGasto.trim(),
      tipoOpcion: form.hasOptions && !form.tipoOpcion.trim(),
      valorOpcion: form.hasOptions && (!form.valorOpcion || form.valorOpcion <= 0),
      conceptoGasto: !form.conceptoGasto.trim(),
      valor: !form.valor || form.valor <= 0
    };
    setFormErrors(errors);
    return !Object.values(errors).includes(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      openSnackbar("Por favor, ingrese todos los campos correctamente", 'warning');
      return;
    }
  
    const newItem = { 
      ...form, 
      opciones: form.options,
      id: isEditing ? form.id : data.length ? Math.max(data.map(item => item.id)) + 1 : 1
    };
  
    if (isEditing) {
      setData(data.map(item => item.id === form.id ? newItem : item));
      openSnackbar("Registro actualizado exitosamente", 'success');
    } else {
      setData([...data, newItem]);
      openSnackbar("Registro creado exitosamente", 'success');
    }
    handleCloseModal();
  };

  const openSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const closeSnackbar = () => {
    setSnackbarOpen(false);
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
    item.nombreGasto.toLowerCase().includes(tableSearchText.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const pageNumbers = Array.from({ length: Math.ceil(filteredData.length / itemsPerPage) }, (_, i) => i + 1);

  return (
    <Container>
      <br />
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
          <h5>Gastos generales del restaurante</h5>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Input
              type="text" placeholder="Buscar gasto" value={tableSearchText} onChange={e => setTableSearchText(e.target.value)}
              style={{ width: '50%' }}
            />
            <div className="d-flex">
            <Button
                style={{ backgroundColor: '#228b22', color: 'black', marginRight: '10px' }}
                onClick={handleClick}
              >
                Tabla de gastos mensuales
                <SelectOutlined style={{ fontSize: '16px', color: 'black', paddingLeft: '5px' }} />
              </Button>
              <Button
                style={{ backgroundColor: '#228b22', color: 'black' }}
                onClick={() => handleOpenModal()}
              >
                Crear gasto
                <PlusCircleOutlined style={{ fontSize: '16px', color: 'black', paddingLeft: '5px' }} />
              </Button>
            </div>
          </div>
          <Table className="table table-sm table-hover">
            <thead>
              <tr>
                <th style={{ textAlign: 'center' }}>ID</th>
                <th style={{ textAlign: 'center' }}>Nombre del Gasto</th>
                <th style={{ textAlign: 'center' }}>Opciones</th>
                <th style={{ textAlign: 'center' }}>Concepto gasto</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? currentItems.map(item => (
                <tr key={item.id}>
                  <td style={{ textAlign: 'center' }}>{item.id}</td>
                  <td style={{ textAlign: 'center' }}>{item.nombreGasto}</td>
                  <td style={{ textAlign: 'center' }}>{item.opciones.length ? 'Sí' : 'No'}</td>
                  <td>{item.conceptoGasto}</td>
                  <td>
                      <Button
                        color={item.Estado ? "success" : "secondary"}
                        onClick={() => cambiarEstado(item.id)}
                        className="btn-sm" // Usa btn-sm para botones más pequeños
                      >
                        {item.Estado ? "Activo" : "Inactivo"}
                      </Button>
                    </td>
                  <td>
                    <div className="d-flex align-items-center">
                      <Button 
                        color="dark" 
                        onClick={() => handleOpenModal(item)} 
                        className="me-2 " // Usa btn-sm para botones más pequeños
                        style={{ padding: '0.25rem 0.5rem' }} // Ajusta el relleno si es necesario
                      >
                        <FiEdit style={{ fontSize: '0.75rem' }} /> {/* Tamaño del ícono reducido */}
                      </Button>
                      <Button 
                        color="danger" 
                        onClick={() => {
                          setSelectedItem(item);
                          setShowOptions(true);
                        }}
                        className="btn-sm" // Usa btn-sm para botones más pequeños
                        style={{ padding: '0.25rem 0.5rem' }} // Ajusta el relleno si es necesario
                      >
                        <FaEye style={{ fontSize: '0.75rem' }} /> {/* Tamaño del ícono reducido */}
                      </Button>
                    </div>
                    
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="text-center">No hay registros disponibles</td>
                </tr>
              )}
            </tbody>
          </Table>
          <div className="d-flex justify-content-center">
            <nav>
              <ul className="pagination">
                {pageNumbers.map(number => (
                  <li key={number} className="page-item">
                    <Button
                      className="page-link"
                      onClick={() => setCurrentPage(number)}
                    >
                      {number}
                    </Button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </>
      )}

      <Modal isOpen={modalOpen} toggle={handleCloseModal}>
        <ModalHeader toggle={handleCloseModal}>{isEditing ? 'Editar Gasto' : 'Crear Gasto'}</ModalHeader>
        <ModalBody>
          <form onSubmit={handleSubmit}>
            <FormGroup>
              <Input
                type="text"
                name="nombreGasto"
                placeholder="Nombre del Gasto"
                value={form.nombreGasto}
                onChange={handleChange}
                invalid={formErrors.nombreGasto}
              />
            </FormGroup>
            <FormGroup>
              <Input
                type="checkbox"
                name="hasOptions"
                checked={form.hasOptions}
                onChange={handleHasOptionsChange}
              /> Tiene opciones
            </FormGroup>
            {form.hasOptions && (
              <>
                <FormGroup>
                  <Input
                    type="text"
                    name="tipoOpcion"
                    placeholder="Tipo de Opción"
                    value={form.tipoOpcion}
                    onChange={handleOptionChange}
                    invalid={formErrors.tipoOpcion}
                  />
                </FormGroup>
                <FormGroup>
                  <Input
                    type="number"
                    name="valorOpcion"
                    placeholder="Valor de Opción"
                    value={form.valorOpcion}
                    onChange={handleOptionChange}
                    invalid={formErrors.valorOpcion}
                  />
                </FormGroup>
                <Button color="secondary" onClick={addOption}>
                  Añadir opción
                </Button>
                <ul>
                  {form.options.map((option, index) => (
                    <li key={index}>
                      {option.tipo}: {option.valor} <Button color="danger" onClick={() => removeOption(index)}>Eliminar</Button>
                    </li>
                  ))}
                </ul>
                <FormGroup>
                  <Input
                    type="text"
                    name="conceptoGasto"
                    placeholder="Concepto de Gasto"
                    value={form.conceptoGasto}
                    onChange={handleChange}
                    invalid={formErrors.conceptoGasto}
                  />
                </FormGroup>
                <FormGroup>
                  <Input
                    type="number"
                    name="valor"
                    placeholder="Valor"
                    value={form.valor}
                    onChange={handleChange}
                    invalid={formErrors.valor}
                  />
                </FormGroup>
              </>
            )}
            {!form.hasOptions && (
              <>
                <FormGroup>
                  <Input
                    type="text"
                    name="conceptoGasto"
                    placeholder="Concepto de Gasto"
                    value={form.conceptoGasto}
                    onChange={handleChange}
                    invalid={formErrors.conceptoGasto}
                  />
                </FormGroup>
                <FormGroup>
                  <Input
                    type="number"
                    name="valor"
                    placeholder="Valor"
                    value={form.valor}
                    onChange={handleChange}
                    invalid={formErrors.valor}
                  />
                </FormGroup>
              </>
            )}
            <Button type="submit" color="primary">
              {isEditing ? 'Actualizar' : 'Crear'}
            </Button>
            <Button color="secondary" onClick={handleCloseModal} style={{ marginLeft: '10px' }}>
              Cancelar
            </Button>
          </form>
        </ModalBody>
      </Modal>

      <Modal isOpen={showOptions} toggle={() => setShowOptions(false)}>
        <ModalHeader toggle={() => setShowOptions(false)}>Detalles del Gasto</ModalHeader>
        <ModalBody>
          {selectedItem && (
            <>
              <h5>Detalles de {selectedItem.nombreGasto}</h5>
              <p><strong>Concepto:</strong> {selectedItem.conceptoGasto}</p>
              {selectedItem.opciones.length > 0 && (
                <>
                  <h6>Opciones:</h6>
                  <Table className="table table-sm table-hover">
                    <thead>
                      <tr>
                        <th>Tipo</th>
                        <th>Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedItem.opciones.map((op, index) => (
                        <tr key={index}>
                          <td>{op.tipo}</td>
                          <td>{op.valor}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </>
              )}
              <p><strong>Valor:</strong> {selectedItem.valor}</p>
              <p><strong>Estado:</strong> {selectedItem.Estado ? "Activo" : "Inactivo"}</p>
            </>
          )}
        </ModalBody>
      </Modal>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={closeSnackbar}
      >
        <Alert onClose={closeSnackbar} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default TablaGastos;
