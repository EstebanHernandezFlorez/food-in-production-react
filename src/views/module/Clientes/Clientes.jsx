import { useState } from "react"; 
import 'bootstrap/dist/css/bootstrap.min.css';
import { Table, Button, Container, Row, Col, FormGroup, Input, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { FaEdit, FaTrashAlt } from 'react-icons/fa'; 
import { Snackbar, Alert } from '@mui/material'; 
import PropTypes from 'prop-types'; 

const initialData = [
  { id: 1, NombreCompleto: "Juan Pérez", Distintivo: "7867", CategoriaCliente: "regular", Celular: "3123456789", Correo: "juan.perez@example.com", Direccion: "Cl 76 j 12b 55", Estado: true },
  { id: 2, NombreCompleto: "Ana Torres", Distintivo: "7576", CategoriaCliente: "familiar", Celular: "3109876543", Correo: "ana.torres@example.com", Direccion: "Av. El Dorado 92-45", Estado: true },
];

const Clientes = () => {
  const [data, setData] = useState(initialData);
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
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [deleteClient, setDeleteClient] = useState(null);

  const itemsPerPage = 7;

  const handleSearch = (e) => {
    setSearchText(e.target.value.toLowerCase());
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
    const { NombreCompleto, Distintivo, CategoriaCliente, Celular, Correo, Direccion } = form;
    let errors = [];

    if (!NombreCompleto) errors.push("Nombre Completo es requerido.");
    if (!Distintivo) errors.push("Distintivo es requerido.");
    if (!CategoriaCliente) errors.push("Categoría Cliente es requerida.");
    if (!Celular || !/^\d{10}$/.test(Celular)) errors.push("Celular debe tener 10 dígitos.");
    if (!Correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(Correo)) errors.push("Correo inválido.");
    if (!Direccion) errors.push("Dirección es requerida.");

    if (errors.length) {
      openSnackbar(errors.join(' '), 'warning');
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const { Distintivo } = form;
    const clienteExistente = data.find(registro => registro.Distintivo.toString() === Distintivo.toString());
    if (clienteExistente) {
      openSnackbar("El cliente ya existe. Por favor, ingrese un distintivo diferente.", 'error');
      return;
    }

    const nuevoCliente = {
      ...form,
      id: data.length ? Math.max(...data.map(cli => cli.id)) + 1 : 1
    };

    setData([...data, nuevoCliente]);

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

  const editar = () => {
    if (!validateForm()) return;

    const { Distintivo, id } = form;
    const clienteExistente = data.find(
      (registro) => registro.Distintivo.toString() === Distintivo.toString() &&
      registro.id !== id
    );
    if (clienteExistente) {
      openSnackbar("Ya existe un cliente con el mismo distintivo. Por favor, ingresa un distintivo diferente.", 'error');
      return;
    }

    const updatedData = data.map((registro) =>
      registro.id === id ? { ...form } : registro
    );

    setData(updatedData);
    setIsEditing(false);
    setModalOpen(false);
    openSnackbar("Cliente editado exitosamente", 'success');
  };

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

  const filteredData = data.filter(item =>
    item.NombreCompleto.toLowerCase().includes(searchText) ||
    item.Distintivo.toLowerCase().includes(searchText) ||
    item.CategoriaCliente.toLowerCase().includes(searchText) ||
    item.Celular.toString().includes(searchText) ||
    item.Correo.toLowerCase().includes(searchText) ||
    item.Direccion.toLowerCase().includes(searchText)
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
          <h2>Lista de Clientes</h2>
          <br />
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Input
              type="text"
              placeholder="Buscar cliente"
              value={searchText}
              onChange={handleSearch}
              style={{ width: '20%' }}
            />
            <Button style={{ background: '#2e8329' }} onClick={() => { setForm({ id: '', NombreCompleto: '', Distintivo: '', CategoriaCliente: '', Celular: '', Correo: '', Direccion: '', Estado: true }); setIsEditing(false); setShowForm(true); }}>
              Agregar Cliente
            </Button>
          </div>

          <Table striped bordered hover responsive>
            <thead className="text-center">
              <tr>
                <th>ID</th>
                <th>Nombre Completo</th>
                <th>Distintivo</th>
                <th>Categoría</th>
                <th>Celular</th>
                <th>Correo</th>
                <th>Dirección</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody className="text-center">
              {currentItems.length > 0 ? (
                currentItems.map((dato) => (
                  <tr key={dato.id}>
                    <td>{dato.id}</td>
                    <td>{dato.NombreCompleto}</td>
                    <td>{dato.Distintivo}</td>
                    <td>{dato.CategoriaCliente}</td>
                    <td>{dato.Celular}</td>
                    <td>{dato.Correo}</td>
                    <td>{dato.Direccion}</td>
                    <td>
                      <Button
                  style={{
                    backgroundColor: dato.Estado ? '#2e8322' : '#8d0f0f',
                    borderColor: dato.Estado ? '#2e8322' : '#8d0f0f',
                    color: '#fff'  // Ajusta el color del texto si es necesario
                  }}
                  onClick={() => cambiarEstado(dato.id)}
                >
                  {dato.Estado ? "Activo" : "Inactivo"}
                    </Button>

                    </td>
                    <td>
                      <Button style={{ background: '#1a1918', marginRight: '5px' }} onClick={() => { setForm(dato); setIsEditing(true); setModalOpen(true); }}>
                        <FaEdit />
                      </Button>
                      <Button style={{background:'#8d0f0f'}} onClick={() => handleDelete(dato)}>
                        <FaTrashAlt />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9">No hay datos disponibles.</td>
                </tr>
              )}
            </tbody>
          </Table>

          <div className="d-flex justify-content-center">
            <nav>
              <ul className="pagination">
                {pageNumbers.map((number) => (
                  <li
                    key={number}
                    className={`page-item ${number === currentPage ? 'active' : ''}`}
                    onClick={() => handlePageChange(number)}
                  >
                    <span className="page-link">{number}</span>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </>
      )}

      {showForm && (
        <Row>
          <Col md={12}>
            <h2>{isEditing ? 'Editar Cliente' : 'Agregar Cliente'}</h2>
            
            <br />
            <FormGroup>
              <Row>
                <Col md={6}>
                <label><b>Nombre Completo</b></label>
                <br />
                  <Input
                  
                    type="text"
                    name="NombreCompleto"
                    value={form.NombreCompleto}
                    onChange={handleChange}
                    placeholder="Nombre Completo"
                    invalid={!form.NombreCompleto && showForm}
                  />
                </Col>
                <br />
                <br />
                <br />
                <Col md={6}>
                <label><b>Distintivo</b></label>
                <br />
                  <Input
                    type="Number"
                    name="Distintivo"
                    value={form.Distintivo}
                    onChange={handleChange}
                    placeholder="Distintivo"
                    invalid={!form.Distintivo && showForm}
                  />
                </Col>
                <br />
                <br />
                <br />
              </Row>
              <Row>
                <Col md={6}>
                <br />
                <label><b>Categoria cliente</b></label>
              
                  <Input
                    type="text"
                    name="CategoriaCliente"
                    value={form.CategoriaCliente}
                    onChange={handleChange}
                    placeholder="Categoría Cliente"
                    invalid={!form.CategoriaCliente && showForm}
                  />
                </Col>
                <br />
                <br />
                <br />
                <Col md={6}>
                <br />
                <label><b>Celular</b></label>
                <br />
                  <Input
                    type="Number"
                    name="Celular"
                    value={form.Celular}
                    onChange={handleChange}
                    placeholder="Celular"
                    invalid={!form.Celular || !/^\d{10}$/.test(form.Celular) && showForm}
                  />
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                <br />
                <label><b>Email</b></label>
                <br />
                  <Input
                    type="email"
                    name="Correo"
                    value={form.Correo}
                    onChange={handleChange}
                    placeholder="Correo"
                    invalid={!form.Correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.Correo) && showForm}
                  />
                </Col>
                <Col md={6}>
                <br />
                <label><b>Dirección</b></label>
                <br />
                  <Input
                    type="text"
                    name="Direccion"
                    value={form.Direccion}
                    onChange={handleChange}
                    placeholder="Dirección"
                    invalid={!form.Direccion && showForm}
                  />
                </Col>
              </Row>
              <br />
              <div className="d-flex justify-content-start">
                <Button style={{ background: '#2e8329', marginRight: '10px' }} onClick={handleSubmit}>
                  Guardar
                </Button>
                <Button editar onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
              </div>
            </FormGroup>
          </Col>
        </Row>
      )}

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={closeSnackbar}>
        <Alert onClose={closeSnackbar} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>

      <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)}>
        <ModalHeader style={{background:'#6d0f0f'}} toggle={() => setModalOpen(!modalOpen)}>
        <h3 className="text-white"> Editar cliente</h3>
        </ModalHeader>
        <ModalBody>
          <FormGroup>
          <label ><b>Nombre Completo:</b></label>
          <br />
            <Input
            style={{ border: '2px solid #000000' }}
              type="text"
              name="NombreCompleto"
              value={form.NombreCompleto}
              onChange={handleChange}
              placeholder="Nombre Completo"
            />
            <br />
            <label ><b>Distintivo:</b></label>
            <br />
            <Input
            style={{ border: '2px solid #000000' }}
              type="Number"
              name="Distintivo"
              value={form.Distintivo}
              onChange={handleChange}
              placeholder="Distintivo"
            />
            <br />
            <label ><b>Categoria cliente:</b></label>
            <br />
            <Input
            style={{ border: '2px solid #000000' }}
              type="text"
              name="CategoriaCliente"
              value={form.CategoriaCliente}
              onChange={handleChange}
              placeholder="Categoría Cliente"
            />
            <br />
            <label ><b>Celular:</b></label>
            <br />
            <Input
            style={{ border: '2px solid #000000' }}
              type="Number"
              name="Celular"
              value={form.Celular}
              onChange={handleChange}
              placeholder="Celular"
            />
            <br />
            <label ><b>Correo:</b></label>
            <br />
            <Input
            style={{ border: '2px solid #000000' }}
              type="email"
              name="Correo"
              value={form.Correo}
              onChange={handleChange}
              placeholder="Correo"
            />
            <br />
            <label ><b>Dirección:</b></label>
            <br />
            <Input
            style={{ border: '2px solid #000000' }}
              type="text"
              name="Direccion"
              value={form.Direccion}
              onChange={handleChange}
              placeholder="Dirección"
            />
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button style={{ background: '#2e8329' }} onClick={editar}>
            Guardar 
          </Button>{' '}
          <Button style={{background:'#6d0f0f'}} onClick={() => setModalOpen(!modalOpen)}>
            Cancelar
          </Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={deleteAlertOpen} toggle={() => setDeleteAlertOpen(!deleteAlertOpen)}>
        <ModalHeader style={{background:'#6d0f0f'}} toggle={() => setDeleteAlertOpen(!deleteAlertOpen)}>
        <h3 className="text-white">Eliminar cliente  </h3>
        </ModalHeader>
        <ModalBody>
          ¿Está seguro de que desea eliminar este cliente?
        </ModalBody>
        <ModalFooter>
          <Button style={{background:'#6d0f0f'}} onClick={confirmDelete}>
            Eliminar
          </Button>{' '}
          <Button style={{ background: '#2e8329' }} onClick={cancelDelete}>
            Cancelar
          </Button>
        </ModalFooter>
      </Modal>
    </Container>
  );
};

Clientes.propTypes = {
  data: PropTypes.array,
};

export default Clientes;
