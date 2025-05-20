// src/components/roles/RoleDetailsModal.jsx (o donde lo tengas)
import React, { useState, useEffect, useMemo } from 'react';
import {
    Modal, ModalHeader, ModalBody, ModalFooter,
    Button, Spinner, Alert, ListGroup, ListGroupItem, Badge,
    Card, CardBody, CardTitle // Añadido Card, CardBody, CardTitle
} from 'reactstrap';
import toast from 'react-hot-toast';
import { CheckCircle, ListChecks } from 'lucide-react'; // Añadido ListChecks para el título de la Card

import roleService from '../../services/roleServices'; // Corregido: roleService (no roleServices)
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
                acc[moduleName].sort(); // Ordenar privilegios alfabéticamente
            }
        } else if (DEBUG) {
            console.warn(`${LOG_PREFIX} Mapping failed for assignment:`, assignment, { permInfo, privInfo });
        }
        return acc;
    }, {});
};

const RoleDetailsModal = ({ isOpen, toggle, selectedRole }) => {
    const [assignedData, setAssignedData] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    // Los mapas ahora solo almacenan la información necesaria
    const [permissionMap, setPermissionMap] = useState({}); // { idPermission: { name, key } }
    const [privilegeMap, setPrivilegeMap] = useState({});   // { idPrivilege: { name, key } }

    useEffect(() => {
        if (isOpen && selectedRole?.idRole > 0) {
            const currentRoleId = selectedRole.idRole;
            if (DEBUG) console.log(`${LOG_PREFIX} Opening modal for role ID: ${currentRoleId}`);

            setIsLoading(true);
            setError(null);
            setAssignedData({}); // Limpiar datos anteriores
            setPermissionMap({});
            setPrivilegeMap({});

            let didCancel = false;

            const loadDetails = async () => {
                try {
                    const [basePermissions, basePrivileges, roleAssignments] = await Promise.all([
                        permissionService.getAll(),
                        privilegeService.getAll(),
                        roleService.getRolePrivilegeAssignments(currentRoleId) // Devuelve [{idPermission, idPrivilege}, ...]
                    ]);

                    if (didCancel) return;

                    const validBasePermissions = Array.isArray(basePermissions) ? basePermissions : [];
                    const validBasePrivileges = Array.isArray(basePrivileges) ? basePrivileges : [];
                    const validRoleAssignments = Array.isArray(roleAssignments) ? roleAssignments : [];

                    if (DEBUG) {
                        console.log(`${LOG_PREFIX} Loaded basePermissions count: ${validBasePermissions.length}`);
                        console.log(`${LOG_PREFIX} Loaded basePrivileges count: ${validBasePrivileges.length}`);
                        console.log(`${LOG_PREFIX} Loaded roleAssignments count: ${validRoleAssignments.length} for role ${currentRoleId}`);
                    }

                    const pMap = validBasePermissions.reduce((acc, perm) => {
                        if (perm?.idPermission !== undefined && (perm.permissionName || perm.permissionKey)) {
                            acc[perm.idPermission] = {
                                name: perm.permissionName || perm.permissionKey, // Usar permissionName o key como fallback
                                key: perm.permissionKey
                            };
                        }
                        return acc;
                    }, {});

                    const privMap = validBasePrivileges.reduce((acc, priv) => {
                        if (priv?.idPrivilege !== undefined && (priv.privilegeName || priv.privilegeKey)) {
                            acc[priv.idPrivilege] = {
                                name: priv.privilegeName || priv.privilegeKey, // Usar privilegeName o key como fallback
                                key: priv.privilegeKey
                            };
                        }
                        return acc;
                    }, {});

                    setPermissionMap(pMap);
                    setPrivilegeMap(privMap);

                    if (validRoleAssignments.length > 0) {
                        const groupedAssignments = groupAssignmentsByPermission(validRoleAssignments, pMap, privMap);
                        setAssignedData(groupedAssignments);
                        if (DEBUG) console.log(`${LOG_PREFIX} Grouped assignments:`, groupedAssignments);
                    } else {
                        setAssignedData({}); // Asegurar que esté vacío si no hay asignaciones
                        if (DEBUG) console.log(`${LOG_PREFIX} No role assignments found or processed for role ${currentRoleId}.`);
                    }

                } catch (err) {
                    if (!didCancel) {
                        const errorMsg = `Error al cargar detalles: ${err.response?.data?.message || err.message || 'Error desconocido'}`;
                        setError(errorMsg);
                        toast.error("Error al cargar detalles del rol.");
                        if (DEBUG) console.error(`${LOG_PREFIX} Error loading details:`, err);
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
        } else if (isOpen && !(selectedRole?.idRole > 0)) {
            setError("No se pudo cargar la información: rol no especificado o ID inválido.");
            setIsLoading(false);
            setAssignedData({});
            setPermissionMap({});
            setPrivilegeMap({});
            if (DEBUG) console.warn(`${LOG_PREFIX} Modal opened with invalid/missing selectedRole:`, selectedRole);
        } else if (!isOpen) {
            // Limpiar estado cuando el modal se cierra explícitamente
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
        <Modal isOpen={isOpen} toggle={toggle} centered size="lg" scrollable> {/* Añadido scrollable por si hay muchas cards */}
            <ModalHeader toggle={toggle} className="bg-light" aria-label="Cerrar detalles del rol">
                Detalles del Rol: <span className="fw-bold">{selectedRole?.roleName || 'N/A'}</span>
                {selectedRole && (
                    <Badge color={selectedRole.status ? "success" : "warning"} pill className="ms-2 align-middle">
                        {selectedRole.status ? "Activo" : "Inactivo"}
                    </Badge>
                )}
            </ModalHeader>

            <ModalBody>
                {isLoading && (
                    <div className="text-center p-4">
                        <Spinner color="primary" style={{ width: '3rem', height: '3rem' }}/>
                        <p className="mt-3 text-muted lead">Cargando permisos asignados...</p>
                    </div>
                )}

                {!isLoading && error && (
                    <Alert color="danger" className="shadow-sm">
                        <h5 className="alert-heading">Error</h5>
                        <p>{error}</p>
                    </Alert>
                )}

                {!isLoading && !error && (
                    <>
                        <h5 className="mb-3">
                            <ListChecks size={22} className="me-2 align-text-bottom" />
                            Permisos Asignados
                        </h5>
                        {sortedModuleNames.length === 0 ? (
                            <div className="text-center p-4 border rounded bg-light">
                                <p className="fst-italic text-muted mt-2 mb-0">
                                    {Object.keys(permissionMap).length > 0 && Object.keys(privilegeMap).length > 0
                                        ? "Este rol no tiene permisos específicos asignados actualmente."
                                        : "No se pudieron cargar los datos base de permisos/privilegios para mostrar las asignaciones."
                                    }
                                </p>
                            </div>
                        ) : (
                            <div className="row g-3"> {/* g-3 para gutter (espacio) entre cards */}
                                {sortedModuleNames.map(moduleName => (
                                    <div key={moduleName} className="col-md-6 col-lg-4">
                                        <Card className="h-100 shadow-sm"> {/* h-100 para igualar alturas si es posible */}
                                            <CardBody>
                                                <CardTitle tag="h6" className="mb-3 text-primary border-bottom pb-2">
                                                    {moduleName}
                                                </CardTitle>
                                                {assignedData[moduleName] && assignedData[moduleName].length > 0 ? (
                                                    <ListGroup flush className="permission-privilege-list">
                                                        {assignedData[moduleName].map(privilegeName => (
                                                            <ListGroupItem key={privilegeName} className="d-flex align-items-center border-0 px-0 py-1">
                                                                <CheckCircle className="me-2 text-success flex-shrink-0" size={16} />
                                                                <span className="text-dark" style={{ fontSize: '0.9rem' }}>{privilegeName}</span>
                                                            </ListGroupItem>
                                                        ))}
                                                    </ListGroup>
                                                ) : (
                                                    <p className="text-muted small fst-italic mb-0">No hay privilegios específicos para este módulo.</p>
                                                )}
                                            </CardBody>
                                        </Card>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </ModalBody>

            <ModalFooter className="bg-light">
                <Button color="secondary" outline onClick={toggle}>
                    Cerrar
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default RoleDetailsModal;