import React, { useState, useEffect, useCallback, useMemo } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../../assets/css/App.css"; // Ajusta la ruta si es necesario
import {
    Table, Button, Container, Row, Col, Input,
    Modal, ModalHeader, ModalBody, ModalFooter, Spinner
} from "reactstrap";
import { Trash2, Edit, Plus, AlertTriangle, Eye } from 'lucide-react';
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
    // (El resto de los hooks y lógica se mantienen igual, no los pego aquí para brevedad)
    // ...
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
        if (!initialLoadComplete) {
            refreshData(true);
        }
    }, [refreshData, initialLoadComplete]);

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
    
    // (El resto de la lógica de modales, confirmación, y CRUD se mantiene igual)
    // ...
    const toggleConfirmModal = useCallback(() => {
        if (isConfirmActionLoading) { return; }
        setConfirmModalState(prev => {
            if (prev.isOpen) {
                setTimeout(() => setConfirmModalState(INITIAL_CONFIRM_PROPS), 300);
                return { ...prev, isOpen: false };
            }
            return { ...prev, isOpen: true };
        });
    }, [isConfirmActionLoading]);

    const prepareConfirmation = useCallback((props) => {
        if (typeof props.actionCallback !== 'function') {
            toast.error("Error interno: No se pudo preparar la acción.");
            return;
        }
        setConfirmModalState({
            ...INITIAL_CONFIRM_PROPS,
            isOpen: true,
            ...props,
        });
    }, []);

    const executeConfirmation = useCallback(async () => {
        if (confirmModalState.actionCallback && typeof confirmModalState.actionCallback === 'function') {
            setIsConfirmActionLoading(true);
            try {
                await confirmModalState.actionCallback(confirmModalState.itemDetails);
                // La acción específica maneja su propio toast y cierre de modal
            } catch (error) {
                if (!(error.toastShownByAction)) {
                    toast.error("Ocurrió un error inesperado al procesar la acción.", { id: 'generic-confirm-error' });
                }
            } finally {
                setIsConfirmActionLoading(false);
            }
        } else {
            setIsConfirmActionLoading(false);
            setConfirmModalState(INITIAL_CONFIRM_PROPS);
        }
    }, [confirmModalState]);

    const executeChangeStatus = useCallback(async (details) => {
        if (!details || details.idRole === undefined) {
             toast.error("Error interno: Faltan detalles del rol.");
             throw new Error("Faltan detalles del rol para cambiar estado.");
        }
        if (details.idRole === ADMIN_ROLE_ID && !details.newStatus) {
            toast.error("El rol de Administrador no puede ser desactivado.", { icon: <AlertTriangle className="text-warning" /> });
            toggleConfirmModal();
            return;
        }

        const { idRole, newStatus, roleName } = details;
        const actionText = newStatus ? "activado" : "desactivado";
        const toastId = toast.loading(`${newStatus ? 'Activando' : 'Desactivando'} rol "${roleName}"...`);
        try {
            await roleService.changeRoleState(idRole, newStatus);
            toast.success(`Rol "${roleName}" ${actionText} correctamente.`, { id: toastId });
            await refreshData(false);
            toggleConfirmModal();
        } catch (error) {
            toast.error(`Error al cambiar estado: ${error.response?.data?.message || error.message}`, { id: toastId, duration: 5000 });
            error.toastShownByAction = true;
            throw error;
        }
    }, [refreshData, toggleConfirmModal]);

    const executeDelete = useCallback(async (roleToDelete) => {
        if (!roleToDelete || !roleToDelete.idRole) {
             toast.error("Error interno: Faltan detalles del rol a eliminar.");
             throw new Error("Faltan detalles del rol para eliminar.");
        }
        if (roleToDelete.idRole === ADMIN_ROLE_ID) {
            toast.error("El rol de Administrador no puede ser eliminado.", { icon: <AlertTriangle className="text-warning" /> });
            toggleConfirmModal();
            return;
        }

        const toastId = toast.loading(`Eliminando rol "${roleToDelete.roleName}"...`);
        try {
            await roleService.deleteRole(roleToDelete.idRole);
            toast.success(`Rol "${roleToDelete.roleName}" eliminado permanentemente.`, { id: toastId });
            await refreshData(false);
            
            const newTotalPages = Math.ceil(Math.max(0, data.length - 1) / ITEMS_PER_PAGE) || 1;
            if (currentPage > newTotalPages) {
                 setCurrentPage(newTotalPages);
            }
            toggleConfirmModal();
        } catch (error) {
            let finalMsg = error.response?.data?.errors?.[0]?.message || error.response?.data?.message || error.message || "Error desconocido.";
            toast.error(finalMsg, { id: toastId, duration: 6000 });
            error.toastShownByAction = true;
            throw error;
        }
    }, [refreshData, toggleConfirmModal, data, currentPage]);
    
    const requestChangeStatusConfirmation = useCallback((role) => {
        if (role.idRole === ADMIN_ROLE_ID && role.status) {
            toast.error("El rol de Administrador no puede ser desactivado.", { icon: <AlertTriangle className="text-warning" /> });
            return;
        }
        const actionText = role.status ? "desactivar" : "activar";
        let message = <p>¿Desea <strong>{actionText}</strong> el rol <strong>{role.roleName}</strong>?</p>;
        if (role.status) {
            message = <>{message} <p className="mt-2 mb-0 small text-muted">Los usuarios con este rol podrían ser desactivados.</p></>;
        }
        prepareConfirmation({
            title: `Confirmar ${actionText.charAt(0).toUpperCase() + actionText.slice(1)} Rol`,
            message: message,
            confirmText: `Confirmar ${actionText}`,
            confirmColor: role.status ? "warning" : "success",
            itemDetails: { idRole: role.idRole, newStatus: !role.status, roleName: role.roleName },
            actionCallback: executeChangeStatus
        });
    }, [prepareConfirmation, executeChangeStatus]);

    const requestDeleteConfirmation = useCallback((role) => {
        if (role.idRole === ADMIN_ROLE_ID) {
            toast.error("El rol de Administrador no puede ser eliminado.", { icon: <AlertTriangle className="text-warning" /> });
            return;
        }
        prepareConfirmation({
            title: "Confirmar Eliminación Definitiva",
            message: <>
                        <p>¿Está seguro de eliminar permanentemente el rol <strong>{role.roleName}</strong>?</p>
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
    
    // <-- CAMBIO: Se crea una copia ordenada de los items a mostrar.
    const sortedItems = useMemo(() => {
        return [...currentItems].sort((a, b) => (a.idRole || 0) - (b.idRole || 0));
    }, [currentItems]);

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

            {/* <-- CAMBIO: Se aplica el estilo de la tabla de insumos --> */}
            <div className="table-responsive shadow-sm custom-table-container mb-3">
                <Table hover striped size="sm" className="mb-0 custom-table align-middle">
                     {/* <-- CAMBIO: thead con clase table-light y headers con anchos/alineación --> */}
                    <thead className="table-light">
                        <tr>
                            <th scope="col" className="text-center" style={{ width: '10%' }}>ID</th>
                            <th scope="col" style={{ width: '50%' }}>Nombre Rol</th>
                            <th scope="col" className="text-center" style={{ width: '15%' }}>Estado</th>
                            <th scope="col" className="text-center" style={{ width: '25%' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                         {isLoading && data.length === 0 && (
                            <tr><td colSpan="4" className="text-center p-5"><Spinner color="primary" /> Cargando roles...</td></tr>
                         )}
                         {!isLoading && data.length === 0 && initialLoadComplete && !tableSearchText && (
                            <tr><td colSpan="4" className="text-center fst-italic p-4">No hay roles registrados. Puede agregar uno nuevo.</td></tr>
                         )}
                         {/* <-- CAMBIO: Se itera sobre `sortedItems` en lugar de `currentItems` --> */}
                         {!isLoading && sortedItems.length > 0 && (
                            sortedItems.map((item) => {
                                const isAdminRole = item.idRole === ADMIN_ROLE_ID;
                                return (
                                    <tr key={item.idRole}>
                                        <th scope="row" className="text-center">{item.idRole}</th>
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
                                            <div className="d-inline-flex gap-1">
                                                <Button size="sm" color="dark" outline onClick={() => openDetailsModal(item)} disabled={isConfirmActionLoading} title="Ver Detalles y Permisos" className="action-button"><Eye size={18} /></Button>
                                                
                                                {/* <-- CAMBIO: Botón de editar deshabilitado para Admin y con estilo 'outline' --> */}
                                                <Button
                                                    disabled={isConfirmActionLoading || isAdminRole}
                                                    size="sm"
                                                    color="info"
                                                    outline
                                                    onClick={() => openEditModal(item)}
                                                    title={isAdminRole ? "El rol de Administrador no se puede editar" : "Editar Rol y Permisos"}
                                                    className="action-button"
                                                >
                                                    <Edit size={18} />
                                                </Button>

                                                {/* <-- CAMBIO: Botón de eliminar con estilo 'outline' --> */}
                                                <Button
                                                    disabled={isConfirmActionLoading || isAdminRole}
                                                    size="sm"
                                                    color="danger"
                                                    outline
                                                    onClick={() => requestDeleteConfirmation(item)}
                                                    title={ isAdminRole ? "El rol de Administrador no puede ser eliminado" : "Eliminar Rol Permanentemente" }
                                                    className="action-button"
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

            {/* --- MODAL DE CONFIRMACIÓN (sin cambios) --- */}
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

            {/* --- MODAL DE PERMISOS (sin cambios) --- */}
            {permissionsModalOpen && (
                 <FormPermissions
                     isOpen={permissionsModalOpen}
                     toggle={togglePermissionsModal}
                     onSave={handlePermissionsSave}
                     selectedRole={selectedRoleForPermissions}
                 />
             )}

            {/* --- MODAL DE DETALLES (sin cambios) --- */}
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