import { useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Table, Button, Container, Row, Col, FormGroup, Input, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { FaEdit, FaTrashAlt } from 'react-icons/fa'; 
import { Snackbar, Alert } from '@mui/material'; 
import PropTypes from 'prop-types'; 

const initialData = [
  { id: 1, Nombre: "Boda Juan y María", Distintivo: "7867", Evento: "Boda", Fechahora: "2024-09-01T18:00", Cantidadmesas: "15", Nropersonas: "150", Abono: "500", Totalpag: "1500", Restante: "1000" },
  { id: 2, Nombre: "Fiesta de Empresa", Distintivo: "7576", Evento: "Corporativo", Fechahora: "2024-09-15T20:00", Cantidadmesas: "20", Nropersonas: "200", Abono: "700", Totalpag: "2000", Restante: "1300" },
  // Más datos de ejemplo...
];

const Reserva = () => {
  const [data, setData] = useState(initialData);
  const [form, setForm] = useState({
    id: '',
    Nombre: '',
    Distintivo: '',
    Evento: '',
    Fechahora: '',
    Cantidadmesas: '',
    Nropersonas: '',
    CategoriaCliente: '',
    Correo: '',
    Celular: '',
    Direccion: '',
    DuracionEvento: '',
    ServiciosAdicionales: '',
    Observaciones: '',
    MontoDecoracion: '',
    Abono: '',
    Totalpag: '',
    Restante: '',
    FormaPago: ''
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
  const [deleteReserva, setDeleteReserva] = useState(null);

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

  const handleSubmit = () => {
    const { Nombre, Distintivo, Evento, Fechahora, Cantidadmesas, Nropersonas, CategoriaCliente, Correo, Celular, Direccion, DuracionEvento, ServiciosAdicionales, Observaciones, MontoDecoracion, Abono, Totalpag, Restante, FormaPago } = form;

    if (!Nombre || !Distintivo || !Evento || !Fechahora || !Cantidadmesas || !Nropersonas || !CategoriaCliente || !Correo || !Celular || !Direccion || !DuracionEvento || !ServiciosAdicionales || !Observaciones || !MontoDecoracion || !Abono || !Totalpag || !Restante || !FormaPago) {
      openSnackbar("Por favor, ingrese todos los campos", 'warning');
      return;
    }

    const reservaExistente = data.find(registro => registro.Distintivo.toString() === Distintivo.toString());
    if (reservaExistente) {
      openSnackbar("La reserva ya existe. Por favor, ingrese un distintivo diferente.", 'error');
      return;
    }

    const nuevaReserva = {
      ...form,
      id: data.length ? Math.max(...data.map(res => res.id)) + 1 : 1
    };

    setData([...data, nuevaReserva]);
    setForm({
      id: '',
      Nombre: '',
      Distintivo: '',
      Evento: '',
      Fechahora: '',
      Cantidadmesas: '',
      Nropersonas: '',
      CategoriaCliente: '',
      Correo: '',
      Celular: '',
      Direccion: '',
      DuracionEvento: '',
      ServiciosAdicionales: '',
      Observaciones: '',
      MontoDecoracion: '',
      Abono: '',
      Totalpag: '',
      Restante: '',
      FormaPago: ''
    });
    setShowForm(false);
    openSnackbar("Reserva agregada exitosamente", 'success');
  };

  const editar = () => {
    const { Nombre, Distintivo, Evento, Fechahora, Cantidadmesas, Nropersonas, CategoriaCliente, Correo, Celular, Direccion, DuracionEvento, ServiciosAdicionales, Observaciones, MontoDecoracion, Abono, Totalpag, Restante, FormaPago } = form;

    if (!Nombre || !Distintivo || !Evento || !Fechahora || !Cantidadmesas || !Nropersonas || !CategoriaCliente || !Correo || !Celular || !Direccion || !DuracionEvento || !ServiciosAdicionales || !Observaciones || !MontoDecoracion || !Abono || !Totalpag || !Restante || !FormaPago) {
      openSnackbar("Por favor, ingrese todos los campos", 'warning');
      return;
    }

    const reservaExistente = data.find(
      (registro) => registro.Distintivo.toString() === Distintivo.toString() &&
      registro.id !== form.id
    );
    if (reservaExistente) {
      openSnackbar("Ya existe una reserva con el mismo distintivo. Por favor, ingresa un distintivo diferente.", 'error');
      return;
    }

    const updatedData = data.map((registro) =>
      registro.id === form.id ? { ...form } : registro
    );

    setData(updatedData);
    setIsEditing(false);
    setModalOpen(false);
    openSnackbar("Reserva editada exitosamente", 'success');
  };

  const handleDelete = (dato) => {
    setDeleteReserva(dato);
    setDeleteAlertOpen(true);
  };

  const confirmDelete = () => {
    if (deleteReserva) {
      const updatedData = data.filter(registro => registro.id !== deleteReserva.id);
      setData(updatedData);
      openSnackbar("Reserva eliminada exitosamente", 'success');
      setDeleteAlertOpen(false);
    }
  };

  const cancelDelete = () => {
    setDeleteAlertOpen(false);
  };

  const filteredData = data.filter(item =>
    item.Nombre.toLowerCase().includes(searchText) ||
    item.Distintivo.toLowerCase().includes(searchText) ||
    item.Evento.toLowerCase().includes(searchText) ||
    item.Fechahora.toLowerCase().includes(searchText) ||
    item.Cantidadmesas.toString().includes(searchText) ||
    item.Nropersonas.toString().includes(searchText) ||
    item.Abono.toString().includes(searchText) ||
    item.Totalpag.toString().includes(searchText) ||
    item.Restante.toString().includes(searchText)
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
          <h2>Lista de Reservas</h2>
          <br />
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Input
              type="text"
              placeholder="Buscar..."
              value={searchText}
              onChange={handleSearch}
              style={{ width: '300px' }}
            />
            <Button color="primary" onClick={() => setShowForm(true)}>
              Agregar Reserva
            </Button>
          </div>

          <Table striped>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Distintivo</th>
                <th>Evento</th>
                <th>Fecha y Hora</th>
                <th>Cantidad de Mesas</th>
                <th>Número de Personas</th>
                <th>Abono</th>
                <th>Total a Pagar</th>
                <th>Restante</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.Nombre}</td>
                  <td>{item.Distintivo}</td>
                  <td>{item.Evento}</td>
                  <td>{item.Fechahora}</td>
                  <td>{item.Cantidadmesas}</td>
                  <td>{item.Nropersonas}</td>
                  <td>{item.Abono}</td>
                  <td>{item.Totalpag}</td>
                  <td>{item.Restante}</td>
                  <td>
                    <Button color="warning" onClick={() => {
                      setForm(item);
                      setIsEditing(true);
                      setModalOpen(true);
                    }}>
                      <FaEdit />
                    </Button>
                    <Button color="danger" onClick={() => handleDelete(item)}>
                      <FaTrashAlt />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          <nav>
            <ul className="pagination">
              {pageNumbers.map(number => (
                <li
                  key={number}
                  className={`page-item ${currentPage === number ? 'active' : ''}`}
                >
                  <Button className="page-link" onClick={() => handlePageChange(number)}>
                    {number}
                  </Button>
                </li>
              ))}
            </ul>
          </nav>
        </>
      )}

      {showForm && (
        <div>
          <h2>{isEditing ? 'Editar Reserva' : 'Agregar Reserva'}</h2>
          <br />
          <FormGroup>
            <label>Nombre</label>
            <Input
              type="text"
              name="Nombre"
              value={form.Nombre}
              onChange={handleChange}
            />
          </FormGroup>
          <FormGroup>
            <label>Distintivo</label>
            <Input
              type="text"
              name="Distintivo"
              value={form.Distintivo}
              onChange={handleChange}
            />
          </FormGroup>
          <FormGroup>
            <label>Evento</label>
            <Input
              type="text"
              name="Evento"
              value={form.Evento}
              onChange={handleChange}
            />
          </FormGroup>
          <FormGroup>
            <label>Fecha y Hora</label>
            <Input
              type="datetime-local"
              name="Fechahora"
              value={form.Fechahora}
              onChange={handleChange}
            />
          </FormGroup>
          <FormGroup>
            <label>Cantidad de Mesas</label>
            <Input
              type="number"
              name="Cantidadmesas"
              value={form.Cantidadmesas}
              onChange={handleChange}
            />
          </FormGroup>
          <FormGroup>
            <label>Número de Personas</label>
            <Input
              type="number"
              name="Nropersonas"
              value={form.Nropersonas}
              onChange={handleChange}
            />
          </FormGroup>
          <FormGroup>
            <label>Categoria de Cliente</label>
            <Input
              type="text"
              name="CategoriaCliente"
              value={form.CategoriaCliente}
              onChange={handleChange}
            />
          </FormGroup>
          <FormGroup>
            <label>Correo</label>
            <Input
              type="email"
              name="Correo"
              value={form.Correo}
              onChange={handleChange}
            />
          </FormGroup>
          <FormGroup>
            <label>Celular</label>
            <Input
              type="text"
              name="Celular"
              value={form.Celular}
              onChange={handleChange}
            />
          </FormGroup>
          <FormGroup>
            <label>Dirección</label>
            <Input
              type="text"
              name="Direccion"
              value={form.Direccion}
              onChange={handleChange}
            />
          </FormGroup>
          <FormGroup>
            <label>Duración del Evento (horas)</label>
            <Input
              type="number"
              name="DuracionEvento"
              value={form.DuracionEvento}
              onChange={handleChange}
            />
          </FormGroup>
          <FormGroup>
            <label>Servicios Adicionales</label>
            <Input
              type="text"
              name="ServiciosAdicionales"
              value={form.ServiciosAdicionales}
              onChange={handleChange}
            />
          </FormGroup>
          <FormGroup>
            <label>Observaciones</label>
            <Input
              type="text"
              name="Observaciones"
              value={form.Observaciones}
              onChange={handleChange}
            />
          </FormGroup>
          <FormGroup>
            <label>Monto de Decoración</label>
            <Input
              type="number"
              name="MontoDecoracion"
              value={form.MontoDecoracion}
              onChange={handleChange}
            />
          </FormGroup>
          <FormGroup>
            <label>Abono</label>
            <Input
              type="number"
              name="Abono"
              value={form.Abono}
              onChange={handleChange}
            />
          </FormGroup>
          <FormGroup>
            <label>Total a Pagar</label>
            <Input
              type="number"
              name="Totalpag"
              value={form.Totalpag}
              onChange={handleChange}
            />
          </FormGroup>
          <FormGroup>
            <label>Restante</label>
            <Input
              type="number"
              name="Restante"
              value={form.Restante}
              onChange={handleChange}
            />
          </FormGroup>
          <FormGroup>
            <label>Forma de Pago</label>
            <Input
              type="text"
              name="FormaPago"
              value={form.FormaPago}
              onChange={handleChange}
            />
          </FormGroup>
          <br />
          <Button color="primary" onClick={isEditing ? editar : handleSubmit}>
            {isEditing ? 'Guardar Cambios' : 'Agregar Reserva'}
          </Button>{' '}
          <Button color="secondary" onClick={() => setShowForm(false)}>
            Cancelar
          </Button>
        </div>
      )}

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={closeSnackbar}>
        <Alert onClose={closeSnackbar} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>

      <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)}>
        <ModalHeader toggle={() => setModalOpen(!modalOpen)}>
          Confirmar Eliminación
        </ModalHeader>
        <ModalBody>
          ¿Está seguro de que desea eliminar esta reserva?
        </ModalBody>
        <ModalFooter>
          <Button color="danger" onClick={confirmDelete}>
            Confirmar
          </Button>{' '}
          <Button color="secondary" onClick={cancelDelete}>
            Cancelar
          </Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={deleteAlertOpen} toggle={() => setDeleteAlertOpen(!deleteAlertOpen)}>
        <ModalHeader toggle={() => setDeleteAlertOpen(!deleteAlertOpen)}>
          Confirmar Eliminación
        </ModalHeader>
        <ModalBody>
          ¿Está seguro de que desea eliminar esta reserva?
        </ModalBody>
        <ModalFooter>
          <Button color="danger" onClick={confirmDelete}>
            Confirmar
          </Button>{' '}
          <Button color="secondary" onClick={() => setDeleteAlertOpen(false)}>
            Cancelar
          </Button>
        </ModalFooter>
      </Modal>
    </Container>
  );
};

Reserva.propTypes = {
  data: PropTypes.array,
  form: PropTypes.object,
  isEditing: PropTypes.bool,
  showForm: PropTypes.bool,
  searchText: PropTypes.string,
  snackbarOpen: PropTypes.bool,
  snackbarMessage: PropTypes.string,
  snackbarSeverity: PropTypes.string,
  currentPage: PropTypes.number,
  modalOpen: PropTypes.bool,
  deleteAlertOpen: PropTypes.bool,
  deleteReserva: PropTypes.object,
  handleSearch: PropTypes.func,
  handleChange: PropTypes.func,
  handlePageChange: PropTypes.func,
  openSnackbar: PropTypes.func,
  closeSnackbar: PropTypes.func,
  handleSubmit: PropTypes.func,
  editar: PropTypes.func,
  handleDelete: PropTypes.func,
  confirmDelete: PropTypes.func,
  cancelDelete: PropTypes.func,
  filteredData: PropTypes.array,
  indexOfLastItem: PropTypes.number,
  indexOfFirstItem: PropTypes.number,
  currentItems: PropTypes.array,
  pageNumbers: PropTypes.array,
};

export default Reserva;
