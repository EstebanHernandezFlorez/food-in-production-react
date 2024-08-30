            import { useState, useEffect } from "react";

            export default function FormPermissions({ onAddRole, onUpdateRole, selectedRole, nameRol }) {
              const permissions = [
                { id_permission: 1, name: "Dashboard", state: true },
                { id_permission: 2, name: "Empleados", state: true },
                { id_permission: 3, name: "Mano de obra", state: true },
                { id_permission: 4, name: "Roles", state: true },
                { id_permission: 5, name: "Usuarios", state: true },
                { id_permission: 6, name: "Insumos", state: true },
                { id_permission: 7, name: "Productos", state: true },
                { id_permission: 8, name: "Producto insumos", state: true },
                { id_permission: 9, name: "Produccion", state: true },
                { id_permission: 10, name: "Proveedores", state: true },
                { id_permission: 11, name: "Servicios", state: true },
                { id_permission: 12, name: "Clientes", state: true },
                { id_permission: 13, name: "Reservas", state: true },
              ];
            
              const privileges = [
                { id_privilege: 1, name: "Crear" },
                { id_privilege: 2, name: "Inhabilitar" },
                { id_privilege: 3, name: "Editar" },
                { id_privilege: 4, name: "Eliminar" },
                { id_privilege: 5, name: "Cambiar estado" },
              ];
            
              const [role, setRole] = useState({ name: "" });
              const [rolePrivileges, setRolePrivileges] = useState([]);
            
              const [message, setMessage] = useState("");
              const [variant, setVariant] = useState("");
              const [showAlert, setShowAlert] = useState(false);
            
              useEffect(() => {
                if (selectedRole) {
                  setRole({ name: selectedRole.name });
                  setRolePrivileges(selectedRole.privileges || []);
                }
              }, [selectedRole]);
            
              const messages = {
                success: "Formulario enviado correctamente",
                error: "Por favor, seleccione al menos un privilegio",
              };
            
              const variants = {
                correct: "success",
                error: "danger",
              };
            
              const handleSubmit = (e) => {
                e.preventDefault();
            
                if (rolePrivileges.length === 0) {
                  setMessage(messages.error);
                  setVariant(variants.error);
                  setShowAlert(true);
                  return;
                }
            
                setMessage(messages.success);
                setVariant(variants.correct);
                setShowAlert(true);
            
                if (selectedRole) {
                  onUpdateRole({ ...selectedRole, name: role.name, privileges: rolePrivileges });
                } else {
                  onAddRole({ id_role: Date.now(), name: role.name, state: true, privileges: rolePrivileges });
                }
            
                setRole({ name: "" });
                setRolePrivileges([]);
              };
            
              const handleChangeRole = (e) => {
                const { name, value } = e.target;
                setRole({ ...role, [name]: value });
              };
            
              const handleChangePrivilege = (permissionId, privilegeId) => {
                const privilegeKey = `${permissionId}-${privilegeId}`;
                setRolePrivileges((prev) => {
                  if (prev.includes(privilegeKey)) {
                    return prev.filter(p => p !== privilegeKey);
                  } else {
                    return [...prev, privilegeKey];
                  }
                });
              };
            
              const clickAlert = () => {
                setShowAlert(!showAlert);
              };
            
              const handleReset = () => {
                setRole({ name: "" });
                setRolePrivileges([]);
              };
            
              const isRoleDisabled = selectedRole && !nameRol.find(r => r.id_role === selectedRole.id_role)?.state;
            
              return (
                <form onSubmit={handleSubmit} onReset={handleReset}>
                  <div className="form-group">
                    <label htmlFor="role">Rol:</label>
                    <input
                      className="form-control"
                      name="name"
                      value={role.name}
                      onChange={handleChangeRole}
                      required
                      disabled={isRoleDisabled}
                    />
                  </div>
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        {privileges.map((privilege) => (
                          <th key={privilege.id_privilege}>{privilege.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {permissions.map((permission) => (
                        <tr key={permission.id_permission}>
                          <td className="px-4 py-3">{permission.name}</td>
                          {privileges.map((privilege) => (
                            <td key={`${permission.id_permission}-${privilege.id_privilege}`}>
                              <input
                                className="form-check-input"
                                type="checkbox"
                                onChange={() => handleChangePrivilege(permission.id_permission, privilege.id_privilege)}
                                checked={rolePrivileges.includes(`${permission.id_permission}-${privilege.id_privilege}`)}
                                disabled={isRoleDisabled}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="buttons">
                    <button type="submit" className="btn btn-primary" disabled={isRoleDisabled}>
                      Guardar
                    </button>
                    <button type="reset" className="btn btn-secondary" disabled={isRoleDisabled}>
                      Limpiar
                    </button>
                  </div>
                  {showAlert && (
                    <div className={`alert alert-${variant}`} role="alert">
                      {message}
                      <button type="button" className="close" onClick={clickAlert}>
                        <span>&times;</span>
                      </button>
                    </div>
                  )}
                </form>
              );
            }            