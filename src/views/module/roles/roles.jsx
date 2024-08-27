import React, { useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/solid";

export default function RolePage() {
    const [roles, setRoles] = useState([
        { id_role: 1, name: "Administrador", state: true },
        { id_role: 2, name: "Jefe de cocina", state: true },
        { id_role: 3, name: "Auxiliar de cocina", state: true },
    ]);

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
        { id_permission: 13, name: "Reservas", state: true }
    ];

    const privileges = [
        { id_privilege: 1, name: "Crear", id_permission: 2 },
        { id_privilege: 2, name: "Inhabilitar", id_permission: 1 },
        { id_privilege: 3, name: "Editar", id_permission: 2 },
        { id_privilege: 4, name: "Eliminar", id_permission: 2 }
    ];

    const [selectedPrivileges, setSelectedPrivileges] = useState({});

    const handlePrivilegeChange = (e, checkboxId) => {
        setSelectedPrivileges((prev) => ({
            ...prev,
            [checkboxId]: e.target.checked,
        }));
    };

    const toggleState = (id) => {
        setRoles(
            roles.map((role) =>
                role.id_role === id ? { ...role, state: !role.state } : role
            )
        );
    };

    return (
        <div className="row p-5">
            <section className="col-sm-12 col-md-6">
                <form>
                    <fieldset>
                        <legend>Roles</legend>
                        <header className="d-flex justify-content-between align-items-center mb-3">
                            <input
                                type="search"
                                placeholder="Buscar"
                                className="form-control w-50"
                            />
                            <button type="button" className="btn btn-primary ml-2">
                                Crear Rol
                            </button>
                        </header>
                        <table className="table table-striped">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th className="text-right">Acciones</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {roles.map((role) => (
                                    <tr key={role.id_role}>
                                        <td className="px-4 py-3">{role.name}</td>
                                        <td className="px-4 py-3 d-flex justify-content-end">
                                            {/* Botón Editar */}
                                            <PencilSquareIcon
                                                width={25}
                                                type="button"
                                                className="btn btn-primary mr-2"
                                            />
                                            {/* Botón Eliminar */}
                                            <TrashIcon
                                                width={25}
                                                type="button"
                                                className="btn btn-danger"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => toggleState(role.id_role)}
                                                className={`btn btn-${role.state ? "success" : "danger"}`}
                                            >
                                                {role.state ? "Activo" : "Inactivo"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </fieldset>
                </form>
            </section>

            <fieldset className="col-sm-12 col-md-6">
                <legend>Permisos</legend>
                <form>
                    <div className="form-group">
                        <label htmlFor="role">Rol:</label>
                        <input
                            className="form-control"
                            name="name"
                            placeholder="Nombre del Rol"
                            pattern="^[A-Z][a-zñ]{3,}[^\d\W_]*$"
                            required
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
            </fieldset>
        </div>
    );
}
