import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

// --- External Libraries ---
import 'bootstrap/dist/css/bootstrap.min.css';
import '../../../App.css'; // <-- Verifica la ruta
import '../../../index.css'; // Keep if needed
import {
    Table, Button, Container, Row, Col, Input, FormGroup, Label, FormFeedback,
    Modal, ModalHeader, ModalBody, ModalFooter, Spinner, Card, CardBody, CardHeader,
    Form, Alert // <--- AÑADIDO 'Alert' AQUÍ
} from 'reactstrap';
// Updated icons consistent with Proveedores/TablaGastos
import { Eye, Edit, Trash2, Plus, ArrowLeft, Save, Users, ListFilter, XCircle, AlertTriangle, CheckCircle, ListChecks, Settings } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// --- Internal Components ---
import { formatCurrencyCOP } from "../../../utils/formatting"; // <--- NECESARIO: Asegúrate que esta ruta y función existan
import CustomPagination from '../../General/CustomPagination'; // <--- OPCIONAL: Si quieres usarlo, verifica la ruta
import ConceptSpentSelect from './ConceptSpentSelect'; // Keep this component

// --- Services ---
import MonthlyOverallExpenseService from "../../services/gastosGeneralesService"; // Corrected import name? Verify filename.
import ConceptSpentService from "../../services/conceptoGasto"; // Corrected import name? Verify filename.

// --- Confirmation Modal Component (Import or define as in Proveedores/TablaGastos) ---
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
const ITEMS_PER_PAGE = 7; // O ajusta según prefieras
const INITIAL_FORM_STATE = {
    idExpenseType: 1, // Assuming '1' represents Mano de Obra
    dateOverallExp: dayjs().format('YYYY-MM-DD'), // Default to today
    novelty_expense: '',
    status: true,
    idConceptSpent: '',
    price: ''
};
const INITIAL_FORM_ERRORS = {
    dateOverallExp: null, novelty_expense: null, expenseItems: null, idConceptSpent: null, price: null
};
const INITIAL_CONFIRM_PROPS = {
    title: "", message: null, confirmText: "Confirmar", confirmColor: "primary", itemDetails: null
};

// --- Componente Principal: ManoDeObra (Estilo Proveedores) ---
const ManoDeObra = () => {
    // --- State ---
    const [data, setData] = useState([]);
    const [isLoadingTable, setIsLoadingTable] = useState(true);
    const [form, setForm] = useState(INITIAL_FORM_STATE);
    const [addedExpenses, setAddedExpenses] = useState([]);
    const [conceptSpents, setConceptSpents] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [tableSearchText, setTableSearchText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedManoObra, setSelectedManoObra] = useState(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedItemForDetail, setSelectedItemForDetail] = useState(null);
    const [formErrors, setFormErrors] = useState(INITIAL_FORM_ERRORS);
    const [apiError, setApiError] = useState(null); // For general API errors during save/update
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [confirmModalProps, setConfirmModalProps] = useState(INITIAL_CONFIRM_PROPS);
    const [isConfirmActionLoading, setIsConfirmActionLoading] = useState(false);

    // --- Refs ---
    const confirmActionRef = useRef(null);

    // --- Hooks ---
    const navigate = useNavigate();

    // --- Data Fetching ---
    const fetchData = useCallback(async (showLoadingSpinner = true) => {
        if (showLoadingSpinner) setIsLoadingTable(true);
        try {
            const expenses = await MonthlyOverallExpenseService.getAllMonthlyOverallExpenses();
            setData(Array.isArray(expenses) ? expenses : []);
        } catch (error) {
            console.error("Error fetching monthly expense data:", error);
            toast.error(`Error al cargar los gastos mensuales.`);
            setData([]);
        } finally {
            if (showLoadingSpinner) setIsLoadingTable(false);
        }
    }, []);

    const fetchConceptSpents = useCallback(async () => {
        try {
            const conceptSpentsData = await ConceptSpentService.getAllConceptSpents();
            setConceptSpents(Array.isArray(conceptSpentsData) ? conceptSpentsData : []);
        } catch (error) {
            console.error("Error fetching concept spents:", error);
            toast.error(`Error al cargar los conceptos.`);
            setConceptSpents([]);
        }
    }, []);

    useEffect(() => {
        fetchData();
        fetchConceptSpents();
    }, [fetchData, fetchConceptSpents]);

    // --- Utility Functions ---
    const resetFormState = useCallback(() => {
        setForm(INITIAL_FORM_STATE);
        setAddedExpenses([]);
        setFormErrors(INITIAL_FORM_ERRORS);
        setApiError(null);
        setIsSubmitting(false); // Asegura resetear submitting
    }, []);

    // --- Event Handlers ---
    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setForm(prevForm => ({ ...prevForm, [name]: value }));
        if (formErrors[name]) {
            setFormErrors(prevErrors => ({ ...prevErrors, [name]: null }));
        }
        if (apiError) setApiError(null);
        if (name === 'idConceptSpent' || name === 'price') {
            setFormErrors(prevErrors => ({ ...prevErrors, idConceptSpent: null, price: null }));
        }
        if (formErrors.expenseItems) {
             setFormErrors(prevErrors => ({ ...prevErrors, expenseItems: null }));
        }
    }, [formErrors, apiError]);

    const addExpenseToTable = useCallback(() => {
        const { idConceptSpent, price } = form;
        let itemValid = true;
        const newErrors = { ...formErrors };

        if (!idConceptSpent) {
            newErrors.idConceptSpent = 'Seleccione un concepto'; itemValid = false;
        }
        const parsedPrice = parseFloat(price);
        if (!price || isNaN(parsedPrice) || parsedPrice <= 0) {
            newErrors.price = 'Precio inválido (> 0)'; itemValid = false;
        }

        if (!itemValid) {
            setFormErrors(newErrors);
            toast.error("Verifique concepto y precio.", { icon: <AlertTriangle className="text-warning" /> });
            return;
        }

        const parsedIdConceptSpent = parseInt(idConceptSpent, 10);
        if (isNaN(parsedIdConceptSpent)) {
             setFormErrors(prev => ({ ...prev, idConceptSpent: 'Concepto inválido'}));
             toast.error("Concepto seleccionado no válido."); return;
        }

        const concept = conceptSpents.find(c => c.idExpenseType === parsedIdConceptSpent);
        if (concept) {
            setAddedExpenses(prevExpenses => [
                ...prevExpenses, {
                    idConceptSpent: parsedIdConceptSpent,
                    conceptName: concept.name || concept.nombreConcepto || 'Nombre Desconocido', // AJUSTA SI ES NECESARIO
                    price: parsedPrice,
                }
            ]);
            setForm(prevForm => ({ ...prevForm, idConceptSpent: '', price: '' }));
            setFormErrors(prevErrors => ({ ...prevErrors, idConceptSpent: null, price: null, expenseItems: null }));
        } else {
             setFormErrors(prev => ({ ...prev, idConceptSpent: 'Concepto no encontrado'}));
             toast.error("Concepto no encontrado.");
        }
    }, [form.idConceptSpent, form.price, conceptSpents, addedExpenses, formErrors]);

    const removeExpenseFromTable = useCallback((indexToRemove) => {
        setAddedExpenses(prevExpenses => prevExpenses.filter((_, i) => i !== indexToRemove));
        if (addedExpenses.length === 1 && formErrors.expenseItems) {
             setFormErrors(prevErrors => ({ ...prevErrors, expenseItems: null }));
        }
    }, [addedExpenses.length, formErrors.expenseItems]);

    // --- Main Form (Creation) Validation & Submission ---
    const validateCreationForm = useCallback(() => {
        let isValid = true;
        const newErrors = { ...INITIAL_FORM_ERRORS, idConceptSpent: formErrors.idConceptSpent, price: formErrors.price }; // Start fresh but keep item input errors

        if (!form.dateOverallExp || !dayjs(form.dateOverallExp, 'YYYY-MM-DD', true).isValid()) {
            newErrors.dateOverallExp = 'Fecha inválida o faltante'; isValid = false;
        } else if (dayjs(form.dateOverallExp).isAfter(dayjs(), 'day')) {
             newErrors.dateOverallExp = 'La fecha no puede ser futura.'; isValid = false;
        }
        if (!form.novelty_expense || !form.novelty_expense.trim()) {
             newErrors.novelty_expense = 'La novedad es obligatoria'; isValid = false;
        }
        if (addedExpenses.length === 0) {
            newErrors.expenseItems = 'Debe agregar al menos un concepto'; isValid = false;
        }

        setFormErrors(newErrors);
        return isValid;
    }, [form.dateOverallExp, form.novelty_expense, addedExpenses, formErrors.idConceptSpent, formErrors.price]);

    const handleCreateSubmit = useCallback(async () => {
        if (!validateCreationForm()) {
            toast.error("Corrija los errores del formulario.", { icon: <XCircle className="text-danger" /> });
            return;
        }
        setIsSubmitting(true); setApiError(null);
        const toastId = toast.loading('Guardando registro...');

        const totalValueExpense = addedExpenses.reduce((sum, item) => sum + Number(item.price || 0), 0);
        const payload = {
            idExpenseType: form.idExpenseType, dateOverallExp: form.dateOverallExp,
            novelty_expense: form.novelty_expense, status: form.status,
            valueExpense: totalValueExpense,
            expenseItems: addedExpenses.map(item => ({
                idConceptSpent: item.idConceptSpent, price: item.price
            }))
        };

        try {
            await MonthlyOverallExpenseService.createMonthlyOverallExpense(payload);
            toast.success("Registro creado exitosamente.", { id: toastId, icon: <CheckCircle className="text-success" /> });
            setShowForm(false); resetFormState(); await fetchData(false);
        } catch (error) {
            console.error("Error al crear gasto mensual:", error);
            const errorMessage = error.response?.data?.message || error.message || "Error al guardar.";
            setApiError(errorMessage);
            toast.error(`Error: ${errorMessage}`, { id: toastId, icon: <XCircle className="text-danger" />, duration: 5000 });
        } finally {
            setIsSubmitting(false);
        }
    }, [form, addedExpenses, validateCreationForm, resetFormState, fetchData]);

    // --- Edit Modal Logic ---
    const openEditModal = useCallback((item) => {
        setSelectedManoObra(item);
        setForm({ // Populate only editable fields
            ...INITIAL_FORM_STATE, // Start fresh to avoid carrying over item fields
            idExpenseType: item.idExpenseType || 1, // Keep type ID
            dateOverallExp: item.dateOverallExp ? dayjs(item.dateOverallExp).format('YYYY-MM-DD') : '',
            novelty_expense: item.novelty_expense || '',
            status: item.status !== undefined ? item.status : true, // Keep status
        });
        setFormErrors(INITIAL_FORM_ERRORS); // Reset errors
        setAddedExpenses([]); // Ensure no items carry over
        setApiError(null);
        setEditModalOpen(true);
    }, []); // No dependencies needed if only using 'item'

    const closeEditModal = useCallback(() => {
        setEditModalOpen(false);
        setSelectedManoObra(null);
        resetFormState(); // Reset form fully on close
    }, [resetFormState]);

    const validateEditForm = useCallback(() => {
         let isValid = true;
         const newErrors = { dateOverallExp: null, novelty_expense: null };
         if (!form.dateOverallExp || !dayjs(form.dateOverallExp, 'YYYY-MM-DD', true).isValid()) {
             newErrors.dateOverallExp = 'Fecha inválida o faltante'; isValid = false;
         } else if (dayjs(form.dateOverallExp).isAfter(dayjs(), 'day')) {
             newErrors.dateOverallExp = 'La fecha no puede ser futura.'; isValid = false;
         }
         if (!form.novelty_expense || !form.novelty_expense.trim()) {
              newErrors.novelty_expense = 'La novedad es obligatoria'; isValid = false;
         }
         setFormErrors(prev => ({...INITIAL_FORM_ERRORS, ...newErrors})); // Reset others, set these
         return isValid;
    }, [form.dateOverallExp, form.novelty_expense]);

    const handleEditSubmit = useCallback(async () => {
        if (!selectedManoObra || !validateEditForm()) {
            toast.error("Corrija los errores del formulario.", { icon: <XCircle className="text-danger"/> });
            return;
        }
        setIsSubmitting(true); setApiError(null);
        const toastId = toast.loading('Actualizando registro...');

        const payload = { // Only send updated fields
            dateOverallExp: form.dateOverallExp, novelty_expense: form.novelty_expense,
            // status: form.status, // Include if status can be changed here
        };

        try {
            await MonthlyOverallExpenseService.updateMonthlyOverallExpense(selectedManoObra.idOverallMonth, payload);
            toast.success("Registro actualizado.", { id: toastId, icon: <CheckCircle className="text-success"/> });
            closeEditModal(); await fetchData(false);
        } catch (error) {
            console.error("Error updating expense:", error);
            const errorMessage = error.response?.data?.message || error.message || "Error al actualizar.";
            setApiError(errorMessage); // Show error inside modal
            toast.error(`Error: ${errorMessage}`, { id: toastId, icon: <XCircle className="text-danger"/>, duration: 5000 });
        } finally {
            setIsSubmitting(false);
        }
    }, [selectedManoObra, form.dateOverallExp, form.novelty_expense, validateEditForm, closeEditModal, fetchData]);

    // --- Other Actions ---

    // Confirmation Modal Logic
    const toggleConfirmModal = useCallback(() => {
        if (isConfirmActionLoading) return;
        setConfirmModalOpen(prev => !prev);
    }, [isConfirmActionLoading]);

    useEffect(() => {
        if (!confirmModalOpen && !isConfirmActionLoading) {
            setConfirmModalProps(INITIAL_CONFIRM_PROPS);
            confirmActionRef.current = null;
        }
    }, [confirmModalOpen, isConfirmActionLoading]);

    const prepareConfirmation = useCallback((actionFn, props) => {
        const detailsToPass = props.itemDetails;
        confirmActionRef.current = () => {
             if (actionFn) actionFn(detailsToPass);
             else { console.error("Confirm actionFn is null."); toggleConfirmModal(); }
        };
        setConfirmModalProps(props);
        setConfirmModalOpen(true);
    }, [toggleConfirmModal]);


    // CHANGE STATUS (Request Confirmation)
    const requestChangeStatusConfirmation = useCallback((item) => {
         if (!item || item.idOverallMonth == null) { console.error("Invalid item for status change:", item); return; }
         const { idOverallMonth, status: currentStatus } = item;
         const actionText = currentStatus ? "desactivar" : "activar";
         const futureStatusText = currentStatus ? "Inactivo" : "Activo";
         const confirmColor = currentStatus ? "warning" : "success";

        prepareConfirmation(executeChangeStatus, {
            title: "Confirmar Cambio de Estado",
            message: (
                <p>¿Está seguro que desea <strong>{actionText}</strong> el registro mensual con ID <strong>#{idOverallMonth}</strong>? <br /> Su nuevo estado será: <strong>{futureStatusText}</strong>.</p>
            ),
            confirmText: `Confirmar ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`,
            confirmColor: confirmColor,
            itemDetails: { idOverallMonth, currentStatus } // Pass necessary details
        });
    }, [prepareConfirmation]);

    // CHANGE STATUS (Execute Action)
    const executeChangeStatus = useCallback(async (details) => {
        if (!details || details.idOverallMonth == null) {
             console.error("Missing details for status change execution:", details);
             toast.error("Error interno al cambiar estado."); toggleConfirmModal(); return;
        }
        const { idOverallMonth, currentStatus } = details;
        const newStatus = !currentStatus;
        const actionText = currentStatus ? "desactivar" : "activar";

        setIsConfirmActionLoading(true);
        const toastId = toast.loading(`${actionText.charAt(0).toUpperCase() + actionText.slice(1)}ndo registro...`);

        // Optimistic UI Update (Optional but good UX)
        const originalData = [...data];
        setData(prevData => prevData.map(item =>
            item.idOverallMonth === idOverallMonth ? { ...item, status: newStatus } : item
        ));

        try {
            // Assuming service: changeStateMonthlyOverallExpense(id, newStatus)
            await MonthlyOverallExpenseService.changeStateMonthlyOverallExpense(idOverallMonth, newStatus);
            toast.success(`Estado actualizado a ${newStatus ? 'Activo' : 'Inactivo'}.`, { id: toastId, icon: <CheckCircle /> });
            toggleConfirmModal();
            // No need to fetchData if optimistic update worked and API succeeded
            // await fetchData(false);
        } catch (error) {
            console.error("Error updating expense status:", error);
            toast.error(`Error al cambiar estado: ${error.message || 'Error desconocido'}`, { id: toastId, icon: <XCircle className="text-danger"/> });
            setData(originalData); // Rollback UI on error
            toggleConfirmModal();
        } finally {
            setIsConfirmActionLoading(false);
        }
    }, [data, toggleConfirmModal, fetchData]); // fetchData needed only if not using optimistic update


    // --- Table Search & Pagination Handlers ---
    const handleTableSearch = useCallback((e) => {
        setTableSearchText(e.target.value);
        setCurrentPage(1);
    }, []);

    const handlePageChange = useCallback((pageNumber) => {
        setCurrentPage(pageNumber);
    }, []);

    // --- Navigation Handlers ---
    const handleNavigateToOtherExpenses = useCallback(() => {
        // Antes (Incorrecto): navigate('/tabla-gastos');
        // Después (Correcto):
        navigate('/home/tabla-gastos');
    }, [navigate]); // Navigates to Conceptos Gasto list7
    const handleNavigateToEmployees = useCallback(() => navigate('/home/rendimiento-empleado'), [navigate]);

    // --- Detail Modal Handlers ---
    const openDetailModal = useCallback((item) => {
        setSelectedItemForDetail(item);
        setDetailModalOpen(true);
    }, []);
    const closeDetailModal = useCallback(() => setDetailModalOpen(false), []);

    // --- Filtering and Pagination Logic ---
    const filteredData = useMemo(() => {
        if (!Array.isArray(data)) return [];
        const sortedData = [...data].sort((a, b) => (b.idOverallMonth || 0) - (a.idOverallMonth || 0));
        const lowerSearchText = tableSearchText.trim().toLowerCase();
        if (!lowerSearchText) return sortedData;
        return sortedData.filter(item =>
            item && (
                String(item.idOverallMonth || '').toLowerCase().includes(lowerSearchText) ||
                (item.dateOverallExp && dayjs(item.dateOverallExp).format('DD/MM/YYYY').includes(lowerSearchText)) ||
                String(item.valueExpense ?? '').toLowerCase().includes(lowerSearchText) ||
                (item.novelty_expense || '').toLowerCase().includes(lowerSearchText)
            )
        );
    }, [data, tableSearchText]);

    const totalItems = useMemo(() => filteredData.length, [filteredData]);
    const totalPages = useMemo(() => Math.ceil(totalItems / ITEMS_PER_PAGE) || 1, [totalItems]);
    const validCurrentPage = useMemo(() => Math.max(1, Math.min(currentPage, totalPages || 1)), [currentPage, totalPages]);

    const currentItems = useMemo(() => {
        const startIndex = (validCurrentPage - 1) * ITEMS_PER_PAGE;
        return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredData, validCurrentPage]);

    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        }
    }, [totalPages, currentPage]);

    // --- Totals Calculation ---
    const totalExpensesInForm = useMemo(() => {
        return addedExpenses.reduce((sum, item) => sum + Number(item.price || 0), 0);
    }, [addedExpenses]);

    // --- Render ---
    return (
        <Container fluid className="p-4 main-content">
            <Toaster position="top-center" toastOptions={{ style: { maxWidth: 600 } }} />
            {!showForm ? ( // ========== Display Table View ==========
                <>
                    <h2 className="mb-4">Gestión de Gastos Mensuales (Mano de Obra)</h2>
                    {/* Search and Action Buttons Row - Styled like Proveedores */}
                    <Row className="mb-3 align-items-center">
                        <Col md={6} lg={4}>
                            <Input
                                bsSize="sm" type="text" placeholder="Buscar por ID, Fecha, Novedad..."
                                value={tableSearchText} onChange={handleTableSearch}
                                aria-label="Buscar gastos mensuales"
                            />
                        </Col>
                        <Col md={6} lg={8} className="text-md-end mt-2 mt-md-0 d-flex justify-content-end align-items-center gap-2">
                            {/* Navigation Buttons */}
                            <Button color="info" outline size="sm" onClick={handleNavigateToEmployees} title="Ir a Empleados">
                                <Users size={16} className="me-1" /> Empleados
                            </Button>
                            <Button color="secondary" outline size="sm" onClick={handleNavigateToOtherExpenses} title="Ir a Conceptos de Gasto">
                                <Settings size={16} className="me-1"/> Conceptos Gasto {/* Icon changed */}
                            </Button>
                            {/* Create Button */}
                            <Button color="success" size="sm" onClick={() => { resetFormState(); setShowForm(true); }} className="button-add">
                                <Plus size={18} className="me-1" /> Crear Registro Mensual
                            </Button>
                        </Col>
                    </Row>

                    {/* Data Table - Styled like Proveedores */}
                    <div className="table-responsive shadow-sm custom-table-container mb-3">
                        <Table hover size="sm" className="mb-0 custom-table" aria-live="polite">
                            <thead className="table-dark">
                                <tr>
                                    <th scope="col" style={{ width: '10%' }}>ID</th>
                                    <th scope="col" style={{ width: '15%' }}>Fecha</th>
                                    <th scope="col" style={{ width: '20%' }} className="text-end">Monto Total</th>
                                    <th scope="col">Novedades</th>
                                    <th scope="col" style={{ width: '10%' }} className="text-center">Estado</th>
                                    <th scope="col" style={{ width: '15%' }} className="text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoadingTable ? (
                                    <tr><td colSpan="6" className="text-center p-5"><Spinner color="primary" /> Cargando...</td></tr>
                                ) : currentItems.length > 0 ? (
                                    currentItems.map((item) => (
                                        <tr key={item.idOverallMonth} style={{ verticalAlign: 'middle' }}>
                                            <th scope="row">{item.idOverallMonth}</th>
                                            <td>{item.dateOverallExp ? dayjs(item.dateOverallExp).format('DD/MM/YYYY') : '-'}</td>
                                            <td className="text-end">{formatCurrencyCOP(item.valueExpense)}</td>
                                            <td>{item.novelty_expense || '-'}</td>
                                            <td className="text-center">
                                                <Button
                                                    outline color={item.status ? "success" : "secondary"} size="sm" className="p-1"
                                                    onClick={() => requestChangeStatusConfirmation(item)} // Use confirmation
                                                    disabled={item.idOverallMonth == null || isConfirmActionLoading}
                                                    title={item.status ? "Activo (Clic para inactivar)" : "Inactivo (Clic para activar)"}
                                                >
                                                    {item.status ? "Activo" : "Inactivo"}
                                                </Button>
                                            </td>
                                            <td className="text-center">
                                                <div className="d-inline-flex gap-1 action-cell-content">
                                                    <Button color="warning" outline size="sm" onClick={() => openEditModal(item)} title="Editar Cabecera" className="p-1" disabled={isConfirmActionLoading}> <Edit size={14} /> </Button>
                                                    <Button color="info" outline size="sm" onClick={() => openDetailModal(item)} title="Ver Detalles" className="p-1" disabled={isConfirmActionLoading}> <Eye size={14} /> </Button>
                                                    {/* Elimina la línea 520 original y reemplázala con esta si quieres comentar TODO el botón de eliminar: */}
{/* <Button color="danger" outline size="sm" onClick={() => requestDeleteConfirmation(item)} title="Eliminar Registro" className="p-1" disabled={isConfirmActionLoading}> <Trash2 size={14} /> </Button> */}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="6" className="text-center fst-italic p-4">
                                        {tableSearchText ? 'No se encontraron resultados.' : 'No hay registros.'}
                                        {!isLoadingTable && data.length === 0 && !tableSearchText && (
                                             <span className="d-block mt-2">Aún no hay registros. <Button size="sm" color="link" onClick={() => setShowForm(true)} className="p-0 align-baseline">Crear el primero</Button></span>
                                        )}
                                    </td></tr>
                                )}
                            </tbody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {!isLoadingTable && totalPages > 1 && (
                        <CustomPagination currentPage={validCurrentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                    )}
                </>
            ) : ( // ========== Display Creation Form View ==========
                <Card className="shadow-sm"> {/* Keep Card structure for complex form */}
                     <CardHeader className="bg-light">
                        <Row className="align-items-center">
                            <Col xs="auto">
                                <Button color="secondary" outline size="sm" onClick={() => { setShowForm(false); resetFormState(); }} disabled={isSubmitting}>
                                    <ArrowLeft size={18} /> Volver
                                </Button>
                            </Col>
                            <Col><h4 className="mb-0 text-center">Crear Registro Mensual</h4></Col>
                             <Col xs="auto" style={{ visibility: 'hidden' }}><Button size="sm" outline><ArrowLeft/></Button></Col> {/* Spacer */}
                        </Row>
                    </CardHeader>
                    <CardBody>
                        {apiError && <Alert color="danger" size="sm" className="py-2 px-3">{apiError}</Alert>}
                        <Form id="createMonthlyExpenseForm" noValidate onSubmit={(e) => e.preventDefault()}>

                            {/* --- Main Fields: Fecha y Novedades --- */}
                             <Row className="g-3 mb-4">
                                <Col md={6}>
                                    <FormGroup>
                                        <Label for="dateOverallExp" className="form-label fw-bold">Fecha Mes <span className="text-danger">*</span></Label>
                                        <Input id="dateOverallExp" bsSize="sm" type="date" name="dateOverallExp"
                                            value={form.dateOverallExp} onChange={handleChange} max={dayjs().format('YYYY-MM-DD')}
                                            invalid={!!formErrors.dateOverallExp} disabled={isSubmitting} required />
                                        <FormFeedback>{formErrors.dateOverallExp}</FormFeedback>
                                    </FormGroup>
                                </Col>
                                <Col md={6}>
                                    <FormGroup>
                                        <Label for="novelty_expense" className="form-label fw-bold">Novedades Mes <span className="text-danger">*</span></Label>
                                        <Input id="novelty_expense" bsSize="sm" type="textarea" name="novelty_expense"
                                            value={form.novelty_expense} onChange={handleChange} placeholder="Describa eventos..."
                                            invalid={!!formErrors.novelty_expense} disabled={isSubmitting} required rows={3} />
                                        <FormFeedback>{formErrors.novelty_expense}</FormFeedback>
                                    </FormGroup>
                                </Col>
                            </Row>
                            <hr />

                            {/* --- Add Expense Item Section --- */}
                            <h5 className="mb-3">Agregar Conceptos de Gasto</h5>
                            {formErrors.expenseItems && <Alert color="danger" size="sm" className="py-2 px-3 mb-2">{formErrors.expenseItems}</Alert>}
                            <Row className="g-3 mb-3 align-items-end">
                                <Col md={5}>
                                     <Label for="idConceptSpent" className="form-label">Concepto <span className="text-danger">*</span></Label>
                                    <ConceptSpentSelect id="idConceptSpent" value={form.idConceptSpent} onChange={handleChange}
                                        conceptSpents={conceptSpents} name="idConceptSpent" invalid={!!formErrors.idConceptSpent}
                                        disabled={isSubmitting || conceptSpents.length === 0} bsSize="sm" />
                                     <FormFeedback className={formErrors.idConceptSpent ? 'd-block' : ''}>{formErrors.idConceptSpent}</FormFeedback>
                                     {conceptSpents.length === 0 && <small className="text-warning d-block mt-1">No hay conceptos.</small>}
                                </Col>
                                <Col md={4}>
                                    <Label for="price" className="form-label">Precio (COP) <span className="text-danger">*</span></Label>
                                    <Input id="price" bsSize="sm" type="number" name="price" value={form.price} onChange={handleChange}
                                        placeholder="0.00" min="0.01" step="any" invalid={!!formErrors.price} disabled={isSubmitting} required />
                                     <FormFeedback>{formErrors.price}</FormFeedback>
                                </Col>
                                <Col md={3}>
                                    <Button color="success" outline onClick={addExpenseToTable} className="w-100" size="sm"
                                        disabled={isSubmitting || !form.idConceptSpent || !form.price} >
                                        <Plus size={16} /> Agregar
                                    </Button>
                                </Col>
                            </Row>

                            {/* --- Table of Added Expenses --- */}
                            <h6 className="mt-4">Gastos Agregados:</h6>
                            <div className="table-responsive mb-3">
                                <Table size="sm" bordered className="detail-table align-middle">
                                    <thead className="table-light"><tr><th style={{ width: '60%' }}>Concepto</th><th style={{ width: '30%' }} className="text-end">Precio</th><th style={{ width: '10%' }} className="text-center">Quitar</th></tr></thead>
                                    <tbody>
                                        {addedExpenses.length > 0 ? addedExpenses.map((item, index) => (
                                            <tr key={index}><td>{item.conceptName}</td><td className="text-end">{formatCurrencyCOP(item.price)}</td>
                                                <td className="text-center"><Button color="danger" outline size="sm" className="p-1" onClick={() => removeExpenseFromTable(index)} disabled={isSubmitting} title="Quitar"> <Trash2 size={14} /> </Button></td>
                                            </tr>))
                                        : (<tr><td colSpan="3" className="text-center text-muted fst-italic py-3">Aún no se han agregado gastos.</td></tr>)}
                                    </tbody>
                                    {addedExpenses.length > 0 && (
                                        <tfoot><tr className="table-light"><th className="text-end fw-bold">Total Agregado:</th><th className="text-end fw-bold">{formatCurrencyCOP(totalExpensesInForm)}</th><th></th></tr></tfoot>
                                    )}
                                </Table>
                            </div>
                         </Form>
                    </CardBody>
                    <CardHeader className="bg-light d-flex justify-content-end gap-2 border-top"> {/* Buttons in Footer */}
                        <Button color="secondary" outline onClick={() => { setShowForm(false); resetFormState(); }} disabled={isSubmitting}>
                            <XCircle size={18} className="me-1" /> Cancelar
                        </Button>
                        <Button color="primary" onClick={handleCreateSubmit} disabled={isSubmitting || addedExpenses.length === 0}>
                            {isSubmitting ? <><Spinner size="sm"/> Guardando...</> : <><Save size={18} className="me-1"/> Guardar Registro</>}
                        </Button>
                    </CardHeader>
                </Card>
            )}

            {/* ============ Edit Modal (Handles only Date and Novelty) ============ */}
            <Modal isOpen={editModalOpen} toggle={closeEditModal} centered backdrop="static" keyboard={!isSubmitting}>
                <ModalHeader toggle={!isSubmitting ? closeEditModal : undefined}> <Edit size={20} className="me-2" /> Editar Cabecera Registro </ModalHeader>
                <ModalBody>
                    {apiError && <Alert color="danger" size="sm">{apiError}</Alert>}
                    <Form id="editMonthlyExpenseForm" noValidate onSubmit={(e) => e.preventDefault()}>
                        <Row>
                            <Col md={12}>
                                <FormGroup>
                                    <Label for="editDateOverallExp" className="form-label">Fecha <span className="text-danger">*</span></Label>
                                    <Input id="editDateOverallExp" bsSize="sm" type="date" name="dateOverallExp" value={form.dateOverallExp} onChange={handleChange} max={dayjs().format('YYYY-MM-DD')}
                                        invalid={!!formErrors.dateOverallExp} disabled={isSubmitting} required />
                                    <FormFeedback>{formErrors.dateOverallExp}</FormFeedback>
                                </FormGroup>
                            </Col>
                            <Col md={12}>
                                <FormGroup>
                                    <Label for="editNoveltyExpense" className="form-label">Novedades <span className="text-danger">*</span></Label>
                                    <Input id="editNoveltyExpense" bsSize="sm" type="textarea" name="novelty_expense" value={form.novelty_expense} onChange={handleChange} rows={4}
                                        invalid={!!formErrors.novelty_expense} disabled={isSubmitting} required />
                                    <FormFeedback>{formErrors.novelty_expense}</FormFeedback>
                                </FormGroup>
                            </Col>
                        </Row>
                    </Form>
                     <p className="text-muted mt-3"><small>Nota: Conceptos y valor total se gestionan en la creación.</small></p>
                </ModalBody>
                <ModalFooter>
                     <Button color="secondary" outline onClick={closeEditModal} disabled={isSubmitting}>Cancelar</Button>
                     <Button color="primary" onClick={handleEditSubmit} disabled={isSubmitting}>
                         {isSubmitting ? <><Spinner size="sm"/> Actualizando...</> : <><Save size={16}/> Actualizar</>}
                     </Button>
                </ModalFooter>
            </Modal>

            {/* ============ Detail Modal ============ */}
            <Modal isOpen={detailModalOpen} toggle={closeDetailModal} centered size="lg" backdrop="static">
                <ModalHeader toggle={closeDetailModal}> <Eye size={20} className="me-2" /> Detalles Registro Mensual</ModalHeader>
                <ModalBody>
                    {selectedItemForDetail && (
                         <Table bordered striped size="sm"><tbody>
                            <tr><th style={{ width: '30%' }}>ID Registro</th><td>{selectedItemForDetail.idOverallMonth}</td></tr>
                            <tr><th>Tipo Gasto</th><td>{selectedItemForDetail.idExpenseType} (Mano de Obra)</td></tr>
                            <tr><th>Fecha</th><td>{selectedItemForDetail.dateOverallExp ? dayjs(selectedItemForDetail.dateOverallExp).format('DD [de] MMMM [de] YYYY') : '-'}</td></tr>
                            <tr><th>Valor Total</th><td>{formatCurrencyCOP(selectedItemForDetail.valueExpense)}</td></tr>
                            <tr><th>Novedades</th><td>{selectedItemForDetail.novelty_expense || <span className="text-muted fst-italic">Ninguna</span>}</td></tr>
                            <tr><th>Estado</th><td>{selectedItemForDetail.status ? 'Activo' : 'Inactivo'}</td></tr>
                            {/* Aquí iría lógica para cargar y mostrar los 'expenseItems' si fuera necesario */}
                         </tbody></Table>
                    )}
                </ModalBody>
                <ModalFooter><Button color="secondary" outline onClick={closeDetailModal}>Cerrar</Button></ModalFooter>
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

export default ManoDeObra;