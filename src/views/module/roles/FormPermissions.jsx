import { useState, useEffect } from "react";
import { 
  Table, Button, FormGroup, Input, Container, Row, Col,
  Modal, ModalHeader, ModalBody, ModalFooter
} from "reactstrap";
import toast from "react-hot-toast";
import axios from "axios";

const DEFAULT_PERMISSIONS = [
  { idPermission: 1, permissionName: "Dashboard", status: true },
  { idPermission: 2, permissionName: "Roles", status: true },
  { idPermission: 3, permissionName: "Usuarios", status: true },
  { idPermission: 4, permissionName: "Proveedor", status: true },
  { idPermission: 5, permissionName: "Insumo", status: true },
  { idPermission: 6, permissionName: "Producto insumo", status: true },
  { idPermission: 7, permissionName: "Orden de produccion", status: true },
  { idPermission: 8, permissionName: "Registro compra", status: true },
  { idPermission: 9, permissionName: "Reservas", status: true },
  { idPermission: 10, permissionName: "Clientes", status: true },
  { idPermission: 11, permissionName: "Servicios", status: true },
  { idPermission: 12, permissionName: "Mano de obra", status: true }
];

const DEFAULT_PRIVILEGES = [
  { idPrivilege: 1, privilegeName: "Crear privilegio" },
  { idPrivilege: 2, privilegeName: "Eliminar privilegio" },
  { idPrivilege: 3, privilegeName: "Editar privilegio" },
  { idPrivilege: 4, privilegeName: "Inhabilitar privilegio" },
  { idPrivilege: 5, privilegeName: "Cambiar estado" }
];

export default function FormPermissions({ 
  isOpen, 
  toggle, 
  onAddRole, 
  onUpdateRole, 
  selectedRole, 
  nameRol 
}) {
  const [permissions, setPermissions] = useState(DEFAULT_PERMISSIONS);
  const [privileges, setPrivileges] = useState(DEFAULT_PRIVILEGES);
  const [role, setRole] = useState({ roleName: "" });
  const [rolePrivileges, setRolePrivileges] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (selectedRole) {
      setRole({ roleName: selectedRole.roleName });

      if (selectedRole.privileges) {
        const privilegesArray = selectedRole.privileges.map(
          privilege => `${privilege.idPermission}-${privilege.idPrivilege}`
        );
        setRolePrivileges(privilegesArray);
      } else {
        setRolePrivileges([]);
      }
    } else {
      setRole({ roleName: "" });
      setRolePrivileges([]);
    }
  }, [selectedRole, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rolePrivileges.length === 0) return toast.error("Seleccione al menos un privilegio");

    const privilegesFormatted = rolePrivileges.map((item) => {
      const [idPermission, idPrivilege] = item.split("-");
      return { idPermission: parseInt(idPermission), idPrivilege: parseInt(idPrivilege) };
    });

    const payload = {
      roleName: role.roleName,
      privileges: privilegesFormatted,
      status: true,
    };

    try {
      setIsLoading(true);
      if (selectedRole) {
        await axios.put(`http://localhost:3000/role/${selectedRole.idRole}`, payload);
        toast.success("Rol actualizado correctamente");
        onUpdateRole();
      } else {
        await axios.post("http://localhost:3000/role", payload);
        toast.success("Rol creado correctamente");
        onAddRole();
      }
      toggle();
    } catch (error) {
      console.error("Error al guardar el rol:", error.response?.data || error);
      toast.error("Error al guardar el rol");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeRole = (e) => setRole({ ...role, [e.target.name]: e.target.value });

  const handleChangePrivilege = (permissionId, privilegeId) => {
    const key = `${permissionId}-${privilegeId}`;
    setRolePrivileges((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  };

  const isRoleDisabled = selectedRole && nameRol && !nameRol.find((r) => r.idRole === selectedRole.idRole)?.status;

  const handleSelectAllForPermission = (permissionId) => {
    const allPrivilegeKeys = privileges.map(priv => `${permissionId}-${priv.idPrivilege}`);
    const allSelected = allPrivilegeKeys.every(key => rolePrivileges.includes(key));
    if (allSelected) {
      setRolePrivileges(rolePrivileges.filter(key => !key.startsWith(`${permissionId}-`)));
    } else {
      const currentKeys = new Set(rolePrivileges);
      allPrivilegeKeys.forEach(key => currentKeys.add(key));
      setRolePrivileges(Array.from(currentKeys));
    }
  };

  return (
    <Modal isOpen={isOpen} toggle={toggle} size="lg">
      <ModalHeader toggle={toggle}>
        {selectedRole ? "Editar permisos del rol" : "Asignar permisos al nuevo rol"}
      </ModalHeader>
      <ModalBody>
        <Container>
          <form id="permissionForm" onSubmit={handleSubmit}>
            <Row>
              <Col md={8}>
                <FormGroup>
                  <label htmlFor="role">Rol:</label>
                  <Input
                    className="form-control"
                    name="roleName"
                    value={role.roleName}
                    onChange={handleChangeRole}
                    required
                    disabled={isRoleDisabled}
                  />
                </FormGroup>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Permiso</th>
                      <th>Todo</th>
                      {privileges.map((priv) => (
                        <th key={priv.idPrivilege}>{priv.privilegeName}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {permissions.map((perm) => (
                      <tr key={perm.idPermission}>
                        <td>{perm.permissionName}</td>
                        <td>
                          <Input
                            className="form-check-input"
                            type="checkbox"
                            onChange={() => handleSelectAllForPermission(perm.idPermission)}
                            checked={privileges.every(priv => 
                              rolePrivileges.includes(`${perm.idPermission}-${priv.idPrivilege}`)
                            )}
                            disabled={isRoleDisabled}
                          />
                        </td>
                        {privileges.map((priv) => (
                          <td key={`${perm.idPermission}-${priv.idPrivilege}`}>
                            <Input
                              className="form-check-input"
                              type="checkbox"
                              onChange={() => handleChangePrivilege(perm.idPermission, priv.idPrivilege)}
                              checked={rolePrivileges.includes(`${perm.idPermission}-${priv.idPrivilege}`)}
                              disabled={isRoleDisabled}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Col>
            </Row>
          </form>
        </Container>
      </ModalBody>
      <ModalFooter>
        <Button 
          type="submit" 
          form="permissionForm" 
          color="primary" 
          disabled={isRoleDisabled || isLoading}
        >
          {isLoading ? 'Guardando...' : 'Guardar'}
        </Button>{' '}
        <Button color="secondary" onClick={toggle}>
          Cancelar
        </Button>
      </ModalFooter>
    </Modal>
  );
}