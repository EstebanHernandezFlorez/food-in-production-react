import { useEffect, useState } from "react";
import { Table, Button, Container, Row, Col, FormGroup, Input } from "reactstrap";
import { FaEdit, FaTrashAlt } from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";
import FormPermissions from "./FormPermissions";
import axios from "axios";

export default function RolePage() {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const { data } = await axios.get("http://localhost:3000/role");
      setRoles(data);
    } catch {
      toast.error("Error al obtener los roles");
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (window.confirm("¿Estás seguro de eliminar este rol?")) {
      try {
        await axios.delete(`http://localhost:3000/role/${roleId}`);
        toast.success("Rol eliminado exitosamente");
        fetchRoles();
      } catch {
        toast.error("Error al eliminar el rol");
      }
    }
  };

  const handleToggleRoleState = async (roleId) => {
    try {
      await axios.patch(`http://localhost:3000/role/${roleId}/status`);
      toast.success("Estado actualizado");
      fetchRoles();
    } catch {
      toast.error("Error al cambiar estado");
    }
  };

  const handleEditRole = (role) => setSelectedRole(role);

  const handleUpdateRole = () => {
    fetchRoles();
    setSelectedRole(null);
  };

  const handleAddRole = () => fetchRoles();

  const filteredRoles = roles.filter((role) =>
    role.roleName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container>
      <Toaster position="top-center" />
      <Row className="p-5">
        <Col sm="12" md="6">
          <FormGroup>
            <label htmlFor="search">Buscar:</label>
            <Input
              type="search"
              placeholder="Buscar"
              className="form-control"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </FormGroup>

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
                        onClick={() => handleToggleRoleState(row.idRole)}
                      >
                        {row.status ? "Activo" : "Inactivo"}
                      </Button>
                    </td>
                    <td>
                      <Button
                        color="primary"
                        size="sm"
                        onClick={() => handleEditRole(row)}
                        className="me-2"
                        disabled={!row.status}
                      >
                        <FaEdit />
                      </Button>
                      <Button
                        color="danger"
                        size="sm"
                        onClick={() => handleDeleteRole(row.idRole)}
                        disabled={!row.status}
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
        </Col>

        <Col sm="12" md="6">
          <fieldset>
            <legend>Permisos</legend>
            <FormPermissions
              onAddRole={handleAddRole}
              onUpdateRole={handleUpdateRole}
              selectedRole={selectedRole}
              nameRol={roles}
            />
          </fieldset>
        </Col>
      </Row>
    </Container>
  );
}