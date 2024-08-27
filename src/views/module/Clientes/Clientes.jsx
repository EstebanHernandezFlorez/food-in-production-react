// Importación de React y hooks
import React, { useState } from "react";

// Importación de Bootstrap y otros componentes necesarios
import 'bootstrap/dist/css/bootstrap.min.css';
import { Table, Button, Container, Row, Col, FormGroup, Input, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { FaEdit, FaTrashAlt } from 'react-icons/fa'; // Iconos de edición y eliminación
import { Snackbar, Alert } from '@mui/material'; // Componentes para notificaciones

// Datos iniciales de ejemplo
const initialData = [
  { id: 1, NombreCompleto: "Juan Pérez", Distintivo: "7867", CategoriaCliente: "regular", Celular: "3123456789", Correo: "juan.perez@example.com", Direccion: "Cl 76 j 12b 55", Estado: true },
  { id: 2, NombreCompleto: "Ana Torres", Distintivo: "7576", CategoriaCliente: "familiar", Celular: "3109876543", Correo: "ana.torres@example.com", Direccion: "Av. El Dorado 92-45", Estado: true },
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

  // Estado para manejar la apertura de la alerta de eliminación
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [deleteClient, setDeleteClient] = useState(null);

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
  const handleDelete = (dato) => {
    setDeleteClient(dato);
    setDeleteAlertOpen(true);
  };

  const confirmDelete = () => {
    if (deleteClient) {
      const updatedData = data.filter(registro => registro.id !== deleteClient.id);
      setData(updatedData);
      openSnackbar("Cliente eliminado exitosamente", 'success');
      setDeleteAlertOpen(false);
    }
  };

  const cancelDelete = () => {
    setDeleteAlertOpen(false);
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

      {/* Solo se muestra cuando no se está en la pantalla de agregar o editar cliente */}
      {!showForm && (
        <>
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
        </>
      )}

      {!showForm && (
        <>
          <Table className="table table-hover">
            <thead>
              <tr>
                <th>id</th>
                <th>Nombre Completo</th>
                <th>Distintivo</th>
                <th>Categoria Cliente</th>
                <th>Celular</th>
                <th>Correo</th>
                <th>Dirección</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((dato) => (
                <tr key={dato.id} style={{ backgroundColor: dato.Estado ? 'transparent' : '#f8f9fa' }}>
                  <td>{dato.id}</td>
                  <td>{dato.NombreCompleto}</td>
                  <td>{dato.Distintivo}</td>
                  <td>{dato.CategoriaCliente}</td>
                  <td>{dato.Celular}</td>
                  <td>{dato.Correo}</td>
                  <td>{dato.Direccion}</td>
                  <td>
                    <Button color={dato.Estado ? "success" : "secondary"} onClick={() => cambiarEstado(dato.id)}>
                      {dato.Estado ? "Activo" : "Inactivo"}
                    </Button>
                  </td>
                  <td>
                    <Button color="primary" onClick={() => { setForm(dato); setIsEditing(true); setModalOpen(true); }}>
                      <FaEdit />
                    </Button>{" "}
                    <Button color="danger" onClick={() => handleDelete(dato)}>
                      <FaTrashAlt />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          {/* Paginación */}
          <div className="d-flex justify-content-center">
            {pageNumbers.map(number => (
              <Button
                key={number}
                color="info"
                onClick={() => handlePageChange(number)}
                className="mx-1"
              >
                {number}
              </Button>
            ))}
          </div>
        </>
      )}

      {/* Mostrar formulario cuando `showForm` sea verdadero */}
      {showForm && (
        <div className="mt-4">
          <h2>{isEditing ? "Editar Cliente" : "Agregar Cliente"}</h2>
          <br />
          <Row>
            <Col md={6}>
              <FormGroup>
                <label>Nombre Completo:</label>
                <Input
                  type="text"
                  name="NombreCompleto"
                  value={form.NombreCompleto}
                  onChange={handleChange}
                  style={{ border: '2px solid #000000' }}
                />
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <label>Distintivo:</label>
                <Input
                  type="text"
                  name="Distintivo"
                  value={form.Distintivo}
                  onChange={handleChange}
                  style={{ border: '2px solid #000000' }}
                />
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <FormGroup>
                <label>Categoría Cliente:</label>
                <Input
                  type="text"
                  name="CategoriaCliente"
                  value={form.CategoriaCliente}
                  onChange={handleChange}
                  style={{ border: '2px solid #000000' }}
                />
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <label>Celular:</label>
                <Input
                  type="text"
                  name="Celular"
                  value={form.Celular}
                  onChange={handleChange}
                  style={{ border: '2px solid #000000' }}
                />
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <FormGroup>
                <label>Correo:</label>
                <Input
                  type="text"
                  name="Correo"
                  value={form.Correo}
                  onChange={handleChange}
                  style={{ border: '2px solid #000000' }}
                />
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <label>Dirección:</label>
                <Input
                  type="text"
                  name="Direccion"
                  value={form.Direccion}
                  onChange={handleChange}
                  style={{ border: '2px solid #000000' }}
                />
              </FormGroup>
            </Col>
          </Row>
          <Button style={{background:'#2e8322'}} onClick={isEditing ? editar : handleSubmit}>
            {isEditing ? "Guardar Cambios" : "Agregar"}
          </Button>{" "}
          <Button style={{background:'#6d0f0f'}} onClick={() => setShowForm(false)}>
            Cancelar
          </Button>
        </div>
      )}

      {/* Modal de edición */}
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)}>
        <ModalHeader toggle={() => setModalOpen(!modalOpen)}>Editar Cliente</ModalHeader>
        <ModalBody>
          {/* Formulario de edición dentro del modal */}
          <Row>
            <Col md={6}>
              <FormGroup>
                <label>Nombre Completo:</label>
                <Input
                  type="text"
                  name="NombreCompleto"
                  value={form.NombreCompleto}
                  onChange={handleChange}
                  style={{ border: '2px solid #000000' }}
                />
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <label>Distintivo:</label>
                <Input
                  type="text"
                  name="Distintivo"
                  value={form.Distintivo}
                  onChange={handleChange}
                  style={{ border: '2px solid #000000' }}
                />
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <FormGroup>
                <label>Categoría Cliente:</label>
                <Input
                  type="text"
                  name="CategoriaCliente"
                  value={form.CategoriaCliente}
                  onChange={handleChange}
                  style={{ border: '2px solid #000000' }}
                />
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <label>Celular:</label>
                <Input
                  type="text"
                  name="Celular"
                  value={form.Celular}
                  onChange={handleChange}
                  style={{ border: '2px solid #000000' }}
                />
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <FormGroup>
                <label>Correo:</label>
                <Input
                  type="text"
                  name="Correo"
                  value={form.Correo}
                  onChange={handleChange}
                  style={{ border: '2px solid #000000' }}
                />
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <label>Dirección:</label>
                <Input
                  type="text"
                  name="Direccion"
                  value={form.Direccion}
                  onChange={handleChange}
                  style={{ border: '2px solid #000000' }}
                />
              </FormGroup>
            </Col>
          </Row>
        </ModalBody>
        <ModalFooter>
          <Button style={{background:'#2e8322'}} onClick={editar}>Guardar Cambios</Button>{' '}
          <Button style={{background:'#6d0f0f'}} onClick={() => setModalOpen(false)}>Cancelar</Button>
        </ModalFooter>
      </Modal>

      {/* Snackbar para notificaciones */}
      <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={closeSnackbar}>
        <Alert onClose={closeSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Alerta de eliminación */}
      <Snackbar open={deleteAlertOpen} autoHideDuration={null} onClose={cancelDelete}>
        <Alert
          action={
            <div>
              <Button color="inherit" onClick={confirmDelete}>Eliminar</Button>
              <Button color="inherit" onClick={cancelDelete}>Cancelar</Button>
            </div>
          }
          onClose={cancelDelete}
          severity="warning"
        >
          ¿Realmente desea eliminar el registro {deleteClient?.id}?
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Clientes;
