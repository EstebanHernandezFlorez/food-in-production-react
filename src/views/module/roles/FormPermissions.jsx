// src/components/permissions/FormPermissions.jsx (o ruta similar)

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Table, Button, FormGroup, Input, Container, Row, Col, Label,
  Modal, ModalHeader, ModalBody, ModalFooter, Spinner, Alert
} from "reactstrap"; // O tu librería UI (ej: antd)
import toast from "react-hot-toast";

// --- Service Imports (Ajusta rutas) ---
import roleService from '../../services/roleServices';
import permissionService from '../../services/permissionService';
import privilegeService from '../../services/privilegeService';

// --- Constants ---
const LOG_PREFIX = "[FormPermissions]";

// --- Component ---
export default function FormPermissions({
  isOpen,      // Booleano para controlar la visibilidad del modal
  toggle,      // Función para cerrar el modal
  selectedRole, // Objeto del rol a editar (null o undefined si es nuevo)
  onSave,      // Callback opcional a llamar después de guardar exitosamente
}) {
  // --- State ---
  const [roleName, setRoleName] = useState(""); // Nombre del rol (para creación/edición)
  // Guardamos los datos crudos de permisos (módulos) y privilegios del backend
  const [backendPermissions, setBackendPermissions] = useState([]);
  const [backendPrivileges, setBackendPrivileges] = useState([]);
  // Set para guardar las asignaciones seleccionadas (formato 'moduloKey-privilegeKey')
  const [assignments, setAssignments] = useState(new Set());
  const [loadingData, setLoadingData] = useState(false); // Estado de carga inicial
  const [saving, setSaving] = useState(false); // Estado de guardado
  const [error, setError] = useState(null); // Para mostrar errores generales

  // --- Derived State & Memoization ---
  // Determina si estamos editando un rol existente basado en si selectedRole tiene un ID
  const isEditingExistingRole = useMemo(() => !!selectedRole?.idRole, [selectedRole]);
  // Determina si el rol que se está editando está inactivo (para deshabilitar cambios)
  const isRoleInactive = useMemo(() => isEditingExistingRole && !selectedRole?.status, [isEditingExistingRole, selectedRole]);

  // Transforma los datos crudos del backend (backendPermissions, backendPrivileges)
  // en estructuras útiles para la UI y el procesamiento (mapas y listas ordenadas)
  // Se recalcula solo si los datos crudos cambian.
  const {
    permissionMap,       // Map: permissionKey -> idPermission
    privilegeMap,        // Map: privilegeKey -> idPrivilege
    permissionIdToKeyMap,// Map: idPermission -> permissionKey (para mapeo inverso si es necesario)
    privilegeIdToKeyMap, // Map: idPrivilege -> privilegeKey (para mapeo inverso si es necesario)
    displayableModules,  // Array: [{ key, name, idPermission }, ...] para renderizar la tabla
    displayablePrivileges// Array: [{ key, name, idPrivilege }, ...] para renderizar la tabla
  } = useMemo(() => {
    console.log(`${LOG_PREFIX} Recalculating maps and displayable items...`);
    const pMap = {}; const pIdToKey = {}; const modules = [];
    const privMap = {}; const privIdToKey = {}; const privileges = [];

    // Procesa Permisos (Módulos) del backend
    if (Array.isArray(backendPermissions)) {
      backendPermissions.forEach(perm => {
        // Valida que el permiso tenga los datos necesarios (ID numérico y clave string)
        if (perm && typeof perm.idPermission === 'number' && perm.permissionKey && typeof perm.permissionKey === 'string') {
          const moduleKey = perm.permissionKey;
          // Usa el nombre proporcionado, o el nombre clave, o la clave como último recurso
          const moduleName = perm.name || perm.permissionName || moduleKey;

          pMap[moduleKey] = perm.idPermission; // Mapa clave -> ID
          pIdToKey[perm.idPermission] = moduleKey; // Mapa ID -> clave
          modules.push({ // Objeto para mostrar en la UI
            key: moduleKey,
            name: moduleName,
            idPermission: perm.idPermission
          });
        } else {
          console.warn(`${LOG_PREFIX} Invalid permission data skipped:`, perm);
        }
      });
    }

    // Procesa Privilegios del backend
    if (Array.isArray(backendPrivileges)) {
      backendPrivileges.forEach(priv => {
        // Valida que el privilegio tenga los datos necesarios
        if (priv && typeof priv.idPrivilege === 'number' && priv.privilegeKey && typeof priv.privilegeKey === 'string') {
          const privilegeKey = priv.privilegeKey;
          const privilegeName = priv.name || priv.privilegeName || privilegeKey;

          privMap[privilegeKey] = priv.idPrivilege; // Mapa clave -> ID
          privIdToKey[priv.idPrivilege] = privilegeKey; // Mapa ID -> clave
          privileges.push({ // Objeto para mostrar en la UI
            key: privilegeKey,
            name: privilegeName,
            idPrivilege: priv.idPrivilege
          });
        } else {
           console.warn(`${LOG_PREFIX} Invalid privilege data skipped:`, priv);
        }
      });
    }

    // Ordenar alfabéticamente para una presentación consistente
    modules.sort((a, b) => a.name.localeCompare(b.name));
    // Podrías tener un orden personalizado para privilegios (ej: view, create, edit, delete...)
    privileges.sort((a, b) => a.name.localeCompare(b.name)); // Orden alfabético por ahora

    console.log(`${LOG_PREFIX} Generated Maps:`, { pMap, privMap, pIdToKey, privIdToKey });
    console.log(`${LOG_PREFIX} Generated Displayable Items:`, { modules, privileges });

    return {
      permissionMap: pMap,
      privilegeMap: privMap,
      permissionIdToKeyMap: pIdToKey,
      privilegeIdToKeyMap: privIdToKey,
      displayableModules: modules,
      displayablePrivileges: privileges
    };
  }, [backendPermissions, backendPrivileges]); // Dependencias: recalcular solo si cambian los datos base


  // --- Effect: Carga de Datos Iniciales y Mapeo de Asignaciones Existentes ---
   useEffect(() => {
    // No ejecutar si el modal no está abierto
    if (!isOpen) return;

    // AbortController para cancelar peticiones si el componente se desmonta o el modal se cierra
    const controller = new AbortController();
    const signal = controller.signal;

    // Resetea estados al abrir/cambiar de rol
    setError(null);
    setAssignments(new Set()); // Limpiar asignaciones previas
    setRoleName(isEditingExistingRole ? selectedRole.roleName : "");
    setLoadingData(true);
    // Limpiar datos crudos fuerza la actualización de useMemo
    setBackendPermissions([]);
    setBackendPrivileges([]);

    // Función async para cargar y procesar datos
    const loadAndProcessData = async () => {
      let loadedPerms = [];
      let loadedPrivs = [];
      let assignmentsFromBackend = [];

      try {
        // Paso 1: Cargar permisos (módulos) y privilegios base en paralelo
        // Asegurarse de que devuelvan array vacío en caso de error o dato inválido
        [loadedPerms, loadedPrivs] = await Promise.all([
          permissionService.getAll(/* { signal } */).then(data => Array.isArray(data) ? data : []).catch(err => { console.error("Error loading permissions:", err); return []; }),
          privilegeService.getAll(/* { signal } */).then(data => Array.isArray(data) ? data : []).catch(err => { console.error("Error loading privileges:", err); return []; })
        ]);
        // Si el componente se desmontó mientras cargaba, no continuar
        if (signal.aborted) return;

        // Actualiza estado con los datos crudos para que useMemo genere los mapas
        setBackendPermissions(loadedPerms);
        setBackendPrivileges(loadedPrivs);

        // Paso 2: Si estamos editando un rol existente, cargar sus asignaciones actuales
        if (isEditingExistingRole && selectedRole?.idRole) {
          console.log(`${LOG_PREFIX} Editing role ID: ${selectedRole.idRole}. Fetching existing assignments...`);
          try {
            const result = await roleService.getRolePrivilegesByIds(selectedRole.idRole /*, { signal } */);
             if (signal.aborted) return;
             // Verifica que la respuesta sea un array
             if (Array.isArray(result)) {
               assignmentsFromBackend = result;
               console.log(`${LOG_PREFIX} Existing assignments loaded:`, assignmentsFromBackend);
             } else {
               console.warn(`${LOG_PREFIX} Received unexpected data format for existing assignments. Expected array. Got:`, result);
               toast.error("Error al cargar asignaciones existentes.");
             }
          } catch (assignErr) {
             if (signal.aborted) return;
             console.error(`${LOG_PREFIX} Error loading existing assignments for role ${selectedRole.idRole}:`, assignErr);
             toast.error("Error al cargar asignaciones existentes.");
             // Continuar sin asignaciones previas marcadas
          }
        }

        // Paso 3: Mapear las asignaciones existentes (si las hay) al formato del Set ('moduloKey-privilegeKey')
        // Usamos mapas temporales recalculados aquí para asegurar que se usan los datos recién cargados,
        // evitando problemas de timing con la actualización de estado y useMemo.
        const tempPIdToKey = {};
        loadedPerms.forEach(p => {
           if (p && typeof p.idPermission === 'number' && p.permissionKey) tempPIdToKey[p.idPermission] = p.permissionKey;
        });
        const tempPrivIdToKey = {};
        loadedPrivs.forEach(p => {
          if (p && typeof p.idPrivilege === 'number' && p.privilegeKey) tempPrivIdToKey[p.idPrivilege] = p.privilegeKey;
        });

        const initialAssignments = new Set();
        if (assignmentsFromBackend.length > 0) {
           console.log(`${LOG_PREFIX} Mapping assignments from backend data using temp maps...`);
           assignmentsFromBackend.forEach(assignment => {
              // Busca las claves string correspondientes a los IDs recibidos
              const moduleKey = tempPIdToKey[assignment.idPermission];
              const privilegeKey = tempPrivIdToKey[assignment.idPrivilege];
              // Si se encontraron ambas claves, construye el string y añádelo al Set
              if (moduleKey && privilegeKey) {
                const assignmentKey = `${moduleKey}-${privilegeKey}`;
                initialAssignments.add(assignmentKey);
                // console.log(`${LOG_PREFIX} Mapped backend assignment: ${assignmentKey}`);
              } else {
                 // Advierte si no se pudo mapear una asignación (quizás el permiso/privilegio fue eliminado)
                 console.warn(`${LOG_PREFIX} Could not map existing assignment from backend IDs (maybe deprecated?): ID_P:${assignment.idPermission}, ID_Priv:${assignment.idPrivilege}`);
              }
           });
           console.log(`${LOG_PREFIX} Initial assignments set from backend:`, initialAssignments);
        }
        // Actualiza el estado 'assignments' con las encontradas
        setAssignments(initialAssignments);

      } catch (err) {
         // Ignora errores si fueron por cancelación (AbortError)
         if (err.name !== 'AbortError' && !signal.aborted) {
            console.error(`${LOG_PREFIX} Error loading data:`, err.response?.data || err.message || err);
            setError("Error crítico al cargar datos de configuración. Intente cerrar y abrir de nuevo.");
            toast.error("Error crítico al cargar configuración.");
            // Limpia todo en caso de error grave
            setBackendPermissions([]);
            setBackendPrivileges([]);
            setAssignments(new Set());
         }
      } finally {
        // Solo quita el estado de carga si no se abortó la operación
        if (!signal.aborted) {
          setLoadingData(false);
        }
      }
    };

    // Llama a la función para cargar y procesar
    loadAndProcessData();

    // Función de limpieza: se ejecuta cuando el componente se desmonta o las dependencias cambian
    return () => {
      console.log(`${LOG_PREFIX} Cleaning up load effect, aborting fetch.`);
      controller.abort(); // Cancela cualquier petición en curso
    };
  // Dependencias: Ejecutar este efecto si cambia el estado 'isOpen' o el ID del rol seleccionado
  }, [isOpen, selectedRole?.idRole, isEditingExistingRole]);


  // --- Event Handlers ---

  // Maneja el cambio de estado de un checkbox individual
  const handleAssignmentChange = useCallback((moduleKey, privilegeKey, isChecked) => {
    setAssignments(prev => {
      const newAssignments = new Set(prev); // Copia el Set actual
      const key = `${moduleKey}-${privilegeKey}`; // Construye la clave combinada
      if (isChecked) {
        newAssignments.add(key); // Añade la clave si se marcó
      } else {
        newAssignments.delete(key); // Elimina la clave si se desmarcó
      }
      // console.log(`${LOG_PREFIX} Assignment change: ${key} -> ${isChecked}. New set:`, newAssignments);
      return newAssignments; // Devuelve el nuevo Set para actualizar el estado
    });
  }, []); // No tiene dependencias externas, solo opera sobre el estado 'assignments'

  // Maneja el cambio del checkbox "Seleccionar Todos" para un módulo
  const handleSelectAllForModule = useCallback((moduleKey, shouldSelectAll) => {
    setAssignments(prev => {
      const newAssignments = new Set(prev);
      // Itera sobre los privilegios *actualmente disponibles* (de useMemo) para construir/eliminar claves
      displayablePrivileges.forEach(priv => {
        const key = `${moduleKey}-${priv.key}`; // Usa priv.key (la clave string del privilegio)
        if (shouldSelectAll) {
          newAssignments.add(key); // Añade todas las combinaciones para este módulo
        } else {
          newAssignments.delete(key); // Elimina todas las combinaciones para este módulo
        }
      });
      // console.log(`${LOG_PREFIX} Select all for module '${moduleKey}' -> ${shouldSelectAll}. New set:`, newAssignments);
      return newAssignments;
    });
  }, [displayablePrivileges]); // Depende de displayablePrivileges para saber qué claves crear/borrar


  // --- Form Submission Handler (CON PARSEO CORREGIDO) ---
  const handleSubmit = async (e) => {
    e.preventDefault(); // Previene recarga de página
    setError(null); // Limpia errores previos
    const trimmedRoleName = roleName.trim();

    // Validación básica del nombre (solo si es creación)
    if (!isEditingExistingRole && !trimmedRoleName) {
      toast.error("El nombre del rol es requerido.");
      setError("Por favor, ingrese un nombre para el nuevo rol.");
      return;
    }

    // Array para guardar las asignaciones formateadas para el backend ({ idPermission, idPrivilege })
    const rolePrivilegesFormatted = [];
    let mappingOk = true; // Flag para detener si falla el mapeo

    console.log(`${LOG_PREFIX} Starting submit. Assignments to process:`, assignments);
    console.log(`${LOG_PREFIX} Using permissionMap:`, permissionMap);
    console.log(`${LOG_PREFIX} Using privilegeMap:`, privilegeMap);

    // Itera sobre cada clave combinada ('moduloKey-privilegeKey') en el Set 'assignments'
    assignments.forEach(keyString => {
      let foundMatch = false;
      let parsedModuleKey = null;
      let parsedPrivilegeKey = null;
      let idPermission = undefined;
      let idPrivilege = undefined;

      // Itera a través de las claves de privilegio conocidas (cargadas del backend y en privilegeMap)
      // Ordenar por longitud descendente puede ayudar a encontrar 'view-details' antes que 'view' o 'details'
      const sortedPrivilegeKeys = Object.keys(privilegeMap).sort((a, b) => b.length - a.length);

      for (const knownPrivilegeKey of sortedPrivilegeKeys) {
          const suffix = `-${knownPrivilegeKey}`; // Construye el sufijo a buscar, ej: "-view-details"

          // Comprueba si la keyString (ej: "reservas-view-details") TERMINA con el sufijo
          if (keyString.endsWith(suffix)) {
              // Si termina, la parte ANTERIOR al sufijo es la clave del módulo
              parsedModuleKey = keyString.substring(0, keyString.length - suffix.length);
              // La clave del privilegio es la que usamos para encontrar el sufijo
              parsedPrivilegeKey = knownPrivilegeKey;

              // Intenta buscar los IDs numéricos usando las claves parseadas CORRECTAMENTE
              idPermission = permissionMap[parsedModuleKey]; // Busca ID del módulo
              idPrivilege = privilegeMap[parsedPrivilegeKey]; // Busca ID del privilegio

              // Si encontramos AMBOS IDs numéricos, el parseo es válido
              if (typeof idPermission === 'number' && typeof idPrivilege === 'number') {
                  foundMatch = true; // Marcamos que encontramos una combinación válida
                  console.log(`${LOG_PREFIX} Successfully parsed '${keyString}' -> Module: '${parsedModuleKey}' (ID:${idPermission}), Privilege: '${parsedPrivilegeKey}' (ID:${idPrivilege})`);
                  break; // Salimos del bucle de privilegios, ya encontramos el match correcto
              } else {
                   // Si no se encontraron IDs para esta separación, fue un match parcial o incorrecto.
                   // No hacemos nada y continuamos el bucle para probar otras claves de privilegio.
                   console.log(`${LOG_PREFIX} Partial match for '${keyString}' with privilege '${knownPrivilegeKey}', but failed ID lookup (P:${idPermission}, Priv:${idPrivilege}). Continuing search...`);
                   // Reseteamos por si acaso, aunque no es estrictamente necesario aquí
                   parsedModuleKey = null;
                   parsedPrivilegeKey = null;
                   idPermission = undefined;
                   idPrivilege = undefined;
              }
          }
      } // Fin del bucle for (knownPrivilegeKey)

      // Después de probar todas las claves de privilegio posibles para la keyString actual:
      if (foundMatch && typeof idPermission === 'number' && typeof idPrivilege === 'number') {
        // Si encontramos un match válido con IDs, lo añadimos al formato del backend
        rolePrivilegesFormatted.push({ idPermission, idPrivilege });
      } else {
        // Si no se encontró ninguna combinación válida para esta keyString
        console.error(`${LOG_PREFIX} MAPPING ERROR on submit: Could not parse or find valid IDs for assignment key: '${keyString}'.`);
        mappingOk = false; // Marcamos que hubo un error en el mapeo general
      }
    }); // Fin del assignments.forEach

    // Si hubo algún error durante el mapeo, no continuar
    if (!mappingOk) {
       setError("Error interno: No se pudieron procesar algunas asignaciones. Revise la consola para más detalles.");
       toast.error("Error interno al procesar asignaciones.");
       return;
    }

    // Opcional: Validar si hay al menos una asignación (¿es válido un rol sin permisos?)
    if (!isEditingExistingRole && rolePrivilegesFormatted.length === 0) {
      console.warn(`${LOG_PREFIX} Creating a new role with zero assignments.`);
      // Podrías mostrar una confirmación aquí o un error si no es permitido
      // if (!confirm("¿Está seguro de crear un rol sin ningún permiso asignado?")) return;
    }

    // Inicia estado de guardado
    setSaving(true);
    try {
      let successMessage = "";

      // Lógica diferente para editar vs crear
      if (isEditingExistingRole) {
          // --- EDITAR: Llama al servicio para REEMPLAZAR las asignaciones del rol ---
          // Este endpoint debe borrar las asignaciones viejas y poner las nuevas
          console.log(`${LOG_PREFIX} Updating assignments for Role ID ${selectedRole.idRole} with:`, rolePrivilegesFormatted);
          await roleService.assignRolePrivileges(selectedRole.idRole, rolePrivilegesFormatted);
          successMessage = `Asignaciones para "${selectedRole.roleName}" actualizadas correctamente.`;

          // Opcional: Si el nombre del rol también se pudiera editar en este form,
          // llamarías a roleService.updateRole aquí también.
          // if (selectedRole.roleName !== trimmedRoleName && trimmedRoleName) { ... }

      } else {
          // --- CREAR: Llama al servicio para crear el rol con sus asignaciones ---
          const payload = {
            roleName: trimmedRoleName,
            status: 1, // Asume activo por defecto al crear
            rolePrivileges: rolePrivilegesFormatted // Array de { idPermission, idPrivilege }
          };
          console.log(`${LOG_PREFIX} Creating new role with payload:`, payload);
          await roleService.createRole(payload);
          successMessage = `Rol "${payload.roleName}" creado exitosamente con sus asignaciones.`;
      }

      // Éxito
      toast.success(successMessage);
      if (onSave) onSave(); // Llama al callback para refrescar (si se proporcionó)
      toggle(); // Cierra el modal

    } catch (err) {
      // Manejo de errores del backend
      console.error(`${LOG_PREFIX} Error saving role/assignments:`, err.response?.data || err.message || err);
      const errorMsgFromServer = err.response?.data?.message || err.message || 'Ocurrió un error inesperado.';
      const finalErrorMsg = `Error al guardar: ${errorMsgFromServer}`;
      setError(finalErrorMsg);
      toast.error("Error al guardar los cambios. Intente de nuevo.");
    } finally {
      // Termina estado de guardado independientemente del resultado
      setSaving(false);
    }
  }; // Fin de handleSubmit

  // --- Render Logic Variables ---
  // Determina si el botón de submit debe estar habilitado
  const canSubmit = !loadingData && !saving && !isRoleInactive && displayableModules.length > 0 && displayablePrivileges.length > 0;
  // Texto dinámico para el botón de submit
  const submitButtonText = saving
    ? <><Spinner size="sm" className="me-1" /> Guardando...</>
    : (isEditingExistingRole ? 'Guardar Cambios' : 'Crear Rol');

  // --- JSX Structure ---
  return (
    <Modal
        isOpen={isOpen} // Controlado por el estado del padre
        toggle={!saving ? toggle : undefined} // Permite cerrar solo si no está guardando
        size="xl" // Modal grande para la tabla
        backdrop={saving ? "static" : true} // Impide cerrar clickeando fuera si está guardando
        keyboard={!saving} // Impide cerrar con Esc si está guardando
        fade={true}
        className="permissions-modal" // Clase CSS opcional
        centered // Centrar verticalmente
    >
      {/* Cabecera del Modal */}
      <ModalHeader toggle={!saving ? toggle : undefined}>
        {/* Título dinámico */}
        {isEditingExistingRole ? `Editar Asignaciones: ${selectedRole?.roleName || 'Rol Desconocido'}` : "Crear Nuevo Rol y Asignar Permisos"}
        {/* Badge si el rol está inactivo */}
        {isRoleInactive && <span className="ms-2 badge bg-warning text-dark">Rol Inactivo (Solo lectura)</span>}
      </ModalHeader>

      {/* Cuerpo del Modal */}
      <ModalBody>
        {/* Indicador de Carga */}
        {loadingData && (
          <div className="text-center p-4">
            <Spinner color="primary" style={{ width: '3rem', height: '3rem' }} />
            <p className="mt-3 mb-0 text-muted fs-5">Cargando configuración...</p>
          </div>
        )}

        {/* Mensaje de Error General */}
        {error && !loadingData && (
          <Alert color="danger" fade={false} className="d-flex align-items-center">
             {'⚠️ '} {/* Icono simple */}
             {error}
          </Alert>
        )}

        {/* Contenido Principal (solo si no está cargando) */}
        {!loadingData && (
          <Container fluid>
            {/* Formulario */}
            <form id="permissionForm" onSubmit={handleSubmit}>

              {/* Input para Nombre del Rol (solo en modo creación) */}
              {!isEditingExistingRole && (
                <Row className="mb-4">
                  <Col md={6}>
                    <FormGroup>
                      <Label for="roleNameInput" className="fw-bold">Nombre del Rol <span className="text-danger">*</span></Label>
                      <Input
                        id="roleNameInput" name="roleName" type="text" value={roleName}
                        onChange={(e) => setRoleName(e.target.value)}
                        placeholder="Ej: Administrador de Ventas" maxLength={100} required disabled={saving}
                      />
                    </FormGroup>
                  </Col>
                  {/* Podrías añadir input para 'status' aquí si fuera necesario */}
                </Row>
              )}

              <h5 className="mb-3">Asignar Privilegios por Módulo</h5>

              {/* Mensaje si no hay datos para mostrar */}
              {(displayableModules.length === 0 || displayablePrivileges.length === 0) && !error && (
                 <Alert color="info" fade={false} className="mt-3">
                    No se encontraron módulos o privilegios configurados en el sistema.
                 </Alert>
              )}

              {/* Tabla de Permisos (renderizar solo si hay datos) */}
              {displayableModules.length > 0 && displayablePrivileges.length > 0 && (
                <div className="table-responsive permission-table-container border rounded shadow-sm"> {/* Mejoras UI */}
                  <Table striped hover size="sm" className="mb-0 align-middle"> {/* Alineación vertical */}
                    <thead className="table-light sticky-top"> {/* Cabecera fija (parcialmente) */}
                      <tr>
                        <th style={{ width: '30%', minWidth: '200px' }}>Módulo</th> {/* Ancho mínimo */}
                        <th style={{ width: '15%', textAlign: 'center', minWidth: '150px' }}>Todos</th> {/* Texto más corto */}
                        <th>Privilegios</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Mapea los módulos para crear filas */}
                      {displayableModules.map(module => {
                         // Calcula si todos los privilegios para este módulo están marcados
                         const areAllPrivilegesForModuleSelected = displayablePrivileges.every(
                            priv => assignments.has(`${module.key}-${priv.key}`)
                         );

                         return (
                            <tr key={module.key}>
                              {/* Nombre del Módulo */}
                              <td className="fw-medium">{module.name}</td>

                              {/* Checkbox "Seleccionar Todos" */}
                              <td className="text-center">
                                <FormGroup check className="d-inline-block m-0 p-0"> {/* Sin margen/padding extra */}
                                    <Input
                                      bsSize="lg" // Checkbox un poco más grande
                                      type="checkbox"
                                      className="form-check-input" // Clase estándar
                                      id={`select-all-${module.key}`}
                                      checked={displayablePrivileges.length > 0 && areAllPrivilegesForModuleSelected}
                                      onChange={(e) => handleSelectAllForModule(module.key, e.target.checked)}
                                      // Deshabilitado si guarda, si rol inactivo o si no hay privilegios
                                      disabled={saving || isRoleInactive || displayablePrivileges.length === 0}
                                      title={`Seleccionar/Deseleccionar todos para ${module.name}`}
                                    />
                                </FormGroup>
                              </td>

                              {/* Privilegios Individuales */}
                              <td>
                                <div className="d-flex flex-wrap gap-3"> {/* Flexbox para wrap */}
                                  {displayablePrivileges.map(priv => (
                                    <FormGroup check inline key={priv.key} className="m-0"> {/* Sin margen */}
                                      <Input
                                        type="checkbox"
                                        id={`checkbox-${module.key}-${priv.key}`}
                                        checked={assignments.has(`${module.key}-${priv.key}`)}
                                        onChange={(e) => handleAssignmentChange(module.key, priv.key, e.target.checked)}
                                        disabled={saving || isRoleInactive}
                                      />
                                      <Label check for={`checkbox-${module.key}-${priv.key}`}>{priv.name}</Label>
                                    </FormGroup>
                                  ))}
                                </div>
                              </td>
                            </tr>
                         );
                      })}
                    </tbody>
                  </Table>
                </div>
              )}

              {/* Footer del Modal (se mueve fuera del form si usas submit externo) */}
              {/* Los botones están dentro del form aquí */}
              <ModalFooter className="mt-4 border-top pt-3"> {/* Separador visual */}
                <Button color="secondary" type="button" onClick={toggle} disabled={saving}>
                  Cancelar
                </Button>
                <Button
                  type="submit" // Botón de submit del formulario
                  form="permissionForm" // Asocia explícitamente al form (buena práctica)
                  color="primary"
                  disabled={!canSubmit} // Habilitado según la variable calculada
                  title={!canSubmit ? "Complete la información o verifique el estado del rol" : (isEditingExistingRole ? 'Guardar cambios en asignaciones' : 'Crear nuevo rol')}
                >
                  {submitButtonText} {/* Texto dinámico (Guardando... o texto normal) */}
                </Button>
              </ModalFooter>

            </form> {/* Fin del form */}
          </Container>
        )}
      </ModalBody>
    </Modal>
  );
}