import { useEffect, useState } from "react";
import axios from "axios";
import { Table, Button, FormGroup, Input, Container, Row, Col } from "reactstrap";
import { toast } from "react-hot-toast";

export default function FormPermissions({ selectedRole, refreshRoles, clearSelected, roles }) {
  const [permissions, setPermissions] = useState([]);
  const [privileges, setPrivileges] = useState([]);
  const [role, setRole] = useState({ name: "" });
  const [rolePrivileges, setRolePrivileges] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [permsRes, privsRes] = await Promise.all([
          axios.get("http://localhost:3000/permission"),
          axios.get("http://localhost:3000/privilege")
        ]);
        setPermissions(permsRes.data);
        setPrivileges(privsRes.data);
      } catch (error) {
        toast.error("Error al cargar permisos o privilegios");
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (selectedRole) {
      setRole({ name: selectedRole.name });
      setRolePrivileges(selectedRole.privileges || []);
    }
  }, [selectedRole]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRole({ ...role, [name]: value });
  };

  const handlePrivilegeToggle = (permId, privId) => {
    const key = `${permId}-${privId}`;
    setRolePrivileges((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!role.name.trim()) {
      toast.error("El nombre del rol es obligatorio");
      return;
    }

    if (rolePrivileges.length === 0) {
      toast.error("Seleccione al menos un permiso");
      return;
    }

    try {
      const body = {
        name: role.name,
        privileges: rolePrivileges
      };

      if (selectedRole) {
        await axios.put(`http://localhost:3000/role/${selectedRole.idRole}`, body);
        toast.success("Rol actualizado correctamente");
      } else {
        await axios.post("http://localhost:3000/role", body);
        toast.success("Rol creado correctamente");
      }

      refreshRoles();
      handleReset();
      clearSelected();
    } catch (error) {
      toast.error("Error al guardar el rol");
    }
  };

  const handleReset = () => {
    setRole({ name: "" });
    setRolePrivileges([]);
  };

  const isRoleDisabled = selectedRole && !roles.find(r => r.idRole === selectedRole.idRole)?.status;

  return (
    <Container>
      <form onSubmit={handleSubmit} onReset={handleReset}>
        <Row>
          <Col md={8}>
            <FormGroup>
              <label>Rol:</label>
              <Input
                name="name"
                value={role.name}
                onChange={handleChange}
                required
                disabled={isRoleDisabled}
              />
            </FormGroup>
          </Col>
        </Row>

        <Row>
          <Col md={12}>
            <Table hover>
              <thead>
                <tr>
                  <th>Permiso</th>
                  {privileges.map((priv) => (
                    <th key={priv.idPrivilege}>{priv.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {permissions.map((perm) => (
                  <tr key={perm.idPermission}>
                    <td>{perm.name}</td>
                    {privileges.map((priv) => {
                      const key = `${perm.idPermission}-${priv.idPrivilege}`;
                      return (
                        <td key={key}>
                          <Input
                            type="checkbox"
                            checked={rolePrivileges.includes(key)}
                            onChange={() => handlePrivilegeToggle(perm.idPermission, priv.idPrivilege)}
                            disabled={isRoleDisabled}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </Table>
          </Col>
        </Row>

        <div className="buttons">
          <Button type="submit" color="primary" disabled={isRoleDisabled}>Guardar</Button>{' '}
          <Button type="reset" color="secondary" disabled={isRoleDisabled}>Limpiar</Button>
        </div>
      </form>
    </Container>
  );
}




              
              
              
              // import { useState, useEffect } from "react";
              // import { Table, Button, FormGroup, Input, Container, Row, Col } from 'reactstrap';
              
              // export default function FormPermissions({ onAddRole, onUpdateRole, selectedRole, nameRol }) {
              //   const permissions = [
              //     { id_permission: 1, name: "Dashboard", state: true },
              //     { id_permission: 2, name: "Empleados", state: true },
              //     { id_permission: 3, name: "Mano de obra", state: true },
              //     { id_permission: 4, name: "Roles", state: true },
              //     { id_permission: 5, name: "Usuarios", state: true },
              //     { id_permission: 6, name: "Insumos", state: true },
              //     { id_permission: 7, name: "Productos", state: true },
              //     { id_permission: 8, name: "Producto insumos", state: true },
              //     { id_permission: 9, name: "Produccion", state: true },
              //     { id_permission: 10, name: "Proveedores", state: true },
              //     { id_permission: 11, name: "Servicios", state: true },
              //     { id_permission: 12, name: "Clientes", state: true },
              //     { id_permission: 13, name: "Reservas", state: true },
              //   ];
              
              //   const privileges = [
              //     { id_privilege: 1, name: "Crear" },
              //     { id_privilege: 2, name: "Inhabilitar" },
              //     { id_privilege: 3, name: "Editar" },
              //     { id_privilege: 4, name: "Eliminar" },
              //     { id_privilege: 5, name: "Cambiar estado" },
              //   ];
              
              //   const [role, setRole] = useState({ name: "" });
              //   const [rolePrivileges, setRolePrivileges] = useState([]);
              
              //   const [message, setMessage] = useState("");
              //   const [variant, setVariant] = useState("");
              //   const [showAlert, setShowAlert] = useState(false);
              
              //   useEffect(() => {
              //     if (selectedRole) {
              //       setRole({ name: selectedRole.name });
              //       setRolePrivileges(selectedRole.privileges || []);
              //     }
              //   }, [selectedRole]);
              
              //   const messages = {
              //     success: "Formulario enviado correctamente",
              //     error: "Por favor, seleccione al menos un privilegio",
              //   };
              
              //   const variants = {
              //     correct: "success",
              //     error: "danger",
              //   };
              
              //   const handleSubmit = (e) => {
              //     e.preventDefault();
              
              //     if (rolePrivileges.length === 0) {
              //       setMessage(messages.error);
              //       setVariant(variants.error);
              //       setShowAlert(true);
              //       return;
              //     }
              
              //     setMessage(messages.success);
              //     setVariant(variants.correct);
              //     setShowAlert(true);
              
              //     if (selectedRole) {
              //       onUpdateRole({ ...selectedRole, name: role.name, privileges: rolePrivileges });
              //     } else {
              //       onAddRole({ id_role: Date.now(), name: role.name, state: true, privileges: rolePrivileges });
              //     }
              
              //     setRole({ name: "" });
              //     setRolePrivileges([]);
              //   };
              
              //   const handleChangeRole = (e) => {
              //     const { name, value } = e.target;
              //     setRole({ ...role, [name]: value });
              //   };
              
              //   const handleChangePrivilege = (permissionId, privilegeId) => {
              //     const privilegeKey = `${permissionId}-${privilegeId}`;
              //     setRolePrivileges((prev) => {
              //       if (prev.includes(privilegeKey)) {
              //         return prev.filter((p) => p !== privilegeKey);
              //       } else {
              //         return [...prev, privilegeKey];
              //       }
              //     });
              //   };
              
              //   const clickAlert = () => {
              //     setShowAlert(!showAlert);
              //   };
              
              //   const handleReset = () => {
              //     setRole({ name: "" });
              //     setRolePrivileges([]);
              //   };
              
              //   const isRoleDisabled = selectedRole && !nameRol.find((r) => r.id_role === selectedRole.id_role)?.state;
              
              //   return (
              //     <Container>
              //       <form onSubmit={handleSubmit} onReset={handleReset}>
              //         <Row>
              //           <Col md={8}>
              //             <FormGroup>
              //               <label htmlFor="role">Rol:</label>
              //               <Input
              //                 className="form-control"
              //                 name="name"
              //                 value={role.name}
              //                 onChange={handleChangeRole}
              //                 required
              //                 disabled={isRoleDisabled}
              //               />
              //             </FormGroup>
              //           </Col>
              //         </Row>
              
              //         <Row>
              //           <Col md={12}>
              //             <Table className="table table-hover">
              //               <thead>
              //                 <tr>
              //                   <th>Nombre</th>
              //                   {privileges.map((privilege) => (
              //                     <th key={privilege.id_privilege}>{privilege.name}</th>
              //                   ))}
              //                 </tr>
              //               </thead>
              //               <tbody>
              //                 {permissions.map((permission) => (
              //                   <tr key={permission.id_permission}>
              //                     <td>{permission.name}</td>
              //                     {privileges.map((privilege) => (
              //                       <td key={`${permission.id_permission}-${privilege.id_privilege}`}>
              //                         <Input
              //                           className="form-check-input"
              //                           type="checkbox"
              //                           onChange={() => handleChangePrivilege(permission.id_permission, privilege.id_privilege)}
              //                           checked={rolePrivileges.includes(`${permission.id_permission}-${privilege.id_privilege}`)}
              //                           disabled={isRoleDisabled}
              //                         />
              //                       </td>
              //                     ))}
              //                   </tr>
              //                 ))}
              //               </tbody>
              //             </Table>
              //           </Col>
              //         </Row>
              
              //         <div className="buttons">
              //           <Button type="submit" color="primary" disabled={isRoleDisabled}>
              //             Guardar
              //           </Button>{' '}
              //           <Button type="reset" color="secondary" disabled={isRoleDisabled}>
              //             Limpiar
              //           </Button>
              //         </div>
              
              //         {showAlert && (
              //           <div className={`alert alert-${variant}`} role="alert">
              //             {message}
              //             <Button type="button" className="close" onClick={clickAlert}>
              //               <span>&times;</span>
              //             </Button>
              //           </div>
              //         )}
              //       </form>
              //     </Container>
              //   );
              // }
              