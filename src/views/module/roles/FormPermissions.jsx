import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Table, Button, FormGroup, Input, Container, Row, Col, Label,
  Modal, ModalHeader, ModalBody, ModalFooter, Spinner, Alert
} from "reactstrap";
import toast from "react-hot-toast";

// --- Service Imports ---
import roleService from '../../services/roleServices';
import permissionService from '../../services/permissionService';
import privilegeService from '../../services/privilegeService';

// --- Frontend Definitions ---
import { APP_MODULES, STANDARD_PRIVILEGES } from '../../../config/modules';

// --- Constants ---
const LOG_PREFIX = "[FormPermissions]";

// --- Component ---
export default function FormPermissions({
  isOpen,
  toggle,
  selectedRole,
  onSave,
}) {
  // --- State ---
  const [roleName, setRoleName] = useState("");
  const [backendPermissions, setBackendPermissions] = useState([]);
  const [backendPrivileges, setBackendPrivileges] = useState([]);
  const [assignments, setAssignments] = useState(new Set());
  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const isEditingExistingRole = useMemo(() => !!selectedRole?.idRole, [selectedRole]);
  const isRoleInactive = useMemo(() => isEditingExistingRole && !selectedRole?.status, [isEditingExistingRole, selectedRole]);

  // --- Data Transformation (Memoized Maps) ---
  const {
    permissionMap,
    privilegeMap,
    permissionIdToKeyMap,
    privilegeIdToKeyMap,
    displayableModules,
    displayablePrivileges
  } = useMemo(() => {
    const pMap = {}; const pIdToKey = {}; const displayModules = [];
    const privMap = {}; const privIdToKey = {}; const displayPrivs = [];

    if (Array.isArray(backendPermissions) && backendPermissions.length > 0) {
      APP_MODULES.forEach(moduleDef => {
        const backendPerm = backendPermissions.find(bp =>
          (bp.permissionKey && bp.permissionKey === moduleDef.key) ||
          bp.permissionName === moduleDef.name
        );
        if (backendPerm && typeof backendPerm.idPermission === 'number') {
          pMap[moduleDef.key] = backendPerm.idPermission;
          pIdToKey[backendPerm.idPermission] = moduleDef.key;
          displayModules.push(moduleDef);
        }
      });
    }
    if (Array.isArray(backendPrivileges) && backendPrivileges.length > 0) {
      STANDARD_PRIVILEGES.forEach(privDef => {
        const backendPriv = backendPrivileges.find(bp =>
          (bp.privilegeKey && bp.privilegeKey === privDef.key) ||
          bp.privilegeName === privDef.name
        );
        if (backendPriv && typeof backendPriv.idPrivilege === 'number') {
          privMap[privDef.key] = backendPriv.idPrivilege;
          privIdToKey[backendPriv.idPrivilege] = privDef.key;
          displayPrivs.push(privDef);
        }
      });
    }

    return {
      permissionMap: pMap, privilegeMap: privMap, permissionIdToKeyMap: pIdToKey,
      privilegeIdToKeyMap: privIdToKey, displayableModules: displayModules,
      displayablePrivileges: displayPrivs
    };
  }, [backendPermissions, backendPrivileges]);

  // --- Effect: Load Initial Data ---
  useEffect(() => {
    if (!isOpen) return;
    let didCancel = false;
    setError(null);
    setAssignments(new Set());
    setRoleName(isEditingExistingRole ? selectedRole.roleName : "");
    setLoadingData(true);

    const loadAllData = async () => {
      try {
        const [permData, privData] = await Promise.all([
          permissionService.getAll(),
          privilegeService.getAll()
        ]);
        if (didCancel) return;
        const loadedPerms = Array.isArray(permData) ? permData : [];
        const loadedPrivs = Array.isArray(privData) ? privData : [];
        setBackendPermissions(loadedPerms);
        setBackendPrivileges(loadedPrivs);

        let assignmentsFromBackend = [];
        if (isEditingExistingRole && selectedRole?.idRole) {
          const result = await roleService.getRolePrivilegesByIds(selectedRole.idRole);
          if (didCancel) return;
          if (Array.isArray(result)) {
            assignmentsFromBackend = result;
          } else {
            console.warn(`${LOG_PREFIX} Received unexpected data format for existing assignments. Expected array.`);
            toast.error("No se pudieron cargar las asignaciones existentes correctamente.");
            assignmentsFromBackend = [];
          }
        }

        const tempPIdToKey = {};
        loadedPerms.forEach(p => {
          const moduleDef = APP_MODULES.find(m => (p.permissionKey && p.permissionKey === m.key) || p.permissionName === m.name);
          if (moduleDef && typeof p.idPermission === 'number') tempPIdToKey[p.idPermission] = moduleDef.key;
        });
        const tempPrivIdToKey = {};
        loadedPrivs.forEach(p => {
          const privDef = STANDARD_PRIVILEGES.find(sp => (p.privilegeKey && p.privilegeKey === sp.key) || p.privilegeName === sp.name);
          if (privDef && typeof p.idPrivilege === 'number') tempPrivIdToKey[p.idPrivilege] = privDef.key;
        });

        const initialAssignments = new Set();
        assignmentsFromBackend.forEach(assignment => {
          const moduleKey = tempPIdToKey[assignment.idPermission];
          const privilegeKey = tempPrivIdToKey[assignment.idPrivilege];
          if (moduleKey && privilegeKey) initialAssignments.add(`${moduleKey}-${privilegeKey}`);
          else console.warn(`${LOG_PREFIX} Could not map existing assignment from backend IDs.`);
        });
        setAssignments(initialAssignments);

      } catch (err) {
        if (!didCancel) {
          console.error(`${LOG_PREFIX} Error loading data:`, err.response?.data || err.message || err);
          setError("Error al cargar datos. Intente de nuevo.");
          toast.error("Error al cargar configuración.");
          setBackendPermissions([]);
          setBackendPrivileges([]);
          setAssignments(new Set());
        }
      } finally {
        if (!didCancel) {
          setLoadingData(false);
        }
      }
    };
    loadAllData();
    return () => { didCancel = true; };
  }, [isOpen, selectedRole?.idRole, isEditingExistingRole]);

  // --- Event Handlers ---
  const handleAssignmentChange = useCallback((moduleKey, privilegeKey, isChecked) => {
    setAssignments(prev => {
      const newAssignments = new Set(prev);
      const key = `${moduleKey}-${privilegeKey}`;
      if (isChecked) newAssignments.add(key);
      else newAssignments.delete(key);
      return newAssignments;
    });
  }, []);

  const handleSelectAllForModule = useCallback((moduleKey, shouldSelectAll) => {
    setAssignments(prev => {
      const newAssignments = new Set(prev);
      displayablePrivileges.forEach(priv => {
        const key = `${moduleKey}-${priv.key}`;
        if (shouldSelectAll) newAssignments.add(key);
        else newAssignments.delete(key);
      });
      return newAssignments;
    });
  }, [displayablePrivileges]);

  // --- Form Submission ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const trimmedRoleName = roleName.trim();
    if (!isEditingExistingRole && !trimmedRoleName) {
      toast.error("El nombre del rol es requerido.");
      return;
    }

    const rolePrivilegesFormatted = [];
    let mappingOk = true;

    assignments.forEach(keyString => {
      const parts = keyString.split("-");
      const moduleKey = parts[0];
      const privilegeKey = parts[1];
      const idPermission = permissionMap[moduleKey];
      const idPrivilege = privilegeMap[privilegeKey];
      if (typeof idPermission === 'number' && typeof idPrivilege === 'number') {
        rolePrivilegesFormatted.push({ idPermission, idPrivilege });
      } else {
        console.error(`${LOG_PREFIX} CRITICAL MAPPING ERROR: Could not find valid IDs for assignment key: '${keyString}'.`);
        mappingOk = false;
      }
    });

    if (!mappingOk) {
       setError("Error interno: No se pudieron procesar todas las asignaciones. Revise consola.");
       toast.error("Error interno al procesar asignaciones.");
       return;
    }
    if (!isEditingExistingRole && rolePrivilegesFormatted.length === 0) {
      toast.error("Debe asignar al menos un permiso/privilegio válido.");
      return;
    }

    setSaving(true);
    try {
      const payload = { 
        roleName: trimmedRoleName, 
        status: 1,  // Estableciendo el estado como 1 (activo)
        rolePrivileges: rolePrivilegesFormatted
      };
      console.log("Payload enviado al backend:", payload);  // Ayuda a depurar el formato
      if (isEditingExistingRole) {
        await roleService.assignRolePrivileges(selectedRole.idRole, rolePrivilegesFormatted);
        toast.success(`Asignaciones para "${selectedRole.roleName}" actualizadas.`);
      } else {
        await roleService.createRole(payload);
        toast.success(`Rol "${payload.roleName}" creado con sus asignaciones.`);
      }
      if (onSave) onSave();
      toggle();
    } catch (err) {
      console.error(`${LOG_PREFIX} Error saving:`, err.response?.data || err.message || err);
      const errorMsg = `Error al guardar: ${err.response?.data?.message || err.message || 'Error inesperado.'}`;
      setError(errorMsg);
      toast.error("Error al guardar los cambios.");
    } finally {
      setSaving(false);
    }
  };

  // --- Render Logic Variables ---
  const canSubmit = !loadingData && !saving && !isRoleInactive && displayableModules.length > 0 && displayablePrivileges.length > 0;
  const submitButtonText = saving
    ? <><Spinner size="sm" className="me-1" /> Guardando...</>
    : (isEditingExistingRole ? 'Guardar Cambios' : 'Crear Rol');

  // --- JSX ---
  return (
    <Modal
        isOpen={isOpen}
        toggle={!saving ? toggle : undefined}
        size="xl"
        backdrop={saving ? "static" : true}
        keyboard={!saving}
        fade={false}
        className="permissions-modal"
        centered
    >
      <ModalHeader toggle={!saving ? toggle : undefined}>
        {isEditingExistingRole ? `Editar Asignaciones: ${selectedRole.roleName}` : "Crear Nuevo Rol y Asignar Permisos"}
        {isRoleInactive && <span className="ms-2 badge bg-warning text-dark">Rol Inactivo (Solo lectura)</span>}
      </ModalHeader>
      <ModalBody>
        {loadingData && (
          <div className="text-center p-4">
            <Spinner color="primary" style={{ width: '3rem', height: '3rem' }} />
            <p className="mt-3 mb-0 text-muted fs-5">Cargando configuración...</p>
          </div>
        )}

        {error && !loadingData && (
          <Alert color="danger" fade={false} className="d-flex align-items-center">
             {typeof(window) !== 'undefined' && window.bootstrap ? <i className="bi bi-exclamation-triangle-fill me-2"></i> : '⚠️ '}
             {error}
          </Alert>
        )}

        {!loadingData && (
          <Container fluid>
            <form id="permissionForm" onSubmit={handleSubmit}>
              {!isEditingExistingRole && (
                <Row className="mb-4">
                  <Col md={6}>
                    <FormGroup>
                      <Label for="roleNameInput" className="fw-bold required">Nombre del Rol</Label>
                      <Input
                        id="roleNameInput" name="roleName" type="text" value={roleName}
                        onChange={(e) => setRoleName(e.target.value)}
                        placeholder="Ej: Administrador de Ventas" maxLength={100} required disabled={saving}
                      />
                    </FormGroup>
                  </Col>
                </Row>
              )}
              <h5 className="mb-3">Asignar Privilegios por Módulo</h5>
              {(displayableModules.length === 0 || displayablePrivileges.length === 0) && !error && (
                 <Alert color="warning" fade={false}>
                    No se encontraron módulos o privilegios configurables. Verifique configuración.
                 </Alert>
              )}
              {displayableModules.length > 0 && displayablePrivileges.length > 0 && (
                <div className="table-responsive permission-table-container">
                  <Table striped hover size="sm" responsive>
                    <thead>
                      <tr>
                        <th>Seleccionar Todos</th>
                        <th>Módulo</th>
                        <th>Permisos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayableModules.map(module => (
                        <tr key={module.key}>
                          <td>
                            <Input
                              type="checkbox"
                              checked={assignments.has(`${module.key}-`) || false}
                              onChange={(e) => handleSelectAllForModule(module.key, e.target.checked)}
                              disabled={saving}
                            />
                          </td>
                          <td>{module.name}</td>
                          <td>
                            {displayablePrivileges.map(priv => (
                              <FormGroup check inline key={priv.key}>
                                <Input
                                  type="checkbox"
                                  id={`checkbox-${module.key}-${priv.key}`}
                                  checked={assignments.has(`${module.key}-${priv.key}`)}
                                  onChange={(e) => handleAssignmentChange(module.key, priv.key, e.target.checked)}
                                  disabled={saving}
                                />
                                <Label check>{priv.name}</Label>
                              </FormGroup>
                            ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
              <ModalFooter>
                <Button color="secondary" onClick={toggle} disabled={saving}>Cancelar</Button>
                <Button
                  type="submit"
                  color="primary"
                  disabled={saving || !canSubmit}
                >
                  {submitButtonText}
                </Button>
              </ModalFooter>
            </form>
          </Container>
        )}
      </ModalBody>
    </Modal>
  );
}
