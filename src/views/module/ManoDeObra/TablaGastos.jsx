import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import '../../../assets/css/App.css';
import {
    Table, Button, Container, Row, Col, Form, FormGroup, Input, Label, FormFeedback,
    Modal, ModalHeader, ModalBody, ModalFooter, Spinner, Alert,
    Dropdown, DropdownToggle, DropdownMenu, DropdownItem
} from 'reactstrap';
import {
    Edit, Trash2, Plus, AlertTriangle, Save, Users,
    ListChecks, Settings, SlidersHorizontal
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

import ExpenseCategoryService from "../../services/ExpenseCategoryService";
import CustomPagination from '../../General/CustomPagination';
import { ConfirmationModal } from '../../General/ConfirmationModal';

// --- Constantes (sin cambios) ---
const INITIAL_FORM_STATE = { idExpenseCategory: null, name: '', description: '', status: true };
const INITIAL_FORM_ERRORS = { name: null, description: null };
const INITIAL_CONFIRM_PROPS = { title: "", message: null, confirmText: "Confirmar", confirmColor: "primary", itemDetails: null, isOpen: false, isConfirming: false };
const ITEMS_PER_PAGE = 3;

const TablaGastos = () => {
    // --- State, Refs y Hooks (sin cambios) ---
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
    const navigateToManageExpenseCategories = useCallback(() => navigate('/home/mano-de-obra/gastos'), [navigate]);
    const navigateToMonthlyExpenses = useCallback(() => navigate('/home/mano-de-obra'), [navigate]);
    const navigateToEmployees = useCallback(() => navigate('/home/mano-de-obra/rendimiento'), [navigate]);
    const navigateToManageSpecificConcepts = useCallback(() => navigate('/home/mano-de-obra/conceptos'), [navigate]);
    const fetchExpenseCategories = useCallback(async (showLoadingSpinner = true) => { if (showLoadingSpinner) setIsLoadingTable(true); try { const categories = await ExpenseCategoryService.getAllExpenseCategories(); setExpenseCategoriesData(Array.isArray(categories) ? categories : []); } catch (error) { toast.error("Error al cargar las categorías de gasto."); setExpenseCategoriesData([]); } finally { if (showLoadingSpinner) setIsLoadingTable(false); } }, []);
    useEffect(() => { fetchExpenseCategories(); }, [fetchExpenseCategories]);
    const resetForm = useCallback(() => setForm(INITIAL_FORM_STATE), []);
    const clearFormErrors = useCallback(() => setFormErrors(INITIAL_FORM_ERRORS), []);
    const validateForm = useCallback(() => { const errors = { name: null, description: null }; let isValid = true; if (!form.name || !form.name.trim()) { errors.name = 'El nombre es obligatorio.'; isValid = false; } setFormErrors(errors); return isValid; }, [form]);
    const handleChange = useCallback((e) => { const { name, value, type, checked } = e.target; const inputValue = type === 'checkbox' ? checked : value; setForm(prevForm => ({ ...prevForm, [name]: inputValue })); if (formErrors[name]) { setFormErrors(prevErrors => ({ ...prevErrors, [name]: null })); } }, [formErrors]);
    const handleTableSearch = useCallback((e) => { setTableSearchText(e.target.value); setCurrentPage(1); }, []);
    const toggleMainModal = useCallback(() => { const closing = modalOpen; setModalOpen(prev => !prev); if (closing) { resetForm(); clearFormErrors(); setIsEditing(false); } }, [modalOpen, resetForm, clearFormErrors]);
    const closeConfirmModal = useCallback(() => { if (confirmModalProps.isConfirming) return; setConfirmModalProps(INITIAL_CONFIRM_PROPS); }, [confirmModalProps.isConfirming]);
    const prepareConfirmation = useCallback((actionFn, props) => { confirmActionRef.current = actionFn; setConfirmModalProps({ ...props, isOpen: true, itemDetails: props.itemDetails }); }, []);
    const handleSubmit = useCallback(async () => { if (!validateForm()) { toast.error("Por favor, complete los campos requeridos."); return; } setIsSubmitting(true); const actionText = isEditing ? "Actualizando" : "Creando"; const toastId = toast.loading(`${actionText} categoría de gasto...`); try { const payload = { ...form }; if (isEditing) { if (!payload.idExpenseCategory) throw new Error("ID de la categoría no encontrado."); await ExpenseCategoryService.updateExpenseCategory(payload.idExpenseCategory, payload); toast.success("Categoría actualizada!", { id: toastId }); } else { delete payload.idExpenseCategory; await ExpenseCategoryService.createExpenseCategory(payload); toast.success("Categoría creada!", { id: toastId }); } toggleMainModal(); await fetchExpenseCategories(false); } catch (error) { const errorMsg = error.message || "Error desconocido"; toast.error(`Error al ${actionText.toLowerCase()}: ${errorMsg}`, { id: toastId, duration: 5000 }); } finally { setIsSubmitting(false); } }, [form, isEditing, validateForm, toggleMainModal, fetchExpenseCategories]);
    const executeConfirmedAction = async () => { if (confirmActionRef.current && confirmModalProps.itemDetails) { setConfirmModalProps(prev => ({ ...prev, isConfirming: true })); await confirmActionRef.current(confirmModalProps.itemDetails); } else { toast.error("Error interno al procesar la acción."); closeConfirmModal(); } };
    const executeChangeStatus = useCallback(async (details) => { if (!details || details.idExpenseCategory == null) { toast.error("Error interno: Detalles no encontrados."); setConfirmModalProps(INITIAL_CONFIRM_PROPS); return; } const { idExpenseCategory, currentStatus, name } = details; const newStatus = !currentStatus; const actionText = currentStatus ? "desactivar" : "activar"; const toastId = toast.loading(`${actionText.charAt(0).toUpperCase() + actionText.slice(1)}ndo categoría...`); try { await ExpenseCategoryService.changeStateExpenseCategory(idExpenseCategory, newStatus); toast.success(`Categoría "${name || ''}" ${newStatus ? 'activada' : 'desactivada'}.`, { id: toastId }); await fetchExpenseCategories(false); } catch (error) { const errorMsg = error.message || "Error desconocido"; toast.error(`Error: ${errorMsg}`, { id: toastId, duration: 5000 }); } finally { setConfirmModalProps(INITIAL_CONFIRM_PROPS); } }, [fetchExpenseCategories]);
    const requestChangeStatusConfirmation = useCallback((item) => { if (!item || item.idExpenseCategory == null) return; const { idExpenseCategory, status: currentStatus, name } = item; const actionText = currentStatus ? "desactivar" : "activar"; const confirmColor = currentStatus ? "warning" : "success"; prepareConfirmation(executeChangeStatus, { title: "Confirmar Cambio de Estado", message: (<p>¿Seguro que desea <strong>{actionText}</strong> la categoría <strong>{name || 'seleccionada'}</strong>?</p>), confirmText: `Sí, ${actionText}`, confirmColor: confirmColor, itemDetails: { idExpenseCategory, currentStatus, name } }); }, [prepareConfirmation, executeChangeStatus]);
    const executeDelete = useCallback(async (itemToDelete) => { if (!itemToDelete || itemToDelete.idExpenseCategory == null) { toast.error("Error interno: Datos para eliminar no encontrados."); setConfirmModalProps(INITIAL_CONFIRM_PROPS); return; } const toastId = toast.loading('Eliminando categoría...'); try { await ExpenseCategoryService.deleteExpenseCategory(itemToDelete.idExpenseCategory); toast.success(`Categoría "${itemToDelete.name}" eliminada.`, { id: toastId }); await fetchExpenseCategories(false); } catch (error) { const errorMsg = error.message || "Error desconocido"; toast.error(`Error: ${errorMsg}`, { id: toastId, duration: 5000 }); } finally { setConfirmModalProps(INITIAL_CONFIRM_PROPS); } }, [fetchExpenseCategories]);
    const requestDeleteConfirmation = useCallback((item) => { if (!item || item.idExpenseCategory == null) return; prepareConfirmation(executeDelete, { title: "Confirmar Eliminación", message: (<><p>¿Seguro que desea eliminar permanentemente la categoría <strong>{item.name || 'seleccionada'}</strong>?</p><p><strong className="text-danger">Esta acción no se puede deshacer.</strong></p></>), confirmText: "Eliminar Definitivamente", confirmColor: "danger", itemDetails: { ...item } }); }, [prepareConfirmation, executeDelete]);
    const openAddModal = useCallback(() => { resetForm(); clearFormErrors(); setIsEditing(false); setModalOpen(true); }, [resetForm, clearFormErrors]);
    const openEditModal = useCallback((item) => { setForm({ idExpenseCategory: item.idExpenseCategory ?? null, name: item.name || '', description: item.description || '', status: item.status !== undefined ? item.status : true, }); setIsEditing(true); clearFormErrors(); setModalOpen(true); }, [clearFormErrors]);
    
    // <-- CAMBIO: Se ajusta el orden a ascendente (a - b) -->
    const filteredData = useMemo(() => {
        const sortedData = [...expenseCategoriesData].sort((a, b) => (a.idExpenseCategory || 0) - (b.idExpenseCategory || 0));
        const lowerSearchText = tableSearchText.trim().toLowerCase();
        if (!lowerSearchText) return sortedData;
        return sortedData.filter(item =>
            item && (
                (item.name || '').toLowerCase().includes(lowerSearchText) ||
                (item.description || '').toLowerCase().includes(lowerSearchText) ||
                 String(item.idExpenseCategory || '').toLowerCase().includes(lowerSearchText)
            )
        );
    }, [expenseCategoriesData, tableSearchText]);

    const totalItems = useMemo(() => filteredData.length, [filteredData]);
    const totalPages = useMemo(() => Math.ceil(totalItems / ITEMS_PER_PAGE) || 1, [totalItems]);
    const validCurrentPage = useMemo(() => Math.max(1, Math.min(currentPage, totalPages || 1)), [currentPage, totalPages]);
    const currentItems = useMemo(() => {
        const startIndex = (validCurrentPage - 1) * ITEMS_PER_PAGE;
        return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredData, validCurrentPage]);
    useEffect(() => { if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages); }, [totalPages, currentPage]);
    const handlePageChange = useCallback((pageNumber) => setCurrentPage(Math.max(1, Math.min(pageNumber, totalPages || 1))), [totalPages]);

    return (
        <Container fluid className="p-4 main-content">
            <Toaster position="top-center" toastOptions={{ style: { maxWidth: 600 } }} />
            <h2 className="mb-4">Administrar Categorías de Gasto</h2>
            <Row className="mb-3 align-items-center">
                 <Col md={5} lg={4}>
                    <Input bsSize="sm" type="text" placeholder="Buscar por nombre, descripción o ID..." value={tableSearchText} onChange={handleTableSearch} aria-label="Buscar categorías de gasto" />
                </Col>
                <Col md={7} lg={8} className="text-md-end mt-2 mt-md-0 d-flex justify-content-end align-items-center gap-2">
                    <Button color="info" outline size="sm" onClick={navigateToEmployees} title="Ir a Empleados"><Users size={16} className="me-1" /> Empleados</Button>
                    <Dropdown isOpen={gastosDropdownOpen} toggle={toggleGastosDropdown} size="sm">
                        <DropdownToggle caret color="secondary" outline><ListChecks size={16} className="me-1" /> Configurar Gastos</DropdownToggle>
                        <DropdownMenu end>
                            <DropdownItem header>Administración de Conceptos</DropdownItem>
                            <DropdownItem onClick={navigateToManageExpenseCategories} active><SlidersHorizontal size={16} className="me-2 text-muted" />Gestionar Categorías</DropdownItem>
                            <DropdownItem onClick={navigateToManageSpecificConcepts}><Settings size={16} className="me-2 text-muted" />Gestionar Conceptos Específicos</DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                    <Button color="success" size="sm" onClick={openAddModal} className="button-add"><Plus size={18} className="me-1" /> Agregar Categoría</Button>
                    <Button color="success" outline size="sm" onClick={navigateToMonthlyExpenses} title="Ir a registro mensual"><ListChecks size={16} className="me-1" /> Crear Registro Mensual</Button>
                </Col>
            </Row>

            {/* <-- CAMBIOS APLICADOS A LA TABLA DESDE AQUÍ --> */}
            <div className="table-responsive shadow-sm custom-table-container mb-3">
                 <Table hover striped size="sm" className="mb-0 custom-table align-middle">
                    <thead className="table-light">
                        <tr>
                            <th scope="col" className="text-center" style={{ width: '10%' }}>ID</th>
                            <th scope="col" style={{ width: '30%' }}>Nombre Categoría Gasto</th>
                            <th scope="col" style={{ width: '35%' }}>Descripción</th>
                            <th scope="col" className="text-center" style={{ width: '10%' }}>Estado</th>
                            <th scope="col" className="text-center" style={{ width: '15%' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoadingTable ? (
                            <tr><td colSpan="5" className="text-center p-5"><Spinner color="primary" /> Cargando...</td></tr>
                        ) : currentItems.length > 0 ? (
                            currentItems.map((item) => (
                                <tr key={item.idExpenseCategory}>
                                    <th scope="row" className="text-center">{item.idExpenseCategory}</th>
                                    <td>{item.name || '-'}</td>
                                    <td>{item.description || '-'}</td>
                                    <td className="text-center">
                                        <Button size="sm" className={`status-button ${item.status ? 'status-active' : 'status-inactive'}`} onClick={() => requestChangeStatusConfirmation(item)} disabled={item.idExpenseCategory == null || confirmModalProps.isConfirming} title={item.status ? "Activo (Click para desactivar)" : "Inactivo (Click para activar)"}>
                                            {item.status ? "Activo" : "Inactivo"}
                                        </Button>
                                    </td>
                                    <td className="text-center">
                                        <div className="d-inline-flex gap-1">
                                            <Button color="info" outline size="sm" onClick={() => openEditModal(item)} title="Editar Categoría" className="action-button" disabled={item.idExpenseCategory == null || confirmModalProps.isConfirming}><Edit size={18} /></Button>
                                            <Button color="danger" outline size="sm" onClick={() => requestDeleteConfirmation(item)} title="Eliminar Categoría" className="action-button" disabled={item.idExpenseCategory == null || confirmModalProps.isConfirming}><Trash2 size={18} /></Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="5" className="text-center fst-italic p-4">
                                {tableSearchText ? 'No se encontraron categorías de gasto.' : 'No hay categorías de gasto registradas.'}
                                {!isLoadingTable && expenseCategoriesData.length === 0 && !tableSearchText && (
                                    <span className="d-block mt-2">Aún no hay categorías. <Button size="sm" color="link" onClick={openAddModal} className="p-0 align-baseline">Agregar la primera</Button></span>
                                )}
                            </td></tr>
                        )}
                    </tbody>
                </Table>
            </div>
            {/* <-- FIN DE LOS CAMBIOS EN LA TABLA --> */}

             {!isLoadingTable && totalPages > 1 && (
                <CustomPagination currentPage={validCurrentPage} totalPages={totalPages} onPageChange={handlePageChange} />
             )}
             <Modal isOpen={modalOpen} toggle={toggleMainModal} centered backdrop="static" keyboard={!isSubmitting}>
                <ModalHeader toggle={!isSubmitting ? toggleMainModal : undefined}>
                     <Settings size={20} className="me-2" /> {isEditing ? 'Editar Categoría de Gasto' : 'Agregar Nueva Categoría de Gasto'}
                </ModalHeader>
                <ModalBody>
                    {formErrors.api && <Alert color="danger" size="sm">{formErrors.api}</Alert>}
                     <Form id="expenseCategoryForm" noValidate onSubmit={(e) => e.preventDefault()}>
                        <FormGroup>
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

export default TablaGastos;