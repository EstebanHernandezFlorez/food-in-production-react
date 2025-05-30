// src/components/TablaGastos/TablaGastos.js
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import '../../../assets/css/App.css'; // Asegúrate que la ruta es correcta
import {
    Table, Button, Container, Row, Col, Form, FormGroup, Input, Label, FormFeedback,
    Modal, ModalHeader, ModalBody, ModalFooter, Spinner, Alert,
    Dropdown, DropdownToggle, DropdownMenu, DropdownItem
} from 'reactstrap';
import {
    Edit, Trash2, Plus, AlertTriangle, CheckCircle, XCircle, Save, Users,
    ListChecks, Settings, SlidersHorizontal
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

// --- Service Import ---
// CAMBIO: Importar y usar ExpenseCategoryService
import ExpenseCategoryService from "../../services/ExpenseCategoryService";

// --- Reusable Components ---
import CustomPagination from '../../General/CustomPagination';
import { ConfirmationModal } from '../../General/ConfirmationModal';

// --- Constants ---
const INITIAL_FORM_STATE = {
    // CAMBIO: idExpenseType a idExpenseCategory
    idExpenseCategory: null,
    name: '',
    description: '',
    status: true
};
const INITIAL_FORM_ERRORS = { name: null, description: null }; // La descripción podría ser opcional
const INITIAL_CONFIRM_PROPS = { title: "", message: null, confirmText: "Confirmar", confirmColor: "primary", itemDetails: null, isOpen: false, isConfirming: false };
const ITEMS_PER_PAGE = 7;

// CAMBIO: Nombre del componente si lo deseas, ej: GestionCategoriasGasto
const TablaGastos = () => {
    // CAMBIO: data a expenseCategoriesData (o similar para claridad)
    const [expenseCategoriesData, setExpenseCategoriesData] = useState([]);
    const [form, setForm] = useState(INITIAL_FORM_STATE);
    const [isEditing, setIsEditing] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [tableSearchText, setTableSearchText] = useState('');
    const [isLoadingTable, setIsLoadingTable] = useState(true);
    const [formErrors, setFormErrors] = useState(INITIAL_FORM_ERRORS);
    const [currentPage, setCurrentPage] = useState(1);
    const [confirmModalProps, setConfirmModalProps] = useState(INITIAL_CONFIRM_PROPS);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [gastosDropdownOpen, setGastosDropdownOpen] = useState(false);

    const confirmActionRef = useRef(null);
    const navigate = useNavigate();

    const toggleGastosDropdown = () => setGastosDropdownOpen(prevState => !prevState);

    // --- Navegaciones ---
    // CAMBIO: navigateToManageExpenseCategories
    const navigateToManageExpenseCategories = useCallback(() => {
        navigate('/home/mano-de-obra/gastos'); // O la ruta que uses para este componente
    }, [navigate]);

    const navigateToMonthlyExpenses = useCallback(() => {
        navigate('/home/mano-de-obra');
    }, [navigate]);

    const navigateToEmployees = useCallback(() => {
        navigate('/home/mano-de-obra/rendimiento');
    }, [navigate]);

    const navigateToManageSpecificConcepts = useCallback(() => {
        navigate('/home/mano-de-obra/conceptos');
    }, [navigate]);

    // CAMBIO: fetchData a fetchExpenseCategories y uso de ExpenseCategoryService
    const fetchExpenseCategories = useCallback(async (showLoadingSpinner = true) => {
        if (showLoadingSpinner) setIsLoadingTable(true);
        try {
            const categories = await ExpenseCategoryService.getAllExpenseCategories();
            setExpenseCategoriesData(Array.isArray(categories) ? categories : []);
        } catch (error) {
            console.error("Error fetching expense categories data:", error);
            toast.error("Error al cargar las categorías de gasto.");
            setExpenseCategoriesData([]);
        } finally {
             if (showLoadingSpinner) setIsLoadingTable(false);
        }
    }, []);

    useEffect(() => {
        fetchExpenseCategories(); // CAMBIO
    }, [fetchExpenseCategories]); // CAMBIO

    const resetForm = useCallback(() => setForm(INITIAL_FORM_STATE), []);
    const clearFormErrors = useCallback(() => setFormErrors(INITIAL_FORM_ERRORS), []);

    const validateForm = useCallback(() => {
        const errors = { name: null, description: null };
        let isValid = true;
        if (!form.name || !form.name.trim()) {
            errors.name = 'El nombre es obligatorio.';
            isValid = false;
        }
        // if (!form.description || !form.description.trim()) { // Hacer la descripción opcional
        //     errors.description = 'La descripción es obligatoria.';
        //     isValid = false;
        // }
        setFormErrors(errors);
        return isValid;
    }, [form]);

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

    const toggleMainModal = useCallback(() => {
        const closing = modalOpen;
        setModalOpen(prev => !prev);
        if (closing) {
            resetForm();
            clearFormErrors();
            setIsEditing(false);
        }
    }, [modalOpen, resetForm, clearFormErrors]);

    const closeConfirmModal = useCallback(() => {
        if (confirmModalProps.isConfirming) return;
        setConfirmModalProps(INITIAL_CONFIRM_PROPS);
    }, [confirmModalProps.isConfirming]);

    const prepareConfirmation = useCallback((actionFn, props) => {
        confirmActionRef.current = actionFn;
        setConfirmModalProps({ ...props, isOpen: true, itemDetails: props.itemDetails });
    }, []);

    // CAMBIO: Uso de ExpenseCategoryService
    const handleSubmit = useCallback(async () => {
        if (!validateForm()) {
            toast.error("Por favor, complete los campos requeridos.", { icon: <XCircle className="text-danger" /> });
            return;
        }
        setIsSubmitting(true);
        const actionText = isEditing ? "Actualizando" : "Creando";
        const toastId = toast.loading(`${actionText} categoría de gasto...`); // CAMBIO

        try {
            const payload = { ...form };
            // El campo idExpenseCategory se maneja aquí
            if (isEditing) {
                if (!payload.idExpenseCategory) throw new Error("ID de la categoría de gasto no encontrado para actualizar."); // CAMBIO
                await ExpenseCategoryService.updateExpenseCategory(payload.idExpenseCategory, payload); // CAMBIO
                toast.success("Categoría de gasto actualizada!", { id: toastId, icon: <CheckCircle className="text-success" /> }); // CAMBIO
            } else {
                delete payload.idExpenseCategory; // El backend asigna el ID al crear
                await ExpenseCategoryService.createExpenseCategory(payload); // CAMBIO
                toast.success("Categoría de gasto creada!", { id: toastId, icon: <CheckCircle className="text-success" /> }); // CAMBIO
            }
            toggleMainModal();
            await fetchExpenseCategories(false); // CAMBIO
        } catch (error) {
            console.error(`Error ${actionText.toLowerCase()} categoría de gasto:`, error); // CAMBIO
            const errorMsg = error.message || "Error desconocido"; // El servicio ya formatea el error
            toast.error(`Error al ${actionText.toLowerCase()}: ${errorMsg}`, { id: toastId, icon: <XCircle className="text-danger" />, duration: 5000 });
        } finally {
            setIsSubmitting(false);
        }
    }, [form, isEditing, validateForm, toggleMainModal, fetchExpenseCategories]); // CAMBIO

    const executeConfirmedAction = async () => {
        if (confirmActionRef.current && confirmModalProps.itemDetails) {
            setConfirmModalProps(prev => ({ ...prev, isConfirming: true }));
            await confirmActionRef.current(confirmModalProps.itemDetails);
        } else {
            console.error("Error: Acción de confirmación o detalles del ítem no definidos.");
            toast.error("Error interno al procesar la acción.");
            closeConfirmModal();
        }
    };

    // CAMBIO: requestChangeStatusConfirmation y executeChangeStatus
    const requestChangeStatusConfirmation = useCallback((item) => {
        if (!item || item.idExpenseCategory == null) return; // CAMBIO
        const { idExpenseCategory, status: currentStatus, name } = item; // CAMBIO
        const actionText = currentStatus ? "desactivar" : "activar";
        const futureStatusText = currentStatus ? "Inactivo" : "Activo";
        const confirmColor = currentStatus ? "warning" : "success";
        prepareConfirmation(executeChangeStatus, {
            title: "Confirmar Cambio de Estado",
            message: (<p>¿Seguro que desea <strong>{actionText}</strong> la categoría de gasto <strong>{name || 'seleccionada'}</strong>?<br/>Nuevo estado: <strong>{futureStatusText}</strong>.</p>), // CAMBIO
            confirmText: `Confirmar ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`,
            confirmColor: confirmColor,
            itemDetails: { idExpenseCategory, currentStatus, name } // CAMBIO
        });
    }, [prepareConfirmation]);

    const executeChangeStatus = useCallback(async (details) => {
        if (!details || details.idExpenseCategory == null) { // CAMBIO
            toast.error("Error interno: Detalles no encontrados.");
            setConfirmModalProps(prev => ({ ...prev, isConfirming: false, isOpen: false }));
            return;
        }
        const { idExpenseCategory, currentStatus, name } = details; // CAMBIO
        const newStatus = !currentStatus;
        const actionText = currentStatus ? "desactivar" : "activar";
        const toastId = toast.loading(`${actionText.charAt(0).toUpperCase() + actionText.slice(1)}ndo categoría de gasto...`); // CAMBIO
        try {
            await ExpenseCategoryService.changeStateExpenseCategory(idExpenseCategory, newStatus); // CAMBIO
            toast.success(`Categoría de gasto "${name || ''}" ${newStatus ? 'activada' : 'desactivada'}.`, { id: toastId, icon: <CheckCircle /> }); // CAMBIO
            await fetchExpenseCategories(false); // CAMBIO
        } catch (error) {
            console.error(`Error al ${actionText} categoría de gasto:`, error); // CAMBIO
            const errorMsg = error.message || "Error desconocido";
            toast.error(`Error: ${errorMsg}`, { id: toastId, icon: <XCircle className="text-danger" />, duration: 5000 });
        } finally {
            setConfirmModalProps(INITIAL_CONFIRM_PROPS);
        }
    }, [fetchExpenseCategories]); // CAMBIO

    // CAMBIO: requestDeleteConfirmation y executeDelete
    const requestDeleteConfirmation = useCallback((item) => {
        if (!item || item.idExpenseCategory == null) return; // CAMBIO
        prepareConfirmation(executeDelete, {
            title: "Confirmar Eliminación",
            message: (<><p>¿Seguro que desea eliminar permanentemente la categoría de gasto <strong>{item.name || 'seleccionada'}</strong>?</p><p><strong className="text-danger">Esta acción no se puede deshacer.</strong></p></>), // CAMBIO
            confirmText: "Eliminar Definitivamente",
            confirmColor: "danger",
            itemDetails: { ...item }
        });
    }, [prepareConfirmation]);

    const executeDelete = useCallback(async (itemToDelete) => {
        if (!itemToDelete || itemToDelete.idExpenseCategory == null) { // CAMBIO
            toast.error("Error interno: Datos para eliminar no encontrados.");
            setConfirmModalProps(prev => ({ ...prev, isConfirming: false, isOpen: false }));
            return;
        }
        const toastId = toast.loading('Eliminando categoría de gasto...'); // CAMBIO
        try {
            await ExpenseCategoryService.deleteExpenseCategory(itemToDelete.idExpenseCategory); // CAMBIO
            toast.success(`Categoría de gasto "${itemToDelete.name}" eliminada.`, { id: toastId, icon: <CheckCircle className="text-success" /> }); // CAMBIO
            await fetchExpenseCategories(false); // CAMBIO
        } catch (error) {
            console.error("Error al eliminar categoría de gasto:", error); // CAMBIO
            const errorMsg = error.message || "Error desconocido";
            toast.error(`Error: ${errorMsg}`, { id: toastId, icon: <XCircle className="text-danger" />, duration: 5000 });
        } finally {
            setConfirmModalProps(INITIAL_CONFIRM_PROPS);
        }
    }, [fetchExpenseCategories]); // CAMBIO

    const openAddModal = useCallback(() => {
        resetForm(); clearFormErrors(); setIsEditing(false); setModalOpen(true);
    }, [resetForm, clearFormErrors]);

    const openEditModal = useCallback((item) => {
        setForm({
            // CAMBIO: idExpenseType a idExpenseCategory
            idExpenseCategory: item.idExpenseCategory ?? null,
            name: item.name || '',
            description: item.description || '',
            status: item.status !== undefined ? item.status : true,
        });
        setIsEditing(true); clearFormErrors(); setModalOpen(true);
    }, [clearFormErrors]);

    // CAMBIO: filteredData usa expenseCategoriesData
    const filteredData = useMemo(() => {
         const sortedData = [...expenseCategoriesData].sort((a, b) => (b.idExpenseCategory || 0) - (a.idExpenseCategory || 0)); // CAMBIO
        const lowerSearchText = tableSearchText.trim().toLowerCase();
        if (!lowerSearchText) return sortedData;
        return sortedData.filter(item =>
            item && (
                (item.name || '').toLowerCase().includes(lowerSearchText) ||
                (item.description || '').toLowerCase().includes(lowerSearchText) ||
                 String(item.idExpenseCategory || '').toLowerCase().includes(lowerSearchText) // CAMBIO
            )
        );
    }, [expenseCategoriesData, tableSearchText]); // CAMBIO

    const totalItems = useMemo(() => filteredData.length, [filteredData]);
    const totalPages = useMemo(() => Math.ceil(totalItems / ITEMS_PER_PAGE) || 1, [totalItems]);
    const validCurrentPage = useMemo(() => Math.max(1, Math.min(currentPage, totalPages || 1)), [currentPage, totalPages]);
    const currentItems = useMemo(() => {
        const startIndex = (validCurrentPage - 1) * ITEMS_PER_PAGE;
        return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredData, validCurrentPage]);

    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
    }, [totalPages, currentPage]);

    const handlePageChange = useCallback((pageNumber) => {
        setCurrentPage(Math.max(1, Math.min(pageNumber, totalPages || 1)));
    }, [totalPages]);

    return (
        <Container fluid className="p-4 main-content">
            <Toaster position="top-center" toastOptions={{ style: { maxWidth: 600 } }} />
             {/* CAMBIO: Título */}
             <h2 className="mb-4">Administrar Categorías de Gasto</h2>
             <Row className="mb-3 align-items-center">
                 <Col md={5} lg={4}>
                    <Input
                        bsSize="sm" type="text" placeholder="Buscar por nombre, descripción o ID..."
                        value={tableSearchText} onChange={handleTableSearch}
                        aria-label="Buscar categorías de gasto" // CAMBIO
                    />
                </Col>
                 <Col md={7} lg={8} className="text-md-end mt-2 mt-md-0 d-flex justify-content-end align-items-center gap-2">
                     <Button color="info" outline size="sm" onClick={navigateToEmployees} title="Ir a Empleados">
                         <Users size={16} className="me-1" /> Empleados
                     </Button>
                    <Dropdown isOpen={gastosDropdownOpen} toggle={toggleGastosDropdown} size="sm">
                        <DropdownToggle caret color="secondary" outline>
                            <ListChecks size={16} className="me-1" /> Configurar Gastos
                        </DropdownToggle>
                        <DropdownMenu end>
                            <DropdownItem header>Administración de Conceptos</DropdownItem>
                            {/* CAMBIO: Etiqueta y navegación */}
                            <DropdownItem onClick={navigateToManageExpenseCategories} active> {/* Marcar como activo si esta es la página */}
                                <SlidersHorizontal size={16} className="me-2 text-muted" />Gestionar Categorías
                            </DropdownItem>
                            <DropdownItem onClick={navigateToManageSpecificConcepts}>
                                <Settings size={16} className="me-2 text-muted" />Gestionar Conceptos Específicos
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                     <Button color="success" size="sm" onClick={openAddModal} className="button-add">
                        {/* CAMBIO: Texto del botón */}
                        <Plus size={18} className="me-1" /> Agregar Categoría
                    </Button>
                    <Button color="success" outline size="sm" onClick={navigateToMonthlyExpenses} title="Ir a registro mensual">
                        <ListChecks size={16} className="me-1" /> Crear Registro Mensual
                    </Button>
                </Col>
            </Row>
            <div className="table-responsive shadow-sm custom-table-container mb-3">
                 <Table hover size="sm" className="mb-0 custom-table" aria-live="polite">
                    <thead className="table-dark">
                        <tr>
                            <th scope="col" style={{ width: '10%' }}>ID</th>
                            {/* CAMBIO: Encabezado de columna */}
                            <th scope="col">Nombre Categoría Gasto</th>
                            <th scope="col">Descripción</th>
                            <th scope="col" style={{ width: '10%' }} className="text-center">Estado</th>
                            <th scope="col" style={{ width: '15%' }} className="text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoadingTable ? (
                            <tr><td colSpan="5" className="text-center p-5"><Spinner color="primary" /> Cargando...</td></tr>
                        ) : currentItems.length > 0 ? (
                            currentItems.map((item) => (
                                // CAMBIO: key usa idExpenseCategory
                                <tr key={item.idExpenseCategory} style={{ verticalAlign: 'middle' }}>
                                    <th scope="row">{item.idExpenseCategory}</th>
                                    <td>{item.name || '-'}</td>
                                    <td>{item.description || '-'}</td>
                                    <td className="text-center">
                                        <Button
                                            outline color={item.status ? "success" : "secondary"}
                                            size="sm" className="p-1"
                                            onClick={() => requestChangeStatusConfirmation(item)}
                                            // CAMBIO: idExpenseType a idExpenseCategory
                                            disabled={item.idExpenseCategory == null || confirmModalProps.isConfirming}
                                            title={item.status ? "Activo (Clic para inactivar)" : "Inactivo (Clic para activar)"}
                                        >
                                            {item.status ? "Activo" : "Inactivo"}
                                        </Button>
                                    </td>
                                    <td className="text-center">
                                        <div className="d-inline-flex gap-1 action-cell-content">
                                            {/* CAMBIO: title y disabled check */}
                                            <Button color="warning" outline size="sm" onClick={() => openEditModal(item)} title="Editar Categoría de Gasto" className="p-1" disabled={item.idExpenseCategory == null || confirmModalProps.isConfirming}>
                                                <Edit size={14} />
                                            </Button>
                                            <Button color="danger" outline size="sm" onClick={() => requestDeleteConfirmation(item)} title="Eliminar Categoría de Gasto" className="p-1" disabled={item.idExpenseCategory == null || confirmModalProps.isConfirming}>
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="5" className="text-center fst-italic p-4">
                                {/* CAMBIO: Mensajes */}
                                {tableSearchText ? 'No se encontraron categorías de gasto.' : 'No hay categorías de gasto registradas.'}
                                {!isLoadingTable && expenseCategoriesData.length === 0 && !tableSearchText && (
                                    <span className="d-block mt-2">Aún no hay categorías de gasto. <Button size="sm" color="link" onClick={openAddModal} className="p-0 align-baseline">Agregar la primera</Button></span>
                                )}
                            </td></tr>
                        )}
                    </tbody>
                </Table>
            </div>
             {!isLoadingTable && totalPages > 1 && (
                <CustomPagination currentPage={validCurrentPage} totalPages={totalPages} onPageChange={handlePageChange} />
             )}
             <Modal isOpen={modalOpen} toggle={toggleMainModal} centered backdrop="static" keyboard={!isSubmitting}>
                <ModalHeader toggle={!isSubmitting ? toggleMainModal : undefined}>
                     {/* CAMBIO: Título del modal */}
                     <Settings size={20} className="me-2" /> {isEditing ? 'Editar Categoría de Gasto' : 'Agregar Nueva Categoría de Gasto'}
                </ModalHeader>
                <ModalBody>
                    {formErrors.api && <Alert color="danger" size="sm">{formErrors.api}</Alert>}
                     <Form id="expenseCategoryForm" noValidate onSubmit={(e) => e.preventDefault()}> {/* CAMBIO: id del form */}
                        <FormGroup>
                            {/* CAMBIO: Label */}
                            <Label for="name" className="form-label fw-bold">Nombre Categoría Gasto <span className="text-danger">*</span></Label>
                            <Input id="name" bsSize="sm" type="text" name="name" value={form.name} onChange={handleChange} invalid={!!formErrors.name} required disabled={isSubmitting} />
                            <FormFeedback>{formErrors.name}</FormFeedback>
                        </FormGroup>
                        <FormGroup>
                            <Label for="description" className="form-label">Descripción</Label>
                            <Input id="description" bsSize="sm" type="textarea" name="description" value={form.description} onChange={handleChange} rows={3} invalid={!!formErrors.description} disabled={isSubmitting} />
                            <FormFeedback>{formErrors.description}</FormFeedback>
                        </FormGroup>
                        {!isEditing && (
                            <FormGroup check>
                                <Input type="checkbox" name="status" id="statusModal" checked={form.status} onChange={handleChange} disabled={isSubmitting} />
                                <Label htmlFor="statusModal" check>Activo</Label>
                            </FormGroup>
                        )}
                    </Form>
                </ModalBody>
                <ModalFooter>
                     <Button color="secondary" outline onClick={toggleMainModal} disabled={isSubmitting}>Cancelar</Button>
                     <Button color="primary" onClick={handleSubmit} disabled={isSubmitting}>
                         {isSubmitting ? <><Spinner size="sm" className="me-1"/> {isEditing ? 'Actualizando...' : 'Guardando...'}</>
                            // CAMBIO: Texto del botón
                            : <><Save size={16} className="me-1"/> {isEditing ? 'Guardar Cambios' : 'Agregar Categoría'}</>
                         }
                    </Button>
                </ModalFooter>
            </Modal>
            <ConfirmationModal
                isOpen={confirmModalProps.isOpen}
                toggle={closeConfirmModal}
                title={confirmModalProps.title}
                onConfirm={executeConfirmedAction}
                confirmText={confirmModalProps.confirmText}
                confirmColor={confirmModalProps.confirmColor}
                isConfirming={confirmModalProps.isConfirming}
            >
                {confirmModalProps.message}
            </ConfirmationModal>
        </Container>
    );
};

// CAMBIO: Nombre de exportación si renombras el componente
export default TablaGastos; // O export default GestionCategoriasGasto;