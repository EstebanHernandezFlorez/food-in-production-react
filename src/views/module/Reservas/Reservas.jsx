import { useState } from "react"; 
import 'bootstrap/dist/css/bootstrap.min.css';
import { Table, Button, Container, Row, Col, FormGroup, Input, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { FaEdit, FaTrashAlt, FaEye } from 'react-icons/fa'; 
import { Snackbar, Alert } from '@mui/material'; 

const initialData = [
  {
    id: 1,
    NombreCompleto: "Juan Pérez",
    Distintivo: "7867",
    CategoriaCliente: "regular",
    Correo: "juan.perez@example.com",
    Celular: "3123456789",
    Direccion: "Cl 76 j 12b 55",
    Estado: true,
    NroPersonas: 4,
    CantidadMesas: 2,
    TipoEvento: "Cumpleaños",
    DuracionEvento: 3,
    FechaHora: "2024-10-01T15:00", //  compatible con datetime-local
    ServiciosAdicionales: "Catering, Decoración",
    Observaciones: "Evento familiar",
    MontoDecoracion: 200,
    TotalPagar: 500,
    Abono: 100,
    Restante: 400,
    FormaPago: "Transferencia"
  },
  
];

const Reservas = () => {
  const [data, setData] = useState(initialData);
  const [form, setForm] = useState({
    id: '',
    NombreCompleto: '',
    Distintivo: '',
    CategoriaCliente: '',
    Correo: '',
    Celular: '',
    Direccion: '',
    Estado: true,
    NroPersonas: '',
    CantidadMesas: '',
    TipoEvento: '',
    DuracionEvento: '',
    FechaHora: '',
    ServiciosAdicionales: '',
    Observaciones: '',
    MontoDecoracion: '',
    TotalPagar: '',
    Abono: '',
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
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
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

  const validateForm = () => { 
    const { NombreCompleto, Distintivo, CategoriaCliente, Correo, Celular, Direccion, NroPersonas, CantidadMesas, FechaHora, MontoDecoracion, TotalPagar, Abono } = form; 
    let errors = []; 

    if (!NombreCompleto) errors.push("Nombre Completo es requerido."); 
    if (!Distintivo) errors.push("Distintivo es requerido."); 
    if (!CategoriaCliente) errors.push("Categoría Cliente es requerida."); 
    if (!Celular || !/^\d{10}$/.test(Celular)) errors.push("Celular debe tener 10 dígitos."); 
    if (!Correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(Correo)) errors.push("Correo inválido."); 
    if (!Direccion) errors.push("Dirección es requerida."); 
    if (!NroPersonas || NroPersonas <= 0) errors.push("Número de personas debe ser mayor a 0."); 
    if (!CantidadMesas || CantidadMesas <= 0) errors.push("Cantidad de mesas debe ser mayor a 0."); 
    if (!FechaHora) errors.push("Fecha y hora son requeridas."); 
    if (!MontoDecoracion || MontoDecoracion < 0) errors.push("Monto de decoración debe ser positivo."); 
    if (!TotalPagar || TotalPagar <= 0) errors.push("Total a pagar debe ser mayor a 0."); 
    if (Abono < 0) errors.push("El abono no puede ser negativo."); 

    if (errors.length) { 
      openSnackbar(errors.join(' '), 'warning'); 
      return false; 
    } 
    return true; 
  }; 

  const handleSubmit = () => {
    if (!validateForm()) return;

    const nuevoReserva = {
      ...form,
      id: data.length ? Math.max(...data.map(reserva => reserva.id)) + 1 : 1
    };

    setData([...data, nuevoReserva]);

    setForm({
      id: '',
      NombreCompleto: '',
      Distintivo: '',
      CategoriaCliente: '',
      Correo: '',
      Celular: '',
      Direccion: '',
      Estado: true,
      NroPersonas: '',
      CantidadMesas: '',
      TipoEvento: '',
      DuracionEvento: '',
      FechaHora: '',
      ServiciosAdicionales: '',
      Observaciones: '',
      MontoDecoracion: '',
      TotalPagar: '',
      Abono: '',
      Restante: '',
      FormaPago: ''
    });
    setShowForm(false);
    openSnackbar("Reserva agregada exitosamente", 'success');
  };

  const editar = () => {
    if (!validateForm()) return;

    const updatedData = data.map((reserva) =>
      reserva.id === form.id ? { ...form } : reserva
    );

    setData(updatedData);
    setIsEditing(false);
    setModalOpen(false);
    openSnackbar("Reserva editada exitosamente", 'success');
  };

  const handleDelete = (reserva) => {
    setDeleteReserva(reserva);
    setDeleteAlertOpen(true);
  };

  const confirmDelete = () => {
    if (deleteReserva) {
      const updatedData = data.filter(reserva => reserva.id !== deleteReserva.id);
      setData(updatedData);
      openSnackbar("Reserva eliminada exitosamente", 'success');
      setDeleteAlertOpen(false);
    }
  };

  const cancelDelete = () => {
    setDeleteAlertOpen(false);
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

  const openDetailsModal = (reserva) => {
    setForm(reserva);
    setDetailsModalOpen(true);
  };

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
              placeholder="Buscar reserva"
              value={searchText}
              onChange={handleSearch}
              style={{ width: '20%' }}
            />
            <Button style={{ background: '#2e8329' }} onClick={() => { setShowForm(true); setIsEditing(false); }}>
              Agregar Reserva
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
                currentItems.map((reserva) => (
                  <tr key={reserva.id}>
                    <td>{reserva.id}</td>
                    <td>{reserva.NombreCompleto}</td>
                    <td>{reserva.Distintivo}</td>
                    <td>{reserva.CategoriaCliente}</td>
                    <td>{reserva.Celular}</td>
                    <td>{reserva.Correo}</td>
                    <td>{reserva.Direccion}</td>
                    <td>
                      <Button
                        style={{
                          backgroundColor: reserva.Estado ? '#2e8322' : '#8d0f0f',
                          borderColor: reserva.Estado ? '#2e8322' : '#8d0f0f',
                          color: '#fff'
                        }}
                        onClick={() => alert(reserva.Estado ? 'Activo' : 'Inactivo')}
                      >
                        {reserva.Estado ? 'Activo' : 'Inactivo'}
                      </Button>
                    </td>
                    <td>
                      <Button  style={{ background: '#1a1918', marginRight: '5px' }} onClick={() => { setForm(reserva); setIsEditing(true); setShowForm(true); }}>
                        <FaEdit />
                      </Button>
                      <Button style={{background:'#8d0f0f', marginRight: '5px'}} onClick={() => handleDelete(reserva)}>
                        <FaTrashAlt />
                      </Button>
                      <Button  style={{ maxWidth: "40%", color: "#fff"  }} onClick={() => openDetailsModal(reserva)}>
                        <FaEye />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9">No se encontraron reservas.</td>
                </tr>
              )}
            </tbody>
          </Table>

          {/* Paginación */}
          <div className="d-flex justify-content-center">
            {pageNumbers.map(number => (
              <Button key={number} onClick={() => handlePageChange(number)}>{number}</Button>
            ))}
          </div>
        </>
      )}

      {/* Formulario */}
      {showForm && (
        <div className="mb-3">
          <h2>{isEditing ? "Editar Reserva" : "Agregar Reserva"}</h2>
          <br />
          <Row>
            <Col md={6}>
              <FormGroup>
                <label><b>Nombre Completo</b></label>
                <Input  style={{ border: '2px solid #000000' }} type="text" name="NombreCompleto" value={form.NombreCompleto} onChange={handleChange} />
              </FormGroup>
              <FormGroup>
                <label><b>Distintivo</b></label>
                <Input  style={{ border: '2px solid #000000' }} type="text" name="Distintivo" value={form.Distintivo} onChange={handleChange} />
              </FormGroup>
              <FormGroup>
                <label><b>Categoría Cliente</b></label>
                <Input  style={{ border: '2px solid #000000' }} type="text" name="CategoriaCliente" value={form.CategoriaCliente} onChange={handleChange} />
              </FormGroup>
              <FormGroup>
                <label><b>Correo</b></label>
                <Input  style={{ border: '2px solid #000000' }} type="email" name="Correo" value={form.Correo} onChange={handleChange} />
              </FormGroup>
              <FormGroup>
                <label><b>Celular</b></label>
                <Input  style={{ border: '2px solid #000000' }} type="text" name="Celular" value={form.Celular} onChange={handleChange} />
              </FormGroup>
              <FormGroup>
                <label><b>Dirección</b></label>
                <Input  style={{ border: '2px solid #000000' }} type="text" name="Direccion" value={form.Direccion} onChange={handleChange} />
              </FormGroup>
              <FormGroup>
                <label><b>Número de Personas</b></label>
                <Input  style={{ border: '2px solid #000000' }} type="number" name="NroPersonas" value={form.NroPersonas} onChange={handleChange} />
              </FormGroup>
              <FormGroup>
                <label><b>Cantidad de Mesas</b></label>
                <Input  style={{ border: '2px solid #000000' }} type="number" name="CantidadMesas" value={form.CantidadMesas} onChange={handleChange} />
              </FormGroup>
              <FormGroup>
                <label><b>Tipo de Evento</b></label>
                <Input  style={{ border: '2px solid #000000' }} type="text" name="TipoEvento" value={form.TipoEvento} onChange={handleChange} />
              </FormGroup>
            
              </Col>
              <Col md={6}>
              <FormGroup>
                <label><b>Duración del Evento (horas)</b></label>
                <Input  style={{ border: '2px solid #000000' }} type="number" name="DuracionEvento" value={form.DuracionEvento} onChange={handleChange} />
              </FormGroup>
              <FormGroup>
                <label><b>Fecha y Hora</b></label>
                <Input  style={{ border: '2px solid #000000' }} type="datetime-local" name="FechaHora" value={form.FechaHora} onChange={handleChange} />
              </FormGroup>
              <FormGroup>
                <label><b>Servicios Adicionales</b></label>
                <Input  style={{ border: '2px solid #000000' }} type="text" name="ServiciosAdicionales" value={form.ServiciosAdicionales} onChange={handleChange} />
              </FormGroup>
              <FormGroup>
                <label><b>Observaciones</b></label>
                <Input  style={{ border: '2px solid #000000' }} type="text" name="Observaciones" value={form.Observaciones} onChange={handleChange} />
              </FormGroup>
              <FormGroup>
                <label><b>Monto Decoración</b></label>
                <Input  style={{ border: '2px solid #000000' }} type="number" name="MontoDecoracion" value={form.MontoDecoracion} onChange={handleChange} />
              </FormGroup>
              <FormGroup>
                <label><b>Total a Pagar</b></label>
                <Input  style={{ border: '2px solid #000000' }} type="number" name="TotalPagar" value={form.TotalPagar} onChange={handleChange} />
              </FormGroup>
              <FormGroup>
                <label><b>Abono</b></label>
                <Input  style={{ border: '2px solid #000000' }} type="number" name="Abono" value={form.Abono} onChange={handleChange} />
              </FormGroup>
              <FormGroup>
                <label><b>Restante</b></label>
                <Input  style={{ border: '2px solid #000000' }} type="number" name="Restante" value={form.Restante} onChange={handleChange} />
              </FormGroup>
              <FormGroup>
                <label><b>Forma de Pago</b> </label>
                <Input  style={{ border: '2px solid #000000' }} type="text" name="FormaPago" value={form.FormaPago} onChange={handleChange} />
              </FormGroup>

              <Row className="mt-3" style={{ marginLeft: '-670px' }}>
                <Col md={{ size: 6, offset: 0 }} className="text-start">
                  <Button style={{ background: '#2e8329' }}className="me-4" onClick={isEditing ? editar : handleSubmit}>
                    {isEditing ? "Guardar" : "Guardar"}
                  </Button>
              
                    <Button style={{background:'#6d0f0f'}} className="me-4" onClick={() => setShowForm(false)}>
                      Cancelar
                    </Button>
                </Col>
                </Row>

            </Col>
          </Row>
        </div>
      )}

      {/* Snackbar para mensajes */}
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={closeSnackbar}>
        <Alert onClose={closeSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Modal de confirmación de eliminación */}
      <Modal  isOpen={deleteAlertOpen}>
        <ModalHeader style={{background:'#8d0f0f'}}><h3 className="text-white"> Eliminar reserva</h3></ModalHeader>
        <ModalBody>
          ¿Está seguro de que desea eliminar esta reserva?
        </ModalBody>
        <ModalFooter>
          <Button style={{background:'#8d0f0f'}} onClick={confirmDelete}>Eliminar</Button>
          <Button style={{ background: '#2e8329' }} onClick={cancelDelete}>Cancelar</Button>
        </ModalFooter>
      </Modal>

      {/* Modal de detalles */}
      <Modal 
      isOpen={detailsModalOpen}
      style={{ maxWidth: '60%', width: '30%' }} // Ancho del modal
      scrollable={true} // Evitar scroll si no es necesario 
      >

        <ModalHeader style={{background:'#8d0f0f'}}  className="text-white">Detalles de Reserva</ModalHeader>
        <ModalBody>
          <p><strong>Nombre Completo:</strong> {form.NombreCompleto}</p>
          <p><strong>Distintivo:</strong> {form.Distintivo}</p>
          <p><strong>Categoría Cliente:</strong> {form.CategoriaCliente}</p>
          <p><strong>Correo:</strong> {form.Correo}</p>
          <p><strong>Celular:</strong> {form.Celular}</p>
          <p><strong>Dirección:</strong> {form.Direccion}</p>
          <p><strong>Número de Personas:</strong> {form.NroPersonas}</p>
          <p><strong>Cantidad de Mesas:</strong> {form.CantidadMesas}</p>
          <p><strong>Tipo de Evento:</strong> {form.TipoEvento}</p>
          <p><strong>Duración del Evento (horas):</strong> {form.DuracionEvento}</p>
          <p><strong>Fecha y Hora:</strong> {form.FechaHora}</p>
          <p><strong>Servicios Adicionales:</strong> {form.ServiciosAdicionales}</p>
          <p><strong>Observaciones:</strong> {form.Observaciones}</p>
          <p><strong>Monto Decoración:</strong> {form.MontoDecoracion}</p>
          <p><strong>Total a Pagar:</strong> {form.TotalPagar}</p>
          <p><strong>Abono:</strong> {form.Abono}</p>
          <p><strong>Restante:</strong> {form.Restante}</p>
          <p><strong>Forma de Pago:</strong> {form.FormaPago}</p>
        </ModalBody>
        <ModalFooter>
          <Button style={{background:'#8d0f0f'}} onClick={() => setDetailsModalOpen(false)}>Cerrar</Button>
        </ModalFooter>
      </Modal>
     
    </Container>
  );
};

Reservas.propTypes = {
  
};

export default Reservas;
