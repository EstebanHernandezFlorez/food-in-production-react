// Importación de React y hooks
import React, { useState } from "react";

// Importación de Bootstrap y otros componentes necesarios
import 'bootstrap/dist/css/bootstrap.min.css';
import { Table, Button, Container, Row, Col, FormGroup, Input, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { FaEdit, FaTrashAlt } from 'react-icons/fa'; // Iconos de edición y eliminación
import { Snackbar, Alert } from '@mui/material'; // Componentes para notificaciones



// Datos iniciales de ejemplo
const initialData = [
  { id: 1, NombreCompleto: "Juan Pérez", Distintivo: "7867", CategoriaCliente: "regular", Celular: "3123456789", Correo: "juan.perez@example.com", Direccion: "Cl 76 j 12b 55" },
  { id: 2, NombreCompleto: "Ana Torres", Distintivo: "7576", CategoriaCliente: "familiar", Celular: "3109876543", Correo: "ana.torres@example.com", Direccion: "Av. El Dorado 92-45" },
  // Más datos de ejemplo...
];

// Componente principal "Clientes"
const Clientes = () => {
  // Estado para manejar los datos de clientes
  const [data, setData] = useState(initialData);

  // Estado para manejar los datos del formulario
  const [form, setForm] = useState({
    id: '',
    NombreCompleto: '',
    Distintivo: '',
    CategoriaCliente: '',
    Celular: '',
    Correo: '',
    Direccion: '',
    Estado: true
  });

  // Estado para manejar si se está editando un cliente
  const [isEditing, setIsEditing] = useState(false);

  // Estado para manejar si se muestra el formulario
  const [showForm, setShowForm] = useState(false);

  // Estado para manejar el texto de búsqueda
  const [searchText, setSearchText] = useState('');

  // Estado para manejar la apertura y cierre del Snackbar (notificaciones)
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  // Estado para manejar la página actual en la paginación
  const [currentPage, setCurrentPage] = useState(1);

  // Estado para manejar la apertura del modal de edición
  const [modalOpen, setModalOpen] = useState(false);

  // Número de elementos por página
  const itemsPerPage = 7;

  // Función para manejar la búsqueda de clientes
  const handleSearch = (e) => {
    setSearchText(e.target.value.toLowerCase());
  };

  // Función para manejar los cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prevForm => ({
      ...prevForm,
      [name]: value
    }));
  };

  // Función para manejar el cambio de página
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Función para abrir el Snackbar con un mensaje
  const openSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Función para cerrar el Snackbar
  const closeSnackbar = () => {
    setSnackbarOpen(false);
  };

  // Función para manejar el envío del formulario (agregar cliente)
  const handleSubmit = () => {
    const { NombreCompleto, Distintivo, CategoriaCliente, Celular, Correo, Direccion } = form;

    // Validación de campos
    if (!NombreCompleto || !Distintivo || !CategoriaCliente || !Celular || !Correo || !Direccion) {
      openSnackbar("Por favor, ingrese todos los campos", 'warning');
      return;
    }

    // Verificación de cliente existente por distintivo
    
    const clienteExistente = data.find(registro => registro.Distintivo.toString() === Distintivo.toString());
    if (clienteExistente) {
      openSnackbar("El cliente ya existe. Por favor, ingrese un distintivo diferente.", 'error');
      return;
    }
    // Creación de un nuevo cliente
    const nuevoCliente = {
      ...form,
      id: data.length ? Math.max(...data.map(cli => cli.id)) + 1 : 1
    };

    // Actualización del estado con el nuevo cliente
    setData([...data, nuevoCliente]);

    // Reinicio del formulario
    setForm({
      id: '',
      NombreCompleto: '',
      Distintivo: '',
      CategoriaCliente: '',
      Celular: '',
      Correo: '',
      Direccion: '',
      Estado: true
    });
    setShowForm(false);
    openSnackbar("Cliente agregado exitosamente", 'success');
  };

  // Función para manejar la edición de un cliente
  const editar = () => {
    const { NombreCompleto, Distintivo, CategoriaCliente, Celular, Correo, Direccion } = form;

    // Validación de campos
    if (!NombreCompleto || !Distintivo || !CategoriaCliente || !Celular || !Correo || !Direccion) {
      openSnackbar("Por favor, ingrese todos los campos", 'warning');
      return;
    }

    // Verificación de cliente existente por distintivo, excluyendo el actual

    const clienteExistente = data.find(
      (registro) => registro.Distintivo.toString() === Distintivo.toString() &&
      registro.id !== form.id
    );
    
    if (clienteExistente) {
      openSnackbar("Ya existe un cliente con el mismo distintivo. Por favor, ingresa un distintivo diferente.", 'error');
      return;
    }

    // Actualización del cliente existente
    const updatedData = data.map((registro) =>
      registro.id === form.id ? { ...form } : registro
    );

    setData(updatedData);
    setIsEditing(false);
    setModalOpen(false);
    openSnackbar("Cliente editado exitosamente", 'success');
  };

  // Función para manejar la eliminación de un cliente
  const eliminar = (dato) => {
    if (window.confirm(`¿Realmente desea eliminar el registro ${dato.id}?`)) {
      const updatedData = data.filter(registro => registro.id !== dato.id);
      setData(updatedData);
      openSnackbar("Cliente eliminado exitosamente", 'success');
    }
  };

  // Función para cambiar el estado (activo/inactivo) de un cliente
  const cambiarEstado = (id) => {
    const updatedData = data.map((registro) => {
      if (registro.id === id) {
        registro.Estado = !registro.Estado;
      }
      return registro;
    });

    setData(updatedData);
    openSnackbar("Estado del cliente actualizado exitosamente", 'success');
  };

  // Filtrado de datos según el texto de búsqueda
  const filteredData = data.filter(item =>
    item.NombreCompleto.toLowerCase().includes(searchText) ||
    item.Distintivo.toLowerCase().includes(searchText) ||
    item.CategoriaCliente.toLowerCase().includes(searchText) ||
    item.Celular.toString().includes(searchText) ||
    item.Correo.toLowerCase().includes(searchText) ||
    item.Direccion.toLowerCase().includes(searchText)
  );

  // Cálculo de los índices para la paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  // Cálculo de los números de página
  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(filteredData.length / itemsPerPage); i++) {
    pageNumbers.push(i);
  }

  return (
    <Container>
      <br />
      <h2>Lista de Clientes</h2>
      <br />
      <div className="d-flex justify-content-between align-items-center mb-3">
        <Input
          type="text"
          placeholder="Buscar cliente"
          value={searchText}
          onChange={handleSearch}
          style={{ width: '50%' }}
        />
        <Button color="success" onClick={() => { setForm({ id: '', NombreCompleto: '', Distintivo: '', CategoriaCliente: '', Celular: '', Correo: '', Direccion: '', Estado: true }); setIsEditing(false); setShowForm(true); }}>
          Agregar Cliente
        </Button>
      </div>

      {!showForm && (
        <>
          <Table className="table table-hover">
            <thead>
              <tr>
                <th>id</th>
                <th>Nombre Completo</th>
                <th>Distintivo</th>
                <th>Categoría Cliente</th>
                <th>Celular</th>
                <th>Correo</th>
                <th>Dirección</th>
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
                    <td>{item.Distintivo}</td>
                    <td>{item.CategoriaCliente}</td>
                    <td>{item.Celular}</td>
                    <td>{item.Correo}</td>
                    <td>{item.Direccion}</td>
                    <td>
                      <Button
                        color={item.Estado ? "success" : "danger"}
                        onClick={() => cambiarEstado(item.id)}
                      >
                        {item.Estado ? "Activo" : "Inactivo"}
                      </Button>
                    </td>
                    <td>
                      <Button color="primary" className="me-2" onClick={() => { setForm(item); setIsEditing(true); setModalOpen(true); }}>
                        <FaEdit />
                      </Button>{" "}
                      <Button color="danger" onClick={() => eliminar(item)}>
                        <FaTrashAlt />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="text-center">No se encontraron clientes</td>
                </tr>
              )}
            </tbody>
          </Table>

          <div className="d-flex justify-content-center">
            <ul className="pagination">
              {pageNumbers.map(number => (
                <li key={number} className={`page-item ${currentPage === number ? 'active' : ''}`}>
                  <Button
                    onClick={() => handlePageChange(number)}
                    className="page-link"
                  >
                    {number}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {showForm && (
        <div>
          <h3>{isEditing ? "Editar Cliente" : "Agregar Cliente"}</h3>
          <Row>
            <Col md={4}>
              <FormGroup>
                <label>Nombre Completo</label>
                <Input type="text" name="NombreCompleto" value={form.NombreCompleto} onChange={handleChange} />
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label>Distintivo</label>
                <Input type="text" name="Distintivo" value={form.Distintivo} onChange={handleChange} />
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label>Categoría Cliente</label>
                <Input type="select" name="CategoriaCliente" value={form.CategoriaCliente} onChange={handleChange}>
                  <option value="">Seleccione...</option>
                  <option value="regular">Regular</option>
                  <option value="familiar">Familiar</option>
                  <option value="vip">VIP</option>
                </Input>
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md={4}>
              <FormGroup>
                <label>Celular</label>
                <Input type="text" name="Celular" value={form.Celular} onChange={handleChange} />
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label>Correo</label>
                <Input type="email" name="Correo" value={form.Correo} onChange={handleChange} />
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label>Dirección</label>
                <Input type="text" name="Direccion" value={form.Direccion} onChange={handleChange} />
              </FormGroup>
            </Col>
          </Row>
          <Button color="primary" onClick={isEditing ? editar : handleSubmit}>
            {isEditing ? "Guardar Cambios" : "Agregar Cliente"}
          </Button>{" "}
          <Button color="secondary" onClick={() => setShowForm(false)}>
            Cancelar
          </Button>
        </div>
      )}

      {/* Modal para edición de clientes */}
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)}>
        <ModalHeader toggle={() => setModalOpen(!modalOpen)}>Editar Cliente</ModalHeader>
        <ModalBody>
          <FormGroup>
            <label>Nombre Completo</label>
            <Input type="text" name="NombreCompleto" value={form.NombreCompleto} onChange={handleChange} />
          </FormGroup>
          <FormGroup>
            <label>Distintivo</label>
            <Input type="text" name="Distintivo" value={form.Distintivo} onChange={handleChange} />
          </FormGroup>
          <FormGroup>
            <label>Categoría Cliente</label>
            <Input type="select" name="CategoriaCliente" value={form.CategoriaCliente} onChange={handleChange}>
              <option value="">Seleccione...</option>
              <option value="regular">Regular</option>
              <option value="familiar">Familiar</option>
              <option value="vip">VIP</option>
            </Input>
          </FormGroup>
          <FormGroup>
            <label>Celular</label>
            <Input type="text" name="Celular" value={form.Celular} onChange={handleChange} />
          </FormGroup>
          <FormGroup>
            <label>Correo</label>
            <Input type="email" name="Correo" value={form.Correo} onChange={handleChange} />
          </FormGroup>
          <FormGroup>
            <label>Dirección</label>
            <Input type="text" name="Direccion" value={form.Direccion} onChange={handleChange} />
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={editar}>Guardar Cambios</Button>{' '}
          <Button color="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
        </ModalFooter>
      </Modal>

      {/* Snackbar para notificaciones */}
      <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={closeSnackbar}>
        <Alert onClose={closeSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    
    </Container>
  );
};

export default Clientes;
