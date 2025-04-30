/**
 * RolePage.jsx
 * Componente principal para la gestión de Roles.
 * Muestra una tabla de roles, permite buscar, paginar, agregar,
 * editar (permisos), ver detalles (permisos asignados), cambiar estado y eliminar roles.
 */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../../assets/css/App.css"; // Ajusta la ruta si es necesario (para estilos globales)
import {
    Table, Button, Container, Row, Col, Input,
    Modal, ModalHeader, ModalBody, ModalFooter, Spinner
} from "reactstrap";
import { Trash2, Edit, Plus, AlertTriangle, CheckCircle, XCircle, Eye } from 'lucide-react'; // Iconos
import toast, { Toaster } from 'react-hot-toast'; // Notificaciones

// --- Service Imports ---
import roleService from '../../services/roleServices'; // Servicio para API de Roles

// --- Reusable Components ---
import CustomPagination from '../../General/CustomPagination'; // Componente de paginación
import FormPermissions from "./FormPermissions";          // Modal para Crear/Editar Rol y asignar permisos
import RoleDetailsModal from "./RoleDetailsModal";        // Modal para Ver Detalles del Rol y sus permisos

// --- Constants ---
const INITIAL_CONFIRM_PROPS = {
    isOpen: false,
    title: "",
    message: null,
    confirmText: "Confirmar",
    confirmColor: "primary",
    itemDetails: null,
    actionCallback: null
};
const ITEMS_PER_PAGE = 7; // Número de roles por página

// --- Main Component ---
const RolePage = () => {
    // --- State ---
    const [data, setData] = useState([]); // Lista de todos los roles obtenidos de la API
    const [permissionsModalOpen, setPermissionsModalOpen] = useState(false); // Visibilidad modal Crear/Editar
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);         // Visibilidad modal Ver Detalles
    const [selectedRoleForPermissions, setSelectedRoleForPermissions] = useState(null); // Rol para Crear(null)/Editar
    const [selectedRoleForDetails, setSelectedRoleForDetails] = useState(null);          // Rol para Ver Detalles
    const [tableSearchText, setTableSearchText] = useState("");                // Texto de búsqueda
    const [isLoading, setIsLoading] = useState(true);                          // Indicador de carga (general o refresh)
    const [currentPage, setCurrentPage] = useState(1);                         // Página actual de la tabla
    const [confirmModalState, setConfirmModalState] = useState(INITIAL_CONFIRM_PROPS); // Estado del modal de confirmación
    const [isConfirmActionLoading, setIsConfirmActionLoading] = useState(false); // Indicador de carga para acciones de confirmación
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);     // Flag para saber si la carga inicial ya terminó

    // --- Fetch Roles ---
    const refreshData = useCallback(async (showSpinner = true) => {
        // Mostrar spinner grande solo en la carga inicial
        // Leer el valor MÁS RECIENTE de initialLoadComplete directamente aquí
        if (showSpinner && !initialLoadComplete) setIsLoading(true);
        // Mostrar indicador de carga más pequeño para refresh
        else if (showSpinner) setIsLoading(true);

        console.log("[REFRESH ROLES] Refreshing role data...");
        try {
            const rolesResponse = await roleService.getAllRoles();
            setData(Array.isArray(rolesResponse) ? rolesResponse : []);
            // Solo actualiza initialLoadComplete si aún no está completo
            // Necesitamos leer el estado *anterior* para esta lógica
            if (!initialLoadComplete) {
                 setInitialLoadComplete(true);
            }
            console.log("[REFRESH ROLES] Roles state set.");
        } catch (error) {
            console.error("[REFRESH ROLES ERROR]", error);
            toast.error(`Error al actualizar roles: ${error.response?.data?.message || error.message}`);
             // Actualiza incluso si hay error para evitar bloqueos
             // Necesitamos leer el estado *anterior* para esta lógica
            if (!initialLoadComplete) {
                setInitialLoadComplete(true);
            }
        } finally {
             setIsLoading(false);
            console.log("[REFRESH ROLES] Finished.");
        }
    // --- CORREGIDO: Eliminar 'initialLoadComplete' de las dependencias ---
    // Solo depende de initialLoadComplete LEÍDO DENTRO de la función, no como dependencia de useCallback
    }, [initialLoadComplete]); // Ahora refreshData solo cambia si initialLoadComplete cambia (o se podría quitar también si no se usa para lógica de dependencias)

    // Efecto para la carga inicial de datos al montar el componente
    useEffect(() => {
        refreshData(true);
     // Ya no depende de refreshData como tal, sino de su ejecución inicial
     // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Ejecutar solo una vez al montar

    // --- Event Handlers ---
    const handleTableSearch = useCallback((e) => {
        setTableSearchText(e.target.value);
        setCurrentPage(1); // Resetear a la página 1 al buscar
    }, []);

    // --- Modal Toggles ---
    const togglePermissionsModal = useCallback(() => {
        const closing = permissionsModalOpen;
        setPermissionsModalOpen(prev => !prev);
        if (closing) {
            setSelectedRoleForPermissions(null);
        }
    }, [permissionsModalOpen]);

    const toggleDetailsModal = useCallback(() => {
        const closing = detailsModalOpen;
        setDetailsModalOpen(prev => !prev);
        if (closing) {
            setSelectedRoleForDetails(null);
        }
    }, [detailsModalOpen]);

    const toggleConfirmModal = useCallback(() => {
        if (isConfirmActionLoading) return;
        const wasOpen = confirmModalState.isOpen;
        setConfirmModalState(prev => ({ ...prev, isOpen: !prev.isOpen }));
        if (wasOpen) {
             setTimeout(() => setConfirmModalState(INITIAL_CONFIRM_PROPS), 300);
        }
    }, [isConfirmActionLoading, confirmModalState.isOpen]);

    // --- Confirmation Logic ---
    const prepareConfirmation = useCallback((actionCallback, props) => {
        setConfirmModalState({
            isOpen: true,
            title: props.title,
            message: props.message,
            confirmText: props.confirmText || "Confirmar",
            confirmColor: props.confirmColor || "primary",
            itemDetails: props.itemDetails,
            actionCallback: actionCallback
        });
    }, []);

    const executeConfirmation = useCallback(async () => {
        if (confirmModalState.actionCallback && typeof confirmModalState.actionCallback === 'function') {
            setIsConfirmActionLoading(true);
            try {
                await confirmModalState.actionCallback(confirmModalState.itemDetails);
            } catch (error) {
                console.error("Error durante la ejecución de la acción confirmada:", error);
                 setIsConfirmActionLoading(false); // Asegurar quitar loading si callback falla antes del finally
            }
            // El finally está en el callback de acción (executeChangeStatus/executeDelete)
        } else {
            console.error("No actionCallback definido para confirmar.");
            toggleConfirmModal();
        }
    }, [confirmModalState, toggleConfirmModal]);

    // --- CRUD Operations Callbacks ---
    const executeChangeStatus = useCallback(async (details) => {
        if (!details || details.idRole === undefined) {
             toast.error("Error interno: Faltan detalles del rol.");
             setIsConfirmActionLoading(false);
             toggleConfirmModal();
             return;
        }
        const { idRole, newStatus, roleName } = details;
        const actionText = newStatus ? "activado" : "desactivado";
        const toastId = toast.loading(`${newStatus ? 'Activando' : 'Desactivando'} rol "${roleName || 'N/A'}"...`);

        try {
            await roleService.changeRoleState(idRole, newStatus);
            toast.success(`Rol "${roleName || ''}" ${actionText} correctamente.`, { id: toastId });
            await refreshData(false);
        } catch (error) {
            console.error("[STATUS CHANGE EXEC ERROR]", error);
            toast.error(`Error al cambiar estado: ${error.response?.data?.message || error.message}`, { id: toastId });
        } finally {
             setIsConfirmActionLoading(false);
             toggleConfirmModal();
        }
    }, [refreshData, toggleConfirmModal]);

    const executeDelete = useCallback(async (roleToDelete) => {
        if (!roleToDelete || !roleToDelete.idRole) {
             toast.error("Error interno: Faltan detalles del rol a eliminar.");
             setIsConfirmActionLoading(false);
             toggleConfirmModal();
             return;
        }
        const toastId = toast.loading(`Eliminando rol "${roleToDelete.roleName || 'N/A'}"...`);
        const itemsBeforeDelete = data.length; // Guardar longitud ANTES de eliminar

        try {
            await roleService.deleteRole(roleToDelete.idRole);
            toast.success(`Rol "${roleToDelete.roleName}" eliminado permanentemente.`, { id: toastId, icon: <CheckCircle className="text-success" /> });
             await refreshData(false);

             // Ajustar paginación
             const itemsAfterDeleteAttempt = itemsBeforeDelete - 1;
             const newTotalPages = Math.ceil(itemsAfterDeleteAttempt / ITEMS_PER_PAGE);

             if (currentPage > newTotalPages && newTotalPages > 0) {
                 setCurrentPage(newTotalPages);
             } else if (itemsAfterDeleteAttempt <= 0) {
                 setCurrentPage(1);
             }

        } catch (error) {
            console.error("[DELETE ROLE EXEC ERROR]", error);
            const errorMsg = error.response?.data?.message || error.message || "Error desconocido.";
            let finalMsg = `Error al eliminar rol "${roleToDelete.roleName}": ${errorMsg}`;
            if (errorMsg.includes('usuarios asociados') || error.response?.status === 409) {
                 finalMsg = `No se puede eliminar "${roleToDelete.roleName}": tiene usuarios asociados.`;
            }
            toast.error(finalMsg, { id: toastId, icon: <XCircle className="text-danger" /> });
        } finally {
            setIsConfirmActionLoading(false);
            toggleConfirmModal();
        }
    // --- CORREGIDO: Quitar refreshData de dependencias si no causa bucles, mantener data y currentPage ---
    }, [toggleConfirmModal, data, currentPage]); // Quitar refreshData si causa bucles, ya que se llama dentro

    // --- Preparación de Modales de Confirmación ---
    const requestChangeStatusConfirmation = useCallback((role) => {
        if (!role || role.idRole === undefined) return;
        const { idRole, status: currentStatus, roleName } = role;
        const actionText = currentStatus ? "desactivar" : "activar";
        prepareConfirmation(executeChangeStatus, {
            title: `Confirmar ${actionText.charAt(0).toUpperCase() + actionText.slice(1)} Rol`,
            message: <p>¿Desea <strong>{actionText}</strong> el rol <strong>{roleName || 'seleccionado'}</strong>?</p>,
            confirmText: `Confirmar ${actionText}`,
            confirmColor: currentStatus ? "warning" : "success",
            itemDetails: { idRole, newStatus: !currentStatus, roleName }
        });
    }, [prepareConfirmation, executeChangeStatus]);

    const requestDeleteConfirmation = useCallback((role) => {
        if (!role || !role.idRole) return;
        prepareConfirmation(executeDelete, {
            title: "Confirmar Eliminación Definitiva",
            message: <>
                        <p>¿Está seguro de eliminar permanentemente el rol <strong>{role.roleName || 'N/A'}</strong>?</p>
                        <p><strong className="text-danger">¡Esta acción no se puede deshacer!</strong></p> {/* Mensaje simplificado */}
                     </>,
            confirmText: "Eliminar Definitivamente",
            confirmColor: "danger",
            itemDetails: { idRole: role.idRole, roleName: role.roleName }
        });
    }, [prepareConfirmation, executeDelete]);

    // --- Abrir Modales Principales ---
    const openAddModal = useCallback(() => {
        setSelectedRoleForPermissions(null);
        setPermissionsModalOpen(true);
    }, []);

    const openEditModal = useCallback((role) => {
        setSelectedRoleForPermissions(role);
        setPermissionsModalOpen(true);
    }, []);

    const openDetailsModal = useCallback((role) => {
        setSelectedRoleForDetails(role);
        setDetailsModalOpen(true);
    }, []);

    // --- Lógica de Filtrado y Paginación ---
    const filteredData = useMemo(() => {
        const search = tableSearchText.toLowerCase().trim();
        if (!search) return data;
        return data.filter(item => (item?.roleName?.toLowerCase() ?? '').includes(search));
    }, [data, tableSearchText]);

    const totalItems = useMemo(() => filteredData.length, [filteredData]);
    const totalPages = useMemo(() => Math.ceil(totalItems / ITEMS_PER_PAGE), [totalItems]);
    const validCurrentPage = useMemo(() => Math.max(1, Math.min(currentPage, totalPages || 1)), [currentPage, totalPages]);

    const currentItems = useMemo(() => {
        const startIndex = (validCurrentPage - 1) * ITEMS_PER_PAGE;
        return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredData, validCurrentPage]);

    const handlePageChange = useCallback((pageNumber) => {
        setCurrentPage(Math.max(1, Math.min(pageNumber, totalPages || 1)));
    }, [totalPages]);

    // --- Callback para después de Guardar en FormPermissions ---
     const handlePermissionsSave = useCallback(() => {
        refreshData(false);
    // --- CORREGIDO: Quitar refreshData de dependencias si no causa bucles ---
    }, []); // Quitar refreshData si causa bucles

    // --- Renderizado del Componente ---
    return (
        <Container fluid className="p-4 main-content">
            <Toaster position="top-center" toastOptions={{ duration: 3500 }} />
            <h2 className="mb-4">Gestión de Roles</h2>

             {/* --- Barra de Búsqueda y Botón Agregar --- */}
            <Row className="mb-3 align-items-center">
                 <Col md={6} lg={4}>
                    <Input type="text" bsSize="sm" placeholder="Buscar por nombre de rol..."
                        value={tableSearchText} onChange={handleTableSearch}
                        disabled={isLoading && !initialLoadComplete} aria-label="Buscar roles por nombre" />
                </Col>
                <Col md={6} lg={8} className="text-md-end mt-2 mt-md-0">
                    <Button color="success" size="sm" onClick={openAddModal}
                        disabled={isLoading && !initialLoadComplete}>
                        <Plus size={18} className="me-1" /> Agregar Rol
                    </Button>
                </Col>
            </Row>

            {/* --- Tabla de Roles --- */}
            <div className="table-responsive shadow-sm custom-table-container mb-3">
                <Table hover striped size="sm" className="mb-0 custom-table" aria-live="polite">
                     <thead>
                        <tr>
                            <th>ID</th><th>Nombre Rol</th><th className="text-center">Estado</th><th className="text-center" style={{ minWidth: '120px' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                         {/* Estado: Carga Inicial */}
                         {isLoading && !initialLoadComplete && (
                            <tr><td colSpan="4" className="text-center p-5"><Spinner color="primary" /> Cargando roles...</td></tr>
                         )}
                         {/* Estado: Sin Datos (después de carga inicial) */}
                         {!isLoading && data.length === 0 && initialLoadComplete && !tableSearchText && (
                            <tr><td colSpan="4" className="text-center fst-italic p-4">No hay roles registrados. Puede agregar uno nuevo.</td></tr>
                         )}
                         {/* Estado: Mostrando Datos */}
                         {!isLoading && currentItems.length > 0 && (
                            currentItems.map((item) => (
                                <tr key={item.idRole} style={{ verticalAlign: 'middle' }}>
                                    <th scope="row">{item.idRole}</th>
                                    <td>{item.roleName || '-'}</td>
                                    <td className="text-center">
                                        <Button size="sm" className={`status-button ${item.status ? 'status-active' : 'status-inactive'}`}
                                            onClick={() => requestChangeStatusConfirmation(item)} disabled={isConfirmActionLoading}
                                            title={item.status ? "Rol Activo (Click para desactivar)" : "Rol Inactivo (Click para activar)"}>
                                            {item.status ? "Activo" : "Inactivo"}
                                        </Button>
                                    </td>
                                    <td className="text-center">
                                        <div className="d-inline-flex flex-wrap justify-content-center gap-1">
                                            <Button size="sm" color="info" outline onClick={() => openDetailsModal(item)}
                                                disabled={isConfirmActionLoading} title="Ver Detalles y Permisos" className="action-button action-view">
                                                <Eye size={18} />
                                            </Button>
                                            <Button disabled={isConfirmActionLoading} size="sm" onClick={() => openEditModal(item)}
                                                title="Editar Rol y Permisos" className="action-button action-edit">
                                                <Edit size={18} />
                                            </Button>
                                            <Button disabled={isConfirmActionLoading || !item.status} size="sm"
                                                onClick={() => requestDeleteConfirmation(item)}
                                                title={item.status ? "Eliminar Rol Permanentemente" : "No se puede eliminar un rol inactivo"}
                                                className="action-button action-delete">
                                                <Trash2 size={18} />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                         )}
                         {/* Estado: Búsqueda sin resultados */}
                         {!isLoading && currentItems.length === 0 && tableSearchText && (
                             <tr><td colSpan="4" className="text-center fst-italic p-4">{`No se encontraron roles que coincidan con "${tableSearchText}".`}</td></tr>
                         )}
                         {/* Estado: Indicador durante Refresh */}
                         {isLoading && initialLoadComplete && (
                              <tr><td colSpan="4" className="text-center p-2 text-muted"><Spinner size="sm" color="secondary" /> Actualizando lista...</td></tr>
                         )}
                    </tbody>
                </Table>
            </div>

            {/* --- Paginación --- */}
            { totalPages > 1 && initialLoadComplete && !isLoading && (
                <CustomPagination currentPage={validCurrentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            )}

            {/* --- Modal de Confirmación Genérico --- */}
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

            {/* --- Modal de Permisos (Crear/Editar Rol) --- */}
             {permissionsModalOpen && (
                 <FormPermissions
                     isOpen={permissionsModalOpen}
                     toggle={togglePermissionsModal}
                     onSave={handlePermissionsSave}
                     selectedRole={selectedRoleForPermissions}
                 />
             )}

            {/* --- Modal de Detalles (Ver Rol) --- */}
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