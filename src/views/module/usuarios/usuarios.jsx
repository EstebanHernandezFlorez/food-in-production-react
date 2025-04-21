import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "bootstrap/dist/css/bootstrap.min.css";
import toast, { Toaster } from "react-hot-toast"; 
import '../../../App.css';
import {
  Table,
  Button,
  Container,
  Row,
  Col,  
  FormGroup,
  Input,
  Modal,
  ModalHeader,
  ModalBody,  
  ModalFooter,
} from "reactstrap";
import { FaEdit, FaTrashAlt } from "react-icons/fa";
import { Snackbar, Alert } from "@mui/material";

const Usuario = () => {
  const [data, setData] = useState([]); // Inicializamos data correctamente como un array vacío
  const [form, setForm] = useState({
    id: "",
    document_type: "",
    document: "",
    cellphone: "",
    full_name: "",
    email: "",
    Rol: "",
    status: true,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [tableSearchText, setTableSearchText] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false); // Estado para el modal de edición
  const itemsPerPage = 7;

  // States for validation
  const [formErrors, setFormErrors] = useState({
    document_type: false,
    document: false,
    cellphone: false,
    full_name: false,
    email: false,
    Rol: false,
    password: false,
    Confirmarcontraseña: false,
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get("http://localhost:3000/users");
        setData(response.data); // Asumiendo que `response.data` es un array de usuarios
      } catch {
        toast.error("Error al cargar los usuarios");
      }
    };
  
    fetchUsers();
  }, []);

  const handleTableSearch = (e) =>
    setTableSearchText(e.target.value.toLowerCase());

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({
      ...prevForm,
      [name]: value,
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
      document_type: !form.document_type,
      document: !form.document,
      cellphone: !form.cellphone,
      full_name: !form.full_name,
      email: !form.email,
      Rol: !form.Rol,
      password: !form.password,
      Confirmarcontraseña: !form.Confirmarcontraseña,
    };
    setFormErrors(errors);
    return !Object.values(errors).includes(true);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      openSnackbar("Por favor, ingrese todos los campos", "warning");
      return;
    }
  
    try {
      await axios.post("http://localhost:3000/users", form);
      toast.success("Usuario agregado exitosamente");
  
      // Recargar usuarios actualizados
      const res = await axios.get("http://localhost:3000/users");
      setData(res.data);
    } catch {
      toast.error("Error al agregar el usuario");
    }
  
    // Limpiar y cerrar formulario
    setForm({
      id: "",
      document_type: "",
      document: "",
      cellphone: "",
      full_name: "",
      email: "",
      Rol: "",
      status: true,
    });
    setShowForm(false);
  };
  

  const editar = async () => {
    if (!form.document || !form.cellphone || !form.full_name || !form.email) {
      openSnackbar("Por favor, ingrese todos los campos", "warning");
      return;
    }
  
    const response = await Swal.fire({
      title: "¿Desea editar el usuario?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Editar",
      cancelButtonText: "Cancelar",
    });
  
    if (response.isConfirmed) {
      try {
        await axios.put(`http://localhost:3000/users/${form.id}`, form);
        toast.success("Usuario editado exitosamente");
  
        const res = await axios.get("http://localhost:3000/users");
        setData(res.data);
  
        setIsEditing(false);
        setModalOpen(false);
      } catch {
        toast.error("Error al editar el usuario");
      }
    }
  };
  

  const eliminar = async (dato) => {
    const response = await Swal.fire({
      title: "¿Desea eliminar el usuario?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
    });
  
    if (response.isConfirmed) {
      try {
        await axios.delete(`http://localhost:3000/users/${dato.id}`);
        toast.success("Usuario eliminado exitosamente");
  
        const res = await axios.get("http://localhost:3000/users");
        setData(res.data);
      } catch {
        toast.error("Error al eliminar el usuario");
      }
    }
  };
  

  const cambiarEstado = async (id) => {
    const response = await Swal.fire({
      title: "¿Desea cambiar el estado del usuario?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Cambiar",
      cancelButtonText: "Cancelar",
    });
  
    if (response.isConfirmed) {
      try {
        await axios.put(`http://localhost:3000/users/status/${id}`); // Asegúrate de tener esta ruta en tu backend
        toast.success("Estado actualizado correctamente");
  
        const res = await axios.get("http://localhost:3000/users");
        setData(res.data);
      } catch {
        toast.error("Error al cambiar el estado");
      }
    }
  };
  

  const filteredData = data.filter(
    (item) =>
      item.email.toLowerCase().includes(tableSearchText) ||
      item.document_type.toLowerCase().includes(tableSearchText) ||
      item.document.toString().includes(tableSearchText) ||
      item.cellphone.toLowerCase().includes(tableSearchText) ||
      item.full_name.toString().includes(tableSearchText)
  );

  const tiposDocumento = [
    { value: "CC", label: "Cédula de Ciudadanía" },
    { value: "CE", label: "Cédula de Extranjería" },
    { value: "PA", label: "Pasaporte" },
    { value: "PEP", label: "Permiso Especial de Permanencia" },
  ];
  const roles = [
    { idRole: 1, name: "Administrador", status: true },
    { idRole: 2, name: "Jefe de cocina", status: true },
    { idRole: 3, name: "Auxiliar de cocina", status: true },
  ];

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(filteredData.length / itemsPerPage); i++) {
    pageNumbers.push(i);
  }

  const validatePassword = (password) => {
    // Validar que la contraseña tenga al menos 10 caracteres, una mayúscula, una minúscula, un número y un carácter especial
    return /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10,}$/.test(
      password
    );
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;

    // Maneja el cambio tanto de la contraseña como la confirmación
    setForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));

    if (name === "password") {
      if (!validatePassword(value)) {
        setFormErrors((prevErrors) => ({
          ...prevErrors,
          password:
            "La contraseña debe contener al menos 10 caracteres, una mayúscula, una minúscula, un número y un carácter especial.",
        }));
      } else {
        setFormErrors((prevErrors) => ({
          ...prevErrors,
          password: "",
        }));
      }
    }
  };

  const handleConfirmPasswordChange = (e) => {
    const { value } = e.target;

    setForm((prevForm) => ({
      ...prevForm,
      Confirmarcontraseña: value,
    }));

    if (form.password !== value) {
      setFormErrors((prevErrors) => ({
        ...prevErrors,
        Confirmarcontraseña: "Las contraseñas no coinciden.",
      }));
    } else {
      setFormErrors((prevErrors) => ({
        ...prevErrors,
        Confirmarcontraseña: "",
      }));
    }
  };

  return (
    <Container>
      <Toaster position="top-right" />
      <br />
      {/* Mostrar la sección de búsqueda y el botón solo si no se está mostrando el formulario */}
      {!showForm && (
        <>
          <h2>Lista de Usuario</h2>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Input
              type="text"
              placeholder="Buscar usuario en la tabla"
              value={tableSearchText}
              onChange={handleTableSearch}
              style={{ width: "50%" }}
            />
            <Button
              color="success"
              onClick={() => {
                setForm({
                  id: "",
                  document_type: "",
                  document: "",
                  cellphone: "",
                  full_name: "",
                  email: "",
                  Rol: "",
                  status: true,
                });
                setIsEditing(false);
                setShowForm(true);
              }}
            >
              Agregar Usuario
            </Button>
          </div>
          <Table className="table table-sm table-hover">
            <thead>
              <tr>
                <th>id</th>
                <th>Tipo Documento</th>
                <th>Documento</th>
                <th>Celular</th>
                <th>Nombre Completo</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.document_type}</td>
                    <td>{item.document}</td>
                    <td>{item.cellphone}</td>
                    <td>{item.full_name}</td>
                    <td>{item.email}</td>
                    <td>{item.Rol}</td>
                    <td>
                      <Button
                        color={item.status ? "success" : "danger"}
                        onClick={() => cambiarEstado(item.id)}
                        className="me-2 btn-sm"
                      >
                        {item.status ? "On" : "Off"}
                      </Button>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <Button
                          color="info"
                          onClick={() => {
                            setForm(item);
                            setIsEditing(true);
                            setModalOpen(true);
                          }}
                          className="me-2 btn-sm"
                        >
                          <FaEdit />
                        </Button>
                        <Button
                          color="danger"
                          onClick={() => eliminar(item)}
                          className="me-2 btn-sm"
                        >
                          <FaTrashAlt />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="text-center">
                    No hay datos disponibles
                  </td>
                </tr>
              )}
            </tbody>
          </Table>

          <ul className="pagination">
            {pageNumbers.map((number) => (
              <li
                key={number}
                className={`page-item ${
                  currentPage === number ? "active" : ""
                }`}
              >
                <Button
                  className="page-link"
                  onClick={() => handlePageChange(number)}
                >
                  {number}
                </Button>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Formulario de inserción */}
      {showForm && (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="text-star">
              {isEditing ? "Editar usuario" : "Agregar usuario"}
            </h2>
          </div>
          <br />
          <Row>
            <Col md={4}>
              <FormGroup>
                <label style={{ fontSize: "15px", padding: "5px" }}>
                  Tipo Documento
                </label>
                <Input
                  type="select" // Cambiado a "select"
                  name="document_type"
                  value={form.document_type}
                  onChange={handleChange}
                  className={`form-control ${
                    formErrors.document_type ? "is-invalid" : ""
                  }`}
                >
                  <option value="">Seleccione un tipo de documento</option>
                  {tiposDocumento.map((tipo) => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </Input>
                {formErrors.document_type && (
                  <div className="invalid-feedback">
                    Este campo es obligatorio.
                  </div>
                )}
              </FormGroup>
            </Col>

            <Col md={4}>
              <FormGroup>
                <label style={{ fontSize: "15px", padding: "5px" }}>
                  Documento
                </label>
                <Input
                  type="text"
                  name="document"
                  value={form.document}
                  onChange={handleChange}
                  placeholder="Número de documento"
                  className={`form-control ${
                    formErrors.document ? "is-invalid" : ""
                  }`}
                />
                {formErrors.document && (
                  <div className="invalid-feedback">
                    Este campo es obligatorio.
                  </div>
                )}
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label style={{ fontSize: "15px", padding: "5px" }}>
                  Celular
                </label>
                <Input
                  type="number"
                  name="cellphone"
                  value={form.cellphone}
                  onChange={handleChange}
                  placeholder="cellphone"
                  className={`form-control ${
                    formErrors.cellphone ? "is-invalid" : ""
                  }`}
                />
                {formErrors.cellphone && (
                  <div className="invalid-feedback">
                    Este campo es obligatorio.
                  </div>
                )}
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md={4}>
              <FormGroup>
                <label style={{ fontSize: "15px", padding: "5px" }}>
                  Nombre Completo
                </label>
                <Input
                  type="text"
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  placeholder="full_name"
                  className={`form-control ${
                    formErrors.full_name ? "is-invalid" : ""
                  }`}
                />
                {formErrors.full_name && (
                  <div className="invalid-feedback">
                    Este campo es obligatorio.
                  </div>
                )}
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label style={{ fontSize: "15px", padding: "5px" }}>
                  Correo
                </label>
                <Input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Número de Correo"
                  className={`form-control ${
                    formErrors.email ? "is-invalid" : ""
                  }`}
                />
                {formErrors.email && (
                  <div className="invalid-feedback">
                    Este campo es obligatorio.
                  </div>
                )}
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label style={{ fontSize: "15px", padding: "5px" }}>Rol</label>
                <Input
                  type="select" // Cambiado a "select"
                  name="Rol"
                  value={form.Rol}
                  onChange={handleChange}
                  className={`form-control ${
                    formErrors.Rol ? "is-invalid" : ""
                  }`}
                >
                  <option value="">Seleccione un rol</option>
                  {roles.map((role) => (
                    <option key={role.idRole} value={role.idRole}>
                      {role.name}
                    </option>
                  ))}
                </Input>
                {formErrors.Rol && (
                  <div className="invalid-feedback">
                    Este campo es obligatorio.
                  </div>
                )}
              </FormGroup>
            </Col>

            <Col md={4}>
              <FormGroup>
                <label style={{ fontSize: "15px", padding: "5px" }}>
                  Contraseña
                </label>
                <Input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handlePasswordChange}
                  placeholder="password"
                  className={`form-control ${
                    formErrors.password ? "is-invalid" : ""
                  }`}
                />
                {formErrors.password && (
                  <div className="invalid-feedback">
                    {formErrors.password}
                  </div>
                )}
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label style={{ fontSize: "15px", padding: "5px" }}>
                  Confirmar contraseña
                </label>
                <Input
                  type="password"
                  name="Confirmarcontraseña"
                  value={form.Confirmarcontraseña}
                  onChange={handleConfirmPasswordChange}
                  placeholder="Confirmar contraseña"
                  className={`form-control ${
                    formErrors.Confirmarcontraseña ? "is-invalid" : ""
                  }`}
                />
                {formErrors.Confirmarcontraseña && (
                  <div className="invalid-feedback">
                    {formErrors.Confirmarcontraseña}
                  </div>
                )}
              </FormGroup>
            </Col>
          </Row>
          <div className="d-flex justify-content-star mt-3">
            <Button style={{ background: "#2e8322" }} onClick={handleSubmit}>
              {isEditing ? "Actualizar" : "Agregar"}
            </Button>

            <Button
              style={{ background: "#6d0f0f" }}
              onClick={() => {
                setShowForm(false);
                setIsEditing(false);
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Modal de edición */}
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)}>
        <ModalHeader toggle={() => setModalOpen(!modalOpen)}>
          Editar Usuario
        </ModalHeader>
        <ModalBody>
          <Row>
            <Col md={4}>
              <FormGroup>
                <label>Tipo Documento</label>
                <Input
                  type="text"
                  name="document_type"
                  readOnly
                  value={form.document_type}
                  placeholder="Tipo Documento del usuario"
                  className={`form-control ${
                    formErrors.document_type ? "is-invalid" : ""
                  }`}
                />
                {formErrors.document_type && (
                  <div className="invalid-feedback">
                    Este campo es obligatorio.
                  </div>
                )}
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label>Documento</label>
                <Input
                  type="text"
                  name="document"
                  readOnly
                  value={form.document}
                  placeholder="Número de documento"
                  className={`form-control ${
                    formErrors.document ? "is-invalid" : ""
                  }`}
                />
                {formErrors.document && (
                  <div className="invalid-feedback">
                    Este campo es obligatorio.
                  </div>
                )}
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label>Celular</label>
                <Input
                  type="text" // Corrige el typo "te" a "text"
                  name="cellphone"
                  value={form.cellphone}
                  onChange={handleChange}
                  placeholder="Número de contacto"
                  className={`form-control ${
                    formErrors.cellphone ? "is-invalid" : ""
                  }`}
                />
                {formErrors.Celular && (
                  <div className="invalid-feedback">
                    Este campo es obligatorio.
                  </div>
                )}
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md={4}>
              <FormGroup>
                <label style={{ fontSize: "15px", padding: "5px" }}>
                  Nombre Completo
                </label>
                <Input
                  type="text"
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  placeholder="Nombre Completo"
                  className={`form-control ${
                    formErrors.full_name ? "is-invalid" : ""
                  }`}
                />
                {formErrors.full_name && (
                  <div className="invalid-feedback">
                    Este campo es obligatorio.
                  </div>
                )}
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label style={{ fontSize: "15px", padding: "5px" }}>
                  Correo
                </label>
                <Input
                  type="email" // Cambiado a "email" para validación automática del formato
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Correo Electrónico"
                  className={`form-control ${
                    formErrors.email ? "is-invalid" : ""
                  }`}
                />
                {formErrors.email && (
                  <div className="invalid-feedback">
                    Este campo es obligatorio.
                  </div>
                )}
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <label style={{ fontSize: "15px", padding: "5px" }}>Rol</label>
                <Input
                  type="text"
                  name="Rol"
                  value={form.Rol}
                  readOnly
                  placeholder="Rol del usuario"
                  className={`form-control ${
                    formErrors.Rol ? "is-invalid" : ""
                  }`}
                />
                {formErrors.Rol && (
                  <div className="invalid-feedback">
                    Este campo es obligatorio.
                  </div>
                )}
              </FormGroup>
            </Col>
          </Row>
        </ModalBody>
        <ModalFooter>
          <Button color="danger" onClick={() => setModalOpen(false)}>
            Cancelar
          </Button>
          <Button color="primary" onClick={editar}>
            Actualizar
          </Button>
        </ModalFooter>
      </Modal>

      {/* Snackbar */}
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

export default Usuario;