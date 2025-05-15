import React, { useState, useEffect, useMemo } from 'react';
import {
    Modal, ModalHeader, ModalBody, ModalFooter,
    Button, Spinner, Alert, ListGroup, ListGroupItem, Badge
} from 'reactstrap';
import toast from 'react-hot-toast';
import { CheckCircle } from 'lucide-react';

import roleService from '../../services/roleServices';
import permissionService from '../../services/permissionService';
import privilegeService from '../../services/privilegeService';

const LOG_PREFIX = "[RoleDetailsModal]";
const DEBUG = process.env.NODE_ENV !== 'production';

// Función utilitaria para agrupar asignaciones por módulo
const groupAssignmentsByPermission = (assignments, permMap, privMap) => {
    return assignments.reduce((acc, assignment) => {
        const permInfo = permMap[assignment.idPermission];
        const privInfo = privMap[assignment.idPrivilege];

        if (permInfo && privInfo) {
            const moduleName = permInfo.name;
            const privilegeName = privInfo.name;
            if (!acc[moduleName]) acc[moduleName] = [];
            if (!acc[moduleName].includes(privilegeName)) {
                acc[moduleName].push(privilegeName);
                acc[moduleName].sort();
            }
        } else if (DEBUG) {
            console.warn(`${LOG_PREFIX} Mapping failed for assignment:`, assignment);
        }
        return acc;
    }, {});
};

const RoleDetailsModal = ({ isOpen, toggle, selectedRole }) => {
    const [assignedData, setAssignedData] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [permissionMap, setPermissionMap] = useState({});
    const [privilegeMap, setPrivilegeMap] = useState({});

    useEffect(() => {
        if (isOpen && selectedRole?.idRole > 0) {
            const currentRoleId = selectedRole.idRole;
            if (DEBUG) console.log(`${LOG_PREFIX} Opening modal for role ID: ${currentRoleId}`);

            setIsLoading(true);
            setError(null);
            setAssignedData({});
            setPermissionMap({});
            setPrivilegeMap({});

            let didCancel = false;

            const loadDetails = async () => {
                try {
                    const [basePermissions, basePrivileges, roleAssignments] = await Promise.all([
                        permissionService.getAll(),
                        privilegeService.getAll(),
                        roleService.getRolePrivilegesByIds(currentRoleId)
                    ]);

                    if (didCancel) return;

                    const validBasePermissions = Array.isArray(basePermissions) ? basePermissions : [];
                    const validBasePrivileges = Array.isArray(basePrivileges) ? basePrivileges : [];
                    const validRoleAssignments = Array.isArray(roleAssignments) ? roleAssignments : [];

                    const permMap = validBasePermissions.reduce((acc, perm) => {
                        if (perm?.idPermission !== undefined && perm.permissionName) {
                            acc[perm.idPermission] = {
                                name: perm.permissionName,
                                key: perm.permissionKey
                            };
                        }
                        return acc;
                    }, {});

                    const privMap = validBasePrivileges.reduce((acc, priv) => {
                        if (priv?.idPrivilege !== undefined && priv.privilegeName) {
                            acc[priv.idPrivilege] = {
                                name: priv.privilegeName,
                                key: priv.privilegeKey
                            };
                        }
                        return acc;
                    }, {});

                    setPermissionMap(permMap);
                    setPrivilegeMap(privMap);

                    const groupedAssignments = groupAssignmentsByPermission(validRoleAssignments, permMap, privMap);
                    setAssignedData(groupedAssignments);

                } catch (err) {
                    if (!didCancel) {
                        const errorMsg = `Error al cargar detalles: ${err.response?.data?.message || err.message || 'Error desconocido'}`;
                        setError(errorMsg);
                        toast.error("Error al cargar detalles del rol.");
                        if (DEBUG) console.error(`${LOG_PREFIX} Error:`, err);
                    }
                } finally {
                    if (!didCancel) {
                        setIsLoading(false);
                        if (DEBUG) console.log(`${LOG_PREFIX} Finished loading for ID ${currentRoleId}`);
                    }
                }
            };

            loadDetails();

            return () => {
                didCancel = true;
                if (DEBUG) console.log(`${LOG_PREFIX} Cleanup for role ID: ${currentRoleId}`);
            };
        } else if (isOpen) {
            setError("No se pudo cargar la información: rol no especificado o ID inválido.");
            setIsLoading(false);
            setAssignedData({});
            setPermissionMap({});
            setPrivilegeMap({});
        } else {
            // Limpiar estado cuando el modal se cierra
            setError(null);
            setIsLoading(false);
            setAssignedData({});
            setPermissionMap({});
            setPrivilegeMap({});
        }
    }, [isOpen, selectedRole]);

    const sortedModuleNames = useMemo(() => {
        return Object.keys(assignedData).sort((a, b) => a.localeCompare(b));
    }, [assignedData]);

    return (
        <Modal isOpen={isOpen} toggle={toggle} centered size="lg">
            <ModalHeader toggle={toggle} aria-label="Cerrar detalles del rol">
                Detalles del Rol: <span className="fw-bold">{selectedRole?.roleName || 'N/A'}</span>
                {selectedRole && (
                    <Badge color={selectedRole.status ? "success" : "warning"} pill className="ms-2">
                        {selectedRole.status ? "Activo" : "Inactivo"}
                    </Badge>
                )}
            </ModalHeader>

            <ModalBody>
                {isLoading && (
                    <div className="text-center p-4">
                        <Spinner color="primary" />
                        <p className="mt-2 text-muted">Cargando permisos asignados...</p>
                    </div>
                )}

                {!isLoading && error && (
                    <Alert color="danger">{error}</Alert>
                )}

                {!isLoading && !error && (
                    <>
                        <h5 className="mb-3">Permisos Asignados:</h5>
                        {sortedModuleNames.length === 0 ? (
                            <p className="fst-italic text-muted mt-2">
                                {Object.keys(permissionMap).length > 0 && Object.keys(privilegeMap).length > 0
                                    ? "Este rol no tiene permisos específicos asignados actualmente."
                                    : "No se pudieron cargar los datos base para mostrar los permisos asignados."
                                }
                            </p>
                        ) : (
                            <div className="row">
                                {sortedModuleNames.map(moduleName => (
                                    <div key={moduleName} className="col-md-6 col-lg-4 mb-3">
                                        <h6 className="fw-semibold text-uppercase mb-2" style={{ color: '#8B0000' }}>
                                            {moduleName}
                                        </h6>
                                        <ListGroup flush>
                                            {assignedData[moduleName].map(privilegeName => (
                                                <ListGroupItem key={privilegeName} className="d-flex align-items-center border-0 px-0 py-1">
                                                    <CheckCircle className="me-2 text-success flex-shrink-0" size={16} />
                                                    <span>{privilegeName}</span>
                                                </ListGroupItem>
                                            ))}
                                        </ListGroup>
                                    </div>
                                ))}
                            </div>
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
