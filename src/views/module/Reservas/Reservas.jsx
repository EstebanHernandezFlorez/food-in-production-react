// Importa los hooks y bibliotecas necesarias para el componente
import { useState } from "react"; 
import 'bootstrap/dist/css/bootstrap.min.css'; // Importa estilos de Bootstrap
import { Table, Button, Container, Row, Col, FormGroup, Input, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap'; // Importa componentes de Reactstrap para manejar el layout y el modal
import { FaEdit, FaTrashAlt,FaEye } from 'react-icons/fa'; // Importa iconos para botones de editar y eliminar
import { Snackbar, Alert } from '@mui/material'; // Importa la Snackbar y Alert de Material UI para notificaciones
import PropTypes from 'prop-types'; // Para definir las propiedades que el componente puede recibir

// Datos iniciales (ejemplo de clientes cargados al inicio)
const initialData = [
  { id: 1, NombreCompleto: "Juan Pérez", Distintivo: "7867", CategoriaCliente: "regular", Celular: "3123456789", Correo: "juan.perez@example.com", Direccion: "Cl 76 j 12b 55",Nropersonas:'',
    Cantidadmesas:1,
    Evento:"boda" ,
    Duracionevento:"2 hrs",
    Fecha_Hora: '',
    Servicio: '',
    Observaciones: '',
    Montodeco:'',
    Totalpag: '',
    Abono: '',
    Restante: '',
    Formapag: '', Estado: true },
  { id: 2, NombreCompleto: "Ana Torres", Distintivo: "7576", CategoriaCliente: "familiar", Celular: "3109876543", Correo: "ana.torres@example.com", Direccion: "Av. El Dorado 92-45", Estado: true },
];

// Componente principal
const Reservas = () => {
  // Manejo del estado para datos, formularios y otros controles
  const [data, setData] = useState(initialData); // Estado que almacena la lista de clientes
  const [form, setForm] = useState({
    id: '',
    NombreCompleto: '',
    Distintivo: '',
    CategoriaCliente: '',
    Correo: '',
    Celular: '',
    Direccion: '',
    Nropersonas:'',
    Cantidadmesas: '',
    Evento: '',
    Duracionevento: '',
    Fecha_Hora: '',
    Servicio: '',
    Observaciones: '',
    Montodeco:'',
    Totalpag: '',
    Abono: '',
    Restante: '',
    Formapag: '',
    Estado: true
  }); // Estado del formulario de cliente
  const [isEditing, setIsEditing] = useState(false); // Bandera para saber si se está editando un cliente
  const [showForm, setShowForm] = useState(false); // Controla la visibilidad del formulario de agregar/editar cliente
  const [searchText, setSearchText] = useState(''); // Almacena el texto de búsqueda
  const [snackbarOpen, setSnackbarOpen] = useState(false); // Controla la visibilidad de la Snackbar
  const [snackbarMessage, setSnackbarMessage] = useState(''); // Mensaje que se muestra en la Snackbar
  const [snackbarSeverity, setSnackbarSeverity] = useState('success'); // Tipo de alerta en la Snackbar (success, error, etc.)
  const [currentPage, setCurrentPage] = useState(1); // Página actual para paginación
  const [modalOpen, setModalOpen] = useState(false); // Controla la visibilidad del modal de edición
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false); // Controla la visibilidad del modal de eliminación
  const [deleteReserva, setDeleteReserva] = useState(null); // reserva que se está eliminando
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);


  const itemsPerPage = 7; // Número de clientes por página

 //ver detalle

  const toggleDetailModal = () => setDetailModalOpen(!detailModalOpen);

  const viewDetails = (item) => {
    setSelectedItem(item);
    toggleDetailModal();
  };
 
  // Función para manejar cambios en el campo de búsqueda
  const handleSearch = (e) => {
    setSearchText(e.target.value.toLowerCase()); // Convierte el texto a minúsculas para buscar
  };

  // Función para manejar cambios en los campos del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prevForm => ({
      ...prevForm,
      [name]: value // Actualiza el campo correspondiente en el estado del formulario
    }));
  };

  // Cambia la página actual en la paginación
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Muestra una alerta Snackbar con un mensaje y tipo
  const openSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true); // Abre la Snackbar
  };

  // Cierra la Snackbar
  const closeSnackbar = () => {
    setSnackbarOpen(false);
  };

  // Valida el formulario antes de agregar o editar un cliente
  const validateForm = () => {
    const { NombreCompleto, Distintivo, CategoriaCliente, Celular, Correo, Direccion,
      Nropersonas, Cantidadmesas, Evento, Duracionevento, Fecha_Hora, Servicio, Observaciones, Montodeco,
      Totalpag, Abono, Restante, Formapag
     } = form;
    let errors = [];

    // Valida cada campo y agrega errores a la lista si faltan datos o son inválidos
    if (!NombreCompleto) errors.push("Nombre Completo es requerido.");
    if (!Distintivo) errors.push("Distintivo es requerido.");
    if (!CategoriaCliente) errors.push("Categoría Cliente es requerida.");
    if (!Celular || !/^\d{10}$/.test(Celular)) errors.push("Celular debe tener 10 dígitos.");
    if (!Correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(Correo)) errors.push("Correo inválido.");
    if (!Direccion) errors.push("Direccion es requerida.");
    if (!Nropersonas || !/^\d{1}$/.test(Nropersonas)) errors.push("El nro de personas es requerido .");
    if (!Cantidadmesas || isNaN(Cantidadmesas)) errors.push("La cantidad de mesas debe ser un número válido.");
    if (!Evento) errors.push("Evento es requerido.");
    if (!Duracionevento) errors.push("La duracion del eveto es requerida.");
    if (!Fecha_Hora) errors.push("La fecha y la hora es requerida.");
    if (!Servicio) errors.push("Servicio es requerido.");
    if (!Observaciones) errors.push("Observaciones es requerida.");
    if (!Montodeco || !/^\d{1}$/.test(Montodeco)) errors.push("El monto del deco es requerido .");
    if (!Totalpag || !/^\d{1}$/.test(Totalpag)) errors.push("El total del pago es requerido .");
    if (!Abono || !/^\d{1}$/.test(Abono)) errors.push("El abono es requerido .");
    if (!Restante || !/^\d{1}$/.test(Restante)) errors.push("El restante es requerido .");
    if (!Formapag) errors.push("Forma de pago es requerida.");
    if (!form.Estado) errors.push("Estado es requerido.");
   
    if (errors.length) {
      openSnackbar(errors.join(' '), 'warning'); // Muestra los errores en la Snackbar
      return false; // El formulario no es válido
    }
    return true; // El formulario es válido
  };

  // Agrega una nueva reserva si el formulario es válido
  const handleSubmit = () => {
    if (!validateForm()) return; // Si la validación falla, sale de la función

    const { Distintivo } = form;
    // Verifica si ya existe una reserva con el mismo distintivo
    const reservaExistente = data.find(registro => registro.Distintivo.toString() === Distintivo.toString());
    if (reservaExistente) {
      openSnackbar("La reserva ya existe. Por favor, ingrese un distintivo diferente.", 'error');
      return;
    }

    // Crea una nueva reserva con los datos del formulario
    const nuevareserva = {
      ...form,
      id: data.length ? Math.max(...data.map(reservas => reservas.id)) + 1 : 1 // Asigna un nuevo ID
    };

    setData([...data, nuevareserva]); // Agrega la nueva reserva a la lista

    // Reinicia el formulario
    setForm({
      NombreCompleto: '',
    Distintivo: '',
    CategoriaCliente: '',
    Correo: '',
    Celular: '',
    Direccion: '',
    Nropersonas:'',
    Cantidadmesas: '',
    Evento: '',
    Duracionevento: '',
    Fecha_Hora: '',
    Servicio: '',
    Observaciones: '',
    Montodeco:'',
    Totalpag: '',
    Abono: '',
    Restante: '',
    Formapag: '', 
      Estado: true
    });
    setShowForm(false); // Oculta el formulario
    openSnackbar("Reserva creada exitosamente", 'success');
  };

  // Edita una reserva existente
  const editar = () => {
    if (!validateForm()) return; // Valida el formulario

    const { Distintivo, id } = form;
    // Verifica si ya existe otra reserva con el mismo distintivo
    const reservaExistente = data.find(
      (registro) => registro.Distintivo.toString() === Distintivo.toString() &&
      registro.id !== id
    );
    if (reservaExistente) {
      openSnackbar("Ya existe una reserva con el mismo distintivo. Por favor, ingresa un distintivo diferente.", 'error');
      return;
    }

    // Actualiza los datos de la reserva
    const updatedData = data.map((registro) =>
      registro.id === id ? { ...form } : registro
    );

    setData(updatedData); // Actualiza la lista de reservas
    setIsEditing(false); // Deja de estar en modo edición
    setModalOpen(false); // Cierra el modal
    openSnackbar("Reserva editada exitosamente", 'success');
  };

  // Elimina una reserva
  const handleDelete = (dato) => {
    setDeleteReserva(dato); // Almacena la reserva a eliminar
    setDeleteAlertOpen(true); // Muestra el modal de confirmación de eliminación
  };

  // Confirma la eliminación de la reserva
  const confirmDelete = () => {
    if (deleteReserva) {
      const updatedData = data.filter(registro => registro.id !== deleteReserva.id); // Filtra el cliente a eliminar
      setData(updatedData); // Actualiza la lista de clientes
      openSnackbar("Reserva eliminada exitosamente", 'success');
      setDeleteAlertOpen(false); // Cierra el modal de confirmación
    }
  };

  // Cancela la eliminación de la reserva 
  const cancelDelete = () => {
    setDeleteAlertOpen(false); // Cierra el modal de confirmación
  };

  // Cambia el estado de una reserva (Activo/Inactivo)
  const cambiarEstado = (id) => {
    const updatedData = data.map((registro) => {
      if (registro.id === id) {
        registro.Estado = !registro.Estado; // Cambia el estado de la reserva
      }
      return registro;
    });

    setData(updatedData); // Actualiza la lista de reservas
    openSnackbar("Estado de la reserva actualizada exitosamente", 'success');
  };

  // Filtra las reservas según el texto de búsqueda
  const filteredData = data.filter(item =>
    item.NombreCompleto.toLowerCase().includes(searchText) ||
    item.Distintivo.toLowerCase().includes(searchText) ||
    item.CategoriaCliente.toLowerCase().includes(searchText) ||
    item.Celular.toLowerCase().includes(searchText) ||
    item.Correo.toLowerCase().includes(searchText) ||
    item.Direccion.toLowerCase().includes(searchText)
  );
  // Calcula el índice inicial y final para la paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentData = filteredData.slice(indexOfFirstItem, indexOfLastItem); // Datos a mostrar en la página actual

  // Calcula el número total de páginas
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  console.log({totalPages})

 


  return (
    <Container>
      <Row>
        <Col>
          <h1 className="my-3">Lista de Reservas</h1>
          <Input
            type="text"
            placeholder="Buscar reserva..."
            value={searchText}
            onChange={handleSearch}
            style={{ width: '20%' }}
            className="mb-3"
          />
          <Table striped responsive>
            <thead>
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
            <tbody>
              {currentData.map((reservas) => (
                <tr key={reservas.id}>
                  <td>{reservas.id}</td>
                  <td>{reservas.NombreCompleto}</td>
                  <td>{reservas.Distintivo}</td>
                  <td>{reservas.CategoriaCliente}</td>
                  <td>{reservas.Celular}</td>
                  <td>{reservas.Correo}</td>
                  <td>{reservas.Direccion}</td>
                  <td>
                    <Button
                      color={reservas.Estado ? "success" : "danger"}
                      onClick={() => cambiarEstado(reservas.id)}
                    >
                      {reservas.Estado ? "Activo" : "Inactivo"}
                    </Button>
                  </td>
                  <td>
                    <Button
                     style={{ background: '#1a1918', marginRight: '5px' }}
                      onClick={() => {
                        setForm(reservas);
                        setIsEditing(true);
                        setModalOpen(true);
                      }}
                    >
                      <FaEdit />
                    </Button>

                    <Button
                      style={{background:'#8d0f0f'}}
                      className="ms-2"
                      onClick={() => handleDelete(reservas)}
                    >
                      <FaTrashAlt />
                    </Button>
                  
                    <Button 
        onClick={() => viewDetails(item)}
        className="me-2 btn-sm" 
        style={{ 
          backgroundColor: '#696969',
          border: 'none',
          padding: '0.55rem',
        }}
      >
        <FaEye style={{ color: 'white', fontSize: '1.30rem' }} /> 
      </Button>
                      
                      
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          {/* Paginación */}
        
          <div className="d-flex justify-content-center">
            <nav>
              <ul className="pagination">
                {totalPages && Array(totalPages).map((_,number) => (
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
        </Col>
      </Row>
      {/* Formulario de agregar/editar reserva */}
      {showForm && (
        <div>
          <h3>{isEditing ? "Editar Reserva" : "Agregar Reserva"}</h3>
          <form>
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
              <Input type="text" name="CategoriaCliente" value={form.CategoriaCliente} onChange={handleChange} />
            </FormGroup>
            <FormGroup>
              <label>Celular</label>
              <Input type="text" name="Celular" value={form.Celular} onChange={handleChange} />
            </FormGroup>
            <FormGroup>
              <label>Correo</label>
              <Input type="text" name="Correo" value={form.Correo} onChange={handleChange} />
            </FormGroup>
            <FormGroup>
              <label>Dirección</label>
              <Input type="text" name="Direccion" value={form.Direccion} onChange={handleChange} />
            </FormGroup>
            <FormGroup>
              <label>Nro Personas</label>
              <Input type="number" name="Nropersonas" value={form.Nropersonas} onChange={handleChange} />
            </FormGroup>
            <FormGroup>
              <label>Cantidad de mesas </label>
              <Input type="number" name="cantidadmesas" value={form.Cantidadmesas} onChange={handleChange} />
            </FormGroup>
            <FormGroup>
              <label>Evento </label>
              <Input type="text" name="Evento" value={form.Evento} onChange={handleChange} />
            </FormGroup>
            <FormGroup>
              <label>Duración del evento </label>
              <Input type="time" name="duracionevento" value={form.Duracionevento} onChange={handleChange} />
            </FormGroup>
            <FormGroup>
              <label>Fecha y Hora</label>
              <Input type="datetime-local" name="Fecha_Hora" value={form.Fecha_Hora} onChange={handleChange} />
            </FormGroup>
            <FormGroup>
              <label>Servicio adicional</label>
              <Input type="text" name="servicio" value={form.Servicio} onChange={handleChange} />
            </FormGroup>
            <FormGroup>
              <label>Observaciones </label>
              <Input type="text" name="observaciones" value={form.Observaciones} onChange={handleChange} />
            </FormGroup>
            <FormGroup>
              <label>Monto decoración </label>
              <Input type="number" name="montodeco" value={form.Montodeco} onChange={handleChange} />
            </FormGroup>
            <FormGroup>
              <label>Total a pagar </label>
              <Input type="number" name="totalpag" value={form.Totalpag} onChange={handleChange} />
            </FormGroup>
            <FormGroup>
              <label>Abono</label>
              <Input type="number" name="abono" value={form.Abono} onChange={handleChange} />
            </FormGroup>
            <FormGroup>
              <label>Restante  </label>
              <Input type="number" name="restante" value={form.Restante} onChange={handleChange} />
            </FormGroup>
            <FormGroup>
              <label>Forma de pago </label>
              <Input type="number" name="formapag" value={form.Formapag} onChange={handleChange} />
            </FormGroup>
            <Button color="primary" onClick={isEditing ? editar : handleSubmit}>
              {isEditing ? "Actualizar" : "Agregar"}
            </Button>
            <Button color="secondary" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
          </form>
        </div>
      )}

      {/* Modal para edición de la reserva */}
      <Modal isOpen={modalOpen}>
        <ModalHeader style={{background:'#8d0f0f'}}>{isEditing ? <h3 className="text-white"> Editar reserva</h3>: "Agregar Reserva"}</ModalHeader>
        <ModalBody>
          <FormGroup>
            <label><b>Nombre Completo</b></label>
            <Input style={{ border: '2px solid #000000' }} type="text" name="NombreCompleto" value={form.NombreCompleto} onChange={handleChange} />
          </FormGroup>
          <FormGroup>
            <label><b>Distintivo</b></label>
            <Input style={{ border: '2px solid #000000' }} type="text" name="Distintivo" value={form.Distintivo} onChange={handleChange} />
          </FormGroup>
          <FormGroup>
            <label><b>Categoría Cliente</b></label>
            <Input style={{ border: '2px solid #000000' }} type="text" name="CategoriaCliente" value={form.CategoriaCliente} onChange={handleChange} />
          </FormGroup>
          <FormGroup>
            <label><b>Celular</b></label>
            <Input style={{ border: '2px solid #000000' }} type="text" name="Celular" value={form.Celular} onChange={handleChange} />
          </FormGroup>
          <FormGroup>
            <label><b>Correo</b></label>
            <Input style={{ border: '2px solid #000000' }} type="text" name="Correo" value={form.Correo} onChange={handleChange} />
          </FormGroup>
          <FormGroup>
            <label><b>Dirección</b></label>
            <Input style={{ border: '2px solid #000000' }} type="text" name="Direccion" value={form.Direccion} onChange={handleChange} />
          </FormGroup>
        </ModalBody>
        <FormGroup>
              <label><b>Nro Personas</b></label>
              <Input style={{ border: '2px solid #000000' }} type="number" name="Nropersonas" value={form.Nropersonas} onChange={handleChange} />
            </FormGroup>
            <FormGroup>
              <label><b>Cantidad de mesas </b></label>
              <Input style={{ border: '2px solid #000000' }} type="number" name="cantidadmesas" value={form.Cantidadmesas} onChange={handleChange} />
            </FormGroup>
            <FormGroup>
              <label><b>Evento</b> </label>
              <Input style={{ border: '2px solid #000000' }} type="text" name="Evento" value={form.Evento} onChange={handleChange} />
            </FormGroup>
            <FormGroup>
              <label><b>Duración del evento</b> </label>
              <Input style={{ border: '2px solid #000000' }} type="time" name="duracionevento" value={form.Duracionevento} onChange={handleChange} />
            </FormGroup>
            <FormGroup>
              <label><b>Fecha y Hora</b></label>
              <Input style={{ border: '2px solid #000000' }} type="datetime" name="Fechayhora" value={form.Fecha_Hora} onChange={handleChange} />
            </FormGroup>
            <FormGroup>
              <label><b>Servicio adicional</b></label>
              <Input style={{ border: '2px solid #000000' }} type="text" name="servicio" value={form.Servicio} onChange={handleChange} />
            </FormGroup>
            <FormGroup>
              <label><b>Observaciones</b> </label>
              <Input style={{ border: '2px solid #000000' }} type="text" name="observaciones" value={form.Observaciones} onChange={handleChange} />
            </FormGroup>
            <FormGroup>
              <label><b>Monto decoración</b> </label>
              <Input style={{ border: '2px solid #000000' }} type="number" name="montodeco" value={form.Montodeco} onChange={handleChange} />
            </FormGroup>
            <FormGroup>
              <label><b>Total a pagar</b> </label>
              <Input  style={{ border: '2px solid #000000' }} type="number" name="totalpag" value={form.Totalpag} onChange={handleChange} />
            </FormGroup>
            <FormGroup>
              <label><b>Abono</b></label>
              <Input style={{ border: '2px solid #000000' }} type="number" name="abono" value={form.Abono} onChange={handleChange} />
            </FormGroup>
            <FormGroup>
              <label><b>Restante</b>  </label>
              <Input style={{ border: '2px solid #000000' }} type="number" name="restante" value={form.Restante} onChange={handleChange} />
            </FormGroup>
            <FormGroup>
              <label><b>Forma de pago</b> </label>
              <Input style={{ border: '2px solid #000000' }} type="number" name="formapag" value={form.Formapag} onChange={handleChange} />
            </FormGroup>
        <ModalFooter>
          <Button style={{ background: '#2e8329' }} onClick={editar}>
            Guardar
          </Button>
          <Button style={{background:'#8d0f0f'}} onClick={() => setModalOpen(false)}>
            Cancelar
          </Button>
        </ModalFooter>
      </Modal>

      {/* Modal para confirmación de eliminación */}
      <Modal isOpen={deleteAlertOpen}>
        <ModalHeader style={{background:'#8d0f0f'}}><h3 className="text-white">Eliminar reserva  </h3></ModalHeader>
        <ModalBody>
          ¿Estás seguro que deseas eliminar la reserva "{deleteReserva?.NombreCompleto}"?
        </ModalBody>
        <ModalFooter>
          <Button style={{background:'#8d0f0f'}} onClick={confirmDelete}>
            Eliminar
          </Button>
          <Button style={{ background: '#2e8329' }} onClick={cancelDelete}>
            Cancelar
          </Button>
        </ModalFooter>
      </Modal>

 {/* Modal de detalle */}
 <Modal 
        show={detailModalOpen} 
        onHide={toggleDetailModal} 
        style={{ maxWidth: '40%', marginTop: '10px', marginBottom: '3px' }}
      >
        <Modal.Header closeButton style={{ color: '#8C1616' }}>
          <Modal.Title>Detalles de la reserva</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ overflowY: 'auto', maxHeight: 'calc(120vh - 120px)' }}>
          {selectedItem ? (
            <div style={{ padding: '10px' }}>
              <p><strong>Nombre Completo:</strong> {selectedItem.NombreCompleto}</p>
              <p><strong>Distintivo:</strong> {selectedItem.Distintivo}</p>
              <p><strong>Categoría Cliente:</strong> {selectedItem.CategoriaCliente}</p>
              <p><strong>Correo:</strong> {selectedItem.Correo}</p>
              <p><strong>Celular:</strong> {selectedItem.Celular}</p>
              <p><strong>Dirección:</strong> {selectedItem.Direccion}</p>
              <p><strong>Nro de personas:</strong> {selectedItem.Nropersonas}</p>
              <p><strong>Cantidad de mesas:</strong> {selectedItem.Cantidadmesas}</p>
              <p><strong>Evento:</strong> {selectedItem.Evento}</p>
              <p><strong>Duración del evento:</strong> {selectedItem.Duracionevento}</p>
              <p><strong>Fecha y hora:</strong> {selectedItem.Fecha_Hora}</p>
              <p><strong>Servicio:</strong> {selectedItem.Servicio}</p>
              <p><strong>Observaciones:</strong> {selectedItem.Observaciones}</p>
              <p><strong>Monto de decoración:</strong> {selectedItem.Montodeco}</p>
              <p><strong>Total a pagar:</strong> {selectedItem.Totalpag}</p>
              <p><strong>Abono:</strong> {selectedItem.Abono}</p>
              <p><strong>Restante:</strong> {selectedItem.Restante}</p>
              <p><strong>Forma de pago:</strong> {selectedItem.Formapag}</p>
              <p><strong>Estado:</strong> {selectedItem.Estado ? 'Activo' : 'Inactivo'}</p>
            </div>
          ) : (
            <p>No se encontraron detalles.</p>
          )}
        </Modal.Body>
        <Modal.Footer style={{ display: 'flex', justifyContent: 'flex-end', padding: 0 }}>
          <Button style={{ background: '#6d0f0f' }} onClick={toggleDetailModal}>Cerrar</Button>
        </Modal.Footer>
      </Modal>
      
      {/* Snackbar para mensajes */}
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={closeSnackbar}>
        <Alert onClose={closeSnackbar} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

// Define las propTypes del componente
Reservas.propTypes = {
  initialData: PropTypes.array
};

export default Reservas;
