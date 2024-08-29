import { useState } from "react";
import { Table, Button, Container, Row, Col, FormGroup, Input } from 'reactstrap';
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/16/solid";
import { Snackbar, Alert } from '@mui/material';
import FormPermissions from "./FormPermissions";

export default function RolePage() {
  const [nameRol, setNameRol] = useState([
    { id_role: 1, name: "Administrador", state: true },
    { id_role: 2, name: "Jefe de cocina", state: true },
    { id_role: 3, name: "Auxiliar de cocina", state: true },
  ]);

  const [selectedRole, setSelectedRole] = useState(null);
  const [alertMessage, setAlertMessage] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const handleDeleteRole = (roleId) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este rol?")) {
      const updatedRoles = nameRol.filter((role) => role.id_role !== roleId);
      setNameRol(updatedRoles);
      setAlertMessage("Rol eliminado exitosamente");
      setSnackbarSeverity('success');
      setShowAlert(true);
    }
  };

  const handleEditRole = (role) => {
    setSelectedRole(role);
  };

  const handleUpdateRole = (updatedRole) => {
    setNameRol((prevRoles) =>
      prevRoles.map((role) =>
        role.id_role === updatedRole.id_role ? updatedRole : role
      )
    );
    setSelectedRole(null);
  };

  const handleAddRole = (newRole) => {
    setNameRol((prevRoles) => [...prevRoles, newRole]);
  };

  const handleToggleRoleState = (roleId) => {
    setNameRol((prevRoles) =>
      prevRoles.map((role) =>
        role.id_role === roleId ? { ...role, state: !role.state } : role
      )
    );
  };

  return (
    <Container>
      <Row className="p-5">
        <Col sm="12" md="6">
          <FormGroup>
            <label htmlFor="search">Buscar:</label>
            <Input
              type="search"
              placeholder="Buscar"
              className="form-control"
              id="search"
            />
          </FormGroup>
          <Table hover responsive>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {nameRol.map((row) => (
                <tr key={row.id_role}>
                  <td>{row.name}</td>
                  <td>
                    <Button
                      color="primary"
                      onClick={() => handleEditRole(row)}
                      className="me-2"
                      disabled={!row.state}
                    >
                      <PencilSquareIcon width={20} />
                    </Button>
                    <Button
                      color="danger"
                      onClick={() => handleDeleteRole(row.id_role)}
                      disabled={!row.state}
                    >
                      <TrashIcon width={20} />
                    </Button>
                    <Button
                      color={row.state ? "success" : "secondary"}
                      onClick={() => handleToggleRoleState(row.id_role)}
                      size="sm"
                      style={{ padding: '0.375rem 0.75rem' }}
                      className="me-2"
                    >
                      {row.state ? "On" : "Off"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <FormGroup>
            <label htmlFor="role">Roles:</label>
            <Input id="role" placeholder="Administrador" className="form-control" />
          </FormGroup>
        </Col>
        <Col sm="12" md="6">
          <fieldset>
            <legend>Permisos</legend>
            <FormPermissions
              onAddRole={handleAddRole}
              onUpdateRole={handleUpdateRole}
              selectedRole={selectedRole}
              nameRol={nameRol}
            />
          </fieldset>
        </Col>
      </Row>
      <Snackbar open={showAlert} autoHideDuration={6000} onClose={() => setShowAlert(false)}>
        <Alert onClose={() => setShowAlert(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {alertMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
}
