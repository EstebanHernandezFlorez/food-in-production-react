import React, { useState, useEffect, useCallback, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../../App.css";
import {
    Table,
    Button, Container, Row, Col, Form, FormGroup, Input, Label,
    Modal, ModalHeader, ModalBody, ModalFooter, Spinner,
} from "reactstrap";
import { Trash2, Edit, Plus, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// --- Service Import ---
// Ensure this path is correct and the service has 'isProviderAssociatedWithPurchases'
import proveedorService from '../../services/proveedorSevice';
import CustomPagination from '../../General/CustomPagination';
import FondoForm from "../../../assets/login.jpg";

// --- Confirmation Modal Component ---
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


const Proveedores = () => {
    // --- Estados ---
    const [data, setData] = useState([]);
    const [form, setForm] = useState({
        idProvider: "",
        documentType: "",
        document: "",
        cellPhone: "",
        company: "",
        status: true,
    });
    const [isEditing, setIsEditing] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [tableSearchText, setTableSearchText] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [formErrors, setFormErrors] = useState({
        documentType: false,
        document: false,
        cellPhone: false,
        company: false,
    });

    // --- Paginación ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // --- Confirmation Modal ---
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [confirmModalProps, setConfirmModalProps] = useState({
        title: "",
        message: null,
        // DO NOT store onConfirm here, use useRef instead
        confirmText: "Confirmar",
        confirmColor: "primary",
        itemDetails: null,
    });
    const [isConfirmActionLoading, setIsConfirmActionLoading] = useState(false);
    // useRef is the correct place to store the function to be executed
    const confirmActionRef = useRef(null); // Initialize ref to null or a no-op function

    // *** DEBUGGING LOG: Watch confirmModalProps state changes ***
    useEffect(() => {
        console.log("[DEBUG] confirmModalProps changed:", JSON.stringify(confirmModalProps));
    }, [confirmModalProps]);


    const tiposDocumentos = [
        { value: "CC", label: "Cédula de Ciudadanía" },
        { value: "CE", label: "Cédula de Extranjería" },
        { value: "PA", label: "Pasaporte" },
        { value: "PEP", label: "Permiso Especial de Permanencia" },
        { value: "NIT", label: "NIT (Número de Identificación Tributaria)" },
    ];

    // --- Fetch Data ---
    const fetchData = useCallback(async (showLoading = true) => {
        if (showLoading) setIsLoading(true);
        console.log("[FETCH] Fetching providers...");
        try {
            const proveedores = await proveedorService.getAllProveedores();
            setData(proveedores || []);
        } catch (error) {
            console.error("[FETCH ERROR] Failed to load providers:", error);
            toast.error("Error al cargar proveedores. Verifique la conexión.");
            setData([]);
        } finally {
             if (showLoading) setIsLoading(false);
             console.log("[FETCH] Fetching finished.");
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- Modal Toggles ---
    const toggleMainModal = () => {
        setModalOpen(!modalOpen);
        if (modalOpen) {
            resetForm();
            clearFormErrors();
            setIsEditing(false);
        }
    };

    // --- Toggle Confirmation Modal (Safer Reset Logic) ---
    const toggleConfirmModal = () => {
        if (isConfirmActionLoading) return; // Prevent toggling while an action is processing

        setConfirmModalOpen(prev => {
            const closing = prev; // If current state is true, we are closing
            if (closing) {
                // Reset state *only* when transitioning from open to closed
                console.log("[DEBUG] Closing confirmation modal, resetting props and ref.");
                setConfirmModalProps({
                    title: "",
                    message: null,
                    confirmText: "Confirmar",
                    confirmColor: "primary",
                    itemDetails: null
                });
                confirmActionRef.current = null; // Reset the ref
            }
            return !prev; // Return the new state (toggle)
        });
    };

    // --- Form Handling ---
    // (openAddModal, openEditModal, handleTableSearch, handleChange, resetForm, clearFormErrors, validateForm - unchanged)
    const openAddModal = () => {
        resetForm();
        clearFormErrors();
        setIsEditing(false);
        setModalOpen(true);
    };

    const openEditModal = (proveedor) => {
        setForm({
            idProvider: proveedor.idProvider || "",
            documentType: proveedor.documentType || "",
            document: proveedor.document || "",
            cellPhone: proveedor.cellPhone || "",
            company: proveedor.company || "",
            status: proveedor.status !== undefined ? proveedor.status : true,
        });
        setIsEditing(true);
        clearFormErrors();
        setModalOpen(true);
    };

    const handleTableSearch = (e) => {
        setTableSearchText(e.target.value.toLowerCase());
        setCurrentPage(1); // Reset to first page on search
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prevForm) => ({ ...prevForm, [name]: value }));
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: false }));
        }
    };

    const resetForm = () => {
        setForm({ idProvider: "", documentType: "", document: "", cellPhone: "", company: "", status: true });
    };

    const clearFormErrors = () => {
        setFormErrors({ documentType: false, document: false, cellPhone: false, company: false });
    };

    const validateForm = () => {
        const trimmedForm = {
            ...form,
            document: form.document?.trim() ?? "",
            cellPhone: form.cellPhone?.trim() ?? "",
            company: form.company?.trim() ?? "",
        };

        const errors = {
            documentType: !trimmedForm.documentType,
            document: !trimmedForm.document || !/^[0-9-]+$/.test(trimmedForm.document),
            cellPhone: !trimmedForm.cellPhone || !/^\d{7,15}$/.test(trimmedForm.cellPhone),
            company: !trimmedForm.company,
        };
        setFormErrors(errors);
        return !Object.values(errors).some(Boolean);
    };

    // --- CRUD Operations with Confirmation ---

    // ADD PROVIDER (unchanged)
    const handleSubmit = async () => {
        console.log("[ADD] Attempting submit:", form);
        if (!validateForm()) {
            toast.error("Por favor, complete los campos requeridos correctamente.", { duration: 4000 });
            return;
        }

        const documentToCompare = String(form.document || '').toLowerCase();
        const proveedorExistente = data.some(
            (registro) => registro.document != null && String(registro.document).toLowerCase() === documentToCompare
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
    };

    // --- Prepare Confirmation (Helper Function) ---
    // Encapsulates setting state and ref before opening the modal
    const prepareConfirmation = (actionFn, props) => {
        console.log(`[PREPARE CONFIRM] Setting up confirmation for: ${props.title}`, props.itemDetails);
        confirmActionRef.current = actionFn; // Set the function to run
        setConfirmModalProps(props); // Set the modal display properties + data
        setConfirmModalOpen(true); // Open the modal
    };


    // EDIT PROVIDER (Request Confirmation) - Uses helper
    const requestEditConfirmation = () => {
        console.log("[EDIT REQ] Requesting confirmation for:", form);
        if (!validateForm()) {
           toast.error("Por favor, complete los campos requeridos correctamente.", { duration: 4000 });
           return;
        }
        // ... (validation checks for existing document - unchanged) ...
        const currentDocument = String(form.document || '').toLowerCase();
        const currentId = form.idProvider;
        const proveedorExistente = data.some(
           (registro) =>
               registro.document != null &&
               String(registro.document).toLowerCase() === currentDocument &&
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

        // Use the helper to set up the confirmation
        prepareConfirmation(executeEdit, {
            title: "Confirmar Actualización",
            message: <p>¿Está seguro que desea guardar los cambios para <strong>{form.company || 'este proveedor'}</strong>?</p>,
            confirmText: "Confirmar Cambios",
            confirmColor: "primary",
            itemDetails: { ...form } // Pass current form data
        });
    };

    // EDIT PROVIDER (Execute) - Reads from state
    const executeEdit = async () => {
        // Get data directly from state at the time of execution
        const providerToUpdate = confirmModalProps.itemDetails;
        console.log("[EDIT EXEC] Attempting execution. Props state:", confirmModalProps); // Log state when starting

        // Guard clause: Ensure we have the data needed
        if (!providerToUpdate || !providerToUpdate.idProvider) {
             console.error("[EDIT EXEC ERROR] Missing provider data in state.", confirmModalProps);
             toast.error("Error interno: Datos para actualizar no encontrados.");
             // Don't reset loading state here, finally block will do it
             toggleConfirmModal(); // Close confirmation modal
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
            toggleConfirmModal(); // Close confirmation modal AFTER success
            toggleMainModal(); // Close main form modal
            await fetchData(false);

        } catch (error) {
            console.error("[EDIT EXEC ERROR]", error);
            const errorMsg = error.response?.data?.message || error.message || "Error desconocido";
            toast.error(`Error al actualizar: ${errorMsg}`, { id: toastId, duration: 5000 });
            // Optionally keep confirmation modal open on error? Currently closing.
            toggleConfirmModal();
        } finally {
             setIsConfirmActionLoading(false); // Stop loading state for confirm button
        }
    };

    // CHANGE STATUS (Request Confirmation) - Uses helper
    const requestChangeStatusConfirmation = (idProvider, currentStatus, companyName) => {
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
            itemDetails: { idProvider, currentStatus, companyName } // Pass necessary details
        });
    };

    // CHANGE STATUS (Execute) - Reads from state
    const executeChangeStatus = async () => {
        const details = confirmModalProps.itemDetails;
        console.log("[STATUS EXEC] Attempting execution. Props state:", confirmModalProps); // Log state

        if (!details || !details.idProvider) {
            console.error("[STATUS EXEC ERROR] Missing itemDetails or idProvider in state.", confirmModalProps);
            toast.error("Error interno: No se pudieron obtener los detalles para cambiar el estado.", { duration: 5000 });
            toggleConfirmModal();
            return;
        }

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
            toggleConfirmModal(); // Close AFTER success
            await fetchData(false);

        } catch (error) {
            console.error("[STATUS EXEC ERROR]", error);
            const errorMsg = error.response?.data?.message || error.message || "Error desconocido";
            toast.error(`Error al ${actionText}: ${errorMsg}`, { id: toastId, duration: 5000 });
            toggleConfirmModal(); // Close on error
        } finally {
            setIsConfirmActionLoading(false);
            console.log("[STATUS EXEC] Execution finished.");
        }
    };


    // DELETE PROVIDER (Request Confirmation) - Uses helper
    const requestDeleteConfirmation = async (proveedor) => {
        if (!proveedor || !proveedor.idProvider) {
            console.error("[DELETE REQ ERROR] Invalid provider data received:", proveedor);
            return;
        }
        // *** DEBUGGING LOG: Log the provider object received ***
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
             // *** DEBUGGING LOG: Log before setting state ***
             console.log("[DELETE REQ] Provider data before setting state:", JSON.stringify(proveedor));

             // Use the helper function to set state and ref
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
                 itemDetails: { ...proveedor } // Pass a copy of provider details
             });

        } catch (error) {
            toast.dismiss(checkToastId);
            console.error("[DELETE REQ ERROR] Failed during association check:", error);
            if (error.message === "Association check failed") {
                 toast.error("Error al verificar asociaciones del proveedor.", { icon: <XCircle className="text-danger"/>, duration: 5000 });
            } else {
                const errorMsg = error.response?.data?.message || error.message || "Error al verificar asociación";
                toast.error(`Error: ${errorMsg}`, { icon: <XCircle className="text-danger" />, duration: 5000 });
            }
        }
    };


    // DELETE PROVIDER (Execute) - Reads from state
    const executeDelete = async () => {
        // *** DEBUGGING LOG: Log state at the beginning of execution ***
        console.log("[DELETE EXEC] Attempting execution. Props state:", JSON.stringify(confirmModalProps));
        const providerToDelete = confirmModalProps.itemDetails; // Get data from state

        if (!providerToDelete || !providerToDelete.idProvider) {
             // Log the state again on error for clarity
             console.error("[DELETE EXEC ERROR] Missing provider data in state.", confirmModalProps);
             toast.error("Error interno: Datos para eliminar no encontrados.");
             // No need to set loading false, finally block handles it.
             toggleConfirmModal(); // Close the modal
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
            toggleConfirmModal(); // Close modal AFTER success

            // Adjust pagination
            const newTotalItems = filteredData.length - 1;
            const newTotalPages = Math.ceil(Math.max(0, newTotalItems) / itemsPerPage);
            let nextPage = currentPage;
            if (currentItems.length === 1 && currentPage > 1) {
                nextPage = currentPage - 1;
            } else if (currentPage > newTotalPages && newTotalPages > 0) {
                 nextPage = newTotalPages;
            }
             if (nextPage !== currentPage) {
                 setCurrentPage(nextPage);
                 console.log(`[DELETE EXEC] Adjusted page from ${currentPage} to ${nextPage}`);
             }
            await fetchData(false); // Refetch data

        } catch (error) {
            console.error("[DELETE EXEC ERROR] API call failed:", error);
            const errorMsg = error.response?.data?.message || error.message || "Error desconocido";
            toast.error(`Error al eliminar: ${errorMsg}`, {
                id: toastId, icon: <XCircle className="text-danger" />, duration: 5000
            });
            toggleConfirmModal(); // Close modal on error
        } finally {
            setIsConfirmActionLoading(false); // Ensure loading is always stopped
            console.log("[DELETE EXEC] Execution finished.");
        }
    };

    // --- Filtering and Pagination Logic --- (unchanged)
    const filteredData = data.filter(
        (item) =>
            (item?.company?.toLowerCase() ?? '').includes(tableSearchText) ||
            (String(item?.document ?? '').toLowerCase()).includes(tableSearchText)
    );
    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const validCurrentPage = Math.max(1, currentPage);
    const startIndex = (validCurrentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = filteredData.slice(startIndex, endIndex);

    const handlePageChange = useCallback((pageNumber) => {
        const newPage = Math.max(1, Math.min(pageNumber, totalPages || 1));
        setCurrentPage(newPage);
    }, [totalPages]);

    // --- Render ---
    return (
        <Container fluid className="p-4 main-content">
             {/* Toaster config unchanged */}
             <Toaster
                position="top-center"
                toastOptions={{
                    className: 'react-hot-toast',
                    style: { maxWidth: '500px', padding: '12px 16px', textAlign: 'center', zIndex: 9999 },
                    success: { duration: 3000 },
                    error: { duration: 5000 }
                }}
             />

            {/* Header and Search/Add Row unchanged */}
            <h2 className="mb-4">Gestión de Proveedores</h2>
            <Row className="mb-3 align-items-center">
                 <Col md={6} lg={4}>
                    <Input type="text" bsSize="sm" placeholder="Buscar por empresa o documento..."
                           value={tableSearchText} onChange={handleTableSearch} style={{ borderRadius: '0.25rem' }} />
                </Col>
                <Col md={6} lg={8} className="text-md-end mt-2 mt-md-0">
                    <Button color="success" size="sm" onClick={openAddModal} className="button-add-provider">
                        <Plus size={18} className="me-1" /> Agregar Proveedor
                    </Button>
                </Col>
            </Row>

            {/* Table Structure unchanged */}
            <div className="table-responsive shadow-sm custom-table-container mb-3">
                 <Table hover size="sm" className="mb-0 custom-table">
                     <thead>
                        <tr>
                            <th>ID</th><th>Tipo Doc.</th><th>Documento</th><th>Teléfono</th>
                            <th>Empresa</th><th className="text-center">Estado</th><th className="text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                         {isLoading ? (
                            <tr><td colSpan="7" className="text-center p-5"><Spinner color="primary" /> Cargando...</td></tr>
                         ) : currentItems.length > 0 ? (
                            currentItems.map((item) => (
                                <tr key={item.idProvider} style={{ verticalAlign: 'middle' }}>
                                    <td>{item.idProvider}</td>
                                    <td>{item.documentType || '-'}</td>
                                    <td>{item.document || '-'}</td>
                                    <td>{item.cellPhone || '-'}</td>
                                    <td>{item.company || '-'}</td>
                                    <td className="text-center">
                                        <Button
                                            size="sm"
                                            className={`status-button ${item.status ? 'status-active' : 'status-inactive'}`}
                                            onClick={() => requestChangeStatusConfirmation(item.idProvider, item.status, item.company)}
                                            disabled={!item.idProvider}
                                            title={item.status ? "Desactivar" : "Activar"}
                                        >
                                            {item.status ? "Activo" : "Inactivo"}
                                        </Button>
                                    </td>
                                    <td className="text-center">
                                        <div className="d-inline-flex gap-1 action-cell-content">
                                            <Button disabled={!item.idProvider} size="sm" onClick={() => openEditModal(item)} title="Editar" className="action-button action-edit"><Edit size={20} /></Button>
                                            <Button disabled={!item.idProvider} size="sm" onClick={() => requestDeleteConfirmation(item)} title="Eliminar" className="action-button action-delete"><Trash2 size={20} /></Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                         ) : (
                            <tr><td colSpan="7" className="text-center fst-italic p-4">
                                {tableSearchText
                                    ? 'No se encontraron proveedores que coincidan.'
                                    : (data.length === 0 ? 'Aún no hay proveedores registrados.' : 'No hay resultados para mostrar.')
                                }
                                {!tableSearchText && data.length === 0 && !isLoading && (
                                    <span className="d-block mt-2">
                                        <Button size="sm" color="link" onClick={openAddModal}>Agregar el primero</Button>
                                    </span>
                                 )}
                            </td></tr>
                        )}
                    </tbody>
                </Table>
            </div>

             {/* Paginator unchanged */}
             { totalPages > 1 && !isLoading && (
                <CustomPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />
             )}

            {/* Add/Edit Modal unchanged */}
             <Modal isOpen={modalOpen} toggle={toggleMainModal} centered size="lg" backdrop="static" keyboard={false}>
                <ModalHeader toggle={toggleMainModal}>
                     {isEditing ? 'Editar Proveedor' : 'Agregar Nuevo Proveedor'}
                </ModalHeader>
                <ModalBody>
                     <Form id="providerForm" noValidate>
                         <Row>
                            <Col md={7} lg={8}>
                                <Row className="g-3">
                                     <Col md={12}>
                                        <FormGroup>
                                            <Label for="modalCompany" className="form-label fw-bold">Nombre Empresa <span className="text-danger">*</span></Label>
                                            <Input id="modalCompany" type="text" name="company" value={form.company} onChange={handleChange} invalid={formErrors.company} required />
                                            {formErrors.company && <div className="invalid-feedback d-block">El nombre de la empresa es obligatorio.</div>}
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label for="modalDocumentType" className="form-label fw-bold">Tipo Documento <span className="text-danger">*</span></Label>
                                            <Input id="modalDocumentType" type="select" name="documentType" value={form.documentType} onChange={handleChange} invalid={formErrors.documentType} required>
                                                <option value="">Seleccione...</option>
                                                {tiposDocumentos.map((tipo) => (<option key={tipo.value} value={tipo.value}>{tipo.label}</option>))}
                                            </Input>
                                            {formErrors.documentType && <div className="invalid-feedback d-block">Seleccione un tipo de documento.</div>}
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label for="modalDocument" className="form-label fw-bold">Documento <span className="text-danger">*</span></Label>
                                            <Input id="modalDocument" type="text" inputMode="numeric" pattern="[0-9-]+" name="document" value={form.document} onChange={handleChange} invalid={formErrors.document} required />
                                            {formErrors.document && <div className="invalid-feedback d-block">Ingrese un número de documento válido (números y/o guion).</div>}
                                        </FormGroup>
                                    </Col>
                                    <Col md={12}>
                                        <FormGroup>
                                            <Label for="modalCellPhone" className="form-label fw-bold">Teléfono / Celular <span className="text-danger">*</span></Label>
                                            <Input id="modalCellPhone" type="text" inputMode="tel" pattern="[0-9]{7,15}" name="cellPhone" value={form.cellPhone} onChange={handleChange} invalid={formErrors.cellPhone} required/>
                                            {formErrors.cellPhone && <div className="invalid-feedback d-block">Ingrese un número de teléfono válido (7-15 dígitos).</div>}
                                        </FormGroup>
                                    </Col>
                                </Row>
                            </Col>
                            <Col md={5} lg={4} className="d-none d-md-flex align-items-center justify-content-center mt-4 mt-md-0">
                                <img src={FondoForm} alt="Ilustración Proveedores" style={{ width: "100%", maxHeight: "300px", objectFit: "cover", borderRadius: '0.375rem' }}/>
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

            {/* Confirmation Modal - Pass the ref's current value */}
            {/* The ref holds the function, the state holds the display data */}
            <ConfirmationModal
                isOpen={confirmModalOpen}
                toggle={toggleConfirmModal}
                title={confirmModalProps.title}
                // Pass the *function* stored in the ref
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