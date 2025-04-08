import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Table, Button, FormGroup, Input, Container, Row, Col } from "reactstrap";
import toast from "react-hot-toast";
import axios from "axios";

export default function FormPermissions({ onAddRole, onUpdateRole, selectedRole, nameRol }) {
  const [permissions, setPermissions] = useState([]);
  const [privileges, setPrivileges] = useState([]);
  const [role, setRole] = useState({ roleName: "" });
  const [rolePrivileges, setRolePrivileges] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedRole) {
      setRole({ roleName: selectedRole.roleName });
      }
    }, [selectedRole]);
 
  FormPermissions.propTypes = {
    onAddRole: PropTypes.func.isRequired,
    onUpdateRole: PropTypes.func.isRequired,
    selectedRole: PropTypes.shape({
      idRole: PropTypes.number,
      roleName: PropTypes.string,
      privileges: PropTypes.arrayOf(
        PropTypes.shape({
          idPermission: PropTypes.number,
          idPrivilege: PropTypes.number,
        })
      ),
    }),
    nameRol: PropTypes.arrayOf(
      PropTypes.shape({
        idRole: PropTypes.number.isRequired,
        status: PropTypes.bool.isRequired,
      })
    ).isRequired,
  };

  const fetchData = async () => {
    try {
      const [permRes, privRes] = await Promise.all([
        axios.get("http://localhost:3000/permission"),
        axios.get("http://localhost:3000/privilege"),
      ]);
      setPermissions(permRes.data);
      setPrivileges(privRes.data);
    } catch {
      toast.error("Error al cargar permisos o privilegios");
    }
  };

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
      setRole({ roleName: "" });
      setRolePrivileges([]);
    } catch {
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

  const handleReset = () => {
    setRole({ roleName: "" });
    setRolePrivileges([]);
  };

  const isRoleDisabled = selectedRole && !nameRol.find((r) => r.idRole === selectedRole.idRole)?.status;

  return (
    <Container>
      <form onSubmit={handleSubmit} onReset={handleReset}>
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
                  <th>Nombre</th>
                  {privileges.map((priv) => (
                    <th key={priv.idPrivilege}>{priv.privilegeName}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {permissions.map((perm) => (
                  <tr key={perm.idPermission}>
                    <td>{perm.permissionName}</td>
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

        <div className="buttons">
          <Button type="submit" color="primary" disabled={isRoleDisabled || isLoading}>
            Guardar
          </Button>{" "}
          <Button type="reset" color="secondary" disabled={isRoleDisabled || isLoading}>
            Limpiar
          </Button>
        </div>
      </form>
    </Container>
  );
}