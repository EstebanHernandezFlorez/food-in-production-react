import React, { useState } from "react";

export default function FormPermissions() {
  const [validated, setValidated] = useState(false);
  const permissions = [
    { id_permission: 1, name: "Dashboard", state: true },
    { id_permission: 2, name: "Empleados", state: true },
    { id_permission: 3, name: "Mano de obra", state: true },
    { id_permission: 4, name: "Roles", state: true },
    { id_permission: 5, name: "Usuarios", state: true },
    { id_permission: 6, name: "Insumos", state: true },
    { id_permission: 7, name: "Productos", state: true },
    { id_permission: 8, name: "Producto insumos", state: true },
    { id_permission: 9, name: "Producción", state: true },
    { id_permission: 10, name: "Proveedores", state: true },
    { id_permission: 11, name: "Servicios", state: true },
    { id_permission: 12, name: "Clientes", state: true },
    { id_permission: 13, name: "Reservas", state: true },
  ];

  const privileges = [
    { id_privilege: 1, name: "Crear", id_permission: 2 },
    { id_privilege: 2, name: "Inhabilitar", id_permission: 1 },
    { id_privilege: 3, name: "Editar", id_permission: 2 },
    { id_privilege: 4, name: "Eliminar", id_permission: 2 },
  ];

  const [selectedPrivileges, setSelectedPrivileges] = useState({});

  const handlePrivilegeChange = (e, checkboxId) => {
    setSelectedPrivileges((prev) => ({
      ...prev,
      [checkboxId]: e.target.checked,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!e.currentTarget.checkValidity()) {
      e.stopPropagation();
    }

    setValidated(true);
  };

  return (
    <form noValidate validated={validated} onSubmit={handleSubmit}>
      <div className="form-group my-5">
        <label htmlFor="role">Rol:</label>
        <input
          className="form-control"
          name="name"
          placeholder="Nombre del Rol"
          pattern="^[A-Z][a-zñ]{3,}[^\d\W_]*$"
          required
        />
        <small className="valid-feedback">Todo bien!</small>
        <small className="invalid-feedback">Campo obligatorio</small>
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
              {privileges.map((privilege) => {
                const checkboxId = `${permission.id_permission}_${privilege.id_privilege}`;
                return (
                  <td className="px-4 py-3" key={checkboxId}>
                    <input
                      className="form-check-input"
                      type="checkbox"
                      name={checkboxId}
                      value={checkboxId}
                      checked={selectedPrivileges[checkboxId] || false}
                      onChange={(e) => handlePrivilegeChange(e, checkboxId)}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="buttons">
        <button type="submit" className="btn btn-primary">
          Guardar
        </button>
        <button type="reset" className="btn btn-primary">
          Limpiar
        </button>
      </div>
    </form>
  );
}
