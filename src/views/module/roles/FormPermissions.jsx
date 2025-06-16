// src/components/permissions/FormPermissions.jsx

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Table, Button, FormGroup, Input, Container, Row, Col, Label,
  Modal, ModalHeader, ModalBody, ModalFooter, Spinner, Alert, Card, CardBody
} from "reactstrap";
import toast from "react-hot-toast";

import {
  PlusCircle, Edit3, Trash2, AlertTriangle, CheckCircle,
  XCircle, Save, CheckSquare, Settings, ListTree
} from 'lucide-react';

import roleService from '../../services/roleServices'; // Corregido: roleService (no roleServices)
import permissionService from '../../services/permissionService';
import privilegeService from '../../services/privilegeService';

const LOG_PREFIX = "[FormPermissions]";

export default function FormPermissions({
  isOpen,
  toggle,
  selectedRole,
  onSave,
}) {
  const [roleName, setRoleName] = useState("");
  const [backendPermissions, setBackendPermissions] = useState([]); // Todos los permisos de la BD
  const [backendPrivileges, setBackendPrivileges] = useState([]);   // Todos los privilegios de la BD
  const [configuredRoleModules, setConfiguredRoleModules] = useState([]);
  const [currentSelectedModuleKey, setCurrentSelectedModuleKey] = useState('');
  const [currentModulePrivileges, setCurrentModulePrivileges] = useState(new Set()); // Set de privilegeKeys seleccionados para el módulo actual
  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const isEditingExistingRole = useMemo(() => !!selectedRole?.idRole, [selectedRole]);
  const isRoleInactive = useMemo(() => isEditingExistingRole && !selectedRole?.status, [isEditingExistingRole, selectedRole]);

  // Mapa de permissionKey a idPermission y lista de módulos para el selector
  const { permissionMap, displayableModules } = useMemo(() => {
    const pMap = {};
    const modules = [];
    if (Array.isArray(backendPermissions)) {
      backendPermissions.forEach(perm => {
        if (perm && typeof perm.idPermission === 'number' && perm.permissionKey && typeof perm.permissionKey === 'string') {
          const moduleKey = perm.permissionKey;
          const moduleName = perm.permissionName || moduleKey; // Usar permissionName si existe
          pMap[moduleKey] = perm.idPermission;
          modules.push({ key: moduleKey, name: moduleName, idPermission: perm.idPermission });
        }
      });
    }
    modules.sort((a, b) => a.name.localeCompare(b.name));
    return { permissionMap: pMap, displayableModules: modules };
  }, [backendPermissions]);

  // Mapa de privilegeKey a idPrivilege (para el submit)
  // Y privilegios disponibles PARA EL MÓDULO ACTUALMENTE SELECCIONADO
  const { privilegeMap, privilegesForCurrentModule } = useMemo(() => {
    const privMapGlobal = {}; // Mapa global de privilegeKey a idPrivilege (asumiendo que privilegeKey es único globalmente o que el backend los devuelve así)
                               // OJO: Si privilegeKey NO es único globalmente, este mapa puede ser problemático.
                               // Sería mejor un mapa de (idPermission, privilegeKey) -> idPrivilege

    const filteredPrivs = [];
    const currentPermissionId = permissionMap[currentSelectedModuleKey]; // ID del módulo seleccionado

    if (Array.isArray(backendPrivileges)) {
      backendPrivileges.forEach(priv => {
        if (priv && typeof priv.idPrivilege === 'number' && priv.privilegeKey && typeof priv.privilegeKey === 'string') {
          // Llenar el mapa global de privilegios (cuidado si privilegeKey no es único global)
          // Si privilegeKey no es único globalmente, necesitarías construir este mapa de forma diferente
          // o basar el submit en idPrivilege directamente sin este mapa.
          // Por ahora, asumimos que para el submit necesitamos mapear el privilegeKey guardado en currentModulePrivileges
          // al idPrivilege correcto.
          // Para evitar colisiones si 'view' existe para módulo A y módulo B:
          // privMapGlobal[`${priv.idPermission}-${priv.privilegeKey}`] = priv.idPrivilege;
          // O, más simple para el display, si `privilegeKey` son únicos POR `idPermission` (lo que logramos con Opción 2):
          privMapGlobal[priv.privilegeKey] = priv.idPrivilege; // Asumimos que el FormPermissions trabaja con los privilegeKey simples

          // Filtrar privilegios para el módulo actual
          if (currentPermissionId && priv.idPermission === currentPermissionId) {
            const privilegeName = priv.privilegeName || priv.privilegeKey; // Usar privilegeName
            filteredPrivs.push({
              key: priv.privilegeKey,
              name: privilegeName,
              idPrivilege: priv.idPrivilege,
              idPermission: priv.idPermission // Mantener por si acaso
            });
          }
        }
      });
    }
    filteredPrivs.sort((a, b) => a.name.localeCompare(b.name));
    return { privilegeMap: privMapGlobal, privilegesForCurrentModule: filteredPrivs };
  }, [backendPrivileges, currentSelectedModuleKey, permissionMap]);


  const availableModulesForSelection = useMemo(() => {
    if (!displayableModules || displayableModules.length === 0) return [];
    const configuredKeys = new Set(configuredRoleModules.map(m => m.moduleKey));
    return displayableModules.filter(
      mod => !configuredKeys.has(mod.key) || mod.key === currentSelectedModuleKey
    );
  }, [displayableModules, configuredRoleModules, currentSelectedModuleKey]);

  useEffect(() => {
    if (!isOpen) {
        setCurrentSelectedModuleKey(''); setCurrentModulePrivileges(new Set());
        setConfiguredRoleModules([]); setRoleName(""); setError(null);
        return;
    }
    const controller = new AbortController(); const signal = controller.signal;
    setError(null); setRoleName(isEditingExistingRole ? selectedRole.roleName : "");
    setLoadingData(true); setBackendPermissions([]); setBackendPrivileges([]);
    setConfiguredRoleModules([]); setCurrentSelectedModuleKey(''); setCurrentModulePrivileges(new Set());

    const loadAndProcessData = async () => {
      let loadedPerms = []; let loadedPrivs = []; let assignmentsFromBackend = [];
      try {
        // Cargar todos los permisos y todos los privilegios una vez
        [loadedPerms, loadedPrivs] = await Promise.all([
          permissionService.getAll().then(data => Array.isArray(data) ? data : []).catch(err => { if(signal.aborted) throw err; console.error(`${LOG_PREFIX} Perm err:`, err); return []; }),
          privilegeService.getAll().then(data => Array.isArray(data) ? data : []).catch(err => { if(signal.aborted) throw err; console.error(`${LOG_PREFIX} Priv err:`, err); return []; })
        ]);
        if (signal.aborted) return;
        setBackendPermissions(loadedPerms);
        setBackendPrivileges(loadedPrivs); // Guardamos todos los privilegios

        if (isEditingExistingRole && selectedRole?.idRole) {
          try {
            // getRolePrivilegesByIds devuelve [{ idPermission, idPrivilege }, ...]
            const result = await roleService.getRolePrivilegeAssignments(selectedRole.idRole);
            if (signal.aborted) return;
            if (Array.isArray(result)) assignmentsFromBackend = result;
            else toast.error("Error cargando las asignaciones del rol.");
          } catch (assignErr) {
            if (signal.aborted) return;
            console.error(`${LOG_PREFIX} Assign err`, assignErr);
            toast.error("Error cargando las asignaciones del rol.");
            // Considerar setError("No se pudieron cargar las asignaciones para este rol.");
          }
        }

        // Procesar las asignaciones existentes para reconstruir configuredRoleModules
        if (assignmentsFromBackend.length > 0 && loadedPerms.length > 0 && loadedPrivs.length > 0) {
            const permIdToInfoMap = {};
            loadedPerms.forEach(p => {
                if (p && typeof p.idPermission === 'number' && p.permissionKey) {
                    permIdToInfoMap[p.idPermission] = {
                        key: p.permissionKey,
                        name: p.permissionName || p.permissionKey,
                        idPermission: p.idPermission
                    };
                }
            });

            const privIdToKeyMap = {};
            loadedPrivs.forEach(p => {
                if (p && typeof p.idPrivilege === 'number' && p.privilegeKey) {
                    privIdToKeyMap[p.idPrivilege] = p.privilegeKey;
                }
            });

            const groupedByModule = {};
            assignmentsFromBackend.forEach(assignment => {
                const moduleInfo = permIdToInfoMap[assignment.idPermission];
                const privilegeKey = privIdToKeyMap[assignment.idPrivilege];

                if (moduleInfo && privilegeKey) {
                    if (!groupedByModule[moduleInfo.key]) {
                        groupedByModule[moduleInfo.key] = {
                            moduleKey: moduleInfo.key,
                            moduleName: moduleInfo.name,
                            idPermission: moduleInfo.idPermission,
                            selectedPrivileges: new Set() // Set de privilegeKeys
                        };
                    }
                    groupedByModule[moduleInfo.key].selectedPrivileges.add(privilegeKey);
                } else {
                    console.warn(`${LOG_PREFIX} Mapeo fallido para asignación:`, assignment, "con moduleInfo:", moduleInfo, "y privilegeKey:", privilegeKey);
                }
            });
            setConfiguredRoleModules(Object.values(groupedByModule));
        }
      } catch (err) {
          if (err.name !== 'AbortError' && !signal.aborted) {
              console.error(`${LOG_PREFIX} Load data err:`, err);
              setError("Error crítico al cargar la configuración de permisos.");
              toast.error("Error crítico cargando configuración.");
          }
      }
      finally { if (!signal.aborted) setLoadingData(false); }
    };
    loadAndProcessData();
    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedRole?.idRole, isEditingExistingRole]); // selectedRole.roleName no es necesario aquí

  const handleModuleSelectChange = (e) => {
    const newModuleKey = e.target.value;
    setCurrentSelectedModuleKey(newModuleKey);
    // Si el módulo ya estaba configurado, cargar sus privilegios seleccionados
    const existingConfig = configuredRoleModules.find(m => m.moduleKey === newModuleKey);
    if (existingConfig) {
        setCurrentModulePrivileges(new Set(existingConfig.selectedPrivileges));
    } else {
        setCurrentModulePrivileges(new Set()); // Limpiar para un módulo nuevo
    }
  };

  const handleCurrentPrivilegeChange = (privilegeKey, isChecked) => {
    setCurrentModulePrivileges(prev => {
      const newPrivs = new Set(prev);
      if (isChecked) newPrivs.add(privilegeKey);
      else newPrivs.delete(privilegeKey);
      return newPrivs;
    });
  };

  // Modificado: Seleccionar todos los privilegios DEL MÓDULO ACTUAL
  const handleToggleAllPrivileges = (isChecked) => {
    if (isChecked) {
      const allPrivKeysForCurrentModule = privilegesForCurrentModule.map(p => p.key);
      setCurrentModulePrivileges(new Set(allPrivKeysForCurrentModule));
    } else {
      setCurrentModulePrivileges(new Set());
    }
  };

  // Modificado: Verificar si todos los privilegios DEL MÓDULO ACTUAL están seleccionados
  const areAllPrivilegesSelected = useMemo(() => {
    if (!currentSelectedModuleKey || privilegesForCurrentModule.length === 0) return false;
    return privilegesForCurrentModule.every(priv => currentModulePrivileges.has(priv.key));
  }, [currentModulePrivileges, privilegesForCurrentModule, currentSelectedModuleKey]);

  const handleSaveModuleConfiguration = () => {
    if (!currentSelectedModuleKey) { toast.error("Seleccione un módulo."); return; }
    const moduleData = displayableModules.find(m => m.key === currentSelectedModuleKey);
    if (!moduleData) { toast.error("Módulo no encontrado en la lista de desplegables."); return; }

    setConfiguredRoleModules(prevConfigured => {
      const existingIndex = prevConfigured.findIndex(m => m.moduleKey === currentSelectedModuleKey);
      // Guardamos el moduleKey, moduleName, idPermission, y el Set de privilegeKeys seleccionados
      const newModuleConfig = {
          moduleKey: moduleData.key,
          moduleName: moduleData.name,
          idPermission: moduleData.idPermission,
          selectedPrivileges: new Set(currentModulePrivileges) // Set de privilegeKeys
      };
      let updatedConfiguredModules;
      if (existingIndex > -1) {
        updatedConfiguredModules = [...prevConfigured];
        updatedConfiguredModules[existingIndex] = newModuleConfig;
        toast.success(<span><CheckCircle size={16} className="me-1" />Privilegios para "{moduleData.name}" actualizados.</span>);
      } else {
        updatedConfiguredModules = [...prevConfigured, newModuleConfig];
        toast.success(<span><CheckCircle size={16} className="me-1" />Módulo "{moduleData.name}" agregado al rol.</span>);
      }
      return updatedConfiguredModules;
    });
    setCurrentSelectedModuleKey(''); // Limpiar selección para forzar nueva elección
    setCurrentModulePrivileges(new Set()); // Limpiar privilegios seleccionados
  };

  const handleEditConfiguredModule = (moduleToEdit) => {
    // moduleToEdit ya tiene { moduleKey, moduleName, idPermission, selectedPrivileges (Set de privilegeKeys) }
    setCurrentSelectedModuleKey(moduleToEdit.moduleKey);
    setCurrentModulePrivileges(new Set(moduleToEdit.selectedPrivileges));
    toast.info(`Editando privilegios para ${moduleToEdit.moduleName}.`);
  };

  const handleRemoveModuleFromRole = (moduleKeyToRemove) => {
    const moduleName = configuredRoleModules.find(m => m.moduleKey === moduleKeyToRemove)?.moduleName || "El módulo";
    setConfiguredRoleModules(prev => prev.filter(m => m.moduleKey !== moduleKeyToRemove));
    toast.success(<span><Trash2 size={16} className="me-1" />{moduleName} y sus permisos quitados del rol.</span>);
    if (currentSelectedModuleKey === moduleKeyToRemove) {
        setCurrentSelectedModuleKey('');
        setCurrentModulePrivileges(new Set());
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(null);
    const trimmedRoleName = roleName.trim();
    if (!isEditingExistingRole && !trimmedRoleName) { toast.error("Nombre del rol es requerido."); setError("Ingrese un nombre para el rol."); return; }
    if (configuredRoleModules.length === 0 && !isEditingExistingRole) { toast.error("Debe asignar al menos un permiso a un módulo."); setError("Agregue módulos y asigne permisos."); return;}

    const rolePrivilegesPayload = []; // Esto será [{ idPermission, idPrivilege }, ...]
    let mappingErrorOccurred = false;

    // Construir el payload para el backend
    configuredRoleModules.forEach(configuredModule => {
      const idPermission = configuredModule.idPermission; // Ya lo tenemos
      configuredModule.selectedPrivileges.forEach(privilegeKey => { // Iteramos sobre los privilegeKeys guardados
        // Necesitamos encontrar el idPrivilege que corresponde a este privilegeKey DENTRO de este idPermission
        const matchingPrivilege = backendPrivileges.find(
            bp => bp.idPermission === idPermission && bp.privilegeKey === privilegeKey
        );

        if (matchingPrivilege && typeof matchingPrivilege.idPrivilege === 'number') {
          rolePrivilegesPayload.push({
            idPermission: idPermission,
            idPrivilege: matchingPrivilege.idPrivilege
          });
        } else {
          console.error(`${LOG_PREFIX} Map err en handleSubmit: Módulo:${configuredModule.moduleName}(${idPermission}), PrivilegeKey:${privilegeKey}. No se encontró idPrivilege correspondiente o es inválido.`);
          mappingErrorOccurred = true;
        }
      });
    });

    if (mappingErrorOccurred) {
        setError("Error interno al mapear asignaciones. Revise la consola.");
        toast.error("Error interno al procesar los permisos.");
        return;
    }

    console.log(`${LOG_PREFIX} Payload para el backend:`, JSON.stringify(rolePrivilegesPayload, null, 2));

    setSaving(true);
    try {
      let successMessage = "";
      if (isEditingExistingRole) {
          // Para editar, solo enviamos el array de asignaciones
          await roleService.assignRolePrivileges(selectedRole.idRole, rolePrivilegesPayload);
          successMessage = `Asignaciones para el rol "${selectedRole.roleName}" actualizadas exitosamente.`;
      } else {
          // Para crear, enviamos el nombre del rol y las asignaciones
          const payload = {
              roleName: trimmedRoleName,
              status: true, // o el valor que corresponda (1 si es número)
              privilegeAssignments: rolePrivilegesPayload // El backend espera este nombre para la creación anidada
          };
          await roleService.createRole(payload);
          successMessage = `Rol "${payload.roleName}" creado exitosamente.`;
      }
      toast.success(<span><CheckCircle size={18} className="me-1" /> {successMessage}</span>);
      if (onSave) onSave(); // Callback para refrescar la lista de roles, por ejemplo
      toggle(); // Cerrar el modal
    } catch (err) {
      console.error(`${LOG_PREFIX} Save err:`, err.response?.data || err.message || err);
      const errorMsgFromServer = err.response?.data?.message || err.message || 'Ocurrió un error inesperado al guardar.';
      setError(`Error al guardar: ${errorMsgFromServer}`);
      toast.error(<span><XCircle size={18} className="me-1" /> Error al guardar. ${errorMsgFromServer}</span>);
    } finally {
      setSaving(false);
    }
  };

  const canSubmitOverall = !loadingData && !saving && !isRoleInactive &&
                       (isEditingExistingRole || configuredRoleModules.length > 0) &&
                       (isEditingExistingRole || !!roleName.trim());
  const submitButtonText = saving ? <><Spinner size="sm" className="me-1" /> Guardando...</> : (isEditingExistingRole ? 'Guardar Cambios de Rol' : 'Crear Nuevo Rol');
  const currentModuleBeingConfigured = displayableModules.find(m => m.key === currentSelectedModuleKey);
  const isEditingAConfiguredModule = configuredRoleModules.some(m => m.moduleKey === currentSelectedModuleKey);
  const addOrUpdateModuleButtonText = isEditingAConfiguredModule ? "Actualizar Privilegios del Módulo" : "Agregar Privilegios al Módulo";
  const addOrUpdateModuleButtonIcon = isEditingAConfiguredModule ? <Save size={16} className="me-1" /> : <PlusCircle size={16} className="me-1" />;

  return (
    <Modal
        isOpen={isOpen} toggle={!saving ? toggle : undefined}
        size="xl" // Cambiado a xl para más espacio
        backdrop={saving ? "static" : true} keyboard={!saving}
        className="permissions-modal-compact" centered
    >
      <ModalHeader toggle={!saving ? toggle : undefined} className="bg-light border-bottom">
        {isEditingExistingRole ? `Editar Permisos del Rol: ${selectedRole?.roleName || 'Rol'}` : "Crear Nuevo Rol y Asignar Permisos"}
        {isRoleInactive && <span className="ms-2 badge bg-warning text-dark">Rol Inactivo</span>}
      </ModalHeader>

      <ModalBody className="pb-3">
        {loadingData && (
          <div className="text-center py-5"><Spinner color="primary" style={{ width: '3rem', height: '3rem' }} /><p className="mt-3 lead">Cargando datos de configuración...</p></div>
        )}
        {error && !loadingData && (
          <Alert color="danger" className="d-flex align-items-center mb-3 py-2 shadow-sm">
             <AlertTriangle size={24} className="me-3 flex-shrink-0" /> <div><strong>Error:</strong> {error}</div>
          </Alert>
        )}

        {!loadingData && (
          <Container fluid className="px-0">
            <form id="permissionForm" onSubmit={handleSubmit}>
              {!isEditingExistingRole && (
                <Row className="mb-3 px-md-3">
                  <Col md={7}>
                    <FormGroup>
                      <Label for="roleNameInput" className="fw-bold form-label">Nombre del Rol <span className="text-danger">*</span></Label>
                      <Input id="roleNameInput" bsSize="sm" name="roleName" type="text" value={roleName}
                        onChange={(e) => setRoleName(e.target.value)}
                        placeholder="Ej: Administrador de Ventas" maxLength={100} required disabled={saving} />
                    </FormGroup>
                  </Col>
                </Row>
              )}

              <Row className="mb-3 px-md-3">
                <Col md={6}>
                  <FormGroup>
                    <Label for="moduleSelect" className="fw-bold form-label d-flex align-items-center">
                      <Settings size={16} className="me-2 text-primary" /> Módulo a Configurar
                    </Label>
                    <Input type="select" name="moduleSelect" id="moduleSelect" bsSize="sm"
                      value={currentSelectedModuleKey} onChange={handleModuleSelectChange}
                      disabled={saving || isRoleInactive || (availableModulesForSelection.length === 0 && !currentSelectedModuleKey)}
                    >
                      <option value="">-- Seleccione un módulo --</option>
                      {availableModulesForSelection.map(mod => (
                        <option key={mod.key} value={mod.key}>{mod.name}</option>
                      ))}
                    </Input>
                  </FormGroup>
                </Col>
              </Row>

              {currentSelectedModuleKey && (
                <Card className="mb-4 mx-md-3 shadow-sm">
                  <CardBody className="p-3">
                    <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                        <h6 className="card-title fw-bold d-flex align-items-center mb-0">
                        {isEditingAConfiguredModule ? (
                            <Edit3 size={18} className="me-2 text-primary" />
                        ) : (
                            <PlusCircle size={18} className="me-2 text-success" />
                        )}
                        {currentModuleBeingConfigured?.name ? `Privilegios para: ${currentModuleBeingConfigured.name}` : "Seleccione Módulo"}
                        </h6>
                        {privilegesForCurrentModule.length > 0 && ( // Solo mostrar si hay privilegios para este módulo
                            <FormGroup check className="mb-0 ms-auto">
                                <Input
                                type="checkbox"
                                id="select-all-privileges"
                                checked={areAllPrivilegesSelected}
                                onChange={(e) => handleToggleAllPrivileges(e.target.checked)}
                                disabled={saving || isRoleInactive}
                                className="form-check-input"
                                />
                                <Label check for="select-all-privileges" className="fw-normal text-primary d-flex align-items-center small">
                                <CheckSquare size={14} className="me-1" /> Seleccionar todos ({privilegesForCurrentModule.length})
                                </Label>
                            </FormGroup>
                        )}
                    </div>

                    {/* Modificado: Iterar sobre privilegesForCurrentModule */}
                    {privilegesForCurrentModule.length > 0 ? (
                        <div className="privileges-checkbox-group">
                            <Row>
                                {privilegesForCurrentModule.map(priv => (
                                <Col xs={12} sm={6} md={4} lg={3} key={priv.key} className="mb-2"> {/* Ajustado lg */}
                                    <FormGroup check className="form-check-compact privileges-item">
                                    <Input
                                        type="checkbox"
                                        className="form-check-input"
                                        id={`priv-${currentSelectedModuleKey}-${priv.key}`}
                                        checked={currentModulePrivileges.has(priv.key)}
                                        onChange={(e) => handleCurrentPrivilegeChange(priv.key, e.target.checked)}
                                        disabled={saving || isRoleInactive}
                                    />
                                    <Label check for={`priv-${currentSelectedModuleKey}-${priv.key}`} className="form-check-label-compact">
                                        {priv.name}
                                    </Label>
                                    </FormGroup>
                                </Col>
                                ))}
                            </Row>
                        </div>
                    ) : (
                        <p className="text-muted text-center my-3 fst-italic">
                            {currentSelectedModuleKey ? "Este módulo no tiene privilegios específicos para asignar o ya han sido todos asignados." : "Seleccione un módulo para ver sus privilegios."}
                        </p>
                    )}

                    <div className="d-flex justify-content-end mt-3 border-top pt-3">
                      <Button
                        type="button"
                        color={isEditingAConfiguredModule ? "primary" : "success"}
                        size="sm"
                        onClick={handleSaveModuleConfiguration}
                        disabled={saving || isRoleInactive || !currentSelectedModuleKey || (currentModulePrivileges.size === 0 && !isEditingAConfiguredModule && privilegesForCurrentModule.length > 0) }
                        className="d-inline-flex align-items-center"
                      >
                        {addOrUpdateModuleButtonIcon}
                        {addOrUpdateModuleButtonText}
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              )}

              {!currentSelectedModuleKey && !loadingData && (
                 <Alert color="info" className="text-center mx-md-3 py-3 shadow-sm">
                    <Settings size={20} className="me-2" />
                    Seleccione un módulo de la lista superior para configurar sus permisos y privilegios.
                 </Alert>
              )}

              {configuredRoleModules.length > 0 && (
                <div className="px-md-3 mt-4">
                    <h6 className="fw-bold form-label d-flex align-items-center mb-2">
                        <ListTree size={18} className="me-2 text-success" /> Permisos Configurados para este Rol
                    </h6>
                    <div className="table-responsive permissions-table-container-compact shadow-sm border rounded"
                         style={{maxHeight: '250px'}}>
                      <Table hover striped className="mb-0 align-middle permissions-table-compact">
                        <thead className="table-light sticky-top">
                          <tr>
                            <th style={{width: '35%'}}>Módulo (Permiso)</th>
                            <th>Privilegios Asignados (Acciones)</th>
                            <th className="text-center" style={{width: '120px'}}>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {configuredRoleModules.sort((a,b) => a.moduleName.localeCompare(b.moduleName)).map(modConfig => (
                            <tr key={modConfig.moduleKey}>
                              <td className="fw-medium">{modConfig.moduleName}</td>
                              <td style={{fontSize: '0.8rem', whiteSpace: 'normal'}}>
                                {modConfig.selectedPrivileges.size > 0
                                  ? Array.from(modConfig.selectedPrivileges)
                                      // Para mostrar el nombre del privilegio, necesitamos buscarlo en backendPrivileges
                                      // que coincida con el privilegeKey Y el idPermission del módulo actual.
                                      .map(privKey => {
                                          const foundPriv = backendPrivileges.find(p =>
                                              p.idPermission === modConfig.idPermission && p.privilegeKey === privKey
                                          );
                                          return foundPriv ? foundPriv.privilegeName : privKey;
                                      })
                                      .join(', ')
                                  : <span className="text-muted fst-italic">Ninguno asignado</span>
                                }
                              </td>
                              <td className="text-center">
                                <Button
                                    color="info"
                                    outline
                                    size="sm"
                                    className="me-1 action-button p-1"
                                    onClick={() => handleEditConfiguredModule(modConfig)}
                                    disabled={saving || isRoleInactive}
                                    title="Editar Permisos de este Módulo"
                                >
                                  <Edit3 size={14} />
                                </Button>
                                <Button
                                    color="danger"
                                    outline
                                    size="sm"
                                    className="action-button p-1"
                                    onClick={() => handleRemoveModuleFromRole(modConfig.moduleKey)}
                                    disabled={saving || isRoleInactive}
                                    title="Quitar Módulo y sus Permisos"
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                </div>
              )}

              {configuredRoleModules.length === 0 && !currentSelectedModuleKey && !loadingData && (
                <Alert color="secondary" className="text-center mx-md-3 mt-4 py-3 shadow-sm">
                  <AlertTriangle size={20} className="me-2" />
                  Este rol aún no tiene permisos asignados. Comience seleccionando un módulo.
                </Alert>
              )}
            </form>
          </Container>
        )}
      </ModalBody>

      <ModalFooter className="bg-light border-top pt-2 pb-2">
        <Button color="secondary" outline type="button" onClick={toggle} disabled={saving} className="me-auto d-inline-flex align-items-center">
          <XCircle size={16} className="me-1" /> Cancelar
        </Button>
        <Button
          type="submit"
          form="permissionForm"
          color="primary"
          disabled={!canSubmitOverall}
          title={isEditingExistingRole ? 'Guardar cambios del rol y sus permisos' : 'Crear nuevo rol con estos permisos'}
          className="d-inline-flex align-items-center"
        >
          <Save size={16} className="me-1" /> {submitButtonText}
        </Button>
      </ModalFooter>
    </Modal>
  );
}