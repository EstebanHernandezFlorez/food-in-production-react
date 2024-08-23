// import React, { useState } from 'react';

// export default function RolePage() {
//     const permissions = [
//         // Datos de permisos
//         {
//                          id_permission: 1,
//                          name: "Dashboard",
//                          state: true,
//                      },
//                      {
//                          id_permission: 2,
//                          name: "Empleados",
//                          state: true,
//                      },
//                      {
//                          id_permission: 3,
//                          name: "Mano de obra",
//                          state: true,
//                      },
//                      {
//                          id_permission: 4,
//                          name: "Roles",
//                          state: true,
//                      },
//                      {
//                          id_permission: 5,
//                          name: "Usuarios",
//                          state: true,
//                      },
//                      {
//                          id_permission: 6,
//                          name: "Insumos",
//                          state: true,
//                      },
//                      {
//                          id_permission: 7,
//                          name: "Productos",
//                          state: true,
//                      },
//                      {
//                          id_permission: 8,
//                          name: "Producto insumos",
//                          state: true,
//                      },
//                      {
//                          id_permission: 9,
//                          name: "Produccion",
//                          state: true,
//                      },
//                      {
//                          id_permission: 10,
//                          name: "Proveedores",
//                          state: true,
//                      },
//                      {
//                          id_permission: 11,
//                          name: "Servicios",
//                          state: true,
//                      },
//                      {
//                          id_permission: 12,
//                          name: "Clientes",
//                          state: true,
//                      },
//                      {
//                          id_permission: 13,
//                          name: "Reservas",
//                          state: true,
//                      }
//     ];

//     const privileges = [
//         // Datos de privilegios
//         {
//                          id_privilege: 1,
//                          name: "Crear",
//                          id_permission: 2,
//                      },
//                      {
//                          id_privilege: 2,
//                          name: "Inhabilitar",
//                         id_permission: 1,
//                      },
//                      {
//                          id_privilege: 3,
//                          name: "Editar",
//                          id_permission: 2,
//                      },
//                      {
//                          id_privilege: 4,
//                          name: "Eliminar",
//                          id_permission: 2,
//                      }
//     ];

//     const nameRol = [
//         // Datos de roles
//         {
//                          id_role: 1,
//                          name: "Administrador",
//                          state: true,
//                      },
//                      {
//                          id_role: 2,
//                          name: "Jefe de cocina",
//                          state: true,
//                      },
//                      {
//                          id_role: 3,
//                          name: "Auxiliar de cocina",
//                          state: true,
//                      }
//     ];

//     const [selectedPrivileges, setSelectedPrivileges] = useState({});

//     const handlePrivilegeChange = (e, checkboxId) => {
//         setSelectedPrivileges((prev) => ({
//             ...prev,
//             [checkboxId]: e.target.checked,
//         }));
//     };

//     return (
//         <div className="row p-5">
//             <section className="col-sm-12 col-md-6">
//                 <form>
//                     <fieldset>
//                         <legend>Roles</legend>
//                         <header className="d-flex justify-content-between align-items-center mb-3">
//                             <input
//                                 type="search"
//                                 placeholder="Buscar"
//                                 className="form-control w-75"
//                             />
//                             <button type="button" className="btn btn-primary ml-3">
//                                 Crear Rol
//                             </button>
//                         </header>
//                         <table className="table table-striped">
//                             <thead>
//                                 <tr>
//                                     <th>Nombre</th>
//                                     <th>Acciones</th>
//                                 </tr>
//                             </thead>
//                             <tbody>
//                                 {nameRol.map((row) => (
//                                     <tr key={row.id_role}>
//                                         <td className="px-4 py-3">{row.name}</td>
//                                         <td className="px-4 py-3 d-flex">
//                                             {/* Botón Editar */}
//                                             <button type="button" className="btn btn-primary mr-2">
//                                                 <svg
//                                                     stroke="currentColor"
//                                                     fill="currentColor"
//                                                     strokeWidth="0"
//                                                     viewBox="0 0 576 512"
//                                                     height="1em"
//                                                     width="1em"
//                                                     xmlns="http://www.w3.org/2000/svg"
//                                                 >
//                                                     <path d="M402.6 83.2l90.2 90.2c3.8 3.8 3.8 10 0 13.8L274.4 405.6l-92.8 10.3c-12.4 1.4-22.9-9.1-21.5-21.5l10.3-92.8L388.8 83.2c3.8-3.8 10-3.8 13.8 0zm162-22.9l-48.8-48.8c-15.2-15.2-39.9-15.2-55.2 0l-35.4 35.4c-3.8 3.8-3.8 10 0 13.8l90.2 90.2c3.8 3.8 10 3.8 13.8 0l35.4-35.4c15.2-15.3 15.2-40 0-55.2zM384 346.2V448H64V128h229.8c3.2 0 6.2-1.3 8.5-3.5l40-40c7.6-7.6 2.2-20.5-8.5-20.5H48C21.5 64 0 85.5 0 112v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V306.2c0-10.7-12.9-16-20.5-8.5l-40 40c-2.2 2.3-3.5 5.3-3.5 8.5z"></path>
//                                                 </svg>
//                                             </button>

//                                             {/* Botón Eliminar */}
//                                             <button type="button" className="btn btn-danger">
//                                                 <svg
//                                                     stroke="currentColor"
//                                                     fill="currentColor"
//                                                     strokeWidth="0"
//                                                     viewBox="0 0 448 512"
//                                                     height="1em"
//                                                     width="1em"
//                                                     xmlns="http://www.w3.org/2000/svg"
//                                                 >
//                                                     <path d="M32 464a48 48 0 0 0 48 48h288a48 48 0 0 0 48-48V128H32zm272-256a16 16 0 0 1 32 0v224a16 16 0 0 1-32 0zm-96 0a16 16 0 0 1 32 0v224a16 16 0 0 1-32 0zm-96 0a16 16 0 0 1 32 0v224a16 16 0 0 1-32 0zM432 32H312l-9.4-18.7A24 24 0 0 0 281.1 0H166.8a23.72 23.72 0 0 0-21.4 13.3L136 32H16A16 16 0 0 0 0 48v32a16 16 0 0 0 16 16h416a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16z"></path>
//                                                 </svg>
//                                             </button>
//                                         </td>
//                                     </tr>
//                                 ))}
//                             </tbody>
//                         </table>
//                     </fieldset>
//                 </form>
//             </section>

//             <fieldset className="col-sm-12 col-md-6">
//                 <legend>Permisos</legend>

//                 <form>
//                     <div className="form-group">
//                         <label htmlFor="role">Rol:</label>
//                         <input
//                             className="form-control"
//                             name="name"
//                             placeholder="Nombre del Rol"
//                             pattern="^[A-Z][a-zñ]{3,}[^\d\W_]*$"
//                             required
//                         />
//                     </div>
//                     <table className="table table-striped">
//                         <thead>
//                             <tr>
//                                 <th>Nombre</th>
//                                 {privileges.map((privilege) => (
//                                     <th key={privilege.id_privilege}>{privilege.name}</th>
//                                 ))}
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {permissions.map((permission) => (
//                                 <tr key={permission.id_permission}>
//                                     <td className="px-4 py-3">{permission.name}</td>
//                                     {privileges.map((privilege) => {
//                                         const checkboxId = `${permission.id_permission}_${privilege.id_privilege}`;
//                                         return (
//                                             <td className="px-4 py-3" key={checkboxId}>
//                                                 <input
//                                                     className="form-check-input"
//                                                     type="checkbox"
//                                                     name={checkboxId}
//                                                     value={checkboxId}
//                                                     checked={selectedPrivileges[checkboxId] || false}
//                                                     onChange={(e) => handlePrivilegeChange(e, checkboxId)}
//                                                 />
//                                             </td>
//                                         );
//                                     })}
//                                 </tr>
//                             ))}
//                         </tbody>
//                     </table>
//                     <div className="buttons">
//                         <button type="submit" className="btn btn-primary">
//                             Guardar
//                         </button>
//                         <button type="reset" className="btn btn-primary">
//                             Limpiar
//                         </button>
//                     </div>
//                 </form>
//             </fieldset>
//         </div>
//     );
// }

import React, { useState } from "react";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/solid";
import FormPermissions from "./FormPermissions";

export default function RolePage() {
  const [roles, setRoles] = useState([
    { id_role: 1, name: "Administrador", state: true },
    { id_role: 2, name: "Jefe de cocina", state: true },
    { id_role: 3, name: "Auxiliar de cocina", state: true },
  ]);

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
                        className={`btn btn-${
                          role.state ? "success" : "danger"
                        }`}
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
        <FormPermissions />
      </fieldset>
    </div>
  );
}
