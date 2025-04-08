import { useState, useEffect } from 'react';
import { Table, Button, Container, Modal, ModalBody, ModalHeader, ModalFooter, FormGroup, Input, Spinner } from 'reactstrap';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import serviciosService  from '../../services/serviciosService';
import "../../../App.css";

const Servicios = () => {
  const [data, setData] = useState([]); // Almacena los datos en formato frontend { id, Nombre, Estado }
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ // El formulario siempre usa el formato frontend
    id: '',
    Nombre: '',
    Estado: 'Activo', // String 'Activo' o 'Inactivo'
  });
  const [modalInsertar, setModalInsertar] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  // --- Fetch Data Hook ---
  useEffect(() => {
    fetchData();
  }, []);

  // --- Filter Data Hook ---
  useEffect(() => {
    const lowercasedFilter = searchText.toLowerCase();
    // Filtra sobre 'data' que ya está en formato frontend
    const filtered = data.filter(item =>
      item.Nombre.toLowerCase().includes(lowercasedFilter)
    );
    setFilteredData(filtered);
    setCurrentPage(1);
  }, [data, searchText]);

  // --- Función para obtener datos de la API ---
  const fetchData = async () => {
    setLoading(true);
    try {
      // servicioService.getAllServicios ya devuelve los datos mapeados a { id, Nombre, Estado }
      const servicios = await serviciosService.getAllServicios();
      console.log("Datos recibidos por fetchData:", servicios);
      setData(servicios || []);
    } catch (error) {
       // Podrías mejorar este mensaje también si es necesario
      console.error("Error cargando servicios:", error);
      Swal.fire('Error', 'No se pudieron cargar los servicios.', 'error');
      
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers (sin cambios) ---
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSearch = (e) => {
    setSearchText(e.target.value);
  };

  // --- Validación (sin cambios) ---
  const validarFormulario = () => {
    if (!form.Nombre.trim()) {
      Swal.fire('Error', 'El campo Nombre es obligatorio.', 'error');
      return false;
    }
    return true;
  };

  // --- Funciones CRUD adaptadas ---

  const insertar = async () => {
    if (!validarFormulario()) return;

    const result = await Swal.fire({
      title: '¿Desea agregar este servicio?',
      text: `Nombre: ${form.Nombre}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2e8322',
      cancelButtonColor: '#6d0f0f',
      confirmButtonText: 'Sí, agregar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        // Pasamos el 'form' que ya está en formato frontend { Nombre, Estado }
        // El servicio se encarga de mapear a { name, status }
        await serviciosService.createServicio({ Nombre: form.Nombre, Estado: 'Activo' }); // Estado por defecto al crear

        setModalInsertar(false);
        setForm({ id: '', Nombre: '', Estado: 'Activo' }); // Resetea el form
        await Swal.fire('Agregado', 'El servicio ha sido agregado con éxito.', 'success');
        fetchData(); // <-- RECARGA DATOS después de agregar
      } catch (error) {
        // ----- INICIO DEL BLOQUE DE MANEJO DE ERROR MEJORADO -----
        console.error("Error al insertar:", error); // Mantén el log para depurar
        let errorMessage = 'No se pudo agregar el servicio.'; // Mensaje por defecto

        if (error.response) { // Si el error tiene una respuesta del servidor
            // 1. Busca el array 'errors' de express-validator
            if (error.response.data?.errors && Array.isArray(error.response.data.errors) && error.response.data.errors.length > 0) {
                // Extrae el mensaje (o mensajes) del array
                errorMessage = error.response.data.errors.map(err => err.msg).join(' '); // Une todos los mensajes si hay varios
            }
            // 2. Si no hay 'errors', busca un 'message' genérico (como respaldo)
            else if (error.response.data?.message) {
                errorMessage = error.response.data.message;
            }
            // 3. Si es un 400 pero sin mensaje claro, da una pista
            else if (error.response.status === 400) {
                 errorMessage = "Error de validación. Revise los datos (posiblemente el nombre ya existe).";
            }
            // 4. Otro mensaje de error de la respuesta HTTP si existe
            else if (error.message) {
                 errorMessage = error.message;
            }
        } else if (error.request) {
            // La petición se hizo pero no se recibió respuesta (ej. sin conexión)
            errorMessage = "No se pudo conectar con el servidor. Verifique su conexión.";
        } else {
            // Error al configurar la petición
            errorMessage = error.message || "Ocurrió un error inesperado.";
        }

        // Muestra el mensaje de error determinado por la lógica anterior
        Swal.fire('Error', errorMessage, 'error');

        setLoading(false); // Asegúrate de quitar el estado de carga EN CASO DE ERROR
         // ----- FIN DEL BLOQUE DE MANEJO DE ERROR MEJORADO -----
      }
      // Nota: setLoading(false) ya no es necesario aquí abajo si fetchData() lo maneja en su 'finally'
    }
  };

  // -------- EL RESTO DE LAS FUNCIONES (editar, eliminar, cambiarEstado) --------
  // Puedes aplicar una lógica SIMILAR de manejo de errores en los 'catch' de editar, eliminar y cambiarEstado
  // si quieres mensajes más específicos para esas operaciones también.
  // Por ejemplo, en editar:

  const editar = async () => {
    if (!validarFormulario()) return;

    const result = await Swal.fire({
      title: '¿Desea editar este servicio?',
      text: `Nuevo nombre: ${form.Nombre}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2e8322',
      cancelButtonColor: '#6d0f0f',
      confirmButtonText: 'Sí, editar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
       setLoading(true);
      try {
        await serviciosService.updateServicio(form.id, form);

        setModalEditar(false);
        setForm({ id: '', Nombre: '', Estado: 'Activo' });
        await Swal.fire('Editado', 'El servicio ha sido editado con éxito.', 'success');
        fetchData(); // RECARGA DATOS (API devuelve 204, así que es necesario)
      } catch (error) {
        console.error("Error al editar:", error);
         // Lógica de error similar a insertar (puedes refinarla para editar)
         let errorMessage = 'No se pudo editar el servicio.';
         if (error.response) {
             if (error.response.data?.errors && Array.isArray(error.response.data.errors) && error.response.data.errors.length > 0) {
                 errorMessage = error.response.data.errors.map(err => err.msg).join(' '); // Podrías tener validaciones en editar también
             } else if (error.response.data?.message) {
                 errorMessage = error.response.data.message;
             } else if (error.response.status === 400) {
                 errorMessage = "Error de validación al editar. Revise los datos.";
             } else if (error.response.status === 404) {
                 errorMessage = "El servicio que intenta editar no fue encontrado.";
             } else if (error.message) {
                 errorMessage = error.message;
             }
         } else if (error.request) {
             errorMessage = "No se pudo conectar con el servidor.";
         } else {
             errorMessage = error.message || "Ocurrió un error inesperado al editar.";
         }
         Swal.fire('Error', errorMessage, 'error');
         setLoading(false); // Quita el loading en caso de error
      }
    }
  };

  const eliminar = async (servicio) => {
    const result = await Swal.fire({
      title: '¿Está seguro?',
      text: `¿Desea eliminar el servicio "${servicio.Nombre}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#2e8322',
      cancelButtonColor: '#6d0f0f',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        await serviciosService.deleteServicio(servicio.id);
        await Swal.fire('Eliminado', 'El servicio ha sido eliminado con éxito.', 'success');
        fetchData(); // RECARGA DATOS
      } catch (error) {
        console.error("Error al eliminar:", error);
         // Lógica de error similar
         let errorMessage = 'No se pudo eliminar el servicio.';
         if (error.response) {
             if (error.response.data?.message) { // La API de delete podría enviar un mensaje útil
                 errorMessage = error.response.data.message;
             } else if (error.response.status === 404) {
                 errorMessage = "El servicio que intenta eliminar no fue encontrado.";
             } else if (error.message) {
                 errorMessage = error.message;
             }
         } else if (error.request) {
             errorMessage = "No se pudo conectar con el servidor.";
         } else {
             errorMessage = error.message || "Ocurrió un error inesperado al eliminar.";
         }
         Swal.fire('Error', errorMessage, 'error');
         setLoading(false); // Quita el loading en caso de error
      }
    }
  };

  const cambiarEstado = async (id) => {
    const servicio = data.find(s => s.id === id);
    if (!servicio) return;

    const nuevoEstado = servicio.Estado === "Activo" ? "Inactivo" : "Activo";

    const result = await Swal.fire({
      title: "¿Desea cambiar el estado del servicio?",
      text: `El servicio "${servicio.Nombre}" pasará a ${nuevoEstado}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#2e8322",
      cancelButtonColor: "#6d0f0f",
      confirmButtonText: "Sí, cambiar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        await serviciosService.changeStateServicio(id, nuevoEstado);
        await Swal.fire('Actualizado', `El estado del servicio ha sido actualizado a ${nuevoEstado}.`, 'success');
        fetchData(); // RECARGA DATOS (API devuelve 204)
      } catch (error) {
        console.error("Error al cambiar estado:", error);
        // Lógica de error similar
        let errorMessage = 'No se pudo actualizar el estado.';
        if (error.response) {
            if (error.response.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response.status === 404) {
                errorMessage = "El servicio cuyo estado intenta cambiar no fue encontrado.";
            } else if (error.message) {
                errorMessage = error.message;
            }
        } else if (error.request) {
            errorMessage = "No se pudo conectar con el servidor.";
        } else {
            errorMessage = error.message || "Ocurrió un error inesperado al cambiar el estado.";
        }
        Swal.fire('Error', errorMessage, 'error');
        setLoading(false); // Quita el loading en caso de error
      }
    }
  };

  // --- Lógica de Paginación (sin cambios) ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = Array.isArray(filteredData) ? filteredData.slice(indexOfFirstItem, indexOfLastItem) : [];
  const pageNumbers = [];
  if (Array.isArray(filteredData)) {
      for (let i = 1; i <= Math.ceil(filteredData.length / itemsPerPage); i++) {
          pageNumbers.push(i);
      }
  }

  // --- Renderizado (sin cambios) ---
  return (
    <Container>
      <h2 className="text-center mt-4">Lista de Servicios Adicionales</h2>
      <br />
      <div className="d-flex justify-content-between align-items-center mb-3">
        <Input
          type="text"
          placeholder="Buscar servicio..."
          value={searchText}
          onChange={handleSearch}
          style={{ width: '300px' }}
        />
        <Button style={{ backgroundColor: '#2e8322', color: 'white' }} onClick={() => {
            setForm({ id: '', Nombre: '', Estado: 'Activo' }); // Resetea form al abrir
            setModalInsertar(true);
        }}>
            Agregar Servicio
        </Button>
      </div>

       {loading && (
                <div className="text-center my-5">
                    <Spinner color="primary" />
                    <p>Cargando...</p>
                </div>
            )}

      {!loading && (
        <>
          <div className="table-responsive">
            <Table className="table table-bordered table-hover text-center">
              <thead>
                <tr>
                  <th>Id</th>
                  <th>Nombre</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length > 0 ? currentItems.map((elemento) => (
                  <tr key={elemento.id} style={{ backgroundColor: elemento.Estado === "Inactivo" ? "#f8f9fa" : "white" }}>
                    <td>{elemento.id}</td>
                    <td>{elemento.Nombre}</td>
                    <td>
                      <Button
                        color={elemento.Estado === "Activo" ? "success" : "secondary"}
                        onClick={() => cambiarEstado(elemento.id)}
                        size="sm"
                        className="me-1"
                        style={{ minWidth: '80px', color: "white", padding: '0.25rem 0.5rem' }}
                        disabled={loading}
                      >
                        {elemento.Estado}
                      </Button>
                    </td>
                    <td>
                      <Button
                        color="dark"
                        size="sm"
                        className="me-1"
                        onClick={() => {
                            setForm(elemento);
                            setModalEditar(true);
                         }}
                         disabled={loading}
                       >
                          <FaEdit />
                      </Button>
                      <Button
                        color="danger"
                        size="sm"
                        onClick={() => eliminar(elemento)}
                        disabled={loading}
                      >
                          <FaTrashAlt />
                      </Button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="4" className="text-center">No hay servicios para mostrar.</td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>

          {/* Paginación */}
          {filteredData.length > itemsPerPage && (
            <div className="d-flex justify-content-center">
                 <ul className="pagination">
                    {pageNumbers.map(number => (
                    <li key={number} className={`page-item ${currentPage === number ? 'active' : ''}`}>
                        <Button
                            onClick={() => setCurrentPage(number)}
                            className="page-link"
                        >
                        {number}
                        </Button>
                    </li>
                    ))}
                 </ul>
            </div>
           )}
        </>
      )}

      {/* --- Modales --- */}

      {/* Modal Insertar */}
      <Modal isOpen={modalInsertar} toggle={() => !loading && setModalInsertar(!modalInsertar)}>
        <ModalHeader toggle={() => !loading && setModalInsertar(!modalInsertar)} style={{ background: '#6d0f0f', color: 'white' }}>
          Agregar Servicio Adicional
        </ModalHeader>
        <ModalBody>
          <FormGroup>
            <label htmlFor="nombreInsertar"><b>Nombre:</b></label>
            <Input
              id="nombreInsertar"
              name="Nombre"
              type="text"
              onChange={handleChange}
              value={form.Nombre}
              placeholder='Ingrese el nombre del servicio'
              required
            />
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color="success" onClick={insertar} disabled={loading}>
            {loading ? <Spinner size="sm" /> : 'Agregar'}
          </Button>
          <Button color="secondary" onClick={() => setModalInsertar(false)} disabled={loading}>Cancelar</Button>
        </ModalFooter>
      </Modal>

      {/* Modal Editar */}
      <Modal isOpen={modalEditar} toggle={() => !loading && setModalEditar(!modalEditar)}>
        <ModalHeader toggle={() => !loading && setModalEditar(!modalEditar)} style={{ background: '#6d0f0f', color: 'white' }}>
          Editar Servicio Adicional
        </ModalHeader>
        <ModalBody>
          <FormGroup>
             <label htmlFor="nombreEditar"><b>Nombre:</b></label>
            <Input
              id="nombreEditar"
              name="Nombre"
              type="text"
              onChange={handleChange}
              value={form.Nombre}
               placeholder='Ingrese el nombre del servicio'
               required
            />
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={editar} disabled={loading}>
             {loading ? <Spinner size="sm" /> : 'Guardar Cambios'}
          </Button>
          <Button color="secondary" onClick={() => setModalEditar(false)} disabled={loading}>Cancelar</Button>
        </ModalFooter>
      </Modal>
    </Container>
  );
};

export default Servicios;