import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../../assets/css/App.css"; 
import {
    Table, Button, Container, Row, Col, Form, FormGroup, Input, Label,
    Modal, ModalHeader, ModalBody, ModalFooter, Spinner,
} from "reactstrap";

import { Trash2, Edit, Plus, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import serviciosService from '../../services/serviciosService'; 
import CustomPagination from '../../General/CustomPagination'; 


// --- Confirmation Modal Component (Copied from Proveedores, assuming it's not imported separately) ---
const ConfirmationModal = ({ isOpen, toggle, title, children, onConfirm, confirmText = "Confirmar", confirmColor = "primary", isConfirming = false }) => (
    <Modal isOpen={isOpen} toggle={!isConfirming ? toggle : undefined} centered backdrop="static" keyboard={!isConfirming}>
        <ModalHeader toggle={!isConfirming ? toggle : undefined}>
             <div className="d-flex align-items-center">
                {/* Dynamic icon based on color or a default */}
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
    id: "",     
    Nombre: "", 
    Estado: "Activo", 
};

const INITIAL_FORM_ERRORS = {
    Nombre: false,
};

const INITIAL_CONFIRM_PROPS = {
    title: "",
    message: null,
    confirmText: "Confirmar",
    confirmColor: "primary",
    itemDetails: null,
};

const ITEMS_PER_PAGE = 7; 

// --- Main Component ---
const Servicios = () => {
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
    const confirmActionRef = useRef(null); 

    // --- Data Fetching ---
    const fetchData = useCallback(async (showLoadingSpinner = true) => {
        if (showLoadingSpinner) setIsLoading(true);
        console.log("[FETCH] Fetching services...");
        try {
            // Assume getAllServicios returns the mapped data { id, Nombre, Estado }
            const servicios = await serviciosService.getAllServicios();
            setData(servicios || []);
        } catch (error) {
            console.error("[FETCH ERROR] Failed to load services:", error);
            toast.error("Error al cargar servicios. Verifique la conexión.");
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
        const serviceName = String(form.Nombre ?? '').trim();
        const hasNumbers = /\d/.test(serviceName); 
        const errors = {
  Nombre: !serviceName || hasNumbers
};
        setFormErrors(errors);
        return !errors.Nombre; 
    }, [form]);

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

    // --- Confirmation Preparation ---
    const prepareConfirmation = useCallback((actionFn, props) => {
        console.log(`[PREPARE CONFIRM] Setting up confirmation for: ${props.title}`, props.itemDetails);
        const detailsToPass = props.itemDetails;

        confirmActionRef.current = () => {
            if (actionFn) {
                actionFn(detailsToPass); 
            } else {
                 console.error("[CONFIRM ACTION] actionFn is null or undefined in ref execution.");
                 toast.error("Error interno al intentar ejecutar la acción confirmada.");
                 toggleConfirmModal();
            }
        };

        setConfirmModalProps(props);
        setConfirmModalOpen(true);
    }, [toggleConfirmModal]);

    // --- CRUD Operations ---

    
const handleSubmit = useCallback(async () => {
    console.log("[ADD] Attempting submit:", form);
    const serviceName = String(form.Nombre ?? '').trim();

  
    if (!serviceName) {
        setFormErrors({ Nombre: true });
        toast.error("Por favor, ingrese el nombre del servicio.");
        return;
    }
    if (/\d/.test(serviceName)) {
        setFormErrors({ Nombre: true });
        toast.error("El nombre del servicio no debe contener números.");
        return;
    }
    clearFormErrors();

        // Optional: Check for duplicate service name (case-insensitive)
        const nameToCompare = String(form.Nombre || '').trim().toLowerCase();
        const servicioExistente = data.some(
            (registro) => registro.Nombre != null && String(registro.Nombre).trim().toLowerCase() === nameToCompare
        );

        if (servicioExistente) {
            toast.error("Ya existe un servicio con este nombre.", { duration: 4000 });
            setFormErrors(prev => ({ ...prev, Nombre: true }));
            return;
        }

        const toastId = toast.loading('Agregando servicio...');
        try {
           
            const serviceToSend = { Nombre: form.Nombre.trim(), Estado: 'Activo' };
            console.log("[ADD] Calling service with:", serviceToSend);
            await serviciosService.createServicio(serviceToSend);

            toast.success("Servicio agregado exitosamente!", { id: toastId });
            toggleMainModal(); 
            await fetchData(false); 
            setCurrentPage(1); 

        } catch (error) {
            console.error("[ADD ERROR]", error);
           
            let errorMessage = 'No se pudo agregar el servicio.';
            if (error.response) {
                if (error.response.data?.errors && Array.isArray(error.response.data.errors) && error.response.data.errors.length > 0) {
                    errorMessage = error.response.data.errors.map(err => err.msg).join(' ');
                } else if (error.response.data?.message) {
                    errorMessage = error.response.data.message;
                } else if (error.response.status === 400) {
                     errorMessage = "Error de validación. Revise los datos (posiblemente el nombre ya existe).";
                }
            } else if (error.request) {
                errorMessage = "No se pudo conectar con el servidor.";
            } else {
                errorMessage = error.message || "Ocurrió un error inesperado.";
            }
            toast.error(`Error al agregar: ${errorMessage}`, { id: toastId, duration: 5000 });
        }
    }, [form, data, validateForm, toggleMainModal, fetchData]);

    // EDIT SERVICE (Request Confirmation)
    const requestEditConfirmation = useCallback(() => {
    console.log("[EDIT REQ] Requesting confirmation for:", form);
    const serviceName = String(form.Nombre ?? '').trim();

    if (!serviceName) {
        setFormErrors({ Nombre: true });
        toast.error("Por favor, ingrese el nombre del servicio.");
        return;
    }
    if (/\d/.test(serviceName)) {
        setFormErrors({ Nombre: true });
        toast.error("El nombre del servicio no debe contener números.");
        return;
    }
    clearFormErrors();

        // Optional: Check if the new name duplicates another existing service
        const currentName = String(form.Nombre || '').trim().toLowerCase();
        const currentId = form.id;
        const servicioExistente = data.some(
           (registro) =>
               registro.Nombre != null &&
               String(registro.Nombre).trim().toLowerCase() === currentName &&
               registro.id !== currentId 
        );
        if (servicioExistente) {
           toast.error("Ya existe otro servicio con este nombre.", { duration: 4000 });
           setFormErrors(prev => ({ ...prev, Nombre: true }));
           return;
        }

        if (!currentId) {
            console.error("[EDIT REQ ERROR] Service ID missing.");
            toast.error("Error interno: No se puede identificar el servicio.");
            return;
        }

        // Prepare confirmation
        prepareConfirmation(executeEdit, {
            title: "Confirmar Actualización",
            message: <p>¿Está seguro que desea guardar los cambios para <strong>{form.Nombre || 'este servicio'}</strong>?</p>,
            confirmText: "Confirmar Cambios",
            confirmColor: "primary",
            itemDetails: { ...form } 
        });
    }, [form, data, validateForm, prepareConfirmation]);

    // EDIT SERVICE (Execute Action)
    const executeEdit = useCallback(async (servicioToUpdate) => {
        console.log("[EDIT EXEC] Attempting execution with received data:", servicioToUpdate);
        if (!servicioToUpdate || !servicioToUpdate.id) {
             console.error("[EDIT EXEC ERROR] Missing service data or ID.", servicioToUpdate);
             toast.error("Error interno: Datos para actualizar no encontrados.");
             toggleConfirmModal();
             return;
        }

        setIsConfirmActionLoading(true);
        const toastId = toast.loading('Actualizando servicio...');

        try {
            const updateData = { Nombre: servicioToUpdate.Nombre.trim() };
            console.log("[EDIT EXEC] Calling service with ID:", servicioToUpdate.id, "Data:", updateData);
            await serviciosService.updateServicio(servicioToUpdate.id, updateData);

            toast.success("Servicio actualizado exitosamente!", { id: toastId });
            toggleConfirmModal(); 
            toggleMainModal();    
            await fetchData(false); 

        } catch (error) {
            console.error("[EDIT EXEC ERROR]", error);
            let errorMessage = 'No se pudo editar el servicio.';
             if (error.response) {
                 if (error.response.data?.errors && Array.isArray(error.response.data.errors) && error.response.data.errors.length > 0) {
                     errorMessage = error.response.data.errors.map(err => err.msg).join(' ');
                 } else if (error.response.data?.message) {
                     errorMessage = error.response.data.message;
                 } else if (error.response.status === 400) {
                     errorMessage = "Error de validación al editar.";
                 } else if (error.response.status === 404) {
                     errorMessage = "Servicio no encontrado.";
                 }
             } else if (error.request) {
                 errorMessage = "No se pudo conectar con el servidor.";
             } else {
                 errorMessage = error.message || "Ocurrió un error inesperado.";
             }
            toast.error(`Error al actualizar: ${errorMessage}`, { id: toastId, duration: 5000 });
            
            toggleConfirmModal();
        } finally {
             setIsConfirmActionLoading(false);
        }
    }, [toggleConfirmModal, toggleMainModal, fetchData]);

    // CHANGE STATUS (Request Confirmation)
    const requestChangeStatusConfirmation = useCallback((id, currentEstado, nombre) => {
        if (!id) {
            console.error("[STATUS REQ ERROR] Invalid service ID:", id);
            return;
        }
        console.log(`[STATUS REQ] Requesting change for ID: ${id}, Current: ${currentEstado}`);
        const isCurrentlyActive = currentEstado === "Activo";
        const actionText = isCurrentlyActive ? "desactivar" : "activar";
        const futureStatusText = isCurrentlyActive ? "Inactivo" : "Activo";
        const confirmColor = isCurrentlyActive ? "warning" : "success"; 

        prepareConfirmation(executeChangeStatus, {
            title: "Confirmar Cambio de Estado",
            message: (
                <p>¿Está seguro que desea <strong>{actionText}</strong> el servicio <strong>{nombre || 'seleccionado'}</strong>? <br /> Su nuevo estado será: <strong>{futureStatusText}</strong>.</p>
            ),
            confirmText: `Confirmar ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`,
            confirmColor: confirmColor,
            itemDetails: { id, currentEstado, nombre } 
        });
    }, [prepareConfirmation]);

    // CHANGE STATUS (Execute Action)
    const executeChangeStatus = useCallback(async (details) => {
        console.log("[STATUS EXEC] Attempting execution with received details:", details);
        if (!details || !details.id) {
            console.error("[STATUS EXEC ERROR] Missing details or ID.", details);
            toast.error("Error interno: No se pudieron obtener los detalles para cambiar el estado.", { duration: 5000 });
            toggleConfirmModal();
            return;
        }

        const { id, currentEstado, nombre } = details;
        const isCurrentlyActive = currentEstado === "Activo";
        const newStatus = isCurrentlyActive ? "Inactivo" : "Activo"; 
        const actionText = isCurrentlyActive ? "desactivar" : "activar";
        console.log(`[STATUS EXEC] Executing for ID: ${id} to New Status: ${newStatus}`);

        setIsConfirmActionLoading(true);
        const toastId = toast.loading(`${actionText.charAt(0).toUpperCase() + actionText.slice(1)}ndo servicio...`);

        try {
            
            console.log("[STATUS EXEC] Calling service changeStateServicio with ID:", id, "New Status:", newStatus);
            await serviciosService.changeStateServicio(id, newStatus);

            toast.success(`Servicio ${nombre || ''} ${actionText === 'activar' ? 'activado' : 'desactivado'} correctamente.`, { id: toastId });
            toggleConfirmModal();
            await fetchData(false); 

        } catch (error) {
            console.error("[STATUS EXEC ERROR]", error);
             let errorMessage = 'No se pudo actualizar el estado.';
            if (error.response) {
                if (error.response.data?.message) {
                    errorMessage = error.response.data.message;
                } else if (error.response.status === 404) {
                    errorMessage = "Servicio no encontrado.";
                }
            } else if (error.request) {
                errorMessage = "No se pudo conectar con el servidor.";
            } else {
                 errorMessage = error.message || "Ocurrió un error inesperado.";
            }
            toast.error(`Error al ${actionText}: ${errorMessage}`, { id: toastId, duration: 5000 });
            toggleConfirmModal(); 
        } finally {
            setIsConfirmActionLoading(false);
        }
    }, [toggleConfirmModal, fetchData]);

    // DELETE SERVICE (Request Confirmation)
    const requestDeleteConfirmation = useCallback((servicio) => {
        if (!servicio || !servicio.id) {
            console.error("[DELETE REQ ERROR] Invalid service data:", servicio);
            return;
        }
        console.log("[DELETE REQ] Requesting confirmation for service:", servicio);

       

        prepareConfirmation(executeDelete, {
            title: "Confirmar Eliminación",
            message: (
                <>
                    <p>¿Está seguro que desea eliminar permanentemente el servicio <strong>{servicio.Nombre || 'seleccionado'}</strong>?</p>
                    <p><strong className="text-danger">Esta acción no se puede deshacer.</strong></p>
                </>
            ),
            confirmText: "Eliminar Definitivamente",
            confirmColor: "danger",
            itemDetails: { ...servicio } 
        });
    }, [prepareConfirmation]);

    // DELETE SERVICE (Execute Action)
    const executeDelete = useCallback(async (servicioToDelete) => {
        console.log("[DELETE EXEC] Attempting execution with:", servicioToDelete);
        if (!servicioToDelete || !servicioToDelete.id) {
             console.error("[DELETE EXEC ERROR] Missing service data or ID.", servicioToDelete);
             toast.error("Error interno: Datos para eliminar no encontrados.");
             toggleConfirmModal();
             return;
        }

        setIsConfirmActionLoading(true);
        const toastId = toast.loading('Eliminando servicio...');

        try {
            console.log("[DELETE EXEC] Calling service deleteServicio with ID:", servicioToDelete.id);
            await serviciosService.deleteServicio(servicioToDelete.id);

            toast.success(`Servicio "${servicioToDelete.Nombre}" eliminado correctamente.`, {
                id: toastId, icon: <CheckCircle className="text-success" />
            });
            toggleConfirmModal();
            await fetchData(false); 

        } catch (error) {
            console.error("[DELETE EXEC ERROR]", error);
            let errorMessage = 'No se pudo eliminar el servicio.';
            if (error.response) {
                if (error.response.data?.message) {
                    errorMessage = error.response.data.message;
                } else if (error.response.status === 404) {
                    errorMessage = "Servicio no encontrado.";
                }
            } else if (error.request) {
                errorMessage = "No se pudo conectar con el servidor.";
            } else {
                errorMessage = error.message || "Ocurrió un error inesperado.";
            }
            toast.error(`Error al eliminar: ${errorMessage}`, {
                id: toastId, icon: <XCircle className="text-danger" />, duration: 5000
            });
            toggleConfirmModal(); 
        } finally {
            setIsConfirmActionLoading(false);
        }
    }, [toggleConfirmModal, fetchData]);

    // --- Modal Opening Handlers ---
    const openAddModal = useCallback(() => {
        resetForm();
        clearFormErrors();
        setIsEditing(false);
        setModalOpen(true);
    }, [resetForm, clearFormErrors]);

    const openEditModal = useCallback((servicio) => {
       
        setForm({
            id: String(servicio.id || ""), 
            Nombre: servicio.Nombre || "",
            Estado: servicio.Estado || "Activo", 
        });
        setIsEditing(true);
        clearFormErrors(); 
        setModalOpen(true);
    }, [clearFormErrors]);

    // --- Filtering and Pagination Logic ---
    const filteredData = useMemo(() => {
        if (!tableSearchText) return data;
        // Filter based on 'Nombre' which is the primary searchable field here
        return data.filter(
            (item) => (item?.Nombre?.toLowerCase() ?? '').includes(tableSearchText)
        );
    }, [data, tableSearchText]);

    const totalItems = useMemo(() => filteredData.length, [filteredData]);
    const totalPages = useMemo(() => Math.ceil(totalItems / ITEMS_PER_PAGE), [totalItems]);
    // Ensure currentPage is valid
    const validCurrentPage = useMemo(() => Math.max(1, Math.min(currentPage, totalPages || 1)), [currentPage, totalPages]);

    // Paginate the filtered data
    const currentItems = useMemo(() => {
        const startIndex = (validCurrentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return filteredData.slice(startIndex, endIndex);
    }, [filteredData, validCurrentPage]);

    // Effect to adjust page if it becomes invalid after data change (e.g., deletion)
    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        }
    }, [totalPages, currentPage]);

    const handlePageChange = useCallback((pageNumber) => {
        const newPage = Math.max(1, Math.min(pageNumber, totalPages || 1));
        setCurrentPage(newPage);
    }, [totalPages]);

    // --- Render ---
    return (
        <Container fluid className="p-4 main-content">
             {/* Use Toaster for notifications */}
             <Toaster
                position="top-center"
                toastOptions={{
                    
                    duration: 3000,
                    style: {
                      background: '#363636',
                      color: '#fff',
                    },
                    success: {
                      duration: 3000,
                      theme: {
                        primary: 'green',
                        secondary: 'black',
                      },
                    },
                    error: {
                        duration: 4000, 
                    },
                }}
             />

           {/* Fila exclusiva para el Título */}
            <Row>
                <Col>
                    <h2 className="mb-5">Gestión de Servicios Adicionales</h2>
                </Col>
            </Row>

            {/* Fila para los Controles (Buscador y Botón) */}
            <Row className="mb-4 align-items-center justify-content-between">
                {/* Columna para el buscador */}
                <Col md="auto">
                    <Input
                        type="text"
                        bsSize="sm"
                        placeholder="Buscar por nombre"
                        value={tableSearchText}
                        onChange={handleTableSearch}
                        style={{ borderRadius: '0.25rem' }}
                        aria-label="Buscar servicios"
                    />
                </Col>
                
                {/* Columna para el botón de agregar */}
                <Col md="auto" className="mt-2 mt-md-0">
                    <Button color="success" size="sm" onClick={openAddModal} className="button-add">
                        <Plus size={20} className="me-1" />  Agregar Servicio
                    </Button>
                </Col>
            </Row>

            {/* Data Table  */}
            <div className="table-responsive shadow-sm custom-table-container mb-3">
                 <Table hover size="sm" className="mb-0 custom-table" aria-live="polite">
                     <thead>
                        <tr>
                            <th scope="col">Nombre</th>
                            <th scope="col" className="text-center">Estado</th>
                            <th scope="col" className="text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                         {isLoading ? (
                            <tr><td colSpan="3" className="text-center p-5"><Spinner color="primary" /> Cargando...</td></tr>
                         ) : currentItems.length > 0 ? (
                            currentItems.map((item) => (
                                <tr key={item.id} style={{ verticalAlign: 'middle', backgroundColor: item.Estado === "Inactivo" ? "#f8f9fa" : "white" }}> {/* Keep inactive highlight */}
                                    {/* <td>{item.id}</td> */}
                                    <td>{item.Nombre || '-'}</td>
                                    <td className="text-center">
                                        <Button
                                            size="sm"
                                            // Apply consistent status button classes
                                            className={`status-button ${item.Estado === 'Activo' ? 'status-active' : 'status-inactive'}`}
                                            onClick={() => requestChangeStatusConfirmation(item.id, item.Estado, item.Nombre)}
                                            disabled={!item.id || isConfirmActionLoading || isLoading} 
                                            title={item.Estado === 'Activo' ? "Clic para Desactivar" : "Clic para Activar"}
                                            aria-label={`Cambiar estado de ${item.Nombre}. Estado actual: ${item.Estado}`}
                                        >
                                            {item.Estado}
                                        </Button>
                                    </td>
                                    <td className="text-center">
                                        {/* Group actions like in Proveedores */}
                                        <div className="d-inline-flex gap-1 action-cell-content" role="group" aria-label={`Acciones para ${item.Nombre}`}>
                                            <Button
                                                disabled={!item.id || isConfirmActionLoading || isLoading}
                                                size="sm"
                                                onClick={() => openEditModal(item)}
                                                title="Editar"
                                                className="action-button action-edit"
                                                aria-label={`Editar ${item.Nombre}`}
                                            >
                                                <Edit size={20} />
                                            </Button>
                                            <Button
                                                disabled={!item.id || isConfirmActionLoading || isLoading}
                                                size="sm"
                                                onClick={() => requestDeleteConfirmation(item)}
                                                title="Eliminar"
                                                className="action-button action-delete"
                                                aria-label={`Eliminar ${item.Nombre}`}
                                             >
                                                 <Trash2 size={20} />
                                             </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                         ) : (
                            <tr><td colSpan="3" className="text-center fst-italic p-4">
                                {tableSearchText ? 'No se encontraron servicios que coincidan con la búsqueda.' : 'No hay servicios registrados.'}
                            </td></tr>
                        )}
                    </tbody>
                </Table>
            </div>

             {/* Paginator - Use CustomPagination */}
             { totalPages > 1 && !isLoading && (
                <CustomPagination
                    currentPage={validCurrentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />
             )}

            {/* Add/Edit Modal (Single Modal) */}
             <Modal isOpen={modalOpen} toggle={toggleMainModal} centered size="md" backdrop="static" keyboard={false} aria-labelledby="serviceModalTitle">
                <ModalHeader toggle={toggleMainModal} id="serviceModalTitle">
                     {isEditing ? 'Editar Servicio' : 'Agregar Nuevo Servicio'}
                </ModalHeader>
                <ModalBody>
                     <Form id="serviceForm" noValidate onSubmit={(e) => e.preventDefault()}>
                         {/* Simplified form for services */}
                         <FormGroup>
                            <Label for="modalNombre" className="form-label fw-bold">Nombre Servicio <span className="text-danger">*</span></Label>
                            <Input
                                id="modalNombre"
                                type="text"
                                name="Nombre" 
                                value={form.Nombre}
                                onChange={handleChange}
                                invalid={formErrors.Nombre} 
                                required
                                aria-required="true"
                                aria-describedby="nombreError"
                                placeholder="Ingrese el nombre del servicio"
                            />
                            {/* Display error message */}
                            {formErrors.Nombre && <div id="nombreError" className="invalid-feedback d-block">El nombre es obligatorio y no debe contener números.</div>}
                        </FormGroup>
                        {/* No image or other fields needed for services based on original code */}
                    </Form>
                </ModalBody>
                <ModalFooter>
                     <Button color="secondary" outline onClick={toggleMainModal} disabled={isConfirmActionLoading}>Cancelar</Button>
                    {/* Button triggers different actions based on isEditing */}
                    <Button
                        type="button"
                        color="primary"
                        onClick={isEditing ? requestEditConfirmation : handleSubmit}
                        disabled={isConfirmActionLoading}
                    >
                        {isEditing ? <><Edit size={18} className="me-1"/> Guardar Cambios</> : <><Plus size={18} className="me-1"/> Agregar Servicio</>}
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Confirmation Modal (Reused from Proveedores structure) */}
            <ConfirmationModal
                isOpen={confirmModalOpen}
                toggle={toggleConfirmModal}
                title={confirmModalProps.title}
                onConfirm={() => confirmActionRef.current && confirmActionRef.current()}
                confirmText={confirmModalProps.confirmText}
                confirmColor={confirmModalProps.confirmColor}
                isConfirming={isConfirmActionLoading} 
            >
                {/* Message comes from confirmModalProps */}
                {confirmModalProps.message}
            </ConfirmationModal>

        </Container>
    );
};

export default Servicios;