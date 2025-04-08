import { useState, useEffect } from "react"; // Quitamos PropTypes si no lo usamos directamente aquí
import 'bootstrap/dist/css/bootstrap.min.css';
// Añadimos Spinner
import { Table, Button, Container, FormGroup, Input, Modal,
 ModalHeader, ModalBody, ModalFooter, Spinner, Label } from 'reactstrap';
 import { FaEdit, FaTrashAlt } from 'react-icons/fa';
//                                                                                                                        ^^^^^ ¡Añadido aquí!import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
// Importamos el nuevo servicio
import clientesService from "../../services/clientesService"; // Asegúrate que la ruta es correcta
import "../../../App.css"; // Si tienes estilos globales

// Estado inicial vacío para el formulario (formato frontend)
const initialFormState = {
  id: '',
  NombreCompleto: '',
  Distintivo: '',
  CategoriaCliente: '', // Asegúrate que el valor inicial ('') sea válido para tu <select> o pon uno por defecto
  Celular: '',
  Correo: '',
  Direccion: '',
  Estado: 'Activo' // Usaremos 'Activo'/'Inactivo' consistentemente en el estado del form
};

const Clientes = () => {

  const [data, setData] = useState([]); // Datos de la API (formato frontend)
  const [filteredData, setFilteredData] = useState([]); // Para búsqueda/paginación
  const [loading, setLoading] = useState(true); // Estado de carga
  const [form, setForm] = useState(initialFormState);
  // Mantenemos errores locales para validación rápida en frontend (opcional)
  const [errors, setErrors] = useState({
    NombreCompleto: '', Distintivo: '', CategoriaCliente: '',
    Celular: '', Correo: '', Direccion: '',
  });
  // Estados para los modales (como en Servicios.jsx)
  const [modalInsertar, setModalInsertar] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);

  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  // --- Hook para cargar datos iniciales ---
  useEffect(() => {
    fetchData();
  }, []);

  // --- Hook para filtrar datos cuando cambian los datos o el texto de búsqueda ---
   useEffect(() => {
    const lowercasedFilter = searchText.toLowerCase();
    const filtered = data.filter(item =>
        // Adapta los campos a buscar si es necesario
        item.NombreCompleto.toLowerCase().includes(lowercasedFilter) ||
        item.Distintivo.toLowerCase().includes(lowercasedFilter) ||
        item.CategoriaCliente.toLowerCase().includes(lowercasedFilter) ||
        (item.Celular && item.Celular.includes(searchText)) || // Cuidado con null/undefined
        (item.Correo && item.Correo.toLowerCase().includes(lowercasedFilter))
    );
    setFilteredData(filtered);
    setCurrentPage(1); // Resetea a página 1 al filtrar
  }, [data, searchText]);


  // --- Función para obtener datos de la API ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const clientes = await clientesService.getAllClientes(); // Usa el servicio
      setData(clientes || []); // Asegura que sea un array
    } catch (error) {
      console.error("Error cargando clientes:", error);
      Swal.fire('Error', 'No se pudieron cargar los clientes.', 'error');
      setData([]); // Resetea data en caso de error
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prevForm => ({
      ...prevForm,
      [name]: value
    }));
    // Validar campo al cambiar (opcional, para feedback rápido)
    setErrors(prevErrors => ({
      ...prevErrors,
      [name]: validateField(name, value) // Usa tu función de validación local
    }));
  };

  const handleSearch = (e) => {
    setSearchText(e.target.value); // No necesita toLowerCase aquí
  };

  // --- Validación Frontend (Opcional pero útil para feedback rápido) ---
  const validateField = (name, value) => {
    // Reutiliza tus reglas de validación existentes
     switch (name) {
      case 'NombreCompleto':
         return value.trim() ? '' : 'Nombre Completo es requerido.'; // Simple validación de requerido
        // return /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value) ? '' : 'Nombre Completo solo debe contener letras y espacios.';
      case 'Distintivo':
         return value.trim() ? '' : 'Distintivo es requerido.';
        // return /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value) ? '' : 'Distintivo solo debe contener letras.';
      case 'CategoriaCliente':
         return value ? '' : 'Categoría Cliente es requerida.'; // Para select, verifica que no esté vacío
      case 'Celular':
         // Hacer la validación de 10 dígitos opcional o ajustar según backend
         return !value || /^\d{10}$/.test(value) ? '' : 'Celular debe tener 10 dígitos (si se ingresa).';
      case 'Correo':
         // Hacer opcional
         return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : 'Correo electrónico inválido (si se ingresa).';
      case 'Direccion':
         // Hacer opcional
         return !value || value.trim() !== '' ? '' : 'Dirección es requerida (si se ingresa).';
      default:
        return '';
    }
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;
    const fieldsToValidate = ['NombreCompleto', 'Distintivo', 'CategoriaCliente', 'Celular', 'Correo', 'Direccion']; // Ajusta según campos requeridos

    fieldsToValidate.forEach(key => {
        const error = validateField(key, form[key]);
        newErrors[key] = error;
        // Solo marca inválido si hay error Y el campo es requerido (ajusta lógica si es necesario)
        if (error && ['NombreCompleto', 'Distintivo', 'CategoriaCliente'].includes(key)) {
             isValid = false;
        } else if (error) {
             // Si hay error en campos opcionales pero mal formateados
             isValid = false;
        }
    });

    setErrors(newErrors);
    return isValid;
  };


  // --- Funciones CRUD adaptadas ---

  const insertar = async () => {
    if (!validateForm()) {
       Swal.fire('Error de Validación', 'Por favor, corrija los errores en el formulario.', 'warning');
       return;
    }

    // No necesitamos la confirmación Swal aquí si ya está en el modal (o añadirla si se prefiere)
    setLoading(true);
    try {
       // Crea un objeto solo con los datos necesarios para crear (excluye id)
       // El servicio se encarga del mapeo a formato backend
       const dataToCreate = { ...form, Estado: 'Activo' }; // Asegura que se crea como Activo
       delete dataToCreate.id; // No enviar id al crear

       await clientesService.createCliente(dataToCreate);

       setModalInsertar(false); // Cierra el modal
       setForm(initialFormState); // Limpia el formulario
       setErrors({}); // Limpia errores locales
       await Swal.fire('Agregado', 'El cliente ha sido agregado con éxito.', 'success');
       fetchData(); // Recarga los datos
    } catch (error) {
      console.error("Error al insertar cliente:", error);
      // --- Manejo de errores MEJORADO ---
      let errorMessage = 'No se pudo agregar el cliente.';
      if (error.response) {
          if (error.response.data?.errors && Array.isArray(error.response.data.errors) && error.response.data.errors.length > 0) {
              errorMessage = error.response.data.errors.map(err => err.msg).join(' ');
          } else if (error.response.data?.message) {
              errorMessage = error.response.data.message;
          } else if (error.response.status === 400) {
              errorMessage = "Error de validación. Verifique los datos ingresados.";
          } else if (error.message) {
              errorMessage = error.message;
          }
      } else if (error.request) {
          errorMessage = "No se pudo conectar con el servidor.";
      } else {
          errorMessage = error.message || "Ocurrió un error inesperado.";
      }
      Swal.fire('Error', errorMessage, 'error');
      setLoading(false); // Asegura quitar loading en caso de error
    }
     // setLoading es manejado por fetchData() o en el catch del error
  };

  const editar = async () => {
    if (!validateForm()) {
       Swal.fire('Error de Validación', 'Por favor, corrija los errores en el formulario.', 'warning');
       return;
    }

     // No necesitamos confirmación Swal aquí si está en el modal
    setLoading(true);
    try {
       // Pasamos el ID (que SÍ está en el form state al editar) y los datos del form
       // El servicio mapeará a formato backend
       await clientesService.updateCliente(form.id, form);

       setModalEditar(false);
       setForm(initialFormState);
       setErrors({});
       await Swal.fire('Editado', 'El cliente ha sido editado con éxito.', 'success');
       fetchData(); // Recarga datos (obligatorio por 204 de la API)
    } catch (error) {
       console.error("Error al editar cliente:", error);
       // --- Manejo de errores MEJORADO (similar a insertar, ajusta mensajes si es necesario) ---
       let errorMessage = 'No se pudo editar el cliente.';
       if (error.response) {
           if (error.response.data?.errors && Array.isArray(error.response.data.errors) && error.response.data.errors.length > 0) {
               errorMessage = error.response.data.errors.map(err => err.msg).join(' ');
           } else if (error.response.data?.message) {
               errorMessage = error.response.data.message;
           } else if (error.response.status === 400) {
               errorMessage = "Error de validación al editar.";
           } else if (error.response.status === 404) {
                errorMessage = "El cliente que intenta editar no fue encontrado.";
           } else if (error.message) {
               errorMessage = error.message;
           }
       } else if (error.request) {
           errorMessage = "No se pudo conectar con el servidor.";
       } else {
           errorMessage = error.message || "Ocurrió un error inesperado al editar.";
       }
       Swal.fire('Error', errorMessage, 'error');
       setLoading(false);
    }
  };

  const eliminar = async (cliente) => { // Renombrado para consistencia
    const result = await Swal.fire({
      title: '¿Está seguro?',
      text: `¿Desea eliminar el cliente "${cliente.NombreCompleto}"?`, // Usa NombreCompleto
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#2e8322', // Ajusta colores si quieres
      cancelButtonColor: '#6d0f0f',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        await clientesService.deleteCliente(cliente.id); // Usa el servicio, pasa el ID
        await Swal.fire('Eliminado', 'El cliente ha sido eliminado con éxito.', 'success');
        fetchData(); // Recarga datos
      } catch (error) {
        console.error("Error al eliminar cliente:", error);
        // --- Manejo de errores ---
        let errorMessage = 'No se pudo eliminar el cliente.';
         if (error.response) {
             if (error.response.data?.message) {
                 errorMessage = error.response.data.message;
             } else if (error.response.status === 404) {
                 errorMessage = "El cliente que intenta eliminar no fue encontrado.";
             } else if (error.message) {
                 errorMessage = error.message;
             }
         } else if (error.request) {
             errorMessage = "No se pudo conectar con el servidor.";
         } else {
             errorMessage = error.message || "Ocurrió un error inesperado al eliminar.";
         }
        Swal.fire('Error', errorMessage, 'error');
        setLoading(false);
      }
    }
  };

  const cambiarEstado = async (id) => {
    // Busca el cliente en el estado 'data' (formato frontend)
    const cliente = data.find(c => c.id === id);
    if (!cliente) return;

    // Determina el nuevo estado en formato frontend ('Activo'/'Inactivo')
    const nuevoEstado = cliente.Estado === "Activo" ? "Inactivo" : "Activo";

    const result = await Swal.fire({
      title: "¿Desea cambiar el estado del cliente?",
      text: `El cliente "${cliente.NombreCompleto}" pasará a ${nuevoEstado}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#2e8322", // Ajusta colores
      cancelButtonColor: "#6d0f0f",
      confirmButtonText: "Sí, cambiar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        // Llama al servicio pasando el ID y el NUEVO estado en formato frontend
        await clientesService.changeStateCliente(id, nuevoEstado);

        await Swal.fire('Actualizado', `El estado del cliente ha sido actualizado a ${nuevoEstado}.`, 'success');
        fetchData(); // Recarga datos (obligatorio por 204)
      } catch (error) {
        console.error("Error al cambiar estado cliente:", error);
        // --- Manejo de errores ---
         let errorMessage = 'No se pudo actualizar el estado.';
        if (error.response) {
            if (error.response.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response.status === 404) {
                errorMessage = "El cliente cuyo estado intenta cambiar no fue encontrado.";
            } else if (error.message) {
                errorMessage = error.message;
            }
        } else if (error.request) {
            errorMessage = "No se pudo conectar con el servidor.";
        } else {
            errorMessage = error.message || "Ocurrió un error inesperado al cambiar el estado.";
        }
        Swal.fire('Error', errorMessage, 'error');
        setLoading(false);
      }
    }
  };


  // --- Lógica de Paginación (sin cambios aparentes necesarios) ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  // Usa filteredData para paginar
  const currentItems = Array.isArray(filteredData) ? filteredData.slice(indexOfFirstItem, indexOfLastItem) : [];
  const pageNumbers = [];
  if (Array.isArray(filteredData)) {
      for (let i = 1; i <= Math.ceil(filteredData.length / itemsPerPage); i++) {
          pageNumbers.push(i);
      }
  }

  // --- Renderizado ---
  return (
    <Container>
      <h2 className="text-center mt-4">Lista de Clientes</h2>
      <br />
      <div className="d-flex justify-content-between align-items-center mb-3">
        <Input
          type="text"
          placeholder="Buscar cliente..." // Placeholder ajustado
          value={searchText}
          onChange={handleSearch}
          style={{ width: '300px' }} // Ancho ajustado
        />
        {/* Botón para abrir el MODAL de insertar */}
        <Button style={{ backgroundColor: '#2e8322', color: 'white' }} onClick={() => {
            setForm(initialFormState); // Limpia form
            setErrors({}); // Limpia errores locales
            setModalInsertar(true); // Abre modal insertar
        }}>
            Agregar Cliente
        </Button>
      </div>

      {/* Indicador de Carga */}
      {loading && (
         <div className="text-center my-5">
             <Spinner color="primary" />
             <p>Cargando...</p>
         </div>
       )}

      {/* Tabla de Datos (solo se muestra si no está cargando) */}
      {!loading && (
        <>
          <div className="table-responsive">
            {/* Ajusta las columnas y el mapeo de datos */}
            <Table className="table table-bordered table-hover text-center">
              <thead>
                <tr>
                  <th>Id</th>
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
                {currentItems.length > 0 ? currentItems.map((cliente) => (
                  // Asegúrate que los nombres de campo coinciden con el estado 'data' (formato frontend)
                  <tr key={cliente.id} style={{ backgroundColor: cliente.Estado === "Inactivo" ? "#f8f9fa" : "white" }}>
                    <td>{cliente.id}</td>
                    <td>{cliente.NombreCompleto}</td>
                    <td>{cliente.Distintivo}</td>
                    <td>{cliente.CategoriaCliente}</td>
                    <td>{cliente.Celular || '-'}</td> {/* Muestra '-' si está vacío */}
                    <td>{cliente.Correo || '-'}</td>
                    <td>{cliente.Direccion || '-'}</td>
                    <td>
                      <Button
                        color={cliente.Estado === "Activo" ? "success" : "secondary"}
                        onClick={() => cambiarEstado(cliente.id)}
                        size="sm"
                        className="me-1"
                        style={{ minWidth: '80px', color: "white", padding: '0.25rem 0.5rem' }}
                        disabled={loading}
                      >
                        {cliente.Estado}
                      </Button>
                    </td>
                    <td>
                      <Button
                        color="dark" // O el color que prefieras
                        size="sm"
                        className="me-1"
                        onClick={() => {
                            setForm(cliente); // Carga datos del cliente en el form
                            setErrors({}); // Limpia errores previos
                            setModalEditar(true); // Abre modal editar
                         }}
                         disabled={loading}
                       >
                          <FaEdit />
                      </Button>
                      <Button
                        color="danger"
                        size="sm"
                        onClick={() => eliminar(cliente)} // Llama a la función eliminar
                        disabled={loading}
                      >
                          <FaTrashAlt />
                      </Button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="9" className="text-center">No hay clientes para mostrar.</td> {/* Ajusta colSpan */}
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

      {/* --- Modales (Adaptados de Servicios.jsx) --- */}

      {/* Modal Insertar */}
      <Modal isOpen={modalInsertar} toggle={() => !loading && setModalInsertar(!modalInsertar)}>
        <ModalHeader toggle={() => !loading && setModalInsertar(!modalInsertar)} style={{ background: '#6d0f0f', color: 'white' }}>
          Agregar Cliente
        </ModalHeader>
        <ModalBody>
           {/* Campos del formulario para insertar - Usa los nombres del 'form' state */}
          <FormGroup>
            <Label for="NombreCompletoInsertar"><b>Nombre Completo:</b></Label>
            <Input id="NombreCompletoInsertar" name="NombreCompleto" type="text" onChange={handleChange} value={form.NombreCompleto} invalid={!!errors.NombreCompleto}/>
            {errors.NombreCompleto && <span className="text-danger">{errors.NombreCompleto}</span>}
          </FormGroup>
           <FormGroup>
            <Label for="DistintivoInsertar"><b>Distintivo:</b></Label>
            <Input id="DistintivoInsertar" name="Distintivo" type="text" onChange={handleChange} value={form.Distintivo} invalid={!!errors.Distintivo}/>
             {errors.Distintivo && <span className="text-danger">{errors.Distintivo}</span>}
          </FormGroup>
          <FormGroup>
            <Label for="CategoriaClienteInsertar"><b>Categoría Cliente:</b></Label>
            <Input id="CategoriaClienteInsertar" name="CategoriaCliente" type="select" onChange={handleChange} value={form.CategoriaCliente} invalid={!!errors.CategoriaCliente}>
                <option value="">Seleccione una categoría</option>
                <option value="Familiar">Familiar</option>
                <option value="Empresarial">Empresarial</option>
                <option value="Preferencial">Preferencial</option>
                <option value="Nuevo">Nuevo</option> {/* Ajusta opciones según necesites */}
            </Input>
             {errors.CategoriaCliente && <span className="text-danger">{errors.CategoriaCliente}</span>}
          </FormGroup>
           <FormGroup>
            <Label for="CelularInsertar"><b>Celular:</b></Label>
            <Input id="CelularInsertar" name="Celular" type="text" onChange={handleChange} value={form.Celular} invalid={!!errors.Celular}/>
             {errors.Celular && <span className="text-danger">{errors.Celular}</span>}
          </FormGroup>
           <FormGroup>
            <Label for="CorreoInsertar"><b>Correo:</b></Label>
            <Input id="CorreoInsertar" name="Correo" type="email" onChange={handleChange} value={form.Correo} invalid={!!errors.Correo}/>
             {errors.Correo && <span className="text-danger">{errors.Correo}</span>}
          </FormGroup>
           <FormGroup>
            <Label for="DireccionInsertar"><b>Dirección:</b></Label>
            <Input id="DireccionInsertar" name="Direccion" type="text" onChange={handleChange} value={form.Direccion} invalid={!!errors.Direccion}/>
             {errors.Direccion && <span className="text-danger">{errors.Direccion}</span>}
          </FormGroup>
          {/* No se necesita campo Estado al insertar, se asume Activo */}
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
          Editar Cliente
        </ModalHeader>
        <ModalBody>
           {/* Campos del formulario para editar - Usa los nombres del 'form' state */}
           {/* Repite la estructura de FormGroup/Label/Input del modal de insertar */}
           <FormGroup>
            <Label for="NombreCompletoEditar"><b>Nombre Completo:</b></Label>
            <Input id="NombreCompletoEditar" name="NombreCompleto" type="text" onChange={handleChange} value={form.NombreCompleto} invalid={!!errors.NombreCompleto}/>
             {errors.NombreCompleto && <span className="text-danger">{errors.NombreCompleto}</span>}
          </FormGroup>
           <FormGroup>
            <Label for="DistintivoEditar"><b>Distintivo:</b></Label>
            <Input id="DistintivoEditar" name="Distintivo" type="text" onChange={handleChange} value={form.Distintivo} invalid={!!errors.Distintivo}/>
             {errors.Distintivo && <span className="text-danger">{errors.Distintivo}</span>}
          </FormGroup>
          <FormGroup>
            <Label for="CategoriaClienteEditar"><b>Categoría Cliente:</b></Label>
            <Input id="CategoriaClienteEditar" name="CategoriaCliente" type="select" onChange={handleChange} value={form.CategoriaCliente} invalid={!!errors.CategoriaCliente}>
                 <option value="">Seleccione una categoría</option>
                 <option value="Familiar">Familiar</option>
                 <option value="Empresarial">Empresarial</option>
                 <option value="Preferencial">Preferencial</option>
                 <option value="Nuevo">Nuevo</option>
            </Input>
            {errors.CategoriaCliente && <span className="text-danger">{errors.CategoriaCliente}</span>}
          </FormGroup>
           <FormGroup>
            <Label for="CelularEditar"><b>Celular:</b></Label>
            <Input id="CelularEditar" name="Celular" type="text" onChange={handleChange} value={form.Celular} invalid={!!errors.Celular}/>
            {errors.Celular && <span className="text-danger">{errors.Celular}</span>}
          </FormGroup>
           <FormGroup>
            <Label for="CorreoEditar"><b>Correo:</b></Label>
            <Input id="CorreoEditar" name="Correo" type="email" onChange={handleChange} value={form.Correo} invalid={!!errors.Correo}/>
             {errors.Correo && <span className="text-danger">{errors.Correo}</span>}
          </FormGroup>
           <FormGroup>
            <Label for="DireccionEditar"><b>Dirección:</b></Label>
            <Input id="DireccionEditar" name="Direccion" type="text" onChange={handleChange} value={form.Direccion} invalid={!!errors.Direccion}/>
             {errors.Direccion && <span className="text-danger">{errors.Direccion}</span>}
          </FormGroup>
          {/* Opcional: Mostrar el estado pero no permitir editarlo en este modal */}
          <FormGroup>
              <Label for="estadoEditar"><b>Estado:</b></Label>
              <Input id="estadoEditar" name="Estado" type="text" value={form.Estado} readOnly disabled/>
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

// PropTypes ya no son necesarios si no se pasan props
// Clientes.propTypes = {
//   data: PropTypes.array, // Ya no se pasa como prop
// };

export default Clientes;