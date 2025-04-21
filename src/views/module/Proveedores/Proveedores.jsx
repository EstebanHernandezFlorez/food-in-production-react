import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../../App.css"; // Asegúrate que la ruta es correcta
import {
    Table, Button, Container, Row, Col, Form, FormGroup, Input, Label,
    Modal, ModalHeader, ModalBody, ModalFooter, Spinner,
} from "reactstrap";
import { Trash2, Edit, Plus, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// --- Service Import ---
import proveedorService from '../../services/proveedorSevice'; // Corrige ruta/nombre si es necesario

// --- Reusable Components ---
import CustomPagination from '../../General/CustomPagination';
import FondoForm from "../../../assets/login.jpg"; // Asegúrate que la ruta es correcta

// --- Confirmation Modal Component (sin cambios) ---
const ConfirmationModal = ({ isOpen, toggle, title, children, onConfirm, confirmText = "Confirmar", confirmColor = "primary", isConfirming = false }) => (
    <Modal isOpen={isOpen} toggle={!isConfirming ? toggle : undefined} centered backdrop="static" keyboard={!isConfirming}>
        <ModalHeader toggle={!isConfirming ? toggle : undefined}>
             <div className="d-flex align-items-center">
                <AlertTriangle size={24} className={`text-${confirmColor === 'danger' ? 'danger' : (confirmColor === 'warning' ? 'warning' : 'primary')} me-2`} />
                <span className="fw-bold">{title}</span>
            </div>
        </ModalHeader>
        <ModalBody>
            {children}
        </ModalBody>
        <ModalFooter>
            <Button color="secondary" outline onClick={toggle} disabled={isConfirming}>
                Cancelar
            </Button>
            <Button color={confirmColor} onClick={onConfirm} disabled={isConfirming}>
                {isConfirming ? (
                    <><Spinner size="sm" className="me-1"/> Procesando...</>
                ) : (
                    confirmText
                )}
            </Button>
        </ModalFooter>
    </Modal>
);

// --- Constants ---
const INITIAL_FORM_STATE = {
    idProvider: "",
    documentType: "",
    document: "",
    cellPhone: "",
    company: "",
    status: true,
};

const INITIAL_FORM_ERRORS = {
    documentType: false,
    document: false,
    cellPhone: false,
    company: false,
};

const INITIAL_CONFIRM_PROPS = {
    title: "",
    message: null,
    confirmText: "Confirmar",
    confirmColor: "primary",
    itemDetails: null, // Aunque ya no lo leeremos directamente en la ejecución, sigue siendo útil para preparar
};

const TIPOS_DOCUMENTOS = [
    { value: "CC", label: "Cédula de Ciudadanía" },
    { value: "CE", label: "Cédula de Extranjería" },
    { value: "PA", label: "Pasaporte" },
    { value: "PEP", label: "Permiso Especial de Permanencia" },
    { value: "NIT", label: "NIT (Número de Identificación Tributaria)" },
];

const ITEMS_PER_PAGE = 5;

// --- Main Component ---
const Proveedores = () => {
    // --- State ---
    const [data, setData] = useState([]);
    const [form, setForm] = useState(INITIAL_FORM_STATE);
    const [isEditing, setIsEditing] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [tableSearchText, setTableSearchText] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [formErrors, setFormErrors] = useState(INITIAL_FORM_ERRORS);
    const [currentPage, setCurrentPage] = useState(1);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [confirmModalProps, setConfirmModalProps] = useState(INITIAL_CONFIRM_PROPS);
    const [isConfirmActionLoading, setIsConfirmActionLoading] = useState(false);

    // --- Refs ---
    const confirmActionRef = useRef(null); // Almacena la función a ejecutar en confirmación

    // --- Data Fetching ---
    const fetchData = useCallback(async (showLoadingSpinner = true) => {
        if (showLoadingSpinner) setIsLoading(true);
        console.log("[FETCH] Fetching providers...");
        try {
            const proveedores = await proveedorService.getAllProveedores();
            setData(proveedores || []);
        } catch (error) {
            console.error("[FETCH ERROR] Failed to load providers:", error);
            toast.error("Error al cargar proveedores. Verifique la conexión.");
            setData([]);
        } finally {
             if (showLoadingSpinner) setIsLoading(false);
             console.log("[FETCH] Fetching finished.");
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- Form Helper Functions ---
    const resetForm = useCallback(() => {
        setForm(INITIAL_FORM_STATE);
    }, []);

    const clearFormErrors = useCallback(() => {
        setFormErrors(INITIAL_FORM_ERRORS);
    }, []);

    const validateForm = useCallback(() => {
        // 1. Asegurar que los valores a validar/trimmar sean strings ANTES de usarlos
        const phoneString = String(form.cellPhone ?? ''); // Convierte a string (o '' si es null/undefined)
        const documentString = String(form.document ?? ''); // Convierte a string
        const companyString = String(form.company ?? '');   // Convierte a string

        // 2. Usar las versiones string garantizadas para el trim y la validación
        const trimmedPhone = phoneString.trim();
        const trimmedDocument = documentString.trim();
        const trimmedCompany = companyString.trim();

        // 3. Realizar las validaciones usando los valores string trimmados
        const errors = {
            documentType: !form.documentType, // Este no necesita trim típicamente (es un select)
            document: !trimmedDocument || !/^[0-9]+(-[0-9]+)*$/.test(trimmedDocument.replace(/-/g, '')),
            cellPhone: !trimmedPhone || !/^\d{7,15}$/.test(trimmedPhone),
            company: !trimmedCompany,
        };

        setFormErrors(errors);
        return !Object.values(errors).some(Boolean); // Retorna true si no hay errores

    }, [form]); // La dependencia sigue siendo 'form' porque leemos de él

    // --- Event Handlers ---
    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setForm((prevForm) => ({ ...prevForm, [name]: value }));
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: false }));
        }
    }, [formErrors]);

    const handleTableSearch = useCallback((e) => {
        setTableSearchText(e.target.value.toLowerCase());
        setCurrentPage(1);
    }, []);

    // --- Modal Toggles ---
    const toggleMainModal = useCallback(() => {
        const closing = modalOpen;
        setModalOpen(prev => !prev);
        if (closing) {
            resetForm();
            clearFormErrors();
            setIsEditing(false);
        }
    }, [modalOpen, resetForm, clearFormErrors]);

    const toggleConfirmModal = useCallback(() => {
        if (isConfirmActionLoading) return;
        setConfirmModalOpen(prev => !prev);
    }, [isConfirmActionLoading]);

    // --- Effect to Reset Confirmation Modal State When Closed ---
     useEffect(() => {
        if (!confirmModalOpen && !isConfirmActionLoading) {
            console.log("[EFFECT] Resetting confirmation modal props and ref.");
            setConfirmModalProps(INITIAL_CONFIRM_PROPS);
            confirmActionRef.current = null;
        }
    }, [confirmModalOpen, isConfirmActionLoading]);


    // --- Confirmation Preparation (CORREGIDO) ---
    // Guarda la función de acción (ej. executeDelete) y los detalles necesarios
    // Crea una nueva función en el ref que llama a la acción PASÁNDOLE los detalles
    const prepareConfirmation = useCallback((actionFn, props) => {
        console.log(`[PREPARE CONFIRM] Setting up confirmation for: ${props.title}`, props.itemDetails);
        const detailsToPass = props.itemDetails; // Captura los detalles AHORA

        // Almacena una NUEVA función en el ref que llama a actionFn CON los detalles capturados
        confirmActionRef.current = () => {
            if (actionFn) {
                actionFn(detailsToPass); // <--- ¡AQUÍ! Pasa los detalles a la función de ejecución
            } else {
                 console.error("[CONFIRM ACTION] actionFn is null or undefined in ref execution.");
                 // Opcional: mostrar error al usuario si actionFn es null
                 toast.error("Error interno al intentar ejecutar la acción confirmada.");
                 toggleConfirmModal(); // Cierra el modal si hay un error grave aquí
            }
        };

        setConfirmModalProps(props); // Necesario para mostrar el contenido del modal
        setConfirmModalOpen(true);   // Abre el modal
    }, [toggleConfirmModal]); // Agregamos toggleConfirmModal por si se usa en el error del ref

    // --- CRUD Operations ---

    // ADD PROVIDER (Submit Handler - sin cambios)
    const handleSubmit = useCallback(async () => {
        console.log("[ADD] Attempting submit:", form);
        if (!validateForm()) {
            toast.error("Por favor, complete los campos requeridos correctamente.", { duration: 4000 });
            return;
        }

        const documentToCompare = String(form.document || '').trim().toLowerCase();
        const proveedorExistente = data.some(
            (registro) => registro.document != null && String(registro.document).trim().toLowerCase() === documentToCompare
        );

        if (proveedorExistente) {
            toast.error("Ya existe un proveedor con este número de documento.", { duration: 4000 });
            setFormErrors(prev => ({ ...prev, document: true }));
            return;
        }

        const toastId = toast.loading('Agregando proveedor...');
        try {
            const { idProvider, ...newProviderData } = form;
            const providerToSend = { ...newProviderData, status: true };
            console.log("[ADD] Calling service with:", providerToSend);
            await proveedorService.createProveedor(providerToSend);

            toast.success("Proveedor agregado exitosamente!", { id: toastId });
            toggleMainModal();
            await fetchData(false);
            setCurrentPage(1);

        } catch (error) {
            console.error("[ADD ERROR]", error);
            const errorMsg = error.response?.data?.message || error.message || "Error desconocido";
            toast.error(`Error al agregar: ${errorMsg}`, { id: toastId, duration: 5000 });
        }
    }, [form, data, validateForm, toggleMainModal, fetchData]);

    // EDIT PROVIDER (Request Confirmation - sin cambios)
    const requestEditConfirmation = useCallback(() => {
        console.log("[EDIT REQ] Requesting confirmation for:", form);
        if (!validateForm()) {
           toast.error("Por favor, complete los campos requeridos correctamente.", { duration: 4000 });
           return;
        }

        const currentDocument = String(form.document || '').trim().toLowerCase();
        const currentId = form.idProvider;
        const proveedorExistente = data.some(
           (registro) =>
               registro.document != null &&
               String(registro.document).trim().toLowerCase() === currentDocument &&
               registro.idProvider !== currentId
        );
        if (proveedorExistente) {
           toast.error("Ya existe otro proveedor con este número de documento.", { duration: 4000 });
           setFormErrors(prev => ({ ...prev, document: true }));
           return;
        }

        if (!currentId) {
            console.error("[EDIT REQ ERROR] idProvider missing.");
            toast.error("Error interno: No se puede identificar el proveedor.");
            return;
        }

        // Preparar confirmación pasando la función de ejecución y los detalles del formulario actual
        prepareConfirmation(executeEdit, {
            title: "Confirmar Actualización",
            message: <p>¿Está seguro que desea guardar los cambios para <strong>{form.company || 'este proveedor'}</strong>?</p>,
            confirmText: "Confirmar Cambios",
            confirmColor: "primary",
            itemDetails: { ...form } // Pasa los datos actuales del formulario
        });
    }, [form, data, validateForm, prepareConfirmation]);

    // EDIT PROVIDER (Execute Action - CORREGIDO)
    // Acepta 'providerToUpdate' como argumento
    const executeEdit = useCallback(async (providerToUpdate) => {
        console.log("[EDIT EXEC] Attempting execution with received data:", providerToUpdate);

        // Valida el argumento recibido, no el estado
        if (!providerToUpdate || !providerToUpdate.idProvider) {
             console.error("[EDIT EXEC ERROR] Missing provider data in received argument.", providerToUpdate);
             toast.error("Error interno: Datos para actualizar no encontrados.");
             toggleConfirmModal(); // Cierra el modal de confirmación
             return;
        }

        console.log("[EDIT EXEC] Executing edit for:", providerToUpdate);
        setIsConfirmActionLoading(true);
        const toastId = toast.loading('Actualizando proveedor...');

        try {
            const { idProvider, ...updateData } = providerToUpdate;
            console.log("[EDIT EXEC] Calling service with ID:", idProvider, "Data:", updateData);
            await proveedorService.updateProveedor(idProvider, updateData);

            toast.success("Proveedor actualizado exitosamente!", { id: toastId });
            toggleConfirmModal(); // Cierra modal de confirmación
            toggleMainModal();    // Cierra modal de formulario
            await fetchData(false); // Refresca datos

        } catch (error) {
            console.error("[EDIT EXEC ERROR]", error);
            const errorMsg = error.response?.data?.message || error.message || "Error desconocido";
            toast.error(`Error al actualizar: ${errorMsg}`, { id: toastId, duration: 5000 });
            toggleConfirmModal(); // Cierra modal de confirmación en error
        } finally {
             setIsConfirmActionLoading(false);
        }
    // Dependencias actualizadas: ya no necesita confirmModalProps
    }, [toggleConfirmModal, toggleMainModal, fetchData]);

    // CHANGE STATUS (Request Confirmation - sin cambios)
    const requestChangeStatusConfirmation = useCallback((idProvider, currentStatus, companyName) => {
        if (!idProvider) {
            console.error("[STATUS REQ ERROR] Invalid idProvider:", idProvider);
            return;
        }
        console.log(`[STATUS REQ] Requesting change for ID: ${idProvider}, Current: ${currentStatus}`);
        const actionText = currentStatus ? "desactivar" : "activar";
        const futureStatusText = currentStatus ? "Inactivo" : "Activo";
        const confirmColor = currentStatus ? "warning" : "success";

        prepareConfirmation(executeChangeStatus, {
            title: "Confirmar Cambio de Estado",
            message: (
                <p>¿Está seguro que desea <strong>{actionText}</strong> al proveedor <strong>{companyName || 'seleccionado'}</strong>? <br /> Su nuevo estado será: <strong>{futureStatusText}</strong>.</p>
            ),
            confirmText: `Confirmar ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`,
            confirmColor: confirmColor,
            itemDetails: { idProvider, currentStatus, companyName } // Pasa los detalles necesarios
        });
    }, [prepareConfirmation]);

    // CHANGE STATUS (Execute Action - CORREGIDO)
    // Acepta 'details' como argumento
    const executeChangeStatus = useCallback(async (details) => {
        console.log("[STATUS EXEC] Attempting execution with received details:", details);

        // Valida el argumento 'details', no el estado confirmModalProps
        if (!details || !details.idProvider) {
            console.error("[STATUS EXEC ERROR] Missing details or idProvider in received argument.", details); // Mensaje de error actualizado
            toast.error("Error interno: No se pudieron obtener los detalles para cambiar el estado.", { duration: 5000 });
            toggleConfirmModal();
            return;
        }

        // Usa directamente los detalles recibidos
        const { idProvider, currentStatus, companyName } = details;
        const newStatus = !currentStatus;
        const actionText = currentStatus ? "desactivar" : "activar";
        console.log(`[STATUS EXEC] Executing for ID: ${idProvider} to New Status: ${newStatus}`);

        setIsConfirmActionLoading(true);
        const toastId = toast.loading(`${actionText.charAt(0).toUpperCase() + actionText.slice(1)}ndo proveedor...`);

        try {
            console.log("[STATUS EXEC] Calling service changeStateProveedor with ID:", idProvider, "New Status:", newStatus);
            await proveedorService.changeStateProveedor(idProvider, newStatus);

            toast.success(`Proveedor ${companyName || ''} ${actionText === 'activar' ? 'activado' : 'desactivado'} correctamente.`, { id: toastId });
            toggleConfirmModal();
            await fetchData(false);

        } catch (error) {
            console.error("[STATUS EXEC ERROR]", error);
            const errorMsg = error.response?.data?.message || error.message || "Error desconocido";
            toast.error(`Error al ${actionText}: ${errorMsg}`, { id: toastId, duration: 5000 });
            toggleConfirmModal();
        } finally {
            setIsConfirmActionLoading(false);
            console.log("[STATUS EXEC] Execution finished.");
        }
    // Dependencias actualizadas: ya no necesita confirmModalProps
    }, [toggleConfirmModal, fetchData]);

    // DELETE PROVIDER (Request Confirmation - sin cambios)
    const requestDeleteConfirmation = useCallback(async (proveedor) => {
        if (!proveedor || !proveedor.idProvider) {
            console.error("[DELETE REQ ERROR] Invalid provider data received:", proveedor);
            return;
        }
        console.log("[DELETE REQ] Requesting confirmation for provider:", JSON.stringify(proveedor));

        const checkToastId = toast.loading('Verificando asociaciones...');
        try {
             console.log("[DELETE REQ] Calling isProviderAssociatedWithPurchases for ID:", proveedor.idProvider);
             const isAssociated = await proveedorService.isProviderAssociatedWithPurchases(proveedor.idProvider);
             toast.dismiss(checkToastId);

             if (isAssociated) {
                 console.warn(`[DELETE REQ] Deletion blocked for ${proveedor.company} (ID: ${proveedor.idProvider}) due to associations.`);
                 toast.error(`"${proveedor.company}" no se puede eliminar. Está asociado a compras registradas.`, {
                     duration: 6000, icon: <XCircle className="text-danger" />
                 });
                 return;
             }

             console.log("[DELETE REQ] No associations found. Proceeding with confirmation setup.");
             prepareConfirmation(executeDelete, {
                 title: "Confirmar Eliminación",
                 message: (
                     <>
                         <p>¿Está seguro que desea eliminar permanentemente al proveedor <strong>{proveedor.company || 'seleccionado'}</strong>?</p>
                         <p><strong className="text-danger">Esta acción no se puede deshacer.</strong></p>
                     </>
                 ),
                 confirmText: "Eliminar Definitivamente",
                 confirmColor: "danger",
                 itemDetails: { ...proveedor } // Pasa una copia de los detalles del proveedor
             });

        } catch (error) {
            toast.dismiss(checkToastId);
            console.error("[DELETE REQ ERROR] Failed during association check:", error);
             const errorMsg = error.response?.data?.message || error.message || "Error al verificar asociación";
            toast.error(`Error: ${errorMsg}`, { icon: <XCircle className="text-danger" />, duration: 5000 });
        }
    }, [prepareConfirmation]);

    // DELETE PROVIDER (Execute Action - CORREGIDO)
    // Acepta 'providerToDelete' como argumento
    const executeDelete = useCallback(async (providerToDelete) => {
        console.log("[DELETE EXEC] Attempting execution with received data:", JSON.stringify(providerToDelete));

        // Valida el argumento recibido, no el estado
        if (!providerToDelete || !providerToDelete.idProvider) {
             console.error("[DELETE EXEC ERROR] Missing provider data in received argument.", providerToDelete);
             toast.error("Error interno: Datos para eliminar no encontrados.");
             toggleConfirmModal();
             return;
        }
        console.log("[DELETE EXEC] Executing delete for provider:", JSON.stringify(providerToDelete));

        setIsConfirmActionLoading(true);
        const toastId = toast.loading('Eliminando proveedor...');

        try {
            console.log("[DELETE EXEC] Calling service deleteProveedor with ID:", providerToDelete.idProvider);
            await proveedorService.deleteProveedor(providerToDelete.idProvider);

            toast.success(`Proveedor "${providerToDelete.company}" eliminado correctamente.`, {
                id: toastId, icon: <CheckCircle className="text-success" />
            });
            toggleConfirmModal();
            await fetchData(false); // Refrescar datos antes de ajustar paginación implícitamente

        } catch (error) {
            console.error("[DELETE EXEC ERROR] API call failed:", error);
            const errorMsg = error.response?.data?.message || error.message || "Error desconocido";
            toast.error(`Error al eliminar: ${errorMsg}`, {
                id: toastId, icon: <XCircle className="text-danger" />, duration: 5000
            });
            toggleConfirmModal();
        } finally {
            setIsConfirmActionLoading(false);
        }
    // Dependencias actualizadas: ya no necesita confirmModalProps
    }, [toggleConfirmModal, fetchData]);

    // --- Modal Opening Handlers (sin cambios) ---
    const openAddModal = useCallback(() => {
        resetForm();
        clearFormErrors();
        setIsEditing(false);
        setModalOpen(true);
    }, [resetForm, clearFormErrors]);

    const openEditModal = useCallback((proveedor) => {
        setForm({
            // Es buena práctica convertir el ID a string también si se maneja como tal en algún punto
            idProvider: String(proveedor.idProvider || ""),
            documentType: proveedor.documentType || "",
            // Convierte a String al cargar en el formulario
            document: String(proveedor.document ?? ""), // Usar ?? para manejar null/undefined explícitamente
            cellPhone: String(proveedor.cellPhone ?? ""), // Usar ?? para manejar null/undefined explícitamente
            company: proveedor.company || "",
            status: proveedor.status !== undefined ? proveedor.status : true,
        });
        setIsEditing(true);
        clearFormErrors(); // Limpia errores anteriores
        setModalOpen(true);
    }, [clearFormErrors]); // La dependencia es correcta


    // --- Filtering and Pagination Logic (sin cambios) ---
    const filteredData = useMemo(() => {
        if (!tableSearchText) return data;
        return data.filter(
            (item) =>
                (item?.company?.toLowerCase() ?? '').includes(tableSearchText) ||
                (String(item?.document ?? '').toLowerCase()).includes(tableSearchText)
        );
    }, [data, tableSearchText]);

    const totalItems = useMemo(() => filteredData.length, [filteredData]);
    const totalPages = useMemo(() => Math.ceil(totalItems / ITEMS_PER_PAGE), [totalItems]);
    const validCurrentPage = useMemo(() => Math.max(1, Math.min(currentPage, totalPages || 1)), [currentPage, totalPages]);

    const currentItems = useMemo(() => {
        const startIndex = (validCurrentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return filteredData.slice(startIndex, endIndex);
    }, [filteredData, validCurrentPage]);

    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        }
    }, [totalPages, currentPage]);

    const handlePageChange = useCallback((pageNumber) => {
        const newPage = Math.max(1, Math.min(pageNumber, totalPages || 1));
        setCurrentPage(newPage);
    }, [totalPages]);

    // --- Render (sin cambios en la estructura general, solo en la llamada a onConfirm del modal) ---
    return (
        <Container fluid className="p-4 main-content">
             <Toaster
                position="top-center"
                toastOptions={{ /* ... */ }}
             />

            {/* Header and Actions */}
            <h2 className="mb-4">Gestión de Proveedores</h2>
            <Row className="mb-3 align-items-center">
                 <Col md={6} lg={4}>
                    <Input
                        type="text"
                        bsSize="sm"
                        placeholder="Buscar por empresa o documento..."
                        value={tableSearchText}
                        onChange={handleTableSearch}
                        style={{ borderRadius: '0.25rem' }}
                        aria-label="Buscar proveedores"
                    />
                </Col>
                <Col md={6} lg={8} className="text-md-end mt-2 mt-md-0">
                    <Button color="success" size="sm" onClick={openAddModal} className="button-add-provider">
                        <Plus size={18} className="me-1" /> Agregar Proveedor
                    </Button>
                </Col>
            </Row>

            {/* Data Table */}
            <div className="table-responsive shadow-sm custom-table-container mb-3">
                 <Table hover size="sm" className="mb-0 custom-table" aria-live="polite">
                     <thead>
                        <tr>
                            <th scope="col">ID</th>
                            <th scope="col">Tipo Doc.</th>
                            <th scope="col">Documento</th>
                            <th scope="col">Teléfono</th>
                            <th scope="col">Empresa</th>
                            <th scope="col" className="text-center">Estado</th>
                            <th scope="col" className="text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                         {isLoading ? (
                            <tr><td colSpan="7" className="text-center p-5"><Spinner color="primary" /> Cargando...</td></tr>
                         ) : currentItems.length > 0 ? (
                            currentItems.map((item) => (
                                <tr key={item.idProvider} style={{ verticalAlign: 'middle' }}>
                                    <th scope="row">{item.idProvider}</th>
                                    <td>{item.documentType || '-'}</td>
                                    <td>{item.document || '-'}</td>
                                    <td>{item.cellPhone || '-'}</td>
                                    <td>{item.company || '-'}</td>
                                    <td className="text-center">
                                        <Button
                                            size="sm"
                                            className={`status-button ${item.status ? 'status-active' : 'status-inactive'}`}
                                            onClick={() => requestChangeStatusConfirmation(item.idProvider, item.status, item.company)}
                                            disabled={!item.idProvider || isConfirmActionLoading}
                                            title={item.status ? "Clic para Desactivar" : "Clic para Activar"}
                                            aria-label={`Cambiar estado de ${item.company}. Estado actual: ${item.status ? 'Activo' : 'Inactivo'}`}
                                        >
                                            {item.status ? "Activo" : "Inactivo"}
                                        </Button>
                                    </td>
                                    <td className="text-center">
                                        <div className="d-inline-flex gap-1 action-cell-content" role="group" aria-label={`Acciones para ${item.company}`}>
                                            <Button
                                                disabled={!item.idProvider || isConfirmActionLoading}
                                                size="sm"
                                                onClick={() => openEditModal(item)}
                                                title="Editar"
                                                className="action-button action-edit"
                                                aria-label={`Editar ${item.company}`}
                                            >
                                                <Edit size={20} />
                                            </Button>
                                            <Button
                                                disabled={!item.idProvider || isConfirmActionLoading}
                                                size="sm"
                                                onClick={() => requestDeleteConfirmation(item)}
                                                title="Eliminar"
                                                className="action-button action-delete"
                                                aria-label={`Eliminar ${item.company}`}
                                             >
                                                 <Trash2 size={20} />
                                             </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                         ) : (
                            <tr><td colSpan="7" className="text-center fst-italic p-4">
                                {/* ... mensaje de tabla vacía ... */}
                            </td></tr>
                        )}
                    </tbody>
                </Table>
            </div>

             {/* Paginator */}
             { totalPages > 1 && !isLoading && (
                <CustomPagination
                    currentPage={validCurrentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />
             )}

            {/* Add/Edit Modal */}
             <Modal isOpen={modalOpen} toggle={toggleMainModal} centered size="lg" backdrop="static" keyboard={false} aria-labelledby="providerModalTitle">
                <ModalHeader toggle={toggleMainModal} id="providerModalTitle">
                     {isEditing ? 'Editar Proveedor' : 'Agregar Nuevo Proveedor'}
                </ModalHeader>
                <ModalBody>
                     <Form id="providerForm" noValidate onSubmit={(e) => e.preventDefault()}>
                         <Row>
                            <Col md={7} lg={8}>
                                <Row className="g-3">
                                     {/* Campos del formulario ... */}
                                     <Col md={12}>
                                        <FormGroup>
                                            <Label for="modalCompany" className="form-label fw-bold">Nombre Empresa <span className="text-danger">*</span></Label>
                                            <Input id="modalCompany" type="text" name="company" value={form.company} onChange={handleChange} invalid={formErrors.company} required aria-required="true" aria-describedby="companyError"/>
                                            {formErrors.company && <div id="companyError" className="invalid-feedback d-block">El nombre de la empresa es obligatorio.</div>}
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label for="modalDocumentType" className="form-label fw-bold">Tipo Documento <span className="text-danger">*</span></Label>
                                            <Input id="modalDocumentType" type="select" name="documentType" value={form.documentType} onChange={handleChange} invalid={formErrors.documentType} required aria-required="true" aria-describedby="docTypeError">
                                                <option value="" disabled>Seleccione...</option>
                                                {TIPOS_DOCUMENTOS.map((tipo) => (<option key={tipo.value} value={tipo.value}>{tipo.label}</option>))}
                                            </Input>
                                            {formErrors.documentType && <div id="docTypeError" className="invalid-feedback d-block">Seleccione un tipo de documento.</div>}
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label for="modalDocument" className="form-label fw-bold">Documento <span className="text-danger">*</span></Label>
                                            <Input id="modalDocument" type="text" inputMode="numeric" pattern="[0-9-]+" name="document" value={form.document} onChange={handleChange} invalid={formErrors.document} required aria-required="true" aria-describedby="docNumError"/>
                                            {formErrors.document && <div id="docNumError" className="invalid-feedback d-block">Ingrese un número de documento válido (solo números y/o guion medio).</div>}
                                        </FormGroup>
                                    </Col>
                                    <Col md={12}>
                                        <FormGroup>
                                            <Label for="modalCellPhone" className="form-label fw-bold">Teléfono / Celular <span className="text-danger">*</span></Label>
                                            <Input id="modalCellPhone" type="tel" inputMode="tel" pattern="[0-9]{7,15}" name="cellPhone" value={form.cellPhone} onChange={handleChange} invalid={formErrors.cellPhone} required aria-required="true" aria-describedby="phoneError"/>
                                            {formErrors.cellPhone && <div id="phoneError" className="invalid-feedback d-block">Ingrese un número de teléfono válido (7 a 15 dígitos numéricos).</div>}
                                        </FormGroup>
                                    </Col>
                                </Row>
                            </Col>
                            <Col md={5} lg={4} className="d-none d-md-flex align-items-center justify-content-center mt-4 mt-md-0">
                                <img src={FondoForm} alt="Ilustración decorativa para formulario de proveedores" style={{ width: "100%", maxHeight: "300px", objectFit: "cover", borderRadius: '0.375rem' }}/>
                            </Col>
                        </Row>
                    </Form>
                </ModalBody>
                <ModalFooter>
                     <Button color="secondary" outline onClick={toggleMainModal}>Cancelar</Button>
                    <Button type="button" color="primary" onClick={isEditing ? requestEditConfirmation : handleSubmit}>
                        {isEditing ? <><Edit size={18} className="me-1"/> Guardar Cambios</> : <><Plus size={18} className="me-1"/> Agregar Proveedor</>}
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={confirmModalOpen}
                toggle={toggleConfirmModal}
                title={confirmModalProps.title}
                // Ejecuta la función almacenada en el ref (que ahora tiene los datos correctos)
                onConfirm={() => confirmActionRef.current && confirmActionRef.current()}
                confirmText={confirmModalProps.confirmText}
                confirmColor={confirmModalProps.confirmColor}
                isConfirming={isConfirmActionLoading}
            >
                {confirmModalProps.message}
            </ConfirmationModal>

        </Container>
    );
};

export default Proveedores;