import React, { useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Table, Button, Container, Row, Col, Form, FormGroup, Input, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import { PlusOutlined } from '@ant-design/icons';
import { Snackbar, Alert } from '@mui/material';
import FondoForm from '../../../assets/login.jpg'
import { FiEdit } from "react-icons/fi";
import '../../../App.css'

const initialData = [
  {id: 1, NombreProducto: "Producto A", Version: "1.0", Cantidad: 100, TipoGramaje: "Grueso", Tarea: "Empaque", Tiempo: "2h", TiempoTotal: "20h", Proveedor: "Proveedor X"},
  {id: 2, NombreProducto: "Producto B", Version: "2.0", Cantidad: 200, TipoGramaje: "Fino", Tarea: "Ensamblaje", Tiempo: "3h", TiempoTotal: "30h", Proveedor: "Proveedor Y"},
  {id: 3, NombreProducto: "Producto C", Version: "1.5", Cantidad: 150, TipoGramaje: "Medio", Tarea: "Calibración", Tiempo: "1h", TiempoTotal: "15h", Proveedor: "Proveedor Z"},
  {id: 4, NombreProducto: "Producto D", Version: "2.5", Cantidad: 250, TipoGramaje: "Grueso", Tarea: "Pruebas", Tiempo: "4h", TiempoTotal: "40h", Proveedor: "Proveedor W"}
];

const ProductoInsumo = () => {
  const [data, setData] = useState(initialData);
  const [form, setForm] = useState({
    id: '',
    NombreProducto: '',
    Version: '',
    Cantidad: '',
    TipoGramaje: '',
    Tarea: '',
    Tiempo: '',
    TiempoTotal: '',
    Proveedor: '',
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
  const [selectedProveedor, setSelectedProveedor] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const itemsPerPage = 7;

  // Estados para la validación
  const [formErrors, setFormErrors] = useState({
    NombreProducto: false,
    Version: false,
    Cantidad: false,
    TipoGramaje: false,
    Proveedor: false,
  });

  const handleOk = () => {
    if (selectedProveedor) {
      const updatedData = data.filter(registro => registro.id !== selectedProveedor.id);
      setData(updatedData);
      openSnackbar("Producto eliminado exitosamente", 'success');
    }
    setModalOpen(false);
    setSelectedProveedor(null);
  };

  const handleCancel = () => {
    setModalOpen(false);
    setSelectedProveedor(null);
  };

  const openDeleteModal = (producto) => {
    setSelectedProveedor(producto);
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
      NombreProducto: !form.NombreProducto,
      Version: !form.Version,
      Cantidad: !form.Cantidad,
      TipoGramaje: !form.TipoGramaje,
      Proveedor: !form.Proveedor
    };
    setFormErrors(errors);
    return !Object.values(errors).includes(true);
  };
  
  const handleSubmit = () => {
    if (!validateForm()) {
      openSnackbar("Por favor, ingrese todos los campos", 'warning');
      return;
    }

    const { Cantidad } = form;
  
    const productoExistente = data.find(registro => registro.Cantidad.toString() === Cantidad.toString());
    if (productoExistente) {
      openSnackbar("El producto ya existe. Por favor, ingrese una cantidad diferente.", 'error');
      return;
    }
  
    const nuevoProducto = {
      ...form,
      id: data.length ? Math.max(...data.map(emp => emp.id)) + 1 : 1
    };
  
    setData([...data, nuevoProducto]);
    setForm({
      id: '',
      NombreProducto: '',
      Version: '',
      Cantidad: '',
      TipoGramaje: '',
      Tarea: '',
      Tiempo: '',
      TiempoTotal: '',
      Proveedor: '',
      Estado: true
    });
    setShowForm(false);
    openSnackbar("Producto agregado exitosamente", 'success');
  };

  const editar = () => {
    if (!validateForm()) {
      openSnackbar("Por favor, ingrese todos los campos", 'warning');
      return;
    }
  
    const productoExistente = data.find(
      (registro) => registro.Cantidad.toString() === form.Cantidad.toString() &&
      registro.id !== form.id
    );
  
    if (productoExistente) {
      openSnackbar("Ya existe un producto con la misma cantidad. Por favor, ingresa una cantidad diferente.", 'error');
      return;
    }
  
    const updatedData = data.map((registro) =>
      registro.id === form.id ? { ...form } : registro
    );
  
    setData(updatedData);
    setIsEditing(false);
    setModalOpen(false);
    openSnackbar("Producto editado exitosamente", 'success');
  };

  const cambiarEstado = (id) => {
    const updatedData = data.map((registro) => {
      if (registro.id === id) {
        registro.Estado = !registro.Estado;
      }
      return registro;
    });
  
    setData(updatedData);
    openSnackbar("Estado del producto actualizado exitosamente", 'success');
  };

  const filteredData = data.filter(item =>
    item.NombreProducto.toLowerCase().includes(tableSearchText) ||
    item.Cantidad.toString().includes(tableSearchText) ||
    item.Proveedor.toLowerCase().includes(tableSearchText)
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
      {!showForm && (
        <>
          <h2>Lista de Productos</h2>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Input
              type="text"
              placeholder="Buscar producto"
              value={tableSearchText}
              onChange={handleTableSearch}
              style={{ width: '50%' }}
            />
            <Button style={{backgroundColor:'#228b22', color:'black'}} onClick={() => { setForm({ id: '', NombreProducto: '', Version:'', Cantidad: '', TipoGramaje:'', Tarea:'', Tiempo:'', TiempoTotal:'', Proveedor:'', Estado: true }); setIsEditing(false); setShowForm(true); }}>
              Agregar Producto
              <PlusOutlined style={{ fontSize: '16px', color: 'black', padding:'5px' }} />
            </Button>
          </div>
          <Table className="table table-sm table-hover">
            <thead>
              <tr>
                <th>id</th>
                <th>Nombre del Producto</th>
                <th>Versión</th>
                <th>Cantidad</th>
                <th>Tipo Gramaje</th>
                <th>Tarea</th>
                <th>Tiempo</th>
                <th>Tiempo Total</th>
                <th>Proveedor</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.NombreProducto}</td>
                    <td>{item.Version}</td>
                    <td>{item.Cantidad}</td>
                    <td>{item.TipoGramaje}</td>
                    <td>{item.Tarea}</td>
                    <td>{item.Tiempo}</td>
                    <td>{item.TiempoTotal}</td>
                    <td>{item.Proveedor}</td>
                    <td>
                      <Button
                        color={item.Estado ? "success" : "secondary"}
                        onClick={() => cambiarEstado(item.id)}
                        className="btn-sm"
                      >
                        {item.Estado ? "Activo" : "Inactivo"}
                      </Button>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <Button 
                          color="dark" 
                          onClick={() => { setForm(item); setIsEditing(true); setModalOpen(true); }} 
                          className="me-2 btn-sm"
                          style={{ padding: '0.25rem 0.5rem' }}
                        >
                          <FiEdit style={{ fontSize: '0.75rem' }} />
                        </Button>
                        <Button 
                          color="danger" 
                          onClick={() => openDeleteModal(item)}
                          className="btn-sm"
                          style={{ padding: '0.25rem 0.5rem' }}
                        >
                          <FaTrashAlt style={{ fontSize: '0.75rem' }} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="11" className="text-center">No hay datos disponibles</td>
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
          <h1 className="text-start left-2">Informacion del producto</h1>
          <br />
          <Row>
          <Col md={9}>
            <Row>
              <Col md={2}>
                <FormGroup>
                  <Label for="productName">Nombre del producto</Label>
                  <Input
                    type="text"
                    name="productName"
                    id="productName"
                    value={formData.productName}
                    onChange={handleChange}
                    placeholder="product name"
                    required
                  />
                </FormGroup>
              </Col>
              <Col md={2}>
                <FormGroup>
                  <Label for="quantity">Cantidad</Label>
                  <Input
                    type="number"
                    min="0"
                    name="quantity"
                    id="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    placeholder="Enter quantity"
                    required
                  />
                </FormGroup>
              </Col>
              <Col md={2}>
                <FormGroup>
                  <Label for="typeGrams">Tipo gramaje</Label>
                  <Input
                    type="text"
                    name="typeGrams"
                    id="typeGrams"
                    value={formData.typeGrams}
                    onChange={handleChange}
                    placeholder="type (grams)"
                    required
                  />
                </FormGroup>
              </Col>
              <Col md={2}>
                <FormGroup>
                  <Label for="startDate">Inicio</Label>
                  <Input
                    type="date"
                    name="startDate"
                    id="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                  />
                </FormGroup>
              </Col>
              <Col md={2}>
                <FormGroup>
                  <Label for="endDate">Fin</Label>
                  <Input
                    type="date"
                    name="endDate"
                    id="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    required
                  />
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col md={3}>
                <FormGroup>
                  <Label for="insumo">Insumo</Label>
                  <Input
                    type="text"
                    name="insumo"
                    id="insumo"
                    value={ingredientData.insumo}
                    onChange={handleIngredientChange}
                  />
                </FormGroup>
              </Col>
              <Col md={3}>
                <FormGroup>
                  <Label for="cantidadPorPorcion">Cantidad por porcion</Label>
                  <Input
                    type="number"
                    name="cantidadPorPorcion"
                    id="cantidadPorPorcion"
                    value={ingredientData.cantidadPorPorcion}
                    onChange={handleIngredientChange}
                  />
                </FormGroup>
              </Col>
              <Col md={3}>
                <FormGroup>
                  <Label for="cantidad">Cantidad</Label>
                  <Input
                    type="number"
                    name="cantidad"
                    id="cantidad"
                    value={ingredientData.cantidad}
                    onChange={handleIngredientChange}
                  />
                </FormGroup>
              </Col>
              <Col md={3}>
                <FormGroup>
                  <Label for="tipoGramaje">Tipo gramaje</Label>
                  <Input
                    type="text"
                    name="tipoGramaje"
                    id="tipoGramaje"
                    value={ingredientData.tipoGramaje}
                    onChange={handleIngredientChange}
                  />
                </FormGroup>
              </Col>
              <Col md={3}>
                <FormGroup>
                  <Label for="proveedor">Proveedor</Label>
                  <Input
                    type="text"
                    name="proveedor"
                    id="proveedor"
                    value={ingredientData.proveedor}
                    onChange={handleIngredientChange}
                  />
                </FormGroup>
              </Col>
            </Row>
            <Button
              color="primary"
              className="ms-2 rounded-circle"
              onClick={addIngredient}
              style={{ width: '38px', height: '38px', padding: '0' }}
            >
              <FaPlus />
            </Button>
          </Col>
          <Col md={3}>
            <FormGroup>
              <Label for="recipeDetails">Proceso de elaboracion</Label>
              <Input
                type="textarea"
                name="recipeDetails"
                id="recipeDetails"
                value={formData.recipeDetails}
                onChange={handleChange}
                placeholder="recipe details"
              />
            </FormGroup>
          </Col>
        </Row>
        
        <ListGroup className="mb-3">
          {ingredients.map((ingredient, index) => (
            <ListGroupItem key={index}>
              {`${ingredient.insumo} - ${ingredient.cantidadPorPorcion} por porción - ${ingredient.cantidad} ${ingredient.tipoGramaje} - ${ingredient.proveedor}`}
            </ListGroupItem>
          ))}
        </ListGroup>

        <h3>Tareas de orden de produccion</h3>
        <Row>
          <Col md={5}>
            <FormGroup>
              <Label for="task">Tarea</Label>
              <Input
                type="text"
                name="task"
                id="task"
                value={taskData.task}
                onChange={handleTaskChange}
                placeholder="Tarea"
                required
              />
            </FormGroup>
          </Col>

          <Col md={5}>
            <FormGroup>
              <Label for="time">Tiempo</Label>
              <Input
                type="text"
                name="time"
                id="time"
                value={taskData.time}
                onChange={handleTaskChange}
                placeholder="Tiempo"
                required
              />
            </FormGroup>
          </Col>

          <Col md={2}>
            <FormGroup>
              <Label for="totalTime">Tiempo total</Label>
              <Input
                type="text"
                name="totalTime"
                id="totalTime"
                value={`${totalTime} minutos`}
                readOnly
              />
            </FormGroup>
          </Col>
        </Row>
        
        <Button
          color="primary"
          className="ms-2 rounded-circle"
          onClick={addTask}
          style={{ width: '38px', height: '38px', padding: '0' }}
        >
          <FaPlus />
        </Button>

        <ListGroup className="mb-3">
          {tasks.map((task, index) => (
            <ListGroupItem key={index}>
              {`${task.task} - ${task.time}`}
            </ListGroupItem>
          ))}
        </ListGroup>

        <Row>
          <Col md={12}>
            <Button color="primary" type="submit">
              Add Product
            </Button>
          </Col>
        </Row>
        </div>
        
        )
      }

      



      {/* Modal de edición */}
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)}>
        <ModalHeader toggle={() => setModalOpen(!modalOpen)}>
          Editar Producto
        </ModalHeader>
        <ModalBody>
          <Row>
            <Col md={4}>
              <FormGroup>
                <label style={{fontSize:'15px', padding:'5px'}}>
                  Nombre del Producto 
                </label>
                <Input
                  type="text"
                  name="NombreProducto"
                  value={form.NombreProducto}
                  onChange={handleChange}
                  placeholder="Nombre del producto"
                  className={`form-control ${formErrors.NombreProducto ? 'is-invalid' : ''}`}
                />
                {formErrors.NombreProducto && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label style={{fontSize:'15px', padding:'5px'}}>Versión</label>
                <Input
                  type="text"
                  name="Version"
                  value={form.Version}
                  onChange={handleChange}
                  placeholder="Versión"
                  className={`form-control ${formErrors.Version ? 'is-invalid' : ''}`}
                />
                {formErrors.Version && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label style={{fontSize:'15px', padding:'5px'}}>Cantidad</label>
                <Input
                  type="text"
                  name="Cantidad"
                  value={form.Cantidad}
                  onChange={handleChange}
                  placeholder="Cantidad"
                  className={`form-control ${formErrors.Cantidad ? 'is-invalid' : ''}`}
                />
                {formErrors.Cantidad && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md={4}>
              <FormGroup>
                <label style={{fontSize:'15px', padding:'5px'}}>Tipo Gramaje</label>
                <Input
                  type="text"
                  name="TipoGramaje"
                  value={form.TipoGramaje}
                  onChange={handleChange}
                  placeholder="Tipo de gramaje"
                  className={`form-control ${formErrors.TipoGramaje ? 'is-invalid' : ''}`}
                />
                {formErrors.TipoGramaje && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label style={{fontSize:'15px', padding:'5px'}}>Proveedor</label>
                <Input
                  type="text"
                  name="Proveedor"
                  value={form.Proveedor}
                  onChange={handleChange}
                  placeholder="Proveedor"
                  className={`form-control ${formErrors.Proveedor ? 'is-invalid' : ''}`}
                />
                {formErrors.Proveedor && <div className="invalid-feedback">Este campo es obligatorio.</div>}
              </FormGroup>
            </Col>
          </Row>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={isEditing ? editar : handleSubmit}>
            {isEditing ? 'Actualizar' : 'Agregar'}
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
          ¿Está seguro de que desea eliminar el producto seleccionado <strong>{selectedProveedor?.NombreProducto}</strong>?
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
  )
};


export default ProductoInsumo;


