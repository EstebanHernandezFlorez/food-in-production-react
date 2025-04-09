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
  const [newPermission, setNewPermission] = useState(""); // Estado para el nuevo permiso
  const [newPrivilege, setNewPrivilege] = useState(""); // Estado para el nuevo privilegio
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedRole) {
      setRole({ roleName: selectedRole.roleName });
    }
  }, [selectedRole]);

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

  const handleAddPermission = async () => {
    if (!newPermission.trim()) return toast.error("El nombre del permiso no puede estar vacío");
    try {
      const { data } = await axios.post("http://localhost:3000/permission", {
        permissionName: newPermission,
        status: true, // Enviar el estado como booleano
      });
      setPermissions([...permissions, data]);
      setNewPermission("");
      toast.success("Permiso creado correctamente");
    } catch (error) {
      console.error("Error al crear el permiso:", error); // Muestra el error en la consola
      toast.error("Error al crear el permiso");
    }
  };

  const handleAddPrivilege = async () => {
    if (!newPrivilege.trim()) return toast.error("El nombre del privilegio no puede estar vacío");
    try {
      const { data } = await axios.post("http://localhost:3000/privilege", { privilegeName: newPrivilege });
      setPrivileges([...privileges, data]);
      setNewPrivilege("");
      toast.success("Privilegio creado correctamente");
    } catch {
      toast.error("Error al crear el privilegio");
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
      status: true, // Agregar el campo status como booleano
    };

    console.log("Datos enviados al backend:", payload); // Verifica los datos enviados

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
    } catch (error) {
      console.error("Error al guardar el rol:", error.response?.data || error); // Muestra el error en la consola
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

      <Row className="mt-4">
        <Col md={6}>
          <FormGroup>
            <label htmlFor="newPermission">Nuevo Permiso:</label>
            <Input
              type="text"
              id="newPermission"
              value={newPermission}
              onChange={(e) => setNewPermission(e.target.value)}
            />
            <Button color="success" className="mt-2" onClick={handleAddPermission}>
              Agregar Permiso
            </Button>
          </FormGroup>
        </Col>
        <Col md={6}>
          <FormGroup>
            <label htmlFor="newPrivilege">Nuevo Privilegio:</label>
            <Input
              type="text"
              id="newPrivilege"
              value={newPrivilege}
              onChange={(e) => setNewPrivilege(e.target.value)}
            />
            <Button color="success" className="mt-2" onClick={handleAddPrivilege}>
              Agregar Privilegio
            </Button>
          </FormGroup>
        </Col>
      </Row>
    </Container>
  );
}