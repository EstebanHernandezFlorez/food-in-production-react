// src/components/permissions/FormPermissions.jsx

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Table, Button, FormGroup, Input, Container, Row, Col, Label,
  Modal, ModalHeader, ModalBody, ModalFooter, Spinner, Alert, Card, CardBody
} from "reactstrap";
import toast from "react-hot-toast";

// --- Lucide Icon Imports ---
import { 
  PlusCircle, Edit3, Trash2, AlertTriangle, CheckCircle, 
  XCircle, Save, CheckSquare, Settings, ListTree // Añadido ListTree para la tabla de asignados
} from 'lucide-react';

// --- Service Imports ---
// ... (sin cambios)
import roleService from '../../services/roleServices';
import permissionService from '../../services/permissionService';
import privilegeService from '../../services/privilegeService';

const LOG_PREFIX = "[FormPermissions]";

export default function FormPermissions({
  isOpen,
  toggle,
  selectedRole,
  onSave,
}) {
  // --- State ---
  // ... (sin cambios en la definición de estados)
  const [roleName, setRoleName] = useState("");
  const [backendPermissions, setBackendPermissions] = useState([]);
  const [backendPrivileges, setBackendPrivileges] = useState([]);
  const [configuredRoleModules, setConfiguredRoleModules] = useState([]);
  const [currentSelectedModuleKey, setCurrentSelectedModuleKey] = useState('');
  const [currentModulePrivileges, setCurrentModulePrivileges] = useState(new Set());
  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);


  // --- Memos & Effects ---
  // ... (sin cambios en isEditingExistingRole, isRoleInactive, maps, availableModulesForSelection, useEffect de carga)
  const isEditingExistingRole = useMemo(() => !!selectedRole?.idRole, [selectedRole]);
  const isRoleInactive = useMemo(() => isEditingExistingRole && !selectedRole?.status, [isEditingExistingRole, selectedRole]);

  const {
    permissionMap, privilegeMap, displayableModules, displayablePrivileges
  } = useMemo(() => {
    const pMap = {}; const modules = [];
    const privMap = {}; const privileges = [];
    if (Array.isArray(backendPermissions)) {
      backendPermissions.forEach(perm => {
        if (perm && typeof perm.idPermission === 'number' && perm.permissionKey && typeof perm.permissionKey === 'string') {
          const moduleKey = perm.permissionKey;
          const moduleName = perm.name || perm.permissionName || moduleKey;
          pMap[moduleKey] = perm.idPermission;
          modules.push({ key: moduleKey, name: moduleName, idPermission: perm.idPermission });
        }
      });
    }
    if (Array.isArray(backendPrivileges)) {
      backendPrivileges.forEach(priv => {
        if (priv && typeof priv.idPrivilege === 'number' && priv.privilegeKey && typeof priv.privilegeKey === 'string') {
          const privilegeKey = priv.privilegeKey;
          const privilegeName = priv.name || priv.privilegeName || privilegeKey;
          privMap[privilegeKey] = priv.idPrivilege;
          privileges.push({ key: privilegeKey, name: privilegeName, idPrivilege: priv.idPrivilege });
        }
      });
    }
    modules.sort((a, b) => a.name.localeCompare(b.name));
    privileges.sort((a, b) => a.name.localeCompare(b.name));
    return { permissionMap: pMap, privilegeMap: privMap, displayableModules: modules, displayablePrivileges: privileges };
  }, [backendPermissions, backendPrivileges]);

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
        [loadedPerms, loadedPrivs] = await Promise.all([
          permissionService.getAll().then(data => Array.isArray(data) ? data : []).catch(err => { if(signal.aborted) throw err; console.error("Perm err:", err); return []; }),
          privilegeService.getAll().then(data => Array.isArray(data) ? data : []).catch(err => { if(signal.aborted) throw err; console.error("Priv err:", err); return []; })
        ]);
        if (signal.aborted) return;
        setBackendPermissions(loadedPerms); setBackendPrivileges(loadedPrivs);

        if (isEditingExistingRole && selectedRole?.idRole) {
          try {
            const result = await roleService.getRolePrivilegesByIds(selectedRole.idRole);
            if (signal.aborted) return;
            if (Array.isArray(result)) assignmentsFromBackend = result;
            else toast.error("Err cargando asignaciones.");
          } catch (assignErr) { if (signal.aborted) return; console.error("Assign err", assignErr); toast.error("Err cargando asignaciones.");}
        }
        if (assignmentsFromBackend.length > 0 && loadedPerms.length > 0 && loadedPrivs.length > 0) {
            const tempPIdToInfo = {}; loadedPerms.forEach(p => { if (p && typeof p.idPermission === 'number' && p.permissionKey) tempPIdToInfo[p.idPermission] = { key: p.permissionKey, name: p.name || p.permissionName || p.permissionKey, idPermission: p.idPermission };});
            const tempPrivIdToKey = {}; loadedPrivs.forEach(p => { if (p && typeof p.idPrivilege === 'number' && p.privilegeKey) tempPrivIdToKey[p.idPrivilege] = p.privilegeKey; });
            const groupedByModule = {};
            assignmentsFromBackend.forEach(assignment => {
                const moduleInfo = tempPIdToInfo[assignment.idPermission]; const privilegeKey = tempPrivIdToKey[assignment.idPrivilege];
                if (moduleInfo && privilegeKey) {
                    if (!groupedByModule[moduleInfo.key]) groupedByModule[moduleInfo.key] = { moduleKey: moduleInfo.key, moduleName: moduleInfo.name, idPermission: moduleInfo.idPermission, selectedPrivileges: new Set() };
                    groupedByModule[moduleInfo.key].selectedPrivileges.add(privilegeKey);
                }
            });
            setConfiguredRoleModules(Object.values(groupedByModule));
        }
      } catch (err) { if (err.name !== 'AbortError' && !signal.aborted) { console.error("Load data err:", err); setError("Err crítico."); toast.error("Err crítico conf."); }}
      finally { if (!signal.aborted) setLoadingData(false); }
    };
    loadAndProcessData();
    return () => controller.abort();
  }, [isOpen, selectedRole?.idRole, isEditingExistingRole, selectedRole?.roleName]);


  // --- Event Handlers ---
  // ... (handleModuleSelectChange, handleCurrentPrivilegeChange, handleToggleAllPrivileges, areAllPrivilegesSelected, handleSaveModuleConfiguration, handleEditConfiguredModule, handleRemoveModuleFromRole sin cambios)
  const handleModuleSelectChange = (e) => {
    const newModuleKey = e.target.value;
    setCurrentSelectedModuleKey(newModuleKey);
    const existingConfig = configuredRoleModules.find(m => m.moduleKey === newModuleKey);
    if (existingConfig) {
        setCurrentModulePrivileges(new Set(existingConfig.selectedPrivileges));
    } else {
        setCurrentModulePrivileges(new Set());
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

  const handleToggleAllPrivileges = (isChecked) => {
    if (isChecked) {
      const allPrivilegeKeys = displayablePrivileges.map(p => p.key);
      setCurrentModulePrivileges(new Set(allPrivilegeKeys));
    } else {
      setCurrentModulePrivileges(new Set());
    }
  };

  const areAllPrivilegesSelected = useMemo(() => {
    if (!currentSelectedModuleKey || displayablePrivileges.length === 0) return false; // Añadido currentSelectedModuleKey
    return displayablePrivileges.every(priv => currentModulePrivileges.has(priv.key));
  }, [currentModulePrivileges, displayablePrivileges, currentSelectedModuleKey]);

  const handleSaveModuleConfiguration = () => {
    if (!currentSelectedModuleKey) { toast.error("Seleccione un módulo."); return; }
    const moduleData = displayableModules.find(m => m.key === currentSelectedModuleKey);
    if (!moduleData) { toast.error("Módulo no encontrado."); return; }
    setConfiguredRoleModules(prevConfigured => {
      const existingIndex = prevConfigured.findIndex(m => m.moduleKey === currentSelectedModuleKey);
      const newModuleConfig = { moduleKey: moduleData.key, moduleName: moduleData.name, idPermission: moduleData.idPermission, selectedPrivileges: new Set(currentModulePrivileges) };
      let updatedConfiguredModules;
      if (existingIndex > -1) {
        updatedConfiguredModules = [...prevConfigured]; updatedConfiguredModules[existingIndex] = newModuleConfig;
        toast.success(<span><CheckCircle size={16} className="me-1" />Privilegios para "{moduleData.name}" actualizados.</span>);
      } else {
        updatedConfiguredModules = [...prevConfigured, newModuleConfig];
        toast.success(<span><CheckCircle size={16} className="me-1" />Módulo "{moduleData.name}" agregado.</span>);
      }
      return updatedConfiguredModules;
    });
    setCurrentSelectedModuleKey(''); setCurrentModulePrivileges(new Set());
  };

  const handleEditConfiguredModule = (moduleToEdit) => {
    setCurrentSelectedModuleKey(moduleToEdit.moduleKey);
    setCurrentModulePrivileges(new Set(moduleToEdit.selectedPrivileges));
    toast.info(`Editando privilegios para ${moduleToEdit.moduleName}.`);
  };

  const handleRemoveModuleFromRole = (moduleKeyToRemove) => {
    const moduleName = configuredRoleModules.find(m => m.moduleKey === moduleKeyToRemove)?.moduleName || "El módulo";
    setConfiguredRoleModules(prev => prev.filter(m => m.moduleKey !== moduleKeyToRemove));
    toast.success(<span><Trash2 size={16} className="me-1" />{moduleName} quitado.</span>);
    if (currentSelectedModuleKey === moduleKeyToRemove) { setCurrentSelectedModuleKey(''); setCurrentModulePrivileges(new Set());}
  };


  // --- Submit Handler ---
  // ... (handleSubmit sin cambios)
  const handleSubmit = async (e) => {
    e.preventDefault(); setError(null);
    const trimmedRoleName = roleName.trim();
    if (!isEditingExistingRole && !trimmedRoleName) { toast.error("Nombre del rol requerido."); setError("Ingrese nombre."); return; }
    if (configuredRoleModules.length === 0 && !isEditingExistingRole) { toast.error("Debe asignar permisos."); setError("Agregue módulos."); return;}
    const rolePrivilegesFormatted = []; let mappingErrorOccurred = false;
    configuredRoleModules.forEach(configuredModule => {
      const idPermission = configuredModule.idPermission;
      configuredModule.selectedPrivileges.forEach(privilegeKey => {
        const idPrivilege = privilegeMap[privilegeKey];
        if (typeof idPermission === 'number' && typeof idPrivilege === 'number') rolePrivilegesFormatted.push({ idPermission, idPrivilege });
        else { console.error(`Map err: M:${configuredModule.moduleName}(${idPermission}), P:${privilegeKey}(${idPrivilege})`); mappingErrorOccurred = true; }
      });
    });
    if (mappingErrorOccurred) { setError("Err interno asignaciones."); toast.error("Err interno."); return; }
    setSaving(true);
    try {
      let successMessage = ""; let successToastMessage = "";
      if (isEditingExistingRole) {
          await roleService.assignRolePrivileges(selectedRole.idRole, rolePrivilegesFormatted);
          successMessage = `Asignaciones para "${selectedRole.roleName}" actualizadas.`;
      } else {
          const payload = { roleName: trimmedRoleName, status: 1, rolePrivileges: rolePrivilegesFormatted };
          await roleService.createRole(payload);
          successMessage = `Rol "${payload.roleName}" creado.`;
      }
      successToastMessage = <span><CheckCircle size={18} className="me-1" /> {successMessage}</span>;
      toast.success(successToastMessage);
      if (onSave) onSave();
      toggle();
    } catch (err) {
      console.error("Save err:", err.response?.data || err.message || err);
      const errorMsgFromServer = err.response?.data?.message || err.message || 'Err inesperado.';
      setError(`Err guardando: ${errorMsgFromServer}`);
      toast.error(<span><XCircle size={18} className="me-1" /> Err guardando.</span>);
    } finally { setSaving(false); }
  };


  // --- Derived State for UI ---
  // ... (canSubmitOverall, submitButtonText, currentModuleBeingConfigured, isEditingAConfiguredModule, addOrUpdateModuleButtonText, addOrUpdateModuleButtonIcon sin cambios)
  const canSubmitOverall = !loadingData && !saving && !isRoleInactive &&
                       (isEditingExistingRole || configuredRoleModules.length > 0) &&
                       (isEditingExistingRole || !!roleName.trim());
  const submitButtonText = saving ? <><Spinner size="sm" className="me-1" /> Guardando...</> : (isEditingExistingRole ? 'Guardar Cambios' : 'Crear Rol');
  const currentModuleBeingConfigured = displayableModules.find(m => m.key === currentSelectedModuleKey);
  const isEditingAConfiguredModule = configuredRoleModules.some(m => m.moduleKey === currentSelectedModuleKey);
  const addOrUpdateModuleButtonText = isEditingAConfiguredModule ? "Actualizar Módulo" : "Agregar Módulo";
  const addOrUpdateModuleButtonIcon = isEditingAConfiguredModule ? <Save size={16} className="me-1" /> : <PlusCircle size={16} className="me-1" />;


  return (
    <Modal
        isOpen={isOpen} toggle={!saving ? toggle : undefined}
        size="lg" backdrop={saving ? "static" : true} keyboard={!saving}
        className="permissions-modal-compact" centered
    >
      <ModalHeader toggle={!saving ? toggle : undefined} className="bg-light border-bottom"> {/* Estilo sutil */}
        {isEditingExistingRole ? `Editar Rol: ${selectedRole?.roleName || 'Rol'}` : "Crear Nuevo Rol"}
        {isRoleInactive && <span className="ms-2 badge bg-warning text-dark">Inactivo</span>}
      </ModalHeader>

      <ModalBody className="pb-3"> {/* Ajustado padding inferior del body */}
        {loadingData && (
          <div className="text-center py-5"><Spinner /><p className="mt-2">Cargando...</p></div>
        )}
        {error && !loadingData && (
          <Alert color="danger" className="d-flex align-items-center mb-3 py-2">
             <AlertTriangle size={20} className="me-2 flex-shrink-0" /> {error}
          </Alert>
        )}

        {!loadingData && (
          <Container fluid className="px-0">
            <form id="permissionForm" onSubmit={handleSubmit}>
              {!isEditingExistingRole && (
                <Row className="mb-3 px-3"> {/* Añadido padding lateral para esta fila */}
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

              {/* Selector de módulo (fuera del Card) */}
              <Row className="mb-3 px-3"> {/* Añadido padding lateral */}
                <Col md={6}>
                  <FormGroup>
                    <Label for="moduleSelect" className="fw-bold form-label d-flex align-items-center">
                      <Settings size={16} className="me-2 text-primary" /> Configurar Módulo
                    </Label>
                    <Input type="select" name="moduleSelect" id="moduleSelect" bsSize="sm"
                      value={currentSelectedModuleKey} onChange={handleModuleSelectChange}
                      disabled={saving || isRoleInactive || (availableModulesForSelection.length === 0 && !currentSelectedModuleKey)}
                      // className="form-select-sm" // bsSize="sm" ya lo hace
                    >
                      <option value="">-- Seleccione un módulo --</option>
                      {availableModulesForSelection.map(mod => (
                        <option key={mod.key} value={mod.key}>{mod.name}</option>
                      ))}
                    </Input>
                  </FormGroup>
                </Col>
              </Row>

              {/* Card para los privilegios del módulo seleccionado */}
              {currentSelectedModuleKey && (
                <Card className="mb-4 mx-3 shadow-sm"> {/* Añadido mx-3 para padding lateral, mb-4 para espacio abajo */}
                  <CardBody className="p-3">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="card-title fw-bold d-flex align-items-center mb-0">
                        {isEditingAConfiguredModule ? (
                            <Edit3 size={18} className="me-2 text-primary" />
                        ) : (
                            <PlusCircle size={18} className="me-2 text-success" />
                        )}
                        {isEditingAConfiguredModule 
                            ? `Editando: ${currentModuleBeingConfigured?.name}`
                            : `Privilegios para: ${currentModuleBeingConfigured?.name}`
                        }
                        </h6>
                        {/* Checkbox para seleccionar todos, alineado a la derecha */}
                        {displayablePrivileges.length > 0 && (
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
                                <CheckSquare size={14} className="me-1" /> Seleccionar todos
                                </Label>
                            </FormGroup>
                        )}
                    </div>
                    
                    {displayablePrivileges.length > 0 ? (
                        // Lista de privilegios
                        <div className="privileges-checkbox-group border-top pt-3">
                            <Row>
                                {displayablePrivileges.map(priv => (
                                <Col xs={12} sm={6} md={4} key={priv.key} className="mb-2">
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
                        <p className="text-muted text-center my-3">Este módulo no tiene privilegios configurables.</p>
                    )}
                    
                    {/* Botón para agregar/actualizar módulo */}
                    <div className="d-flex justify-content-end mt-3 border-top pt-3">
                      <Button 
                        type="button" 
                        color={isEditingAConfiguredModule ? "primary" : "success"} 
                        size="sm"
                        onClick={handleSaveModuleConfiguration}
                        disabled={saving || isRoleInactive || !currentSelectedModuleKey || (currentModulePrivileges.size === 0 && !isEditingAConfiguredModule)}
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
                 <Alert color="info" className="text-center mx-3 py-3">
                    <Settings size={20} className="me-2" />
                    Seleccione un módulo de la lista superior para configurar sus permisos.
                 </Alert>
              )}


              {/* Tabla de módulos configurados (FUERA DEL CARD ANTERIOR) */}
              {configuredRoleModules.length > 0 && (
                <div className="px-3 mt-4"> {/* Padding lateral y margen superior */}
                    <h6 className="fw-bold form-label d-flex align-items-center mb-2">
                        <ListTree size={18} className="me-2 text-success" /> Permisos Ya Asignados al Rol
                    </h6>
                    <div className="table-responsive permissions-table-container-compact shadow-sm border rounded" 
                         style={{maxHeight: '250px'}}> {/* Aumentada un poco la altura */}
                      <Table hover striped className="mb-0 align-middle permissions-table-compact">
                        <thead className="table-light sticky-top">
                          <tr>
                            <th style={{width: '40%'}}>Módulo</th>
                            <th>Privilegios Asignados</th>
                            <th className="text-center" style={{width: '100px'}}>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {configuredRoleModules.sort((a,b) => a.moduleName.localeCompare(b.moduleName)).map(modConfig => (
                            <tr key={modConfig.moduleKey}>
                              <td className="fw-medium">{modConfig.moduleName}</td>
                              <td style={{fontSize: '0.8rem', whiteSpace: 'normal'}}>
                                {modConfig.selectedPrivileges.size > 0
                                  ? Array.from(modConfig.selectedPrivileges)
                                      .map(privKey => displayablePrivileges.find(p => p.key === privKey)?.name || privKey)
                                      .join(', ')
                                  : <span className="text-muted fst-italic">Ninguno asignado</span>
                                }
                              </td>
                              <td className="text-center">
                                {/* Estilo de botones de acción similar a RolePage */}
                                <Button 
                                    color="info" 
                                    outline 
                                    size="sm" 
                                    className="me-1 action-button p-1" // p-1 para padding más pequeño
                                    onClick={() => handleEditConfiguredModule(modConfig)}
                                    disabled={saving || isRoleInactive} 
                                    title="Editar Permisos"
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
                                    title="Quitar Módulo"
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
              
              {/* Mensaje si no hay módulos configurados y no se está editando uno */}
              {configuredRoleModules.length === 0 && !currentSelectedModuleKey && !loadingData && (
                <Alert color="secondary" className="text-center mx-3 mt-4 py-3">
                  <AlertTriangle size={20} className="me-2" />
                  Este rol aún no tiene permisos asignados.
                </Alert>
              )}

            </form>
          </Container>
        )}
      </ModalBody>
      
      <ModalFooter className="bg-light border-top pt-2 pb-2"> {/* Padding ajustado */}
        <Button color="secondary" outline type="button" onClick={toggle} disabled={saving} className="me-auto d-inline-flex align-items-center">
          <XCircle size={16} className="me-1" /> Cancelar
        </Button>
        <Button 
          type="submit" 
          form="permissionForm" 
          color="primary" // Cambiado a primary para el botón principal de guardado
          disabled={!canSubmitOverall}
          title={isEditingExistingRole ? 'Guardar cambios del rol' : 'Crear nuevo rol'}
          className="d-inline-flex align-items-center"
        >
          <Save size={16} className="me-1" /> {submitButtonText}
        </Button>
      </ModalFooter>
    </Modal>
  );
}