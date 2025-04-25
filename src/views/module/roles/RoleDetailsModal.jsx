import React, { useState, useEffect, useMemo } from 'react';
import {
    Modal, ModalHeader, ModalBody, ModalFooter,
    Button, Spinner, Alert, ListGroup, ListGroupItem, Badge
} from 'reactstrap';
import toast from 'react-hot-toast';

// Service Imports
import roleService from '../../services/roleServices';
import permissionService from '../../services/permissionService';
import privilegeService from '../../services/privilegeService';

const RoleDetailsModal = ({ isOpen, toggle, selectedRole }) => {
    // ... (estados y useEffect como los tenías con los logs de depuración) ...
    const [assignedData, setAssignedData] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [permissionMap, setPermissionMap] = useState({});
    const [privilegeMap, setPrivilegeMap] = useState({});

    useEffect(() => {
        // ... (toda la lógica de carga con los console.log de depuración) ...
        if (isOpen && selectedRole?.idRole) {
            console.log(`[RoleDetailsModal] Opening for role ID: ${selectedRole.idRole}`);
            setIsLoading(true);
            setError(null);
            setAssignedData({});
            setPermissionMap({});
            setPrivilegeMap({});

            let didCancel = false;

            const loadDetails = async () => {
                try {
                    console.log("[RoleDetailsModal] Fetching all base data and specific assignments...");
                    const [ basePermissions, basePrivileges, roleAssignments ] = await Promise.all([
                        permissionService.getAll(),
                        privilegeService.getAll(),
                        roleService.getRolePrivilegesByIds(selectedRole.idRole)
                    ]);

                    if (didCancel) return;
                    console.log("[RoleDetailsModal] Raw Base Permissions:", basePermissions);
                    console.log("[RoleDetailsModal] Raw Base Privileges:", basePrivileges);
                    console.log(`[RoleDetailsModal] Raw Role Assignments (for ID ${selectedRole.idRole}):`, roleAssignments);

                    const validBasePermissions = Array.isArray(basePermissions) ? basePermissions : [];
                    const validBasePrivileges = Array.isArray(basePrivileges) ? basePrivileges : [];
                    const validRoleAssignments = Array.isArray(roleAssignments) ? roleAssignments : [];

                    if (validBasePermissions.length === 0) console.warn("[RoleDetailsModal] No base permissions found or returned from API.");
                    if (validBasePrivileges.length === 0) console.warn("[RoleDetailsModal] No base privileges found or returned from API.");

                    const permMap = validBasePermissions.reduce((acc, perm) => {
                        if (perm.idPermission !== undefined) acc[perm.idPermission] = { name: perm.permissionName, key: perm.permissionKey };
                        return acc;
                    }, {});
                    const privMap = validBasePrivileges.reduce((acc, priv) => {
                         if (priv.idPrivilege !== undefined) acc[priv.idPrivilege] = { name: priv.privilegeName, key: priv.privilegeKey };
                        return acc;
                    }, {});

                    console.log("[RoleDetailsModal] Constructed Permission Map:", permMap);
                    console.log("[RoleDetailsModal] Constructed Privilege Map:", privMap);

                    setPermissionMap(permMap);
                    setPrivilegeMap(privMap);

                    console.log("[RoleDetailsModal] Processing assignments...");
                    const groupedAssignments = validRoleAssignments.reduce((acc, assignment) => {
                         console.log(` -> Processing assignment: P_ID=${assignment.idPermission}, Priv_ID=${assignment.idPrivilege}`);
                        const permInfo = permMap[assignment.idPermission];
                        const privInfo = privMap[assignment.idPrivilege];
                         console.log(`    Found in maps -> PermInfo:`, permInfo, `PrivInfo:`, privInfo);

                        if (permInfo && privInfo) {
                            const moduleName = permInfo.name || `Permiso ID ${assignment.idPermission}`;
                            const privilegeName = privInfo.name || `Privilegio ID ${assignment.idPrivilege}`;
                            if (!acc[moduleName]) acc[moduleName] = [];
                            if (!acc[moduleName].includes(privilegeName)) {
                                acc[moduleName].push(privilegeName);
                                acc[moduleName].sort();
                            }
                        } else {
                            console.warn(`[RoleDetailsModal] Mapping failed for assignment: P_ID=${assignment.idPermission}, Priv_ID=${assignment.idPrivilege}. Check if IDs exist in base permissions/privileges.`);
                        }
                        return acc;
                    }, {});

                    console.log("[RoleDetailsModal] Final Grouped assignments:", groupedAssignments);
                    setAssignedData(groupedAssignments);

                } catch (err) {
                    if (!didCancel) {
                        console.error("[RoleDetailsModal] Error loading details:", err);
                        const errorMsg = `Error al cargar los detalles: ${err.response?.data?.message || err.message}`;
                        setError(errorMsg);
                        toast.error("Error al cargar detalles del rol.");
                    }
                } finally {
                    if (!didCancel) {
                        setIsLoading(false);
                        console.log("[RoleDetailsModal] Loading finished.");
                    }
                }
            };

            loadDetails();

            return () => {
                console.log("[RoleDetailsModal] Closing or re-opening. Cancelling load.");
                didCancel = true;
            };
        }
    }, [isOpen, selectedRole?.idRole]);


    const sortedModuleNames = useMemo(() => Object.keys(assignedData).sort(), [assignedData]);

    return (
        <Modal isOpen={isOpen} toggle={toggle} centered size="lg">
            <ModalHeader toggle={toggle}>
                Detalles del Rol: <span className="fw-bold">{selectedRole?.roleName || 'N/A'}</span>
                {selectedRole && (
                    <Badge color={selectedRole.status ? "success" : "warning"} className="ms-2">
                        {selectedRole.status ? "Activo" : "Inactivo"}
                    </Badge>
                )}
            </ModalHeader>
            <ModalBody>
                {/* --- CORRECCIÓN AQUÍ --- */}
                {/* Mostrar Spinner y texto si está cargando */}
                {isLoading && (
                    <div className="text-center p-4">
                        <Spinner color="primary" />
                        <p className="mt-2 text-muted">Cargando permisos asignados...</p>
                    </div>
                )}
                {/* Mostrar Alert si hay error */}
                {error && (
                    <Alert color="danger">{error}</Alert>
                )}
                 {/* --- FIN CORRECCIÓN --- */}

                {/* Mostrar contenido solo si no está cargando y no hay error */}
                {!isLoading && !error && (
                    <>
                        <h5 className="mb-3">Permisos Asignados:</h5>
                        {Object.keys(permissionMap).length === 0 && <Alert color="warning" className="mt-2" fade={false}>No se pudieron cargar los permisos base del sistema.</Alert>}
                        {Object.keys(privilegeMap).length === 0 && <Alert color="warning" className="mt-2" fade={false}>No se pudieron cargar los privilegios base del sistema.</Alert>}

                        {sortedModuleNames.length === 0 ? (
                             (Object.keys(permissionMap).length > 0 && Object.keys(privilegeMap).length > 0) ? (
                                 <p className="fst-italic text-muted mt-2">Este rol no tiene permisos específicos asignados actualmente.</p>
                             ) : (
                                 <p className="fst-italic text-muted mt-2">No se pueden mostrar los permisos asignados debido a errores previos.</p>
                             )
                        ) : (
                            <ListGroup flush>
                                {sortedModuleNames.map(moduleName => (
                                    <ListGroupItem key={moduleName} className="px-0 py-2">
                                        <strong className="d-block mb-1">{moduleName}</strong>
                                        <div>
                                            {assignedData[moduleName].map(privilegeName => (
                                                <Badge key={privilegeName} color="info" pill className="me-1 mb-1 fw-normal">
                                                    {privilegeName}
                                                </Badge>
                                            ))}
                                        </div>
                                    </ListGroupItem>
                                ))}
                            </ListGroup>
                        )}
                    </>
                )}
            </ModalBody>
            <ModalFooter>
                <Button color="secondary" outline onClick={toggle}>
                    Cerrar
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default RoleDetailsModal;