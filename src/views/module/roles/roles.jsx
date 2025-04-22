import { useEffect, useState } from "react";
import { Table, Button, Container, Row, Col, FormGroup, Input, Card, CardBody, CardHeader, Form } from "reactstrap";
import { FaEdit, FaTrashAlt, FaKey } from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";
import FormPermissions from "./FormPermissions";
import axios from "axios";

export default function RolePage() {
  const [roles, setRoles] = useState([]);
  const [newRole, setNewRole] = useState({ roleName: "", status: true });
  const [selectedRole, setSelectedRole] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const { data } = await axios.get("http://localhost:3000/role");
      setRoles(data);
    } catch (error) {
      toast.error("Error al obtener los roles");
      console.error(error);
    }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    if (!newRole.roleName.trim()) {
      return toast.error("El nombre del rol no puede estar vacío");
    }

    try {
      setIsLoading(true);
      // Crear rol básico primero
      const { data } = await axios.post("http://localhost:3000/role", {
        roleName: newRole.roleName,
        privileges: [],
        status: true
      });
      
      // Después de crear el rol, seleccionarlo para asignar permisos
      setSelectedRole(data);
      setNewRole({ roleName: "", status: true });
      toast.success("Rol creado. Ahora asigne permisos.");
      
      // Abrir modal para asignar permisos
      setModalOpen(true);
      fetchRoles();
    } catch (error) {
      toast.error("Error al crear el rol");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (window.confirm("¿Estás seguro de eliminar este rol?")) {
      try {
        await axios.delete(`http://localhost:3000/role/${roleId}`);
        toast.success("Rol eliminado exitosamente");
        fetchRoles();
      } catch (error) {
        toast.error("Error al eliminar el rol");
        console.error(error);
      }
    }
  };

  const handleToggleRoleState = async (idRole, currentState) => {
    try {
      const newState = !currentState; // Cambiar el estado al opuesto
      await axios.patch(`http://localhost:3000/role/${idRole}/status`, { status: newState });
      toast.success("Estado del rol actualizado correctamente");
      fetchRoles(); // Actualizar la lista de roles
    } catch (error) {
      console.error("Error al cambiar el estado del rol:", error.response?.data || error);
      toast.error("Error al cambiar el estado del rol");
    }
  };

  const handleEditPermissions = (role) => {
    setSelectedRole(role);
    setModalOpen(true);
  };

  const toggleModal = () => {
    setModalOpen(!modalOpen);
    if (modalOpen) {
      setSelectedRole(null);
    }
  };

  const handleRoleUpdated = () => {
    fetchRoles();
    setModalOpen(false);
    setSelectedRole(null);
  };

  const filteredRoles = roles.filter((role) =>
    role.roleName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container>
      <Toaster position="top-center" />
      
      <Row className="mt-4 mb-4">
        <Col md={12}>
          <Card>
            <CardHeader>
              <h4>Crear Nuevo Rol</h4>
            </CardHeader>
            <CardBody>
              <Form onSubmit={handleCreateRole}>
                <Row>
                  <Col md={8}>
                    <FormGroup>
                      <label htmlFor="roleName">Nombre del Rol:</label>
                      <Input
                        id="roleName"
                        value={newRole.roleName}
                        onChange={(e) => setNewRole({ ...newRole, roleName: e.target.value })}
                        placeholder="Ingrese el nombre del rol"
                        required
                      />
                    </FormGroup>
                  </Col>
                  <Col md={4} className="d-flex align-items-end">
                    <Button color="primary" type="submit" disabled={isLoading}>
                      {isLoading ? 'Creando...' : 'Crear Rol'}
                    </Button>
                  </Col>
                </Row>
              </Form>
            </CardBody>
          </Card>
        </Col>
      </Row>
      
      <Row>
        <Col md={12}>
          <Card>
            <CardHeader>
              <h4>Lista de Roles</h4>
              <FormGroup>
                <Input
                  type="search"
                  placeholder="Buscar rol..."
                  className="form-control"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </FormGroup>
            </CardHeader>
            <CardBody>
              <Table className="table table-hover">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoles.length > 0 ? (
                    filteredRoles.map((row) => (
                      <tr key={row.idRole}>
                        <td>{row.roleName}</td>
                        <td>
                          <Button
                            color={row.status ? "success" : "danger"}
                            size="sm"
                            onClick={() => handleToggleRoleState(row.idRole, row.status)}
                          >
                            {row.status ? "Activo" : "Inactivo"}
                          </Button>
                        </td>
                        <td>
                          <Button
                            color="info"
                            size="sm"
                            onClick={() => handleEditPermissions(row)}
                            className="me-2"
                            title="Asignar permisos"
                          >
                            <FaKey />
                          </Button>
                          <Button
                            color="primary"
                            size="sm"
                            onClick={() => handleEditPermissions(row)}
                            className="me-2"
                            disabled={!row.status}
                            title="Editar rol"
                          >
                            <FaEdit />
                          </Button>
                          <Button
                            color="danger"
                            size="sm"
                            onClick={() => handleDeleteRole(row.idRole)}
                            disabled={!row.status}
                            title="Eliminar rol"
                          >
                            <FaTrashAlt />
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="text-center">
                        No se encontraron roles
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Modal para asignar permisos */}
      <FormPermissions
        isOpen={modalOpen}
        toggle={toggleModal}
        onAddRole={handleRoleUpdated}
        onUpdateRole={handleRoleUpdated}
        selectedRole={selectedRole}
        nameRol={roles}
      />
    </Container>
  );
}