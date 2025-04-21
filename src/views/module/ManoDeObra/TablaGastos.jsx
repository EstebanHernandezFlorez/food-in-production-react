import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import '../../../App.css'; // Asegúrate que la ruta es correcta
import {
    Table, Button, Container, Row, Col, Form, FormGroup, Input, Label, FormFeedback, // Added FormFeedback
    Modal, ModalHeader, ModalBody, ModalFooter, Spinner, Alert // Added Alert, FormFeedback
} from 'reactstrap';
// Updated Icons
import { Edit, Trash2, Plus, AlertTriangle, CheckCircle, XCircle, Save, Users, ListChecks, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

// --- Service Import ---
import ConceptSpentService from "../../services/conceptoGasto"; // Verifica la ruta

// --- Reusable Components ---
import CustomPagination from '../../General/CustomPagination'; // Verifica la ruta
// import FondoIcono from '../../../assets/logoFIP.png'; // Lo comentamos para seguir el estilo de Proveedores

// --- Confirmation Modal Component (Import or define as in Proveedores) ---
const ConfirmationModal = ({ isOpen, toggle, title, children, onConfirm, confirmText = "Confirmar", confirmColor = "primary", isConfirming = false }) => (
     <Modal isOpen={isOpen} toggle={!isConfirming ? toggle : undefined} centered backdrop="static" keyboard={!isConfirming}>
        <ModalHeader toggle={!isConfirming ? toggle : undefined}>
             <div className="d-flex align-items-center">
                <AlertTriangle size={24} className={`text-${confirmColor === 'danger' ? 'danger' : (confirmColor === 'warning' ? 'warning' : 'primary')} me-2`} />
                <span className="fw-bold">{title}</span>
            </div>
        </ModalHeader>
        <ModalBody>{children}</ModalBody>
        <ModalFooter>
            <Button color="secondary" outline onClick={toggle} disabled={isConfirming}>Cancelar</Button>
            <Button color={confirmColor} onClick={onConfirm} disabled={isConfirming}>
                {isConfirming ? (<><Spinner size="sm" className="me-1"/> Procesando...</>) : confirmText}
            </Button>
        </ModalFooter>
    </Modal>
);


// --- Constants ---
const INITIAL_FORM_STATE = {
    idExpenseType: null, // Added ID for editing
    name: '',
    description: '',
    isBimonthly: false,
    status: true
};

const INITIAL_FORM_ERRORS = {
    name: null,
    description: null
};

const INITIAL_CONFIRM_PROPS = {
    title: "", message: null, confirmText: "Confirmar", confirmColor: "primary", itemDetails: null
};

const ITEMS_PER_PAGE = 7; // O ajusta según prefieras

// --- Main Component: TablaGastos (Styled like Proveedores) ---
const TablaGastos = () => {
    // --- State ---
    const [data, setData] = useState([]);
    const [form, setForm] = useState(INITIAL_FORM_STATE);
    const [isEditing, setIsEditing] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [tableSearchText, setTableSearchText] = useState('');
    const [isLoadingTable, setIsLoadingTable] = useState(true); // Loading state for table
    const [formErrors, setFormErrors] = useState(INITIAL_FORM_ERRORS);
    const [currentPage, setCurrentPage] = useState(1);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [confirmModalProps, setConfirmModalProps] = useState(INITIAL_CONFIRM_PROPS);
    const [isSubmitting, setIsSubmitting] = useState(false); // Loading state for form submit/modal actions
    const [isConfirmActionLoading, setIsConfirmActionLoading] = useState(false); // Loading for confirmation actions

    // --- Refs ---
    const confirmActionRef = useRef(null); // Stores the function to execute on confirmation

    // --- Hooks ---
    const navigate = useNavigate();

    // --- Data Fetching ---
    const fetchData = useCallback(async (showLoadingSpinner = true) => {
        if (showLoadingSpinner) setIsLoadingTable(true);
        try {
            const concepts = await ConceptSpentService.getAllConceptSpents();
            setData(Array.isArray(concepts) ? concepts : []);
        } catch (error) {
            console.error("Error fetching concept data:", error);
            toast.error("Error al cargar los conceptos de gasto.");
            setData([]);
        } finally {
             if (showLoadingSpinner) setIsLoadingTable(false);
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
        const errors = { name: null, description: null };
        let isValid = true;

        if (!form.name || !form.name.trim()) {
            errors.name = 'El nombre es obligatorio.';
            isValid = false;
        }
        if (!form.description || !form.description.trim()) {
            errors.description = 'La descripción es obligatoria.';
            isValid = false;
        }

        setFormErrors(errors);
        return isValid;
    }, [form]);

    // --- Event Handlers ---
    const handleChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        const inputValue = type === 'checkbox' ? checked : value;
        setForm(prevForm => ({ ...prevForm, [name]: inputValue }));
        if (formErrors[name]) {
            setFormErrors(prevErrors => ({ ...prevErrors, [name]: null }));
        }
    }, [formErrors]);

    const handleTableSearch = useCallback((e) => {
        setTableSearchText(e.target.value);
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

     // Effect to Reset Confirmation Modal State When Closed
    useEffect(() => {
        if (!confirmModalOpen && !isConfirmActionLoading) {
            setConfirmModalProps(INITIAL_CONFIRM_PROPS);
            confirmActionRef.current = null;
        }
    }, [confirmModalOpen, isConfirmActionLoading]);

    // --- Confirmation Preparation Logic (similar to Proveedores) ---
    const prepareConfirmation = useCallback((actionFn, props) => {
        const detailsToPass = props.itemDetails;
        confirmActionRef.current = () => {
             if (actionFn) {
                 actionFn(detailsToPass); // Pass details to the execution function
             } else {
                 console.error("[CONFIRM ACTION] actionFn is null.");
                 toast.error("Error interno al intentar ejecutar la acción.");
                 toggleConfirmModal();
             }
        };
        setConfirmModalProps(props);
        setConfirmModalOpen(true);
    }, [toggleConfirmModal]);


    // --- CRUD Operations & Actions ---

    // ADD / EDIT Concept (Submit Handler)
    const handleSubmit = useCallback(async () => { // Removed event argument, triggered by button click
        if (!validateForm()) {
            toast.error("Por favor, complete los campos requeridos.", { icon: <XCircle className="text-danger" /> });
            return;
        }

        // Optional: Check for duplicate name before submitting (only if needed)
        // const conceptNameLower = form.name.trim().toLowerCase();
        // const isDuplicate = data.some(item =>
        //     item.name.trim().toLowerCase() === conceptNameLower && item.idExpenseType !== form.idExpenseType
        // );
        // if (isDuplicate) {
        //     setFormErrors(prev => ({ ...prev, name: 'Este nombre de concepto ya existe.' }));
        //     toast.error("Este nombre de concepto ya existe.");
        //     return;
        // }

        setIsSubmitting(true);
        const actionText = isEditing ? "Actualizando" : "Creando";
        const toastId = toast.loading(`${actionText} concepto...`);

        try {
            const payload = { ...form };
            if (isEditing) {
                // Ensure ID is present
                if (!payload.idExpenseType) throw new Error("ID del concepto no encontrado para actualizar.");
                // Assuming updateConceptSpent takes (id, data)
                await ConceptSpentService.updateConceptSpent(payload.idExpenseType, payload);
                toast.success("Concepto actualizado exitosamente!", { id: toastId, icon: <CheckCircle className="text-success" /> });
            } else {
                // Remove potentially null idExpenseType for creation
                delete payload.idExpenseType;
                // Assuming createConceptSpent takes (data)
                await ConceptSpentService.createConceptSpent(payload);
                toast.success("Concepto creado exitosamente!", { id: toastId, icon: <CheckCircle className="text-success" /> });
            }

            toggleMainModal(); // Close modal on success
            await fetchData(false); // Refresh data without main loader

        } catch (error) {
            console.error(`Error ${actionText.toLowerCase()} concepto:`, error);
            const errorMsg = error.response?.data?.message || error.message || "Error desconocido";
            toast.error(`Error al ${actionText.toLowerCase()}: ${errorMsg}`, { id: toastId, icon: <XCircle className="text-danger" />, duration: 5000 });
            // Keep modal open on error
        } finally {
            setIsSubmitting(false);
        }
    }, [form, isEditing, validateForm, toggleMainModal, fetchData, data]); // Added 'data' dependency for duplicate check if uncommented

    // CHANGE STATUS (Request Confirmation)
    const requestChangeStatusConfirmation = useCallback((concept) => {
        if (!concept || concept.idExpenseType == null) {
            console.error("[STATUS REQ ERROR] Invalid concept data:", concept);
            return;
        }
        const { idExpenseType, status: currentStatus, name } = concept;
        const actionText = currentStatus ? "desactivar" : "activar";
        const futureStatusText = currentStatus ? "Inactivo" : "Activo";
        const confirmColor = currentStatus ? "warning" : "success";

        prepareConfirmation(executeChangeStatus, {
            title: "Confirmar Cambio de Estado",
            message: (
                <p>¿Está seguro que desea <strong>{actionText}</strong> el concepto <strong>{name || 'seleccionado'}</strong>? <br /> Su nuevo estado será: <strong>{futureStatusText}</strong>.</p>
            ),
            confirmText: `Confirmar ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`,
            confirmColor: confirmColor,
            itemDetails: { idExpenseType, currentStatus, name } // Pass necessary details
        });
    }, [prepareConfirmation]);

    // CHANGE STATUS (Execute Action)
    const executeChangeStatus = useCallback(async (details) => {
        if (!details || details.idExpenseType == null) {
            console.error("[STATUS EXEC ERROR] Missing details:", details);
            toast.error("Error interno: No se pudieron obtener los detalles.");
            toggleConfirmModal();
            return;
        }
        const { idExpenseType, currentStatus, name } = details;
        const newStatus = !currentStatus;
        const actionText = currentStatus ? "desactivar" : "activar";

        setIsConfirmActionLoading(true);
        const toastId = toast.loading(`${actionText.charAt(0).toUpperCase() + actionText.slice(1)}ndo concepto...`);

        try {
             // Assuming service exists: changeStateConceptSpent(id, newStatus)
             // OR use updateConceptSpent(id, { status: newStatus }) if that's the method
            await ConceptSpentService.changeStateConceptSpent(idExpenseType, newStatus); // <-- ADJUST SERVICE CALL IF NEEDED
            // await ConceptSpentService.updateConceptSpent(idExpenseType, { status: newStatus }); // Alternative

            toast.success(`Concepto "${name || ''}" ${actionText === 'activar' ? 'activado' : 'desactivado'}.`, { id: toastId, icon: <CheckCircle /> });
            toggleConfirmModal();
            await fetchData(false); // Refresh data

        } catch (error) {
            console.error(`Error al ${actionText} concepto:`, error);
            const errorMsg = error.response?.data?.message || error.message || "Error desconocido";
            toast.error(`Error: ${errorMsg}`, { id: toastId, icon: <XCircle className="text-danger" />, duration: 5000 });
            toggleConfirmModal();
        } finally {
            setIsConfirmActionLoading(false);
        }
    }, [toggleConfirmModal, fetchData]); // Dependencies

    // DELETE Concept (Request Confirmation) - ADD THIS FUNCTIONALITY
    const requestDeleteConfirmation = useCallback((concept) => {
        if (!concept || concept.idExpenseType == null) {
            console.error("[DELETE REQ ERROR] Invalid concept data:", concept);
            return;
        }
        // Optional: Add a check here if concept is associated with expenses, similar to proveedor check
        // const isAssociated = await ConceptSpentService.isConceptAssociated(concept.idExpenseType);
        // if (isAssociated) { /* Show error and return */ }

        prepareConfirmation(executeDelete, {
            title: "Confirmar Eliminación",
            message: (
                <>
                    <p>¿Está seguro que desea eliminar permanentemente el concepto <strong>{concept.name || 'seleccionado'}</strong>?</p>
                    <p><strong className="text-danger">Esta acción no se puede deshacer.</strong></p>
                </>
            ),
            confirmText: "Eliminar Definitivamente",
            confirmColor: "danger",
            itemDetails: { ...concept } // Pass concept details
        });
    }, [prepareConfirmation]);

    // DELETE Concept (Execute Action) - ADD THIS FUNCTIONALITY
    const executeDelete = useCallback(async (conceptToDelete) => {
        if (!conceptToDelete || conceptToDelete.idExpenseType == null) {
            console.error("[DELETE EXEC ERROR] Missing concept data:", conceptToDelete);
            toast.error("Error interno: Datos para eliminar no encontrados.");
            toggleConfirmModal();
            return;
        }

        setIsConfirmActionLoading(true);
        const toastId = toast.loading('Eliminando concepto...');

        try {
            // Assuming service exists: deleteConceptSpent(id)
            await ConceptSpentService.deleteConceptSpent(conceptToDelete.idExpenseType); // <-- ADJUST SERVICE CALL IF NEEDED

            toast.success(`Concepto "${conceptToDelete.name}" eliminado.`, { id: toastId, icon: <CheckCircle className="text-success" /> });
            toggleConfirmModal();
            await fetchData(false);

        } catch (error) {
            console.error("Error al eliminar concepto:", error);
            const errorMsg = error.response?.data?.message || error.message || "Error desconocido";
            toast.error(`Error: ${errorMsg}`, { id: toastId, icon: <XCircle className="text-danger" />, duration: 5000 });
            toggleConfirmModal();
        } finally {
            setIsConfirmActionLoading(false);
        }
    }, [toggleConfirmModal, fetchData]); // Dependencies

    // --- Modal Opening Handlers ---
    const openAddModal = useCallback(() => {
        resetForm();
        clearFormErrors();
        setIsEditing(false);
        setModalOpen(true);
    }, [resetForm, clearFormErrors]);

    const openEditModal = useCallback((item) => {
        setForm({
            idExpenseType: item.idExpenseType ?? null,
            name: item.name || '',
            description: item.description || '',
            isBimonthly: item.isBimonthly || false,
            status: item.status !== undefined ? item.status : true,
        });
        setIsEditing(true);
        clearFormErrors();
        setModalOpen(true);
    }, [clearFormErrors]);

    // --- Navigation Handlers ---
    const handleNavigateToManoDeObra = useCallback(() => navigate('/mano_de_obra'), [navigate]);
    const handleNavigateToEmployees = useCallback(() => navigate('/rendimiento-empleado'), [navigate]);

    // --- Filtering and Pagination Logic ---
    const filteredData = useMemo(() => {
         // 1. Ordenar por ID descendente (o por nombre, si prefieres)
         const sortedData = [...data].sort((a, b) => (b.idExpenseType || 0) - (a.idExpenseType || 0));
         // const sortedData = [...data].sort((a, b) => (a.name || '').localeCompare(b.name || '')); // Sort by name

        // 2. Aplicar filtro
        const lowerSearchText = tableSearchText.trim().toLowerCase();
        if (!lowerSearchText) return sortedData;

        return sortedData.filter(item =>
            item && (
                (item.name || '').toLowerCase().includes(lowerSearchText) ||
                (item.description || '').toLowerCase().includes(lowerSearchText) ||
                 String(item.idExpenseType || '').toLowerCase().includes(lowerSearchText) // Search by ID
            )
        );
    }, [data, tableSearchText]);

    const totalItems = useMemo(() => filteredData.length, [filteredData]);
    const totalPages = useMemo(() => Math.ceil(totalItems / ITEMS_PER_PAGE) || 1, [totalItems]);
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

    // --- Render ---
    return (
        <Container fluid className="p-4 main-content"> {/* Use fluid container */}
            <Toaster position="top-center" toastOptions={{ style: { maxWidth: 600 } }} />

             {/* Header and Actions */}
             <h2 className="mb-4">Administrar Conceptos de Gasto</h2>
             <Row className="mb-3 align-items-center">
                 <Col md={6} lg={4}>
                    <Input
                        bsSize="sm"
                        type="text"
                        placeholder="Buscar por nombre, descripción o ID..."
                        value={tableSearchText}
                        onChange={handleTableSearch}
                        aria-label="Buscar conceptos de gasto"
                    />
                </Col>
                 <Col md={6} lg={8} className="text-md-end mt-2 mt-md-0 d-flex justify-content-end align-items-center gap-2">
                      {/* Navigation Buttons - Styled like Proveedores */}
                     <Button color="info" outline size="sm" onClick={handleNavigateToEmployees} title="Ir a Empleados">
                         <Users size={16} className="me-1" /> Empleados
                     </Button>
                      <Button color="secondary" outline size="sm" onClick={handleNavigateToManoDeObra} title="Ir a Gastos Mensuales">
                          <ListChecks size={16} className="me-1"/> Gastos Mensuales {/* Icon changed */}
                     </Button>
                     {/* Add Button */}
                     <Button color="success" size="sm" onClick={openAddModal} className="button-add">
                        <Plus size={18} className="me-1" /> Agregar Concepto
                    </Button>
                </Col>
            </Row>

            {/* Data Table */}
            <div className="table-responsive shadow-sm custom-table-container mb-3">
                 <Table hover size="sm" className="mb-0 custom-table" aria-live="polite">
                    <thead className="table-dark">
                        <tr>
                            <th scope="col" style={{ width: '10%' }}>ID</th>
                            <th scope="col">Nombre Concepto</th>
                            <th scope="col">Descripción</th>
                            <th scope="col" style={{ width: '10%' }} className="text-center">Bimestral</th>
                            <th scope="col" style={{ width: '10%' }} className="text-center">Estado</th>
                            <th scope="col" style={{ width: '15%' }} className="text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoadingTable ? (
                            <tr><td colSpan="6" className="text-center p-5"><Spinner color="primary" /> Cargando...</td></tr>
                        ) : currentItems.length > 0 ? (
                            currentItems.map((item) => (
                                <tr key={item.idExpenseType} style={{ verticalAlign: 'middle' }}>
                                    <th scope="row">{item.idExpenseType}</th>
                                    <td>{item.name || '-'}</td>
                                    <td>{item.description || '-'}</td>
                                    <td className="text-center">{item.isBimonthly ? 'Sí' : 'No'}</td>
                                    <td className="text-center">
                                         {/* Status Button - Styled like Proveedores */}
                                        <Button
                                            outline
                                            color={item.status ? "success" : "secondary"}
                                            size="sm"
                                            className="p-1" // Small padding
                                            onClick={() => requestChangeStatusConfirmation(item)}
                                            disabled={item.idExpenseType == null || isConfirmActionLoading}
                                            title={item.status ? "Activo (Clic para inactivar)" : "Inactivo (Clic para activar)"}
                                        >
                                            {item.status ? "Activo" : "Inactivo"}
                                        </Button>
                                    </td>
                                    <td className="text-center">
                                        {/* Action Buttons - Styled like Proveedores */}
                                        <div className="d-inline-flex gap-1 action-cell-content">
                                            <Button
                                                color="warning" // Yellow for edit
                                                outline
                                                size="sm"
                                                onClick={() => openEditModal(item)}
                                                title="Editar Concepto"
                                                className="p-1"
                                                disabled={item.idExpenseType == null || isConfirmActionLoading}
                                            >
                                                <Edit size={14} /> {/* Smaller icon */}
                                            </Button>
                                            <Button
                                                color="danger" // Red for delete
                                                outline
                                                size="sm"
                                                onClick={() => requestDeleteConfirmation(item)}
                                                title="Eliminar Concepto"
                                                className="p-1"
                                                disabled={item.idExpenseType == null || isConfirmActionLoading}
                                            >
                                                <Trash2 size={14} /> {/* Smaller icon */}
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="6" className="text-center fst-italic p-4">
                                {tableSearchText ? 'No se encontraron conceptos para la búsqueda.' : 'No hay conceptos de gasto registrados.'}
                                {!isLoadingTable && data.length === 0 && !tableSearchText && (
                                    <span className="d-block mt-2">Aún no hay conceptos. <Button size="sm" color="link" onClick={openAddModal} className="p-0 align-baseline">Agregar el primero</Button></span>
                                )}
                            </td></tr>
                        )}
                    </tbody>
                </Table>
            </div>

             {/* Paginator */}
             {!isLoadingTable && totalPages > 1 && (
                <CustomPagination
                    currentPage={validCurrentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />
             )}

            {/* Add/Edit Modal - Styled like Proveedores */}
             <Modal isOpen={modalOpen} toggle={toggleMainModal} centered backdrop="static" keyboard={!isSubmitting}>
                <ModalHeader toggle={!isSubmitting ? toggleMainModal : undefined}>
                     {/* Use Settings icon or similar */}
                     <Settings size={20} className="me-2" /> {isEditing ? 'Editar Concepto de Gasto' : 'Agregar Nuevo Concepto'}
                </ModalHeader>
                <ModalBody>
                     {/* Display API errors within the modal if they occur during submit */}
                     {/* {apiError && <Alert color="danger" size="sm">{apiError}</Alert>} */}
                     <Form id="conceptForm" noValidate onSubmit={(e) => e.preventDefault()}> {/* Prevent default HTML submit */}
                        <FormGroup>
                            <Label for="name" className="form-label fw-bold">Nombre Concepto <span className="text-danger">*</span></Label>
                            <Input
                                id="name" bsSize="sm" type="text" name="name"
                                value={form.name} onChange={handleChange}
                                invalid={!!formErrors.name} required disabled={isSubmitting}
                            />
                            <FormFeedback>{formErrors.name}</FormFeedback>
                        </FormGroup>
                        <FormGroup>
                            <Label for="description" className="form-label fw-bold">Descripción <span className="text-danger">*</span></Label>
                            <Input
                                id="description" bsSize="sm" type="textarea" name="description"
                                value={form.description} onChange={handleChange} rows={3}
                                invalid={!!formErrors.description} required disabled={isSubmitting}
                            />
                            <FormFeedback>{formErrors.description}</FormFeedback>
                        </FormGroup>
                        <FormGroup check className="mb-3"> {/* Add margin bottom */}
                             <Input
                                type="checkbox"
                                name="isBimonthly"
                                id="isBimonthly" // Corrected id to match label's htmlFor
                                checked={form.isBimonthly}
                                onChange={handleChange}
                                disabled={isSubmitting}
                                className="form-check-input" // Standard class
                            />
                            <Label htmlFor="isBimonthly" check className="form-check-label"> {/* Standard class */}
                                Es Gasto Bimestral
                            </Label>
                        </FormGroup>
                    </Form>
                </ModalBody>
                <ModalFooter>
                     <Button color="secondary" outline onClick={toggleMainModal} disabled={isSubmitting}>Cancelar</Button>
                     <Button color="primary" onClick={handleSubmit} disabled={isSubmitting}>
                         {isSubmitting ?
                            <><Spinner size="sm" className="me-1"/> {isEditing ? 'Actualizando...' : 'Guardando...'}</>
                            :
                            <><Save size={16} className="me-1"/> {isEditing ? 'Guardar Cambios' : 'Agregar Concepto'}</>
                         }
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={confirmModalOpen}
                toggle={toggleConfirmModal}
                title={confirmModalProps.title}
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

export default TablaGastos;