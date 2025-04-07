import { useEffect, useState } from "react";
import axios from "axios";
import { Table, Button, Container, Row, Col, FormGroup, Input } from "reactstrap";
import { FaEdit, FaTrashAlt } from "react-icons/fa";
import { toast } from "react-hot-toast";
import FormPermissions from "./FormPermissions";

export default function RolePage() {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchRoles = async () => {
    try {
      const response = await axios.get("http://localhost:3000/role");
      setRoles(response.data);
    } catch (error) {
      toast.error("Error al obtener los roles");
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro que deseas eliminar este rol?")) {
      try {
        await axios.delete(`http://localhost:3000/role/${id}`);
        toast.success("Rol eliminado correctamente");
        fetchRoles();
      } catch (error) {
        toast.error("Error al eliminar el rol");
      }
    }
  };

  const handleToggleState = async (id, currentState) => {
    try {
      await axios.put(`http://localhost:3000/role/changeState/${id}`, { status: !currentState });
      toast.success(`Rol ${currentState ? "inactivado" : "activado"} correctamente`);
      fetchRoles();
    } catch (error) {
      toast.error("Error al cambiar estado del rol");
    }
  };

  const handleEdit = (role) => {
    setSelectedRole(role);
  };

  const filteredRoles = roles.filter((role) => 
    role.name && typeof role.name === "string" && role.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  

  return (
    <Container>
      <Row className="p-5">
        <Col md={6}>
          <FormGroup>
            <label htmlFor="search">Buscar:</label>
            <Input
              id="search"
              type="search"
              placeholder="Buscar"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </FormGroup>

          <Table hover>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredRoles.length > 0 ? (
                filteredRoles.map((role) => (
                  <tr key={role.idRole}>
                    <td>{role.name}</td>
                    <td>
                      <Button
                        color={role.status ? "success" : "danger"}
                        size="sm"
                        onClick={() => handleToggleState(role.idRole, role.status)}
                      >
                        {role.status ? "Activo" : "Inactivo"}
                      </Button>
                    </td>
                    <td>
                      <Button
                        color="primary"
                        size="sm"
                        className="me-2"
                        onClick={() => handleEdit(role)}
                        disabled={!role.status}
                      >
                        <FaEdit />
                      </Button>
                      <Button
                        color="danger"
                        size="sm"
                        onClick={() => handleDelete(role.idRole)}
                        disabled={!role.status}
                      >
                        <FaTrashAlt />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="text-center">No se encontraron roles</td>
                </tr>
              )}
            </tbody>
          </Table>
        </Col>

        <Col md={6}>
          <fieldset>
            <legend>Permisos</legend>
            <FormPermissions
              selectedRole={selectedRole}
              refreshRoles={fetchRoles}
              clearSelected={() => setSelectedRole(null)}
              roles={roles}
            />
          </fieldset>
        </Col>
      </Row>
    </Container>
  );
}


  
  // import { useState } from "react";
  // import { Table, Button, Container, Row, Col, FormGroup, Input } from 'reactstrap';
  // import { Snackbar, Alert } from '@mui/material';
  // import { FaEdit, FaTrashAlt } from 'react-icons/fa';
  // import FormPermissions from "./FormPermissions";
  
  // export default function RolePage() {
  //   const [nameRol, setNameRol] = useState([
  //     { id_role: 1, name: "Administrador", state: true },
  //     { id_role: 2, name: "Jefe de cocina", state: true },
  //     { id_role: 3, name: "Auxiliar de cocina", state: true },
  //   ]);
  
  //   const [selectedRole, setSelectedRole] = useState(null);
  //   const [alertMessage, setAlertMessage] = useState("");
  //   const [showAlert, setShowAlert] = useState(false);
  //   const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  //   const [searchTerm, setSearchTerm] = useState("");
  
  //   const handleDeleteRole = (roleId) => {
  //     if (window.confirm("¿Estás seguro de que deseas eliminar este rol?")) {
  //       const updatedRoles = nameRol.filter((role) => role.id_role !== roleId);
  //       setNameRol(updatedRoles);
  //       setAlertMessage("Rol eliminado exitosamente");
  //       setSnackbarSeverity('success');
  //       setShowAlert(true);
  //     }
  //   };
  
  //   const handleEditRole = (role) => {
  //     setSelectedRole(role);
  //   };
  
  //   const handleUpdateRole = (updatedRole) => {
  //     setNameRol((prevRoles) =>
  //       prevRoles.map((role) =>
  //         role.id_role === updatedRole.id_role ? updatedRole : role
  //       )
  //     );
  //     setSelectedRole(null);
  //   };
  
  //   const handleAddRole = (newRole) => {
  //     setNameRol((prevRoles) => [...prevRoles, newRole]);
  //   };
  
  //   const handleToggleRoleState = (roleId) => {
  //     setNameRol((prevRoles) =>
  //       prevRoles.map((role) =>
  //         role.id_role === roleId ? { ...role, state: !role.state } : role
  //       )
  //     );
  //   };
  
  //   // Filtrar roles según el término de búsqueda
  //   const filteredRoles = nameRol.filter((role) =>
  //     role.name.toLowerCase().includes(searchTerm.toLowerCase())
  //   );
  
  //   return (
  //     <Container>
  //       <Row className="p-5">
  //         <Col sm="12" md="6">
  //           <FormGroup>
  //             <label htmlFor="search">Buscar:</label>
  //             <Input
  //               type="search"
  //               placeholder="Buscar"
  //               className="form-control"
  //               id="search"
  //               value={searchTerm}
  //               onChange={(e) => setSearchTerm(e.target.value)}
  //             />
  //           </FormGroup>
  
  //           {/* Tabla de Roles (reemplazada con la estructura de Insumos) */}
  //           <Table className="table table-hover">
  //             <thead>
  //               <tr>
  //                 <th>Nombre</th>
  //                 <th>Estado</th>
  //                 <th>Acciones</th>
  //               </tr>
  //             </thead>
  //             <tbody>
  //               {filteredRoles.length > 0 ? (
  //                 filteredRoles.map((row) => (
  //                   <tr key={row.id_role}>
  //                     <td>{row.name}</td>
  //                     <td>
  //                       <Button
  //                         color={row.state ? "success" : "danger"}
  //                         size="sm"
  //                         onClick={() => handleToggleRoleState(row.id_role)}
  //                       >
  //                         {row.state ? "Activo" : "Inactivo"}
  //                       </Button>
  //                     </td>
  //                     <td>
  //                       <Button
  //                         color="primary"
  //                         size="sm"
  //                         onClick={() => handleEditRole(row)}
  //                         className="me-2"
  //                         disabled={!row.state}
  //                       >
  //                         <FaEdit />
  //                       </Button>
  //                       <Button
  //                         color="danger"
  //                         size="sm"
  //                         onClick={() => handleDeleteRole(row.id_role)}
  //                         disabled={!row.state}
  //                       >
  //                         <FaTrashAlt />
  //                       </Button>
  //                     </td>
  //                   </tr>
  //                 ))
  //               ) : (
  //                 <tr>
  //                   <td colSpan="3" className="text-center">No se encontraron roles</td>
  //                 </tr>
  //               )}
  //             </tbody>
  //           </Table>
  //         </Col>
  
  //         <Col sm="12" md="6">
  //           <fieldset>
  //             <legend>Permisos</legend>
  //             <FormPermissions
  //               onAddRole={handleAddRole}
  //               onUpdateRole={handleUpdateRole}
  //               selectedRole={selectedRole}
  //               nameRol={nameRol}
  //             />
  //           </fieldset>
  //         </Col>
  //       </Row>
  
  //       <Snackbar open={showAlert} autoHideDuration={6000} onClose={() => setShowAlert(false)}>
  //         <Alert onClose={() => setShowAlert(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
  //           {alertMessage}
  //         </Alert>
  //       </Snackbar>
  //     </Container>
  //   );
  // }