import React, { useState, useEffect, useCallback, useMemo } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../../assets/css/App.css"; // Ajusta la ruta si es necesario
import {
    Table, Button, Container, Row, Col, Input,
    Modal, ModalHeader, ModalBody, ModalFooter, Spinner
} from "reactstrap";
import { Trash2, Edit, Plus, AlertTriangle, CheckCircle, XCircle, Eye } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

import roleService from '../../services/roleServices'; // Asegúrate que la ruta sea correcta
import CustomPagination from '../../General/CustomPagination'; // Asegúrate que la ruta sea correcta
import FormPermissions from "./FormPermissions";          // Asegúrate que la ruta sea correcta
import RoleDetailsModal from "./RoleDetailsModal";        // Asegúrate que la ruta sea correcta

const INITIAL_CONFIRM_PROPS = {
    isOpen: false,
    title: "",
    message: null,
    confirmText: "Confirmar",
    confirmColor: "primary",
    itemDetails: null,
    actionCallback: null
};
const ITEMS_PER_PAGE = 7;
const ADMIN_ROLE_ID = 1;

const RolePage = () => {
    console.log("[RolePage] Componente renderizando/re-renderizando.");
    const [data, setData] = useState([]);
    const [permissionsModalOpen, setPermissionsModalOpen] = useState(false);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectedRoleForPermissions, setSelectedRoleForPermissions] = useState(null);
    const [selectedRoleForDetails, setSelectedRoleForDetails] = useState(null);
    const [tableSearchText, setTableSearchText] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [confirmModalState, setConfirmModalState] = useState(INITIAL_CONFIRM_PROPS);
    const [isConfirmActionLoading, setIsConfirmActionLoading] = useState(false);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    const refreshData = useCallback(async (isInitialLoad = false) => {
        console.log("[RolePage] refreshData - isInitialLoad:", isInitialLoad);
        if (isInitialLoad) setIsLoading(true);
        else setIsRefreshing(true);
        try {
            const rolesResponse = await roleService.getAllRoles();
            setData(Array.isArray(rolesResponse) ? rolesResponse : []);
        } catch (error) {
            toast.error(`Error al actualizar roles: ${error.message || 'Error desconocido'}`);
            setData([]);
        } finally {
            if (isInitialLoad) { setIsLoading(false); setInitialLoadComplete(true); }
            else setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        console.log("[RolePage] useEffect[refreshData] - Montaje o refreshData cambió. Llamando a refreshData(true).");
        refreshData(true);
    }, [refreshData]);

    const handleTableSearch = useCallback((e) => {
        setTableSearchText(e.target.value);
        setCurrentPage(1);
    }, []);

    const togglePermissionsModal = useCallback(() => {
        setPermissionsModalOpen(prev => {
            if (prev) setSelectedRoleForPermissions(null);
            return !prev;
        });
    }, []);

    const toggleDetailsModal = useCallback(() => {
        setDetailsModalOpen(prev => {
            if (prev) setSelectedRoleForDetails(null);
            return !prev;
        });
    }, []);

    const toggleConfirmModal = useCallback(() => {
        console.log(`[RolePage] toggleConfirmModal llamado. isConfirmActionLoading: ${isConfirmActionLoading}, current isOpen: ${confirmModalState.isOpen}`);
        if (isConfirmActionLoading) {
            console.log("[RolePage] toggleConfirmModal - Acción de confirmación en curso, no se cierra.");
            return;
        }
        setConfirmModalState(prev => {
            const newIsOpen = !prev.isOpen;
            console.log(`[RolePage] toggleConfirmModal - setConfirmModalState. newIsOpen: ${newIsOpen}. Estado previo:`, prev);
            if (!newIsOpen) {
                setTimeout(() => {
                    console.log("[RolePage] toggleConfirmModal - Reseteando confirmModalState a INITIAL_CONFIRM_PROPS después de cerrar.");
                    setConfirmModalState(INITIAL_CONFIRM_PROPS);
                }, 300);
                return { ...prev, isOpen: false };
            }
            return { ...prev, isOpen: true };
        });
    }, [isConfirmActionLoading, confirmModalState.isOpen]);

    const prepareConfirmation = useCallback((props) => {
        console.log("[RolePage] prepareConfirmation. Props recibidas:", props);
        if (typeof props.actionCallback !== 'function') {
            console.error("[RolePage] prepareConfirmation - ERROR: actionCallback no es una función!", props.actionCallback);
            toast.error("Error interno: No se pudo preparar la acción de confirmación.");
            return;
        }
        setConfirmModalState({
            ...INITIAL_CONFIRM_PROPS,
            isOpen: true,
            title: props.title,
            message: props.message,
            confirmText: props.confirmText || "Confirmar",
            confirmColor: props.confirmColor || "primary",
            itemDetails: props.itemDetails,
            actionCallback: props.actionCallback
        });
    }, []);

    const executeConfirmation = useCallback(async () => {
        console.log("[RolePage] executeConfirmation INICIADO. Estado del modal:", JSON.parse(JSON.stringify(confirmModalState)));
        if (confirmModalState.actionCallback && typeof confirmModalState.actionCallback === 'function') {
            console.log("[RolePage] executeConfirmation - actionCallback es VÁLIDO. itemDetails:", confirmModalState.itemDetails);
            setIsConfirmActionLoading(true);
            try {
                await confirmModalState.actionCallback(confirmModalState.itemDetails);
            } catch (error) {
                // Los errores de las funciones de acción ya deberían haber mostrado un toast específico.
                // Este catch es para errores inesperados del propio actionCallback o si la acción relanza.
                console.error("[RolePage] executeConfirmation - Error capturado desde actionCallback:", error);
                // No necesitas verificar isActive aquí si el toast de la acción ya se mostró.
                // Si es un error *nuevo* aquí, muéstralo.
                // Las funciones de acción deberían manejar sus propios toasts, por lo que esto es un fallback.
                if (!(error.toastShownByAction)) { // Podrías añadir una propiedad al error si ya mostraste un toast
                    toast.error("Ocurrió un error inesperado al procesar la acción.", { id: 'generic-confirm-error' });
                } else {
                    // Si el error ya tiene un toast mostrado por la acción (ej. executeDelete),
                    // no necesitas mostrar otro genérico aquí.
                    // Solo asegúrate de que el error es relanzado por la acción para llegar aquí.
                }
            } finally {
                console.log("[RolePage] executeConfirmation - FINALLY. Reseteando isConfirmActionLoading a false.");
                setIsConfirmActionLoading(false);
            }
        } else {
            console.error("[RolePage] executeConfirmation - ERROR: No actionCallback definido o no es una función. confirmModalState.actionCallback:", confirmModalState.actionCallback);
            setIsConfirmActionLoading(false);
            setConfirmModalState(INITIAL_CONFIRM_PROPS);
        }
    }, [confirmModalState]);

    const executeChangeStatus = useCallback(async (details) => {
        console.log("[RolePage] executeChangeStatus. Details:", details);
        if (!details || details.idRole === undefined) {
             toast.error("Error interno: Faltan detalles del rol.");
             throw new Error("Faltan detalles del rol para cambiar estado.");
        }
        if (details.idRole === ADMIN_ROLE_ID && !details.newStatus) {
            toast.error("El rol de Administrador no puede ser desactivado.", { icon: <AlertTriangle className="text-warning" /> });
            toggleConfirmModal(); // Cerrar modal porque la pre-validación falló
            return; // No continuar
        }

        const { idRole, newStatus, roleName } = details;
        const actionText = newStatus ? "activado" : "desactivado";
        const toastId = toast.loading(`${newStatus ? 'Activando' : 'Desactivando'} rol "${roleName || 'N/A'}"...`);
        try {
            await roleService.changeRoleState(idRole, newStatus);
            toast.success(`Rol "${roleName || ''}" ${actionText} correctamente. ${!newStatus ? '(Usuarios asociados también podrían haber sido desactivados)' : ''}`, { id: toastId });
            await refreshData(false);
            toggleConfirmModal(); // Cerrar modal en éxito
        } catch (error) {
            console.error("[STATUS CHANGE EXEC ERROR]", error);
            toast.error(`Error al cambiar estado: ${error.response?.data?.message || error.message}`, { id: toastId, duration: 5000 });
            throw error; // Relanzar para que executeConfirmation lo sepa
        }
    }, [refreshData, toggleConfirmModal]);

    const executeDelete = useCallback(async (roleToDelete) => {
        console.log("[RolePage] executeDelete. Role:", roleToDelete);
        if (!roleToDelete || !roleToDelete.idRole) {
             toast.error("Error interno: Faltan detalles del rol a eliminar.");
             throw new Error("Faltan detalles del rol para eliminar.");
        }
        if (roleToDelete.idRole === ADMIN_ROLE_ID) {
            toast.error("El rol de Administrador no puede ser eliminado.", { icon: <AlertTriangle className="text-warning" /> });
            toggleConfirmModal(); // Cerrar modal porque la pre-validación falló
            return; // No continuar
        }

        const toastId = toast.loading(`Intentando eliminar rol "${roleToDelete.roleName || 'N/A'}"...`);
        const itemsBeforeDelete = data.length;
        try {
            await roleService.deleteRole(roleToDelete.idRole);
            toast.success(`Rol "${roleToDelete.roleName}" eliminado permanentemente.`, { id: toastId, icon: <CheckCircle className="text-success" /> });
            await refreshData(false);

            const itemsAfterDeleteAttempt = Math.max(0, itemsBeforeDelete - 1);
            const newTotalPages = Math.ceil(itemsAfterDeleteAttempt / ITEMS_PER_PAGE) || 1;
            if (currentPage > newTotalPages && newTotalPages > 0) {
                 setCurrentPage(newTotalPages);
            } else if (itemsAfterDeleteAttempt <= 0 && newTotalPages === 0) {
                 setCurrentPage(1);
            }
            toggleConfirmModal(); // Cerrar modal en éxito
        } catch (error) {
            console.error("[DELETE ROLE EXEC ERROR]", error);
            let finalMsg = error.response?.data?.errors?.[0]?.message || error.response?.data?.errors?.[0]?.msg || error.response?.data?.message || error.message || "Error desconocido al eliminar.";
            toast.error(finalMsg, { id: toastId, icon: <AlertTriangle className="text-warning" />, duration: 6000 });
            throw error; // Relanzar
        }
    }, [refreshData, toggleConfirmModal, data, currentPage]);

    const requestChangeStatusConfirmation = useCallback((role) => {
        console.log("[RolePage] requestChangeStatusConfirmation. Role:", role);
        if (!role || role.idRole === undefined) return;
        if (role.idRole === ADMIN_ROLE_ID && role.status) {
            toast.error("El rol de Administrador no puede ser desactivado.", { icon: <AlertTriangle className="text-warning" /> });
            return;
        }
        const actionText = role.status ? "desactivar" : "activar";
        const actionTextCap = actionText.charAt(0).toUpperCase() + actionText.slice(1);
        let message = <p>¿Desea <strong>{actionText}</strong> el rol <strong>{role.roleName || 'seleccionado'}</strong>?</p>;
        if (role.status) {
            message = <>{message} <p className="mt-2 mb-0 small text-muted">Si desactiva este rol, los usuarios asociados también podrían ser desactivados.</p></>;
        }
        prepareConfirmation({
            title: `Confirmar ${actionTextCap} Rol`,
            message: message,
            confirmText: `Confirmar ${actionText}`,
            confirmColor: role.status ? "warning" : "success",
            itemDetails: { idRole: role.idRole, newStatus: !role.status, roleName: role.roleName },
            actionCallback: executeChangeStatus
        });
    }, [prepareConfirmation, executeChangeStatus]);

    const requestDeleteConfirmation = useCallback((role) => {
        console.log("[RolePage] requestDeleteConfirmation. Role:", role);
        if (!role || !role.idRole) return;
        if (role.idRole === ADMIN_ROLE_ID) {
            toast.error("El rol de Administrador no puede ser eliminado.", { icon: <AlertTriangle className="text-warning" /> });
            return;
        }
        prepareConfirmation({
            title: "Confirmar Eliminación Definitiva",
            message: <>
                        <p>¿Está seguro de eliminar permanentemente el rol <strong>{role.roleName || 'N/A'}</strong>?</p>
                        <p className="mb-0">Si este rol tiene usuarios asociados, la eliminación fallará.</p>
                        <p><strong className="text-danger">¡Esta acción no se puede deshacer!</strong></p>
                     </>,
            confirmText: "Eliminar Definitivamente",
            confirmColor: "danger",
            itemDetails: { idRole: role.idRole, roleName: role.roleName },
            actionCallback: executeDelete
        });
    }, [prepareConfirmation, executeDelete]);

    const openAddModal = useCallback(() => { setSelectedRoleForPermissions(null); setPermissionsModalOpen(true); }, []);
    const openEditModal = useCallback((role) => { setSelectedRoleForPermissions(role); setPermissionsModalOpen(true); }, []);
    const openDetailsModal = useCallback((role) => { setSelectedRoleForDetails(role); setDetailsModalOpen(true); }, []);

    const filteredData = useMemo(() => {
        const search = tableSearchText.toLowerCase().trim();
        if (!search) return data || [];
        return (data || []).filter(item => (item?.roleName?.toLowerCase() ?? '').includes(search));
    }, [data, tableSearchText]);

    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
    const validCurrentPage = Math.max(1, Math.min(currentPage, totalPages));

    const currentItems = useMemo(() => {
        const startIndex = (validCurrentPage - 1) * ITEMS_PER_PAGE;
        return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredData, validCurrentPage]);

    const handlePageChange = useCallback((pageNumber) => {
        setCurrentPage(Math.max(1, Math.min(pageNumber, totalPages)));
    }, [totalPages]);

    const handlePermissionsSave = useCallback(() => {
        refreshData(false);
    }, [refreshData]);

    return (
        <Container fluid className="p-4 main-content">
            <Toaster position="top-center" toastOptions={{ duration: 3500 }} />
            <h2 className="mb-4">Gestión de Roles</h2>

            <Row className="mb-3 align-items-center">
                 <Col md={6} lg={4}>
                    <Input type="text" bsSize="sm" placeholder="Buscar por nombre de rol..."
                        value={tableSearchText} onChange={handleTableSearch}
                        disabled={isLoading || isRefreshing} aria-label="Buscar roles por nombre" />
                </Col>
                <Col md={6} lg={8} className="text-md-end mt-2 mt-md-0">
                    <Button color="success" size="sm" onClick={openAddModal}
                        disabled={isLoading || isRefreshing}>
                        <Plus size={18} className="me-1" /> Agregar Rol
                    </Button>
                </Col>
            </Row>

            <div className="table-responsive shadow-sm custom-table-container mb-3">
                <Table hover striped size="sm" className="mb-0 custom-table" aria-live="polite">
                     <thead>
                        <tr>
                            <th>ID</th><th>Nombre Rol</th><th className="text-center">Estado</th><th className="text-center" style={{ minWidth: '150px' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                         {isLoading && (
                            <tr><td colSpan="4" className="text-center p-5"><Spinner color="primary" /> Cargando roles...</td></tr>
                         )}
                         {!isLoading && data.length === 0 && initialLoadComplete && !tableSearchText && (
                            <tr><td colSpan="4" className="text-center fst-italic p-4">No hay roles registrados. Puede agregar uno nuevo.</td></tr>
                         )}
                         {!isLoading && currentItems.length > 0 && (
                            currentItems.map((item) => {
                                const isAdminRole = item.idRole === ADMIN_ROLE_ID;
                                return (
                                    <tr key={item.idRole} style={{ verticalAlign: 'middle' }}>
                                        <th scope="row">{item.idRole}</th>
                                        <td>{item.roleName || '-'}</td>
                                        <td className="text-center">
                                            <Button
                                                size="sm"
                                                className={`status-button ${item.status ? 'status-active' : 'status-inactive'}`}
                                                onClick={() => requestChangeStatusConfirmation(item)}
                                                disabled={isConfirmActionLoading || (isAdminRole && item.status)}
                                                title={ (isAdminRole && item.status) ? "El rol de Administrador no puede ser desactivado" : item.status ? "Rol Activo (Click para desactivar)" : "Rol Inactivo (Click para activar)"}
                                            >
                                                {item.status ? "Activo" : "Inactivo"}
                                            </Button>
                                        </td>
                                        <td className="text-center">
                                            <div className="d-inline-flex flex-wrap justify-content-center gap-1">
                                                <Button size="sm" color="info" outline onClick={() => openDetailsModal(item)} disabled={isConfirmActionLoading} title="Ver Detalles y Permisos" className="action-button action-view"><Eye size={18} /></Button>
                                                <Button disabled={isConfirmActionLoading} size="sm" onClick={() => openEditModal(item)} title="Editar Rol y Permisos" className="action-button action-edit"><Edit size={18} /></Button>
                                                <Button
                                                    disabled={isConfirmActionLoading || isAdminRole}
                                                    size="sm"
                                                    onClick={() => requestDeleteConfirmation(item)}
                                                    title={ isAdminRole ? "El rol de Administrador no puede ser eliminado" : "Eliminar Rol Permanentemente" }
                                                    className="action-button action-delete"
                                                >
                                                    <Trash2 size={18} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                         )}
                         {!isLoading && currentItems.length === 0 && tableSearchText && (
                             <tr><td colSpan="4" className="text-center fst-italic p-4">{`No se encontraron roles que coincidan con "${tableSearchText}".`}</td></tr>
                         )}
                         {isRefreshing && (
                              <tr><td colSpan="4" className="text-center p-2 text-muted"><Spinner size="sm" color="secondary" /> Actualizando lista...</td></tr>
                         )}
                    </tbody>
                </Table>
            </div>

            { !isLoading && totalPages > 1 && initialLoadComplete && (
                <CustomPagination currentPage={validCurrentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            )}

            {/* --- MODAL DE CONFIRMACIÓN --- */}
            <Modal isOpen={confirmModalState.isOpen} toggle={toggleConfirmModal} centered backdrop="static" keyboard={!isConfirmActionLoading}>
                <ModalHeader toggle={!isConfirmActionLoading ? toggleConfirmModal : undefined}>
                    <div className="d-flex align-items-center">
                        <AlertTriangle size={24} className={`text-${confirmModalState.confirmColor === 'danger' ? 'danger' : (confirmModalState.confirmColor === 'warning' ? 'warning' : 'primary')} me-2`} />
                        <span className="fw-bold">{confirmModalState.title || "Confirmar Acción"}</span>
                    </div>
                </ModalHeader>
                <ModalBody>{confirmModalState.message || "¿Está seguro?"}</ModalBody>
                <ModalFooter>
                    <Button color="secondary" outline onClick={toggleConfirmModal} disabled={isConfirmActionLoading}>Cancelar</Button>
                    <Button color={confirmModalState.confirmColor} onClick={executeConfirmation} disabled={isConfirmActionLoading}>
                        {isConfirmActionLoading ? (<><Spinner size="sm" className="me-1"/> Procesando...</>) : (confirmModalState.confirmText)}
                    </Button>
                </ModalFooter>
            </Modal>

            {/* --- MODAL DE PERMISOS (FormPermissions) --- */}
            {permissionsModalOpen && (
                 <FormPermissions
                     isOpen={permissionsModalOpen}
                     toggle={togglePermissionsModal}
                     onSave={handlePermissionsSave} // refreshData se llama aquí después de guardar
                     selectedRole={selectedRoleForPermissions}
                 />
             )}

            {/* --- MODAL DE DETALLES (RoleDetailsModal) --- */}
            {detailsModalOpen && (
                 <RoleDetailsModal
                     isOpen={detailsModalOpen}
                     toggle={toggleDetailsModal}
                     selectedRole={selectedRoleForDetails}
                 />
             )}
        </Container>
    );
};

export default RolePage;